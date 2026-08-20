from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import asyncio

from db.models import (
    init_db, get_db, SessionLocal, Transaction, TransactionScore, Case, CaseTransaction,
    AuditLog, FraudRing,
)
from ml.scorer import score_transaction, load_model
from graph.engine import FraudRingDetector
from simulator.stream import simulate_transactions
from app.config import get_settings
from collections import defaultdict

settings = get_settings()

app = FastAPI(title="FinGuard", version="1.0.0", description="AI Fraud Detection for Inclusive Finance")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ring_detector = FraudRingDetector()


@app.on_event("startup")
def startup():
    init_db()
    try:
        load_model()
        print("ML model loaded successfully.")
    except FileNotFoundError:
        print("WARNING: ML model not found. Run ml/train.py first.")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "FinGuard"}


@app.post("/api/score")
def api_score_transaction(tx: dict):
    result = score_transaction(tx)
    return result


@app.get("/api/transactions")
def get_transactions(
    skip: int = 0,
    limit: int = 50,
    risk_level: Optional[str] = None,
    tx_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).join(TransactionScore, isouter=True)
    if risk_level == "high":
        query = query.filter(TransactionScore.risk_score >= 70)
    elif risk_level == "medium":
        query = query.filter(TransactionScore.risk_score.between(40, 69))
    elif risk_level == "low":
        query = query.filter(TransactionScore.risk_score < 40)
    if tx_type:
        query = query.filter(Transaction.tx_type == tx_type)

    transactions = query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": t.id,
            "step": t.step,
            "tx_type": t.tx_type,
            "amount": t.amount,
            "name_orig": t.name_orig,
            "name_dest": t.name_dest,
            "old_balance_orig": t.old_balance_orig,
            "new_balance_orig": t.new_balance_orig,
            "old_balance_dest": t.old_balance_dest,
            "new_balance_dest": t.new_balance_dest,
            "is_fraud": t.is_fraud,
            "risk_score": t.score.risk_score if t.score else None,
            "reason_codes": t.score.reason_codes if t.score else None,
            "device_id": t.device_id,
            "ip_address": t.ip_address,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in transactions
    ]


@app.get("/api/cases")
def get_cases(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Case)
    if status:
        query = query.filter(Case.status == status)
    cases = query.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
    return [
        {
            "id": c.id,
            "case_type": c.case_type,
            "status": c.status,
            "ring_id": c.ring_id,
            "account_ids": c.account_ids,
            "risk_level": c.risk_level,
            "summary": c.summary,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in cases
    ]


@app.patch("/api/cases/{case_id}")
def update_case(case_id: int, update: dict, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    old_status = case.status
    new_status = update.get("status", old_status)
    case.status = new_status

    audit = AuditLog(
        case_id=case_id,
        action="status_change",
        old_value=old_status,
        new_value=new_status,
    )
    db.add(audit)
    db.commit()
    return {"id": case.id, "status": case.status}


@app.get("/api/rings")
def get_rings(db: Session = Depends(get_db)):
    return ring_detector.detect_rings()


@app.get("/api/rings/{ring_id}/graph")
def get_ring_graph(ring_id: int):
    return ring_detector.get_ring_graph(ring_id)


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_txns = db.query(Transaction).count()
    total_fraud = db.query(Transaction).filter(Transaction.is_fraud == 1).count()
    total_cases = db.query(Case).count()
    total_rings = db.query(FraudRing).count()

    scores = db.query(TransactionScore).all()
    avg_score = sum(s.risk_score for s in scores) / max(len(scores), 1)

    return {
        "total_transactions": total_txns,
        "total_fraud": total_fraud,
        "total_cases": total_cases,
        "total_rings": total_rings,
        "avg_risk_score": round(avg_score, 2),
        "ring_stats": ring_detector.get_stats(),
    }


@app.post("/api/consumer-alert")
def consumer_alert(tx: dict):
    result = score_transaction(tx)
    threshold = settings.CONSUMER_ALERT_THRESHOLD

    if result["risk_score"] >= threshold:
        return {
            "show_alert": True,
            "risk_score": result["risk_score"],
            "message": "Warning: This transaction looks suspicious. "
                       "Please verify the recipient and amount before confirming. "
                       "If you did not initiate this transaction, cancel immediately.",
            "reasons": [r["description"] for r in result["reason_codes"]],
        }
    return {"show_alert": False, "risk_score": result["risk_score"]}


@app.websocket("/ws/transactions")
async def websocket_transactions(websocket: WebSocket):
    await websocket.accept()
    db = SessionLocal()

    try:
        async for tx in simulate_transactions(settings.DATASET_PATH):
            result = score_transaction(tx)

            db_tx = Transaction(
                step=tx["step"],
                tx_type=tx["type"],
                amount=tx["amount"],
                name_orig=tx["nameOrig"],
                old_balance_orig=tx["oldbalanceOrg"],
                new_balance_orig=tx["newbalanceOrig"],
                name_dest=tx["nameDest"],
                old_balance_dest=tx["oldbalanceDest"],
                new_balance_dest=tx["newbalanceDest"],
                is_fraud=tx["isFraud"],
                is_flagged_fraud=tx["isFlaggedFraud"],
                device_id=tx.get("device_id"),
                ip_address=tx.get("ip_address"),
            )
            db.add(db_tx)
            db.flush()

            db_score = TransactionScore(
                transaction_id=db_tx.id,
                risk_score=result["risk_score"],
                reason_codes=result["reason_codes"],
                is_fraudulent=1 if result["is_fraudulent"] else 0,
            )
            db.add(db_score)
            db.commit()

            ring_detector.add_transaction({
                "id": db_tx.id,
                "name_orig": db_tx.name_orig,
                "name_dest": db_tx.name_dest,
                "device_id": db_tx.device_id,
                "ip_address": db_tx.ip_address,
                "risk_score": result["risk_score"],
            })

            if result["risk_score"] >= 70 or tx.get("isFraud") == 1:
                risk_level = "high" if result["risk_score"] >= 70 else "medium"
                reasons_text = "; ".join(r["description"] for r in result["reason_codes"]) if result["reason_codes"] else "Automated fraud detection"
                new_case = Case(
                    case_type=tx["type"],
                    status="new",
                    account_ids=[tx["nameOrig"], tx["nameDest"]],
                    risk_level=risk_level,
                    summary=f"{tx['type']} of ${tx['amount']:,.2f} from {tx['nameOrig']} to {tx['nameDest']}. Risk: {result['risk_score']}/100. {reasons_text}",
                )
                db.add(new_case)
                db.flush()
                db.add(CaseTransaction(case_id=new_case.id, transaction_id=db_tx.id))
                db.commit()

            rings = ring_detector.detect_rings()
            for ring in rings:
                existing = db.query(FraudRing).filter(
                    FraudRing.ring_id == ring["ring_id"]
                ).first()
                if not existing:
                    db_ring = FraudRing(
                        ring_id=ring["ring_id"],
                        account_ids=ring["account_ids"],
                        shared_devices=ring["shared_devices"],
                        shared_ips=ring["shared_ips"],
                        risk_level=ring["risk_level"],
                    )
                    db.add(db_ring)
                    db.commit()

            ws_payload = {
                "transaction": {
                    "id": db_tx.id,
                    "tx_type": db_tx.tx_type,
                    "amount": db_tx.amount,
                    "name_orig": db_tx.name_orig,
                    "name_dest": db_tx.name_dest,
                    "risk_score": result["risk_score"],
                    "reason_codes": result["reason_codes"],
                    "is_fraud": db_tx.is_fraud,
                    "device_id": db_tx.device_id,
                    "ip_address": db_tx.ip_address,
                    "created_at": db_tx.created_at.isoformat() if db_tx.created_at else None,
                },
                "rings": rings,
            }
            await websocket.send_json(ws_payload)

    except WebSocketDisconnect:
        print("WebSocket client disconnected.")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        db.close()

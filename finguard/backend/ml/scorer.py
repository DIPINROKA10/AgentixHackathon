import os
import json
import pickle
import xgboost as xgb
import shap
import numpy as np
import pandas as pd
from typing import List, Dict, Any

from app.config import get_settings
from ml.features import encode_features, FEATURE_COLS, TYPE_DUMMIES

settings = get_settings()

ALL_FEATURES = FEATURE_COLS + TYPE_DUMMIES + [
    "balance_diff_orig", "balance_diff_dest",
    "amount_to_balance_ratio", "is_zero_balance_orig", "is_zero_balance_dest",
]

REASON_TEMPLATES = {
    "amount": "Unusually high transaction amount",
    "old_balance_orig": "Sender had low balance before transaction",
    "new_balance_orig": "Sender balance dropped significantly",
    "old_balance_dest": "Receiver had no prior balance history",
    "new_balance_dest": "Receiver balance changed unusually",
    "step": "Transaction occurred at unusual time step",
    "tx_type_CASH_OUT": "Cash-out transactions carry higher fraud risk",
    "tx_type_TRANSFER": "Transfers are commonly used in fraud",
    "tx_type_DEBIT": "Debit transaction flagged as suspicious",
    "tx_type_PAYMENT": "Payment pattern matches known fraud behavior",
    "tx_type_CASH_IN": "Cash-in pattern is atypical",
    "balance_diff_orig": "Large balance discrepancy on sender side",
    "balance_diff_dest": "Large balance discrepancy on receiver side",
    "amount_to_balance_ratio": "Transaction amount disproportionate to account balance",
    "is_zero_balance_orig": "Sender account had zero balance before transaction",
    "is_zero_balance_dest": "Receiver account had zero balance history",
}

_model = None
_explainer = None
_background = None


def load_model():
    global _model, _explainer, _background

    model_path = os.path.join(os.path.dirname(__file__), "models", "xgboost_fraud.json")
    bg_path = os.path.join(os.path.dirname(__file__), "models", "shap_background.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model not found at {model_path}. Run ml/train.py first.")

    _model = xgb.XGBClassifier()
    _model.load_model(model_path)

    with open(bg_path, "rb") as f:
        _background = pickle.load(f)

    if isinstance(_background, pd.DataFrame):
        _background = _background.astype(float).values
    elif isinstance(_background, np.ndarray):
        _background = _background.astype(float)

    _explainer = shap.TreeExplainer(_model, _background)
    print("Model and SHAP explainer loaded successfully.")


def score_transaction(tx: Dict[str, Any]) -> Dict[str, Any]:
    global _model, _explainer

    if _model is None:
        load_model()

    df = pd.DataFrame([tx])

    if "tx_type" not in df.columns and "type" in df.columns:
        df = df.rename(columns={"type": "tx_type"})
    if "nameOrig" in df.columns:
        df = df.rename(columns={
            "nameOrig": "name_orig", "nameDest": "name_dest",
            "oldbalanceOrg": "old_balance_orig", "newbalanceOrig": "new_balance_orig",
            "oldbalanceDest": "old_balance_dest", "newbalanceDest": "new_balance_dest",
            "isFraud": "is_fraud", "isFlaggedFraud": "is_flagged_fraud",
        })

    for col in ["old_balance_orig", "new_balance_orig", "old_balance_dest", "new_balance_dest"]:
        if col not in df.columns:
            df[col] = 0.0
    if "step" not in df.columns:
        df["step"] = 1

    X = encode_features(df)
    X = X.reindex(columns=ALL_FEATURES, fill_value=0)

    prob = _model.predict_proba(X)[0][1]
    risk_score = int(min(prob * 100, 100))

    shap_values = _explainer.shap_values(X)
    if isinstance(shap_values, list):
        shap_vals = shap_values[1][0]
    else:
        shap_vals = shap_values[0]

    feature_impacts = list(zip(ALL_FEATURES, shap_vals))
    feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)

    reason_codes = []
    for feat, impact in feature_impacts[:3]:
        template = REASON_TEMPLATES.get(feat, f"Feature '{feat}' contributed to risk")
        reason_codes.append({
            "feature": feat,
            "impact": round(float(impact), 4),
            "description": template,
        })

    return {
        "risk_score": risk_score,
        "fraud_probability": round(float(prob), 4),
        "is_fraudulent": risk_score >= settings.FRAUD_SCORE_THRESHOLD,
        "reason_codes": reason_codes,
    }

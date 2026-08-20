import asyncio
import json
import random
import time
from typing import AsyncGenerator, Dict, Any

import pandas as pd

from app.config import get_settings

settings = get_settings()


def load_dataset(csv_path: str, limit: int = 10000) -> pd.DataFrame:
    df = pd.read_csv(csv_path, nrows=limit)
    df.columns = [c.strip() for c in df.columns]
    return df


def synthesize_device_ip(df: pd.DataFrame) -> pd.DataFrame:
    import hashlib

    def _hash_device(name):
        h = hashlib.md5(str(name).encode()).hexdigest()
        return f"DEV-{h[:8].upper()}"

    def _hash_ip(name):
        h = hashlib.sha256(str(name).encode()).hexdigest()
        return f"10.{int(h[0:2], 16) % 255}.{int(h[2:4], 16) % 255}.{int(h[4:6], 16) % 255}"

    df["device_id"] = df["nameOrig"].apply(_hash_device)
    df["ip_address"] = df["nameOrig"].apply(_hash_ip)

    fraud_origins = df[df["isFraud"] == 1]["nameOrig"].unique()
    if len(fraud_origins) > 10:
        ring_device = f"RING-DEV-{random.randint(1000, 9999)}"
        ring_ip = f"192.168.1.{random.randint(1, 254)}"
        ring_accounts = fraud_origins[:min(6, len(fraud_origins))]
        for acc in ring_accounts:
            df.loc[df["nameOrig"] == acc, "device_id"] = ring_device
            df.loc[df["nameOrig"] == acc, "ip_address"] = ring_ip

    return df


async def simulate_transactions(
    csv_path: str,
    speed: float = None,
    limit: int = None,
) -> AsyncGenerator[Dict[str, Any], None]:
    if speed is None:
        speed = settings.SIMULATION_SPEED

    df = load_dataset(csv_path, limit=limit or 10000)
    df = synthesize_device_ip(df)

    tx_id = 0
    for _, row in df.iterrows():
        tx_id += 1
        transaction = {
            "id": tx_id,
            "step": int(row.get("step", 1)),
            "type": row.get("type", "PAYMENT"),
            "amount": float(row.get("amount", 0)),
            "nameOrig": row.get("nameOrig", ""),
            "oldbalanceOrg": float(row.get("oldbalanceOrg", 0)),
            "newbalanceOrig": float(row.get("newbalanceOrig", 0)),
            "nameDest": row.get("nameDest", ""),
            "oldbalanceDest": float(row.get("oldbalanceDest", 0)),
            "newbalanceDest": float(row.get("newbalanceDest", 0)),
            "isFraud": int(row.get("isFraud", 0)),
            "isFlaggedFraud": int(row.get("isFlaggedFraud", 0)),
            "device_id": row.get("device_id", ""),
            "ip_address": row.get("ip_address", ""),
            "timestamp": time.time(),
        }
        yield transaction
        await asyncio.sleep(speed)

import pandas as pd
import numpy as np
import hashlib
import random


def _hash_to_device(name: str) -> str:
    h = hashlib.md5(name.encode()).hexdigest()
    return f"DEV-{h[:8].upper()}"


def _hash_to_ip(name: str) -> str:
    h = hashlib.sha256(name.encode()).hexdigest()
    return f"10.{int(h[0:2], 16) % 255}.{int(h[2:4], 16) % 255}.{int(h[4:6], 16) % 255}"


def prepare_dataset(csv_path: str, sample_size: int = 50000) -> pd.DataFrame:
    df = pd.read_csv(csv_path)
    df.columns = [c.strip() for c in df.columns]

    df = df.rename(columns={
        "type": "tx_type",
        "nameOrig": "name_orig",
        "oldbalanceOrg": "old_balance_orig",
        "newbalanceOrig": "new_balance_orig",
        "nameDest": "name_dest",
        "oldbalanceDest": "old_balance_dest",
        "newbalanceDest": "new_balance_dest",
        "isFraud": "is_fraud",
        "isFlaggedFraud": "is_flagged_fraud",
    })

    fraud_df = df[df["is_fraud"] == 1]
    non_fraud_df = df[df["is_fraud"] == 0]

    n_fraud = len(fraud_df)
    n_non_fraud = min(sample_size - n_fraud, len(non_fraud_df))
    non_fraud_sampled = non_fraud_df.sample(n=n_non_fraud, random_state=42)

    sampled = pd.concat([fraud_df, non_fraud_sampled]).sample(frac=1, random_state=42).reset_index(drop=True)

    sampled["device_id"] = sampled["name_orig"].apply(_hash_to_device)
    sampled["ip_address"] = sampled["name_orig"].apply(_hash_to_ip)

    fraud_origins = sampled[sampled["is_fraud"] == 1]["name_orig"].unique()
    if len(fraud_origins) > 10:
        ring_size = min(8, len(fraud_origins) // 5)
        n_rings = len(fraud_origins) // ring_size
        shared_device = f"RING-DEV-{random.randint(1000,9999)}"
        shared_ip = f"192.168.1.{random.randint(1, 254)}"
        for ring_idx in range(n_rings):
            start = ring_idx * ring_size
            ring_accounts = fraud_origins[start:start + ring_size]
            for acc in ring_accounts:
                sampled.loc[sampled["name_orig"] == acc, "device_id"] = shared_device
                sampled.loc[sampled["name_orig"] == acc, "ip_address"] = shared_ip

    return sampled


FEATURE_COLS = [
    "amount",
    "old_balance_orig",
    "new_balance_orig",
    "old_balance_dest",
    "new_balance_dest",
    "step",
]

TYPE_DUMMIES = ["tx_type_CASH_IN", "tx_type_CASH_OUT", "tx_type_DEBIT", "tx_type_PAYMENT", "tx_type_TRANSFER"]


def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    encoded = pd.get_dummies(df["tx_type"], prefix="tx_type")
    for col in TYPE_DUMMIES:
        if col not in encoded.columns:
            encoded[col] = 0

    features = pd.concat([df[FEATURE_COLS].reset_index(drop=True), encoded[TYPE_DUMMIES].reset_index(drop=True)], axis=1)

    features["balance_diff_orig"] = df["old_balance_orig"] - df["new_balance_orig"]
    features["balance_diff_dest"] = df["new_balance_dest"] - df["old_balance_dest"]
    features["amount_to_balance_ratio"] = df["amount"] / (df["old_balance_orig"] + 1)
    features["is_zero_balance_orig"] = (df["old_balance_orig"] == 0).astype(int)
    features["is_zero_balance_dest"] = (df["old_balance_dest"] == 0).astype(int)

    return features

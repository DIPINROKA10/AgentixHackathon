import os
import json
import pickle
import xgboost as xgb
import shap
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score

from app.config import get_settings
from ml.features import prepare_dataset, encode_features, FEATURE_COLS, TYPE_DUMMIES

settings = get_settings()

ALL_FEATURES = FEATURE_COLS + TYPE_DUMMIES + [
    "balance_diff_orig", "balance_diff_dest",
    "amount_to_balance_ratio", "is_zero_balance_orig", "is_zero_balance_dest",
]

REASON_TEMPLATES = {
    "amount": "Unusually high transaction amount of ${amount:,.2f}",
    "old_balance_orig": "Sender had low balance before transaction",
    "new_balance_orig": "Sender balance dropped to ${val:,.2f}",
    "old_balance_dest": "Receiver had no prior balance history",
    "new_balance_dest": "Receiver balance changed unusually",
    "step": "Transaction occurred at unusual time step",
    "tx_type_CASH_OUT": "Cash-out transactions carry higher fraud risk",
    "tx_type_TRANSFER": "Transfers are commonly used in fraud",
    "tx_type_DEBIT": "Debit transactions flagged as suspicious",
    "tx_type_PAYMENT": "Payment pattern matches known fraud behavior",
    "tx_type_CASH_IN": "Cash-in pattern is atypical",
    "balance_diff_orig": "Large balance discrepancy on sender side",
    "balance_diff_dest": "Large balance discrepancy on receiver side",
    "amount_to_balance_ratio": "Transaction amount is disproportionate to account balance",
    "is_zero_balance_orig": "Sender account had zero balance before transaction",
    "is_zero_balance_dest": "Receiver account had zero balance history",
}


def train_model():
    print("Loading and preparing dataset...")
    csv_path = settings.DATASET_PATH
    if not os.path.exists(csv_path):
        alt = os.path.join(os.path.dirname(__file__), "..", "..", "..", "archive", "PS_20174392719_1491204439457_log.csv")
        if os.path.exists(alt):
            csv_path = os.path.abspath(alt)
        else:
            raise FileNotFoundError(f"Dataset not found at {csv_path}")

    df = prepare_dataset(csv_path, sample_size=50000)
    print(f"Dataset loaded: {len(df)} rows, {df['is_fraud'].sum()} fraud cases")

    X = encode_features(df)
    y = df["is_fraud"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("Training XGBoost model...")
    scale_pos = len(y_train[y_train == 0]) / max(len(y_train[y_train == 1]), 1)

    model = xgb.XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.1,
        scale_pos_weight=scale_pos,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=5,
        gamma=0.1,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        eval_metric="auc",
        use_label_encoder=False,
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Legit", "Fraud"]))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}")

    model_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, "xgboost_fraud.json")
    model.save_model(model_path)
    print(f"Model saved to {model_path}")

    print("Computing SHAP background data...")
    background = shap.sample(X_train, settings.SHAP_BG_SAMPLES)
    if hasattr(background, 'values'):
        background = background.values.astype(np.float64)
    else:
        background = np.array(background, dtype=np.float64)
    background_path = os.path.join(model_dir, "shap_background.pkl")
    with open(background_path, "wb") as f:
        pickle.dump(background, f)

    feature_names = X_train.columns.tolist()
    meta_path = os.path.join(model_dir, "feature_meta.json")
    with open(meta_path, "w") as f:
        json.dump({
            "feature_names": feature_names,
            "reason_templates": REASON_TEMPLATES,
        }, f, indent=2)

    print("Training complete!")
    return model


if __name__ == "__main__":
    train_model()

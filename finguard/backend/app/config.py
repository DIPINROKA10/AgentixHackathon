from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./finguard.db"
    DATASET_PATH: str = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "..", "archive", "PS_20174392719_1491204439457_log.csv")
    MODEL_PATH: str = "ml/models/xgboost_fraud.json"
    SHAP_BG_SAMPLES: int = 100
    FRAUD_SCORE_THRESHOLD: int = 60
    CONSUMER_ALERT_THRESHOLD: int = 75
    SIMULATION_SPEED: float = 0.5

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()

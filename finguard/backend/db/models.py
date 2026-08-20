from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from sqlalchemy.sql import func
import os

from app.config import get_settings

settings = get_settings()

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    step = Column(Integer, nullable=False)
    tx_type = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    name_orig = Column(String(50), nullable=False)
    old_balance_orig = Column(Float, default=0)
    new_balance_orig = Column(Float, default=0)
    name_dest = Column(String(50), nullable=False)
    old_balance_dest = Column(Float, default=0)
    new_balance_dest = Column(Float, default=0)
    is_fraud = Column(Integer, default=0)
    is_flagged_fraud = Column(Integer, default=0)
    device_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    score = relationship("TransactionScore", back_populates="transaction", uselist=False)


class TransactionScore(Base):
    __tablename__ = "transaction_scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False, unique=True)
    risk_score = Column(Integer, nullable=False)
    reason_codes = Column(JSON, nullable=False)
    is_fraudulent = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())

    transaction = relationship("Transaction", back_populates="score")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_type = Column(String(20), nullable=False)
    status = Column(String(20), default="new")
    ring_id = Column(Integer, nullable=True)
    account_ids = Column(JSON, nullable=True)
    risk_level = Column(String(10), nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    transactions = relationship("CaseTransaction", back_populates="case")
    audit_logs = relationship("AuditLog", back_populates="case")


class CaseTransaction(Base):
    __tablename__ = "case_transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)

    case = relationship("Case", back_populates="transactions")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    action = Column(String(50), nullable=False)
    old_value = Column(String(50), nullable=True)
    new_value = Column(String(50), nullable=True)
    timestamp = Column(DateTime, server_default=func.now())

    case = relationship("Case", back_populates="audit_logs")


class FraudRing(Base):
    __tablename__ = "fraud_rings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ring_id = Column(Integer, nullable=False)
    account_ids = Column(JSON, nullable=False)
    shared_devices = Column(JSON, nullable=True)
    shared_ips = Column(JSON, nullable=True)
    risk_level = Column(String(10), nullable=False)
    total_fraud_amount = Column(Float, default=0)
    detected_at = Column(DateTime, server_default=func.now())


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    Base.metadata.create_all(bind=engine)

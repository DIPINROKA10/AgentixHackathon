CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    step INTEGER NOT NULL,
    tx_type VARCHAR(20) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    name_orig VARCHAR(50) NOT NULL,
    old_balance_orig DOUBLE PRECISION DEFAULT 0,
    new_balance_orig DOUBLE PRECISION DEFAULT 0,
    name_dest VARCHAR(50) NOT NULL,
    old_balance_dest DOUBLE PRECISION DEFAULT 0,
    new_balance_dest DOUBLE PRECISION DEFAULT 0,
    is_fraud INTEGER DEFAULT 0,
    is_flagged_fraud INTEGER DEFAULT 0,
    device_id VARCHAR(50),
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transaction_scores (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER UNIQUE REFERENCES transactions(id),
    risk_score INTEGER NOT NULL,
    reason_codes JSONB NOT NULL,
    is_fraudulent INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
    id SERIAL PRIMARY KEY,
    case_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'new',
    ring_id INTEGER,
    account_ids JSONB,
    risk_level VARCHAR(10) NOT NULL,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_transactions (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id),
    transaction_id INTEGER REFERENCES transactions(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES cases(id),
    action VARCHAR(50) NOT NULL,
    old_value VARCHAR(50),
    new_value VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fraud_rings (
    id SERIAL PRIMARY KEY,
    ring_id INTEGER NOT NULL,
    account_ids JSONB NOT NULL,
    shared_devices JSONB,
    shared_ips JSONB,
    risk_level VARCHAR(10) NOT NULL,
    total_fraud_amount DOUBLE PRECISION DEFAULT 0,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_name_orig ON transactions(name_orig);
CREATE INDEX idx_transactions_name_dest ON transactions(name_dest);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_scores_transaction_id ON transaction_scores(transaction_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_fraud_rings_ring_id ON fraud_rings(ring_id);

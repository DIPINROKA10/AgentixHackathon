import React, { useState } from 'react';

const PRESETS = {
  safe: {
    label: 'Safe Payment',
    step: 1, type: 'PAYMENT', amount: 50,
    nameOrig: 'C1000000001', oldbalanceOrg: 5000, newbalanceOrig: 4950,
    nameDest: 'M2000000001', oldbalanceDest: 0, newbalanceDest: 0,
  },
  suspicious: {
    label: 'Suspicious Transfer',
    step: 1, type: 'TRANSFER', amount: 150000,
    nameOrig: 'C3000000003', oldbalanceOrg: 0, newbalanceOrig: 0,
    nameDest: 'C4000000004', oldbalanceDest: 0, newbalanceDest: 150000,
  },
  fraud_ring: {
    label: 'Fraud Ring Pattern',
    step: 1, type: 'CASH_OUT', amount: 49999,
    nameOrig: 'C5000000005', oldbalanceOrg: 50000, newbalanceOrig: 1,
    nameDest: 'C6000000006', oldbalanceDest: 0, newbalanceDest: 0,
  },
  draining: {
    label: 'Account Draining',
    step: 1, type: 'TRANSFER', amount: 999999,
    nameOrig: 'C7000000007', oldbalanceOrg: 1000000, newbalanceOrig: 1,
    nameDest: 'C8000000008', oldbalanceDest: 0, newbalanceDest: 999999,
  },
};

export default function ConsumerAlert() {
  const [formData, setFormData] = useState(PRESETS.suspicious);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const checkTransaction = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:8000/api/consumer-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data);
      setHistory((prev) => [{ ...data, tx: { ...formData }, time: new Date() }, ...prev].slice(0, 10));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const update = (key, val) => setFormData((prev) => ({ ...prev, [key]: val }));

  const inputStyle = { background: 'rgba(255,255,255,0.4)', border: '1px solid var(--border-solid)', color: 'var(--text-primary)' };
  const labelStyle = { color: 'var(--text-muted)' };

  return (
    <div className="px-9 py-7 max-w-[960px] mx-auto">
      <div className="text-center mb-6">
        <span className="font-mono text-[11px] tracking-[0.14em] text-blue-600 uppercase block mb-1.5">Pre-transaction Safety Check</span>
        <h1 className="font-display text-[27px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Consumer Alert Simulation</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Test the real-time warning shown to users before confirming a risky transaction.
        </p>
      </div>

      <div className="flex gap-2 justify-center flex-wrap mb-6">
        {Object.entries(PRESETS).map(([key, preset]) => (
          <button
            key={key}
            onClick={() => { setFormData(preset); setResult(null); }}
            className="glass flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 hover:shadow-md hover:shadow-blue-500/10 hover:scale-[1.04] active:scale-[0.97]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass rounded-xl p-5 space-y-4">
          <span className="font-display font-semibold text-[13.5px] tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Transaction Details</span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={labelStyle}>Type</label>
              <select value={formData.type} onChange={(e) => update('type', e.target.value)} className="w-full rounded-lg px-3 py-2 text-[13px] focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors" style={inputStyle}>
                <option>PAYMENT</option>
                <option>TRANSFER</option>
                <option>CASH_OUT</option>
                <option>CASH_IN</option>
                <option>DEBIT</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={labelStyle}>Amount ($)</label>
              <input type="number" value={formData.amount} onChange={(e) => update('amount', parseFloat(e.target.value) || 0)} className="w-full rounded-lg px-3 py-2 text-[13px] font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={labelStyle}>Sender Before</label>
              <input type="number" value={formData.oldbalanceOrg} onChange={(e) => update('oldbalanceOrg', parseFloat(e.target.value) || 0)} className="w-full rounded-lg px-3 py-2 text-[13px] font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors" style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={labelStyle}>Sender After</label>
              <input type="number" value={formData.newbalanceOrig} onChange={(e) => update('newbalanceOrig', parseFloat(e.target.value) || 0)} className="w-full rounded-lg px-3 py-2 text-[13px] font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={labelStyle}>Recipient Before</label>
              <input type="number" value={formData.oldbalanceDest} onChange={(e) => update('oldbalanceDest', parseFloat(e.target.value) || 0)} className="w-full rounded-lg px-3 py-2 text-[13px] font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors" style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={labelStyle}>Recipient After</label>
              <input type="number" value={formData.newbalanceDest} onChange={(e) => update('newbalanceDest', parseFloat(e.target.value) || 0)} className="w-full rounded-lg px-3 py-2 text-[13px] font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={labelStyle}>Sender ID</label>
              <input type="text" value={formData.nameOrig} onChange={(e) => update('nameOrig', e.target.value)} className="w-full rounded-lg px-3 py-2 text-[13px] font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors" style={inputStyle} />
            </div>
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={labelStyle}>Recipient ID</label>
              <input type="text" value={formData.nameDest} onChange={(e) => update('nameDest', e.target.value)} className="w-full rounded-lg px-3 py-2 text-[13px] font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors" style={inputStyle} />
            </div>
          </div>

          <button
            onClick={checkTransaction}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/30 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 text-[13px] shadow-lg shadow-blue-600/20 hover:shadow-xl active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Checking...</span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                  <path d="M12 2 3 6v6c0 5 4 9 9 10 5-1 9-5 9-10V6z" />
                </svg>
                Check Transaction Safety
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {result ? (
            <div className="rounded-xl border p-5 transition-all animate-fade-in" style={result.show_alert
              ? { background: 'rgba(254,226,226,0.5)', borderColor: 'rgba(252,165,165,0.5)', backdropFilter: 'blur(16px)' }
              : { background: 'rgba(209,250,229,0.5)', borderColor: 'rgba(167,243,208,0.5)', backdropFilter: 'blur(16px)' }
            }>
              {result.show_alert ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-red-100/60 flex items-center justify-center mx-auto">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-6 h-6 animate-pulse">
                        <path d="M12 2 21 20H3Z" /><path d="M12 9v5M12 17h.01" />
                      </svg>
                    </div>
                    <h3 className="font-display text-[18px] font-bold text-red-600 mt-3">Warning: Suspicious Transaction</h3>
                  </div>

                  <div className="glass rounded-lg p-4" style={{ borderColor: 'rgba(252,165,165,0.4)' }}>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>{result.message}</p>
                  </div>

                  <div className="glass rounded-lg p-4 space-y-2" style={{ borderColor: 'rgba(252,165,165,0.4)' }}>
                    <p className="text-[11px] font-mono uppercase tracking-wide font-semibold" style={labelStyle}>Why we flagged this</p>
                    {result.reasons?.map((reason, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="w-3.5 h-3.5 mt-0.5 flex-shrink-0">
                          <path d="M12 2 21 20H3Z" /><path d="M12 9v5M12 17h.01" />
                        </svg>
                        <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>{reason}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                      <div className="h-full bg-red-500 rounded-full transition-all duration-700" style={{ width: `${result.risk_score}%` }} />
                    </div>
                    <span className="font-mono text-[13px] text-red-500 font-bold">{result.risk_score}/100</span>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setResult(null)} className="flex-1 px-4 py-2.5 glass rounded-lg text-[13px] font-semibold transition-all duration-200 hover:shadow-md hover:shadow-black/5 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 active:scale-[0.97]" style={{ color: 'var(--text-secondary)' }}>
                      Cancel Transaction
                    </button>
                    <button className="flex-1 px-4 py-2.5 bg-red-100/50 text-red-600 border border-red-200/50 rounded-lg text-[13px] font-semibold hover:bg-red-100 hover:border-red-300/60 transition-all duration-200 hover:shadow-sm active:scale-[0.97]">
                      I Understand, Proceed
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100/60 flex items-center justify-center mx-auto">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="w-6 h-6">
                      <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
                    </svg>
                  </div>
                  <h3 className="font-display text-[18px] font-bold text-emerald-600">Transaction Looks Safe</h3>
                  <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
                    Risk score: <span className="font-mono font-bold text-emerald-600">{result.risk_score}</span>/100 — No suspicious patterns detected.
                  </p>
                  <div className="flex items-center gap-2 max-w-xs mx-auto">
                    <div className="h-2 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(result.risk_score, 2)}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="glass rounded-xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--border-solid)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }}>
                <path d="M12 2 3 6v6c0 5 4 9 9 10 5-1 9-5 9-10V6z" />
              </svg>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Configure a transaction and click "Check" to see the safety result.</p>
            </div>
          )}

          {history.length > 0 && (
            <div className="glass rounded-xl p-4">
              <span className="text-[11px] font-mono uppercase tracking-wide font-semibold block mb-3" style={labelStyle}>Recent Checks</span>
              <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-[12px] animate-fade-in py-1.5" style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    {h.show_alert ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-3 h-3 flex-shrink-0">
                        <path d="M12 2 21 20H3Z" /><path d="M12 9v5M12 17h.01" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" className="w-3 h-3 flex-shrink-0">
                        <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                    <span style={{ color: 'var(--text-muted)' }}>{h.tx.type}</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>${h.tx.amount?.toLocaleString()}</span>
                    <span className={`font-mono font-bold ${h.risk_score >= 75 ? 'text-red-500' : h.risk_score >= 40 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {h.risk_score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

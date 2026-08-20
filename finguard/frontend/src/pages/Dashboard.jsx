import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectWebSocket, fetchStats } from '../api/client';
import RiskChart from '../components/RiskChart';

const STAT_CARDS = [
  { label: 'Total Transactions', key: 'total_transactions', to: '/cases', iconPath: 'M3 12h4l3 8 4-16 3 8h4', iconColor: '#4a5162', iconBg: 'rgba(74,81,98,0.1)' },
  { label: 'Fraud Detected', key: 'fraud', to: '/cases', iconPath: 'M12 2 21 20H3Z M12 9v5M12 17h.01', iconColor: '#ef4444', iconBg: 'rgba(239,68,68,0.08)' },
  { label: 'Active Cases', key: 'cases', to: '/cases', iconPath: 'M12 2 3 6v6c0 5 4 9 9 10 5-1 9-5 9-10V6z', iconColor: '#f59e0b', iconBg: 'rgba(245,158,11,0.08)' },
  { label: 'Fraud Rings', key: 'rings', to: '/rings', iconPath: 'M17 7 7 17M7 7l10 10', iconColor: '#2563eb', iconBg: 'rgba(37,99,235,0.08)' },
];

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [rings, setRings] = useState([]);
  const feedRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats().then(setStats).catch(console.error);
    const ws = connectWebSocket((data) => {
      setTransactions((prev) => [data.transaction, ...prev].slice(0, 100));
      if (data.rings?.length) setRings(data.rings);
    });
    return () => ws.close();
  }, []);

  const riskBg = (score) => {
    if (score >= 70) return 'bg-red-50 text-red-600';
    if (score >= 40) return 'bg-amber-50 text-amber-600';
    return 'bg-emerald-50 text-emerald-600';
  };

  const getStatValue = (key) => {
    if (!stats) return 0;
    switch (key) {
      case 'total_transactions': return stats.total_transactions;
      case 'fraud': return stats.total_fraud;
      case 'cases': return stats.total_cases;
      case 'rings': return stats.total_rings || stats.ring_stats?.total_rings || 0;
      default: return 0;
    }
  };

  return (
    <div className="px-9 py-7 max-w-[1280px]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="font-mono text-[11px] tracking-[0.14em] text-blue-600 uppercase block mb-1.5">Real-time · Ledger Stream</span>
          <h1 className="font-display text-[27px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Live Transaction Feed</h1>
        </div>
        <div className="font-mono text-[12px] text-right" style={{ color: 'var(--text-muted)' }}>
          <div>Bengaluru, IN</div>
          <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{new Date().toLocaleTimeString('en-GB')}</div>
        </div>
      </div>

      <div className="h-[34px] -mt-1 mb-5 overflow-hidden relative">
        <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, var(--bg-main) 0%, transparent 6%, transparent 94%, var(--bg-main) 100%)` }}></div>
        <svg viewBox="0 0 900 34" preserveAspectRatio="none" className="absolute left-0 top-0 h-full w-[220%]">
          <g className="animate-scroll-pulse">
            <path d="M0,17 L120,17 L136,17 L146,4 L156,30 L166,10 L176,17 L340,17 L356,17 L366,4 L376,30 L386,10 L396,17 L560,17 L576,17 L586,4 L596,30 L606,10 L616,17 L780,17 L796,17 L806,4 L816,30 L826,10 L836,17 L900,17" fill="none" stroke="#3b82f6" strokeWidth="1.4" opacity="0.3" />
            <path d="M900,17 L1020,17 L1036,17 L1046,4 L1056,30 L1066,10 L1076,17 L1240,17 L1256,17 L1266,4 L1276,30 L1286,10 L1296,17 L1460,17 L1476,17 L1486,4 L1496,30 L1506,10 L1516,17 L1680,17 L1696,17 L1706,4 L1716,30 L1726,10 L1736,17 L1800,17" fill="none" stroke="#3b82f6" strokeWidth="1.4" opacity="0.3" />
          </g>
        </svg>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3.5 mb-5">
          {STAT_CARDS.map(({ label, key, to, iconPath, iconColor, iconBg }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="glass rounded-xl p-[18px] text-left group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 relative overflow-hidden"
            >
              <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center mb-3.5" style={{ backgroundColor: iconBg }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" className="w-[17px] h-[17px]">
                  <path d={iconPath} />
                </svg>
              </div>
              <div className="font-mono font-bold text-[27px] tracking-tight leading-none tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {getStatValue(key)?.toLocaleString()}
              </div>
              <div className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
              {key === 'fraud' && (
                <span className="absolute top-4 right-4 font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>▲ live</span>
              )}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: '1.62fr 1fr' }}>
        <div className="glass rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-display font-semibold text-[13.5px] tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Live Feed</span>
            <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>{transactions.length} transactions</span>
          </div>
          <div ref={feedRef} className="max-h-[456px] overflow-y-auto scrollbar-thin">
            {transactions.length === 0 && (
              <div className="p-8 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>Waiting for transactions...</div>
            )}
            {transactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 px-[18px] py-3 transition-all animate-row-in hover:bg-white/30"
                style={{ animationDelay: `${Math.min(i * 0.04, 0.5)}s`, borderBottom: '1px solid var(--border)' }}
              >
                <div className={`font-mono font-bold text-[12px] w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0 ${tx.risk_score >= 70 ? 'bg-red-100/60 text-red-600 animate-score-pulse' : riskBg(tx.risk_score)}`}>
                  {tx.risk_score}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 text-[13px]">
                    <span className={`font-display font-semibold tracking-wide ${tx.tx_type === 'TRANSFER' ? 'text-red-500' : tx.tx_type === 'CASH_OUT' ? 'text-amber-600' : ''}`} style={tx.tx_type !== 'TRANSFER' && tx.tx_type !== 'CASH_OUT' ? { color: 'var(--text-secondary)' } : {}}>
                      {tx.tx_type?.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[11.5px] truncate" style={{ color: 'var(--text-muted)' }}>{tx.name_orig?.slice(0, 14)}… → {tx.name_dest?.slice(0, 14)}…</span>
                  </div>
                  {tx.reason_codes?.[0] && (
                    <p className="text-[11.5px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{tx.reason_codes[0].description}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono font-semibold text-[13.5px] tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    ${tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  {tx.is_fraud === 1 && (
                    <div className="font-mono text-[10px] tracking-wide text-red-500 mt-0.5">FRAUD</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <RiskChart transactions={transactions} />

          <button
            onClick={() => navigate('/rings')}
            className="glass rounded-xl overflow-hidden text-left group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
          >
            <div className="flex items-center justify-between px-[18px] py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="font-display font-semibold text-[13.5px] tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Active Fraud Rings</span>
              <span className="font-mono text-[11px] group-hover:text-blue-500 transition-colors" style={{ color: 'var(--text-muted)' }}>→</span>
            </div>
            <div>
              {rings.length > 0 ? rings.slice(0, 3).map((ring) => (
                <div key={ring.ring_id} className="flex items-center justify-between px-[18px] py-3 transition-all last:border-b-0 hover:bg-white/30" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div className="font-display font-semibold text-[13.5px]" style={{ color: 'var(--text-primary)' }}>Ring #{ring.ring_id}</div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{ring.member_count} accounts · avg risk {ring.avg_risk_score}</div>
                  </div>
                  <span className={`font-mono text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded ${
                    ring.risk_level === 'high' ? 'bg-red-100/60 text-red-600' :
                    ring.risk_level === 'medium' ? 'bg-amber-100/60 text-amber-600' :
                    'bg-emerald-100/60 text-emerald-600'
                  }`}>
                    {ring.risk_level?.toUpperCase()}
                  </span>
                </div>
              )) : (
                <div className="px-[18px] py-5 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>No rings detected yet</div>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

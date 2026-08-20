import React, { useMemo } from 'react';

export default function RiskChart({ transactions }) {
  const { high, medium, low, total } = useMemo(() => {
    let high = 0, medium = 0, low = 0;
    transactions.forEach((tx) => {
      if (tx.risk_score >= 70) high++;
      else if (tx.risk_score >= 40) medium++;
      else low++;
    });
    return { high, medium, low, total: high + medium + low };
  }, [transactions]);

  const C = 402.1;
  const lowFrac = total > 0 ? low / total : 0;
  const medFrac = total > 0 ? medium / total : 0;
  const highFrac = total > 0 ? high / total : 0;
  const lowDash = C * lowFrac;
  const medDash = C * medFrac;
  const highDash = C * highFrac;
  const medOffset = -lowDash;
  const highOffset = -(lowDash + medDash);

  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="px-[18px] py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="font-display font-semibold text-[13.5px] tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>Risk Distribution</span>
      </div>
      <div className="flex flex-col items-center gap-3.5 pt-5 pb-4" style={{ background: 'rgba(255,255,255,0.25)' }}>
        <svg viewBox="0 0 160 160" className="w-[172px] h-[172px]">
          <circle cx="80" cy="80" r="64" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="16" />
          {total > 0 && (
            <>
              <circle cx="80" cy="80" r="64" fill="none" stroke="#3b82f6" strokeWidth="16"
                strokeDasharray={`${lowDash} ${C}`} strokeDashoffset="0"
                strokeLinecap="round" transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)' }}
              />
              {medium > 0 && (
                <circle cx="80" cy="80" r="64" fill="none" stroke="#f59e0b" strokeWidth="16"
                  strokeDasharray={`${medDash} ${C}`} strokeDashoffset={medOffset}
                  strokeLinecap="round" transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1) 0.1s, stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1) 0.1s' }}
                />
              )}
              {high > 0 && (
                <circle cx="80" cy="80" r="64" fill="none" stroke="#ef4444" strokeWidth="16"
                  strokeDasharray={`${highDash} ${C}`} strokeDashoffset={highOffset}
                  strokeLinecap="round" transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1) 0.2s, stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1) 0.2s' }}
                />
              )}
            </>
          )}
          <text x="80" y="76" textAnchor="middle" className="font-mono font-bold" fill="#1a1d24" fontSize="22">{total}</text>
          <text x="80" y="94" textAnchor="middle" className="font-mono" fill="#7b8494" fontSize="9.5" letterSpacing="0.1em">FLAGGED</text>
        </svg>
        <div className="flex gap-5 pb-1">
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Low: {low}
          </div>
          {medium > 0 && (
            <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium: {medium}
            </div>
          )}
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-red-500"></span> High: {high}
          </div>
        </div>
      </div>
    </div>
  );
}

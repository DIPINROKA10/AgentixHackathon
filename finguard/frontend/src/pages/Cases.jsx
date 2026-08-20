import React, { useState, useEffect } from 'react';
import { fetchCases, updateCaseStatus } from '../api/client';

const STATUS_COLORS = {
  new: { bg: 'bg-red-100/50', text: 'text-red-600', border: 'border-red-200/50' },
  under_review: { bg: 'bg-amber-100/50', text: 'text-amber-600', border: 'border-amber-200/50' },
  resolved: { bg: 'bg-emerald-100/50', text: 'text-emerald-600', border: 'border-emerald-200/50' },
};

const STATUS_ICONS = {
  new: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" className="w-3.5 h-3.5">
      <path d="M12 2 21 20H3Z" /><path d="M12 9v5M12 17h.01" />
    </svg>
  ),
  under_review: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  ),
  resolved: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" className="w-3.5 h-3.5">
      <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
    </svg>
  ),
};

const RISK_BADGE = {
  high: { bg: 'bg-red-100/50', text: 'text-red-600' },
  medium: { bg: 'bg-amber-100/50', text: 'text-amber-600' },
  low: { bg: 'bg-emerald-100/50', text: 'text-emerald-600' },
};

function CaseModal({ caseData, onClose, onStatusChange }) {
  if (!caseData) return null;
  const sc = STATUS_COLORS[caseData.status] || STATUS_COLORS.new;
  const rb = RISK_BADGE[caseData.risk_level] || RISK_BADGE.low;

  const riskScore = (() => {
    const m = caseData.summary?.match(/Risk:\s*(\d+)/);
    return m ? parseInt(m[1]) : null;
  })();

  const reasons = (() => {
    const m = caseData.summary?.match(/\. (.+)$/);
    return m ? m[1].split('; ').filter(Boolean) : [];
  })();

  const amount = (() => {
    const m = caseData.summary?.match(/\$([\d,]+\.?\d*)/);
    return m ? m[1] : null;
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(4px)' }}></div>
      <div
        className="relative glass rounded-2xl w-full max-w-[540px] max-h-[85vh] overflow-y-auto animate-fade-in"
        style={{ border: '1px solid var(--border-solid)', boxShadow: '0 25px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <span className="font-mono text-[11px] tracking-[0.14em] text-blue-600 uppercase block mb-1">Case Details</span>
              <h2 className="font-display text-[22px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Case #{caseData.id}</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
              style={{ color: 'var(--text-muted)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 mb-5">
            <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md border ${sc.bg} ${sc.text} ${sc.border}`}>
              {caseData.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`font-mono text-[11px] font-semibold px-2.5 py-1 rounded-md ${rb.bg} ${rb.text}`}>
              {caseData.risk_level?.toUpperCase()} RISK
            </span>
            <span className="font-mono text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-muted)' }}>
              {caseData.case_type}
            </span>
          </div>

          {riskScore !== null && (
            <div className="glass rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.35)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Risk Score</span>
                <span className={`font-mono text-[20px] font-bold ${riskScore >= 70 ? 'text-red-500' : riskScore >= 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {riskScore}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.06)' }}>
                <div
                  className={`h-full rounded-full transition-all ${riskScore >= 70 ? 'bg-red-500' : riskScore >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
            </div>
          )}

          {amount && (
            <div className="glass rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.35)' }}>
              <span className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>Transaction Amount</span>
              <span className="font-mono text-[22px] font-bold" style={{ color: 'var(--text-primary)' }}>${amount}</span>
            </div>
          )}

          {caseData.account_ids?.length > 0 && (
            <div className="glass rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.35)' }}>
              <span className="text-[11px] font-mono uppercase tracking-wide block mb-2.5" style={{ color: 'var(--text-muted)' }}>Linked Accounts</span>
              <div className="flex flex-wrap gap-2">
                {caseData.account_ids.map((acc, i) => (
                  <div key={acc} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(0,0,0,0.04)' }}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${i === 0 ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      {i === 0 ? 'S' : 'R'}
                    </span>
                    <span className="font-mono text-[12px]" style={{ color: 'var(--text-primary)' }}>{acc}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2.5" style={{ color: 'var(--text-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span className="text-[11px] font-mono">Sender → Recipient</span>
              </div>
            </div>
          )}

          {reasons.length > 0 && (
            <div className="glass rounded-xl p-4 mb-4" style={{ background: 'rgba(255,255,255,0.35)' }}>
              <span className="text-[11px] font-mono uppercase tracking-wide block mb-2.5" style={{ color: 'var(--text-muted)' }}>Why Flagged</span>
              <div className="space-y-2">
                {reasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: 'rgba(245,158,11,0.1)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" className="w-3 h-3">
                        <path d="M12 2 21 20H3Z" /><path d="M12 9v5M12 17h.01" />
                      </svg>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {caseData.ring_id && (
            <div className="glass rounded-xl p-4 mb-4" style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)' }}>
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" className="w-4 h-4">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
                <span className="font-display font-semibold text-[13px] text-blue-600">Linked to Fraud Ring #{caseData.ring_id}</span>
              </div>
            </div>
          )}

          <div className="glass rounded-xl p-4 mb-5" style={{ background: 'rgba(255,255,255,0.35)' }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>Created</span>
                <span className="text-[13px] font-mono" style={{ color: 'var(--text-primary)' }}>
                  {caseData.created_at ? new Date(caseData.created_at).toLocaleString() : '—'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wide block mb-1" style={{ color: 'var(--text-muted)' }}>Last Updated</span>
                <span className="text-[13px] font-mono" style={{ color: 'var(--text-primary)' }}>
                  {caseData.updated_at ? new Date(caseData.updated_at).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {caseData.status === 'new' && (
              <button
                onClick={() => { onStatusChange(caseData.id, 'under_review'); onClose(); }}
                className="flex-1 px-4 py-2.5 bg-amber-100/50 text-amber-600 border border-amber-200/50 rounded-lg text-[13px] font-semibold hover:bg-amber-100/70 transition-colors"
              >
                Start Review
              </button>
            )}
            {caseData.status === 'under_review' && (
              <button
                onClick={() => { onStatusChange(caseData.id, 'resolved'); onClose(); }}
                className="flex-1 px-4 py-2.5 bg-emerald-100/50 text-emerald-600 border border-emerald-200/50 rounded-lg text-[13px] font-semibold hover:bg-emerald-100/70 transition-colors"
              >
                Mark Resolved
              </button>
            )}
            {caseData.status === 'resolved' && (
              <div className="flex-1 flex items-center justify-center gap-1.5 text-[13px] font-medium text-emerald-600 py-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
                </svg>
                Case Resolved
              </div>
            )}
            <button
              onClick={onClose}
              className="px-5 py-2.5 glass rounded-lg text-[13px] font-semibold transition-all hover:shadow-md hover:shadow-black/5"
              style={{ color: 'var(--text-secondary)' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);

  const loadCases = async () => {
    setLoading(true);
    const params = {};
    if (filter) params.status = filter;
    try {
      const data = await fetchCases(params);
      setCases(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => { loadCases(); }, [filter]);

  const handleStatusChange = async (caseId, newStatus) => {
    await updateCaseStatus(caseId, newStatus);
    loadCases();
  };

  const filtered = cases.filter((c) =>
    search === '' ||
    c.summary?.toLowerCase().includes(search.toLowerCase()) ||
    c.account_ids?.some((id) => id.toLowerCase().includes(search.toLowerCase()))
  );

  const inputStyle = { background: 'rgba(255,255,255,0.45)', border: '1px solid var(--border-solid)', color: 'var(--text-primary)' };

  return (
    <div className="px-9 py-7 max-w-[1280px]">
      <div className="flex items-end justify-between mb-6">
        <div>
          <span className="font-mono text-[11px] tracking-[0.14em] text-blue-600 uppercase block mb-1.5">Investigation Hub</span>
          <h1 className="font-display text-[27px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Case Queue</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-[13px] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors w-56"
              style={inputStyle}
            />
          </div>
          <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.3)' }}>
            {[
              { value: '', label: 'All' },
              { value: 'new', label: 'New' },
              { value: 'under_review', label: 'Reviewing' },
              { value: 'resolved', label: 'Resolved' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all`}
                style={filter === value ? { background: 'rgba(255,255,255,0.6)', color: '#2563eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : { color: 'var(--text-muted)' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && cases.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading cases...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c, idx) => {
            const sc = STATUS_COLORS[c.status] || STATUS_COLORS.new;
            const rb = RISK_BADGE[c.risk_level] || RISK_BADGE.low;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className="glass rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-black/5 animate-fade-in cursor-pointer hover:scale-[1.005]"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.35)' }}>
                      {STATUS_ICONS[c.status]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>Case #{c.id}</h3>
                        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-muted)' }}>
                          {c.case_type}
                        </span>
                      </div>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {c.account_ids?.length || 0} accounts linked · Ring #{c.ring_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${rb.bg} ${rb.text}`}>
                      {c.risk_level?.toUpperCase()}
                    </span>
                    <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md border ${sc.bg} ${sc.text} ${sc.border}`}>
                      {c.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {c.summary && (
                  <p className="text-[13px] mt-3 leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{c.summary}</p>
                )}

                {c.account_ids?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {c.account_ids.slice(0, 5).map((acc) => (
                      <span key={acc} className="font-mono text-[11px] px-2 py-1 rounded" style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)' }}>
                        {acc.slice(0, 15)}...
                      </span>
                    ))}
                    {c.account_ids.length > 5 && (
                      <span className="text-[11px] self-center" style={{ color: 'var(--text-muted)' }}>+{c.account_ids.length - 5} more</span>
                    )}
                  </div>
                )}

                {c.created_at && (
                  <p className="font-mono text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
                    Created {new Date(c.created_at).toLocaleString()}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-2">
                    {c.status === 'new' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(c.id, 'under_review'); }}
                        className="px-4 py-1.5 bg-amber-100/50 text-amber-600 border border-amber-200/50 rounded-lg text-[12px] font-semibold hover:bg-amber-100/70 transition-colors"
                      >
                        Start Review
                      </button>
                    )}
                    {c.status === 'under_review' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(c.id, 'resolved'); }}
                        className="px-4 py-1.5 bg-emerald-100/50 text-emerald-600 border border-emerald-200/50 rounded-lg text-[12px] font-semibold hover:bg-emerald-100/70 transition-colors"
                      >
                        Mark Resolved
                      </button>
                    )}
                    {c.status === 'resolved' && (
                      <span className="flex items-center gap-1.5 text-[12px] font-medium text-emerald-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path d="M9 12l2 2 4-4" />
                        </svg>
                        Resolved
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    View details
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && !loading && (
            <div className="text-center py-16 glass rounded-xl" style={{ color: 'var(--text-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-10 h-10 mx-auto mb-3 opacity-30">
                <path d="M12 2 3 6v6c0 5 4 9 9 10 5-1 9-5 9-10V6z" />
              </svg>
              <p className="text-[13px]">No cases found</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                {filter ? 'Try changing the filter' : 'Cases are created automatically when fraud is detected'}
              </p>
            </div>
          )}
        </div>
      )}

      {selectedCase && (
        <CaseModal
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { fetchRings, fetchRingGraph } from '../api/client';

export default function Rings() {
  const [rings, setRings] = useState([]);
  const [selectedRing, setSelectedRing] = useState(null);
  const [graphData, setGraphData] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchRings().then(setRings).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedRing) {
      setGraphData(null);
      fetchRingGraph(selectedRing).then(setGraphData).catch(console.error);
    }
  }, [selectedRing]);

  useEffect(() => {
    if (!graphData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.parentElement.offsetWidth;
    const H = canvas.height = 400;
    ctx.clearRect(0, 0, W, H);

    const { nodes, edges } = graphData;
    if (!nodes.length) return;

    const nodeMap = {};
    const cx = W / 2, cy = H / 2;
    const radius = Math.min(W, H) * 0.35;

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      nodeMap[node.id] = { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), ...node };
    });

    edges.forEach((edge) => {
      const from = nodeMap[edge.from];
      const to = nodeMap[edge.to];
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = edge.risk_score >= 70 ? '#ef444450' : '#3b82f625';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      ctx.fillStyle = '#7b8494';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(edge.link_types.join(', '), midX, midY - 5);
    });

    nodes.forEach((node) => {
      const pos = nodeMap[node.id];
      const r = 18;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, 2 * Math.PI);
      ctx.fillStyle = node.risk_score >= 70 ? '#ef4444' : node.risk_score >= 40 ? '#f59e0b' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${node.risk_score}`, pos.x, pos.y);
      ctx.fillStyle = '#4a5162';
      ctx.font = '10px "Inter", sans-serif';
      ctx.fillText(node.label, pos.x, pos.y + r + 14);
    });
  }, [graphData]);

  return (
    <div className="px-9 py-7 max-w-[1280px]">
      <div className="mb-6">
        <span className="font-mono text-[11px] tracking-[0.14em] text-blue-600 uppercase block mb-1.5">Network Analysis</span>
        <h1 className="font-display text-[27px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Fraud Rings</h1>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '280px 1fr' }}>
        <div className="space-y-2">
          {rings.map((ring) => (
            <button
              key={ring.ring_id}
              onClick={() => setSelectedRing(ring.ring_id)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                selectedRing === ring.ring_id
                  ? 'shadow-lg shadow-blue-500/5'
                  : 'hover:shadow-md hover:shadow-black/5'
              }`}
              style={selectedRing === ring.ring_id
                ? { background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }
                : { background: 'var(--off-white)', border: '1px solid var(--border)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke={selectedRing === ring.ring_id ? '#2563eb' : '#7b8494'} strokeWidth="1.8" className="w-4 h-4">
                    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                  </svg>
                  <span className="font-display font-semibold text-[13.5px]" style={{ color: 'var(--text-primary)' }}>Ring #{ring.ring_id}</span>
                </div>
                <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
                  ring.risk_level === 'high' ? 'bg-red-100/50 text-red-600' :
                  ring.risk_level === 'medium' ? 'bg-amber-100/50 text-amber-600' :
                  'bg-emerald-100/50 text-emerald-600'
                }`}>
                  {ring.risk_level?.toUpperCase()}
                </span>
              </div>
              <div className="font-mono text-[11px] mt-2 space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                <div>{ring.member_count} accounts · {ring.transaction_count} txns</div>
                <div>Avg risk: {ring.avg_risk_score} · Devices: {ring.shared_devices?.length || 0}</div>
              </div>
            </button>
          ))}
          {rings.length === 0 && (
            <div className="glass rounded-xl p-6 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--text-muted)' }}>
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
              </svg>
              <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No fraud rings detected yet.</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Start the WebSocket stream to detect rings.</p>
            </div>
          )}
        </div>

        <div className="glass rounded-xl overflow-hidden">
          <div className="px-[18px] py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="font-display font-semibold text-[13.5px] tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>
              {selectedRing ? `Ring #${selectedRing} Network` : 'Select a ring to visualize'}
            </span>
          </div>
          {graphData ? (
            <div className="relative">
              <canvas ref={canvasRef} className="w-full" style={{ background: 'rgba(255,255,255,0.2)' }} />
              <div className="absolute bottom-3 left-3 flex gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Low
                </span>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Medium
                </span>
                <span className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> High
                </span>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-[13px]" style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--text-muted)' }}>
              {selectedRing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Loading graph...
                </div>
              ) : 'Click a ring to view its network'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

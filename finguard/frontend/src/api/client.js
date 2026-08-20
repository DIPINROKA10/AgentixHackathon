const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = API_URL.replace('http', 'ws');

export async function fetchTransactions(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/transactions?${query}`);
  return res.json();
}

export async function fetchCases(params = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/api/cases?${query}`);
  return res.json();
}

export async function updateCaseStatus(caseId, status) {
  const res = await fetch(`${API_URL}/api/cases/${caseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return res.json();
}

export async function fetchRings() {
  const res = await fetch(`${API_URL}/api/rings`);
  return res.json();
}

export async function fetchRingGraph(ringId) {
  const res = await fetch(`${API_URL}/api/rings/${ringId}/graph`);
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_URL}/api/stats`);
  return res.json();
}

export function connectWebSocket(onMessage) {
  const wsUrl = WS_URL + '/ws/transactions';
  let ws;
  try {
    ws = new WebSocket(wsUrl);
  } catch (e) {
    console.error('WebSocket connection failed:', e);
    return { close: () => {} };
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };

  ws.onclose = () => {
    console.log('WebSocket closed. Reconnecting in 3s...');
    setTimeout(() => connectWebSocket(onMessage), 3000);
  };

  return ws;
}

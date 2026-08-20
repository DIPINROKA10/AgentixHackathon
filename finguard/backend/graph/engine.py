import networkx as nx
from community import community_louvain
from typing import Dict, List, Set, Tuple, Any
from collections import defaultdict


class FraudRingDetector:
    def __init__(self):
        self.graph = nx.Graph()
        self.account_data: Dict[str, Dict[str, Any]] = {}
        self.rings: Dict[int, Dict[str, Any]] = {}
        self._ring_counter = 0

    def add_transaction(self, tx: Dict[str, Any]):
        orig = tx.get("name_orig", "")
        dest = tx.get("name_dest", "")
        device = tx.get("device_id")
        ip = tx.get("ip_address")
        risk_score = tx.get("risk_score", 0)
        transaction_id = tx.get("id")

        self._update_account_data(orig, tx, "sender")
        self._update_account_data(dest, tx, "receiver")

        if device:
            self._add_link(orig, dest, "device", device, transaction_id, risk_score)
        if ip:
            self._add_link(orig, dest, "ip", ip, transaction_id, risk_score)

    def _update_account_data(self, account: str, tx: Dict[str, Any], role: str):
        if account not in self.account_data:
            self.account_data[account] = {
                "devices": set(),
                "ips": set(),
                "transactions": [],
                "role": role,
            }
        data = self.account_data[account]
        if tx.get("device_id"):
            data["devices"].add(tx["device_id"])
        if tx.get("ip_address"):
            data["ips"].add(tx["ip_address"])
        data["transactions"].append({
            "id": tx.get("id"),
            "amount": tx.get("amount", 0),
            "risk_score": tx.get("risk_score", 0),
            "tx_type": tx.get("tx_type", "unknown"),
        })

    def _add_link(self, orig: str, dest: str, link_type: str, link_value: str, tx_id: int, risk_score: int):
        if self.graph.has_edge(orig, dest):
            edge = self.graph[orig][dest]
            if link_type not in edge.get("link_types", []):
                edge["link_types"].append(link_type)
                edge["link_values"].append(link_value)
            edge["transaction_ids"].append(tx_id)
            edge["risk_score"] = max(edge.get("risk_score", 0), risk_score)
        else:
            self.graph.add_edge(orig, dest,
                link_types=[link_type],
                link_values=[link_value],
                transaction_ids=[tx_id],
                risk_score=risk_score,
            )

    def detect_rings(self) -> List[Dict[str, Any]]:
        if len(self.graph.nodes) < 2:
            return []

        try:
            partition = community_louvain.best_partition(
                self.graph, resolution=1.0, random_state=42
            )
        except Exception:
            return []

        communities = defaultdict(set)
        for node, comm_id in partition.items():
            communities[comm_id].add(node)

        self.rings.clear()
        self._ring_counter = 0

        for comm_id, members in communities.items():
            if len(members) < 2:
                continue

            risk_scores = []
            for member in members:
                if member in self.account_data:
                    for tx in self.account_data[member]["transactions"]:
                        risk_scores.append(tx.get("risk_score", 0))

            if not risk_scores:
                continue

            avg_risk = sum(risk_scores) / len(risk_scores)

            shared_devices = set()
            shared_ips = set()
            for member in members:
                if member in self.account_data:
                    shared_devices.update(self.account_data[member]["devices"])
                    shared_ips.update(self.account_data[member]["ips"])

            fraud_accounts = [
                acc for acc in members
                if acc in self.account_data and
                any(tx["risk_score"] >= 60 for tx in self.account_data[acc]["transactions"])
            ]

            if len(fraud_accounts) < 2:
                continue

            self._ring_counter += 1
            risk_level = "high" if avg_risk >= 70 else "medium" if avg_risk >= 50 else "low"

            ring = {
                "ring_id": self._ring_counter,
                "account_ids": list(members),
                "fraud_account_ids": fraud_accounts,
                "member_count": len(members),
                "shared_devices": list(shared_devices),
                "shared_ips": list(shared_ips),
                "avg_risk_score": round(avg_risk, 2),
                "risk_level": risk_level,
                "transaction_count": len([
                    tx for acc in members
                    if acc in self.account_data
                    for tx in self.account_data[acc]["transactions"]
                ]),
            }
            self.rings[self._ring_counter] = ring

        return list(self.rings.values())

    def get_ring_graph(self, ring_id: int) -> Dict[str, Any]:
        if ring_id not in self.rings:
            return {"nodes": [], "edges": []}

        ring = self.rings[ring_id]
        members = set(ring["account_ids"])

        nodes = []
        for member in members:
            data = self.account_data.get(member, {})
            total_amount = sum(tx["amount"] for tx in data.get("transactions", []))
            avg_risk = (
                sum(tx["risk_score"] for tx in data.get("transactions", [])) /
                max(len(data.get("transactions", [])), 1)
            )
            nodes.append({
                "id": member,
                "label": member[:12] + "...",
                "risk_score": round(avg_risk, 1),
                "total_amount": round(total_amount, 2),
                "device_count": len(data.get("devices", set())),
                "transaction_count": len(data.get("transactions", [])),
            })

        edges = []
        for u, v, data in self.graph.edges(data=True):
            if u in members and v in members:
                edges.append({
                    "from": u,
                    "to": v,
                    "link_types": data.get("link_types", []),
                    "link_values": data.get("link_values", []),
                    "transaction_count": len(data.get("transaction_ids", [])),
                    "risk_score": data.get("risk_score", 0),
                })

        return {"nodes": nodes, "edges": edges}

    def get_stats(self) -> Dict[str, Any]:
        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "total_rings": len(self.rings),
            "high_risk_rings": len([r for r in self.rings.values() if r["risk_level"] == "high"]),
        }

"use client";
import { useState, useEffect } from "react";
import { X, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  lead: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignModal({ lead, onClose, onSuccess }: Props) {
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState(lead.assignedTo?._id || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((d) => { if (d.success) setAgents(d.data); });
  }, []);

  async function handleAssign() {
    setLoading(true);
    const res = await fetch(`/api/leads/${lead._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: selectedAgent || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      toast.success("Lead assigned successfully!");
      onSuccess();
      onClose();
    } else {
      toast.error("Failed to assign lead");
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card animate-in" style={{ width: "400px", padding: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "#e2e8f0" }}>Assign Lead</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: "12px", background: "rgba(99,102,241,0.05)", borderRadius: "8px", marginBottom: "20px" }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#e2e8f0", fontWeight: "500" }}>{lead.name}</p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#64748b" }}>{lead.budgetFormatted} &bull; {lead.propertyInterest}</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "8px", fontWeight: "500", textTransform: "uppercase" }}>
            Select Agent
          </label>
          <select className="input" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent._id} value={agent._id}>
                {agent.name} ({agent.email})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "10px 20px", background: "none", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", color: "#94a3b8", cursor: "pointer" }}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleAssign} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <UserCheck size={15} />
            {loading ? "Assigning..." : "Assign Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

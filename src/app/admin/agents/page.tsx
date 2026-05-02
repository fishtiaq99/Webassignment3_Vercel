"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Users, UserCheck, UserX, Phone, Mail, Shield,
  RefreshCw, Search, ToggleLeft, ToggleRight, TrendingUp,
  Clock
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

interface Agent {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  leadCount?: number;
  highPriorityCount?: number;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leadStats, setLeadStats] = useState<
    Record<string, { total: number; high: number; inProgress: number }>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const [agentsRes, leadsRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/leads?limit=500"),
      ]);

      const agentsData = await agentsRes.json();
      const leadsData = await leadsRes.json();

      if (agentsData.success) {
        setAgents(agentsData.data);
      }

      if (leadsData.success) {
        const stats: Record<string, { total: number; high: number; inProgress: number }> = {};

        for (const lead of leadsData.data.leads || []) {
          const agentId = lead.assignedTo?._id || lead.assignedTo;
          if (!agentId) continue;

          if (!stats[agentId]) {
            stats[agentId] = { total: 0, high: 0, inProgress: 0 };
          }

          stats[agentId].total++;
          if (lead.priority === "High") stats[agentId].high++;
          if (lead.status === "In Progress") stats[agentId].inProgress++;
        }

        setLeadStats(stats);
      }
    } catch {
      toast.error("Failed to load agents");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  async function toggleAgent(agent: Agent) {
    setToggling(agent._id);
    try {
      const res = await fetch("/api/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent._id,
          isActive: !agent.isActive,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          `${agent.name} ${agent.isActive ? "deactivated" : "activated"}`
        );
        fetchAgents();
      } else {
        toast.error("Failed to update agent");
      }
    } catch {
      toast.error("Server error");
    }
    setToggling(null);
  }

  const filtered = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.phone || "").includes(search)
  );

  const totalActive = agents.filter((a) => a.isActive).length;
  const totalLeadsAssigned = Object.values(leadStats).reduce(
    (s, v) => s + v.total,
    0
  );

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#e2e8f0" }}>
            Agent Management
          </h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
            Manage and monitor your sales agents
          </p>
        </div>

        <button
          onClick={fetchAgents}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 14px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: "8px",
            color: "#818cf8",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <p style={{ color: "#64748b" }}>Loading...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "16px",
          }}
        >
          {filtered.map((agent) => {
            const stats = leadStats[agent._id] || {
              total: 0,
              high: 0,
              inProgress: 0,
            };

            const isToggling = toggling === agent._id;

            // ✅ SAFE DATE FIX
            const createdDate = new Date(agent.createdAt);
            const safeDate =
              agent.createdAt && !isNaN(createdDate.getTime())
                ? formatDistanceToNow(createdDate, { addSuffix: true })
                : "Recently";

            return (
              <div
                key={agent._id}
                className="card"
                style={{ padding: "24px", opacity: agent.isActive ? 1 : 0.6 }}
              >
                {/* HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "#4f46e5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      {agent.name.charAt(0)}
                    </div>

                    <div>
                      <div style={{ color: "#e2e8f0", fontWeight: 600 }}>
                        {agent.name}
                      </div>

                      <div style={{ fontSize: "12px", color: "#10b981" }}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleAgent(agent)}
                    disabled={isToggling}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    {agent.isActive ? (
                      <ToggleRight color="#10b981" />
                    ) : (
                      <ToggleLeft color="#64748b" />
                    )}
                  </button>
                </div>

                {/* EMAIL */}
                <div style={{ marginTop: 10, color: "#94a3b8", fontSize: "13px" }}>
                  {agent.email}
                </div>

                {/* STATS */}
                <div style={{ marginTop: 12, color: "#94a3b8", fontSize: "13px" }}>
                  Leads: {stats.total} | High: {stats.high} | In Progress:{" "}
                  {stats.inProgress}
                </div>

                {/* FOOTER */}
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#64748b",
                    fontSize: "12px",
                  }}
                >
                  <Clock size={12} />
                  Joined {safeDate}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
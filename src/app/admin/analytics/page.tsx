"use client";
import { useState, useEffect } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, RefreshCw } from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = { High: "#ef4444", Medium: "#f59e0b", Low: "#10b981" };
const STATUS_COLORS = ["#6366f1", "#3b82f6", "#f59e0b", "#10b981", "#ef4444"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function fetchAnalytics() {
    setLoading(true);
    const res = await fetch("/api/analytics");
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) return (
    <div style={{ padding: "32px", textAlign: "center", color: "#64748b", paddingTop: "100px" }}>
      <RefreshCw size={24} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
      <p>Loading analytics...</p>
    </div>
  );

  const monthlyData = data?.monthlyTrend?.map((m: any) => ({
    name: MONTHS[m._id.month - 1],
    Leads: m.count,
  }));

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#e2e8f0" }}>Analytics</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Insights & performance overview</p>
        </div>
        <button
          onClick={fetchAnalytics}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", color: "#818cf8", cursor: "pointer", fontSize: "13px" }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Top Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Leads", value: data?.totalLeads, color: "#6366f1" },
          { label: "Unassigned Leads", value: data?.unassignedLeads, color: "#f59e0b" },
          { label: "Overdue Follow-ups", value: data?.overdueFollowups, color: "#ef4444" },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card" style={{ padding: "24px" }}>
            <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "8px" }}>{label}</div>
            <div style={{ fontSize: "40px", fontWeight: "700", color }}>{value ?? "—"}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {/* Lead Status Pie */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "600", color: "#e2e8f0" }}>
            Lead Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data?.statusDistribution?.map((s: any) => ({ name: s._id, value: s.count }))}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data?.statusDistribution?.map((_: any, i: number) => (
                  <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1a35", border: "1px solid rgba(99,102,241,0.3)", color: "#e2e8f0" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Bar */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "600", color: "#e2e8f0" }}>
            Priority Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.priorityDistribution?.map((p: any) => ({ name: p._id, count: p.count }))}>
              <XAxis dataKey="name" stroke="#475569" fontSize={12} />
              <YAxis stroke="#475569" fontSize={12} />
              <Tooltip contentStyle={{ background: "#1a1a35", border: "1px solid rgba(99,102,241,0.3)", color: "#e2e8f0" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {data?.priorityDistribution?.map((p: any, i: number) => (
                  <Cell key={i} fill={PRIORITY_COLORS[p._id] || "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: "600", color: "#e2e8f0" }}>
          Monthly Lead Trend
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="name" stroke="#475569" fontSize={12} />
            <YAxis stroke="#475569" fontSize={12} />
            <Tooltip contentStyle={{ background: "#1a1a35", border: "1px solid rgba(99,102,241,0.3)", color: "#e2e8f0" }} />
            <Line type="monotone" dataKey="Leads" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Agent Performance */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(99,102,241,0.15)" }}>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#e2e8f0" }}>
            Agent Performance
          </h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(99,102,241,0.05)" }}>
                {["Agent", "Email", "Total Leads", "Closed", "High Priority", "Conversion Rate"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.agentPerformance?.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#475569" }}>No agent data yet</td>
                </tr>
              ) : data?.agentPerformance?.map((agent: any) => (
                <tr key={agent._id} className="table-row">
                  <td style={{ padding: "14px 16px", fontWeight: "500", color: "#e2e8f0" }}>{agent.name}</td>
                  <td style={{ padding: "14px 16px", color: "#64748b", fontSize: "13px" }}>{agent.email}</td>
                  <td style={{ padding: "14px 16px", color: "#6366f1", fontWeight: "600" }}>{agent.totalLeads}</td>
                  <td style={{ padding: "14px 16px", color: "#10b981", fontWeight: "600" }}>{agent.closedLeads}</td>
                  <td style={{ padding: "14px 16px", color: "#ef4444", fontWeight: "600" }}>{agent.highPriority}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, height: "6px", background: "rgba(99,102,241,0.1)", borderRadius: "3px" }}>
                        <div style={{ width: `${Math.min(agent.conversionRate, 100)}%`, height: "100%", background: "#6366f1", borderRadius: "3px" }} />
                      </div>
                      <span style={{ color: "#94a3b8", fontSize: "13px", minWidth: "40px" }}>
                        {agent.conversionRate?.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Users, AlertTriangle, Calendar, Clock, MessageCircle, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusClass: Record<string, string> = {
  New: "status-new",
  Contacted: "status-contacted",
  "In Progress": "status-in-progress",
  Closed: "status-closed",
  Lost: "status-lost",
};

export default function AgentDashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [followups, setFollowups] = useState<any>({ overdue: [], upcoming: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [leadsRes, followupsRes] = await Promise.all([
        fetch("/api/leads?limit=10"),
        fetch("/api/followups"),
      ]);
      const [leadsData, followupsData] = await Promise.all([
        leadsRes.json(),
        followupsRes.json(),
      ]);
      if (leadsData.success) setLeads(leadsData.data.leads);
      if (followupsData.success) setFollowups(followupsData.data);
      setLoading(false);
    }
    fetchData();

    // Poll every 20 seconds
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  function openWhatsApp(phone: string) {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "92");
    window.open(`https://wa.me/${clean}`, "_blank");
  }

  const highPriority = leads.filter((l) => l.priority === "High").length;
  const overdueCount = followups.overdue?.length || 0;
  const upcomingCount = followups.upcoming?.length || 0;

  const stats = [
    { label: "My Leads", value: leads.length, icon: Users, color: "#6366f1", bg: "rgba(99,102,241,0.15)", href: "/agent/leads" },
    { label: "High Priority", value: highPriority, icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.15)", href: "/agent/leads" },
    { label: "Overdue Follow-ups", value: overdueCount, icon: Clock, color: "#f59e0b", bg: "rgba(245,158,11,0.15)", href: "/agent/followups" },
    { label: "Upcoming Follow-ups", value: upcomingCount, icon: Calendar, color: "#10b981", bg: "rgba(16,185,129,0.15)", href: "/agent/followups" },
  ];

  return (
    <div style={{ padding: "32px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "700", color: "#e2e8f0" }}>
          My Dashboard
        </h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
          Your assigned leads and follow-ups
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            <div
              className="stat-card"
              style={{ padding: "24px", cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 8px", fontWeight: "500" }}>{label}</p>
                  <p style={{ fontSize: "36px", fontWeight: "700", color, margin: 0, lineHeight: 1 }}>
                    {loading ? "—" : value}
                  </p>
                </div>
                <div style={{ width: "44px", height: "44px", background: bg, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={color} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px" }}>
        {/* My Leads Table */}
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(99,102,241,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#e2e8f0" }}>My Leads</h2>
            <Link href="/agent/leads">
              <button style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "none", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", color: "#818cf8", cursor: "pointer", fontSize: "12px" }}>
                View All <ArrowRight size={12} />
              </button>
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading...</div>
          ) : leads.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#475569" }}>
              <Users size={32} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p>No leads assigned to you yet.</p>
              <p style={{ fontSize: "13px" }}>Contact your admin to get leads assigned.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(99,102,241,0.05)" }}>
                  {["Client", "Phone", "Property", "Budget", "Priority", "Status", "Actions"].map((h) => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} className="table-row">
                    <td style={{ padding: "14px" }}>
                      <Link href={`/agent/leads/${lead._id}`} style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: "500", fontSize: "14px" }}>
                        {lead.name}
                      </Link>
                    </td>
                    <td style={{ padding: "14px", color: "#94a3b8", fontSize: "13px" }}>{lead.phone}</td>
                    <td style={{ padding: "14px", color: "#94a3b8", fontSize: "13px" }}>{lead.propertyInterest}</td>
                    <td style={{ padding: "14px", color: "#94a3b8", fontSize: "13px" }}>{lead.budgetFormatted}</td>
                    <td style={{ padding: "14px" }}>
                      <span className={`badge-${lead.priority?.toLowerCase()}`} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                        {lead.priority}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span className={statusClass[lead.status]} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px" }}>
                        {lead.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <button
                        onClick={() => openWhatsApp(lead.phone)}
                        title="Open WhatsApp"
                        style={{ padding: "6px", background: "rgba(16,185,129,0.1)", border: "none", borderRadius: "6px", color: "#10b981", cursor: "pointer" }}
                      >
                        <MessageCircle size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Follow-up Alerts */}
        <div>
          {/* Overdue */}
          {overdueCount > 0 && (
            <div className="card" style={{ padding: "20px", marginBottom: "16px", borderColor: "rgba(239,68,68,0.3)" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "600", color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} /> Overdue Follow-ups ({overdueCount})
              </h3>
              {followups.overdue.slice(0, 4).map((lead: any) => (
                <Link key={lead._id} href={`/agent/leads/${lead._id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(239,68,68,0.05)", marginBottom: "8px", cursor: "pointer" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#e2e8f0", fontWeight: "500" }}>{lead.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#ef4444" }}>
                      Overdue: {formatDistanceToNow(new Date(lead.followUpDate), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Upcoming */}
          {upcomingCount > 0 && (
            <div className="card" style={{ padding: "20px", borderColor: "rgba(16,185,129,0.3)" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "600", color: "#10b981", display: "flex", alignItems: "center", gap: "6px" }}>
                <Calendar size={14} /> Upcoming (next 3 days)
              </h3>
              {followups.upcoming.slice(0, 4).map((lead: any) => (
                <Link key={lead._id} href={`/agent/leads/${lead._id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "10px", borderRadius: "8px", background: "rgba(16,185,129,0.05)", marginBottom: "8px", cursor: "pointer" }}>
                    <p style={{ margin: 0, fontSize: "13px", color: "#e2e8f0", fontWeight: "500" }}>{lead.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#10b981" }}>
                      {formatDistanceToNow(new Date(lead.followUpDate), { addSuffix: true })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {overdueCount === 0 && upcomingCount === 0 && !loading && (
            <div className="card" style={{ padding: "30px", textAlign: "center", color: "#475569" }}>
              <Calendar size={28} style={{ marginBottom: "10px", opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: "13px" }}>No follow-ups scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

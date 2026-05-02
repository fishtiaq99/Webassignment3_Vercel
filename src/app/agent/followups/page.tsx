"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Clock, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

export default function AgentFollowupsPage() {
  const [data, setData] = useState<any>({ overdue: [], upcoming: [], stale: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/followups")
      .then((r) => r.json())
      .then((d) => { if (d.success) setData(d.data); setLoading(false); });
  }, []);

  const Section = ({ title, leads, icon: Icon, color, emptyMsg }: any) => (
    <div className="card" style={{ marginBottom: "20px", overflow: "hidden" }}>
      <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", gap: "8px" }}>
        <Icon size={16} color={color} />
        <h2 style={{ margin: 0, fontSize: "15px", fontWeight: "600", color }}>
          {title} <span style={{ color: "#64748b", fontWeight: "400" }}>({leads.length})</span>
        </h2>
      </div>
      {leads.length === 0 ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#475569", fontSize: "13px" }}>{emptyMsg}</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(99,102,241,0.05)" }}>
              {["Client", "Phone", "Property", "Budget", "Follow-up Date", "Priority"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: "600" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((lead: any) => (
              <tr key={lead._id} className="table-row">
                <td style={{ padding: "14px 16px" }}>
                  <Link href={`/agent/leads/${lead._id}`} style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: "500" }}>{lead.name}</Link>
                </td>
                <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{lead.phone}</td>
                <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{lead.propertyInterest}</td>
                <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{lead.budgetFormatted}</td>
                <td style={{ padding: "14px 16px", fontSize: "13px" }}>
                  {lead.followUpDate ? (
                    <span style={{ color }}>
                      {format(new Date(lead.followUpDate), "MMM d, yyyy p")}
                      <br />
                      <span style={{ fontSize: "11px", opacity: 0.8 }}>
                        {formatDistanceToNow(new Date(lead.followUpDate), { addSuffix: true })}
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: "#475569" }}>No follow-up set</span>
                  )}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span className={`badge-${lead.priority?.toLowerCase()}`} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                    {lead.priority}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#e2e8f0" }}>Follow-up Tracker</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>Track overdue and upcoming follow-ups</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", paddingTop: "60px" }}>Loading follow-ups...</div>
      ) : (
        <>
          <Section title="Overdue Follow-ups" leads={data.overdue} icon={AlertTriangle} color="#ef4444" emptyMsg="No overdue follow-ups. Great work!" />
          <Section title="Upcoming (Next 3 Days)" leads={data.upcoming} icon={Calendar} color="#10b981" emptyMsg="No follow-ups in the next 3 days." />
          <Section title="Stale Leads (No activity for 7+ days)" leads={data.stale} icon={Clock} color="#f59e0b" emptyMsg="No stale leads. All leads are active!" />
        </>
      )}
    </div>
  );
}

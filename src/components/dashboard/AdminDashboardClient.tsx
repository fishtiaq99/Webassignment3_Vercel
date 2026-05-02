"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  AlertTriangle,
  UserX,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Props {
  stats: {
    totalLeads: number;
    totalAgents: number;
    highPriority: number;
    unassigned: number;
  };
  recentLeads: any[];
}

const priorityColor = {
  High: "#ef4444",
  Medium: "#f59e0b",
  Low: "#10b981",
};

const statusClass: Record<string, string> = {
  New: "status-new",
  Contacted: "status-contacted",
  "In Progress": "status-in-progress",
  Closed: "status-closed",
  Lost: "status-lost",
};

export default function AdminDashboardClient({ stats, recentLeads }: Props) {
  const [leads, setLeads] = useState(recentLeads);
  const [time, setTime] = useState(new Date());

  // Polling for real-time updates every 15 seconds
  useEffect(() => {
    const poll = setInterval(async () => {
      const res = await fetch("/api/leads?limit=8");
      const data = await res.json();
      if (data.success) setLeads(data.data.leads);
      setTime(new Date());
    }, 15000);
    return () => clearInterval(poll);
  }, []);

  const statCards = [
    {
      label: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      color: "#6366f1",
      bg: "rgba(99,102,241,0.15)",
      href: "/admin/leads",
    },
    {
      label: "Active Agents",
      value: stats.totalAgents,
      icon: UserCheck,
      color: "#10b981",
      bg: "rgba(16,185,129,0.15)",
      href: "/admin/agents",
    },
    {
      label: "High Priority",
      value: stats.highPriority,
      icon: AlertTriangle,
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
      href: "/admin/leads?priority=High",
    },
    {
      label: "Unassigned",
      value: stats.unassigned,
      icon: UserX,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
      href: "/admin/leads?assignedTo=none",
    },
  ];

  return (
    <div style={{ padding: "32px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#e2e8f0", margin: 0 }}>
            Admin Dashboard
          </h1>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>
            Live overview &bull; Last updated {formatDistanceToNow(time, { addSuffix: true })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/admin/analytics">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "8px",
                color: "#818cf8",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
              }}
            >
              <TrendingUp size={16} />
              Analytics
            </button>
          </Link>
          <Link href="/admin/leads">
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Plus size={16} />
              New Lead
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} style={{ textDecoration: "none" }}>
            <div
              className="stat-card"
              style={{
                padding: "24px",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 8px", fontWeight: "500" }}>
                    {label}
                  </p>
                  <p style={{ fontSize: "36px", fontWeight: "700", color, margin: 0, lineHeight: 1 }}>
                    {value}
                  </p>
                </div>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    background: bg,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={20} color={color} />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Leads Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(99,102,241,0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: "#e2e8f0" }}>
              Recent Leads
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Auto-refreshing every 15 seconds
            </p>
          </div>
          <Link href="/admin/leads">
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                background: "none",
                border: "1px solid rgba(99,102,241,0.3)",
                borderRadius: "6px",
                color: "#818cf8",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              View All <ArrowRight size={12} />
            </button>
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(99,102,241,0.05)" }}>
                {["Lead Name", "Phone", "Property", "Budget", "Priority", "Status", "Assigned To", "Time"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="table-row">
                  <td style={{ padding: "14px 16px" }}>
                    <Link href={`/admin/leads/${lead._id}`} style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: "500", fontSize: "14px" }}>
                      {lead.name}
                    </Link>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{lead.phone}</td>
                  <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{lead.propertyInterest}</td>
                  <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>{lead.budgetFormatted}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      className={`badge-${lead.priority?.toLowerCase()}`}
                      style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}
                    >
                      {lead.priority}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      className={statusClass[lead.status] || "status-new"}
                      style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "500" }}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#94a3b8", fontSize: "13px" }}>
                    {lead.assignedTo?.name || <span style={{ color: "#475569" }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#475569", fontSize: "12px" }}>
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                    </span>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#475569" }}>
                    No leads yet. Add your first lead!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

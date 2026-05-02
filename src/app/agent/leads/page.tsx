"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, RefreshCw, MessageCircle, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import LeadFormModal from "@/components/leads/LeadFormModal";

const statusClass: Record<string, string> = {
  New: "status-new",
  Contacted: "status-contacted",
  "In Progress": "status-in-progress",
  Closed: "status-closed",
  Lost: "status-lost",
};

export default function AgentLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editLead, setEditLead] = useState<any>(null);
  const [filters, setFilters] = useState({ status: "", priority: "", search: "" });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: "15",
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.search && { search: filters.search }),
    });
    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    if (data.success) {
      setLeads(data.data.leads);
      setPagination(data.data.pagination);
    }
    setLoading(false);
  }, [filters, pagination.page]);

  useEffect(() => { fetchLeads(); }, []);
  useEffect(() => {
    const t = setTimeout(fetchLeads, 400);
    return () => clearTimeout(t);
  }, [filters]);
  useEffect(() => {
    const interval = setInterval(fetchLeads, 20000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  async function quickUpdateStatus(leadId: string, status: string) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Status updated to ${status}`);
      fetchLeads();
    } else toast.error("Failed to update status");
  }

  function openWhatsApp(phone: string) {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "92");
    window.open(`https://wa.me/${clean}`, "_blank");
  }

  return (
    <div style={{ padding: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#e2e8f0" }}>My Leads</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>{pagination.total} leads assigned to you</p>
        </div>
        <button
          onClick={fetchLeads}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "8px", color: "#818cf8", cursor: "pointer", fontSize: "13px" }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "16px 20px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              className="input"
              placeholder="Search by name, phone..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ paddingLeft: "32px", height: "38px" }}
            />
          </div>
          <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ width: "150px", height: "38px" }}>
            <option value="">All Status</option>
            {["New", "Contacted", "In Progress", "Closed", "Lost"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })} style={{ width: "140px", height: "38px" }}>
            <option value="">All Priority</option>
            {["High", "Medium", "Low"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(99,102,241,0.05)" }}>
                {["Client", "Phone", "Property Interest", "Budget", "Priority", "Status", "Added", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading leads...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: "60px", textAlign: "center", color: "#475569" }}>No leads found. Contact your admin to get leads assigned.</td></tr>
              ) : leads.map((lead) => (
                <tr key={lead._id} className="table-row">
                  <td style={{ padding: "14px" }}>
                    <Link href={`/agent/leads/${lead._id}`} style={{ color: "#e2e8f0", textDecoration: "none", fontWeight: "500", fontSize: "14px" }}>
                      {lead.name}
                    </Link>
                    {lead.email && <div style={{ fontSize: "12px", color: "#64748b" }}>{lead.email}</div>}
                  </td>
                  <td style={{ padding: "14px", color: "#94a3b8", fontSize: "13px" }}>{lead.phone}</td>
                  <td style={{ padding: "14px", color: "#94a3b8", fontSize: "13px" }}>{lead.propertyInterest}</td>
                  <td style={{ padding: "14px", color: "#94a3b8", fontSize: "13px", whiteSpace: "nowrap" }}>{lead.budgetFormatted}</td>
                  <td style={{ padding: "14px" }}>
                    <span className={`badge-${lead.priority?.toLowerCase()}`} style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600" }}>
                      {lead.priority}
                    </span>
                  </td>
                  <td style={{ padding: "14px" }}>
                    {/* Inline status updater */}
                    <select
                      value={lead.status}
                      onChange={(e) => quickUpdateStatus(lead._id, e.target.value)}
                      style={{
                        background: "rgba(99,102,241,0.1)",
                        border: "1px solid rgba(99,102,241,0.2)",
                        borderRadius: "20px",
                        color: "#e2e8f0",
                        padding: "3px 8px",
                        fontSize: "11px",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {["New", "Contacted", "In Progress", "Closed", "Lost"].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: "14px", color: "#475569", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true })}
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => openWhatsApp(lead.phone)}
                        title="WhatsApp"
                        style={{ padding: "6px", background: "rgba(16,185,129,0.1)", border: "none", borderRadius: "6px", color: "#10b981", cursor: "pointer" }}
                      >
                        <MessageCircle size={14} />
                      </button>
                      <button
                        onClick={() => setEditLead(lead)}
                        title="Edit Notes"
                        style={{ padding: "6px", background: "rgba(245,158,11,0.1)", border: "none", borderRadius: "6px", color: "#f59e0b", cursor: "pointer" }}
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(99,102,241,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Page {pagination.page} of {pagination.totalPages}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button disabled={pagination.page <= 1} onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })} style={{ padding: "6px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", color: pagination.page <= 1 ? "#475569" : "#818cf8", cursor: pagination.page <= 1 ? "not-allowed" : "pointer" }}>
                Previous
              </button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })} style={{ padding: "6px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "6px", color: pagination.page >= pagination.totalPages ? "#475569" : "#818cf8", cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer" }}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {editLead && <LeadFormModal lead={editLead} onClose={() => setEditLead(null)} onSuccess={fetchLeads} />}
    </div>
  );
}

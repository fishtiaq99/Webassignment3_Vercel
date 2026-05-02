"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Building2,
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  Bell,
  Calendar,
  LogOut,
  Settings,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const adminNav: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "All Leads", icon: Users },
  { href: "/admin/agents", label: "Agents", icon: UserCheck },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/followups", label: "Follow-ups", icon: Calendar },
];

const agentNav: NavItem[] = [
  { href: "/agent", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agent/leads", label: "My Leads", icon: Users },
  { href: "/agent/followups", label: "Follow-ups", icon: Calendar },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : agentNav;

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "rgba(13,13,26,0.95)",
        borderRight: "1px solid rgba(99,102,241,0.15)",
        display: "flex",
        flexDirection: "column",
        padding: "20px 12px",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Logo */}
      <div style={{ padding: "8px 4px 24px", borderBottom: "1px solid rgba(99,102,241,0.15)", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
            }}
          >
            <Building2 size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "14px", color: "#e2e8f0" }}>PropertyCRM</div>
            <div style={{ fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              {isAdmin ? "Admin Panel" : "Agent Portal"}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        <div style={{ fontSize: "11px", color: "#475569", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase", padding: "0 4px 8px" }}>
          Navigation
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/admin" && href !== "/agent" && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`sidebar-link ${isActive ? "active" : ""}`} style={{ marginBottom: "2px" }}>
              <Icon size={17} />
              <span>{label}</span>
              {isActive && <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div
        style={{
          borderTop: "1px solid rgba(99,102,241,0.15)",
          paddingTop: "16px",
          marginTop: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px",
            borderRadius: "8px",
            background: "rgba(99,102,241,0.05)",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #4f46e5, #818cf8)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "13px",
              fontWeight: "700",
              color: "white",
            }}
          >
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.name}
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", textTransform: "capitalize" }}>
              {user?.role}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link"
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

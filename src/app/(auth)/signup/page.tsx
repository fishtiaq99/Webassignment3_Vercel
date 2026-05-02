"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Building2, Mail, Lock, User, Phone } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "agent",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!data.success) {
      toast.error(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    toast.success("Account created! Please sign in.");
    router.push("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at bottom right, #1e1b4b 0%, #0d0d1a 50%, #0d0d1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div className="animate-in" style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "linear-gradient(135deg, #4f46e5, #6366f1)",
              borderRadius: "16px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
            }}
          >
            <Building2 size={32} color="white" />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#e2e8f0", margin: 0 }}>
            Create Account
          </h1>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "14px" }}>
            Join PropertyCRM today
          </p>
        </div>

        <div className="card" style={{ padding: "36px", background: "rgba(26,26,53,0.8)", backdropFilter: "blur(20px)" }}>
          <form onSubmit={handleSubmit}>
            {[
              { label: "Full Name", key: "name", type: "text", icon: User, placeholder: "John Ahmed" },
              { label: "Email", key: "email", type: "email", icon: Mail, placeholder: "john@example.com" },
              { label: "Phone", key: "phone", type: "tel", icon: Phone, placeholder: "03001234567" },
              { label: "Password", key: "password", type: "password", icon: Lock, placeholder: "Min. 6 characters" },
            ].map(({ label, key, type, icon: Icon, placeholder }) => (
              <div key={key} style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>
                  {label}
                </label>
                <div style={{ position: "relative" }}>
                  <Icon size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                  <input
                    className="input"
                    type={type}
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                    style={{ paddingLeft: "38px" }}
                  />
                </div>
              </div>
            ))}

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>
                Role
              </label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="agent">Agent</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", fontSize: "15px", padding: "12px" }}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "500" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

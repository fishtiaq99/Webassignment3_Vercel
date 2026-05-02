"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Welcome back!");
    router.push("/");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at top left, #1e1b4b 0%, #0d0d1a 50%, #0d0d1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
          pointerEvents: "none",
        }}
      />

      <div className="animate-in" style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
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
            PropertyCRM
          </h1>
          <p style={{ color: "#64748b", marginTop: "8px", fontSize: "14px" }}>
            Pakistan&apos;s #1 Real Estate Lead Manager
          </p>
        </div>

        {/* Card */}
        <div
          className="card"
          style={{
            padding: "36px",
            background: "rgba(26,26,53,0.8)",
            backdropFilter: "blur(20px)",
          }}
        >
          <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "24px", color: "#e2e8f0" }}>
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>
                Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  className="input"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  style={{ paddingLeft: "38px" }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
                <input
                  className="input"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  style={{ paddingLeft: "38px", paddingRight: "38px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", fontSize: "15px", padding: "12px" }}
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "#64748b" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "500" }}>
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "rgba(99,102,241,0.1)",
            borderRadius: "8px",
            border: "1px solid rgba(99,102,241,0.2)",
            fontSize: "12px",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          <strong style={{ color: "#818cf8" }}>Demo:</strong> Create an account with role &quot;admin&quot; first
        </div>
      </div>
    </div>
  );
}

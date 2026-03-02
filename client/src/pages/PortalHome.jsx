import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { clearSession } from "../services/auth";
import DashboardShell from "../components/DashboardShell";

function roleToRoute(role) {
  if (role === "PATIENT") return "/patient";
  if (role === "BLOOD_DONOR") return "/donor";
  if (role === "APPLICANT") return "/applicant";
  if (role === "ADMIN") return "/admin";
  if (role === "DOCTOR") return "/doctor";
  if (role === "NURSE") return "/nurse";
  if (role === "IT" || role === "ITWORKER") return "/it";
  return "/";
}

export default function PortalHome() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");

  const role = localStorage.getItem("mhms_role") || "";

  useEffect(() => {
    let mounted = true;
    api.get("/auth/me")
      .then((r) => mounted && setMe(r.data))
      .catch((e) => mounted && setErr(e?.response?.data?.message || "Failed to load session"));
    return () => (mounted = false);
  }, []);

  return (
    <DashboardShell
      title="Portal"
      subtitle="Quick access to your dashboard and system modules"
      role={role}
      accent="slate"
      onHome={() => nav("/app")}
      onLogout={() => {
        clearSession();
        nav("/login", { replace: true });
      }}
    >
      {err && (
        <div style={{ padding: 14, borderRadius: 12, background: "#fee2e2", color: "#991b1b", fontWeight: 800 }}>
          {err}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 14 }}>
        <Card
          title="Go to my dashboard"
          text={`Role: ${role || "Unknown"}`}
          cta="Open dashboard"
          onClick={() => nav(roleToRoute(role))}
        />
        <Card
          title="Public Website"
          text="View departments, doctors, contact page."
          cta="Open public site"
          onClick={() => nav("/public")}
        />
        <Card
          title="Logout"
          text="Clear session & return to login."
          cta="Logout"
          onClick={() => {
            clearSession();
            nav("/login", { replace: true });
          }}
        />
      </div>

      <div style={{ height: 14 }} />

      <div style={{ padding: 16, borderRadius: 16, border: "1px solid #e5e7eb", background: "white" }}>
        <div style={{ fontWeight: 950, fontSize: 16, marginBottom: 6 }}>Session snapshot</div>
        <div style={{ color: "#6b7280", fontWeight: 700 }}>
          {me?.user?.email ? (
            <>
              Logged in as <b>{me.user.email}</b> • role <b>{me.user.role}</b>
            </>
          ) : (
            "Loading..."
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function Card({ title, text, cta, onClick }) {
  return (
    <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}>
      <div style={{ fontWeight: 950, fontSize: 16 }}>{title}</div>
      <div style={{ marginTop: 6, color: "#6b7280", fontWeight: 700 }}>{text}</div>
      <button
        onClick={onClick}
        style={{
          marginTop: 12,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1px solid #dbeafe",
          background: "#eff6ff",
          color: "#1d4ed8",
          fontWeight: 950,
          cursor: "pointer",
        }}
      >
        {cta}
      </button>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { clearSession } from "../services/auth";

export default function DashboardShell({ title, subtitle, children }) {
  const nav = useNavigate();

  return (
    <div style={{ minHeight: "100%", display: "grid", gridTemplateColumns: "260px 1fr" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #e5e7eb", background: "#ffffff" }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>MHMS</div>
        <div className="small" style={{ marginTop: 4 }}>Modern Hospital</div>

        <div style={{ height: 14 }} />

        {/* ✅ go to portal, not "/" */}
        <button className="btn btnSecondary" style={{ width: "100%" }} onClick={() => nav("/portal")}>
          Home
        </button>

        <div style={{ height: 10 }} />

        <button
          className="btn btnSecondary"
          style={{ width: "100%" }}
          onClick={() => {
            clearSession();
            nav("/public", { replace: true });
          }}
        >
          Logout
        </button>

        <div style={{ height: 18 }} />
        <div className="small">
          Role: <b>{localStorage.getItem("mhms_role") || "-"}</b>
        </div>
      </aside>

      <main style={{ padding: 20 }}>
        <div className="container">
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{title}</div>
            {subtitle ? <div className="small">{subtitle}</div> : null}
          </div>

          <div style={{ height: 14 }} />
          {children}
        </div>
      </main>
    </div>
  );
}

/*
import { useNavigate } from "react-router-dom";
import { clearSession } from "../services/auth";

export default function DashboardShell({ title, subtitle, children }) {
  const nav = useNavigate();

  return (
    <div style={{ minHeight: "100%", display: "grid", gridTemplateColumns: "260px 1fr" }}>
      <aside style={{ padding: 16, borderRight: "1px solid #e5e7eb", background: "#ffffff" }}>
        <div style={{ fontWeight: 900, fontSize: 16 }}>MHMS</div>
        <div className="small" style={{ marginTop: 4 }}>Modern Hospital</div>

        <div style={{ height: 14 }} />

        <button className="btn btnSecondary" style={{ width: "100%" }} onClick={() => nav("/")}>
          Home
        </button>

        <div style={{ height: 10 }} />

        <button
          className="btn btnSecondary"
          style={{ width: "100%" }}
          onClick={() => {
            clearSession();
            nav("/");
          }}
        >
          Logout
        </button>

        <div style={{ height: 18 }} />
        <div className="small">
          Role: <b>{localStorage.getItem("mhms_role") || "-"}</b>
        </div>
      </aside>

      <main style={{ padding: 20 }}>
        <div className="container">
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 900 }}>{title}</div>
            {subtitle ? <div className="small">{subtitle}</div> : null}
          </div>

          <div style={{ height: 14 }} />
          {children}
        </div>
      </main>
    </div>
  );
}
*/
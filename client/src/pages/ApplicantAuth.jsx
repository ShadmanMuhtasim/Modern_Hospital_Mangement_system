import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { applyJob, loginAny } from "../services/auth";

const ROLES = ["DOCTOR", "NURSE", "IT", "STAFF"];

export default function ApplicantAuth() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const startMode = sp.get("mode") || "apply";
  const [mode, setMode] = useState(startMode);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [applyForm, setApplyForm] = useState({
    fullName: "", email: "", password: "", roleAppliedFor: "NURSE",
  });

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const applyDisabled = useMemo(() => !applyForm.fullName || !applyForm.email || !applyForm.password || !applyForm.roleAppliedFor, [applyForm]);

  async function onApply(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await applyJob(applyForm);
      setMode("login");
      setLoginForm({ email: applyForm.email, password: "" });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Apply failed");
    } finally {
      setLoading(false);
    }
  }

  async function onLogin(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const data = await loginAny(loginForm.email, loginForm.password);
      const role = data.user.role;
      if (role === "APPLICANT") return nav("/applicant", { replace: true });
      if (role === "NURSE") return nav("/nurse", { replace: true });
      if (role === "DOCTOR") return nav("/doctor", { replace: true });
      if (role === "IT") return nav("/it", { replace: true });
      if (role === "STAFF") return nav("/staff", { replace: true });
      setErr("This account is not an applicant/staff account.");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 28 }}>
      <div className="container">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div className="badge">Job Seeker</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                {mode === "apply" ? "Apply for Job" : "Applicant Login"}
              </div>
              <div className="small">Apply uses /api/applications/apply • Login uses /api/auth/login</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className={`btn ${mode==="apply" ? "" : "btnSecondary"}`} onClick={() => setMode("apply")}>Apply</button>
              <button className={`btn ${mode==="login" ? "" : "btnSecondary"}`} onClick={() => setMode("login")}>Login</button>
            </div>
          </div>

          <div style={{ height: 14 }} />

          {mode === "apply" ? (
            <form className="row" onSubmit={onApply}>
              <input className="input" placeholder="Full name" value={applyForm.fullName}
                     onChange={(e)=>setApplyForm(p=>({ ...p, fullName: e.target.value }))} />
              <select className="input" value={applyForm.roleAppliedFor}
                      onChange={(e)=>setApplyForm(p=>({ ...p, roleAppliedFor: e.target.value }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <input className="input" placeholder="Email" value={applyForm.email}
                     onChange={(e)=>setApplyForm(p=>({ ...p, email: e.target.value }))} />
              <input className="input" type="password" placeholder="Password" value={applyForm.password}
                     onChange={(e)=>setApplyForm(p=>({ ...p, password: e.target.value }))} />
              {err ? <div style={{ color: "#b91c1c", fontWeight: 700 }}>{err}</div> : null}
              <button className="btn" disabled={loading || applyDisabled} type="submit">
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          ) : (
            <form className="row" onSubmit={onLogin}>
              <input className="input" placeholder="Email" value={loginForm.email}
                     onChange={(e)=>setLoginForm(p=>({ ...p, email: e.target.value }))} />
              <input className="input" type="password" placeholder="Password" value={loginForm.password}
                     onChange={(e)=>setLoginForm(p=>({ ...p, password: e.target.value }))} />
              {err ? <div style={{ color: "#b91c1c", fontWeight: 700 }}>{err}</div> : null}
              <button className="btn" disabled={loading} type="submit">
                {loading ? "Please wait..." : "Login"}
              </button>
            </form>
          )}

          <div style={{ height: 10 }} />
          <button className="btn btnSecondary" onClick={() => nav("/")}>Back</button>
        </div>
      </div>
    </div>
  );
}
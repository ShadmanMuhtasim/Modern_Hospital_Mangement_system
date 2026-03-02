import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAny } from "../services/auth";

export default function AdminLogin() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ email: "admin@demo.com", password: "admin12345" });

  async function onLogin(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const data = await loginAny(form.email, form.password);
      if (data.user.role !== "ADMIN") return setErr("Not an ADMIN account.");
      nav("/admin", { replace: true });
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
          <div className="badge">Admin</div>
          <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>Admin Login</div>
          <div className="small">Uses /api/auth/login</div>
          <div style={{ height: 14 }} />

          <form className="row" onSubmit={onLogin}>
            <input className="input" placeholder="Email" value={form.email}
                   onChange={(e)=>setForm(p=>({ ...p, email: e.target.value }))} />
            <input className="input" type="password" placeholder="Password" value={form.password}
                   onChange={(e)=>setForm(p=>({ ...p, password: e.target.value }))} />
            {err ? <div style={{ color: "#b91c1c", fontWeight: 700 }}>{err}</div> : null}
            <button className="btn" disabled={loading} type="submit">{loading ? "Please wait..." : "Login"}</button>
          </form>

          <div style={{ height: 10 }} />
          <button className="btn btnSecondary" onClick={() => nav("/")}>Back</button>
        </div>
      </div>
    </div>
  );
}
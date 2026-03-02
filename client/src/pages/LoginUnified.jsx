import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./SimpleAuth.css";

function roleToRoute(role) {
  if (role === "PATIENT") return "/patient";
  if (role === "BLOOD_DONOR") return "/donor";
  if (role === "APPLICANT") return "/applicant";
  if (role === "ADMIN") return "/admin";
  if (role === "DOCTOR") return "/doctor";
  if (role === "NURSE") return "/nurse";
  if (role === "IT" || role === "ITWORKER") return "/it";
  return "/app";
}

export default function LoginUnified() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setMsg(""); setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      const token = res.data?.token;
      const role = res.data?.user?.role;

      if (!token || !role) throw new Error("Login response missing token/role");

      localStorage.setItem("mhms_token", token);
      localStorage.setItem("mhms_role", role);

      setMsg("Logged in ✅");
      nav(roleToRoute(role), { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authPage">
      <div className="authCard">
        <div className="authTitle">Login</div>
        <div className="authSub">One login for Patient / Donor / Applicant / Staff / Admin.</div>

        <form onSubmit={onSubmit} className="authForm">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />

          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />

          {err && <div className="authErr">{err}</div>}
          {msg && <div className="authOk">{msg}</div>}

          <button disabled={loading} className="authBtn" type="submit">
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>

        <div className="authLinks">
          <button onClick={() => nav("/patient/auth?mode=register")} className="linkBtn">Register as Patient</button>
          <button onClick={() => nav("/donor/auth?mode=register")} className="linkBtn">Register as Donor</button>
          <button onClick={() => nav("/applicant/auth?mode=apply")} className="linkBtn">Apply for Job</button>
          <button onClick={() => nav("/public")} className="linkBtn">Public Website</button>
        </div>
      </div>
    </div>
  );
}
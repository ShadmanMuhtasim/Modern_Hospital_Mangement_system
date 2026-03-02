import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginAny, registerPatient } from "../services/auth";

const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];

export default function PatientAuth() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const startMode = sp.get("mode") || "login";
  const [mode, setMode] = useState(startMode);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [regForm, setRegForm] = useState({
    fullName: "", phone: "", email: "", password: "",
    sex: "Male", age: 18, address: "", bloodGroup: "A+",
  });

  const regDisabled = useMemo(() => {
    return !regForm.fullName || !regForm.phone || !regForm.email || !regForm.password || !regForm.sex || !regForm.age || !regForm.address || !regForm.bloodGroup;
  }, [regForm]);

  async function onLogin(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const data = await loginAny(loginForm.email, loginForm.password);
      if (data.user.role !== "PATIENT") return setErr("This account is not a PATIENT.");
      nav("/patient", { replace: true });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await registerPatient(regForm);
      setMode("login");
      setLoginForm({ email: regForm.email, password: "" });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Register failed");
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
              <div className="badge">Patient</div>
              <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>
                {mode === "login" ? "Patient Login" : "Patient Register"}
              </div>
              <div className="small">Uses /api/auth/register and /api/auth/login</div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className={`btn ${mode==="login" ? "" : "btnSecondary"}`} onClick={() => setMode("login")}>Login</button>
              <button className={`btn ${mode==="register" ? "" : "btnSecondary"}`} onClick={() => setMode("register")}>Register</button>
            </div>
          </div>

          <div style={{ height: 14 }} />

          {mode === "login" ? (
            <form className="row" onSubmit={onLogin}>
              <input className="input" placeholder="Email" value={loginForm.email}
                     onChange={(e)=>setLoginForm(p=>({ ...p, email: e.target.value }))} />
              <input className="input" type="password" placeholder="Password" value={loginForm.password}
                     onChange={(e)=>setLoginForm(p=>({ ...p, password: e.target.value }))} />
              {err ? <div style={{ color: "#b91c1c", fontWeight: 700 }}>{err}</div> : null}
              <button className="btn" disabled={loading} type="submit">{loading ? "Please wait..." : "Login"}</button>
            </form>
          ) : (
            <form className="row" onSubmit={onRegister}>
              <input className="input" placeholder="Full name" value={regForm.fullName}
                     onChange={(e)=>setRegForm(p=>({ ...p, fullName: e.target.value }))} />
              <div className="row2">
                <input className="input" placeholder="Phone" value={regForm.phone}
                       onChange={(e)=>setRegForm(p=>({ ...p, phone: e.target.value }))} />
                <select className="input" value={regForm.sex} onChange={(e)=>setRegForm(p=>({ ...p, sex: e.target.value }))}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>

              <div className="row2">
                <input className="input" type="number" min="1" placeholder="Age" value={regForm.age}
                       onChange={(e)=>setRegForm(p=>({ ...p, age: Number(e.target.value) }))} />
                <select className="input" value={regForm.bloodGroup} onChange={(e)=>setRegForm(p=>({ ...p, bloodGroup: e.target.value }))}>
                  {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <input className="input" placeholder="Address" value={regForm.address}
                     onChange={(e)=>setRegForm(p=>({ ...p, address: e.target.value }))} />

              <div className="row2">
                <input className="input" placeholder="Email" value={regForm.email}
                       onChange={(e)=>setRegForm(p=>({ ...p, email: e.target.value }))} />
                <input className="input" type="password" placeholder="Password" value={regForm.password}
                       onChange={(e)=>setRegForm(p=>({ ...p, password: e.target.value }))} />
              </div>

              {err ? <div style={{ color: "#b91c1c", fontWeight: 700 }}>{err}</div> : null}
              <button className="btn" disabled={loading || regDisabled} type="submit">
                {loading ? "Creating..." : "Create Patient Account"}
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
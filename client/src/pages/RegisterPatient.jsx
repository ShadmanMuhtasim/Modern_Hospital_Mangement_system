import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerPatient } from "../services/auth";

export default function RegisterPatient() {
  const [f, setF] = useState({ fullName:"", phone:"", email:"", password:"", dob:"" });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  const set = (k,v)=>setF(p=>({...p,[k]:v}));

  async function onSubmit(e){
    e.preventDefault();
    setErr(""); setMsg("");
    try{
      await registerPatient(f);
      setMsg("Registered! Please login.");
      setTimeout(()=>nav("/login"), 900);
    }catch(e){
      setErr(e?.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 560, margin: "0 auto" }}>
      <h2>Patient Registration</h2>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input placeholder="Full Name" value={f.fullName} onChange={e=>set("fullName", e.target.value)} />
        <input placeholder="Phone (optional)" value={f.phone} onChange={e=>set("phone", e.target.value)} />
        <input placeholder="Email" value={f.email} onChange={e=>set("email", e.target.value)} />
        <input placeholder="Password" type="password" value={f.password} onChange={e=>set("password", e.target.value)} />
        <input type="date" value={f.dob} onChange={e=>set("dob", e.target.value)} />

        {err && <div style={{ color: "crimson" }}>{err}</div>}
        {msg && <div style={{ color: "green" }}>{msg}</div>}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
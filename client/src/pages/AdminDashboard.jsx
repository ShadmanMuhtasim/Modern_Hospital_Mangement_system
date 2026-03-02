import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

export default function AdminDashboard() {
  const [apps, setApps] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setErr(""); setMsg("");
    try {
      const { data } = await api.get(`/applications?status=${status}`);
      setApps(data);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load applications");
    }
  }

  useEffect(() => { load(); }, [status]);

  async function approve(id) {
    setErr(""); setMsg("");
    try {
      await api.patch(`/applications/${id}/approve`);
      setMsg(`Approved application ${id}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Approve failed");
    }
  }

  async function reject(id) {
    setErr(""); setMsg("");
    try {
      await api.patch(`/applications/${id}/reject`);
      setMsg(`Rejected application ${id}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Reject failed");
    }
  }

  return (
    <DashboardShell title="Admin Dashboard" subtitle="Approve/reject applications">
      <div className="card" style={{ padding: 16 }}>
        {err ? <div style={{ color: "#b91c1c", fontWeight: 800 }}>{err}</div> : null}
        {msg ? <div style={{ color: "#047857", fontWeight: 800 }}>{msg}</div> : null}

        <div className="row2">
          <div>
            <div className="small">Filter by status</div>
            <select className="input" value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
          <div />
        </div>

        <div style={{ height: 12 }} />

        {apps.length === 0 ? (
          <div className="small">No applications found.</div>
        ) : (
          <div className="row" style={{ gap: 10 }}>
            {apps.map((a) => (
              <div key={a.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>
                    {a.fullName} — {a.roleAppliedFor}
                  </div>
                  <span className="badge">{a.status}</span>
                </div>
                <div className="small">{a.email}</div>

                <div style={{ height: 10, display: "flex", gap: 10 }}>
                  <button className="btn" onClick={() => approve(a.id)}>Approve</button>
                  <button className="btn btnSecondary" onClick={() => reject(a.id)}>Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
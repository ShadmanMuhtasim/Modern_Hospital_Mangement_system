import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

export default function ApplicantDashboard() {
  const [apps, setApps] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/applications/my");
        setApps(data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load applications");
      }
    })();
  }, []);

  return (
    <DashboardShell title="Applicant Dashboard" subtitle="Track job application status">
      <div className="card" style={{ padding: 16 }}>
        {err ? <div style={{ color: "#b91c1c", fontWeight: 800 }}>{err}</div> : null}

        {apps.length === 0 ? (
          <div className="small">No applications yet.</div>
        ) : (
          <div className="row" style={{ gap: 10 }}>
            {apps.map((a) => (
              <div key={a.id} className="card" style={{ padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 900 }}>{a.roleAppliedFor}</div>
                  <span className="badge">{a.status}</span>
                </div>
                <div className="small">Applied: {new Date(a.appliedAt).toLocaleString()}</div>
                <div className="small">Email: {a.email}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
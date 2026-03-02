import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

export default function DonorDashboard() {
  const [me, setMe] = useState(null);
  const [banks, setBanks] = useState([]);
  const [bankId, setBankId] = useState(1);
  const [units, setUnits] = useState(1);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const meRes = await api.get("/auth/me");
        setMe(meRes.data);

        const { data } = await api.get("/bank-blood/banks");
        setBanks(data);
        if (data?.[0]?.id) setBankId(data[0].id);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load donor dashboard");
      }
    })();
  }, []);

  async function donate() {
    setErr(""); setMsg("");
    try {
      const donorId = me?.profiles?.donor?.id || me?.donor?.id;
      if (!donorId) return setErr("Donor profile not found (login as BLOOD_DONOR).");

      const { data } = await api.post(`/bank-blood/banks/${bankId}/donate`, {
        donorId,
        unitsDonated: Number(units),
      });

      setMsg(data?.message || "Donation done");
    } catch (e) {
      setErr(e?.response?.data?.message || "Donate failed");
    }
  }

  return (
    <DashboardShell title="Donor Dashboard" subtitle="Donate to bank inventory (ERD)">
      <div className="card" style={{ padding: 16 }}>
        {err ? <div style={{ color: "#b91c1c", fontWeight: 800 }}>{err}</div> : null}
        {msg ? <div style={{ color: "#047857", fontWeight: 800 }}>{msg}</div> : null}

        <div className="row2">
          <div>
            <div className="small">Select bank</div>
            <select className="input" value={bankId} onChange={(e) => setBankId(Number(e.target.value))}>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bankName} (id {b.id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="small">Units to donate</div>
            <input className="input" type="number" min="1" value={units} onChange={(e) => setUnits(e.target.value)} />
          </div>
        </div>

        <div style={{ height: 12 }} />
        <button className="btn" onClick={donate}>Donate to Bank</button>
      </div>
    </DashboardShell>
  );
}
import { useEffect, useState } from "react";
import DashboardShell from "../components/DashboardShell";
import api from "../services/api";

export default function PatientDashboard() {
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        setMe(data);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load profile");
      }
    })();
  }, []);

  return (
    <DashboardShell
      title="Patient Dashboard"
      subtitle="Profile, admissions, medical records, blood bank & bed availability"
    >
      <div className="card" style={{ padding: 16 }}>
        {err ? <div style={{ color: "#b91c1c", fontWeight: 800 }}>{err}</div> : null}

        <div style={{ fontWeight: 900 }}>Logged in as</div>
        <div className="small">{me?.user?.email}</div>

        <div style={{ height: 10 }} />

        <div className="row2">
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900 }}>Name</div>
            <div className="small">{me?.profiles?.patient?.fullName || me?.patient?.fullName || "-"}</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <div style={{ fontWeight: 900 }}>Blood Group</div>
            <div className="small">{me?.profiles?.patient?.bloodGroup || me?.patient?.bloodGroup || "-"}</div>
          </div>
        </div>

        <div style={{ height: 14 }} />
        <div className="small">
          Next: we will add pages inside patient dashboard for:
          <b> Admissions</b>, <b> Medical Records</b>, <b> Bank Blood Request</b>, <b> Bed Summary</b>.
        </div>
      </div>
    </DashboardShell>
  );
}

/*
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { logout as doLogout } from "../services/auth";
import "./PatientDashboard.css";

const BLOOD_GROUPS = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];

export default function PatientDashboard() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("overview"); // overview | appointments | blood | beds | prescriptions
  const [loading, setLoading] = useState(true);

  const [me, setMe] = useState(null);


  const [inventory, setInventory] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myDonations, setMyDonations] = useState([]);

  const [bloodReqForm, setBloodReqForm] = useState({ bloodGroup: "A+", unitsRequested: 1 });
  const [donateUnits, setDonateUnits] = useState(1);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const sidebarItems = useMemo(
    () => [
      { key: "overview", label: "Overview" },
      { key: "appointments", label: "Appointments" },
      { key: "blood", label: "Blood Bank" },
      { key: "beds", label: "Bed Requests" },
      { key: "prescriptions", label: "Prescriptions" },
    ],
    []
  );

  async function loadAll() {
    setErr(""); setMsg("");
    setLoading(true);
    try {

      const meRes = await api.get("/auth/me");
      setMe(meRes.data);

 
      const invRes = await api.get("/blood/inventory");
      setInventory(invRes.data);

      const reqRes = await api.get("/blood/requests/my");
      setMyRequests(reqRes.data);

      const donRes = await api.get("/blood/donations/my");
      setMyDonations(donRes.data);

      
      const bg = meRes.data?.patient?.bloodGroup;
      if (bg) setBloodReqForm((p) => ({ ...p, bloodGroup: bg }));

    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();

    const t = setInterval(loadAll, 15000);
    return () => clearInterval(t);
  }, []);

  function onLogout() {
    doLogout();
    navigate("/", { replace: true });
  }

  async function submitBloodRequest(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      await api.post("/blood/request", {
        bloodGroup: bloodReqForm.bloodGroup,
        unitsRequested: Number(bloodReqForm.unitsRequested),
      });
      setMsg("Blood request submitted ✅");
      await loadAll();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Blood request failed");
    }
  }

  async function submitDonation(e) {
    e.preventDefault();
    setErr(""); setMsg("");
    try {
      await api.post("/blood/donate", {
        unitsDonated: Number(donateUnits),
      });
      setMsg("Donation submitted ✅ Inventory updated");
      await loadAll();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Donation failed");
    }
  }

  return (
    <div className="pdShell">
      { }
      <aside className="pdSide">
        <div className="pdBrand">
          <div className="pdLogo">＋</div>
          <div>
            <div className="pdTitle">Patient Portal</div>
            <div className="pdSub">Modern Hospital</div>
          </div>
        </div>

        <div className="pdProfile">
          <div className="pdAvatar">🧑‍⚕️</div>
          <div>
            <div className="pdName">{me?.patient?.fullName || "Patient"}</div>
            <div className="pdMeta">
              {me?.patient?.bloodGroup ? `🩸 ${me.patient.bloodGroup}` : "🩸 —"}{" "}
              • {me?.patient?.age ? `🎂 ${me.patient.age}` : "🎂 —"}{" "}
              • {me?.patient?.sex ? `⚥ ${me.patient.sex}` : "⚥ —"}
            </div>
          </div>
        </div>

        <nav className="pdNav">
          {sidebarItems.map((it) => (
            <button
              key={it.key}
              className={`pdNavItem ${tab === it.key ? "active" : ""}`}
              onClick={() => setTab(it.key)}
            >
              {it.label}
            </button>
          ))}
        </nav>

        <button className="pdLogout" onClick={onLogout}>
          Logout
        </button>
      </aside>

      { }
      <main className="pdMain">
        <header className="pdHeader">
          <div>
            <div className="pdH1">Patient Dashboard</div>
            <div className="pdH2">Request-only workflow (Pending → Approved later)</div>
          </div>

          <div className="pdHeaderRight">
            <input className="pdSearch" placeholder="Search doctors, departments (coming soon)..." />
            <div className="pdBell" title="Notifications">🔔</div>
          </div>
        </header>

        { }
        <div className="pdActions">
          <button className="pdActionBtn" onClick={() => setTab("appointments")}>Request Appointment</button>
          <button className="pdActionBtn" onClick={() => setTab("blood")}>Request Blood</button>
          <button className="pdActionBtn" onClick={() => setTab("blood")}>Donate Blood</button>
          <button className="pdActionBtn" onClick={() => setTab("beds")}>Request Bed</button>
          <button className="pdActionBtn" onClick={() => setTab("prescriptions")}>View Prescriptions</button>
        </div>

        {err && <div className="pdMsgErr">{err}</div>}
        {msg && <div className="pdMsgOk">{msg}</div>}

        { }
        {loading ? (
          <div className="pdCard">Loading dashboard...</div>
        ) : tab === "overview" ? (
          <div className="pdGrid">
            <div className="pdCard">
              <div className="pdCardTitle">Welcome</div>
              <div className="pdCardText">
                Use the buttons above to request appointments, blood, beds, and view prescriptions.
              </div>
            </div>

            <div className="pdCard">
              <div className="pdCardTitle">Blood Inventory Snapshot</div>
              <div className="pdCardText">Live units available (global)</div>
              <div className="pdInvMini">
                {inventory.map((x) => (
                  <div key={x.bloodGroup} className="pdChip">
                    <span>{x.bloodGroup}</span>
                    <b>{x.unitsAvailable}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="pdCard">
              <div className="pdCardTitle">My Recent Blood Requests</div>
              {myRequests.length === 0 ? (
                <div className="pdCardText">No requests yet.</div>
              ) : (
                <ul className="pdList">
                  {myRequests.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <b>{r.bloodGroup}</b> — {r.unitsRequested} units • <span className="badge">{r.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pdCard">
              <div className="pdCardTitle">My Donations</div>
              {myDonations.length === 0 ? (
                <div className="pdCardText">No donations yet.</div>
              ) : (
                <ul className="pdList">
                  {myDonations.slice(0, 5).map((d) => (
                    <li key={d.id}>
                      <b>{d.bloodGroup}</b> — {d.unitsDonated} units • <span className="badge">{d.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : tab === "blood" ? (
          <div className="pdGrid">
            <div className="pdCard">
              <div className="pdCardTitle">Global Blood Inventory</div>
              <div className="pdTable">
                <div className="pdRow head">
                  <div>Blood Group</div>
                  <div>Units Available</div>
                </div>
                {inventory.map((row) => (
                  <div className="pdRow" key={row.id}>
                    <div>{row.bloodGroup}</div>
                    <div><b>{row.unitsAvailable}</b></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pdCard">
              <div className="pdCardTitle">Request Blood (Pending approval)</div>
              <form onSubmit={submitBloodRequest} className="pdForm">
                <label>Blood Group</label>
                <select
                  value={bloodReqForm.bloodGroup}
                  onChange={(e) => setBloodReqForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option value={g} key={g}>{g}</option>
                  ))}
                </select>

                <label>Units</label>
                <input
                  type="number"
                  min="1"
                  value={bloodReqForm.unitsRequested}
                  onChange={(e) => setBloodReqForm((p) => ({ ...p, unitsRequested: e.target.value }))}
                />

                <button className="pdPrimary" type="submit">Submit Request</button>
              </form>
            </div>

            <div className="pdCard">
              <div className="pdCardTitle">Donate Blood (Auto-approved)</div>
              <div className="pdCardText">
                Donation group is your profile group: <b>{me?.patient?.bloodGroup || "—"}</b>
              </div>
              <form onSubmit={submitDonation} className="pdForm">
                <label>Units to Donate</label>
                <input
                  type="number"
                  min="1"
                  value={donateUnits}
                  onChange={(e) => setDonateUnits(e.target.value)}
                />
                <button className="pdPrimary" type="submit">Donate</button>
              </form>
            </div>

            <div className="pdCard">
              <div className="pdCardTitle">My Blood Requests</div>
              {myRequests.length === 0 ? (
                <div className="pdCardText">No requests yet.</div>
              ) : (
                <div className="pdTable">
                  <div className="pdRow head">
                    <div>Group</div>
                    <div>Units</div>
                    <div>Status</div>
                  </div>
                  {myRequests.map((r) => (
                    <div className="pdRow" key={r.id}>
                      <div>{r.bloodGroup}</div>
                      <div>{r.unitsRequested}</div>
                      <div><span className="badge">{r.status}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pdCard">
              <div className="pdCardTitle">My Donations</div>
              {myDonations.length === 0 ? (
                <div className="pdCardText">No donations yet.</div>
              ) : (
                <div className="pdTable">
                  <div className="pdRow head">
                    <div>Group</div>
                    <div>Units</div>
                    <div>Status</div>
                  </div>
                  {myDonations.map((d) => (
                    <div className="pdRow" key={d.id}>
                      <div>{d.bloodGroup}</div>
                      <div>{d.unitsDonated}</div>
                      <div><span className="badge">{d.status}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="pdCard">
            <div className="pdCardTitle">Coming soon</div>
            <div className="pdCardText">
              This section will be implemented next: <b>{tab}</b>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
*/
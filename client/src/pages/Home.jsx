import { useMemo, useState } from "react";
import "./Home.css";
import { loginPatient, registerPatient } from "../services/auth";

export default function Home() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });

  const [regForm, setRegForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    sex: "",
    age: "",
    address: "",
    bloodGroup: "",
  });

  // ✅ disable register submit unless ALL required fields filled
  const regDisabled =
    !regForm.fullName ||
    !regForm.phone ||
    !regForm.email ||
    !regForm.password ||
    !regForm.sex ||
    !regForm.age ||
    !regForm.address ||
    !regForm.bloodGroup;

  const heroTitle = useMemo(() => "Genuine Treatments\nfor your Health.", []);

  async function onLogin(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      await loginPatient(loginForm.email, loginForm.password);
      setMsg("Logged in ✅");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      await registerPatient(regForm);
      setMsg("Registered ✅ Now login.");
      setMode("login");
      setLoginForm({ email: regForm.email, password: "" });
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ opacity: 0.8 }}>✉</span>
          <span>crowdyflow@gmail.com</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: 0.8 }}>
          <span>f</span>
          <span>t</span>
          <span>ig</span>
          <span>in</span>
        </div>
      </div>

      <div className="nav">
        <div className="navInner">
          <div className="logo">
            <div className="logoMark">＋</div>
            <div>Merido</div>
          </div>

          <div className="navLinks">
            {["Home", "About", "Services", "Apply Jobs", "Doctors", "Articles", "Contact"].map((t) => (
              <a key={t} href="#" onClick={(e) => e.preventDefault()}>
                {t}
              </a>
            ))}
          </div>

          <div className="navRight">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="phoneIcon">📞</div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Hotline:</div>
                <div style={{ fontWeight: 800 }}>+ (444) 864 434 57</div>
              </div>
            </div>
            <button className="appBtn" onClick={() => alert("Coming soon")}>
              Appointment ＋
            </button>
          </div>
        </div>
      </div>

      <section className="hero">
        <div className="heroInner">
          {/* Left */}
          <div className="revealLeft">
            <h1 className="h1">
              {heroTitle.split("\n").map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </h1>

            <p className="subtitle">
              Modern Hospital Management System — patient registration and login are active. Departments, doctors,
              appointments and more will be added next.
            </p>

            <div className="authWrap">
              <div className="authCard">
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <div className="tabs">
                    <button
                      className={`tabBtn ${mode === "login" ? "tabActive" : ""}`}
                      onClick={() => {
                        setMode("login");
                        setErr("");
                        setMsg("");
                      }}
                      type="button"
                    >
                      Login
                    </button>
                    <button
                      className={`tabBtn ${mode === "register" ? "tabActive" : ""}`}
                      onClick={() => {
                        setMode("register");
                        setErr("");
                        setMsg("");
                      }}
                      type="button"
                    >
                      Register
                    </button>
                  </div>
                </div>

                {mode === "login" ? (
                  <form onSubmit={onLogin} className="form">
                    <InputField
                      label="Email"
                      icon="✉"
                      type="email"
                      value={loginForm.email}
                      onChange={(v) => setLoginForm((p) => ({ ...p, email: v }))}
                      placeholder="you@example.com"
                    />
                    <InputField
                      label="Password"
                      icon="🔒"
                      type="password"
                      value={loginForm.password}
                      onChange={(v) => setLoginForm((p) => ({ ...p, password: v }))}
                      placeholder="••••••••"
                    />

                    <div className="metaRow">
                      <small className="muted">Patient login only (for now)</small>
                      <a className="link" href="#" onClick={(e) => e.preventDefault()}>
                        Forgot password?
                      </a>
                    </div>

                    {err && <div className="msgErr">{err}</div>}
                    {msg && <div className="msgOk">{msg}</div>}

                    <button disabled={loading} className="primaryBtn" type="submit">
                      {loading ? "Please wait..." : "Get Started"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={onRegister} className="form">
                    <InputField
                      label="Full Name"
                      icon="👤"
                      value={regForm.fullName}
                      onChange={(v) => setRegForm((p) => ({ ...p, fullName: v }))}
                      placeholder="John Doe"
                    />

                    <div className="row2">
                      <InputField
                        label="Phone"
                        icon="📞"
                        value={regForm.phone}
                        onChange={(v) => setRegForm((p) => ({ ...p, phone: v }))}
                        placeholder="0123456789"
                      />

                      <SelectField
                        label="Sex"
                        icon="⚥"
                        value={regForm.sex}
                        onChange={(v) => setRegForm((p) => ({ ...p, sex: v }))}
                        options={["Male", "Female", "Other"]}
                        placeholder="Select"
                      />
                    </div>

                    <div className="row2">
                      <InputField
                        label="Age"
                        icon="🎂"
                        type="number"
                        value={regForm.age}
                        onChange={(v) => setRegForm((p) => ({ ...p, age: v }))}
                        placeholder="18"
                      />

                      <SelectField
                        label="Blood Group"
                        icon="🩸"
                        value={regForm.bloodGroup}
                        onChange={(v) => setRegForm((p) => ({ ...p, bloodGroup: v }))}
                        options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]}
                        placeholder="Select"
                      />
                    </div>

                    <TextAreaField
                      label="Address"
                      icon="🏠"
                      value={regForm.address}
                      onChange={(v) => setRegForm((p) => ({ ...p, address: v }))}
                      placeholder="House, Road, City..."
                    />

                    <InputField
                      label="Email"
                      icon="✉"
                      type="email"
                      value={regForm.email}
                      onChange={(v) => setRegForm((p) => ({ ...p, email: v }))}
                      placeholder="you@example.com"
                    />

                    <InputField
                      label="Password"
                      icon="🔒"
                      type="password"
                      value={regForm.password}
                      onChange={(v) => setRegForm((p) => ({ ...p, password: v }))}
                      placeholder="Create a strong password"
                    />

                    {regDisabled && !err && !msg && <div className="msgErr">Please fill all fields to register.</div>}
                    {err && <div className="msgErr">{err}</div>}
                    {msg && <div className="msgOk">{msg}</div>}

                    <button disabled={loading || regDisabled} className="primaryBtn" type="submit">
                      {loading ? "Creating..." : "Create Patient Account"}
                    </button>
                  </form>
                )}
              </div>

              <div className="badge">
                <span className="dot" />
                <span>24/7 Emergency Service</span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="illusWrap revealRight">
            <div className="floaty">
              <DoctorIllustration />
            </div>

            <div className="ratingBubble">
              <div style={{ fontSize: 44, fontWeight: 900, color: "#2563eb", lineHeight: 1 }}>95%</div>
              <div style={{ marginTop: 4, fontWeight: 800, color: "#111827" }}>Positive Rating</div>
              <div className="stars">★★★★★</div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="container">
          <h2 className="sectionTitle">Our Services</h2>
          <p className="sectionSub">
            A modern hospital platform for patient registration, appointments, admissions, beds, and blood bank management.
          </p>

          <div className="grid4">
            <div className="card">
              <div className="cardTitle">Patient Registration</div>
              <div className="cardText">Register patients securely and store profiles in MS SQL.</div>
              <button className="cardBtn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                Register ↑
              </button>
            </div>

            <div className="card">
              <div className="cardTitle">Find Doctors</div>
              <div className="cardText">Browse doctors by department and specialization (coming soon).</div>
              <button className="cardBtn" onClick={() => alert("Coming soon")}>
                Explore
              </button>
            </div>

            <div className="card">
              <div className="cardTitle">Appointments</div>
              <div className="cardText">Book and track appointments with a clean scheduling workflow (coming soon).</div>
              <button className="cardBtn" onClick={() => alert("Coming soon")}>
                Book
              </button>
            </div>

            <div className="card">
              <div className="cardTitle">Blood Bank</div>
              <div className="cardText">Inventory, donors, and requests with live availability (coming soon).</div>
              <button className="cardBtn" onClick={() => alert("Coming soon")}>
                Manage
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* DEPARTMENTS PREVIEW */}
      <section className="sectionAlt">
        <div className="container">
          <h2 className="sectionTitle">Departments</h2>
          <p className="sectionSub">Preview the main departments. Full department pages will be added next.</p>

          <div className="grid3">
            {["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "Dentistry", "General Medicine"].map((d) => (
              <div key={d} className="card">
                <div className="cardTitle">{d}</div>
                <div className="cardText">Department overview and doctors list will appear here.</div>
                <button className="cardBtn" onClick={() => alert("Coming soon")}>
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS PREVIEW */}
      <section className="section">
        <div className="container">
          <h2 className="sectionTitle">Featured Doctors</h2>
          <p className="sectionSub">A preview layout for doctor cards (data will come from your Doctor table later).</p>

          <div className="grid4">
            {["Dr. A. Rahman", "Dr. S. Hasan", "Dr. N. Karim", "Dr. M. Ahmed"].map((name) => (
              <div key={name} className="card">
                <div className="cardTitle">{name}</div>
                <div className="cardText">Specialization: Coming soon</div>
                <button className="cardBtn" onClick={() => alert("Coming soon")}>
                  Profile
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARTICLES */}
      <section className="sectionAlt">
        <div className="container">
          <h2 className="sectionTitle">Health Articles</h2>
          <p className="sectionSub">Latest health tips and hospital updates (article system coming soon).</p>

          <div className="grid3">
            {["How to stay healthy", "Emergency preparedness", "When to see a specialist"].map((t) => (
              <div key={t} className="card">
                <div className="cardTitle">{t}</div>
                <div className="cardText">Short summary preview text goes here.</div>
                <button className="cardBtn" onClick={() => alert("Coming soon")}>
                  Read
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <div className="cta">
              <div>
                <h3 className="ctaTitle">Need help right now?</h3>
                <div className="ctaText">Call emergency or create an appointment request (coming soon).</div>
              </div>
              <button className="ctaBtn" onClick={() => alert("Coming soon")}>
                Contact
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <div className="footer">
        <div className="container">
          © {new Date().getFullYear()} Modern Hospital Management System — Built with React + Express + MS SQL.
        </div>
      </div>
    </div>
  );
}

function InputField({ label, icon, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <div className="inputWrap">
        <div className="inputIcon">{icon}</div>
        <input
          className="input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function SelectField({ label, icon, value, onChange, options, placeholder }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <div className="inputWrap">
        <div className="inputIcon">{icon}</div>
        <select
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ color: value ? "white" : "rgba(255,255,255,0.55)" }}
        >
          <option value="">{placeholder || "Select"}</option>
          {options.map((o) => (
            <option key={o} value={o} style={{ color: "#111827" }}>
              {o}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TextAreaField({ label, icon, value, onChange, placeholder }) {
  return (
    <div>
      <div className="fieldLabel">{label}</div>
      <div className="inputWrap" style={{ alignItems: "flex-start" }}>
        <div className="inputIcon" style={{ marginTop: 2 }}>
          {icon}
        </div>
        <textarea
          className="input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{ resize: "none" }}
        />
      </div>
    </div>
  );
}

/* simple cartoon doctor SVG */
function DoctorIllustration() {
  return (
    <svg width="420" height="420" viewBox="0 0 420 420" style={{ maxWidth: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="coat" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>

      <circle cx="240" cy="140" r="70" fill="#f7d7c4" />
      <path
        d="M185 145c10 18 24 26 55 26s45-8 55-26"
        fill="none"
        stroke="#d4a58e"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="214" cy="128" r="6" fill="#111827" />
      <circle cx="266" cy="128" r="6" fill="#111827" />
      <path d="M222 156c10 10 26 10 36 0" fill="none" stroke="#111827" strokeWidth="6" strokeLinecap="round" />

      <path
        d="M170 110c20-36 58-58 100-58 34 0 66 16 86 44"
        fill="none"
        stroke="#1f2937"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d="M178 112c18-28 48-44 84-44 28 0 54 12 72 32"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="12"
        strokeLinecap="round"
      />

      <path d="M130 360c14-86 62-140 130-140s116 54 130 140" fill="url(#coat)" />
      <path d="M210 230v150" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />

      <path d="M150 260c-28 10-50 34-56 66" fill="none" stroke="#e5e7eb" strokeWidth="18" strokeLinecap="round" />
      <path d="M330 260c28 10 50 34 56 66" fill="none" stroke="#e5e7eb" strokeWidth="18" strokeLinecap="round" />

      <circle cx="240" cy="270" r="42" fill="none" stroke="#111827" strokeWidth="10" />
      <path d="M240 310c0 18 8 32 20 40" fill="none" stroke="#111827" strokeWidth="10" strokeLinecap="round" />
      <circle cx="240" cy="270" r="10" fill="#2563eb" />
    </svg>
  );
}
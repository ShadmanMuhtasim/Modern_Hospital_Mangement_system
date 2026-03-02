import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./PublicHome.css";

export default function PublicHome() {
  return (
    <div className="pub">
      <Navbar />

      {/* HERO */}
      <section className="hero" id="top">
        <div className="heroInner">
          <div className="heroLeft">
            <div className="heroTag">Modern Hospital Management System</div>
            <h1 className="heroTitle">
              Genuine care,
              <br />
              modern hospital operations.
            </h1>
            <p className="heroSub">
              Patient portal • Blood bank • Beds/ICU/CCU/NCU • Medical records • Job applications • Admin approvals.
            </p>

            <div className="heroCtas">
              {/* ✅ use Link to avoid full reload */}
              <Link className="btnPrimary" to="/login">Login</Link>
              <Link className="btnGhost" to="/patient/auth?mode=register">Register Patient</Link>
              <Link className="btnGhost" to="/donor/auth?mode=register">Become Donor</Link>
              <Link className="btnGhost" to="/applicant/auth?mode=apply">Apply for Job</Link>
            </div>

            <div className="heroStats">
              <Stat label="Departments" value="7+" />
              <Stat label="Units" value="ICU/CCU/NCU" />
              <Stat label="Beds" value="Live availability" />
              <Stat label="Blood Banks" value="Branch inventory" />
            </div>
          </div>

          <div className="heroRight">
            <div className="glassCard">
              <div className="glassTop">
                <div className="dot green" />
                <div className="dot yellow" />
                <div className="dot red" />
                <div className="glassTitle">Live System Preview</div>
              </div>

              <div className="miniGrid">
                <MiniCard title="Blood Bank" text="Inventory + donor + request + issue" />
                <MiniCard title="Beds" text="Unit-wise availability and status" />
                <MiniCard title="Records" text="Medical record lookup & filters" />
                <MiniCard title="Hiring" text="Apply → Pending → Approved → Role" />
              </div>

              <div className="callout">
                Tip: Keep backend on <b>http://localhost:5000</b> and frontend on <b>http://localhost:5173</b>
              </div>
            </div>

            <div className="floatingBadge">
              <div className="badgeBig">24/7</div>
              <div className="badgeText">Emergency Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="sectionAlt" id="about">
        <div className="container">
          <div className="secHead">
            <h2>About</h2>
            <p>
              MHMS is a database-focused hospital system: queries, filtering, joins, transactions and live availability
              across blood banks and beds/units.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section" id="services">
        <div className="container">
          <div className="secHead">
            <h2>Core Services</h2>
            <p>Database-first workflow: data handling, filtering, queries, joins, and transactions.</p>
          </div>

          <div className="grid4">
            <ServiceCard title="Patient Portal" text="Profile, blood requests/donations, admissions and records." icon="👤" />
            <ServiceCard title="Blood Bank" text="Bank inventory, donor donation, request issuing + compatibility logic." icon="🩸" />
            <ServiceCard title="Beds & Units" text="ICU/CCU/NCU/GENERAL bed status tracking & availability summary." icon="🛏️" />
            <ServiceCard title="Hiring System" text="Apply as doctor/nurse/IT/staff; admin approves → role dashboard." icon="📝" />
          </div>
        </div>
      </section>

      {/* DEPARTMENTS */}
      <section className="sectionAlt" id="departments">
        <div className="container">
          <div className="secHead">
            <h2>Departments</h2>
            <p>Example departments (seeded in database). Doctor lists can be attached later.</p>
          </div>

          <div className="grid3">
            {[
              { name: "Cardiology", icon: "🫀" },
              { name: "Neurology", icon: "🧠" },
              { name: "Orthopedics", icon: "🦴" },
              { name: "Pediatrics", icon: "👶" },
              { name: "General Medicine", icon: "🩺" },
              { name: "Ophthalmology", icon: "👁️" },
              { name: "Dentistry", icon: "🦷" },
            ].map((d) => (
              <div className="deptCard" key={d.name}>
                <div className="deptIcon">{d.icon}</div>
                <div className="deptName">{d.name}</div>
                <div className="deptText">Doctors list + scheduling can be connected to DB next.</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOCTORS PREVIEW */}
      <section className="section" id="doctors">
        <div className="container">
          <div className="secHead">
            <h2>Featured Doctors</h2>
            <p>UI preview. Later you will render from Doctor + Department tables.</p>
          </div>

          <div className="grid4">
            {["Dr. A. Rahman", "Dr. S. Hasan", "Dr. N. Karim", "Dr. M. Ahmed"].map((name) => (
              <div className="docCard" key={name}>
                <div className="docAvatar">🧑‍⚕️</div>
                <div className="docName">{name}</div>
                <div className="docMeta">Specialization: Coming soon</div>
                <Link className="docBtn" to="/login">View Profile</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="sectionAlt" id="contact">
        <div className="container">
          <div className="ctaBanner">
            <div>
              <div className="ctaTitle">Need quick help?</div>
              <div className="ctaText">Use the portal login to request blood, view records, or check admissions/beds.</div>
            </div>
            <Link className="ctaBtn" to="/login">Open Portal</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footerInner">
          <div>
            <div className="footerBrand">MHMS</div>
            <div className="footerSmall">Modern Hospital Management System — React + Express + Prisma + MS SQL.</div>
          </div>

          <div className="footerLinks">
            <Link to="/public">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/patient/auth?mode=register">Patient Register</Link>
            <Link to="/donor/auth?mode=register">Donor Register</Link>
            <Link to="/applicant/auth?mode=apply">Apply Job</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="statVal">{value}</div>
      <div className="statLabel">{label}</div>
    </div>
  );
}

function ServiceCard({ title, text, icon }) {
  return (
    <div className="svcCard">
      <div className="svcIcon">{icon}</div>
      <div className="svcTitle">{title}</div>
      <div className="svcText">{text}</div>
    </div>
  );
}

function MiniCard({ title, text }) {
  return (
    <div className="miniCard">
      <div className="miniTitle">{title}</div>
      <div className="miniText">{text}</div>
    </div>
  );
}
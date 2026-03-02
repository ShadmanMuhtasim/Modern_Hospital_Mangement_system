import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Navbar() {
  const [compact, setCompact] = useState(false);
  const nav = useNavigate();
  const loc = useLocation();

  const loggedIn = Boolean(localStorage.getItem("mhms_token")) && Boolean(localStorage.getItem("mhms_role"));

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goPublicSection(sectionId) {
    // If not on /public, navigate there first then scroll
    if (!loc.pathname.startsWith("/public")) {
      nav(`/public#${sectionId}`);
      setTimeout(() => scrollToId(sectionId), 250);
      return;
    }
    scrollToId(sectionId);
  }

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: compact ? "10px 18px" : "16px 22px",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <button
          onClick={() => nav(loggedIn ? "/portal" : "/public")}
          style={{
            fontWeight: 900,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: "#111827",
            fontSize: 16,
          }}
        >
          Modern Hospital
        </button>

        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <button className="linkBtn" type="button" onClick={() => goPublicSection("about")}>About</button>
          <button className="linkBtn" type="button" onClick={() => goPublicSection("departments")}>Departments</button>
          <button className="linkBtn" type="button" onClick={() => goPublicSection("doctors")}>Find Doctors</button>
          <button className="linkBtn" type="button" onClick={() => goPublicSection("contact")}>Contact</button>

          {/* ✅ single professional login */}
          {!loggedIn ? (
            <button className="btn" type="button" onClick={() => nav("/login")}>Login</button>
          ) : (
            <button className="btn" type="button" onClick={() => nav("/portal")}>Portal</button>
          )}
        </div>
      </div>
    </div>
  );
}
/*
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function getRoleHome(role) {
  if (role === "PATIENT") return "/patient";
  if (role === "BLOOD_DONOR") return "/donor";
  if (role === "APPLICANT") return "/applicant";
  if (role === "ADMIN") return "/admin";
  if (role === "DOCTOR") return "/doctor";
  if (role === "NURSE") return "/nurse";
  if (role === "IT") return "/it";
  if (role === "STAFF") return "/staff";
  return "/app";
}

export default function Navbar() {
  const [compact, setCompact] = useState(false);
  const nav = useNavigate();

  const token = localStorage.getItem("mhms_token");
  const role = localStorage.getItem("mhms_role");
  const isLoggedIn = Boolean(token);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "white",
        borderBottom: "1px solid #e5e7eb",
        padding: compact ? "10px 18px" : "16px 22px",
        transition: "all 0.2s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        { }
        <Link to="/public" style={{ fontWeight: 900, textDecoration: "none", color: "#111827" }}>
          Modern Hospital
        </Link>

        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <Link to="/public">Website</Link>

          {isLoggedIn ? (
            <>
              <Link to="/app">Portal</Link>
              <button
                type="button"
                className="btn btnSecondary"
                onClick={() => nav(getRoleHome(role))}
              >
                My Dashboard
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  localStorage.removeItem("mhms_token");
                  localStorage.removeItem("mhms_role");
                  nav("/login");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>
    </div>
  );
}
*/
/*
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{
      position:"sticky", top:0, zIndex:50,
      background:"white",
      borderBottom:"1px solid #e5e7eb",
      padding: compact ? "10px 18px" : "16px 22px",
      transition:"all 0.2s ease"
    }}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap: 12}}>
        <Link to="/" style={{fontWeight:900, textDecoration:"none", color:"#111827"}}>
          Modern Hospital
        </Link>

        <div style={{display:"flex", gap:14, alignItems:"center", flexWrap:"wrap"}}>
          <Link to="/about">About</Link>
          <Link to="/departments">Departments</Link>
          <Link to="/doctors">Find Doctors</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}
*/
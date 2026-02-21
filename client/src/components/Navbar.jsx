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
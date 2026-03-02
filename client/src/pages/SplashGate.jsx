
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import "./SplashGate.css";

function isLoggedIn() {
  return Boolean(localStorage.getItem("mhms_token")) && Boolean(localStorage.getItem("mhms_role"));
}

export default function SplashGate() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // show splash only once per tab session
    const alreadyShown = sessionStorage.getItem("mhms_splash_shown") === "1";
    if (alreadyShown) {
      setShow(false);
      return;
    }

    sessionStorage.setItem("mhms_splash_shown", "1");

    const t = setTimeout(() => setShow(false), 1800); // slower & smoother
    return () => clearTimeout(t);
  }, []);

  if (show) {
    return (
      <div className="splashWrap">
        <div className="splashBg" />
        <div className="splashCenter">
          <div className="splashTitle">Modern Hospital</div>
          <div className="splashSub">Management System</div>

          <div className="marquee">
            <div className="marqueeTrack">
              <span>• Patient • Blood Bank • Beds • Admissions • Records • Staff • </span>
              <span>• Patient • Blood Bank • Beds • Admissions • Records • Staff • </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // after splash, go where user should be
  return <Navigate to={isLoggedIn() ? "/portal" : "/public"} replace />;
}
/*
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashGate.css";

export default function SplashGate() {
  const nav = useNavigate();
  const [phase, setPhase] = useState("show");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hide"), 900);
    const t2 = setTimeout(() => {
      const token = localStorage.getItem("mhms_token");
      if (token) nav("/app", { replace: true });
      else nav("/public", { replace: true });
    }, 1200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [nav]);

  return (
    <div className={`splash ${phase === "hide" ? "hide" : ""}`}>
      <div className="brand">
        <div className="logoMark">+</div>
        <div className="titleTrack">
          <div className="title">Modern Hospital Management System</div>
        </div>
        <div className="sub">React • Express • MS SQL • Prisma</div>
      </div>
    </div>
  );
}
*/

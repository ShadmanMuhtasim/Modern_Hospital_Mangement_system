import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SplashGate from "./pages/SplashGate";
import PublicHome from "./pages/PublicHome";
import PortalHome from "./pages/PortalHome";
import LoginUnified from "./pages/LoginUnified";

import ProtectedRoute from "./routes/ProtectedRoute";

import PatientAuth from "./pages/PatientAuth";
import DonorAuth from "./pages/DonorAuth";
import ApplicantAuth from "./pages/ApplicantAuth";

import PatientDashboard from "./pages/PatientDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root only = splash then redirect */}
        <Route path="/" element={<SplashGate />} />

        {/* Public website */}
        <Route path="/public" element={<PublicHome />} />

        {/* Single professional login */}
        <Route path="/login" element={<LoginUnified />} />

        {/* Portal home for logged in users */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <PortalHome />
            </ProtectedRoute>
          }
        />

        {/* Auth flows (still allowed) */}
        <Route path="/patient/auth" element={<PatientAuth />} />
        <Route path="/donor/auth" element={<DonorAuth />} />
        <Route path="/applicant/auth" element={<ApplicantAuth />} />

        {/* Dashboards */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={["BLOOD_DONOR"]}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant"
          element={
            <ProtectedRoute allowedRoles={["APPLICANT"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* placeholders */}
        <Route path="/doctor" element={<div style={{ padding: 24 }}>Doctor dashboard (next)</div>} />
        <Route path="/nurse" element={<div style={{ padding: 24 }}>Nurse dashboard (next)</div>} />
        <Route path="/it" element={<div style={{ padding: 24 }}>IT dashboard (next)</div>} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
/*

*/


/*
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./routes/ProtectedRoute";

import SplashGate from "./pages/SplashGate";
import PublicHome from "./pages/PublicHome";
import LoginUnified from "./pages/LoginUnified";
import PortalHome from "./pages/PortalHome";

import PatientAuth from "./pages/PatientAuth";
import DonorAuth from "./pages/DonorAuth";
import ApplicantAuth from "./pages/ApplicantAuth";
import AdminLogin from "./pages/AdminLogin";

import PatientDashboard from "./pages/PatientDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        { }
        <Route path="/" element={<SplashGate />} />

        { }
        <Route path="/public" element={<PublicHome />} />

        { }
        <Route path="/login" element={<LoginUnified />} />

        { }
        <Route
          path="/app"
          element={
            <ProtectedRoute allowedRoles={["PATIENT", "BLOOD_DONOR", "APPLICANT", "ADMIN", "DOCTOR", "NURSE", "IT", "ITWORKER"]}>
              <PortalHome />
            </ProtectedRoute>
          }
        />

        { }
        <Route path="/patient/auth" element={<PatientAuth />} />
        <Route path="/donor/auth" element={<DonorAuth />} />
        <Route path="/applicant/auth" element={<ApplicantAuth />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        { }
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={["BLOOD_DONOR"]}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant"
          element={
            <ProtectedRoute allowedRoles={["APPLICANT"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        { }
        <Route path="/doctor" element={<div style={{ padding: 24 }}>Doctor dashboard (next)</div>} />
        <Route path="/nurse" element={<div style={{ padding: 24 }}>Nurse dashboard (next)</div>} />
        <Route path="/it" element={<div style={{ padding: 24 }}>IT dashboard (next)</div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
*/
/*

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ProtectedRoute from "./routes/ProtectedRoute";

import PatientAuth from "./pages/PatientAuth";
import DonorAuth from "./pages/DonorAuth";
import ApplicantAuth from "./pages/ApplicantAuth";
import AdminLogin from "./pages/AdminLogin";

import PatientDashboard from "./pages/PatientDashboard";
import DonorDashboard from "./pages/DonorDashboard";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        { }
        <Route path="/" element={<Home />} />

        { }
        <Route path="/patient/auth" element={<PatientAuth />} />
        <Route path="/donor/auth" element={<DonorAuth />} />
        <Route path="/applicant/auth" element={<ApplicantAuth />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        { }
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donor"
          element={
            <ProtectedRoute allowedRoles={["BLOOD_DONOR"]}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/applicant"
          element={
            <ProtectedRoute allowedRoles={["APPLICANT"]}>
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        { }
        <Route path="/doctor" element={<div style={{ padding: 24 }}>Doctor dashboard (next)</div>} />
        <Route path="/nurse" element={<div style={{ padding: 24 }}>Nurse dashboard (next)</div>} />
        <Route path="/it" element={<div style={{ padding: 24 }}>IT dashboard (next)</div>} />
        <Route path="/staff" element={<div style={{ padding: 24 }}>Staff dashboard (next)</div>} />
      </Routes>
    </BrowserRouter>
  );
}
*/
//---------------------------------------------------------
/*
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import PatientDashboard from "./pages/PatientDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["PATIENT"]}>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        { }
        <Route path="/admin" element={<div style={{ padding: 24 }}>Admin dashboard (coming soon)</div>} />
        <Route path="/doctor" element={<div style={{ padding: 24 }}>Doctor dashboard (coming soon)</div>} />
        <Route path="/nurse" element={<div style={{ padding: 24 }}>Nurse dashboard (coming soon)</div>} />
        <Route path="/it" element={<div style={{ padding: 24 }}>IT dashboard (coming soon)</div>} />
      </Routes>
    </BrowserRouter>
  );
}
*/
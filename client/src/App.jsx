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

        {/* placeholders */}
        <Route path="/admin" element={<div style={{ padding: 24 }}>Admin dashboard (coming soon)</div>} />
        <Route path="/doctor" element={<div style={{ padding: 24 }}>Doctor dashboard (coming soon)</div>} />
        <Route path="/nurse" element={<div style={{ padding: 24 }}>Nurse dashboard (coming soon)</div>} />
        <Route path="/it" element={<div style={{ padding: 24 }}>IT dashboard (coming soon)</div>} />
      </Routes>
    </BrowserRouter>
  );
}
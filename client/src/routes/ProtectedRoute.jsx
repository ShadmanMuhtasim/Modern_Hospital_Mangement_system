import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("mhms_token");
  const role = localStorage.getItem("mhms_role");

  if (!token) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;

  return children;
}
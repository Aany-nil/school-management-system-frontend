
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const token = localStorage.getItem("token");

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  // Login na korle Login page-e pathabe
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Role onujayi dashboard access control
  if (!allowedRoles.includes(user.role)) {
    switch (user.role) {
      case "superadmin":
        return <Navigate to="/super-admin/dashboard" replace />;

      case "admin":
        return <Navigate to="/admin/dashboard" replace />;

      case "teacher":
        return <Navigate to="/teacher/dashboard" replace />;

      case "student":
        return <Navigate to="/student/dashboard" replace />;

      default:
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
}



import { Navigate } from "react-router-dom";

export default function HomeRedirect() {
  let user = null;
  const token = localStorage.getItem("token");

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect according to role
  if (user.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user.role === "teacher") {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  if (user.role === "student") {
    return <Navigate to="/student/dashboard" replace />;
  }

  // Invalid role
  return <Navigate to="/login" replace />;
}


import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/auth/Login";
import HomeRedirect from "./pages/HomeRedirect";
import AppLayout from "./components/AppLayout";;
import NotFound from "./pages/NotFound";
import Register from "./pages/auth/Registration";

import AdminDashboard from "./pages/admin/AdminDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ProtectedRoute from "./components/ProtectRoute";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Student routes */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />}/>
          </Route>
        </Route>

         {/* Teacher routes */}

         <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />}/>
          </Route>
        </Route>

        {/* Not found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

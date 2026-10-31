
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
import Teachers from "./pages/admin/Teachers";
import Students from "./pages/admin/Student";
import ClassManagement from "./pages/admin/Class";
import SubjectManagement from "./pages/admin/Subject";
import AttendanceManagement from "./pages/admin/Attendance";
import ResultManagement from "./pages/admin/Result";
import Fees from "./pages/admin/Fee";
import Salary from "./pages/admin/Salary";
import Routine from "./pages/admin/Routine";
import Notice from "./pages/admin/Notice";
import SettingsManagement from "./pages/admin/Setting";
import Attendance from "./pages/student/Attendance";
import Result from "./pages/student/Result";
import Fee from "./pages/student/Fee";
import RoutineManagement from "./pages/student/Routine";
import NoticeManagement from "./pages/student/Notice";


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
            <Route path="/admin/teachers" element={<Teachers />} />
            <Route path="/admin/students" element={<Students />} />
            <Route path="/admin/classes" element={<ClassManagement />} />
            <Route path="/admin/subjects" element={<SubjectManagement />} />
            <Route path="/admin/attendance" element={<AttendanceManagement />} />
            <Route path="/admin/results" element={<ResultManagement />} />
            <Route path="/admin/fees" element={<Fees />} />
            <Route path="/admin/salaries" element={<Salary />} />
            <Route path="/admin/routine" element={<Routine />} />
            <Route path="/admin/notices" element={<Notice />} />
            <Route path="/admin/settings" element={<SettingsManagement />} />
          </Route>
        </Route>

        {/* Student routes */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/student/dashboard" element={<StudentDashboard />}/>
            <Route path="/student/attendance" element={<Attendance />} />
            <Route path="/student/results" element={<Result />} />
            <Route path="/student/fees" element={<Fee />} />
            <Route path="/student/routine" element={<RoutineManagement />} />
            <Route path="/student/notices" element={<NoticeManagement />} />
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

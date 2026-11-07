
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  School,
  Users,
  GraduationCap,
  ShieldCheck,
  LogOut,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex items-center justify-between bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <ShieldCheck size={26} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Super Admin
            </h1>
            <p className="text-sm text-gray-500">
              School Management System
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
        >
          <LogOut size={18} />
          Logout
        </button>
      </header>

      <main className="p-6 lg:p-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome, {user?.name || "Super Admin"}
          </h2>

          <p className="mt-2 text-gray-500">
            Manage all schools and their administrators from here.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 text-blue-600">
              <School size={25} />
            </div>

            <h3 className="font-semibold text-gray-700">
              Total Schools
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              School management
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-green-100 p-3 text-green-600">
              <Users size={25} />
            </div>

            <h3 className="font-semibold text-gray-700">
              School Admins
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Manage school administrators
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-4 inline-flex rounded-xl bg-purple-100 p-3 text-purple-600">
              <GraduationCap size={25} />
            </div>

            <h3 className="font-semibold text-gray-700">
              School Management
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              Manage schools and modules
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

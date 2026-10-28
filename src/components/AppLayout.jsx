
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserRound,
  School,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  Wallet,
  Banknote,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";

const navigation = {
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Students", path: "/admin/students", icon: Users },
    { label: "Teachers", path: "/admin/teachers", icon: UserRound },
    { label: "Classes", path: "/admin/classes", icon: School },
    { label: "Subjects", path: "/admin/subjects", icon: BookOpen },
    { label: "Attendance", path: "/admin/attendance", icon: CalendarCheck },
    { label: "Results", path: "/admin/results", icon: ClipboardList },
    { label: "Fees", path: "/admin/fees", icon: Wallet },
    { label: "Salaries", path: "/admin/salaries", icon: Banknote },
    { label: "Routine", path: "/admin/routine", icon: CalendarCheck },
    { label: "Notices", path: "/admin/notices", icon: Bell },
    { label: "Settings", path: "/admin/settings", icon: Settings },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher/dashboard", icon: LayoutDashboard },
    { label: "Students", path: "/teacher/students", icon: Users },
    { label: "Classes", path: "/teacher/classes", icon: School },
    { label: "Subjects", path: "/teacher/subjects", icon: BookOpen },
    { label: "Attendance", path: "/teacher/attendance", icon: CalendarCheck },
    { label: "Results", path: "/teacher/results", icon: ClipboardList },
    { label: "Routine", path: "/teacher/routine", icon: CalendarCheck },
    { label: "Notices", path: "/teacher/notices", icon: Bell },
  ],
  student: [
    { label: "Dashboard", path: "/student/dashboard", icon: LayoutDashboard },
    { label: "My Attendance", path: "/student/attendance", icon: CalendarCheck },
    { label: "My Results", path: "/student/results", icon: ClipboardList },
    { label: "My Fees", path: "/student/fees", icon: Wallet },
    { label: "My Routine", path: "/student/routine", icon: BookOpen },
    { label: "Notices", path: "/student/notices", icon: Bell },
  ],
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = user?.role;
  const items = navigation[role] || [];
  const displayName = user?.name || "User";
  const displayRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : "Account";

  const handleLogout = () => {
    setProfileOpen(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <Link
            to={navigation[role]?.[0]?.path || "/login"}
            className="flex items-center gap-3"
          >
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <GraduationCap size={26} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Education</h1>
              <p className="text-xs text-slate-500">School Management</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pb-2 pt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {displayRole} Menu
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.label === "Dashboard"}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="text-xs text-slate-500">{displayRole}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-lg border border-slate-200 p-2 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {displayRole} Panel
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                School Management System
              </p>
            </div>
          </div>

          {/* Profile dropdown */}
          <div className="relative z-50">
            <button
              type="button"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((previous) => !previous)}
              className="flex items-center gap-2 rounded-xl p-2 hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">
                {displayName}
              </span>

              <ChevronDown size={16} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-[100] mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-slate-500">{displayRole}</p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-4 sm:p-7 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

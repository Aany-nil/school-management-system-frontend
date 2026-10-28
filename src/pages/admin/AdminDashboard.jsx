
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  Search,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";

const statsConfig = [
  {
    title: "Total Students",
    key: "totalStudents",
    note: "Registered students",
    icon: Users,
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Total Teachers",
    key: "totalTeachers",
    note: "Active teachers",
    icon: UserRound,
    color: "bg-violet-100 text-violet-700",
  },
  {
    title: "Total Classes",
    key: "totalClasses",
    note: "Available classes",
    icon: School,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Total Subjects",
    key: "totalSubjects",
    note: "Academic subjects",
    icon: BookOpen,
    color: "bg-amber-100 text-amber-700",
  },
];

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Students", icon: Users, path: "/admin/students" },
  { label: "Teachers", icon: UserRound, path: "/admin/teachers" },
  { label: "Classes", icon: School, path: "/admin/classes" },
  { label: "Subjects", icon: BookOpen, path: "/admin/subjects" },
  { label: "Attendance", icon: CalendarCheck, path: "/admin/attendance" },
  { label: "Results", icon: ClipboardList, path: "/admin/results" },
  { label: "Fee Management", icon: Wallet, path: "/admin/fees" },
  { label: "Salary Management", icon: Banknote, path: "/admin/salaries" },
  { label: "Routine", icon: Clock, path: "/admin/routine" },
  { label: "Notices", icon: Bell, path: "/admin/notices" },
  { label: "Settings", icon: Settings, path: "/admin/settings" },
];

const quickActions = [
  { label: "Manage Students", icon: Users, path: "/admin/students" },
  { label: "Manage Teachers", icon: UserRound, path: "/admin/teachers" },
  { label: "Take Attendance", icon: CalendarCheck, path: "/admin/attendance" },
  { label: "Publish Notice", icon: Bell, path: "/admin/notices" },
];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [search, setSearch] = useState("");

  const [dashboardData, setDashboardData] = useState({
    overview: {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSubjects: 0,
      totalAttendance: 0,
      totalResults: 0,
      totalNotices: 0,
    },
    attendance: {
      present: 0,
      absent: 0,
      late: 0,
    },
    recentNotices: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/dashboard/admin");

        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to load dashboard."
          );
        }

        const data = response.data.data;

        if (isMounted) {
          setDashboardData({
            overview: {
              ...data.overview,
            },
            attendance: {
              ...data.attendance,
            },
            recentNotices: Array.isArray(data.recentNotices)
              ? data.recentNotices
              : [],
          });
        }
      } catch (err) {
        console.error("Admin dashboard error:", err);

        if (isMounted) {
          setError(
            err.response?.data?.error ||
              err.response?.data?.message ||
              err.message ||
              "Dashboard data load korte problem hocche."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const attendance = dashboardData.attendance;

  const attendanceTotal =
    attendance.present + attendance.absent + attendance.late;

  const getPercentage = (value) => {
    if (!attendanceTotal) return 0;

    return Math.round((value / attendanceTotal) * 100);
  };

  const notices = dashboardData.recentNotices.map((notice) => ({
    id: notice._id,
    title: notice.title || "Untitled notice",
    date: notice.publishDate || notice.createdAt
      ? new Date(
          notice.publishDate || notice.createdAt
        ).toLocaleDateString()
      : "Date unavailable",
    type: notice.targetRole || "General",
  }));

  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <Link
            to="/admin/dashboard"
            onClick={() => setActiveMenu("Dashboard")}
            className="flex items-center gap-3"
          >
            <div className="rounded-xl bg-blue-600 p-2.5 text-white">
              <GraduationCap size={27} />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Education
              </h1>
              <p className="text-xs text-slate-500">
                School Management
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-4 pb-2 pt-6">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.label;

            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => {
                  setActiveMenu(item.label);
                  setSidebarOpen(false);
                }}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-blue-700"
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                Administrator
              </p>
              <p className="text-xs text-slate-500">
                Admin Account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut size={19} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="space-y-8">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 lg:px-9">
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
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                Admin Dashboard
              </h2>
              <p className="hidden text-xs text-slate-500 sm:block">
                Overview of your school
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <label className="relative hidden md:block">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notices..."
                className="w-48 rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 lg:w-64"
              />
            </label>

            <Link
              to="/admin/notices"
              onClick={() => setActiveMenu("Notices")}
              aria-label="Notifications"
              className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            >
              <Bell size={20} />
              {dashboardData.overview.totalNotices > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
              )}
            </Link>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              A
            </div>
          </div>
        </header>

        <div className="space-y-7 p-4 sm:p-7 lg:p-9">
          {/* API error */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              <p className="font-semibold">
                Dashboard data load failed
              </p>
              <p className="mt-1">{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-3 rounded-lg bg-rose-100 px-3 py-2 font-semibold hover:bg-rose-200"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Welcome */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white sm:p-8">
            <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/5" />

            <div className="relative max-w-2xl">
              <p className="mb-2 text-sm font-medium text-blue-100">
                SCHOOL ADMINISTRATION
              </p>

              <h3 className="text-2xl font-bold sm:text-3xl">
                Welcome back, Admin!
              </h3>

              <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">
                Manage students, teachers, classes, attendance, results and
                other school activities from one place.
              </p>

              <Link
                to="/admin/students"
                onClick={() => setActiveMenu("Students")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Manage School <ArrowUpRight size={17} />
              </Link>
            </div>
          </section>

          {/* Statistics */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  School Overview
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  A quick look at your school statistics
                </p>
              </div>

              <span className="rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                Overview
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statsConfig.map((stat) => {
                const Icon = stat.icon;
                const value = dashboardData.overview[stat.key] ?? 0;

                return (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className={`rounded-xl p-3 ${stat.color}`}>
                        <Icon size={22} />
                      </div>
                      <TrendingUp size={18} className="text-emerald-500" />
                    </div>

                    <p className="mt-5 text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {loading ? "..." : value.toLocaleString()}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {stat.note}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Attendance and notices */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 xl:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Attendance Overview
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Attendance records from your school
                  </p>
                </div>

                <Link
                  to="/admin/attendance"
                  onClick={() => setActiveMenu("Attendance")}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View All
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <CheckCircle2 className="text-emerald-600" size={23} />
                  <p className="mt-3 text-sm text-emerald-700">Present</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-800">
                    {loading ? "..." : `${getPercentage(attendance.present)}%`}
                  </p>
                  <p className="mt-1 text-xs text-emerald-600">
                    {loading ? "Loading..." : `${attendance.present} records`}
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50 p-4">
                  <AlertCircle className="text-rose-600" size={23} />
                  <p className="mt-3 text-sm text-rose-700">Absent</p>
                  <p className="mt-1 text-2xl font-bold text-rose-800">
                    {loading ? "..." : `${getPercentage(attendance.absent)}%`}
                  </p>
                  <p className="mt-1 text-xs text-rose-600">
                    {loading ? "Loading..." : `${attendance.absent} records`}
                  </p>
                </div>

                <div className="rounded-xl bg-amber-50 p-4">
                  <Clock className="text-amber-600" size={23} />
                  <p className="mt-3 text-sm text-amber-700">Late</p>
                  <p className="mt-1 text-2xl font-bold text-amber-800">
                    {loading ? "..." : `${getPercentage(attendance.late)}%`}
                  </p>
                  <p className="mt-1 text-xs text-amber-600">
                    {loading ? "Loading..." : `${attendance.late} records`}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    Present attendance rate
                  </span>
                  <span className="font-bold text-slate-900">
                    {loading ? "..." : `${getPercentage(attendance.present)}%`}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{
                      width: `${
                        loading ? 0 : getPercentage(attendance.present)
                      }%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {loading
                    ? "Loading attendance..."
                    : `${attendanceTotal} total attendance records`}
                </p>
              </div>
            </div>

            {/* Recent Notices */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Recent Notices
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest school updates
                  </p>
                </div>

                <Link
                  to="/admin/notices"
                  onClick={() => setActiveMenu("Notices")}
                  aria-label="View notices"
                  className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                >
                  <ArrowUpRight size={18} />
                </Link>
              </div>

              <div className="mt-5 space-y-4">
                {loading ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Loading notices...
                  </p>
                ) : filteredNotices.length > 0 ? (
                  filteredNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <Bell size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-5 text-slate-800">
                          {notice.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {notice.date}
                        </p>

                        <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                          {notice.type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-sm text-slate-500">
                    {search
                      ? "No matching notices found."
                      : "No notices available yet."}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Quick Actions
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Quickly access common school management tasks
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.label}
                    to={action.path}
                    onClick={() => {
                      const menuItem = menuItems.find(
                        (item) => item.path === action.path
                      );
                      if (menuItem) setActiveMenu(menuItem.label);
                    }}
                    className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={22} />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {action.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Open section
                      </p>
                    </div>

                    <ArrowUpRight
                      size={17}
                      className="text-slate-400 transition group-hover:text-blue-600"
                    />
                  </Link>
                );
              })}
            </div>
          </section>

          <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">
            © 2026 Education School Management System. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}

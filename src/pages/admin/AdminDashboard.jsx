
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  UserRound,
  School,
  BookOpen,
  CalendarCheck,
  Wallet,
  Banknote,
  Bell,
  Search,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

// Dashboard Statistics
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

// Quick Actions
const quickActions = [
  {
    label: "Manage Students",
    icon: Users,
    path: "/admin/students",
  },
  {
    label: "Manage Teachers",
    icon: UserRound,
    path: "/admin/teachers",
  },
  {
    label: "Take Attendance",
    icon: CalendarCheck,
    path: "/admin/attendance",
  },
  {
    label: "Publish Notice",
    icon: Bell,
    path: "/admin/notices",
  },
];

export default function AdminDashboard() {
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

  // Fetch Dashboard Data
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

      setDashboardData({
        overview: {
          totalStudents: data.overview?.totalStudents || 0,
          totalTeachers: data.overview?.totalTeachers || 0,
          totalClasses: data.overview?.totalClasses || 0,
          totalSubjects: data.overview?.totalSubjects || 0,
          totalAttendance: data.overview?.totalAttendance || 0,
          totalResults: data.overview?.totalResults || 0,
          totalNotices: data.overview?.totalNotices || 0,
        },
        attendance: {
          present: data.attendance?.present || 0,
          absent: data.attendance?.absent || 0,
          late: data.attendance?.late || 0,
        },
        recentNotices: Array.isArray(data.recentNotices)
          ? data.recentNotices
          : [],
      });
    } catch (err) {
      console.error("Admin dashboard error:", err);

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Dashboard data load korte problem hocche."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Attendance Calculation
  const attendance = dashboardData.attendance;

  const present = Number(attendance.present || 0);
  const absent = Number(attendance.absent || 0);
  const late = Number(attendance.late || 0);

  const attendanceTotal = present + absent + late;

  const getPercentage = (value) => {
    if (!attendanceTotal) return 0;

    return Math.round(
      (Number(value || 0) / attendanceTotal) * 100
    );
  };

  // Notice Formatting
  const notices = dashboardData.recentNotices.map((notice) => ({
    id: notice._id,
    title: notice.title || "Untitled notice",
    date:
      notice.publishDate || notice.createdAt
        ? new Date(
            notice.publishDate || notice.createdAt
          ).toLocaleDateString()
        : "Date unavailable",
    type: notice.targetRole || "General",
  }));

  // Notice Search
  const filteredNotices = notices.filter((notice) =>
    notice.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full min-w-0 space-y-6 bg-slate-50 text-slate-700 sm:space-y-8">

      {/* Dashboard Header */}
      <header className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 py-4 sm:px-5 sm:py-5 lg:px-8">

        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
            Admin Dashboard
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Overview of your school
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-4">

          {/* Desktop Search */}
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

          {/* Notifications */}
          <Link
            to="/admin/notices"
            aria-label="Notifications"
            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
          >
            <Bell size={19} />

            {dashboardData.overview.totalNotices > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500" />
            )}
          </Link>
        </div>
      </header>

      {/* Dashboard Body */}
      <div className="w-full min-w-0 space-y-6 px-3 pb-6 sm:space-y-8 sm:px-5 lg:px-8">

        {/* API Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={21}
                className="mt-0.5 shrink-0"
              />

              <div className="min-w-0">
                <p className="font-semibold">
                  Dashboard data load failed
                </p>

                <p className="mt-1 break-words">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={fetchDashboard}
                  className="mt-3 rounded-lg bg-rose-100 px-3 py-2 font-semibold hover:bg-rose-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <section className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-5 text-white shadow-sm sm:rounded-3xl sm:p-7 lg:p-8">

          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/10" />

          <div className="pointer-events-none absolute -bottom-24 right-10 h-48 w-48 rounded-full bg-white/5 sm:right-40" />

          <div className="relative max-w-2xl">
            <p className="mb-2 text-xs font-medium tracking-wide text-blue-100 sm:text-sm">
              SCHOOL ADMINISTRATION
            </p>

            <h3 className="break-words text-xl font-bold sm:text-2xl lg:text-3xl">
              Welcome back, Admin!
            </h3>

            <p className="mt-3 max-w-xl text-xs leading-6 text-blue-100 sm:text-sm lg:text-base">
              Manage students, teachers, classes, attendance,
              results and other school activities from one place.
            </p>

            <Link
              to="/admin/students"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Manage School
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </section>

        {/* School Overview */}
        <section className="min-w-0">

          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                School Overview
              </h3>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                A quick look at your school statistics
              </p>
            </div>

            <span className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
              Overview
            </span>
          </div>

          <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
            {statsConfig.map((stat) => {
              const Icon = stat.icon;
              const value = dashboardData.overview[stat.key] ?? 0;

              return (
                <div
                  key={stat.title}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:shadow-md sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`shrink-0 rounded-lg p-2 sm:rounded-xl sm:p-3 ${stat.color}`}
                    >
                      <Icon size={19} className="sm:hidden" />
                      <Icon
                        size={23}
                        className="hidden sm:block"
                      />
                    </div>

                    <TrendingUp
                      size={17}
                      className="shrink-0 text-emerald-500"
                    />
                  </div>

                  <p className="mt-4 break-words text-xs font-medium text-slate-500 sm:mt-5 sm:text-sm">
                    {stat.title}
                  </p>

                  <p className="mt-1 break-words text-xl font-bold text-slate-900 sm:text-3xl">
                    {loading
                      ? "..."
                      : Number(value).toLocaleString()}
                  </p>

                  <p className="mt-2 break-words text-[10px] text-slate-400 sm:text-xs">
                    {stat.note}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Attendance and Notices */}
        <section className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">

          {/* Attendance Overview */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 xl:col-span-2">

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 sm:text-lg">
                  Attendance Overview
                </h3>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Attendance records from your school
                </p>
              </div>

              <Link
                to="/admin/attendance"
                className="shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 sm:text-sm"
              >
                View All
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-7 sm:gap-4">

              {/* Present */}
              <div className="min-w-0 rounded-xl bg-emerald-50 p-2.5 sm:p-4">
                <CheckCircle2
                  className="text-emerald-600"
                  size={20}
                />

                <p className="mt-3 text-xs text-emerald-700 sm:text-sm">
                  Present
                </p>

                <p className="mt-1 break-words text-lg font-bold text-emerald-800 sm:text-2xl">
                  {loading ? "..." : `${getPercentage(present)}%`}
                </p>

                <p className="mt-1 break-words text-[10px] text-emerald-600 sm:text-xs">
                  {loading ? "Loading..." : `${present} records`}
                </p>
              </div>

              {/* Absent */}
              <div className="min-w-0 rounded-xl bg-rose-50 p-2.5 sm:p-4">
                <AlertCircle
                  className="text-rose-600"
                  size={20}
                />

                <p className="mt-3 text-xs text-rose-700 sm:text-sm">
                  Absent
                </p>

                <p className="mt-1 break-words text-lg font-bold text-rose-800 sm:text-2xl">
                  {loading ? "..." : `${getPercentage(absent)}%`}
                </p>

                <p className="mt-1 break-words text-[10px] text-rose-600 sm:text-xs">
                  {loading ? "Loading..." : `${absent} records`}
                </p>
              </div>

              {/* Late */}
              <div className="min-w-0 rounded-xl bg-amber-50 p-2.5 sm:p-4">
                <Clock
                  className="text-amber-600"
                  size={20}
                />

                <p className="mt-3 text-xs text-amber-700 sm:text-sm">
                  Late
                </p>

                <p className="mt-1 break-words text-lg font-bold text-amber-800 sm:text-2xl">
                  {loading ? "..." : `${getPercentage(late)}%`}
                </p>

                <p className="mt-1 break-words text-[10px] text-amber-600 sm:text-xs">
                  {loading ? "Loading..." : `${late} records`}
                </p>
              </div>
            </div>

            {/* Attendance Progress */}
            <div className="mt-5 rounded-xl bg-slate-50 p-3 sm:mt-6 sm:p-4">
              <div className="mb-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="font-medium text-slate-600">
                  Present attendance rate
                </span>

                <span className="shrink-0 font-bold text-slate-900">
                  {loading ? "..." : `${getPercentage(present)}%`}
                </span>
              </div>

              <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${
                      loading ? 0 : getPercentage(present)
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
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">

            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 sm:text-lg">
                  Recent Notices
                </h3>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Latest school updates
                </p>
              </div>

              <Link
                to="/admin/notices"
                aria-label="View notices"
                className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
              >
                <ArrowUpRight size={18} />
              </Link>
            </div>

            {/* Mobile Search */}
            <div className="relative mt-4 md:hidden">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notices..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
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
                    className="flex min-w-0 gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Bell size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold leading-5 text-slate-800">
                        {notice.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {notice.date}
                      </p>

                      <span className="mt-2 inline-block max-w-full break-words rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
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
        <section className="min-w-0">

          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
              Quick Actions
            </h3>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Quickly access common school management tasks
            </p>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.label}
                  to={action.path}
                  className="group flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md sm:gap-4 sm:p-5"
                >
                  <div className="shrink-0 rounded-xl bg-blue-50 p-3 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={21} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-slate-800">
                      {action.label}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Open section
                    </p>
                  </div>

                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-slate-400 transition group-hover:text-blue-600"
                  />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-400">
          © 2026 Education School Management System. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

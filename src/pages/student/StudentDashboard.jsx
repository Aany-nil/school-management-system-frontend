
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  CalendarCheck,
  ClipboardList,
  Wallet,
  BookOpen,
  Bell,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import api from "../../services/api";

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/dashboard/student");
        const result = response.data;

        setDashboard(result?.data ?? result);
      } catch (err) {
        console.error("Student dashboard error:", err);
        setError(
          err.response?.data?.message ||
            "Dashboard data could not be loaded. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const studentName = dashboard?.student?.name || user?.name || "Student";

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-blue-600" size={36} />
          <p className="mt-3 text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-6">
        <AlertCircle className="mb-3 text-red-500" size={30} />
        <h2 className="font-bold text-slate-900">
          Unable to load dashboard
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // These values depend on the response structure of your backend.
  const attendance = dashboard?.attendance ?? {};
  const results = dashboard?.results ?? [];
  const fee = dashboard?.fee ?? {};
  const notices = dashboard?.notices ?? [];
  const routine = dashboard?.routine ?? [];

  const attendancePercentage =
    attendance.percentage ??
    (attendance.total > 0
      ? Math.round((Number(attendance.present || 0) / attendance.total) * 100)
      : 0);

  const stats = [
    {
      title: "Attendance",
      value: `${attendancePercentage}%`,
      subtitle: "Attendance rate",
      icon: CalendarCheck,
      color: "bg-blue-100 text-blue-700",
      path: "/student/attendance",
    },
    {
      title: "My Results",
      value: results.length,
      subtitle: "Recorded results",
      icon: ClipboardList,
      color: "bg-violet-100 text-violet-700",
      path: "/student/results",
    },
    {
      title: "Total Fees",
      value: `৳${Number(fee.totalFee || 0).toLocaleString()}`,
      subtitle: "Your payable fees",
      icon: Wallet,
      color: "bg-amber-100 text-amber-700",
      path: "/student/fees",
    },
    {
      title: "Due Amount",
      value: `৳${Number(
        fee.dueAmount ??
          Math.max(
            0,
            Number(fee.totalFee || 0) - Number(fee.paidAmount || 0)
          )
      ).toLocaleString()}`,
      subtitle: "Outstanding fees",
      icon: Wallet,
      color: "bg-rose-100 text-rose-700",
      path: "/student/fees",
    },
  ];

  const getNoticeTitle = (notice) =>
    notice.title || notice.noticeTitle || "School Notice";

  const getNoticeDate = (notice) => {
    const date = notice.publishDate || notice.createdAt;

    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Date unavailable"
      : parsedDate.toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-white/5" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
              <GraduationCap size={16} />
              Student Dashboard
            </div>

            <h1 className="text-2xl font-bold sm:text-3xl">
              Welcome back, {studentName}!
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
              Here is an overview of your attendance, academic results,
              fees and school announcements.
            </p>
          </div>

          <div className="hidden rounded-2xl bg-white/10 p-5 sm:block">
            <GraduationCap size={58} strokeWidth={1.5} />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Academic Overview
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Your academic information at a glance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                to={stat.path}
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>
                    <h3 className="mt-3 break-words text-2xl font-bold text-slate-900">
                      {stat.value}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {stat.subtitle}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${stat.color}`}>
                    <Icon size={23} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Attendance and fees */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">
                Attendance Summary
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Your recorded attendance
              </p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
              <CalendarCheck size={22} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-green-50 p-3 text-center">
              <CheckCircle2 className="mx-auto text-green-600" size={21} />
              <p className="mt-2 text-xl font-bold text-green-700">
                {attendance.present ?? 0}
              </p>
              <p className="text-xs text-slate-500">Present</p>
            </div>

            <div className="rounded-xl bg-red-50 p-3 text-center">
              <XCircle className="mx-auto text-red-600" size={21} />
              <p className="mt-2 text-xl font-bold text-red-700">
                {attendance.absent ?? 0}
              </p>
              <p className="text-xs text-slate-500">Absent</p>
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <Clock className="mx-auto text-amber-600" size={21} />
              <p className="mt-2 text-xl font-bold text-amber-700">
                {attendance.late ?? 0}
              </p>
              <p className="text-xs text-slate-500">Late</p>
            </div>
          </div>

          <Link
            to="/student/attendance"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View attendance <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Fee Summary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your payment overview
              </p>
            </div>
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700">
              <Wallet size={22} />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Total Fees</span>
              <span className="font-semibold text-slate-900">
                ৳{Number(fee.totalFee || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-500">Paid Amount</span>
              <span className="font-semibold text-green-700">
                ৳{Number(fee.paidAmount || 0).toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-sm font-medium text-slate-600">
                Due Amount
              </span>
              <span className="font-bold text-red-600">
                ৳{Number(
                  fee.dueAmount ??
                    Math.max(
                      0,
                      Number(fee.totalFee || 0) -
                        Number(fee.paidAmount || 0)
                    )
                ).toLocaleString()}
              </span>
            </div>
          </div>

          <Link
            to="/student/fees"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View fee details <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Results and routine */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Recent Results</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your latest academic results
              </p>
            </div>
            <ClipboardList className="text-violet-600" size={23} />
          </div>

          {results.length > 0 ? (
            <div className="mt-5 space-y-3">
              {results.slice(0, 5).map((result, index) => (
                <div
                  key={result._id || result.id || index}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {result.subjectName ||
                        result.subjectId?.name ||
                        result.subject?.name ||
                        "Subject"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {result.examName || "Examination"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {result.marks ?? 0}/{result.totalMarks ?? 0}
                    </p>
                    <p className="text-xs font-semibold text-violet-700">
                      {result.grade || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <ClipboardList className="mx-auto text-slate-300" size={38} />
              <p className="mt-3 text-sm text-slate-500">
                No results available yet.
              </p>
            </div>
          )}

          <Link
            to="/student/results"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View all results <ArrowRight size={16} />
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">My Routine</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your class schedule
              </p>
            </div>
            <BookOpen className="text-blue-600" size={23} />
          </div>

          {routine.length > 0 ? (
            <div className="mt-5 space-y-3">
              {routine.slice(0, 5).map((item, index) => (
                <div
                  key={item._id || item.id || index}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                    <Clock size={19} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800">
                      {item.subjectName ||
                        item.subjectId?.name ||
                        item.subject?.name ||
                        "Class"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.day || item.dayOfWeek || "Scheduled class"}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {item.startTime || item.time || ""}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <BookOpen className="mx-auto text-slate-300" size={38} />
              <p className="mt-3 text-sm text-slate-500">
                No routine available yet.
              </p>
            </div>
          )}

          <Link
            to="/student/routine"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View full routine <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Notices */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">School Notices</h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest announcements from your school
            </p>
          </div>
          <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700">
            <Bell size={22} />
          </div>
        </div>

        {notices.length > 0 ? (
          <div className="mt-5 divide-y divide-slate-100">
            {notices.slice(0, 5).map((notice, index) => (
              <div
                key={notice._id || notice.id || index}
                className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="mt-1 rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Bell size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-800">
                    {getNoticeTitle(notice)}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {notice.message || notice.description || notice.content || ""}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {getNoticeDate(notice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Bell className="mx-auto text-slate-300" size={38} />
            <p className="mt-3 text-sm text-slate-500">
              There are no notices to display.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}


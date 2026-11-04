
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
  const [routines, setRoutines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [routineLoading, setRoutineLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch Dashboard Data
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/dashboard/student");
        const result = response.data;

        if (!result?.success) {
          throw new Error(
            result?.message || "Dashboard data could not be loaded."
          );
        }

        setDashboard(result.data || {});
      } catch (err) {
        console.error("Student dashboard error:", err);

        setError(
          err.response?.data?.message ||
            err.message ||
            "Dashboard data could not be loaded. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // Fetch Student Routine
  useEffect(() => {
    const fetchStudentRoutine = async () => {
      try {
        setRoutineLoading(true);

        const response = await api.get("/routine/all");
        const routineData = response.data?.data;

        setRoutines(
          Array.isArray(routineData) ? routineData : []
        );
      } catch (err) {
        console.error(
          "Student routine loading error:",
          err.response?.data || err.message
        );

        setRoutines([]);
      } finally {
        setRoutineLoading(false);
      }
    };

    fetchStudentRoutine();
  }, []);

  // Logged-in User
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const studentName =
    dashboard?.profile?.name || user?.name || "Student";

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center px-4">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-blue-600"
            size={36}
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-4 sm:p-6">
        <AlertCircle className="mb-3 text-red-500" size={30} />

        <h2 className="font-bold text-slate-900">
          Unable to load dashboard
        </h2>

        <p className="mt-2 break-words text-sm text-red-600">
          {error}
        </p>

        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const attendance = dashboard?.attendance || {};

  const results = Array.isArray(dashboard?.results)
    ? dashboard.results
    : [];

  const fees = dashboard?.fees || {};

  const notices = Array.isArray(dashboard?.recentNotices)
    ? dashboard.recentNotices
    : [];

  const present = Number(attendance.present || 0);
  const absent = Number(attendance.absent || 0);
  const late = Number(attendance.late || 0);

  const totalAttendance = present + absent + late;

  const attendancePercentage =
    totalAttendance > 0
      ? Math.round((present / totalAttendance) * 100)
      : 0;

  // Fee Calculation
  const totalFee = Number(fees.totalFee || 0);
  const paidFee = Number(fees.paidFee || 0);
  const dueFee = Number(fees.dueFee || 0);

  // Dashboard Statistics
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
      value: `৳${totalFee.toLocaleString()}`,
      subtitle: "Your payable fees",
      icon: Wallet,
      color: "bg-amber-100 text-amber-700",
      path: "/student/fees",
    },
    {
      title: "Due Amount",
      value: `৳${dueFee.toLocaleString()}`,
      subtitle: "Outstanding fees",
      icon: Wallet,
      color: "bg-rose-100 text-rose-700",
      path: "/student/fees",
    },
  ];

  // Notice Helpers
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
    <div className="w-full min-w-0 space-y-6 sm:space-y-8">

      {/* Welcome Section */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-5 text-white shadow-lg sm:rounded-3xl sm:p-8">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-10 h-48 w-48 rounded-full bg-white/5 sm:right-40" />

        <div className="relative flex min-w-0 flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-6">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">
              <GraduationCap size={16} />
              Student Dashboard
            </div>

            <h1 className="break-words text-xl font-bold sm:text-2xl lg:text-3xl">
              Welcome back, {studentName}!
            </h1>

            <p className="mt-3 max-w-xl text-xs leading-6 text-blue-100 sm:text-sm lg:text-base">
              Here is an overview of your attendance, academic results,
              fees and school announcements.
            </p>
          </div>

          <div className="hidden shrink-0 rounded-2xl bg-white/10 p-5 sm:block">
            <GraduationCap size={58} strokeWidth={1.5} />
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="w-full min-w-0">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Academic Overview
          </h2>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Your academic information at a glance.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <Link
                to={stat.path}
                key={stat.title}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:rounded-2xl sm:p-5"
              >
                <div className="flex min-w-0 items-start justify-between gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-xs font-medium text-slate-500 sm:text-sm">
                      {stat.title}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-bold text-slate-900 sm:mt-3 sm:text-2xl">
                      {stat.value}
                    </h3>

                    <p className="mt-1 break-words text-[10px] text-slate-500 sm:mt-2 sm:text-xs">
                      {stat.subtitle}
                    </p>
                  </div>

                  <div
                    className={`shrink-0 rounded-lg p-2 sm:rounded-xl sm:p-3 ${stat.color}`}
                  >
                    <Icon size={19} className="sm:hidden" />
                    <Icon size={23} className="hidden sm:block" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Attendance and Fees */}
      <section className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">

        {/* Attendance Summary */}
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">
                Attendance Summary
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Your recorded attendance
              </p>
            </div>

            <div className="shrink-0 rounded-xl bg-blue-100 p-2.5 text-blue-700 sm:p-3">
              <CalendarCheck size={21} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            <div className="rounded-xl bg-green-50 p-2 text-center sm:p-3">
              <CheckCircle2
                className="mx-auto text-green-600"
                size={20}
              />

              <p className="mt-2 text-lg font-bold text-green-700 sm:text-xl">
                {present}
              </p>

              <p className="text-[10px] text-slate-500 sm:text-xs">
                Present
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-2 text-center sm:p-3">
              <XCircle
                className="mx-auto text-red-600"
                size={20}
              />

              <p className="mt-2 text-lg font-bold text-red-700 sm:text-xl">
                {absent}
              </p>

              <p className="text-[10px] text-slate-500 sm:text-xs">
                Absent
              </p>
            </div>

            <div className="rounded-xl bg-amber-50 p-2 text-center sm:p-3">
              <Clock
                className="mx-auto text-amber-600"
                size={20}
              />

              <p className="mt-2 text-lg font-bold text-amber-700 sm:text-xl">
                {late}
              </p>

              <p className="text-[10px] text-slate-500 sm:text-xs">
                Late
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex justify-between gap-2 text-xs text-slate-500">
              <span>Attendance Rate</span>

              <span className="font-semibold text-blue-700">
                {attendancePercentage}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>
          </div>

          <Link
            to="/student/attendance"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 sm:text-sm"
          >
            View attendance <ArrowRight size={16} />
          </Link>
        </div>

        {/* Fee Summary */}
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">
                Fee Summary
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Your payment overview
              </p>
            </div>

            <div className="shrink-0 rounded-xl bg-amber-100 p-2.5 text-amber-700 sm:p-3">
              <Wallet size={21} />
            </div>
          </div>

          <div className="mt-5 space-y-4 sm:mt-6">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 sm:text-sm">
                Total Fees
              </span>

              <span className="break-all text-right text-sm font-semibold text-slate-900 sm:text-base">
                ৳{totalFee.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 sm:text-sm">
                Paid Amount
              </span>

              <span className="break-all text-right text-sm font-semibold text-green-700 sm:text-base">
                ৳{paidFee.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs font-medium text-slate-600 sm:text-sm">
                Due Amount
              </span>

              <span className="break-all text-right text-sm font-bold text-red-600 sm:text-base">
                ৳{dueFee.toLocaleString()}
              </span>
            </div>
          </div>

          <Link
            to="/student/fees"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 sm:text-sm"
          >
            View fee details <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Results and Routine */}
      <section className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">

        {/* Recent Results */}
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">
                Recent Results
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Your latest academic results
              </p>
            </div>

            <ClipboardList
              className="shrink-0 text-violet-600"
              size={23}
            />
          </div>

          {results.length > 0 ? (
            <div className="mt-5 space-y-3">
              {results.slice(0, 5).map((result, index) => (
                <div
                  key={result._id || result.id || index}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 sm:gap-3 sm:p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-slate-800">
                      {result.subjectId?.subjectName ||
                        result.subjectId?.name ||
                        "Subject"}
                    </p>

                    <p className="mt-1 break-words text-xs text-slate-500">
                      {result.examName || "Examination"}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-slate-900 sm:text-base">
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
              <ClipboardList
                className="mx-auto text-slate-300"
                size={38}
              />

              <p className="mt-3 text-sm text-slate-500">
                No results available yet.
              </p>
            </div>
          )}

          <Link
            to="/student/results"
            className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 sm:text-sm"
          >
            View all results <ArrowRight size={16} />
          </Link>
        </div>

        {/* My Routine */}
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">
                My Routine
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Your assigned class schedule
              </p>
            </div>

            <BookOpen
              className="shrink-0 text-blue-600"
              size={23}
            />
          </div>

          {routineLoading ? (
            <div className="py-10 text-center">
              <LoaderCircle
                className="mx-auto animate-spin text-blue-600"
                size={30}
              />

              <p className="mt-2 text-sm text-slate-500">
                Loading routine...
              </p>
            </div>
          ) : routines.length > 0 ? (
            <div className="mt-5 space-y-3">
              {routines.slice(0, 4).map((routine) => (
                <div
                  key={routine._id}
                  className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-slate-50 p-3 sm:gap-3 sm:p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-slate-800">
                      {routine.subjectId?.subjectName || "Subject"}
                    </p>

                    <p className="mt-1 break-words text-xs text-slate-500">
                      {routine.teacherId?.name || "Teacher"}
                    </p>

                    <p className="mt-1 text-xs font-medium capitalize text-blue-600">
                      {routine.day}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-slate-700 sm:text-sm">
                      {routine.startTime}
                    </p>

                    <p className="text-xs text-slate-500">
                      to {routine.endTime}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <BookOpen
                className="mx-auto text-slate-300"
                size={38}
              />

              <p className="mt-3 text-sm text-slate-500">
                No routine available for your class yet.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Please contact Admin if your class has not been assigned.
              </p>
            </div>
          )}

          <Link
            to="/student/routine"
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 sm:text-sm"
          >
            View full routine <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* School Notices */}
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900">
              School Notices
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Latest announcements from your school
            </p>
          </div>

          <div className="shrink-0 rounded-xl bg-indigo-100 p-2.5 text-indigo-700 sm:p-3">
            <Bell size={21} />
          </div>
        </div>

        {notices.length > 0 ? (
          <div className="mt-5 divide-y divide-slate-100">
            {notices.slice(0, 5).map((notice, index) => (
              <div
                key={notice._id || notice.id || index}
                className="flex min-w-0 items-start gap-3 py-4 first:pt-0 last:pb-0"
              >
                <div className="mt-1 shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Bell size={17} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold text-slate-800 sm:text-base">
                    {getNoticeTitle(notice)}
                  </h3>

                  <p className="mt-1 break-words text-xs leading-6 text-slate-500 sm:text-sm">
                    {notice.message ||
                      notice.description ||
                      notice.content ||
                      ""}
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
            <Bell
              className="mx-auto text-slate-300"
              size={38}
            />

            <p className="mt-3 text-sm text-slate-500">
              There are no notices to display.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

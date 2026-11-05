import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import {
  CalendarDays,
  Clock,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Search,
  AlertCircle,
  Filter,
  CalendarCheck,
  Printer,
} from "lucide-react";

const days = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const getRoutineArray = (response) => {
  const result = response?.data;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;

  return [];
};

const normalizeDay = (day) => {
  if (!day) return "";

  const formatted = String(day).trim().toLowerCase();

  return (
    days.find((item) => item.toLowerCase() === formatted) || ""
  );
};

const escapeHTML = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatTimeForPrint = (time) => {
  if (!time) return "N/A";

  const [hours, minutes] = time.split(":");
  const hour = Number(hours);
  const minute = Number(minutes);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return time;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

const RoutineSystem = () => {
  const [routines, setRoutines] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");

  // Fetch teacher's own routines
  const fetchMyRoutine = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/routine/my-routine");

      setRoutines(getRoutineArray(response));
    } catch (err) {
      console.error("Routine fetch error:", err);

      setRoutines([]);
      setError(
        err.response?.data?.message ||
          "Failed to load routine. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch school information for printing
  const fetchSchoolInfo = async () => {
    try {
      const response = await api.get("/settings/school-info");

      const data =
        response.data?.data?.school ||
        response.data?.school ||
        response.data?.data ||
        response.data;

      setSchoolInfo(data || {});
    } catch (err) {
      console.error("School information fetch error:", err);
      setSchoolInfo({});
    }
  };

  useEffect(() => {
    fetchMyRoutine();
    fetchSchoolInfo();
  }, []);

  // Search and day filtering
  const filteredRoutines = useMemo(() => {
    return routines.filter((routine) => {
      const subjectName = routine.subjectId?.subjectName || "";
      const className = routine.classId?.className || "";
      const section = routine.classId?.section || "";
      const subjectCode = routine.subjectId?.subjectCode || "";

      const matchesSearch = [
        subjectName,
        subjectCode,
        className,
        section,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const routineDay = normalizeDay(routine.day);

      const matchesDay =
        selectedDay === "All" || routineDay === selectedDay;

      return matchesSearch && matchesDay;
    });
  }, [routines, search, selectedDay]);

  const getDayRoutines = (day) => {
    return filteredRoutines
      .filter((routine) => normalizeDay(routine.day) === day)
      .sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      );
  };

  const formatTime = (time) => {
    if (!time) return "N/A";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(new Date());

  const totalSubjects = new Set(
    routines
      .map((routine) => routine.subjectId?._id)
      .filter(Boolean)
  ).size;

  const todayClasses = routines.filter(
    (routine) => normalizeDay(routine.day) === today
  ).length;

  const clearFilters = () => {
    setSearch("");
    setSelectedDay("All");
  };

  // Print teacher's own routine
  const handlePrint = () => {
    if (!filteredRoutines.length) {
      setError("No routine available to print.");
      return;
    }

    setError("");

    const printWindow = window.open(
      "",
      "_blank",
      "width=1100,height=750"
    );

    if (!printWindow) {
      setError("Please allow pop-ups to print the routine.");
      return;
    }

    const schoolName =
      schoolInfo.schoolName || schoolInfo.name || "My School";

    const schoolAddress =
      schoolInfo.schoolAddress || schoolInfo.address || "";

    const schoolPhone = schoolInfo.schoolPhone || "";
    const schoolEmail = schoolInfo.schoolEmail || "";
    const logo = schoolInfo.logo || schoolInfo.schoolLogo || "";

    const printDate = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const sortedRoutines = [...filteredRoutines].sort((a, b) => {
      const dayOrder = days.indexOf(normalizeDay(a.day));
      const otherDayOrder = days.indexOf(normalizeDay(b.day));

      if (dayOrder !== otherDayOrder) {
        return dayOrder - otherDayOrder;
      }

      return String(a.startTime || "").localeCompare(
        String(b.startTime || "")
      );
    });

    const rows = sortedRoutines
      .map((routine, index) => {
        const className =
          routine.classId?.className || "Class";

        const section = routine.classId?.section
          ? ` - Section ${routine.classId.section}`
          : "";

        const subjectName =
          routine.subjectId?.subjectName || "Subject not available";

        const subjectCode =
          routine.subjectId?.subjectCode || "";

        const teacherName =
          routine.teacherId?.name ||
          routine.teacherId?.fullName ||
          routine.teacherId?.email ||
          "Assigned Teacher";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(className + section)}</td>
            <td>
              ${escapeHTML(subjectName)}
              ${
                subjectCode
                  ? `<br /><small>Code: ${escapeHTML(subjectCode)}</small>`
                  : ""
              }
            </td>
            <td>${escapeHTML(teacherName)}</td>
            <td>${escapeHTML(normalizeDay(routine.day) || routine.day || "N/A")}</td>
            <td>${escapeHTML(formatTimeForPrint(routine.startTime))}</td>
            <td>${escapeHTML(formatTimeForPrint(routine.endTime))}</td>
          </tr>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>My Teaching Routine</title>
          <meta charset="UTF-8" />

          <style>
            @page {
              size: A4 landscape;
              margin: 15mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 10px;
            }

            .header {
              text-align: center;
              border-bottom: 2px solid #bdccec;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }

            .logo {
              width: 65px;
              height: 65px;
              object-fit: contain;
              margin-bottom: 8px;
            }

            h1 {
              margin: 5px 0;
              font-size: 25px;
            }

            .school-info {
              font-size: 12px;
              color: #475569;
              line-height: 1.7;
            }

            .report-title {
              text-align: center;
              margin: 20px 0;
            }

            .report-title h2 {
              font-size: 19px;
              margin-bottom: 5px;
            }

            .report-title p {
              font-size: 12px;
              color: #64748b;
            }

            .meta {
              display: flex;
              justify-content: space-between;
              margin: 15px 0;
              font-size: 12px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }

            th, td {
              border: 1px solid #202328;
              padding: 10px 8px;
              text-align: left;
              font-size: 11px;
            }

            th {
              background: #eff6ff;
              color: #334155;
              font-weight: bold;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            td small {
              color: #64748b;
              font-size: 10px;
            }

            tr {
              page-break-inside: avoid;
            }

            .summary {
              margin-top: 15px;
              font-size: 12px;
              font-weight: bold;
            }

            .signature {
              margin-top: 65px;
              display: flex;
              justify-content: flex-end;
            }

            .signature div {
              width: 190px;
              text-align: center;
              border-top: 1px solid #334155;
              padding-top: 8px;
              font-size: 12px;
            }

            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>

        <body>

          <div class="header">
            ${
              logo
                ? `<img class="logo" src="${escapeHTML(logo)}" alt="School Logo" />`
                : ""
            }

            <h1>${escapeHTML(schoolName)}</h1>

            <div class="school-info">
              ${schoolAddress ? escapeHTML(schoolAddress) + "<br />" : ""}
              ${schoolPhone ? "Phone: " + escapeHTML(schoolPhone) + "<br />" : ""}
              ${schoolEmail ? "Email: " + escapeHTML(schoolEmail) : ""}
            </div>
          </div>

          <div class="report-title">
            <h2>TEACHER CLASS ROUTINE</h2>
            <p>Weekly Teaching Schedule</p>
          </div>

          <div class="meta">
            <span>Total Scheduled Classes: ${sortedRoutines.length}</span>
            <span>Print Date: ${escapeHTML(printDate)}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Class / Section</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Day</th>
                <th>Start Time</th>
                <th>End Time</th>
              </tr>
            </thead>

            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="summary">
            Total Classes: ${sortedRoutines.length}
          </div>

          <div class="signature">
            <div>Authorized Signature</div>
          </div>

        </body>
      </html>
    `);

    printWindow.document.close();

    const images = Array.from(printWindow.document.images);

    const waitForImages = images.map((image) => {
      if (image.complete) return Promise.resolve();

      return new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      });
    });

    Promise.all(waitForImages).then(() => {
      if (!printWindow.closed) {
        printWindow.focus();
        printWindow.print();
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <CalendarDays size={23} />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">
                My Class Routine
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                View your weekly teaching schedule.
              </p>
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={fetchMyRoutine}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || filteredRoutines.length === 0}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Printer size={17} />
              Print Routine
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">

          {/* Total Classes */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Total Classes
              </p>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-10 sm:w-10">
                <CalendarDays size={19} />
              </div>
            </div>

            <h2 className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
              {routines.length}
            </h2>

            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              Weekly scheduled classes
            </p>
          </div>

          {/* Total Subjects */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Total Subjects
              </p>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 sm:h-10 sm:w-10">
                <BookOpen size={19} />
              </div>
            </div>

            <h2 className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
              {totalSubjects}
            </h2>

            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              Different assigned subjects
            </p>
          </div>

          {/* Today's Classes */}
          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5 lg:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Today's Classes
              </p>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:h-10 sm:w-10">
                <Clock size={19} />
              </div>
            </div>

            <h2 className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
              {todayClasses}
            </h2>

            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              Classes scheduled for today
            </p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={17} className="text-blue-600" />

            <h2 className="text-sm font-semibold text-slate-700">
              Search & Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search subject, class or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All Days</option>

              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>

          {(search || selectedDay !== "All") && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {filteredRoutines.length} routine(s) found
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Weekly Routine */}
        <div className="space-y-5">
          {loading ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white">
              <RefreshCw
                size={25}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm text-slate-500">
                Loading your routine...
              </p>
            </div>
          ) : (
            <>
              {days.map((day) => {
                const dayRoutines = getDayRoutines(day);

                if (dayRoutines.length === 0) return null;

                return (
                  <div
                    key={day}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                  >
                    {/* Day Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-3 py-4 sm:px-5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <CalendarDays size={18} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-semibold text-slate-800">
                            {day}
                          </h2>

                          {day === today && (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                              Today
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {dayRoutines.length}{" "}
                        {dayRoutines.length === 1 ? "Class" : "Classes"}
                      </span>
                    </div>

                    {/* Day Classes */}
                    <div className="grid grid-cols-1 gap-3 p-3 min-[480px]:grid-cols-2 sm:gap-4 sm:p-4">
                      {dayRoutines.map((routine) => (
                        <div
                          key={routine._id}
                          className="flex min-w-0 flex-col justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md sm:p-4"
                        >
                          {/* Time */}
                          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 sm:text-sm">
                            <Clock size={16} className="shrink-0" />

                            <span className="break-words">
                              {formatTime(routine.startTime)}
                              {" - "}
                              {formatTime(routine.endTime)}
                            </span>
                          </div>

                          {/* Subject and Class */}
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                              <BookOpen size={20} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="break-words text-sm font-semibold text-slate-800 sm:text-base">
                                {routine.subjectId?.subjectName ||
                                  "Subject not available"}
                              </h3>

                              <p className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500 sm:text-sm">
                                <GraduationCap size={15} />

                                <span>
                                  {routine.classId?.className || "Class"}
                                  {routine.classId?.section
                                    ? ` - Section ${routine.classId.section}`
                                    : ""}
                                </span>
                              </p>

                              {routine.subjectId?.subjectCode && (
                                <p className="mt-1 break-words text-xs text-slate-400">
                                  Subject Code:{" "}
                                  {routine.subjectId.subjectCode}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status */}
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className="text-xs text-slate-400">
                              Class Schedule
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:text-xs">
                              <CalendarCheck size={13} />
                              Scheduled
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {filteredRoutines.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <CalendarDays size={27} />
                  </div>

                  <h3 className="mt-4 font-semibold text-slate-700">
                    No Routine Found
                  </h3>

                  <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                    No routine is available for the selected day or search.
                  </p>

                  {(search || selectedDay !== "All") && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="mt-4 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400">
          Showing {filteredRoutines.length} of {routines.length} scheduled classes.
        </p>
      </div>
    </div>
  );
};

export default RoutineSystem;
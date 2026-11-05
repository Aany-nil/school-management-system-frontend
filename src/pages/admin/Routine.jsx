
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  RefreshCw,
  X,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  Pencil,
  Trash2,
  Clock,
  Printer,
} from "lucide-react";
import api from "../../services/api";

const DAYS = [
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
];

const INITIAL_FORM = {
  classId: "",
  subjectId: "",
  teacherId: "",
  day: "sunday",
  startTime: "",
  endTime: "",
};

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function getArray(response) {
  const body = response?.data;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.data?.classes)) return body.data.classes;
  if (Array.isArray(body?.data?.subjects)) return body.data.subjects;
  if (Array.isArray(body?.data?.teachers)) return body.data.teachers;
  if (Array.isArray(body?.classes)) return body.classes;
  if (Array.isArray(body?.subjects)) return body.subjects;
  if (Array.isArray(body?.teachers)) return body.teachers;

  return [];
}

function getId(value) {
  if (value && typeof value === "object") {
    return value._id || value.id || "";
  }
  return value || "";
}

function getClassLabel(item) {
  if (!item) return "Unknown class";
  if (typeof item === "string") return item;

  const name = item.className || item.name || "Class";
  const section = item.section ? ` - Section ${item.section}` : "";

  return `${name}${section}`;
}

function getSubjectLabel(item) {
  if (!item) return "Unknown subject";
  if (typeof item === "string") return item;

  const name = item.subjectName || item.name || "Subject";
  const code = item.subjectCode ? ` (${item.subjectCode})` : "";

  return `${name}${code}`;
}

function getTeacherLabel(item) {
  if (!item) return "Unknown teacher";
  if (typeof item === "string") return item;

  return item.name || item.fullName || item.email || "Teacher";
}

function formatDay(day) {
  if (!day) return "—";
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}

function formatTime(time) {
  if (!time) return "—";

  const [hourString, minuteString] = time.split(":");
  const hour = Number(hourString);
  const minute = Number(minuteString);

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
}

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function SummaryCard({ title, value, description, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
            {title}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {value}
          </h2>
          <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
            {description}
          </p>
        </div>

        <div className={`shrink-0 rounded-lg p-2 sm:rounded-xl sm:p-3 ${colors[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export default function Routine() {
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({});

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [role] = useState(() => {
    const keys = ["user", "tasmina_user", "school_user", "sms_user"];

    for (const key of keys) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || "null");
        const user = stored?.user || stored;

        if (user?.role) {
          return String(user.role).toLowerCase();
        }
      } catch {

      }
    }

    return String(localStorage.getItem("role") || "").toLowerCase();
  });

  const isAdmin = role === "admin";


  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/routine/all");
      setRoutines(getArray(response));
    } catch (err) {
      setRoutines([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);


  const fetchOptions = useCallback(async () => {
    if (!isAdmin) return;

    const requests = [
      api.get("/class/allclasses"),
      api.get("/subject/allsubject"),
      api.get("/teacher/all-teachers"),
    ];

    const results = await Promise.allSettled(requests);

    if (results[0].status === "fulfilled") {
      setClasses(getArray(results[0].value));
    }

    if (results[1].status === "fulfilled") {
      setSubjects(getArray(results[1].value));
    }

    if (results[2].status === "fulfilled") {
      setTeachers(getArray(results[2].value));
    }

    const failed = results
      .map((result, index) =>
        result.status === "rejected"
          ? ["Class", "Subject", "Teacher"][index]
          : null
      )
      .filter(Boolean);

    if (failed.length) {
      setError(
        `${failed.join(", ")} data could not be loaded. Please check your login and API response.`
      );
    }
  }, [isAdmin]);


  const fetchSchoolInfo = useCallback(async () => {
    try {
      const response = await api.get("/settings/school-info");

      const data =
        response.data?.data?.school ||
        response.data?.school ||
        response.data?.data ||
        response.data;

      setSchoolInfo(data || {});
    } catch (error) {
      setSchoolInfo({});
    }
  }, []);

  useEffect(() => {
    fetchRoutines();
    fetchOptions();
    fetchSchoolInfo();
  }, [fetchRoutines, fetchOptions, fetchSchoolInfo]);

  
  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  
  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  
  const openEditForm = (routine) => {
    setError("");
    setSuccess("");

    setForm({
      classId: getId(routine.classId),
      subjectId: getId(routine.subjectId),
      teacherId: getId(routine.teacherId),
      day: String(routine.day || "sunday").toLowerCase(),
      startTime: routine.startTime || "",
      endTime: routine.endTime || "",
    });

    setEditingId(routine._id);
    setShowForm(true);
  };

  
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.classId ||
      !form.subjectId ||
      !form.teacherId ||
      !form.day ||
      !form.startTime ||
      !form.endTime
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setError("End time must be later than start time.");
      return;
    }

    const payload = {
      classId: form.classId,
      subjectId: form.subjectId,
      teacherId: form.teacherId,
      day: form.day.toLowerCase(),
      startTime: form.startTime,
      endTime: form.endTime,
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.patch(`/routine/routine-update/${editingId}`, payload);
        setSuccess("Routine updated successfully.");
      } else {
        await api.post("/routine/create", payload);
        setSuccess("Routine created successfully.");
      }

      setForm(INITIAL_FORM);
      setEditingId(null);
      setShowForm(false);

      await fetchRoutines();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  
  const handleDelete = async (routineId) => {
    if (!routineId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this routine?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(routineId);

    try {
      await api.delete(`/routine/routine-delete/${routineId}`);
      setSuccess("Routine deleted successfully.");
      await fetchRoutines();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  
  const handlePrint = () => {
    if (!isAdmin) {
      setError("Only admin can print the school routine.");
      return;
    }

    if (!routines.length) {
      setError("No routine available to print.");
      return;
    }

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

    const sortedRoutines = [...routines].sort((a, b) => {
      const dayOrder = DAYS.findIndex(
        (day) => day.value === String(a.day || "").toLowerCase()
      );

      const otherDayOrder = DAYS.findIndex(
        (day) => day.value === String(b.day || "").toLowerCase()
      );

      if (dayOrder !== otherDayOrder) {
        return dayOrder - otherDayOrder;
      }

      return String(a.startTime || "").localeCompare(
        String(b.startTime || "")
      );
    });

    const rows = sortedRoutines
      .map(
        (routine, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(getClassLabel(routine.classId))}</td>
            <td>${escapeHTML(getSubjectLabel(routine.subjectId))}</td>
            <td>${escapeHTML(getTeacherLabel(routine.teacherId))}</td>
            <td>${escapeHTML(formatDay(routine.day))}</td>
            <td>${escapeHTML(formatTime(routine.startTime))}</td>
            <td>${escapeHTML(formatTime(routine.endTime))}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>School Routine Report</title>
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
              color: #808286;
              font-weight: bold;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
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
            <h2>SCHOOL ROUTINE REPORT</h2>
            <p>Weekly Class Schedule</p>
          </div>

          <div class="meta">
            <span>Total Scheduled Classes: ${routines.length}</span>
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
            Total Routines: ${routines.length}
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
      printWindow.focus();
      printWindow.print();
    });
  };

  const availableDays = new Set(
    routines.map((routine) => String(routine.day || "").toLowerCase())
  ).size;

  const refreshAll = () => {
    fetchRoutines();
    fetchOptions();
    fetchSchoolInfo();
  };

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto w-full max-w-7xl min-w-0">

        {/* PAGE HEADER */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">

          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-600 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              School Management System
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Routine Management
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
              View and manage your school class schedule.
            </p>
          </div>

          {/* HEADER BUTTONS */}
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">

            <button
              type="button"
              onClick={refreshAll}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60 sm:px-4 sm:text-sm"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || routines.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-500 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                <Printer size={16} />
                Print Routine
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={openCreateForm}
                className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:col-span-1 sm:px-5 sm:text-sm"
              >
                <Plus size={17} />
                Add Routine
              </button>
            )}

          </div>
        </div>

        {/* PAGE ALERTS */}
        {error && !showForm && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="break-words">{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 sm:p-4"
          >
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-5">

          <SummaryCard
            title="Total Routines"
            value={routines.length}
            description="Scheduled class sessions"
            icon={<CalendarDays size={22} />}
            color="blue"
          />

          <SummaryCard
            title="Available Days"
            value={availableDays}
            description="Days with scheduled classes"
            icon={<CheckCircle size={22} />}
            color="green"
          />

        </div>

        {/* ROUTINE TABLE */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">

            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Class Schedule
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {routines.length} schedule{routines.length === 1 ? "" : "s"} found
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Weekly timetable
            </span>

          </div>

          {loading ? (

            <div className="flex flex-col items-center justify-center px-5 py-16">
              <RefreshCw size={32} className="animate-spin text-blue-600" />

              <p className="mt-4 text-sm text-slate-500">
                Loading routines...
              </p>
            </div>

          ) : routines.length === 0 ? (

            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">

              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
                <CalendarDays size={36} />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                No routines found
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                {isAdmin
                  ? "Create your first class schedule to get started."
                  : "The school schedule has not been added yet."}
              </p>

              {isAdmin && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add First Routine
                </button>
              )}

            </div>

          ) : (

            <div className="w-full overflow-x-auto">

              <table className="w-full min-w-[850px] text-left text-sm">

                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-4 font-semibold sm:px-5">#</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Class</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Subject</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Teacher</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Day</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">Start Time</th>
                    <th className="px-4 py-4 font-semibold sm:px-5">End Time</th>

                    {isAdmin && (
                      <th className="px-4 py-4 font-semibold sm:px-5">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {routines.map((routine, index) => (
                    <tr
                      key={routine._id || index}
                      className="transition hover:bg-blue-50/40"
                    >

                      <td className="px-4 py-4 text-slate-400 sm:px-5">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="px-4 py-4 sm:px-5">
                        <div className="font-semibold text-slate-800">
                          {getClassLabel(routine.classId)}
                        </div>
                      </td>

                      <td className="px-4 py-4 sm:px-5">
                        <div className="font-medium text-slate-800">
                          {getSubjectLabel(routine.subjectId)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-slate-600 sm:px-5">
                        {getTeacherLabel(routine.teacherId)}
                      </td>

                      <td className="px-4 py-4 sm:px-5">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {formatDay(routine.day)}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700 sm:px-5">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          {formatTime(routine.startTime)}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-700 sm:px-5">
                        {formatTime(routine.endTime)}
                      </td>

                      {isAdmin && (
                        <td className="px-4 py-4 sm:px-5">

                          <div className="flex items-center gap-2">

                            <button
                              type="button"
                              onClick={() => openEditForm(routine)}
                              title="Edit routine"
                              aria-label="Edit routine"
                              className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(routine._id)}
                              disabled={deletingId === routine._id}
                              title="Delete routine"
                              aria-label="Delete routine"
                              className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingId === routine._id ? (
                                <RefreshCw size={15} className="animate-spin" />
                              ) : (
                                <Trash2 size={15} />
                              )}
                            </button>

                          </div>

                        </td>
                      )}

                    </tr>
                  ))}

                </tbody>

              </table>

            </div>

          )}

          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-400 sm:px-6">
            School Routine Management
          </div>

        </section>

      </div>

      {/* ADD / EDIT ROUTINE POPUP */}
      {showForm && isAdmin && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              resetForm();
            }
          }}
        >

          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="routine-modal-title"
            className="my-auto flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >

            {/* MODAL HEADER */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">

              <div className="flex min-w-0 items-center gap-3">

                <div className="hidden rounded-xl bg-blue-50 p-3 text-blue-600 sm:block">
                  {editingId ? <Pencil size={21} /> : <CalendarDays size={21} />}
                </div>

                <div className="min-w-0">
                  <h2
                    id="routine-modal-title"
                    className="text-base font-bold text-slate-900 sm:text-lg"
                  >
                    {editingId ? "Edit Routine" : "Add New Routine"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {editingId
                      ? "Update the class schedule details."
                      : "Add a new class schedule to your school."}
                  </p>
                </div>

              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                aria-label="Close popup"
              >
                <X size={21} />
              </button>

            </div>

            {/* MODAL FORM */}
            <form
              id="routine-form"
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >

              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

                {error && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="break-words">{error}</p>
                  </div>
                )}

                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-3 sm:p-4">
                  <p className="text-xs font-semibold text-blue-800 sm:text-sm">
                    Routine Information
                  </p>

                  <p className="mt-1 text-xs text-blue-600">
                    Select the class, subject, teacher and schedule time.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">

                  {/* CLASS */}
                  <div>
                    <label
                      htmlFor="classId"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Class <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="classId"
                      name="classId"
                      value={form.classId}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select class</option>

                      {classes.map((item) => (
                        <option key={item._id} value={item._id}>
                          {getClassLabel(item)}
                        </option>
                      ))}
                    </select>

                    {classes.length === 0 && (
                      <p className="mt-1.5 text-xs text-amber-600">
                        No classes loaded. Refresh or check the API response.
                      </p>
                    )}
                  </div>

                  {/* SUBJECT */}
                  <div>
                    <label
                      htmlFor="subjectId"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Subject <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="subjectId"
                      name="subjectId"
                      value={form.subjectId}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select subject</option>

                      {subjects.map((item) => (
                        <option key={item._id} value={item._id}>
                          {getSubjectLabel(item)}
                        </option>
                      ))}
                    </select>

                    {subjects.length === 0 && (
                      <p className="mt-1.5 text-xs text-amber-600">
                        No subjects loaded. Refresh or check the API response.
                      </p>
                    )}
                  </div>

                  {/* TEACHER */}
                  <div>
                    <label
                      htmlFor="teacherId"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Teacher <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="teacherId"
                      name="teacherId"
                      value={form.teacherId}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      <option value="">Select teacher</option>

                      {teachers.map((item) => (
                        <option key={item._id} value={item._id}>
                          {getTeacherLabel(item)}
                        </option>
                      ))}
                    </select>

                    {teachers.length === 0 && (
                      <p className="mt-1.5 text-xs text-amber-600">
                        No teachers loaded. Refresh or check the API response.
                      </p>
                    )}
                  </div>

                  {/* DAY */}
                  <div>
                    <label
                      htmlFor="day"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Day <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="day"
                      name="day"
                      value={form.day}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    >
                      {DAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* START TIME */}
                  <div>
                    <label
                      htmlFor="startTime"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Start Time <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="startTime"
                      name="startTime"
                      type="time"
                      value={form.startTime}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                  {/* END TIME */}
                  <div>
                    <label
                      htmlFor="endTime"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      End Time <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="endTime"
                      name="endTime"
                      type="time"
                      value={form.endTime}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? <Pencil size={16} /> : <Plus size={17} />}
                      {editingId ? "Update Routine" : "Create Routine"}
                    </>
                  )}
                </button>

              </div>

            </form>

          </section>

        </div>

      )}

    </div>
  );
}

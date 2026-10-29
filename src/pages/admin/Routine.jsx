
import { useCallback, useEffect, useState } from "react";
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

export default function Routine() {
  const [routines, setRoutines] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Read role from common localStorage user objects.
  const [role] = useState(() => {
    const keys = ["user", "school_user", "sms_user"];

    for (const key of keys) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || "null");
        const user = stored?.user || stored;

        if (user?.role) {
          return String(user.role).toLowerCase();
        }
      } catch {
        // Ignore invalid JSON.
      }
    }

    return "";
  });

  const isAdmin = role === "admin";

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // GET /api/v1/routine/all
      const response = await api.get("/routine/all");
      setRoutines(getArray(response));
    } catch (err) {
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

  useEffect(() => {
    fetchRoutines();
    fetchOptions();
  }, [fetchRoutines, fetchOptions]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
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
        // PATCH /api/v1/routine/routine-update/:id
        await api.patch(
          `/routine/routine-update/${editingId}`,
          payload
        );

        setSuccess("Routine updated successfully.");
      } else {
        // POST /api/v1/routine/create
        await api.post("/routine/create", payload);

        setSuccess("Routine created successfully.");
      }

      resetForm();
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
      // DELETE /api/v1/routine/routine-delete/:id
      await api.delete(`/routine/routine-delete/${routineId}`);

      setSuccess("Routine deleted successfully.");
      await fetchRoutines();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const availableDays = new Set(
    routines.map((routine) => String(routine.day || "").toLowerCase())
  ).size;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              School Management System
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Routine Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              View and manage your school class schedule.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                fetchRoutines();
                fetchOptions();
              }}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M20 7v5h-5" />
                <path d="M4 17v-5h5" />
                <path d="M5.6 9A7 7 0 0 1 18 5l2 2M4 17l2 2a7 7 0 0 0 12.4-2" />
              </svg>
              Refresh
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Routine
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span className="font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <span className="font-bold">✓</span>
            <p>{success}</p>
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Routines
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {routines.length}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Scheduled class sessions
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18M8 14h3M8 17h6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Available Days
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {availableDays}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Days with scheduled classes
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                <svg
                  className="h-7 w-7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                  <path d="m8 15 2 2 5-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit form */}
        {showForm && isAdmin && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Routine" : "Create Routine"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fill in the details for the class schedule.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 disabled:opacity-50"
                aria-label="Close form"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path d="m18 6-12 12M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {DAYS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>

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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

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
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving...
                    </>
                  ) : editingId ? (
                    "Update Routine"
                  ) : (
                    "Create Routine"
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Schedule table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Class Schedule
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {routines.length} schedule{routines.length === 1 ? "" : "s"} found
              </p>
            </div>

            <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Weekly timetable
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-5 py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="mt-4 text-sm text-slate-500">
                Loading routines...
              </p>
            </div>
          ) : routines.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
                <svg
                  className="h-10 w-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="16" rx="2" />
                  <path d="M16 3v4M8 3v4M3 10h18" />
                </svg>
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
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  + Add First Routine
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">#</th>
                    <th className="px-5 py-4 font-semibold">Class</th>
                    <th className="px-5 py-4 font-semibold">Subject</th>
                    <th className="px-5 py-4 font-semibold">Teacher</th>
                    <th className="px-5 py-4 font-semibold">Day</th>
                    <th className="px-5 py-4 font-semibold">Start Time</th>
                    <th className="px-5 py-4 font-semibold">End Time</th>
                    {isAdmin && (
                      <th className="px-5 py-4 font-semibold">Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {routines.map((routine, index) => (
                    <tr
                      key={routine._id || index}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4 text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">
                          {getClassLabel(routine.classId)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-800">
                          {getSubjectLabel(routine.subjectId)}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {getTeacherLabel(routine.teacherId)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                          {formatDay(routine.day)}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formatTime(routine.startTime)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {formatTime(routine.endTime)}
                      </td>

                      {isAdmin && (
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(routine)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(routine._id)}
                              disabled={deletingId === routine._id}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingId === routine._id
                                ? "Deleting..."
                                : "Delete"}
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

          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-400 sm:px-6">
            School Routine Management
          </div>
        </section>
      </div>
    </div>
  );
}

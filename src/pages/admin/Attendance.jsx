
import { useCallback, useEffect, useState } from "react";
import {
  CalendarCheck,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

import api from "../../services/api";

const createInitialForm = () => ({
  student: "",
  classId: "",
  date: new Date().toLocaleDateString("en-CA"),
  status: "Present",
  remarks: "",
});

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong.";

const getArray = (response) => {
  const body = response?.data;

  // Supports common controller response structures.
  const candidates = [
    body?.data,
    body?.students,
    body?.classes,
    body?.attendance,
    body?.results,
  ];

  return candidates.find(Array.isArray) || [];
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toInputDate = (date) => {
  if (!date) return createInitialForm().date;

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return createInitialForm().date;

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const statusStyle = {
  Present: "bg-green-50 text-green-700 border-green-200",
  Absent: "bg-red-50 text-red-700 border-red-200",
  Late: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function AttendanceManagement() {
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterDate, setFilterDate] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(createInitialForm);

  const currentUser = getUser();
  const role = String(currentUser?.role || "").toLowerCase();
  const isStudent = role === "student";
  const isAdmin = role === "admin";
  const canManage = isAdmin || role === "teacher";

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      let response;

      if (isStudent) {
        response = await api.get("/attendance/my-attendance");
      } else {
        const params = {};

        if (filterClass) params.classId = filterClass;
        if (filterDate) params.date = filterDate;

        response = await api.get("/attendance/all", { params });
      }

      setAttendance(getArray(response));
    } catch (err) {
      setError(getErrorMessage(err));
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  }, [isStudent, filterClass, filterDate]);

  const loadOptions = useCallback(async () => {
    if (!canManage) {
      setStudents([]);
      setClasses([]);
      return;
    }

    setOptionsLoading(true);

    try {
      const [studentResponse, classResponse] = await Promise.all([
        api.get("/student/all-students"),
        api.get("/class/allclasses"),
      ]);

      setStudents(getArray(studentResponse));
      setClasses(getArray(classResponse));
    } catch (err) {
      setError(
        `Could not load student/class options: ${getErrorMessage(err)}`
      );
    } finally {
      setOptionsLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const openCreateModal = () => {
    setEditingRecord(null);
    setForm(createInitialForm());
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);

    setForm({
      student: record.student?._id || record.student || "",
      classId: record.classId?._id || record.classId || "",
      date: toInputDate(record.date),
      status: record.status || "Present",
      remarks: record.remarks || "",
    });

    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingRecord(null);
    setForm(createInitialForm());
    setError("");
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

    if (!form.status) {
      setError("Please select an attendance status.");
      return;
    }

    if (
      !editingRecord &&
      (!form.student || !form.classId || !form.date)
    ) {
      setError("Please select a student, class and date.");
      return;
    }

    setSaving(true);

    try {
      if (editingRecord) {
        await api.put(`/attendance/update/${editingRecord._id}`, {
          status: form.status,
          remarks: form.remarks,
        });

        setSuccess("Attendance updated successfully.");
      } else {
        await api.post("/attendance/create", {
          student: form.student,
          classId: form.classId,
          date: form.date,
          status: form.status,
          remarks: form.remarks,
        });

        setSuccess("Attendance created successfully.");
      }

      setModalOpen(false);
      setEditingRecord(null);
      setForm(createInitialForm());

      await loadAttendance();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/attendance/delete/${record._id}`);
      setSuccess("Attendance deleted successfully.");
      await loadAttendance();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredAttendance = attendance.filter((record) => {
    const studentName =
      typeof record.student === "object"
        ? record.student?.name || ""
        : "";

    const studentEmail =
      typeof record.student === "object"
        ? record.student?.email || ""
        : "";

    const className =
      typeof record.classId === "object"
        ? `${record.classId?.className || ""} ${
            record.classId?.section || ""
          }`
        : "";

    const text = [
      studentName,
      studentEmail,
      className,
      record.status,
      record.remarks,
    ]
      .filter(Boolean)
      .join(" ");

    return text.toLowerCase().includes(search.trim().toLowerCase());
  });

  const presentCount = filteredAttendance.filter(
    (item) => item.status === "Present"
  ).length;

  const absentCount = filteredAttendance.filter(
    (item) => item.status === "Absent"
  ).length;

  const lateCount = filteredAttendance.filter(
    (item) => item.status === "Late"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 text-sm text-slate-500">
              Academic Management / Attendance
            </p>

            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Attendance Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage student attendance.
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={openCreateModal}
              disabled={optionsLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {optionsLoading ? (
                <LoaderCircle size={19} className="animate-spin" />
              ) : (
                <Plus size={19} />
              )}
              Add Attendance
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Close error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Close success"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Records"
            value={filteredAttendance.length}
            icon={<Users size={23} />}
            color="blue"
          />

          <SummaryCard
            title="Present"
            value={presentCount}
            icon={<CheckCircle2 size={23} />}
            color="green"
          />

          <SummaryCard
            title="Absent"
            value={absentCount}
            icon={<XCircle size={23} />}
            color="red"
          />

          <SummaryCard
            title="Late"
            value={lateCount}
            icon={<Clock size={23} />}
            color="amber"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, email, class or status..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {canManage && (
            <>
              <select
                value={filterClass}
                onChange={(event) => setFilterClass(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Classes</option>

                {classes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.className}
                    {item.section ? ` - ${item.section}` : ""}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                aria-label="Filter by date"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </>
          )}

          <button
            type="button"
            onClick={() => {
              loadOptions();
              loadAttendance();
            }}
            disabled={loading || optionsLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading || optionsLoading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        {/* Attendance table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold text-slate-800">
              Attendance Records
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredAttendance.length} records found
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-slate-500">
              <LoaderCircle
                size={30}
                className="animate-spin text-blue-600"
              />
              <p className="text-sm">Loading attendance...</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center gap-3 px-5 text-center">
              <CalendarCheck size={34} className="text-slate-300" />
              <p className="font-medium text-slate-700">
                No attendance records found
              </p>
              <p className="text-sm text-slate-500">
                Try changing the filters or mark attendance for a student.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {!isStudent && (
                      <th className="px-5 py-4 font-semibold">Student</th>
                    )}
                    <th className="px-5 py-4 font-semibold">Class</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Remarks</th>
                    {canManage && (
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((record) => (
                    <tr key={record._id} className="hover:bg-slate-50">
                      {!isStudent && (
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-800">
                            {record.student?.name || "Unknown Student"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {record.student?.email || ""}
                          </p>
                        </td>
                      )}

                      <td className="px-5 py-4 text-slate-600">
                        {record.classId?.className || "Unknown Class"}
                        {record.classId?.section
                          ? ` - ${record.classId.section}`
                          : ""}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(record.date)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                            statusStyle[record.status] ||
                            "border-slate-200 bg-slate-50 text-slate-600"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-slate-500">
                        <span className="block truncate">
                          {record.remarks || "—"}
                        </span>
                      </td>

                      {canManage && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(record)}
                              title="Edit attendance"
                              className="rounded-lg border border-blue-100 p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <Pencil size={17} />
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => handleDelete(record)}
                                title="Delete attendance"
                                className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={17} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="attendance-modal-title"
                  className="text-xl font-bold text-slate-800"
                >
                  {editingRecord ? "Update Attendance" : "Mark Attendance"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingRecord
                    ? "Change the status or remarks."
                    : "Select a student, class, date and status."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              {!editingRecord && (
                <>
                  <div>
                    <label
                      htmlFor="student"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Student <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="student"
                      name="student"
                      value={form.student}
                      onChange={handleChange}
                      required
                      disabled={optionsLoading}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="">
                        {optionsLoading
                          ? "Loading students..."
                          : "Select student"}
                      </option>

                      {students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.name}
                          {student.email ? ` (${student.email})` : ""}
                        </option>
                      ))}
                    </select>

                    {!optionsLoading && students.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No students found. Check the student API response.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="classId"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Class <span className="text-red-500">*</span>
                    </label>

                    <select
                      id="classId"
                      name="classId"
                      value={form.classId}
                      onChange={handleChange}
                      required
                      disabled={optionsLoading}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    >
                      <option value="">
                        {optionsLoading ? "Loading classes..." : "Select class"}
                      </option>

                      {classes.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.className}
                          {item.section ? ` - ${item.section}` : ""}
                        </option>
                      ))}
                    </select>

                    {!optionsLoading && classes.length === 0 && (
                      <p className="mt-2 text-xs text-amber-600">
                        No classes found. Please check Class Management.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="date"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Attendance Date <span className="text-red-500">*</span>
                    </label>

                    <input
                      id="date"
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Status <span className="text-red-500">*</span>
                </label>

                <select
                  id="status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500"
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="remarks"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Remarks
                </label>

                <textarea
                  id="remarks"
                  name="remarks"
                  rows={3}
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Optional remarks"
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    optionsLoading ||
                    (!editingRecord &&
                      (!students.length || !classes.length))
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={18} className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingRecord
                      ? "Update Attendance"
                      : "Save Attendance"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
          colors[color] || colors.blue
        }`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

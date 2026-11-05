
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
  Printer,
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

  const candidates = [
    body?.data,
    body?.students,
    body?.classes,
    body?.attendance,
    body?.results,
    body,
  ];

  for (const item of candidates) {
    if (Array.isArray(item)) return item;

    if (item && typeof item === "object") {
      const nested = Object.values(item).find(Array.isArray);
      if (nested) return nested;
    }
  }

  return [];
};

const getUser = () => {
  const keys = ["user", "tasmina_user"];

  for (const key of keys) {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) continue;

      const user = JSON.parse(stored);
      if (user) return user;
    } catch {
      continue;
    }
  }

  return null;
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

  const [schoolInfo, setSchoolInfo] = useState({});

  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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
  const isTeacher = role === "teacher";

  // Permissions
  const canCreate = isTeacher;
  const canEdit = isTeacher;
  const canDelete = isAdmin;
  const canPrint = isAdmin || isTeacher;

  // Load classes according to user role
  const loadOptions = useCallback(async () => {
    if (isStudent) {
      setClasses([]);
      setStudents([]);
      return;
    }

    setOptionsLoading(true);

    try {
      let response;

      if (isAdmin) {
        response = await api.get("/class/allclasses");
      } else if (isTeacher) {
        response = await api.get("/teacher/my-classes");
      } else {
        setClasses([]);
        return;
      }

      const classList = getArray(response);
      setClasses(classList);

      if (isTeacher && filterClass) {
        const stillAssigned = classList.some(
          (item) => item._id === filterClass
        );

        if (!stillAssigned) {
          setFilterClass("");
        }
      }
    } catch (err) {
      setError(`Could not load classes: ${getErrorMessage(err)}`);
      setClasses([]);
    } finally {
      setOptionsLoading(false);
    }
  }, [isAdmin, isStudent, isTeacher, filterClass]);

  // Load students for selected class
  const loadClassStudents = useCallback(
    async (classId) => {
      if (!classId || !isTeacher) {
        setStudents([]);
        return;
      }

      setOptionsLoading(true);

      try {
        const response = await api.get("/attendance/students", {
          params: { classId },
        });

        setStudents(getArray(response));
      } catch (err) {
        setStudents([]);
        setError(`Could not load students: ${getErrorMessage(err)}`);
      } finally {
        setOptionsLoading(false);
      }
    },
    [isTeacher]
  );

  // Load attendance according to role
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
      setAttendance([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isStudent, filterClass, filterDate]);

  // Load school information for Admin and Teacher
  useEffect(() => {
    const loadSchoolInfo = async () => {
      try {
        const response = await api.get("/settings/school-info");

        setSchoolInfo(response.data?.data?.school || {});
      } catch (err) {
        console.error(
          "Could not load school information:",
          getErrorMessage(err)
        );

        setSchoolInfo({});
      }
    };

    if (canPrint) {
      loadSchoolInfo();
    }
  }, [canPrint]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Open create modal
  const openCreateModal = () => {
    if (!canCreate) return;

    setEditingRecord(null);
    setStudents([]);
    setForm(createInitialForm());
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (record) => {
    if (!canEdit) return;

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

  // Close modal
  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingRecord(null);
    setStudents([]);
    setForm(createInitialForm());
    setError("");
  };

  // Handle input changes
  const handleChange = async (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "classId" ? { student: "" } : {}),
    }));

    if (name === "classId") {
      await loadClassStudents(value);
    }
  };

  // Create or update attendance
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canCreate && !canEdit) return;

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
      setError("Please select a class, student and date.");
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
      setStudents([]);
      setForm(createInitialForm());

      await loadAttendance();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Delete attendance
  const handleDelete = async (record) => {
    if (!canDelete || deletingId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(record._id);

    try {
      await api.delete(`/attendance/delete/${record._id}`);

      setSuccess("Attendance deleted successfully.");
      await loadAttendance();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  // Search filter
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

  // Print attendance report
  const handlePrint = () => {
    if (!canPrint) return;

    if (filteredAttendance.length === 0) {
      setError("No attendance records available to print.");
      return;
    }

    window.print();
  };

  const selectedClass = classes.find(
    (item) => item._id === filterClass
  );

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50 p-3 sm:p-5 lg:p-8">

      <style>{`
        .attendance-print-area {
          display: none;
        }

        @media print {
          @page {
            size: landscape;
            margin: 12mm;
          }

          body * {
            visibility: hidden !important;
          }

          .attendance-print-area,
          .attendance-print-area * {
            visibility: visible !important;
          }

          .attendance-print-area {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: #111827;
            background: white;
            font-family: Arial, sans-serif;
          }

          .print-school-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 12px;
          }

          .print-school-logo {
            width: 65px;
            height: 65px;
            object-fit: contain;
            margin: 0 auto 8px;
          }

          .print-school-header h1 {
            font-size: 23px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .print-school-header p {
            font-size: 11px;
            margin: 3px 0;
          }

          .print-school-header h2 {
            font-size: 17px;
            font-weight: bold;
            margin-top: 12px;
          }

          .print-report-info {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 15px;
            font-size: 11px;
          }

          .print-summary {
            display: flex;
            justify-content: space-around;
            gap: 12px;
            border: 1px solid #aaa;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 12px;
            font-weight: bold;
          }

          .print-attendance-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }

          .print-attendance-table th,
          .print-attendance-table td {
            border: 1px solid #777;
            padding: 7px;
            text-align: left;
          }

          .print-attendance-table th {
            background: #e5e7eb !important;
            font-weight: bold;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print-attendance-table tr {
            page-break-inside: avoid;
          }

          .print-footer {
            margin-top: 35px;
            font-size: 10px;
          }

          .print-footer > p {
            text-align: center;
            margin-bottom: 35px;
          }

          .print-signatures {
            display: flex;
            justify-content: space-between;
            padding: 0 30px;
          }

          .print-signatures span {
            border-top: 1px solid #333;
            padding-top: 7px;
            min-width: 150px;
            text-align: center;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5 sm:space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
              Academic Management / Attendance
            </p>

            <h1 className="text-xl font-bold text-slate-800 sm:text-2xl lg:text-3xl">
              Attendance Management
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {isAdmin
                ? "Monitor attendance records across all classes."
                : isTeacher
                  ? "Manage attendance for your assigned classes."
                  : "View your attendance records."}
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            {canPrint && (
              <button
                type="button"
                onClick={handlePrint}
                disabled={loading || filteredAttendance.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Printer size={18} />
                Print Report
              </button>
            )}

            {canCreate && (
              <button
                type="button"
                onClick={openCreateModal}
                disabled={optionsLoading || classes.length === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {optionsLoading ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                Add Attendance
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && !modalOpen && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1 break-words">{error}</span>

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
            className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <SummaryCard
            title="Total Records"
            value={filteredAttendance.length}
            icon={<Users size={21} />}
            color="blue"
          />

          <SummaryCard
            title="Present"
            value={presentCount}
            icon={<CheckCircle2 size={21} />}
            color="green"
          />

          <SummaryCard
            title="Absent"
            value={absentCount}
            icon={<XCircle size={21} />}
            color="red"
          />

          <SummaryCard
            title="Late"
            value={lateCount}
            icon={<Clock size={21} />}
            color="amber"
          />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* Search */}
            <div className="relative w-full min-w-0 flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, email, class or status..."
                className="w-full rounded-lg border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {!isStudent && (
              <>
                <select
                  value={filterClass}
                  onChange={(event) => setFilterClass(event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 lg:w-48"
                >
                  <option value="">
                    {isAdmin ? "All Classes" : "All My Classes"}
                  </option>

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
                  className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 lg:w-auto"
                />
              </>
            )}

            <button
              type="button"
              onClick={async () => {
                await loadOptions();
                await loadAttendance();
              }}
              disabled={loading || optionsLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto"
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
        </div>

        {/* Attendance Table */}
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <h2 className="font-bold text-slate-800">
              Attendance Records
            </h2>

            <p className="text-xs text-slate-500">
              {filteredAttendance.length} records found
            </p>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 text-slate-500">
              <LoaderCircle
                size={30}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm">Loading attendance...</p>
            </div>
          ) : filteredAttendance.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-4 text-center">
              <CalendarCheck size={35} className="text-slate-300" />

              <p className="font-semibold text-slate-700">
                No attendance records found
              </p>

              <p className="text-sm text-slate-500">
                Try changing the filters or mark attendance for a student.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-xs uppercase tracking-wider text-slate-500">
                    {!isStudent && (
                      <th className="px-5 py-4 font-semibold">
                        Student
                      </th>
                    )}

                    <th className="px-5 py-4 font-semibold">Class</th>
                    <th className="px-5 py-4 font-semibold">Date</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Remarks</th>

                    {(canEdit || canDelete) && (
                      <th className="px-5 py-4 text-right font-semibold">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredAttendance.map((record) => (
                    <tr
                      key={record._id}
                      className="transition hover:bg-slate-50"
                    >
                      {!isStudent && (
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
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

                      <td className="max-w-[220px] px-5 py-4 text-slate-500">
                        <span className="block truncate">
                          {record.remarks || "—"}
                        </span>
                      </td>

                      {(canEdit || canDelete) && (
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEditModal(record)}
                                title="Edit attendance"
                                className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                              >
                                <Pencil size={16} />
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => handleDelete(record)}
                                disabled={deletingId === record._id}
                                title="Delete attendance"
                                className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                {deletingId === record._id ? (
                                  <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Trash2 size={16} />
                                )}
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

          {!loading && filteredAttendance.length > 0 && (
            <div className="flex flex-col gap-1 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <span>
                Showing {filteredAttendance.length} attendance records
              </span>

              <span>Attendance Management</span>
            </div>
          )}
        </div>
      </div>

      {/* Print Only Attendance Report */}
      <div className="attendance-print-area">
        <div className="print-school-header">
          {schoolInfo.schoolLogo && (
            <img
              src={schoolInfo.schoolLogo}
              alt="School Logo"
              className="print-school-logo"
            />
          )}

          <h1>{schoolInfo.schoolName || "School Name"}</h1>

          {schoolInfo.schoolAddress && (
            <p>{schoolInfo.schoolAddress}</p>
          )}

          <p>
            {schoolInfo.schoolEmail || ""}
            {schoolInfo.schoolPhone
              ? ` | ${schoolInfo.schoolPhone}`
              : ""}
          </p>

          <p>
            Academic Year: {schoolInfo.academicYear || "—"}
            {" | "}
            Session: {schoolInfo.currentSession || "—"}
          </p>

          <h2>ATTENDANCE REPORT</h2>
        </div>

        <div className="print-report-info">
          <p>
            <strong>Report Date:</strong>{" "}
            {new Date().toLocaleDateString("en-GB")}
          </p>

          <p>
            <strong>Class:</strong>{" "}
            {filterClass
              ? selectedClass
                ? `${selectedClass.className} ${
                    selectedClass.section || ""
                  }`
                : "Selected Class"
              : "All Classes"}
          </p>

          <p>
            <strong>Attendance Date:</strong>{" "}
            {filterDate ? formatDate(filterDate) : "All Dates"}
          </p>
        </div>

        <div className="print-summary">
          <p>Total Records: {filteredAttendance.length}</p>
          <p>Present: {presentCount}</p>
          <p>Absent: {absentCount}</p>
          <p>Late: {lateCount}</p>
        </div>

        <table className="print-attendance-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Student Name</th>
              <th>Email</th>
              <th>Class</th>
              <th>Date</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>

          <tbody>
            {filteredAttendance.map((record, index) => (
              <tr key={record._id}>
                <td>{index + 1}</td>

                <td>
                  {record.student?.name || "Unknown Student"}
                </td>

                <td>{record.student?.email || "—"}</td>

                <td>
                  {record.classId?.className || "Unknown"}
                  {record.classId?.section
                    ? ` - ${record.classId.section}`
                    : ""}
                </td>

                <td>{formatDate(record.date)}</td>

                <td>{record.status}</td>

                <td>{record.remarks || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="print-footer">
          <p>Generated from School Management System</p>

          <div className="print-signatures">
            <span>Class Teacher Signature</span>
            <span>Principal Signature</span>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && canCreate && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-modal-title"
            className="my-auto flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="min-w-0">
                <h2
                  id="attendance-modal-title"
                  className="text-lg font-bold text-slate-800 sm:text-xl"
                >
                  {editingRecord
                    ? "Update Attendance"
                    : "Mark Attendance"}
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  {editingRecord
                    ? "Change the status or remarks."
                    : "Select your class, student, date and status."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6">
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0"
                    />

                    <span className="break-words">{error}</span>
                  </div>
                )}

                {!editingRecord && (
                  <>
                    {/* Class */}
                    <div>
                      <label
                        htmlFor="classId"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
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
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      >
                        <option value="">
                          {optionsLoading
                            ? "Loading classes..."
                            : "Select class"}
                        </option>

                        {classes.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.className}
                            {item.section ? ` - ${item.section}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Student */}
                    <div>
                      <label
                        htmlFor="student"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Student <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="student"
                        name="student"
                        value={form.student}
                        onChange={handleChange}
                        required
                        disabled={!form.classId || optionsLoading}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      >
                        <option value="">
                          {!form.classId
                            ? "Select a class first"
                            : optionsLoading
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

                      {form.classId &&
                        !optionsLoading &&
                        students.length === 0 && (
                          <p className="mt-1.5 text-xs text-amber-600">
                            No students found in this class.
                          </p>
                        )}
                    </div>

                    {/* Date */}
                    <div>
                      <label
                        htmlFor="date"
                        className="mb-1.5 block text-sm font-semibold text-slate-700"
                      >
                        Attendance Date{" "}
                        <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="date"
                        name="date"
                        type="date"
                        value={form.date}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </>
                )}

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Status <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label
                    htmlFor="remarks"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
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
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    optionsLoading ||
                    (!editingRecord &&
                      (!form.classId ||
                        !form.student ||
                        students.length === 0))
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : editingRecord ? (
                    "Update Attendance"
                  ) : (
                    "Save Attendance"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Summary Card Component
function SummaryCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-5">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl ${
          colors[color] || colors.blue
        }`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-slate-500 sm:text-sm">
          {title}
        </p>

        <p className="mt-1 text-xl font-bold text-slate-800 sm:text-2xl">
          {value}
        </p>
      </div>
    </div>
  );
}

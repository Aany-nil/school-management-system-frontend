
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Award,
  ClipboardList,
  RefreshCw,
  Users,
  LoaderCircle,
  AlertCircle,
  Printer,
} from "lucide-react";
import api from "../../services/api";

const EMPTY_FORM = {
  studentId: "",
  classId: "",
  subjectId: "",
  examName: "",
  marks: "",
  totalMarks: "",
  grade: "",
};

const getArray = (response) => {
  const data = response?.data?.data;
  return Array.isArray(data) ? data : [];
};

const getId = (item) => {
  if (!item) return "";
  return typeof item === "object" ? item._id || "" : item;
};

const getItemName = (item, fallback = "N/A") => {
  if (!item) return fallback;
  if (typeof item === "string") return item;

  return (
    item.name ||
    item.subjectName ||
    item.className ||
    fallback
  );
};

const getStoredUser = () => {
  try {
    const user =
      JSON.parse(localStorage.getItem("user") || "null") ||
      JSON.parse(localStorage.getItem("tasmina_user") || "null");

    return user || {};
  } catch {
    return {};
  }
};

export default function ResultManagement() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);

  const [user, setUser] = useState(getStoredUser);

  // Marksheet states
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedExamName, setSelectedExamName] = useState("");

  const role = String(user?.role || "").toLowerCase();

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const canCreate = isAdmin || isTeacher;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  // Load results according to logged-in user's role.
  const loadResults = async (currentUser = user) => {
    const currentRole = String(currentUser?.role || "").toLowerCase();

    if (currentRole === "student") {
      if (!currentUser?._id) {
        throw new Error("Student ID not found. Please log in again.");
      }

      const response = await api.get(
        `/result/student-results/${currentUser._id}`
      );

      setResults(getArray(response));
      return;
    }

    if (currentRole === "admin") {
      const response = await api.get("/result/all-results");
      setResults(getArray(response));
      return;
    }

    if (currentRole === "teacher") {
      const studentResponse = await api.get("/student/all-students");
      const studentList = getArray(studentResponse);

      const responses = await Promise.all(
        studentList.map((student) =>
          api.get(`/result/student-results/${student._id}`)
        )
      );

      const uniqueResults = new Map();

      responses.forEach((resultResponse) => {
        getArray(resultResponse).forEach((result) => {
          uniqueResults.set(result._id, result);
        });
      });

      setResults(Array.from(uniqueResults.values()));
      return;
    }

    throw new Error(
      "Your account role is not supported for Result Management."
    );
  };

  // Load dropdown options.
  const loadOptions = async () => {
    const [studentResult, classResult, subjectResult] =
      await Promise.allSettled([
        api.get("/student/all-students"),
        api.get("/class/allclasses"),
        api.get("/subject/allsubject"),
      ]);

    if (studentResult.status === "fulfilled") {
      setStudents(getArray(studentResult.value));
    }

    if (classResult.status === "fulfilled") {
      setClasses(getArray(classResult.value));
    }

    if (subjectResult.status === "fulfilled") {
      setSubjects(getArray(subjectResult.value));
    }
  };

  // Load school information for Admin marksheet.
  const loadSchoolInfo = async () => {
    try {
      const response = await api.get("/settings/setting");
      const data = response.data?.data || {};

      setSchoolInfo(data.school || {});
    } catch (err) {
      console.error("Failed to load school information:", err);
      setSchoolInfo({});
    }
  };

  // Load all page data.
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const currentUser = getStoredUser();
      setUser(currentUser);

      const tasks = [
        loadResults(currentUser),
        loadOptions(),
      ];

      // Settings API is only needed for Admin marksheet.
      if (
        String(currentUser?.role || "").toLowerCase() === "admin"
      ) {
        tasks.push(loadSchoolInfo());
      }

      await Promise.all(tasks);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load results. Please check your API routes and login."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    if (!canCreate) return;

    setEditingId("");
    setForm({ ...EMPTY_FORM });
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (result) => {
    if (!canEdit) return;

    setEditingId(result._id);

    setForm({
      studentId: getId(result.studentId),
      classId: getId(result.classId),
      subjectId: getId(result.subjectId),
      examName: result.examName || "",
      marks: String(result.marks ?? ""),
      totalMarks: String(result.totalMarks ?? ""),
      grade: result.grade || "",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingId("");
    setForm({ ...EMPTY_FORM });
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

    if (!canCreate) return;

    setError("");
    setSuccess("");

    if (
      !form.studentId ||
      !form.classId ||
      !form.subjectId ||
      !form.examName.trim() ||
      form.marks === "" ||
      form.totalMarks === ""
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const marks = Number(form.marks);
    const totalMarks = Number(form.totalMarks);

    if (
      !Number.isFinite(marks) ||
      !Number.isFinite(totalMarks) ||
      marks < 0 ||
      totalMarks < 1 ||
      marks > totalMarks
    ) {
      setError(
        "Marks must be at least 0 and cannot exceed total marks. Total marks must be at least 1."
      );
      return;
    }

    const payload = {
      studentId: form.studentId,
      classId: form.classId,
      subjectId: form.subjectId,
      examName: form.examName.trim(),
      marks,
      totalMarks,
      grade: form.grade.trim(),
    };

    const isUpdating = Boolean(editingId);

    setSaving(true);

    try {
      if (isUpdating) {
        await api.patch(
          `/result/results-update/${editingId}`,
          payload
        );
      } else {
        await api.post("/result/create", payload);
      }

      setShowModal(false);
      setEditingId("");
      setForm({ ...EMPTY_FORM });

      await loadResults(user);

      setSuccess(
        isUpdating
          ? "Result updated successfully."
          : "Result created successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to save result. Please check your inputs."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete || deletingId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this result?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      await api.delete(`/result/result-delete/${id}`);

      setResults((previous) =>
        previous.filter((result) => result._id !== id)
      );

      setSuccess("Result deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete result."
      );
    } finally {
      setDeletingId("");
    }
  };

  // Search and filter results.
  const filteredResults = results.filter((result) => {
    const studentName = getItemName(result.studentId, "");
    const studentEmail = result.studentId?.email || "";
    const subjectName = getItemName(result.subjectId, "");
    const className = result.classId?.className || "";
    const section = result.classId?.section || "";

    const searchableText = [
      studentName,
      studentEmail,
      subjectName,
      className,
      section,
      result.examName || "",
      result.grade || "",
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(
      search.trim().toLowerCase()
    );

    const matchesClass =
      !classFilter || getId(result.classId) === classFilter;

    const matchesExam =
      !examFilter || result.examName === examFilter;

    return matchesSearch && matchesClass && matchesExam;
  });

  const examNames = [
    ...new Set(
      results
        .map((result) => result.examName)
        .filter(Boolean)
    ),
  ];

  const averagePercentage =
    results.length > 0
      ? (
          results.reduce((sum, result) => {
            const total = Number(result.totalMarks);
            const marks = Number(result.marks);

            return total > 0
              ? sum + (marks / total) * 100
              : sum;
          }, 0) / results.length
        ).toFixed(1)
      : "0.0";

  const subjectCount = new Set(
    results.map((item) => getId(item.subjectId)).filter(Boolean)
  ).size;

  // Get available exams for selected student.
  const studentExamNames = [
    ...new Set(
      results
        .filter(
          (result) =>
            getId(result.studentId) === selectedStudentId
        )
        .map((result) => result.examName)
        .filter(Boolean)
    ),
  ];

  // Get selected student's selected exam results.
  const marksheetResults = results
    .filter(
      (result) =>
        getId(result.studentId) === selectedStudentId &&
        result.examName === selectedExamName
    )
    .sort((a, b) =>
      getItemName(a.subjectId, "").localeCompare(
        getItemName(b.subjectId, "")
      )
    );

  const marksheetStudent =
    marksheetResults[0]?.studentId || {};

  const marksheetClass =
    marksheetResults[0]?.classId || {};

  const obtainedTotal = marksheetResults.reduce(
    (sum, result) => sum + Number(result.marks || 0),
    0
  );

  const maximumTotal = marksheetResults.reduce(
    (sum, result) => sum + Number(result.totalMarks || 0),
    0
  );

  const marksheetPercentage =
    maximumTotal > 0
      ? ((obtainedTotal / maximumTotal) * 100).toFixed(2)
      : "0.00";

  // Print selected marksheet.
  const handlePrintMarksheet = () => {
    if (!selectedStudentId || !selectedExamName) {
      setError("Please select a student and examination first.");
      return;
    }

    if (!marksheetResults.length) {
      setError("No results available for this examination.");
      return;
    }

    setError("");
    window.print();
  };

  return (
    <>
      <style>
        {`
          .print-area {
            display: none;
          }

          @media print {
            @page {
              size: A4 portrait;
              margin: 12mm;
            }

            body {
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: hidden !important;
            }

            .print-area,
            .print-area * {
              visibility: visible !important;
            }

            .print-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              min-height: 100vh !important;
              padding: 0 !important;
              margin: 0 !important;
              background: white !important;
              color: #1e293b !important;
            }

            .print-area table {
              width: 100% !important;
              border-collapse: collapse !important;
            }

            .print-area th,
            .print-area td {
              border: 1px solid #cbd5e1 !important;
              padding: 10px !important;
              text-align: left !important;
            }

            .print-area tr {
              page-break-inside: avoid !important;
            }

            .print-area .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="min-h-screen w-full min-w-0 bg-slate-50 p-3 sm:p-5 lg:p-8">
        <div className="mx-auto w-full max-w-7xl min-w-0 space-y-5 sm:space-y-6">

          {/* Page heading */}
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-xs text-slate-500 sm:text-sm">
                Academic Management / Results
              </p>

              <h1 className="text-xl font-bold text-slate-800 sm:text-2xl lg:text-3xl">
                Result Management
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                View and manage examination results.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              {canCreate && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 sm:px-4 sm:text-sm"
                >
                  <Plus size={17} />
                  Add Result
                </button>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && !showModal && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:p-4 sm:text-sm"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span className="min-w-0 flex-1 break-words">
                {error}
              </span>

              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Close error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-start justify-between gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700 sm:p-4 sm:text-sm"
            >
              <span className="break-words">{success}</span>

              <button
                type="button"
                onClick={() => setSuccess("")}
                aria-label="Close success"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 sm:text-sm">
                  Total Results
                </p>
                <ClipboardList
                  size={19}
                  className="shrink-0 text-blue-600 sm:h-[22px] sm:w-[22px]"
                />
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-800 sm:mt-3 sm:text-3xl">
                {results.length}
              </p>
            </div>

            <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 sm:text-sm">
                  Subjects in Results
                </p>
                <BookOpen
                  size={19}
                  className="shrink-0 text-violet-600 sm:h-[22px] sm:w-[22px]"
                />
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-800 sm:mt-3 sm:text-3xl">
                {subjectCount}
              </p>
            </div>

            <div className="col-span-2 min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:col-span-2 sm:p-5 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-500 sm:text-sm">
                  Average Percentage
                </p>
                <Award
                  size={19}
                  className="shrink-0 text-emerald-600 sm:h-[22px] sm:w-[22px]"
                />
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-800 sm:mt-3 sm:text-3xl">
                {averagePercentage}%
              </p>
            </div>
          </div>

          {/* Admin Marksheet Section */}
          {isAdmin && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Printer size={21} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Student Marksheet
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Select a student and examination to print an individual marksheet.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {/* Student select */}
                <div>
                  <label
                    htmlFor="marksheet-student"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Select Student
                  </label>

                  <select
                    id="marksheet-student"
                    value={selectedStudentId}
                    onChange={(event) => {
                      setSelectedStudentId(event.target.value);
                      setSelectedExamName("");
                      setError("");
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose student</option>

                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name}
                        {student.email ? ` (${student.email})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exam select */}
                <div>
                  <label
                    htmlFor="marksheet-exam"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Select Examination
                  </label>

                  <select
                    id="marksheet-exam"
                    value={selectedExamName}
                    onChange={(event) => {
                      setSelectedExamName(event.target.value);
                      setError("");
                    }}
                    disabled={!selectedStudentId}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                  >
                    <option value="">Choose examination</option>

                    {studentExamNames.map((exam) => (
                      <option key={exam} value={exam}>
                        {exam}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Print button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handlePrintMarksheet}
                    disabled={
                      !selectedStudentId ||
                      !selectedExamName ||
                      marksheetResults.length === 0
                    }
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Printer size={18} />
                    Print Marksheet
                  </button>
                </div>
              </div>

              {selectedStudentId && selectedExamName && (
                <p className="mt-3 text-xs text-slate-500">
                  {marksheetResults.length > 0
                    ? `${marksheetResults.length} subject results found for ${selectedExamName}.`
                    : "No result found for this examination."}
                </p>
              )}
            </div>
          )}

          {/* Search and filters */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="relative min-w-0 md:col-span-1">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, subject, exam..."
                  className="w-full min-w-0 rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Classes</option>

                {classes.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.className}
                    {item.section ? ` - ${item.section}` : ""}
                  </option>
                ))}
              </select>

              <select
                value={examFilter}
                onChange={(event) => setExamFilter(event.target.value)}
                className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">All Exams</option>

                {examNames.map((exam) => (
                  <option key={exam} value={exam}>
                    {exam}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results table */}
          <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4">
              <h2 className="text-sm font-semibold text-slate-800 sm:text-base">
                Examination Results
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filteredResults.length} records found
              </p>
            </div>

            {loading ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 p-8 text-slate-500">
                <LoaderCircle
                  size={28}
                  className="animate-spin text-blue-600"
                />
                <p className="text-sm">Loading results...</p>
              </div>
            ) : filteredResults.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center p-8 text-center">
                <Users size={36} className="text-slate-300" />

                <h3 className="mt-3 text-sm font-semibold text-slate-700 sm:text-base">
                  No results found
                </h3>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Try another search or add a result.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Student
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Class
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Subject
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Exam
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Marks
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Percentage
                      </th>
                      <th className="whitespace-nowrap px-5 py-4 font-semibold">
                        Grade
                      </th>

                      {(canEdit || canDelete) && (
                        <th className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredResults.map((result) => {
                      const total = Number(result.totalMarks);
                      const marks = Number(result.marks);

                      const percentage =
                        total > 0
                          ? ((marks / total) * 100).toFixed(1)
                          : "0.0";

                      return (
                        <tr
                          key={result._id}
                          className="transition-colors hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {getItemName(result.studentId)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {result.studentId?.email || ""}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {result.classId?.className || "N/A"}
                            {result.classId?.section
                              ? ` - ${result.classId.section}`
                              : ""}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {getItemName(result.subjectId)}
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {result.examName}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                            {result.marks} / {result.totalMarks}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {percentage}%
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {result.grade || "Not assigned"}
                            </span>
                          </td>

                          {(canEdit || canDelete) && (
                            <td className="px-5 py-4">
                              <div className="flex items-center justify-end gap-2">
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(result)}
                                    title="Edit result"
                                    className="rounded-lg border border-blue-100 p-2 text-blue-600 hover:bg-blue-50"
                                  >
                                    <Pencil size={17} />
                                  </button>
                                )}

                                {canDelete && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(result._id)}
                                    disabled={Boolean(deletingId)}
                                    title="Delete result"
                                    className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {deletingId === result._id ? (
                                      <RefreshCw
                                        size={17}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      <Trash2 size={17} />
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Showing {filteredResults.length} of {results.length} result records.
          </p>
        </div>

        {/* Printable Marksheet */}
        {isAdmin && (
          <div className="print-area">
            <div className="mb-6 border-b-2 border-slate-800 pb-5 text-center">
              {schoolInfo.schoolLogo && (
                <img
                  src={schoolInfo.schoolLogo}
                  alt="School Logo"
                  className="mx-auto mb-3 h-20 w-20 object-contain"
                />
              )}

              <h1 className="text-2xl font-bold uppercase tracking-wide">
                {schoolInfo.schoolName || "School Name"}
              </h1>

              {schoolInfo.schoolAddress && (
                <p className="mt-2 text-sm">
                  {schoolInfo.schoolAddress}
                </p>
              )}

              <div className="mt-1 flex flex-wrap justify-center gap-x-5 text-xs">
                {schoolInfo.schoolEmail && (
                  <span>Email: {schoolInfo.schoolEmail}</span>
                )}

                {schoolInfo.schoolPhone && (
                  <span>Phone: {schoolInfo.schoolPhone}</span>
                )}
              </div>
            </div>

            <div className="mb-6 text-center">
              <h2 className="inline-block border-2 border-slate-800 px-8 py-2 text-xl font-bold uppercase tracking-widest">
                Academic Marksheet
              </h2>

              <p className="mt-3 text-lg font-semibold">
                {selectedExamName}
              </p>

              <p className="mt-1 text-sm">
                Academic Year: {schoolInfo.academicYear || "N/A"}
                {schoolInfo.currentSession
                  ? ` | Session: ${schoolInfo.currentSession}`
                  : ""}
              </p>
            </div>

            {/* Student information */}
            <div className="mb-6 grid grid-cols-2 gap-x-8 gap-y-3 border border-slate-300 p-4 text-sm">
              <p>
                <strong>Student Name:</strong>{" "}
                {marksheetStudent.name || "N/A"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {marksheetStudent.email || "N/A"}
              </p>

              <p>
                <strong>Class:</strong>{" "}
                {marksheetClass.className || "N/A"}
              </p>

              <p>
                <strong>Section:</strong>{" "}
                {marksheetClass.section || "N/A"}
              </p>

              <p>
                <strong>Examination:</strong>{" "}
                {selectedExamName || "N/A"}
              </p>

              <p>
                <strong>Published Date:</strong>{" "}
                {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Subject-wise marks */}
            <table className="mb-6 w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 p-3 text-left">
                    No.
                  </th>

                  <th className="border border-slate-300 p-3 text-left">
                    Subject
                  </th>

                  <th className="border border-slate-300 p-3 text-center">
                    Total Marks
                  </th>

                  <th className="border border-slate-300 p-3 text-center">
                    Obtained Marks
                  </th>

                  <th className="border border-slate-300 p-3 text-center">
                    Percentage
                  </th>

                  <th className="border border-slate-300 p-3 text-center">
                    Grade
                  </th>
                </tr>
              </thead>

              <tbody>
                {marksheetResults.map((result, index) => {
                  const total = Number(result.totalMarks || 0);
                  const marks = Number(result.marks || 0);

                  const percentage =
                    total > 0
                      ? ((marks / total) * 100).toFixed(2)
                      : "0.00";

                  return (
                    <tr key={result._id}>
                      <td className="border border-slate-300 p-3">
                        {index + 1}
                      </td>

                      <td className="border border-slate-300 p-3">
                        {getItemName(result.subjectId)}
                      </td>

                      <td className="border border-slate-300 p-3 text-center">
                        {result.totalMarks}
                      </td>

                      <td className="border border-slate-300 p-3 text-center">
                        {result.marks}
                      </td>

                      <td className="border border-slate-300 p-3 text-center">
                        {percentage}%
                      </td>

                      <td className="border border-slate-300 p-3 text-center">
                        {result.grade || "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="bg-slate-100 font-bold">
                  <td
                    colSpan="2"
                    className="border border-slate-300 p-3 text-right"
                  >
                    Total
                  </td>

                  <td className="border border-slate-300 p-3 text-center">
                    {maximumTotal}
                  </td>

                  <td className="border border-slate-300 p-3 text-center">
                    {obtainedTotal}
                  </td>

                  <td
                    colSpan="2"
                    className="border border-slate-300 p-3 text-center"
                  >
                    {marksheetPercentage}%
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Overall result */}
            <div className="mb-16 border border-slate-300 p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <p>
                  <strong>Total Obtained Marks:</strong>{" "}
                  {obtainedTotal} / {maximumTotal}
                </p>

                <p>
                  <strong>Overall Percentage:</strong>{" "}
                  {marksheetPercentage}%
                </p>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-20 grid grid-cols-2 gap-20 text-center text-sm">
              <div>
                <div className="mx-auto mb-2 w-44 border-t border-slate-800" />
                <p className="font-semibold">Class Teacher</p>
                <p className="mt-1 text-xs">Signature</p>
              </div>

              <div>
                <div className="mx-auto mb-2 w-44 border-t border-slate-800" />
                <p className="font-semibold">Principal</p>
                <p className="mt-1 text-xs">Signature & Seal</p>
              </div>
            </div>

            <p className="mt-12 border-t border-slate-200 pt-3 text-center text-xs text-slate-500">
              This is a computer-generated academic marksheet.
            </p>
          </div>
        )}

        {/* Create / Edit modal */}
        {showModal && canCreate && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-5"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) {
                closeModal();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="result-modal-title"
              className="my-auto flex max-h-[94dvh] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
                <div className="min-w-0">
                  <h2
                    id="result-modal-title"
                    className="text-lg font-bold text-slate-800 sm:text-xl"
                  >
                    {editingId ? "Update Result" : "Add New Result"}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    Enter the examination details below.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  aria-label="Close modal"
                  className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                >
                  <X size={21} />
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="flex min-h-0 flex-1 flex-col"
              >
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                  {error && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 sm:text-sm"
                    >
                      <AlertCircle size={17} className="mt-0.5 shrink-0" />
                      <span className="break-words">{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Student */}
                    <div className="min-w-0">
                      <label
                        htmlFor="result-student"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Student <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="result-student"
                        name="studentId"
                        value={form.studentId}
                        onChange={handleChange}
                        required
                        disabled={Boolean(editingId) || saving}
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                      >
                        <option value="">Select student</option>

                        {students.map((student) => (
                          <option key={student._id} value={student._id}>
                            {student.name}
                            {student.email ? ` (${student.email})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Class */}
                    <div className="min-w-0">
                      <label
                        htmlFor="result-class"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Class <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="result-class"
                        name="classId"
                        value={form.classId}
                        onChange={(event) => {
                          const nextClassId = event.target.value;

                          setForm((previous) => ({
                            ...previous,
                            classId: nextClassId,
                            subjectId: "",
                          }));
                        }}
                        required
                        disabled={Boolean(editingId) || saving}
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                      >
                        <option value="">Select class</option>

                        {classes.map((item) => (
                          <option key={item._id} value={item._id}>
                            {item.className}
                            {item.section ? ` - ${item.section}` : ""}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject */}
                    <div className="min-w-0">
                      <label
                        htmlFor="result-subject"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Subject <span className="text-red-500">*</span>
                      </label>

                      <select
                        id="result-subject"
                        name="subjectId"
                        value={form.subjectId}
                        onChange={handleChange}
                        required
                        disabled={
                          Boolean(editingId) || saving || !form.classId
                        }
                        className="w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                      >
                        <option value="">Select subject</option>

                        {subjects
                          .filter(
                            (subject) =>
                              !form.classId ||
                              getId(subject.classId) === form.classId
                          )
                          .map((subject) => (
                            <option key={subject._id} value={subject._id}>
                              {subject.subjectName}
                            </option>
                          ))}
                      </select>

                      {!form.classId && (
                        <p className="mt-1 text-xs text-slate-400">
                          Select a class first.
                        </p>
                      )}
                    </div>

                    {/* Exam name */}
                    <div className="min-w-0">
                      <label
                        htmlFor="result-exam"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Exam Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="result-exam"
                        type="text"
                        name="examName"
                        value={form.examName}
                        onChange={handleChange}
                        placeholder="Enter exam name"
                        required
                        disabled={saving}
                        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Obtained marks */}
                    <div className="min-w-0">
                      <label
                        htmlFor="result-marks"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Obtained Marks <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="result-marks"
                        type="number"
                        name="marks"
                        value={form.marks}
                        onChange={handleChange}
                        min="0"
                        max={form.totalMarks || undefined}
                        step="any"
                        required
                        disabled={saving}
                        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Total marks */}
                    <div className="min-w-0">
                      <label
                        htmlFor="result-total"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Total Marks <span className="text-red-500">*</span>
                      </label>

                      <input
                        id="result-total"
                        type="number"
                        name="totalMarks"
                        value={form.totalMarks}
                        onChange={handleChange}
                        min="1"
                        step="any"
                        required
                        disabled={saving}
                        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                      />
                    </div>

                    {/* Grade */}
                    <div className="min-w-0 sm:col-span-2">
                      <label
                        htmlFor="result-grade"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Grade (Optional)
                      </label>

                      <input
                        id="result-grade"
                        type="text"
                        name="grade"
                        value={form.grade}
                        onChange={handleChange}
                        placeholder="Enter grade"
                        disabled={saving}
                        className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal footer */}
                <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    {saving && (
                      <LoaderCircle size={17} className="animate-spin" />
                    )}

                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Result"
                        : "Save Result"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

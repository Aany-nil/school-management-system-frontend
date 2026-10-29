
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

export default function ResultManagement() {
  const [results, setResults] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

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

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  const role = user?.role || "";
  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";

  const canCreate = isAdmin || isTeacher;
  const canEdit = isAdmin;
  const canDelete = isAdmin;

  // Load results using the exact backend routes.
  const loadResults = async (currentUser = user) => {
    const currentRole = currentUser?.role;
    let response;

    if (currentRole === "student") {
      if (!currentUser?._id) {
        throw new Error(
          "Student ID not found. Please log in again."
        );
      }

      response = await api.get(
        `/result/student-results/${currentUser._id}`
      );
    } else if (currentRole === "admin") {
      response = await api.get("/result/all-results");
    } else if (currentRole === "teacher") {
      
      const studentResponse = await api.get(
        "/student/all-students"
      );
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
    } else {
      throw new Error(
        "Your account role is not supported for Result Management."
      );
    }

    setResults(getArray(response));
  };

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

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      let currentUser = user;

      try {
        currentUser = JSON.parse(
          localStorage.getItem("user") || "{}"
        );
      } catch {
        currentUser = {};
      }

      setUser(currentUser);

      await Promise.all([
        loadResults(currentUser),
        loadOptions(),
      ]);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load results. Check your API routes and login."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  
  }, []);

  const openCreateModal = () => {
    setEditingId("");
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEditModal = (result) => {
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
    setForm(EMPTY_FORM);
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

    setSaving(true);

    try {
      if (editingId) {
        await api.patch(
          `/result/results-update/${editingId}`,
          payload
        );
      } else {
        await api.post("/result/create", payload);
      }

      setShowModal(false);
      setEditingId("");
      setForm(EMPTY_FORM);

      await loadResults(user);

      setSuccess(
        editingId
          ? "Result updated successfully."
          : "Result created successfully."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to save result. Please check your inputs."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
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
          "Failed to delete result."
      );
    } finally {
      setDeletingId("");
    }
  };

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
      !classFilter ||
      getId(result.classId) === classFilter;

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Result Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              View and manage examination results.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            {canCreate && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={18} />
                Add Result
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Total Results</p>
              <ClipboardList size={22} className="text-blue-600" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-800">
              {results.length}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Subjects in Results</p>
              <BookOpen size={22} className="text-violet-600" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-800">
              {
                new Set(
                  results.map((item) => getId(item.subjectId))
                ).size
              }
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Average Percentage
              </p>
              <Award size={22} className="text-emerald-600" />
            </div>

            <p className="mt-3 text-3xl font-bold text-slate-800">
              {averagePercentage}%
            </p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, subject, exam..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-slate-500">
              <RefreshCw size={18} className="animate-spin" />
              Loading results...
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Users size={38} className="text-slate-300" />

              <h3 className="mt-3 font-semibold text-slate-700">
                No results found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try another search or add a result.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                  <tr>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Subject</th>
                    <th className="px-5 py-4">Exam</th>
                    <th className="px-5 py-4">Marks</th>
                    <th className="px-5 py-4">Percentage</th>
                    <th className="px-5 py-4">Grade</th>

                    {canEdit && (
                      <th className="px-5 py-4">Actions</th>
                    )}

                    {!canEdit && canDelete && (
                      <th className="px-5 py-4">Actions</th>
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
                        className="hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800">
                            {getItemName(result.studentId)}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {result.studentId?.email || ""}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
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

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {result.marks} / {result.totalMarks}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {percentage}%
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {result.grade || "Not assigned"}
                          </span>
                        </td>

                        {(canEdit || canDelete) && (
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(result)}
                                  title="Edit result"
                                  className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                >
                                  <Pencil size={17} />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDelete(result._id)}
                                  disabled={deletingId === result._id}
                                  title="Delete result"
                                  className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
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

      {/* Create / Edit modal */}
      {showModal && canCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? "Update Result" : "Add New Result"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the examination details below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-5"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Student */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Student *
                  </label>

                  <select
                    name="studentId"
                    value={form.studentId}
                    onChange={handleChange}
                    required
                    disabled={Boolean(editingId) || saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-100"
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Class *
                  </label>

                  <select
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
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-100"
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
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Subject *
                  </label>

                  <select
                    name="subjectId"
                    value={form.subjectId}
                    onChange={handleChange}
                    required
                    disabled={Boolean(editingId) || saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-100"
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
                </div>

                {/* Exam */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Exam Name *
                  </label>

                  <input
                    type="text"
                    name="examName"
                    value={form.examName}
                    onChange={handleChange}
                    placeholder="Enter your exam name"
                    required
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Marks */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Obtained Marks *
                  </label>

                  <input
                    type="number"
                    name="marks"
                    value={form.marks}
                    onChange={handleChange}
                    min="0"
                    max={form.totalMarks || undefined}
                    step="any"
                    required
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Total marks */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Total Marks *
                  </label>

                  <input
                    type="number"
                    name="totalMarks"
                    value={form.totalMarks}
                    onChange={handleChange}
                    min="1"
                    step="any"
                    required
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                {/* Optional grade */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Grade (Optional)
                  </label>

                  <input
                    type="text"
                    name="grade"
                    value={form.grade}
                    onChange={handleChange}
                    placeholder="grade"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
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
  );
}

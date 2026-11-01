import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
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

const getName = (item, fallback = "N/A") => {
  if (!item) return fallback;
  if (typeof item === "string") return item;

  return (
    item.name ||
    item.subjectName ||
    item.className ||
    fallback
  );
};

export default function ResultsManagement() {
  const [results, setResults] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });

  // Load teacher classes, subjects and students.
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [classResponse, subjectResponse] = await Promise.all([
        api.get("/teacher/my-classes"),
        api.get("/subject/my-subjects"),
      ]);

      const teacherClasses = getArray(classResponse);
      const teacherSubjects = getArray(subjectResponse);

      setClasses(teacherClasses);
      setSubjects(teacherSubjects);

      // Get students from each assigned class.
      const studentResponses = await Promise.all(
        teacherClasses.map((item) =>
          api.get(`/attendance/students?classId=${item._id}`)
        )
      );

      const studentMap = new Map();

      studentResponses.forEach((response) => {
        getArray(response).forEach((student) => {
          studentMap.set(student._id, student);
        });
      });

      const teacherStudents = Array.from(studentMap.values());
      setStudents(teacherStudents);

      // Get results belonging to assigned students.
      const resultResponses = await Promise.all(
        teacherStudents.map((student) =>
          api.get(`/result/student-results/${student._id}`)
        )
      );

      const resultMap = new Map();

      resultResponses.forEach((response) => {
        getArray(response).forEach((result) => {
          resultMap.set(result._id, result);
        });
      });

      setResults(Array.from(resultMap.values()));
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load result information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = () => {
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleClassChange = (event) => {
    const classId = event.target.value;

    setForm((previous) => ({
      ...previous,
      classId,
      studentId: "",
      subjectId: "",
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
        "Marks must be between 0 and total marks."
      );
      return;
    }

    // Verify selected student belongs to selected class.
    const selectedStudent = students.find(
      (student) => student._id === form.studentId
    );

    if (
      !selectedStudent ||
      getId(selectedStudent.classId) !== form.classId
    ) {
      setError("Selected student does not belong to this class.");
      return;
    }

    // Verify subject belongs to selected class.
    const selectedSubject = subjects.find(
      (subject) =>
        subject._id === form.subjectId &&
        getId(subject.classId) === form.classId
    );

    if (!selectedSubject) {
      setError("Please select a valid subject for this class.");
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
      await api.post("/result/create", payload);

      setShowModal(false);
      setForm(EMPTY_FORM);

      setSuccess("Result created successfully.");

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create result."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const studentName = getName(result.studentId, "");
      const studentEmail = result.studentId?.email || "";
      const subjectName = getName(result.subjectId, "");
      const className = result.classId?.className || "";
      const section = result.classId?.section || "";

      const searchableText = [
        studentName,
        studentEmail,
        subjectName,
        className,
        section,
        result.examName,
        result.grade,
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
  }, [results, search, classFilter, examFilter]);

  const examNames = [
    ...new Set(
      results.map((result) => result.examName).filter(Boolean)
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

  const classStudents = students.filter(
    (student) => getId(student.classId) === form.classId
  );

  const classSubjects = subjects.filter(
    (subject) => getId(subject.classId) === form.classId
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Result Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage results for your assigned classes.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Result
            </button>
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

        {/* Summary */}
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

        {/* Filters */}
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
              <option value="">All My Classes</option>

              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.className} - {item.section}
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
                No results are available for your assigned classes.
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
                            {getName(result.studentId)}
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
                          {getName(result.subjectId)}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {result.examName}
                        </td>

                        <td className="px-5 py-4 font-medium text-slate-700">
                          {marks} / {total}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {percentage}%
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                            {result.grade || "Not assigned"}
                          </span>
                        </td>
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

      {/* Create Result Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Add New Result
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

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                {/* Class */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Class *
                  </label>

                  <select
                    name="classId"
                    value={form.classId}
                    onChange={handleClassChange}
                    required
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
                  >
                    <option value="">Select class</option>

                    {classes.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.className} - {item.section}
                      </option>
                    ))}
                  </select>
                </div>

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
                    disabled={!form.classId || saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-100"
                  >
                    <option value="">Select student</option>

                    {classStudents.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name}
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
                    disabled={!form.classId || saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm disabled:bg-slate-100"
                  >
                    <option value="">Select subject</option>

                    {classSubjects.map((subject) => (
                      <option key={subject._id} value={subject._id}>
                        {subject.subjectName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Exam Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Exam Name *
                  </label>

                  <input
                    type="text"
                    name="examName"
                    value={form.examName}
                    onChange={handleChange}
                    placeholder="Enter exam name"
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

                {/* Total Marks */}
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

                {/* Grade */}
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Grade (Optional)
                  </label>

                  <input
                    type="text"
                    name="grade"
                    value={form.grade}
                    onChange={handleChange}
                    placeholder="Enter grade"
                    disabled={saving}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Result"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
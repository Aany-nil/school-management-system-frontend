
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
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
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

const ITEMS_PER_PAGE = 8;

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

const getClassName = (classItem) => {
  if (!classItem) return "N/A";

  if (typeof classItem === "string") return classItem;

  return `${classItem.className || "N/A"}${
    classItem.section ? ` - ${classItem.section}` : ""
  }`;
};

const formatPercentage = (marks, total) => {
  const obtained = Number(marks);
  const maximum = Number(total);

  if (!Number.isFinite(obtained) || maximum <= 0) {
    return "0.0";
  }

  return ((obtained / maximum) * 100).toFixed(1);
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

  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Marksheet states
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState({});

  // Load teacher's assigned classes, subjects, students and results.
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

      // Fetch students from assigned classes.
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

      // Fetch results belonging to assigned students.
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

  // Load school information for marksheet preview.
  useEffect(() => {
    const loadSchoolInfo = async () => {
      try {
        const response = await api.get("/settings/setting");

        setSchoolInfo(
          response.data?.data?.school || {}
        );
      } catch (err) {
        console.log("School information could not be loaded.");
      }
    };

    loadSchoolInfo();
  }, []);

  // Reset pagination when filters change.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, classFilter, examFilter]);

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
    setError("");
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
      setError("Marks must be between 0 and total marks.");
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

    // Verify selected subject belongs to selected class.
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

  // Open marksheet for selected student and exam.
  const openMarksheet = (studentId, examName) => {
    const studentResults = results
      .filter(
        (result) =>
          getId(result.studentId) === studentId &&
          result.examName === examName
      )
      .sort((a, b) =>
        getName(a.subjectId).localeCompare(getName(b.subjectId))
      );

    if (studentResults.length === 0) {
      setError("No marksheet data found.");
      return;
    }

    const firstResult = studentResults[0];

    const obtainedMarks = studentResults.reduce(
      (sum, item) => sum + Number(item.marks || 0),
      0
    );

    const totalMarks = studentResults.reduce(
      (sum, item) => sum + Number(item.totalMarks || 0),
      0
    );

    setSelectedMarksheet({
      student: firstResult.studentId,
      class: firstResult.classId,
      examName,
      results: studentResults,
      obtainedMarks,
      totalMarks,
      percentage:
        totalMarks > 0
          ? ((obtainedMarks / totalMarks) * 100).toFixed(2)
          : "0.00",
    });
  };

  // Filter results.
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

  // Exam filter options.
  const examNames = useMemo(() => {
    return [
      ...new Set(
        results.map((result) => result.examName).filter(Boolean)
      ),
    ];
  }, [results]);

  // Summary calculations.
  const averagePercentage = useMemo(() => {
    if (results.length === 0) return "0.0";

    const totalPercentage = results.reduce((sum, result) => {
      return (
        sum +
        Number(
          formatPercentage(result.marks, result.totalMarks)
        )
      );
    }, 0);

    return (totalPercentage / results.length).toFixed(1);
  }, [results]);

  const totalSubjects = new Set(
    results.map((item) => getId(item.subjectId))
  ).size;

  // Pagination.
  const totalPages = Math.ceil(
    filteredResults.length / ITEMS_PER_PAGE
  );

  const safePage = Math.min(
    currentPage,
    Math.max(totalPages, 1)
  );

  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;

  const visibleResults = filteredResults.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const classStudents = students.filter(
    (student) => getId(student.classId) === form.classId
  );

  const classSubjects = subjects.filter(
    (subject) => getId(subject.classId) === form.classId
  );

  const clearFilters = () => {
    setSearch("");
    setClassFilter("");
    setExamFilter("");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">

        {/* Heading */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <GraduationCap size={22} />
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-800 sm:text-2xl lg:text-3xl">
                  Result Management
                </h1>

                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Manage examination results for your assigned classes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-4"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={openModal}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:flex-none sm:px-4"
            >
              <Plus size={18} />
              Add Result
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && !showModal && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <FileText size={17} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Total Results
              </p>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 sm:h-10 sm:w-10">
                <ClipboardList size={19} />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
              {results.length}
            </p>

            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              All examination records
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Subjects in Results
              </p>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 sm:h-10 sm:w-10">
                <BookOpen size={19} />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
              {totalSubjects}
            </p>

            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              Different subjects
            </p>
          </div>

          <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md lg:col-span-1 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Average Percentage
              </p>

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 sm:h-10 sm:w-10">
                <Award size={19} />
              </div>
            </div>

            <p className="mt-3 text-2xl font-bold text-slate-800 sm:text-3xl">
              {averagePercentage}%
            </p>

            <p className="mt-1 text-[11px] text-slate-400 sm:text-xs">
              Overall average result
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <Filter size={17} className="text-blue-600" />

            <h2 className="text-sm font-semibold text-slate-700">
              Search & Filters
            </h2>
          </div>

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
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <select
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All My Classes</option>

              {classes.map((item) => (
                <option key={item._id} value={item._id}>
                  {getClassName(item)}
                </option>
              ))}
            </select>

            <select
              value={examFilter}
              onChange={(event) => setExamFilter(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Exams</option>

              {examNames.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>
          </div>

          {(search || classFilter || examFilter) && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">
                {filteredResults.length} matching result(s) found
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

        {/* Results Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-semibold text-slate-800">
                Examination Results
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                View results of students in your assigned classes.
              </p>
            </div>

            <span className="mt-2 w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 sm:mt-0">
              {filteredResults.length} Records
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw
                size={25}
                className="animate-spin text-blue-600"
              />

              <p className="text-sm">Loading results...</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <ClipboardList size={27} />
              </div>

              <h3 className="mt-4 font-semibold text-slate-700">
                No Results Found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-slate-500">
                No examination results are available for your selected classes or filters.
              </p>

              {(search || classFilter || examFilter) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="whitespace-nowrap px-5 py-4">
                        Student
                      </th>

                      <th className="whitespace-nowrap px-5 py-4">
                        Class
                      </th>

                      <th className="whitespace-nowrap px-5 py-4">
                        Subject
                      </th>

                      <th className="whitespace-nowrap px-5 py-4">
                        Exam
                      </th>

                      <th className="whitespace-nowrap px-5 py-4">
                        Marks
                      </th>

                      <th className="whitespace-nowrap px-5 py-4">
                        Percentage
                      </th>

                      <th className="whitespace-nowrap px-5 py-4">
                        Grade
                      </th>

                      <th className="whitespace-nowrap px-5 py-4">
                        Marksheet
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {visibleResults.map((result) => {
                      const percentage = formatPercentage(
                        result.marks,
                        result.totalMarks
                      );

                      return (
                        <tr
                          key={result._id}
                          className="transition-colors hover:bg-blue-50/40"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                {getName(result.studentId, "?")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800">
                                  {getName(result.studentId)}
                                </p>

                                <p className="mt-0.5 max-w-[180px] truncate text-xs text-slate-500">
                                  {result.studentId?.email || ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {getClassName(result.classId)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-700">
                            {getName(result.subjectId)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                            {result.examName || "N/A"}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-700">
                            {result.marks} / {result.totalMarks}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="font-semibold text-slate-700">
                              {percentage}%
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {result.grade || "Not assigned"}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                openMarksheet(
                                  getId(result.studentId),
                                  result.examName
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {startIndex + 1}
                  </span>
                  {" - "}
                  <span className="font-semibold text-slate-700">
                    {Math.min(
                      startIndex + ITEMS_PER_PAGE,
                      filteredResults.length
                    )}
                  </span>
                  {" of "}
                  <span className="font-semibold text-slate-700">
                    {filteredResults.length}
                  </span>
                  {" results"}
                </p>

                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((previous) =>
                        Math.max(previous - 1, 1)
                      )
                    }
                    disabled={safePage === 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={15} />
                    Previous
                  </button>

                  <span className="whitespace-nowrap text-xs font-medium text-slate-600">
                    Page {safePage} of {Math.max(totalPages, 1)}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((previous) =>
                        Math.min(previous + 1, totalPages)
                      )
                    }
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Showing {filteredResults.length} of {results.length} total result records.
        </p>
      </div>

      {/* Add Result Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-5">
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Plus size={21} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Add New Result
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Enter the examination details below.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="space-y-5 overflow-y-auto p-4 sm:p-6">

                {error && (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                {/* Class & Student */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Users size={17} className="text-blue-600" />
                    Student Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Class <span className="text-red-500">*</span>
                      </label>

                      <select
                        name="classId"
                        value={form.classId}
                        onChange={handleClassChange}
                        required
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      >
                        <option value="">Select class</option>

                        {classes.map((item) => (
                          <option key={item._id} value={item._id}>
                            {getClassName(item)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Student <span className="text-red-500">*</span>
                      </label>

                      <select
                        name="studentId"
                        value={form.studentId}
                        onChange={handleChange}
                        required
                        disabled={!form.classId || saving}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      >
                        <option value="">
                          {form.classId
                            ? "Select student"
                            : "Select class first"}
                        </option>

                        {classStudents.map((student) => (
                          <option
                            key={student._id}
                            value={student._id}
                          >
                            {student.name}
                          </option>
                        ))}
                      </select>

                      {form.classId && classStudents.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          No students found in this class.
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Subject <span className="text-red-500">*</span>
                      </label>

                      <select
                        name="subjectId"
                        value={form.subjectId}
                        onChange={handleChange}
                        required
                        disabled={!form.classId || saving}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                      >
                        <option value="">
                          {form.classId
                            ? "Select subject"
                            : "Select class first"}
                        </option>

                        {classSubjects.map((subject) => (
                          <option
                            key={subject._id}
                            value={subject._id}
                          >
                            {subject.subjectName}
                          </option>
                        ))}
                      </select>

                      {form.classId && classSubjects.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">
                          No subjects assigned to this class.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Exam Information */}
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <BookOpen size={17} className="text-blue-600" />
                    Examination Information
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Exam Name <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="text"
                        name="examName"
                        value={form.examName}
                        onChange={handleChange}
                        placeholder="e.g. First Term Examination"
                        required
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Obtained Marks <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="number"
                        name="marks"
                        value={form.marks}
                        onChange={handleChange}
                        placeholder="Enter obtained marks"
                        min="0"
                        max={form.totalMarks || undefined}
                        step="any"
                        required
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Total Marks <span className="text-red-500">*</span>
                      </label>

                      <input
                        type="number"
                        name="totalMarks"
                        value={form.totalMarks}
                        onChange={handleChange}
                        placeholder="Enter total marks"
                        min="1"
                        step="any"
                        required
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Grade <span className="text-xs font-normal text-slate-400">(Optional)</span>
                      </label>

                      <input
                        type="text"
                        name="grade"
                        value={form.grade}
                        onChange={handleChange}
                        placeholder="e.g. A+, A, B"
                        disabled={saving}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Percentage Preview */}
                {form.marks !== "" &&
                  form.totalMarks !== "" &&
                  Number(form.totalMarks) > 0 &&
                  Number(form.marks) >= 0 && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-xs font-medium text-blue-700">
                        Result Percentage Preview
                      </p>

                      <p className="mt-1 text-2xl font-bold text-blue-700">
                        {formatPercentage(
                          form.marks,
                          form.totalMarks
                        )}
                        %
                      </p>
                    </div>
                  )}
              </div>

              {/* Modal Footer */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Save Result
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Marksheet View Modal */}
      {selectedMarksheet && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <FileText size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    Student Marksheet
                  </h2>
                  <p className="text-xs text-slate-500">
                    View-only examination marksheet
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMarksheet(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            {/* Marksheet Content */}
            <div className="overflow-y-auto p-4 sm:p-7">
              <div className="mx-auto max-w-3xl border border-slate-200 p-5 sm:p-8">

                {/* School Information */}
                <div className="border-b-2 border-blue-600 pb-5 text-center">
                  {schoolInfo.schoolLogo && (
                    <img
                      src={schoolInfo.schoolLogo}
                      alt="School Logo"
                      className="mx-auto mb-3 h-16 w-16 rounded-lg object-contain"
                    />
                  )}

                  <h1 className="text-xl font-bold uppercase text-slate-800 sm:text-2xl">
                    {schoolInfo.schoolName || "School Management System"}
                  </h1>

                  {schoolInfo.schoolAddress && (
                    <p className="mt-1 text-xs text-slate-500">
                      {schoolInfo.schoolAddress}
                    </p>
                  )}

                  <div className="mt-1 flex flex-wrap justify-center gap-x-4 text-xs text-slate-500">
                    {schoolInfo.schoolEmail && (
                      <span>{schoolInfo.schoolEmail}</span>
                    )}

                    {schoolInfo.schoolPhone && (
                      <span>{schoolInfo.schoolPhone}</span>
                    )}
                  </div>

                  <h2 className="mt-4 inline-block rounded-full bg-blue-50 px-5 py-2 text-sm font-bold uppercase tracking-wider text-blue-700">
                    Academic Marksheet
                  </h2>
                </div>

                {/* Student Information */}
                <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">Student Name</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {getName(selectedMarksheet.student)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Student Email</p>
                    <p className="mt-1 break-all font-medium text-slate-700">
                      {selectedMarksheet.student?.email || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Class</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {getClassName(selectedMarksheet.class)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">Examination</p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {selectedMarksheet.examName}
                    </p>
                  </div>

                  {schoolInfo.academicYear && (
                    <div>
                      <p className="text-xs text-slate-500">Academic Year</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {schoolInfo.academicYear}
                      </p>
                    </div>
                  )}

                  {schoolInfo.currentSession && (
                    <div>
                      <p className="text-xs text-slate-500">Session</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {schoolInfo.currentSession}
                      </p>
                    </div>
                  )}
                </div>

                {/* Subject Marks */}
                <div className="mt-7">
                  <h3 className="mb-3 font-bold text-slate-800">
                    Subject-wise Academic Performance
                  </h3>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] border-collapse text-sm">
                      <thead>
                        <tr className="bg-blue-600 text-white">
                          <th className="border border-blue-500 px-3 py-3 text-left">
                            Subject
                          </th>
                          <th className="border border-blue-500 px-3 py-3 text-center">
                            Total Marks
                          </th>
                          <th className="border border-blue-500 px-3 py-3 text-center">
                            Obtained Marks
                          </th>
                          <th className="border border-blue-500 px-3 py-3 text-center">
                            Percentage
                          </th>
                          <th className="border border-blue-500 px-3 py-3 text-center">
                            Grade
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {selectedMarksheet.results.map((item, index) => (
                          <tr
                            key={item._id}
                            className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                          >
                            <td className="border border-slate-200 px-3 py-3 font-medium text-slate-700">
                              {getName(item.subjectId)}
                            </td>

                            <td className="border border-slate-200 px-3 py-3 text-center">
                              {item.totalMarks}
                            </td>

                            <td className="border border-slate-200 px-3 py-3 text-center font-semibold">
                              {item.marks}
                            </td>

                            <td className="border border-slate-200 px-3 py-3 text-center">
                              {formatPercentage(item.marks, item.totalMarks)}%
                            </td>

                            <td className="border border-slate-200 px-3 py-3 text-center font-semibold text-blue-700">
                              {item.grade || "N/A"}
                            </td>
                          </tr>
                        ))}
                      </tbody>

                      <tfoot>
                        <tr className="bg-blue-50 font-bold text-slate-800">
                          <td className="border border-slate-200 px-3 py-3">
                            Total
                          </td>

                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {selectedMarksheet.totalMarks}
                          </td>

                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {selectedMarksheet.obtainedMarks}
                          </td>

                          <td className="border border-slate-200 px-3 py-3 text-center">
                            {selectedMarksheet.percentage}%
                          </td>

                          <td className="border border-slate-200 px-3 py-3 text-center">
                            —
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Overall Result */}
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Total Subjects</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                      {selectedMarksheet.results.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-500">Obtained Marks</p>
                    <p className="mt-1 text-xl font-bold text-slate-800">
                      {selectedMarksheet.obtainedMarks}
                    </p>
                  </div>

                  <div className="col-span-2 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:col-span-1">
                    <p className="text-xs text-blue-600">Overall Percentage</p>
                    <p className="mt-1 text-xl font-bold text-blue-700">
                      {selectedMarksheet.percentage}%
                    </p>
                  </div>
                </div>

                {/* Note */}
                <div className="mt-8 border-t border-slate-200 pt-4 text-center">
                  <p className="text-xs text-slate-500">
                    This marksheet is provided for academic viewing purposes.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setSelectedMarksheet(null)}
                className="rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

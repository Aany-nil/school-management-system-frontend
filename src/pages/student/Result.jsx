
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  Search,
  RefreshCw,
  TrendingUp,
  ClipboardList,
  AlertCircle,
  GraduationCap,
  Trophy,
} from "lucide-react";
import api from "../../services/api";

const Result = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("All");

  // Get Student ID from localStorage
  const getStudentId = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) return null;

      const user = JSON.parse(storedUser);

      return user?._id || user?.id || null;
    } catch (err) {
      console.error("User information error:", err);
      return null;
    }
  };

  // Fetch Student Results
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError("");

      const studentId = getStudentId();

      if (!studentId) {
        setError("Student information not found. Please login again.");
        return;
      }

      const response = await api.get(
        `/result/student-results/${studentId}`
      );

      setResults(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error("Result fetch error:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to load results."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // Summary Calculations
  const totalResults = results.length;

  const totalMarks = results.reduce(
    (sum, item) => sum + Number(item.totalMarks || 0),
    0
  );

  const obtainedMarks = results.reduce(
    (sum, item) => sum + Number(item.marks || 0),
    0
  );

  const averagePercentage =
    totalMarks > 0
      ? Math.round((obtainedMarks / totalMarks) * 100)
      : 0;

  const totalExams = new Set(
    results.map((item) => item.examName).filter(Boolean)
  ).size;

  // Unique Exam Names
  const examNames = [
    ...new Set(
      results.map((item) => item.examName).filter(Boolean)
    ),
  ];

  // Filter Results
  const filteredResults = useMemo(() => {
    return results.filter((item) => {
      const subjectName =
        item.subjectId?.subjectName ||
        item.subjectId?.name ||
        "";

      const className = item.classId?.className || "";
      const examName = item.examName || "";

      const searchText = search.toLowerCase();

      const matchesSearch =
        subjectName.toLowerCase().includes(searchText) ||
        className.toLowerCase().includes(searchText) ||
        examName.toLowerCase().includes(searchText) ||
        String(item.grade || "").toLowerCase().includes(searchText);

      const matchesExam =
        examFilter === "All" || item.examName === examFilter;

      return matchesSearch && matchesExam;
    });
  }, [results, search, examFilter]);

  // Grade Style
  const getGradeStyle = (grade) => {
    const value = String(grade || "").toUpperCase();

    if (value.startsWith("A")) {
      return "bg-green-100 text-green-700";
    }

    if (value.startsWith("B")) {
      return "bg-blue-100 text-blue-700";
    }

    if (value.startsWith("C")) {
      return "bg-yellow-100 text-yellow-700";
    }

    if (value.startsWith("F")) {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  // Summary Cards
  const summaryCards = [
    {
      title: "Total Results",
      value: totalResults,
      icon: BookOpen,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Total Exams",
      value: totalExams,
      icon: CalendarDays,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Obtained Marks",
      value: `${obtainedMarks}/${totalMarks}`,
      icon: Award,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Average Percentage",
      value: `${averagePercentage}%`,
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-7">

        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl">
              My Results
            </h1>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              View your examination results, marks and grades.
            </p>
          </div>

          <button
            onClick={fetchResults}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-5 sm:py-3"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 sm:p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <p className="break-words text-sm">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-gray-100 bg-white">
            <div className="text-center">
              <RefreshCw
                size={30}
                className="mx-auto text-blue-600"
              />

              <p className="mt-3 text-sm text-gray-500">
                Loading results...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="min-w-0 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:p-5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="break-words text-xs font-medium text-gray-500 sm:text-sm">
                          {card.title}
                        </p>

                        <h2 className="mt-2 break-words text-xl font-bold text-gray-800 sm:text-2xl sm:text-3xl">
                          {card.value}
                        </h2>
                      </div>

                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl ${card.color}`}
                      >
                        <Icon size={19} className="sm:hidden" />
                        <Icon size={25} className="hidden sm:block" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Academic Performance */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="shrink-0 rounded-lg bg-blue-100 p-2.5 text-blue-600 sm:p-3">
                  <GraduationCap size={23} />
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
                    Academic Performance
                  </h2>

                  <p className="text-xs text-gray-500 sm:text-sm">
                    Your overall marks percentage
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-center">

                {/* Percentage */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Average Percentage
                    </span>

                    <span className="text-xl font-bold text-blue-600 sm:text-2xl">
                      {averagePercentage}%
                    </span>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{
                        width: `${Math.min(averagePercentage, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                    Your overall examination performance.
                  </p>
                </div>

                {/* Marks Overview */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-green-50 p-3 sm:p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle2Fallback />
                      <p className="text-xs font-medium sm:text-sm">
                        Obtained Marks
                      </p>
                    </div>

                    <h3 className="mt-2 text-xl font-bold text-green-700 sm:text-2xl">
                      {obtainedMarks}
                    </h3>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-3 sm:p-4">
                    <div className="flex items-center gap-2 text-blue-700">
                      <ClipboardList size={16} />
                      <p className="text-xs font-medium sm:text-sm">
                        Total Marks
                      </p>
                    </div>

                    <h3 className="mt-2 text-xl font-bold text-blue-700 sm:text-2xl">
                      {totalMarks}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Examination Results */}
            <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

              {/* Table Header */}
              <div className="border-b border-gray-100 p-4 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
                      Examination Results
                    </h2>

                    <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                      Your subject-wise examination performance.
                    </p>
                  </div>

                  {/* Search and Filter */}
                  <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">

                    {/* Search */}
                    <div className="relative w-full sm:flex-1 lg:w-64">
                      <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        placeholder="Search subject..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    {/* Exam Filter */}
                    <select
                      value={examFilter}
                      onChange={(e) => setExamFilter(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-44"
                    >
                      <option value="All">All Exams</option>

                      {examNames.map((exam) => (
                        <option key={exam} value={exam}>
                          {exam}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[750px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">SL</th>
                      <th className="px-5 py-4 font-semibold">Exam Name</th>
                      <th className="px-5 py-4 font-semibold">Subject</th>
                      <th className="px-5 py-4 font-semibold">Class</th>
                      <th className="px-5 py-4 font-semibold">Marks</th>
                      <th className="px-5 py-4 font-semibold">Grade</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {filteredResults.length > 0 ? (
                      filteredResults.map((item, index) => (
                        <tr
                          key={item._id || index}
                          className="transition hover:bg-gray-50"
                        >
                          <td className="px-5 py-4 text-gray-600">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4 font-medium text-gray-700">
                            {item.examName || "N/A"}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {item.subjectId?.subjectName ||
                              item.subjectId?.name ||
                              "N/A"}
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            {item.classId?.className || "N/A"}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-700">
                            {item.marks ?? 0} / {item.totalMarks ?? 0}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getGradeStyle(
                                item.grade
                              )}`}
                            >
                              {item.grade || "N/A"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-5 py-12">
                          <div className="flex flex-col items-center justify-center text-center">
                            <ClipboardList
                              size={36}
                              className="text-gray-300"
                            />

                            <h3 className="mt-3 font-semibold text-gray-700">
                              No Results Found
                            </h3>

                            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                              Try changing your search or exam filter.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p>
                  Showing {filteredResults.length} of {totalResults} results
                </p>

                <p>
                  Average:{" "}
                  <span className="font-semibold text-blue-600">
                    {averagePercentage}%
                  </span>
                </p>
              </div>
            </div>

            {/* Empty Results Notice */}
            {totalResults === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center sm:p-8">
                <Trophy
                  size={38}
                  className="mx-auto text-gray-300"
                />

                <h3 className="mt-3 font-semibold text-gray-700">
                  No Results Available
                </h3>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Your examination results will appear here once they are published.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Small icon for obtained marks
const CheckCircle2Fallback = () => (
  <Award size={16} />
);

export default Result;

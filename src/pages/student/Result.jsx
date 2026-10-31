
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            My Results
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            View your examination results, marks and grades.
          </p>
        </div>

        <button
          onClick={fetchResults}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={32}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-gray-500">
              Loading results...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        {card.title}
                      </p>

                      <h2 className="mt-2 text-2xl font-bold text-gray-800">
                        {card.value}
                      </h2>
                    </div>

                    <div className={`rounded-xl p-3 ${card.color}`}>
                      <Icon size={25} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Academic Performance */}
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                  <GraduationCap size={24} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-800">
                    Academic Performance
                  </h2>

                  <p className="text-sm text-gray-500">
                    Your overall marks percentage
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-blue-600">
                {averagePercentage}%
              </h2>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${Math.min(averagePercentage, 100)}%`,
                }}
              />
            </div>

            <p className="mt-3 text-sm text-gray-500">
              You obtained {obtainedMarks} out of {totalMarks} total marks.
            </p>
          </div>

          {/* Result Table */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

            {/* Table Header */}
            <div className="border-b border-gray-100 p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Examination Results
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Your subject-wise examination performance.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                  {/* Search */}
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      placeholder="Search subject..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 sm:w-52"
                    />
                  </div>

                  {/* Exam Filter */}
                  <select
                    value={examFilter}
                    onChange={(e) => setExamFilter(e.target.value)}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      #
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Exam Name
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Subject
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Class
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Marks
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Grade
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredResults.length > 0 ? (
                    filteredResults.map((item, index) => (
                      <tr
                        key={item._id || index}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {item.examName || "N/A"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.subjectId?.subjectName ||
                            item.subjectId?.name ||
                            "N/A"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.classId?.className || "N/A"}
                        </td>

                        <td className="px-6 py-4 text-sm font-semibold text-gray-700">
                          {item.marks} / {item.totalMarks}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getGradeStyle(
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
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <ClipboardList
                          size={38}
                          className="mx-auto text-gray-300"
                        />

                        <p className="mt-3 font-medium text-gray-600">
                          No results found
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Try changing your search or exam filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">
                Showing {filteredResults.length} of {totalResults} results
              </p>
            </div>
          </div>

          {/* Empty State */}
          {totalResults === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <Trophy
                size={38}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-3 font-semibold text-gray-700">
                No Results Available
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Your examination results will appear here once they are published.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Result;


import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Search,
  GraduationCap,
  Layers,
  ChevronDown,
  ChevronUp,
  Eye,
  X,
  BookMarked,
  Hash,
  CalendarDays,
} from "lucide-react";
import api from "../../services/api";

const Subject = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [expandedClasses, setExpandedClasses] = useState({});

  // Fetch teacher's classes and subjects
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [classResponse, subjectResponse] = await Promise.all([
        api.get("/teacher/my-classes"),
        api.get("/subject/my-subjects"),
      ]);

      const classData = classResponse.data.data || [];
      const subjectData = subjectResponse.data.data || [];

      setClasses(classData);
      setSubjects(subjectData);

      // Expand all classes by default
      const expanded = {};
      classData.forEach((item) => {
        expanded[item._id] = true;
      });

      setExpandedClasses(expanded);
    } catch (err) {
      console.error("Subject page error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load your subjects. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search subjects
  const filteredSubjects = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return subjects;

    return subjects.filter((subject) => {
      const subjectName = subject.subjectName?.toLowerCase() || "";
      const subjectCode = subject.subjectCode?.toLowerCase() || "";
      const className = subject.classId?.className?.toLowerCase() || "";
      const section = subject.classId?.section?.toLowerCase() || "";

      return (
        subjectName.includes(search) ||
        subjectCode.includes(search) ||
        className.includes(search) ||
        section.includes(search)
      );
    });
  }, [subjects, searchTerm]);

  // Get subjects for a particular class
  const getClassSubjects = (classId) => {
    return filteredSubjects.filter(
      (subject) => subject.classId?._id === classId
    );
  };

  // Toggle class section
  const toggleClass = (classId) => {
    setExpandedClasses((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };

  // Loading UI
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
          <p className="mt-3 text-sm font-medium text-gray-500">
            Loading your subjects...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
                <BookOpen size={23} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                My Subjects
              </h1>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              View all subjects assigned to your classes.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 shadow-sm">
            <GraduationCap size={19} className="text-blue-600" />
            <span>Teacher Dashboard</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            <span>{error}</span>
            <button
              onClick={fetchData}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Subjects
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-800">
                  {subjects.length}
                </h2>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <BookOpen size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Assigned Classes
                </p>
                <h2 className="mt-2 text-3xl font-bold text-gray-800">
                  {classes.length}
                </h2>
              </div>
              <div className="rounded-xl bg-purple-50 p-3 text-purple-600">
                <Layers size={25} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by subject name, code or class..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-11 pr-10 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {/* Class-wise Subject Lists */}
        <div className="space-y-5">
          {classes.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
              <GraduationCap
                size={42}
                className="mx-auto text-gray-300"
              />
              <h3 className="mt-3 font-semibold text-gray-700">
                No Classes Assigned
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You have not been assigned to any class yet.
              </p>
            </div>
          ) : (
            classes.map((classItem) => {
              const classSubjects = getClassSubjects(classItem._id);
              const isExpanded = expandedClasses[classItem._id];

              // Hide classes that have no matching subjects during search
              if (searchTerm && classSubjects.length === 0) {
                return null;
              }

              return (
                <div
                  key={classItem._id}
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                  {/* Class Header */}
                  <button
                    onClick={() => toggleClass(classItem._id)}
                    className="flex w-full items-center justify-between gap-3 bg-white px-5 py-4 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                        <GraduationCap size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800">
                          {classItem.className || "Class"}
                          {classItem.section
                            ? ` - ${classItem.section}`
                            : ""}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          Academic Year:{" "}
                          {classItem.academicYear || "N/A"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {classSubjects.length} Subjects
                      </span>

                      {isExpanded ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Subject Rows */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {classSubjects.length === 0 ? (
                        <div className="px-5 py-8 text-center">
                          <BookOpen
                            size={32}
                            className="mx-auto text-gray-300"
                          />
                          <p className="mt-2 text-sm font-medium text-gray-600">
                            No subjects added to this class yet.
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Contact the administrator for subject assignment.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Table Header */}
                          <div className="hidden grid-cols-12 gap-3 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
                            <div className="col-span-1">No.</div>
                            <div className="col-span-5">Subject Name</div>
                            <div className="col-span-3">Subject Code</div>
                            <div className="col-span-2">Class</div>
                            <div className="col-span-1 text-right">Action</div>
                          </div>

                          <div className="divide-y divide-gray-100">
                            {classSubjects.map((subject, index) => (
                              <div
                                key={subject._id}
                                className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition hover:bg-blue-50/40 sm:grid-cols-12 sm:gap-3"
                              >
                                {/* Number */}
                                <div className="hidden text-sm font-medium text-gray-400 sm:col-span-1 sm:block">
                                  {String(index + 1).padStart(2, "0")}
                                </div>

                                {/* Subject Name */}
                                <div className="flex min-w-0 items-center gap-3 sm:col-span-5">
                                  <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600">
                                    <BookMarked size={19} />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-gray-800">
                                      {subject.subjectName || "Unnamed Subject"}
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400 sm:hidden">
                                      {subject.subjectCode || "No code"}
                                    </p>
                                  </div>
                                </div>

                                {/* Subject Code */}
                                <div className="hidden sm:col-span-3 sm:block">
                                  <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600">
                                    <Hash size={13} />
                                    {subject.subjectCode || "N/A"}
                                  </span>
                                </div>

                                {/* Class */}
                                <div className="hidden sm:col-span-2 sm:block">
                                  <span className="text-sm text-gray-600">
                                    {classItem.className}
                                    {classItem.section
                                      ? ` (${classItem.section})`
                                      : ""}
                                  </span>
                                </div>

                                {/* Action */}
                                <div className="flex items-center justify-between sm:col-span-1 sm:justify-end">
                                  <span className="text-xs text-gray-400 sm:hidden">
                                    Subject {index + 1}
                                  </span>

                                  <button
                                    onClick={() =>
                                      setSelectedSubject(subject)
                                    }
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                                  >
                                    <Eye size={15} />
                                    <span>View</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* No Search Results */}
        {searchTerm &&
          classes.length > 0 &&
          filteredSubjects.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-10 text-center">
              <Search size={35} className="mx-auto text-gray-300" />
              <h3 className="mt-3 font-semibold text-gray-700">
                No Subjects Found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try searching with another subject name or code.
              </p>
            </div>
          )}
      </div>

      {/* Subject Details Modal */}
      {selectedSubject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedSubject(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <BookOpen size={20} />
                </div>
                <h3 className="font-semibold text-gray-800">
                  Subject Details
                </h3>
              </div>

              <button
                onClick={() => setSelectedSubject(null)}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={19} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Subject Name
                </p>
                <p className="mt-1 text-lg font-bold text-gray-800">
                  {selectedSubject.subjectName || "N/A"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Hash size={14} />
                    Subject Code
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    {selectedSubject.subjectCode || "N/A"}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <GraduationCap size={14} />
                    Class
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-700">
                    {selectedSubject.classId?.className || "N/A"}
                    {selectedSubject.classId?.section
                      ? ` (${selectedSubject.classId.section})`
                      : ""}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                  <CalendarDays size={14} />
                  Academic Year
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-700">
                  {selectedSubject.classId?.academicYear || "N/A"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Description
                </p>
                <p className="mt-1 rounded-lg bg-gray-50 p-3 text-sm leading-6 text-gray-600">
                  {selectedSubject.description ||
                    "No description available for this subject."}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 px-5 py-4 text-right">
              <button
                onClick={() => setSelectedSubject(null)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subject;

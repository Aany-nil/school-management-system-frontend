
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  GraduationCap,
  RefreshCw,
  Eye,
  X,
  Mail,
  MapPin,
  CalendarDays,
  BookOpen,
  AlertCircle,
  UserRound,
} from "lucide-react";

import api from "../../services/api";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch teacher's own students
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/teacher/my-students");

      setStudents(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Search students
  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    if (!search) return students;

    return students.filter((student) => {
      const className = student.classId?.className || "";
      const section = student.classId?.section || "";

      return (
        student.name?.toLowerCase().includes(search) ||
        student.email?.toLowerCase().includes(search) ||
        className.toLowerCase().includes(search) ||
        section.toLowerCase().includes(search)
      );
    });
  }, [students, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-7">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-blue-600 sm:text-sm">
              Teacher Portal
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-800 sm:text-3xl">
              Student Management
            </h1>

            <p className="mt-2 text-xs text-slate-500 sm:text-sm">
              View and manage students assigned to your classes.
            </p>
          </div>

          <button
            onClick={fetchStudents}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5">

          {/* Total Students */}
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5">
            <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  Total My Students
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-800 sm:text-3xl">
                  {students.length}
                </h2>

                <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                  Students in your classes
                </p>
              </div>

              <div className="w-fit rounded-xl bg-blue-50 p-2.5 text-blue-600 sm:p-3.5">
                <Users size={22} />
              </div>
            </div>
          </div>

          {/* Showing Results */}
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5">
            <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                  Showing Results
                </p>

                <h2 className="mt-2 text-xl font-bold text-slate-800 sm:text-3xl">
                  {filteredStudents.length}
                </h2>

                <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
                  Matching students
                </p>
              </div>

              <div className="w-fit rounded-xl bg-emerald-50 p-2.5 text-emerald-600 sm:p-3.5">
                <GraduationCap size={22} />
              </div>
            </div>
          </div>

        </div>

        {/* Search Section */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm sm:p-5">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-800">
              Search Students
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Find students by name, email, class or section.
            </p>
          </div>

          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or class..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-sm text-slate-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <p className="font-semibold">Something went wrong</p>
              <p className="mt-1 break-words">{error}</p>
            </div>

            <button
              onClick={fetchStudents}
              className="shrink-0 rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Student Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

          {/* Table Header */}
          <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <h2 className="font-bold text-slate-800">
                My Students
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Students from your assigned classes
              </p>
            </div>

            <span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
              {filteredStudents.length} Students
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw
                className="animate-spin text-blue-600"
                size={30}
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading students...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="rounded-2xl bg-slate-100 p-4">
                <Users size={35} className="text-slate-400" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-700">
                No students found
              </h3>

              <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400 sm:text-sm">
                {searchTerm
                  ? "Try another search term."
                  : "No students are assigned to your classes yet."}
              </p>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 rounded-lg bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Student
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Email
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Class
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Section
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Joined
                    </th>

                    <th className="px-5 py-4 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {student.profilePicture ? (
                            <img
                              src={student.profilePicture}
                              alt={student.name}
                              className="h-10 w-10 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                              <UserRound size={20} />
                            </div>
                          )}

                          <span className="font-semibold text-slate-700">
                            {student.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {student.email}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {student.classId?.className || "Not Assigned"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {student.classId?.section || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-5"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-base font-bold text-slate-800 sm:text-lg">
                  Student Details
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Student personal information
                </p>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">

              {/* Student Profile */}
              <div className="flex min-w-0 items-center gap-4 rounded-xl bg-blue-50/70 p-4">
                {selectedStudent.profilePicture ? (
                  <img
                    src={selectedStudent.profilePicture}
                    alt={selectedStudent.name}
                    className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-sm sm:h-16 sm:w-16"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 sm:h-16 sm:w-16">
                    <UserRound size={28} />
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold text-slate-800 sm:text-xl">
                    {selectedStudent.name}
                  </h3>

                  <p className="mt-1 text-xs font-medium text-blue-600">
                    Student
                  </p>
                </div>
              </div>

              {/* Student Information */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                <DetailCard
                  icon={<Mail size={18} />}
                  label="Email Address"
                  value={selectedStudent.email}
                />

                <DetailCard
                  icon={<MapPin size={18} />}
                  label="Address"
                  value={selectedStudent.address || "Not provided"}
                />

                <DetailCard
                  icon={<BookOpen size={18} />}
                  label="Class"
                  value={
                    selectedStudent.classId?.className || "Not assigned"
                  }
                />

                <DetailCard
                  icon={<GraduationCap size={18} />}
                  label="Section"
                  value={selectedStudent.classId?.section || "-"}
                />

                <DetailCard
                  icon={<CalendarDays size={18} />}
                  label="Academic Year"
                  value={selectedStudent.classId?.academicYear || "-"}
                />

                <DetailCard
                  icon={<CalendarDays size={18} />}
                  label="Joined Date"
                  value={
                    selectedStudent.createdAt
                      ? new Date(
                          selectedStudent.createdAt
                        ).toLocaleDateString()
                      : "-"
                  }
                />

              </div>

              {/* About Student */}
              {selectedStudent.bio && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    About Student
                  </p>

                  <p className="mt-2 break-words text-sm leading-6 text-slate-700">
                    {selectedStudent.bio}
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 sm:w-auto"
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

// Reusable detail card
const DetailCard = ({ icon, label, value }) => (
  <div className="min-w-0 rounded-xl border border-slate-100 bg-white p-3.5">
    <div className="flex items-center gap-2 text-blue-600">
      {icon}
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>
    </div>

    <p className="mt-2 break-words text-sm font-semibold text-slate-700">
      {value}
    </p>
  </div>
);

export default StudentManagement;

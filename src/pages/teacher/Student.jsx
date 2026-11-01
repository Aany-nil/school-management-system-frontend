
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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
              Student Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage students assigned to your classes.
            </p>
          </div>

          <button
            onClick={fetchStudents}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total My Students</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-800">
                  {students.length}
                </h2>
              </div>
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Users size={25} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Showing Results</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-800">
                  {filteredStudents.length}
                </h2>
              </div>
              <div className="rounded-xl bg-green-100 p-3 text-green-600">
                <GraduationCap size={25} />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email or class..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Student Table */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-800">
              My Students
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Students from your assigned classes
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <RefreshCw className="animate-spin text-blue-600" size={30} />
              <p className="mt-3 text-sm text-gray-500">
                Loading students...
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <Users size={40} className="text-gray-300" />
              <h3 className="mt-3 font-semibold text-gray-700">
                No students found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? "Try another search term."
                  : "No students are assigned to your classes yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Student</th>
                    <th className="px-5 py-4 font-semibold">Email</th>
                    <th className="px-5 py-4 font-semibold">Class</th>
                    <th className="px-5 py-4 font-semibold">Section</th>
                    <th className="px-5 py-4 font-semibold">Joined</th>
                    <th className="px-5 py-4 text-center font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {student.profilePicture ? (
                            <img
                              src={student.profilePicture}
                              alt={student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                              <UserRound size={20} />
                            </div>
                          )}

                          <span className="font-medium text-gray-800">
                            {student.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.email}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.classId?.className || "Not Assigned"}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.classId?.section || "-"}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-100"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedStudent(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800">
                Student Details
              </h2>

              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-4">
                {selectedStudent.profilePicture ? (
                  <img
                    src={selectedStudent.profilePicture}
                    alt={selectedStudent.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UserRound size={30} />
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-sm text-gray-500">Student</p>
                </div>
              </div>

              <div className="space-y-4">
                <DetailRow
                  icon={<Mail size={18} />}
                  label="Email"
                  value={selectedStudent.email}
                />

                <DetailRow
                  icon={<MapPin size={18} />}
                  label="Address"
                  value={selectedStudent.address || "Not provided"}
                />

                <DetailRow
                  icon={<BookOpen size={18} />}
                  label="Class"
                  value={selectedStudent.classId?.className || "Not assigned"}
                />

                <DetailRow
                  icon={<GraduationCap size={18} />}
                  label="Section"
                  value={selectedStudent.classId?.section || "-"}
                />

                <DetailRow
                  icon={<CalendarDays size={18} />}
                  label="Academic Year"
                  value={selectedStudent.classId?.academicYear || "-"}
                />

                <DetailRow
                  icon={<CalendarDays size={18} />}
                  label="Joined Date"
                  value={
                    selectedStudent.createdAt
                      ? new Date(selectedStudent.createdAt).toLocaleDateString()
                      : "-"
                  }
                />
              </div>

              {selectedStudent.bio && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    About Student
                  </p>
                  <p className="mt-2 text-sm text-gray-700">
                    {selectedStudent.bio}
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 p-5 text-right">
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
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

// Reusable detail row
const DetailRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-blue-600">{icon}</div>
    <div className="min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="break-words text-sm font-medium text-gray-800">
        {value}
      </p>
    </div>
  </div>
);

export default StudentManagement;

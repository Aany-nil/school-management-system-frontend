
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserRound,
  RefreshCw,
  X,
  Mail,
  CalendarDays,
} from "lucide-react";
import api from "../../services/api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch registered students from the database
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/students");

      if (response.data.success) {
        const studentList =
          response.data.data?.students ??
          response.data.data ??
          [];

        setStudents(Array.isArray(studentList) ? studentList : []);
      } else {
        setError(response.data.message || "Failed to load students.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load students. Please check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Search by student name or email
  const filteredStudents = students.filter((student) => {
    const name = student.name?.toLowerCase() || "";
    const email = student.email?.toLowerCase() || "";
    const query = search.toLowerCase().trim();

    return name.includes(query) || email.includes(query);
  });

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Student Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View and manage students who register for your school.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchStudents}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={17} />
          Refresh List
        </button>
      </div>

      {/* Total students */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
          <Users size={24} />
        </div>

        <div>
          <p className="text-sm text-slate-500">Total Registered Students</p>
          <h2 className="text-2xl font-bold text-slate-900">
            {students.length}
          </h2>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Search and table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name or email..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Registered</th>
                <th className="px-3 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-12 text-center text-sm text-slate-500"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id || student.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        {student.profilePicture ? (
                          <img
                            src={student.profilePicture}
                            alt={student.name || "Student"}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="rounded-full bg-blue-100 p-2.5 text-blue-700">
                            <UserRound size={18} />
                          </div>
                        )}

                        <span className="font-medium text-slate-900">
                          {student.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {student.email}
                    </td>

                    <td className="px-3 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Student
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {formatDate(student.createdAt)}
                    </td>

                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-12 text-center text-sm text-slate-500"
                  >
                    {search
                      ? "No students match your search."
                      : "No registered students found yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && (
          <p className="mt-4 text-sm text-slate-500">
            Showing {filteredStudents.length} of {students.length} students
          </p>
        )}
      </div>

      {/* Student details modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Student Details
              </h2>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center border-b border-slate-100 pb-6">
              {selectedStudent.profilePicture ? (
                <img
                  src={selectedStudent.profilePicture}
                  alt={selectedStudent.name || "Student"}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="rounded-full bg-blue-100 p-5 text-blue-700">
                  <UserRound size={30} />
                </div>
              )}

              <h3 className="mt-3 text-lg font-bold text-slate-900">
                {selectedStudent.name}
              </h3>

              <span className="mt-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Student
              </span>
            </div>

            <div className="space-y-4 py-5">
              <div className="flex items-start gap-3">
                <Mail size={19} className="mt-0.5 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Email Address</p>
                  <p className="break-all text-sm font-medium text-slate-800">
                    {selectedStudent.email}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays
                  size={19}
                  className="mt-0.5 text-slate-400"
                />
                <div>
                  <p className="text-xs text-slate-500">Registration Date</p>
                  <p className="text-sm font-medium text-slate-800">
                    {formatDate(selectedStudent.createdAt)}
                  </p>
                </div>
              </div>

              {selectedStudent.address && (
                <div>
                  <p className="text-xs text-slate-500">Address</p>
                  <p className="mt-1 text-sm text-slate-800">
                    {selectedStudent.address}
                  </p>
                </div>
              )}

              {selectedStudent.bio && (
                <div>
                  <p className="text-xs text-slate-500">Bio</p>
                  <p className="mt-1 text-sm text-slate-800">
                    {selectedStudent.bio}
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

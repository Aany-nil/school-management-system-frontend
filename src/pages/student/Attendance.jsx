
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  ClipboardCheck,
  TrendingUp,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Fetch Student Attendance
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/attendance/my-attendance");

      setAttendance(
        Array.isArray(response.data?.data)
          ? response.data.data
          : []
      );
    } catch (err) {
      console.error("Attendance fetch error:", err);

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to load attendance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Attendance Summary
  const totalClasses = attendance.length;

  const presentCount = attendance.filter(
    (item) => item.status === "Present"
  ).length;

  const absentCount = attendance.filter(
    (item) => item.status === "Absent"
  ).length;

  const lateCount = attendance.filter(
    (item) => item.status === "Late"
  ).length;

  const attendancePercentage =
    totalClasses > 0
      ? Math.round((presentCount / totalClasses) * 100)
      : 0;

  // Filter Attendance
  const filteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      const className = item.classId?.className || "";
      const section = item.classId?.section || "";
      const academicYear = item.classId?.academicYear || "";

      const searchText = search.toLowerCase();

      const matchesSearch =
        className.toLowerCase().includes(searchText) ||
        section.toLowerCase().includes(searchText) ||
        academicYear.toString().toLowerCase().includes(searchText) ||
        (item.remarks || "").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [attendance, search, statusFilter]);

  // Date Formatting
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Status Badge
  const getStatusStyle = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-700";

      case "Absent":
        return "bg-red-100 text-red-700";

      case "Late":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Summary Card
  const summaryCards = [
    {
      title: "Total Classes",
      value: totalClasses,
      icon: CalendarDays,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Present",
      value: presentCount,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Absent",
      value: absentCount,
      icon: XCircle,
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Late",
      value: lateCount,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            My Attendance
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Track your daily class attendance and attendance records.
          </p>
        </div>

        <button
          onClick={fetchAttendance}
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
              Loading attendance...
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

                      <h2 className="mt-2 text-3xl font-bold text-gray-800">
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

          {/* Attendance Percentage */}
          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                  <TrendingUp size={23} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-800">
                    Attendance Overview
                  </h2>

                  <p className="text-sm text-gray-500">
                    Your overall attendance percentage
                  </p>
                </div>
              </div>

              <h2 className="text-3xl font-bold text-blue-600">
                {attendancePercentage}%
              </h2>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-gray-500">
              You attended {presentCount} out of {totalClasses} recorded classes.
            </p>
          </div>

          {/* Attendance History */}
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

            {/* Table Header */}
            <div className="border-b border-gray-100 p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Attendance History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    View your complete attendance records.
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
                      placeholder="Search class..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 sm:w-52"
                    />
                  </div>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="All">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      #
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Date
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Class
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Section
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Academic Year
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase text-gray-500">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredAttendance.length > 0 ? (
                    filteredAttendance.map((item, index) => (
                      <tr
                        key={item._id || index}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {index + 1}
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          {formatDate(item.date)}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {item.classId?.className || "N/A"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.classId?.section || "N/A"}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.classId?.academicYear || "N/A"}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.remarks || "—"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center">
                        <ClipboardCheck
                          size={38}
                          className="mx-auto text-gray-300"
                        />

                        <p className="mt-3 font-medium text-gray-600">
                          No attendance records found
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          Try changing your search or filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="border-t border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-500">
                Showing {filteredAttendance.length} of {totalClasses} records
              </p>
            </div>
          </div>

          {/* Empty State */}
          {totalClasses === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
              <BookOpen
                size={35}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-3 font-semibold text-gray-700">
                No Attendance Yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Your attendance records will appear here once your teacher marks attendance.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Attendance;

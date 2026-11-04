
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  AlertCircle,
  ClipboardList,
  Filter,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Fetch Attendance
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/attendance/my-attendance");

      const result =
        response.data?.data ||
        response.data?.attendance ||
        [];

      setAttendance(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load attendance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  // Attendance Statistics
  const total = attendance.length;

  const present = attendance.filter(
    (item) => item.status === "Present"
  ).length;

  const absent = attendance.filter(
    (item) => item.status === "Absent"
  ).length;

  const late = attendance.filter(
    (item) => item.status === "Late"
  ).length;

  const percentage =
    total > 0 ? Math.round((present / total) * 100) : 0;

  // Search and Status Filter
  const filteredAttendance = useMemo(() => {
    return attendance.filter((item) => {
      const className =
        item.classId?.className ||
        item.classId?.name ||
        item.className ||
        "";

      const section =
        item.classId?.section ||
        item.section ||
        "";

      const academicYear =
        item.classId?.academicYear ||
        item.academicYear ||
        "";

      const remarks = item.remarks || "";

      const searchText = search.toLowerCase();

      const matchesSearch = [
        className,
        section,
        academicYear,
        remarks,
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(searchText);

      const matchesStatus =
        statusFilter === "All" ||
        item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [attendance, search, statusFilter]);

  // Date Format
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Status Design
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

  // Summary Cards
  const summaryCards = [
    {
      title: "Total Classes",
      value: total,
      icon: ClipboardList,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Present",
      value: present,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Absent",
      value: absent,
      icon: XCircle,
      color: "bg-red-100 text-red-600",
    },
    {
      title: "Late",
      value: late,
      icon: Clock,
      color: "bg-yellow-100 text-yellow-600",
    },
  ];

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-7">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl">
              My Attendance
            </h1>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Track your attendance records and class participation.
            </p>
          </div>

          <button
            onClick={fetchAttendance}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700 sm:p-4">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <p className="break-words text-sm">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={index}
                className="min-w-0 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition hover:shadow-md sm:p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 sm:text-sm">
                      {card.title}
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
                      {loading ? "—" : card.value}
                    </h2>
                  </div>

                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 ${card.color}`}
                  >
                    <Icon size={19} className="sm:hidden" />
                    <Icon size={23} className="hidden sm:block" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Attendance Overview */}
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
              <TrendingUp size={21} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
                Attendance Overview
              </h2>

              <p className="text-xs text-gray-500 sm:text-sm">
                Your overall attendance performance
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-center">

            {/* Attendance Percentage */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Attendance Percentage
                </span>

                <span className="text-xl font-bold text-blue-600 sm:text-2xl">
                  {loading ? "—" : `${percentage}%`}
                </span>
              </div>

              <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
                  style={{
                    width: `${loading ? 0 : percentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Based on your present attendance records.
              </p>
            </div>

            {/* Present, Absent and Late */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-lg bg-green-50 p-3">
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle2 size={15} />
                  <p className="text-xs font-medium">Present</p>
                </div>

                <h3 className="mt-2 text-xl font-bold text-green-700 sm:text-2xl">
                  {loading ? "—" : present}
                </h3>
              </div>

              <div className="min-w-0 rounded-lg bg-red-50 p-3">
                <div className="flex items-center gap-1 text-red-700">
                  <XCircle size={15} />
                  <p className="text-xs font-medium">Absent</p>
                </div>

                <h3 className="mt-2 text-xl font-bold text-red-700 sm:text-2xl">
                  {loading ? "—" : absent}
                </h3>
              </div>

              <div className="min-w-0 rounded-lg bg-yellow-50 p-3">
                <div className="flex items-center gap-1 text-yellow-700">
                  <Clock size={15} />
                  <p className="text-xs font-medium">Late</p>
                </div>

                <h3 className="mt-2 text-xl font-bold text-yellow-700 sm:text-2xl">
                  {loading ? "—" : late}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance History */}
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

          {/* Section Header */}
          <div className="border-b border-gray-100 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
                  Attendance History
                </h2>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  View and search your previous attendance records.
                </p>
              </div>

              {/* Search and Filter */}
              <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                <div className="relative w-full sm:flex-1 lg:w-64">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    placeholder="Search attendance..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="relative w-full sm:w-44">
                  <Filter
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="All">All Status</option>
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[750px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">SL</th>
                  <th className="px-5 py-4 font-semibold">Date</th>
                  <th className="px-5 py-4 font-semibold">Class</th>
                  <th className="px-5 py-4 font-semibold">Section</th>
                  <th className="px-5 py-4 font-semibold">Academic Year</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Remarks</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-12 text-center text-gray-500"
                    >
                      Loading attendance records...
                    </td>
                  </tr>
                ) : filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-3 rounded-full bg-gray-100 p-4 text-gray-400">
                          <CalendarDays size={28} />
                        </div>

                        <h3 className="font-semibold text-gray-700">
                          No Attendance Found
                        </h3>

                        <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                          No attendance records match your search.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((item, index) => {
                    const className =
                      item.classId?.className ||
                      item.classId?.name ||
                      item.className ||
                      "N/A";

                    const section =
                      item.classId?.section ||
                      item.section ||
                      "N/A";

                    const academicYear =
                      item.classId?.academicYear ||
                      item.academicYear ||
                      "N/A";

                    return (
                      <tr
                        key={item._id || index}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 text-gray-600">
                          {index + 1}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-700">
                          {formatDate(item.date)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {className}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {section}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {academicYear}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="max-w-xs px-5 py-4 text-gray-500">
                          <span className="block truncate">
                            {item.remarks || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          {!loading && filteredAttendance.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p>
                Showing {filteredAttendance.length} of {total} records
              </p>

              <p>
                Attendance:{" "}
                <span className="font-semibold text-blue-600">
                  {percentage}%
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;


import { useEffect, useState } from "react";
import {
  CalendarDays,
  Search,
  Clock,
  BookOpen,
  User,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  CalendarCheck,
  Filter,
} from "lucide-react";

import api from "../../services/api";

const DAYS = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

const RoutineManagement = () => {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("all");

  // Fetch Routines
  const fetchRoutines = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/routine/all");
      const routineData = response.data?.data;

      setRoutines(Array.isArray(routineData) ? routineData : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load routine."
      );
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  // Format Day
  const normalizeDay = (day) =>
    String(day || "").trim().toLowerCase();

  const formatDay = (day) => {
    const normalized = normalizeDay(day);

    if (!normalized) return "N/A";

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  // Filter Routines
  const filteredRoutines = routines.filter((routine) => {
    const searchText = search.toLowerCase().trim();

    const className = routine.classId?.className || "";
    const section = routine.classId?.section || "";
    const subject = routine.subjectId?.subjectName || "";
    const subjectCode = routine.subjectId?.subjectCode || "";
    const teacher = routine.teacherId?.name || "";

    const matchesSearch = [
      className,
      section,
      subject,
      subjectCode,
      teacher,
    ].some((value) =>
      String(value).toLowerCase().includes(searchText)
    );

    const matchesDay =
      selectedDay === "all" ||
      normalizeDay(routine.day) === selectedDay;

    return matchesSearch && matchesDay;
  });

  // Summary Calculations
  const totalClasses = new Set(
    routines.map((item) => item.classId?._id).filter(Boolean)
  ).size;

  const totalSubjects = new Set(
    routines.map((item) => item.subjectId?._id).filter(Boolean)
  ).size;

  const totalTeachers = new Set(
    routines.map((item) => item.teacherId?._id).filter(Boolean)
  ).size;

  const summaryCards = [
    {
      title: "Total Classes",
      value: totalClasses,
      icon: CalendarDays,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      border: "border-blue-100",
    },
    {
      title: "Total Subjects",
      value: totalSubjects,
      icon: BookOpen,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      border: "border-emerald-100",
    },
    {
      title: "Total Teachers",
      value: totalTeachers,
      icon: GraduationCap,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-600",
      border: "border-purple-100",
    },
  ];

  return (
    <div className="min-h-screen w-full min-w-0 space-y-5 bg-gray-50 p-3 sm:space-y-6 sm:p-5 lg:p-8">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="shrink-0 rounded-xl bg-blue-100 p-2.5 text-blue-600">
            <CalendarCheck size={23} />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl lg:text-3xl">
              Class Routine
            </h1>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Manage and view weekly class schedules.
            </p>
          </div>
        </div>

        {/* Blue Refresh Button - Same as Original */}
        <button
          onClick={fetchRoutines}
          disabled={loading}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className={`min-w-0 rounded-2xl border ${card.border} bg-white p-3 shadow-sm transition hover:shadow-md sm:p-5 ${
                card.title === "Total Teachers"
                  ? "col-span-2 lg:col-span-1"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 sm:text-sm">
                    {card.title}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
                    {card.value}
                  </h2>

                  <p className="mt-1 hidden text-xs text-gray-400 sm:block">
                    Based on available routines
                  </p>
                </div>

                <div
                  className={`shrink-0 rounded-xl ${card.iconBg} ${card.iconColor} p-2.5 sm:p-3`}
                >
                  <Icon size={21} className="sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Schedule */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
            <CalendarDays size={19} />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-800 sm:text-lg">
              Weekly Schedule
            </h2>

            <p className="text-xs text-gray-500">
              Select a day to view its routine.
            </p>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">All Days</option>

            {DAYS.map((day) => (
              <option key={day} value={day}>
                {formatDay(day)}
              </option>
            ))}
          </select>
        </div>

        {/* Tablet and Desktop Buttons */}
        <div className="hidden flex-wrap gap-2 sm:flex">
          <button
            onClick={() => setSelectedDay("all")}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              selectedDay === "all"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
            }`}
          >
            All Days
          </button>

          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                selectedDay === day
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600"
            }`}
            >
              {formatDay(day)}
            </button>
          ))}
        </div>
      </div>

      {/* Routine List */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        {/* Routine Header */}
        <div className="flex flex-col gap-4 border-b border-gray-100 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 sm:text-lg">
              My Weekly Routine
            </h2>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              {filteredRoutines.length} class schedule(s) found
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full lg:w-80 lg:shrink-0">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search subject, teacher or class..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Filter Information */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
            <Filter size={15} />
            Showing:

            <span className="font-semibold text-blue-600">
              {selectedDay === "all" ? "All Days" : formatDay(selectedDay)}
            </span>
          </div>

          {(search || selectedDay !== "all") && (
            <button
              onClick={() => {
                setSearch("");
                setSelectedDay("all");
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <RefreshCw className="animate-spin text-blue-600" size={30} />

            <p className="text-sm font-medium text-gray-500">
              Loading routine...
            </p>
          </div>
        ) : error ? (
          /* Error */
          <div className="p-6 text-center sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={30} />
            </div>

            <p className="mt-3 break-words text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={fetchRoutines}
              disabled={loading}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              Try Again
            </button>
          </div>
        ) : filteredRoutines.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <CalendarDays size={32} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-700">
              No Routine Found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Your class routine is not available yet or no routine
              matches your selected filters. Please contact the Admin
              if you have not been assigned a class.
            </p>
          </div>
        ) : (
          /* Routine Table */
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    SL
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Day
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Subject
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Teacher
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Class
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-semibold">
                    Time
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRoutines.map((routine, index) => (
                  <tr
                    key={routine._id}
                    className="transition hover:bg-blue-50/40"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700">
                        {formatDay(routine.day)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600">
                          <BookOpen size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800">
                            {routine.subjectId?.subjectName || "N/A"}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-500">
                            {routine.subjectId?.subjectCode || "No code"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="rounded-full bg-purple-50 p-1.5 text-purple-600">
                          <User size={15} />
                        </div>

                        {routine.teacherId?.name || "N/A"}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-gray-700">
                      {routine.classId?.className || "N/A"}

                      {routine.classId?.section && (
                        <span className="ml-1 text-xs font-normal text-gray-500">
                          ({routine.classId.section})
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
                        <Clock size={15} className="text-blue-500" />
                        {routine.startTime} - {routine.endTime}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && !error && filteredRoutines.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p>
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredRoutines.length}
              </span>{" "}
              routine records
            </p>

            <p>
              Total available routines:{" "}
              <span className="font-semibold text-gray-700">
                {routines.length}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineManagement;

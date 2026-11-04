
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

  const normalizeDay = (day) =>
    String(day || "").trim().toLowerCase();

  const formatDay = (day) => {
    const normalized = normalizeDay(day);

    if (!normalized) return "N/A";

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const filteredRoutines = routines.filter((routine) => {
    const searchText = search.toLowerCase();

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

  const totalClasses = new Set(
    routines.map((item) => item.classId?._id).filter(Boolean)
  ).size;

  const totalSubjects = new Set(
    routines.map((item) => item.subjectId?._id).filter(Boolean)
  ).size;

  const totalTeachers = new Set(
    routines.map((item) => item.teacherId?._id).filter(Boolean)
  ).size;

  return (
    <div className="w-full min-w-0 space-y-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            Class Routine
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View your assigned class weekly schedule.
          </p>
        </div>

        <button
          onClick={fetchRoutines}
          disabled={loading}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">My Class</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {totalClasses}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-blue-100 p-3 text-blue-600">
              <CalendarDays size={24} />
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Total Subjects</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {totalSubjects}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-green-100 p-3 text-green-600">
              <BookOpen size={24} />
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Total Teachers</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {totalTeachers}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-purple-100 p-3 text-purple-600">
              <GraduationCap size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Weekly Schedule */}
      <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">

        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Weekly Schedule
        </h2>

        {/* Mobile Dropdown */}
        <div className="sm:hidden">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none focus:border-blue-500"
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
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              selectedDay === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Days
          </button>

          {DAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                selectedDay === day
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            <h2 className="text-lg font-semibold text-gray-800">
              My Weekly Routine
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredRoutines.length} class schedule(s) found
            </p>
          </div>

          <div className="relative w-full lg:w-72 lg:shrink-0">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search subject or teacher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw
              className="animate-spin text-blue-600"
              size={32}
            />
          </div>

        ) : error ? (
          /* Error */
          <div className="p-6 text-center sm:p-10">
            <AlertCircle
              className="mx-auto text-red-500"
              size={40}
            />

            <p className="mt-3 break-words text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={fetchRoutines}
              className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>

        ) : filteredRoutines.length === 0 ? (
          /* Empty State */
          <div className="p-8 text-center sm:p-12">
            <CalendarDays
              className="mx-auto text-gray-300"
              size={45}
            />

            <h3 className="mt-3 font-semibold text-gray-700">
              No Routine Found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              Your class routine is not available yet. If you have
              not been assigned a class, please contact the Admin.
            </p>
          </div>

        ) : (
          /* Routine Table */
          <div className="w-full overflow-x-auto">

            <table className="w-full min-w-[750px] text-left">

              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4">SL</th>
                  <th className="whitespace-nowrap px-5 py-4">Day</th>
                  <th className="whitespace-nowrap px-5 py-4">Subject</th>
                  <th className="whitespace-nowrap px-5 py-4">Teacher</th>
                  <th className="whitespace-nowrap px-5 py-4">Class</th>
                  <th className="whitespace-nowrap px-5 py-4">Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {filteredRoutines.map((routine, index) => (
                  <tr
                    key={routine._id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                      {index + 1}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold capitalize text-blue-700">
                        {formatDay(routine.day)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <BookOpen
                          size={17}
                          className="shrink-0 text-blue-500"
                        />

                        <div className="min-w-0">
                          <p className="font-medium text-gray-800">
                            {routine.subjectId?.subjectName || "N/A"}
                          </p>

                          <p className="text-xs text-gray-500">
                            {routine.subjectId?.subjectCode || ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User
                          size={16}
                          className="shrink-0 text-gray-400"
                        />
                        {routine.teacherId?.name || "N/A"}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                      {routine.classId?.className || "N/A"}

                      <span className="ml-1 text-xs text-gray-500">
                        {routine.classId?.section || ""}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock size={16} className="shrink-0" />
                        {routine.startTime} - {routine.endTime}
                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default RoutineManagement;

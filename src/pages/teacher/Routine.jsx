import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import {
  CalendarDays,
  Clock,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react";

const days = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

const getRoutineArray = (response) => {
  const result = response?.data;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;

  return [];
};

const normalizeDay = (day) => {
  if (!day) return "";

  const formatted = String(day).trim().toLowerCase();

  return (
    days.find((item) => item.toLowerCase() === formatted) || ""
  );
};

const RoutineSystem = () => {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");

  const fetchMyRoutine = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/routine/my-routine");

      const routineData = getRoutineArray(response);

      setRoutines(routineData);
    } catch (err) {
      console.error("Routine fetch error:", err);

      setRoutines([]);
      setError(
        err.response?.data?.message ||
          "Failed to load routine. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRoutine();
  }, []);

  const filteredRoutines = useMemo(() => {
    return routines.filter((routine) => {
      const subjectName =
        routine.subjectId?.subjectName || "";

      const className =
        routine.classId?.className || "";

      const section =
        routine.classId?.section || "";

      const matchesSearch = [
        subjectName,
        className,
        section,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const routineDay = normalizeDay(routine.day);

      const matchesDay =
        selectedDay === "All" || routineDay === selectedDay;

      return matchesSearch && matchesDay;
    });
  }, [routines, search, selectedDay]);

  const getDayRoutines = (day) => {
    return filteredRoutines
      .filter((routine) => normalizeDay(routine.day) === day)
      .sort((a, b) =>
        (a.startTime || "").localeCompare(b.startTime || "")
      );
  };

  const formatTime = (time) => {
    if (!time) return "N/A";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(new Date());

  const totalSubjects = new Set(
    routines
      .map((routine) => routine.subjectId?._id)
      .filter(Boolean)
  ).size;

  const todayClasses = routines.filter(
    (routine) => normalizeDay(routine.day) === today
  ).length;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-500">
            Loading your routine...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            My Class Routine
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View your weekly teaching schedule.
          </p>
        </div>

        <button
          onClick={fetchMyRoutine}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Classes
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {routines.length}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <CalendarDays size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Subjects
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {totalSubjects}
              </h2>
            </div>

            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <BookOpen size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Today's Classes
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {todayClasses}
              </h2>
            </div>

            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <Clock size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            placeholder="Search subject or class..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="All">All Days</option>

          {days.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly Routine */}
      <div className="space-y-5">
        {days.map((day) => {
          const dayRoutines = getDayRoutines(day);

          if (dayRoutines.length === 0) return null;

          return (
            <div
              key={day}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-5 py-4">
                <div className="flex items-center gap-2">
                  <CalendarDays
                    size={19}
                    className="text-blue-600"
                  />

                  <h2 className="font-semibold text-gray-800">
                    {day}
                  </h2>

                  {day === today && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Today
                    </span>
                  )}
                </div>

                <span className="text-xs text-gray-500">
                  {dayRoutines.length}{" "}
                  {dayRoutines.length === 1 ? "Class" : "Classes"}
                </span>
              </div>

              <div className="divide-y divide-gray-100">
                {dayRoutines.map((routine) => (
                  <div
                    key={routine._id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-blue-50/40 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-[150px] items-center gap-2 text-sm font-medium text-blue-700">
                      <Clock size={17} />

                      <span>
                        {formatTime(routine.startTime)}
                        {" - "}
                        {formatTime(routine.endTime)}
                      </span>
                    </div>

                    <div className="flex flex-1 items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                        <BookOpen size={21} />
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {routine.subjectId?.subjectName ||
                            "Subject not available"}
                        </h3>

                        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                          <GraduationCap size={15} />

                          {routine.classId?.className || "Class"}

                          {routine.classId?.section
                            ? ` - Section ${routine.classId.section}`
                            : ""}
                        </p>

                        {routine.subjectId?.subjectCode && (
                          <p className="mt-1 text-xs text-gray-400">
                            Subject Code:{" "}
                            {routine.subjectId.subjectCode}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredRoutines.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
            <CalendarDays
              size={42}
              className="mx-auto mb-3 text-gray-300"
            />

            <h3 className="font-semibold text-gray-700">
              No Routine Found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              No routine is available for the selected day or search.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutineSystem;
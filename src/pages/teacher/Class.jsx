
import React, { useEffect, useMemo, useState } from "react";
import {
    BookOpen,
    Users,
    Search,
    RefreshCw,
    GraduationCap,
    CalendarDays,
    Eye,
    X,
    Layers,
    ArrowUpRight,
    School,
    Filter,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import api from "../../services/api";

const ITEMS_PER_PAGE = 6;

const Class = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState(null);

    const [selectedSection, setSelectedSection] = useState("all");
    const [selectedYear, setSelectedYear] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch teacher's assigned classes
    const fetchMyClasses = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/teacher/my-classes");

            if (response.data.success) {
                setClasses(response.data.data || []);
            } else {
                setError(response.data.message || "Failed to load classes.");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Something went wrong while loading classes."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyClasses();
    }, []);

    // Available filter options
    const sections = useMemo(() => {
        return [
            ...new Set(
                classes
                    .map((item) => item.section)
                    .filter(Boolean)
            ),
        ].sort();
    }, [classes]);

    const academicYears = useMemo(() => {
        return [
            ...new Set(
                classes
                    .map((item) => String(item.academicYear || ""))
                    .filter(Boolean)
            ),
        ].sort((a, b) => b.localeCompare(a));
    }, [classes]);

    // Search and filter classes
    const filteredClasses = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return classes.filter((item) => {
            const matchesSearch =
                item.className?.toLowerCase().includes(search) ||
                item.section?.toLowerCase().includes(search) ||
                String(item.academicYear || "").toLowerCase().includes(search);

            const matchesSection =
                selectedSection === "all" ||
                item.section === selectedSection;

            const matchesYear =
                selectedYear === "all" ||
                String(item.academicYear || "") === selectedYear;

            return matchesSearch && matchesSection && matchesYear;
        });
    }, [classes, searchTerm, selectedSection, selectedYear]);

    // Reset page when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSection, selectedYear]);

    const totalStudents = classes.reduce(
        (total, item) => total + (Number(item.studentCount) || 0),
        0
    );

    // Pagination
    const totalPages = Math.ceil(filteredClasses.length / ITEMS_PER_PAGE);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    const currentClasses = filteredClasses.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    const showingFrom = filteredClasses.length === 0 ? 0 : startIndex + 1;

    const showingTo = Math.min(
        startIndex + ITEMS_PER_PAGE,
        filteredClasses.length
    );

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedSection("all");
        setSelectedYear("all");
        setCurrentPage(1);
    };

    const hasActiveFilters =
        searchTerm.trim() !== "" ||
        selectedSection !== "all" ||
        selectedYear !== "all";

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* Page Header */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                        <School size={16} />
                        <span>Teacher Dashboard</span>
                        <span>/</span>
                        <span className="font-medium text-blue-600">
                            My Classes
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        My Classes
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        View information about your assigned classes.
                    </p>
                </div>

                <button
                    onClick={fetchMyClasses}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="mb-7 grid grid-cols-2 gap-3 sm:gap-5">

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                Total Assigned Classes
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">
                                {loading ? "—" : classes.length}
                            </h2>

                            <p className="mt-1 text-xs text-slate-400">
                                Assigned to you
                            </p>
                        </div>

                        <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600 sm:p-3.5">
                            <BookOpen size={22} className="sm:h-6 sm:w-6" />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                Total Students
                            </p>

                            <h2 className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">
                                {loading ? "—" : totalStudents}
                            </h2>

                            <p className="mt-1 text-xs text-slate-400">
                                In your classes
                            </p>
                        </div>

                        <div className="shrink-0 rounded-xl bg-emerald-50 p-2.5 text-emerald-600 sm:p-3.5">
                            <Users size={22} className="sm:h-6 sm:w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Assigned Classes Section */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* Section Header */}
                <div className="border-b border-slate-100 p-4 sm:p-5">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Assigned Classes
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage and view all classes assigned to your account.
                            </p>
                        </div>

                        <div className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                            <BookOpen size={15} />
                            {classes.length} Assigned
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

                        {/* Search */}
                        <div className="relative sm:col-span-2 xl:col-span-2">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search class, section or year..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            />
                        </div>

                        {/* Section Filter */}
                        <div className="relative">
                            <Filter
                                size={16}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            >
                                <option value="all">All Sections</option>

                                {sections.map((section) => (
                                    <option key={section} value={section}>
                                        Section {section}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Academic Year Filter */}
                        <div className="relative">
                            <CalendarDays
                                size={16}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            >
                                <option value="all">All Academic Years</option>

                                {academicYears.map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Filter Information */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-slate-500">
                            Showing{" "}
                            <span className="font-semibold text-slate-700">
                                {filteredClasses.length}
                            </span>{" "}
                            matching classes
                        </p>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="text-xs font-semibold text-blue-600 transition hover:text-blue-800"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="m-4 flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 sm:m-5 sm:flex-row sm:items-center">
                        <p className="text-sm text-red-600">{error}</p>

                        <button
                            onClick={fetchMyClasses}
                            className="shrink-0 text-sm font-semibold text-red-700 transition hover:text-red-900"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <RefreshCw
                            size={30}
                            className="animate-spin text-blue-600"
                        />

                        <p className="mt-3 text-sm text-slate-500">
                            Loading your classes...
                        </p>
                    </div>
                ) : filteredClasses.length === 0 ? (
                    <div className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                            <GraduationCap size={32} />
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-slate-800">
                            {hasActiveFilters
                                ? "No Classes Found"
                                : "No Classes Assigned Yet"}
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                            {hasActiveFilters
                                ? "Try changing your search or filters to find your assigned classes."
                                : "Your assigned classes will appear here once the administrator assigns them to you."}
                        </p>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-4 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Class Cards */}
                        <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5 2xl:grid-cols-3">

                            {currentClasses.map((item) => (
                                <div
                                    key={item._id}
                                    className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                                >
                                    {/* Card Header */}
                                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 px-5 py-5 sm:py-6">

                                        <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.08]" />

                                        <div className="pointer-events-none absolute -bottom-16 right-20 h-32 w-32 rounded-full bg-white/[0.08]" />

                                        <div className="relative flex items-center justify-between gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white shadow-sm">
                                                <GraduationCap size={24} />
                                            </div>

                                            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white">
                                                Assigned
                                            </span>
                                        </div>

                                        <div className="relative mt-5">
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-blue-100">
                                                Class Information
                                            </p>

                                            <h3 className="mt-1.5 break-words text-2xl font-bold leading-tight text-white sm:text-[26px]">
                                                {item.className}
                                            </h3>

                                            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-blue-50">
                                                <Layers size={14} />
                                                Section {item.section || "N/A"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="flex flex-1 flex-col p-4 sm:p-5">

                                        <div className="grid grid-cols-2 gap-3">

                                            <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4">
                                                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                                    <CalendarDays size={16} />
                                                </div>

                                                <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
                                                    Academic Year
                                                </p>

                                                <p className="mt-1 break-words text-base font-bold text-slate-800 sm:text-lg">
                                                    {item.academicYear || "N/A"}
                                                </p>
                                            </div>

                                            <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4">
                                                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                                    <Users size={16} />
                                                </div>

                                                <p className="text-[11px] font-medium text-slate-500 sm:text-xs">
                                                    Total Students
                                                </p>

                                                <p className="mt-1 text-base font-bold text-slate-800 sm:text-lg">
                                                    {item.studentCount || 0}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />

                                            <span className="text-xs font-semibold text-emerald-700">
                                                Active Assignment
                                            </span>

                                            <span className="ml-auto text-[10px] font-medium text-emerald-600">
                                                Assigned
                                            </span>
                                        </div>

                                        <div className="mt-auto pt-4">
                                            <button
                                                onClick={() => setSelectedClass(item)}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-blue-700"
                                            >
                                                <Eye size={17} />
                                                View Class Details
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

                                <p className="text-xs text-slate-500">
                                    Showing{" "}
                                    <span className="font-semibold text-slate-700">
                                        {showingFrom}-{showingTo}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold text-slate-700">
                                        {filteredClasses.length}
                                    </span>{" "}
                                    classes
                                </p>

                                <div className="flex items-center justify-between gap-2 sm:justify-end">
                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                                    >
                                        <ChevronLeft size={16} />
                                        Previous
                                    </button>

                                    <span className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white">
                                        {currentPage} / {totalPages}
                                    </span>

                                    <button
                                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-600"
                                    >
                                        Next
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Results Footer */}
                        {totalPages <= 1 && (
                            <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                                <p className="text-xs text-slate-500">
                                    Showing{" "}
                                    <span className="font-semibold text-slate-700">
                                        {filteredClasses.length}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-semibold text-slate-700">
                                        {classes.length}
                                    </span>{" "}
                                    assigned classes
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Class Details Modal */}
            {selectedClass && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4"
                    onClick={() => setSelectedClass(null)}
                >
                    <div
                        className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-white sm:px-6 sm:py-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="shrink-0 rounded-xl bg-white/20 p-2.5">
                                    <BookOpen size={23} />
                                </div>

                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold">
                                        Class Details
                                    </h2>

                                    <p className="text-xs text-blue-100">
                                        Assigned class information
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedClass(null)}
                                className="shrink-0 rounded-lg p-2 transition hover:bg-white/20"
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">

                            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-blue-500">
                                    Class Name
                                </p>

                                <h3 className="mt-1 break-words text-xl font-bold text-slate-800">
                                    {selectedClass.className}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                <div className="rounded-xl border border-slate-100 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                                        <Layers size={16} />
                                        <span className="text-xs">Section</span>
                                    </div>

                                    <p className="break-words font-semibold text-slate-800">
                                        {selectedClass.section || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 p-4">
                                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                                        <CalendarDays size={16} />
                                        <span className="text-xs">Academic Year</span>
                                    </div>

                                    <p className="break-words font-semibold text-slate-800">
                                        {selectedClass.academicYear || "N/A"}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-slate-100 p-4 sm:col-span-2">
                                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                                        <Users size={16} />
                                        <span className="text-xs">Total Students</span>
                                    </div>

                                    <p className="font-semibold text-slate-800">
                                        {selectedClass.studentCount || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

                                    <p className="text-sm font-semibold text-emerald-700">
                                        Active Assignment
                                    </p>
                                </div>

                                <p className="mt-1 text-xs text-emerald-600">
                                    This class is currently assigned to your account.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-4">
                            <button
                                onClick={() => setSelectedClass(null)}
                                className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
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

export default Class;


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
    RefreshCw,
    School,
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

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* Page Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                            <School size={16} />
                            <span>Teacher Dashboard</span>
                            <span>/</span>
                            <span className="font-medium text-blue-600">
                                My Subjects
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                            My Subjects
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            View all subjects assigned to your classes.
                        </p>
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchData}
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

                {/* Error Message */}
                {error && (
                    <div className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center">
                        <p className="text-sm text-red-600">{error}</p>

                        <button
                            onClick={fetchData}
                            className="shrink-0 text-sm font-semibold text-red-700 transition hover:text-red-900"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-5">

                    {/* Total Subjects */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                    Total Subjects
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">
                                    {loading ? "—" : subjects.length}
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    Subjects assigned to you
                                </p>
                            </div>

                            <div className="shrink-0 rounded-xl bg-blue-50 p-2.5 text-blue-600 sm:p-3.5">
                                <BookOpen size={22} className="sm:h-6 sm:w-6" />
                            </div>
                        </div>
                    </div>

                    {/* Assigned Classes */}
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md sm:p-5">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                    Assigned Classes
                                </p>

                                <h2 className="mt-2 text-2xl font-bold text-slate-800 sm:text-3xl">
                                    {loading ? "—" : classes.length}
                                </h2>

                                <p className="mt-1 text-xs text-slate-400">
                                    Classes assigned to you
                                </p>
                            </div>

                            <div className="shrink-0 rounded-xl bg-violet-50 p-2.5 text-violet-600 sm:p-3.5">
                                <Layers size={22} className="sm:h-6 sm:w-6" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search Section */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-3">
                        <h2 className="text-base font-bold text-slate-800">
                            Search Subjects
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Search by subject name, code or class.
                        </p>
                    </div>

                    <div className="relative">
                        <Search
                            size={19}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by subject name, code or class..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />

                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                                aria-label="Clear search"
                            >
                                <X size={17} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Class-wise Subject Lists */}
                <div className="space-y-5">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-20">
                            <RefreshCw
                                size={30}
                                className="animate-spin text-blue-600"
                            />

                            <p className="mt-3 text-sm font-medium text-slate-500">
                                Loading your subjects...
                            </p>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                                <GraduationCap size={34} />
                            </div>

                            <h3 className="mt-4 font-semibold text-slate-800">
                                No Classes Assigned
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                You have not been assigned to any class yet.
                            </p>
                        </div>
                    ) : (
                        classes.map((classItem) => {
                            const classSubjects = getClassSubjects(classItem._id);
                            const isExpanded = expandedClasses[classItem._id];

                            // Hide classes without matching subjects during search
                            if (searchTerm && classSubjects.length === 0) {
                                return null;
                            }

                            return (
                                <div
                                    key={classItem._id}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:border-blue-200 hover:shadow-md"
                                >
                                    {/* Class Header */}
                                    <button
                                        onClick={() => toggleClass(classItem._id)}
                                        className="flex w-full items-center justify-between gap-3 p-4 text-left transition hover:bg-blue-50/40 sm:p-5"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                <GraduationCap size={23} />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="break-words text-sm font-bold text-slate-800 sm:text-base">
                                                    {classItem.className || "Class"}
                                                    {classItem.section
                                                        ? ` - ${classItem.section}`
                                                        : ""}
                                                </h3>

                                                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                                    <CalendarDays size={13} />
                                                    Academic Year:{" "}
                                                    {classItem.academicYear || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                                            <span className="rounded-full bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 sm:px-3 sm:text-xs">
                                                {classSubjects.length} Subjects
                                            </span>

                                            <div className="rounded-lg bg-slate-100 p-1.5 text-slate-500">
                                                {isExpanded ? (
                                                    <ChevronUp size={18} />
                                                ) : (
                                                    <ChevronDown size={18} />
                                                )}
                                            </div>
                                        </div>
                                    </button>

                                    {/* Subject List */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100">

                                            {classSubjects.length === 0 ? (
                                                <div className="px-5 py-9 text-center">
                                                    <BookOpen
                                                        size={32}
                                                        className="mx-auto text-slate-300"
                                                    />

                                                    <p className="mt-2 text-sm font-medium text-slate-600">
                                                        No subjects added to this class yet.
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Contact the administrator for subject assignment.
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Table Header */}
                                                    <div className="hidden grid-cols-12 gap-3 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                                                        <div className="col-span-1">
                                                            No.
                                                        </div>

                                                        <div className="col-span-5">
                                                            Subject Name
                                                        </div>

                                                        <div className="col-span-3">
                                                            Subject Code
                                                        </div>

                                                        <div className="col-span-2">
                                                            Class
                                                        </div>

                                                        <div className="col-span-1 text-right">
                                                            Action
                                                        </div>
                                                    </div>

                                                    {/* Subject Rows */}
                                                    <div className="divide-y divide-slate-100">
                                                        {classSubjects.map((subject, index) => (
                                                            <div
                                                                key={subject._id}
                                                                className="flex flex-col gap-3 px-4 py-4 transition duration-200 hover:bg-blue-50/40 sm:px-5 md:grid md:grid-cols-12 md:items-center md:gap-3"
                                                            >
                                                                {/* Number */}
                                                                <div className="hidden text-sm font-medium text-slate-400 md:col-span-1 md:block">
                                                                    {String(index + 1).padStart(2, "0")}
                                                                </div>

                                                                {/* Subject Name */}
                                                                <div className="flex min-w-0 items-center gap-3 md:col-span-5">
                                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                                                        <BookMarked size={19} />
                                                                    </div>

                                                                    <div className="min-w-0">
                                                                        <p className="break-words text-sm font-semibold text-slate-800">
                                                                            {subject.subjectName || "Unnamed Subject"}
                                                                        </p>

                                                                        <p className="mt-1 text-xs text-slate-400 md:hidden">
                                                                            Code: {subject.subjectCode || "N/A"}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                {/* Subject Code */}
                                                                <div className="hidden md:col-span-3 md:block">
                                                                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                                                                        <Hash size={13} />
                                                                        <span className="break-all">
                                                                            {subject.subjectCode || "N/A"}
                                                                        </span>
                                                                    </span>
                                                                </div>

                                                                {/* Class */}
                                                                <div className="hidden md:col-span-2 md:block">
                                                                    <span className="break-words text-sm text-slate-600">
                                                                        {classItem.className}
                                                                        {classItem.section
                                                                            ? ` (${classItem.section})`
                                                                            : ""}
                                                                    </span>
                                                                </div>

                                                                {/* Action */}
                                                                <div className="flex items-center justify-between md:col-span-1 md:justify-end">
                                                                    <span className="text-xs text-slate-400 md:hidden">
                                                                        Subject {index + 1}
                                                                    </span>

                                                                    <button
                                                                        onClick={() => setSelectedSubject(subject)}
                                                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 transition hover:border-blue-300 hover:bg-blue-100"
                                                                    >
                                                                        <Eye size={15} />
                                                                        View
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
                {!loading &&
                    searchTerm &&
                    classes.length > 0 &&
                    filteredSubjects.length === 0 && (
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                                <Search size={27} />
                            </div>

                            <h3 className="mt-3 font-semibold text-slate-800">
                                No Subjects Found
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Try searching with another subject name or code.
                            </p>

                            <button
                                onClick={() => setSearchTerm("")}
                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Clear Search
                            </button>
                        </div>
                    )}
            </div>

            {/* Subject Details Modal */}
            {selectedSubject && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm sm:p-4"
                    onClick={() => setSelectedSubject(null)}
                >
                    <div
                        className="flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-white sm:px-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="shrink-0 rounded-xl bg-white/20 p-2.5">
                                    <BookOpen size={21} />
                                </div>

                                <div className="min-w-0">
                                    <h3 className="font-bold">
                                        Subject Details
                                    </h3>

                                    <p className="mt-0.5 text-xs text-blue-100">
                                        Subject information
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedSubject(null)}
                                className="shrink-0 rounded-lg p-2 transition hover:bg-white/20"
                                aria-label="Close modal"
                            >
                                <X size={19} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">

                            {/* Subject Name */}
                            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                                    Subject Name
                                </p>

                                <p className="mt-1 break-words text-xl font-bold text-slate-800">
                                    {selectedSubject.subjectName || "N/A"}
                                </p>
                            </div>

                            {/* Subject Information */}
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                {/* Subject Code */}
                                <div className="rounded-xl border border-slate-100 bg-white p-4">
                                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                                        <Hash size={15} />
                                        <span className="text-xs">
                                            Subject Code
                                        </span>
                                    </div>

                                    <p className="break-words text-sm font-semibold text-slate-800">
                                        {selectedSubject.subjectCode || "N/A"}
                                    </p>
                                </div>

                                {/* Class */}
                                <div className="rounded-xl border border-slate-100 bg-white p-4">
                                    <div className="mb-2 flex items-center gap-2 text-slate-400">
                                        <GraduationCap size={16} />
                                        <span className="text-xs">
                                            Class
                                        </span>
                                    </div>

                                    <p className="break-words text-sm font-semibold text-slate-800">
                                        {selectedSubject.classId?.className || "N/A"}
                                        {selectedSubject.classId?.section
                                            ? ` (${selectedSubject.classId.section})`
                                            : ""}
                                    </p>
                                </div>
                            </div>

                            {/* Academic Year */}
                            <div className="rounded-xl border border-slate-100 bg-white p-4">
                                <div className="mb-2 flex items-center gap-2 text-slate-400">
                                    <CalendarDays size={15} />
                                    <span className="text-xs">
                                        Academic Year
                                    </span>
                                </div>

                                <p className="text-sm font-semibold text-slate-800">
                                    {selectedSubject.classId?.academicYear || "N/A"}
                                </p>
                            </div>

                            {/* Description */}
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Description
                                </p>

                                <p className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                                    {selectedSubject.description ||
                                        "No description available for this subject."}
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5 sm:py-4">
                            <button
                                onClick={() => setSelectedSubject(null)}
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

export default Subject;
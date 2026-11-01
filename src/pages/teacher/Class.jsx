import React, { useEffect, useState } from "react";
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
} from "lucide-react";

import api from "../../services/api";

const Class = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedClass, setSelectedClass] = useState(null);

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

    // Search classes
    const filteredClasses = classes.filter((item) => {
        const search = searchTerm.toLowerCase();

        return (
            item.className?.toLowerCase().includes(search) ||
            item.section?.toLowerCase().includes(search) ||
            String(item.academicYear || "").includes(search)
        );
    });

    const totalStudents = classes.reduce(
        (total, item) => total + (item.studentCount || 0),
        0
    );

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">

            {/* Page Header */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                        <School size={16} />
                        <span>Teacher Dashboard</span>
                        <span>/</span>
                        <span className="font-medium text-blue-600">My Classes</span>
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                        My Classes
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage and view information about your assigned classes.
                    </p>
                </div>

                <button
                    onClick={fetchMyClasses}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        size={17}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Summary Cards */}
            <div className="mb-7 grid grid-cols-1 gap-5 sm:grid-cols-2">

                {/* Total Classes */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Total Assigned Classes
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {loading ? "—" : classes.length}
                            </h2>

                            <p className="mt-1 text-xs text-slate-400">
                                Classes assigned to you
                            </p>
                        </div>

                        <div className="rounded-xl bg-blue-50 p-3.5 text-blue-600">
                            <BookOpen size={25} />
                        </div>
                    </div>
                </div>

                {/* Total Students */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-slate-500">
                                Total Students
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-slate-800">
                                {loading ? "—" : totalStudents}
                            </h2>

                            <p className="mt-1 text-xs text-slate-400">
                                Students in your classes
                            </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3.5 text-emerald-600">
                            <Users size={25} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Classes Section */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* Section Header */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Assigned Classes
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            All classes assigned to your teacher account.
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search classes..."
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
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
                    /* Empty State */
                    <div className="px-5 py-16 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
                            <GraduationCap size={32} />
                        </div>

                        <h3 className="mt-4 text-lg font-semibold text-slate-800">
                            {searchTerm ? "No Classes Found" : "No Classes Assigned Yet"}
                        </h3>

                        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                            {searchTerm
                                ? "Try searching with another class name, section or academic year."
                                : "Your assigned classes will appear here once the administrator assigns them to you."}
                        </p>
                    </div>
                ) : (
                    /* Class Cards */
                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 xl:grid-cols-3">
                        {filteredClasses.map((item) => (
                            <div
                                key={item._id}
                                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                            >
                                {/* Card Top */}
                                <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
                                    <div className="absolute -right-5 -top-8 h-32 w-32 rounded-full bg-white/10" />
                                    <div className="absolute -bottom-12 right-16 h-28 w-28 rounded-full bg-white/10" />

                                    <div className="relative flex items-start justify-between">
                                        <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                                            <GraduationCap size={26} />
                                        </div>

                                        <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                                            Assigned
                                        </span>
                                    </div>

                                    <div className="relative mt-5">
                                        <p className="text-xs font-medium uppercase tracking-wider text-blue-100">
                                            Class
                                        </p>

                                        <h3 className="mt-1 text-2xl font-bold">
                                            {item.className}
                                        </h3>

                                        <p className="mt-1 text-sm text-blue-100">
                                            Section {item.section}
                                        </p>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <div className="mb-2 flex items-center gap-2 text-slate-400">
                                                <CalendarDays size={15} />
                                                <span className="text-xs">
                                                    Academic Year
                                                </span>
                                            </div>

                                            <p className="text-lg font-bold text-slate-800">
                                                {item.academicYear}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <div className="mb-2 flex items-center gap-2 text-slate-400">
                                                <Users size={15} />
                                                <span className="text-xs">
                                                    Students
                                                </span>
                                            </div>

                                            <p className="text-lg font-bold text-slate-800">
                                                {item.studentCount || 0}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            Active Assignment
                                        </span>

                                        <button
                                            onClick={() => setSelectedClass(item)}
                                            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                        >
                                            View Details
                                            <ArrowUpRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                {!loading && filteredClasses.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                        <p className="text-xs text-slate-500">
                            Showing <span className="font-semibold text-slate-700">{filteredClasses.length}</span> of{" "}
                            <span className="font-semibold text-slate-700">{classes.length}</span> assigned classes
                        </p>
                    </div>
                )}
            </div>

            {/* Class Details Modal */}
            {selectedClass && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedClass(null)}
                >
                    <div
                        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-white/20 p-2.5">
                                    <BookOpen size={23} />
                                </div>

                                <div>
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
                                className="rounded-lg p-2 transition hover:bg-white/20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="space-y-4 p-6">
                            <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
                                <p className="text-xs font-medium uppercase tracking-wider text-blue-500">
                                    Class Name
                                </p>

                                <h3 className="mt-1 text-xl font-bold text-slate-800">
                                    {selectedClass.className}
                                </h3>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                                <span className="text-sm text-slate-500">
                                    Section
                                </span>

                                <span className="font-semibold text-slate-800">
                                    {selectedClass.section}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                                <span className="text-sm text-slate-500">
                                    Academic Year
                                </span>

                                <span className="font-semibold text-slate-800">
                                    {selectedClass.academicYear}
                                </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                                <span className="text-sm text-slate-500">
                                    Total Students
                                </span>

                                <span className="font-semibold text-slate-800">
                                    {selectedClass.studentCount || 0}
                                </span>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
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
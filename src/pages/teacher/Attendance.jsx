
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    CalendarDays,
    Users,
    UserCheck,
    UserX,
    Clock,
    Search,
    RefreshCw,
    GraduationCap,
    CheckCircle2,
    Save,
    AlertCircle,
    School,
    FileCheck,
} from "lucide-react";

import api from "../../services/api";

const getTodayDate = () => {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const statusOptions = ["Present", "Absent", "Late"];

const PresentManagement = () => {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedDate, setSelectedDate] = useState(getTodayDate());

    const [searchTerm, setSearchTerm] = useState("");

    const [loading, setLoading] = useState(true);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // =================================
    // LOAD TEACHER CLASSES
    // =================================

    const fetchClasses = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/teacher/my-classes");

            const classData = response.data.data || [];

            setClasses(classData);

            setSelectedClass((previous) => {
                if (classData.some((item) => item._id === previous)) {
                    return previous;
                }

                return classData[0]?._id || "";
            });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load your assigned classes."
            );

            setClasses([]);
            setSelectedClass("");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClasses();
    }, [fetchClasses]);

    // =================================
    // LOAD STUDENTS AND ATTENDANCE
    // =================================

    const fetchAttendanceData = useCallback(async () => {
        if (!selectedClass || !selectedDate) {
            setStudents([]);
            setAttendance({});
            return;
        }

        try {
            setStudentsLoading(true);
            setError("");
            setSuccess("");

            // Clear old class/date data while loading
            setStudents([]);
            setAttendance({});

            const [studentResponse, attendanceResponse] =
                await Promise.all([
                    api.get("/attendance/students", {
                        params: {
                            classId: selectedClass,
                        },
                    }),

                    api.get("/attendance/all", {
                        params: {
                            classId: selectedClass,
                            date: selectedDate,
                        },
                    }),
                ]);

            const studentData = studentResponse.data.data || [];
            const attendanceData = attendanceResponse.data.data || [];

            const attendanceMap = {};

            studentData.forEach((student) => {
                const existingRecord = attendanceData.find((record) => {
                    const recordStudentId =
                        record.student?._id || record.student;

                    return recordStudentId?.toString() ===
                        student._id.toString();
                });

                attendanceMap[student._id] = {
                    status: existingRecord?.status || "Present",
                    remarks: existingRecord?.remarks || "",
                    attendanceId: existingRecord?._id || null,
                };
            });

            setStudents(studentData);
            setAttendance(attendanceMap);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to load attendance data."
            );

            setStudents([]);
            setAttendance({});
        } finally {
            setStudentsLoading(false);
        }
    }, [selectedClass, selectedDate]);

    useEffect(() => {
        fetchAttendanceData();
    }, [fetchAttendanceData]);

    // =================================
    // SEARCH STUDENTS
    // =================================

    const filteredStudents = useMemo(() => {
        const search = searchTerm.toLowerCase().trim();

        if (!search) return students;

        return students.filter((student) =>
            student.name?.toLowerCase().includes(search) ||
            student.email?.toLowerCase().includes(search)
        );
    }, [students, searchTerm]);

    // =================================
    // ATTENDANCE SUMMARY
    // =================================

    const presentCount = students.filter(
        (student) => attendance[student._id]?.status === "Present"
    ).length;

    const absentCount = students.filter(
        (student) => attendance[student._id]?.status === "Absent"
    ).length;

    const lateCount = students.filter(
        (student) => attendance[student._id]?.status === "Late"
    ).length;

    const savedCount = students.filter(
        (student) => attendance[student._id]?.attendanceId
    ).length;

    // =================================
    // CHANGE STATUS
    // =================================

    const handleStatusChange = (studentId, status) => {
        setAttendance((previous) => ({
            ...previous,
            [studentId]: {
                ...previous[studentId],
                status,
            },
        }));
    };

    // =================================
    // CHANGE REMARKS
    // =================================

    const handleRemarksChange = (studentId, remarks) => {
        setAttendance((previous) => ({
            ...previous,
            [studentId]: {
                ...previous[studentId],
                remarks,
            },
        }));
    };

    // =================================
    // MARK ALL PRESENT
    // =================================

    const handleSelectAllPresent = () => {
        setAttendance((previous) => {
            const updated = { ...previous };

            students.forEach((student) => {
                updated[student._id] = {
                    ...updated[student._id],
                    status: "Present",
                };
            });

            return updated;
        });
    };

    // =================================
    // SAVE ATTENDANCE
    // =================================

    const handleSaveAttendance = async () => {
        if (saving) return;

        if (!selectedClass || !selectedDate) {
            setError("Please select a class and date.");
            return;
        }

        if (students.length === 0) {
            setError("No students found in this class.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            let savedSuccessfully = 0;
            const failedStudents = [];

            for (const student of students) {
                const studentData = attendance[student._id];

                if (!studentData) continue;

                const payload = {
                    student: student._id,
                    classId: selectedClass,
                    date: `${selectedDate}T00:00:00.000Z`,
                    status: studentData.status,
                    remarks: studentData.remarks || "",
                };

                try {
                    if (studentData.attendanceId) {
                        await api.put(
                            `/attendance/update/${studentData.attendanceId}`,
                            {
                                status: studentData.status,
                                remarks: studentData.remarks || "",
                            }
                        );
                    } else {
                        await api.post("/attendance/create", payload);
                    }

                    savedSuccessfully++;

                } catch (err) {
                    failedStudents.push(
                        `${student.name} (${err.response?.data?.message || "Failed"})`
                    );
                }
            }

            if (failedStudents.length > 0) {
                setError(
                    `${savedSuccessfully} records saved. Failed: ${failedStudents.join(", ")}`
                );
            } else {
                setSuccess("Attendance saved successfully!");
            }

            await fetchAttendanceData();

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to save attendance."
            );
        } finally {
            setSaving(false);
        }
    };

    // =================================
    // SELECTED CLASS
    // =================================

    const selectedClassInfo = classes.find(
        (item) => item._id === selectedClass
    );

    // =================================
    // STATUS BUTTON STYLE
    // =================================

    const getStatusStyle = (status, active) => {
        const styles = {
            Present: active
                ? "bg-emerald-500 border-emerald-500 text-white"
                : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",

            Absent: active
                ? "bg-red-500 border-red-500 text-white"
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",

            Late: active
                ? "bg-amber-500 border-amber-500 text-white"
                : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
        };

        return styles[status];
    };

    // =================================
    // LOADING SCREEN
    // =================================

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                    <RefreshCw
                        size={30}
                        className="mx-auto animate-spin text-blue-600"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                        Loading attendance...
                    </p>
                </div>
            </div>
        );
    }

    // =================================
    // MAIN UI
    // =================================

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* HEADER */}

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                            <School size={16} />
                            <span>Teacher Dashboard</span>
                            <span>/</span>
                            <span className="font-medium text-blue-600">
                                Attendance
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
                            Attendance Management
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Manage attendance for your assigned classes.
                        </p>
                    </div>

                    <button
                        onClick={fetchAttendanceData}
                        disabled={!selectedClass || studentsLoading || saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={studentsLoading ? "animate-spin" : ""}
                        />
                        Refresh
                    </button>
                </div>

                {/* ALERTS */}

                {error && (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                        <CheckCircle2 size={18} />
                        <span>{success}</span>
                    </div>
                )}

                {/* SUMMARY CARDS */}

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                    Total Students
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                                    {students.length}
                                </h2>
                            </div>
                            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                                <Users size={22} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                    Present
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-emerald-600">
                                    {presentCount}
                                </h2>
                            </div>
                            <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                                <UserCheck size={22} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                    Absent
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-red-600">
                                    {absentCount}
                                </h2>
                            </div>
                            <div className="rounded-xl bg-red-50 p-3 text-red-600">
                                <UserX size={22} />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                            <div>
                                <p className="text-xs font-medium text-slate-500 sm:text-sm">
                                    Late
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-amber-600">
                                    {lateCount}
                                </h2>
                            </div>
                            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                                <Clock size={22} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* CLASS AND DATE SELECTION */}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="font-bold text-slate-800">
                            Select Class & Date
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Choose your assigned class and attendance date.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        {/* CLASS SELECT */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Select Class
                            </label>

                            <div className="relative">
                                <GraduationCap
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <select
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                    disabled={classes.length === 0 || saving}
                                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                >
                                    {classes.length === 0 && (
                                        <option value="">
                                            No assigned classes
                                        </option>
                                    )}

                                    {classes.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.className} - {item.section}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* DATE SELECT */}

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Attendance Date
                            </label>

                            <div className="relative">
                                <CalendarDays
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="date"
                                    value={selectedDate}
                                    max={getTodayDate()}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    disabled={saving}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                                />
                            </div>
                        </div>

                    </div>

                    {/* SELECTED CLASS INFO */}

                    {selectedClassInfo && (
                        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                            <GraduationCap size={18} />

                            <span className="font-semibold">
                                {selectedClassInfo.className}
                                {selectedClassInfo.section
                                    ? ` - ${selectedClassInfo.section}`
                                    : ""}
                            </span>

                            <span className="text-blue-400">|</span>

                            <span>
                                Academic Year: {selectedClassInfo.academicYear}
                            </span>
                        </div>
                    )}

                </div>

                {/* STUDENT ATTENDANCE SECTION */}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* SECTION HEADER */}

                    <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">
                                Student Attendance
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Mark attendance for each student.
                            </p>
                        </div>

                        <button
                            onClick={handleSelectAllPresent}
                            disabled={students.length === 0 || studentsLoading || saving}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                            <CheckCircle2 size={17} />
                            Mark All Present
                        </button>
                    </div>

                    {/* SEARCH BAR */}

                    <div className="border-b border-slate-100 p-4">
                        <div className="relative max-w-md">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search student name or email..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
                            />
                        </div>
                    </div>

                    {/* STUDENT CONTENT */}

                    {studentsLoading ? (
                        <div className="py-16 text-center">
                            <RefreshCw
                                size={28}
                                className="mx-auto animate-spin text-blue-600"
                            />
                            <p className="mt-3 text-sm text-slate-500">
                                Loading students...
                            </p>
                        </div>

                    ) : students.length === 0 ? (

                        <div className="px-5 py-16 text-center">
                            <Users
                                size={42}
                                className="mx-auto text-slate-300"
                            />
                            <h3 className="mt-3 font-semibold text-slate-700">
                                No Students Found
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                No students are assigned to this class yet.
                            </p>
                        </div>

                    ) : filteredStudents.length === 0 ? (

                        <div className="py-12 text-center text-sm text-slate-500">
                            No students match your search.
                        </div>

                    ) : (

                        <>
                            {/* TABLE HEADER */}

                            <div className="hidden grid-cols-12 gap-3 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
                                <div className="col-span-1">No.</div>
                                <div className="col-span-4">Student</div>
                                <div className="col-span-4">Attendance Status</div>
                                <div className="col-span-3">Remarks</div>
                            </div>

                            {/* STUDENT ROWS */}

                            <div className="divide-y divide-slate-100">
                                {filteredStudents.map((student, index) => {
                                    const studentData = attendance[student._id] || {
                                        status: "Present",
                                        remarks: "",
                                        attendanceId: null,
                                    };

                                    return (
                                        <div
                                            key={student._id}
                                            className="grid grid-cols-1 gap-4 px-5 py-4 transition hover:bg-slate-50/70 md:grid-cols-12 md:items-center md:gap-3"
                                        >
                                            {/* STUDENT INFO */}

                                            <div className="flex min-w-0 items-center gap-3 md:col-span-5">
                                                <span className="hidden text-sm font-medium text-slate-400 md:block">
                                                    {String(index + 1).padStart(2, "0")}
                                                </span>

                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 font-bold text-blue-600">
                                                    {student.profilePicture ? (
                                                        <img
                                                            src={student.profilePicture}
                                                            alt={student.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        student.name?.charAt(0)?.toUpperCase() || "S"
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-slate-800">
                                                        {student.name}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-400">
                                                        {student.email}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ATTENDANCE STATUS */}

                                            <div className="md:col-span-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {statusOptions.map((status) => {
                                                        const active = studentData.status === status;

                                                        return (
                                                            <button
                                                                key={status}
                                                                type="button"
                                                                disabled={saving}
                                                                onClick={() =>
                                                                    handleStatusChange(student._id, status)
                                                                }
                                                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${getStatusStyle(status, active)}`}
                                                            >
                                                                {status}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {studentData.attendanceId && (
                                                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-emerald-600">
                                                        <CheckCircle2 size={12} />
                                                        Previously saved
                                                    </span>
                                                )}
                                            </div>

                                            {/* REMARKS */}

                                            <div className="md:col-span-3">
                                                <input
                                                    type="text"
                                                    value={studentData.remarks || ""}
                                                    disabled={saving}
                                                    onChange={(e) =>
                                                        handleRemarksChange(
                                                            student._id,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Optional remarks..."
                                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-100"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* FOOTER */}

                    <div className="flex flex-col justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs text-slate-500">
                                {savedCount} of {students.length} attendance records saved.
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                                {presentCount} Present · {absentCount} Absent · {lateCount} Late
                            </p>
                        </div>

                        <button
                            onClick={handleSaveAttendance}
                            disabled={saving || studentsLoading || students.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <RefreshCw size={17} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={17} />
                                    Save Attendance
                                </>
                            )}
                        </button>
                    </div>

                </div>

                {/* INFORMATION */}

                <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <FileCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <div>
                        <p className="text-sm font-semibold text-blue-800">
                            Attendance Information
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-700">
                            Existing attendance records will be updated when
                            you save again. New records will be created for
                            students whose attendance has not been saved yet.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PresentManagement;

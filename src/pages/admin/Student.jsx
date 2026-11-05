
import { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserRound,
  RefreshCw,
  X,
  Mail,
  CalendarDays,
  GraduationCap,
  CheckCircle,
  MapPin,
  FileText,
  Hash,
  Printer,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({});

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClasses, setSelectedClasses] = useState({});
  const [assigningId, setAssigningId] = useState("");

  



  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return entities[char];
    });

  const getStoredUser = () => {
    try {
      const storedUser =
        localStorage.getItem("tasmina_user") ||
        localStorage.getItem("user");

      if (!storedUser) return {};

      const parsed = JSON.parse(storedUser);

      return parsed?.user || parsed?.data?.user || parsed || {};
    } catch {
      return {};
    }
  };

  

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/student/all-students");

      const studentData =
        response.data?.students ||
        response.data?.data?.students ||
        response.data?.data ||
        [];

      const list = Array.isArray(studentData) ? studentData : [];

      setStudents(list);

      const classSelections = {};

      list.forEach((student) => {
        classSelections[student._id] =
          student.classId?._id || "";
      });

      setSelectedClasses(classSelections);
    } catch (err) {
      console.error("Fetch students error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  


  const fetchClasses = async () => {
    try {
      const response = await api.get("/class/allclasses");

      const classData =
        response.data?.classes ||
        response.data?.data?.classes ||
        response.data?.data ||
        [];

      setClasses(Array.isArray(classData) ? classData : []);
    } catch (err) {
      console.error("Fetch classes error:", err);
    }
  };



  const fetchSchoolInfo = async () => {
    try {
      const response = await api.get("/settings/school-info");

      const data = response.data?.data || response.data;

      setSchoolInfo(data?.school || data || {});
    } catch (err) {
      console.log("School information could not be loaded:", err);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchSchoolInfo();
  }, []);

 


  const handleAssignClass = async (studentId) => {
    const classId = selectedClasses[studentId];

    if (!classId) {
      setError("Please select a class first.");
      return;
    }

    try {
      setAssigningId(studentId);
      setError("");
      setSuccess("");

      const response = await api.patch(
        `/student/assign-class/${studentId}`,
        { classId }
      );

      setSuccess(
        response.data?.message ||
          "Class and roll number assigned successfully!"
      );

      await fetchStudents();

      if (selectedStudent?._id === studentId) {
        setSelectedStudent(response.data?.data || selectedStudent);
      }
    } catch (err) {
      console.error("Assign class error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to assign class."
      );
    } finally {
      setAssigningId("");
    }
  };



  const filteredStudents = students.filter((student) => {
    const searchValue = search.toLowerCase().trim();

    return (
      student.name?.toLowerCase().includes(searchValue) ||
      student.email?.toLowerCase().includes(searchValue) ||
      String(student.rollNumber || "")
        .toLowerCase()
        .includes(searchValue) ||
      student.classId?.className
        ?.toLowerCase()
        .includes(searchValue) ||
      student.classId?.section
        ?.toLowerCase()
        .includes(searchValue)
    );
  });



  const handlePrint = () => {
    const currentUser = getStoredUser();

    const role =
      currentUser.role ||
      localStorage.getItem("role") ||
      "";

    if (role !== "admin") {
      setError("Only Admin can print the Student List.");
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=750"
    );

    if (!printWindow) {
      setError("Please allow popups to print the Student List.");
      return;
    }

    const schoolName = escapeHTML(
      schoolInfo.schoolName ||
        schoolInfo.name ||
        "My School"
    );

    const schoolAddress = escapeHTML(
      schoolInfo.schoolAddress ||
        schoolInfo.address ||
        ""
    );

    const schoolPhone = escapeHTML(
      schoolInfo.schoolPhone || ""
    );

    const schoolEmail = escapeHTML(
      schoolInfo.schoolEmail || ""
    );

    const logo = schoolInfo.logo || schoolInfo.schoolLogo || "";

    const safeLogo = /^https?:\/\//i.test(logo)
      ? escapeHTML(logo)
      : "";

    const rows = filteredStudents
      .map((student, index) => {
        const className = student.classId?.className || "Not Assigned";
        const section = student.classId?.section || "N/A";
        const academicYear = student.classId?.academicYear || "N/A";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(student.name || "N/A")}</td>
            <td>${escapeHTML(student.email || "N/A")}</td>
            <td>${escapeHTML(className)}</td>
            <td>${escapeHTML(section)}</td>
            <td>${escapeHTML(student.rollNumber || "Not Assigned")}</td>
            <td>${escapeHTML(academicYear)}</td>
            <td>${escapeHTML(formatDate(student.createdAt))}</td>
          </tr>
        `;
      })
      .join("");

    const printDate = new Date().toLocaleDateString("en-BD");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Student List Report</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #222;
            margin: 0;
            padding: 20px;
          }

          .school-header {
            text-align: center;
            border-bottom: 2px solid #222;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }

          .school-header img {
            width: 65px;
            height: 65px;
            object-fit: contain;
            margin-bottom: 8px;
          }

          .school-header h1 {
            margin: 5px 0;
            font-size: 25px;
          }

          .school-header p {
            margin: 4px 0;
            font-size: 12px;
          }

          .report-title {
            text-align: center;
            margin: 20px 0;
          }

          .report-title h2 {
            margin: 0 0 8px;
            font-size: 20px;
          }

          .report-title p {
            margin: 0;
            font-size: 12px;
          }

          .report-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            font-size: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }

          th, td {
            border: 1px solid #777;
            padding: 8px 6px;
            font-size: 9px;
            text-align: left;
            vertical-align: middle;
          }

          th {
            background: #eeeeee;
            font-weight: bold;
          }

          .summary {
            margin-top: 15px;
            font-size: 13px;
            font-weight: bold;
          }

          .signature {
            margin-top: 75px;
            display: flex;
            justify-content: flex-end;
          }

          .signature div {
            width: 190px;
            border-top: 1px solid #222;
            text-align: center;
            padding-top: 8px;
            font-size: 12px;
          }

          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          @media print {
            body {
              padding: 0;
            }

            tr {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>

        <div class="school-header">
          ${
            safeLogo
              ? `<img src="${safeLogo}" alt="School Logo" />`
              : ""
          }

          <h1>${schoolName}</h1>

          ${schoolAddress ? `<p>${schoolAddress}</p>` : ""}
          ${schoolPhone ? `<p>Phone: ${schoolPhone}</p>` : ""}
          ${schoolEmail ? `<p>Email: ${schoolEmail}</p>` : ""}
        </div>

        <div class="report-title">
          <h2>STUDENT LIST REPORT</h2>
          <p>Academic Student Information</p>
        </div>

        <div class="report-info">
          <span>Total Students: ${filteredStudents.length}</span>
          <span>Print Date: ${printDate}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Student Name</th>
              <th>Email</th>
              <th>Class</th>
              <th>Section</th>
              <th>Roll Number</th>
              <th>Academic Year</th>
              <th>Registered Date</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows ||
              `<tr><td colspan="8" style="text-align:center">No students found</td></tr>`
            }
          </tbody>
        </table>

        <div class="summary">
          Total Students: ${filteredStudents.length}
        </div>

        <div class="signature">
          <div>Authorized Signature</div>
        </div>

        <script>
          window.onload = function () {
            const images = Array.from(document.images);

            Promise.all(
              images.map((img) => {
                if (img.complete) return Promise.resolve();

                return new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                });
              })
            ).then(() => {
              window.print();
            });
          };
        </script>

      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };


  const closeModal = () => {
    setSelectedStudent(null);
  };



  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-3 text-gray-700 sm:p-5 lg:p-8">

      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            Student Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage students and assign their classes and roll numbers.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">

          <button
            type="button"
            onClick={() => {
              fetchStudents();
              fetchClasses();
            }}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50 sm:w-auto"
          >
            <Printer size={17} />
            Print Student List
          </button>

        </div>

      </div>

      {/* Messages */}

      {error && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span className="flex items-center gap-2">
            <AlertCircle size={17} />
            {error}
          </span>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="shrink-0"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary Cards */}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 sm:text-sm">
                Total Students
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-800 sm:text-2xl">
                {students.length}
              </h2>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 sm:h-12 sm:w-12">
              <Users size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 sm:text-sm">
                Assigned Students
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-800 sm:text-2xl">
                {
                  students.filter((student) => student.classId).length
                }
              </h2>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 sm:h-12 sm:w-12">
              <CheckCircle size={21} />
            </div>
          </div>
        </div>

        <div className="col-span-2 rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 lg:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 sm:text-sm">
                Available Classes
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-800 sm:text-2xl">
                {classes.length}
              </h2>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 sm:h-12 sm:w-12">
              <GraduationCap size={21} />
            </div>
          </div>
        </div>

      </div>

      {/* Student List */}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 p-4 sm:p-5">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-base font-bold text-gray-800 sm:text-lg">
                All Students
              </h2>

              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                View, search and manage student information.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, roll or class..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

          </div>

        </div>

        {/* Table */}

        <div className="w-full overflow-x-auto">

          <table className="w-full min-w-[1150px] text-left">

            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Assigned Class</th>
                <th className="px-5 py-4">Roll Number</th>
                <th className="px-5 py-4">Assign Class</th>
                <th className="px-5 py-4">Registered</th>
                <th className="px-5 py-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-sm text-gray-500"
                  >
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center"
                  >
                    <div className="flex flex-col items-center">
                      <Users
                        size={35}
                        className="mb-3 text-gray-300"
                      />

                      <p className="text-sm font-medium text-gray-600">
                        No students found
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        Try searching with another name or email.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr
                    key={student._id}
                    className="transition-colors hover:bg-gray-50"
                  >

                    {/* Student */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">

                        {student.profilePicture ? (
                          <img
                            src={student.profilePicture}
                            alt={student.name}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <UserRound size={20} />
                          </div>
                        )}

                        <div>
                          <p className="whitespace-nowrap text-sm font-semibold text-gray-800">
                            {student.name || "N/A"}
                          </p>

                          <p className="mt-0.5 text-xs text-gray-400">
                            Student
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* Email */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={15} className="shrink-0 text-gray-400" />

                        <span className="whitespace-nowrap">
                          {student.email || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Class */}

                    <td className="px-5 py-4">
                      {student.classId ? (
                        <div className="flex flex-col items-start gap-1">

                          <span className="inline-flex whitespace-nowrap rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                            {student.classId.className || "N/A"}
                          </span>

                          <span className="text-xs text-gray-500">
                            Section {student.classId.section || "N/A"}
                          </span>

                          <span className="text-xs text-gray-400">
                            {student.classId.academicYear || ""}
                          </span>

                        </div>
                      ) : (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                          Not Assigned
                        </span>
                      )}
                    </td>

                    {/* Roll Number */}

                    <td className="px-5 py-4">
                      {student.rollNumber ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          <Hash size={13} />
                          {student.rollNumber}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-gray-400">
                          Not Assigned
                        </span>
                      )}
                    </td>

                    {/* Assign Class */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">

                        <select
                          value={selectedClasses[student._id] || ""}
                          onChange={(e) =>
                            setSelectedClasses((prev) => ({
                              ...prev,
                              [student._id]: e.target.value,
                            }))
                          }
                          className="w-44 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-blue-500"
                        >
                          <option value="">Select Class</option>

                          {classes.map((classItem) => (
                            <option
                              key={classItem._id}
                              value={classItem._id}
                            >
                              {classItem.className} - Section {classItem.section} ({classItem.academicYear})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => handleAssignClass(student._id)}
                          disabled={
                            assigningId === student._id ||
                            !selectedClasses[student._id] ||
                            classes.length === 0
                          }
                          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {assigningId === student._id
                            ? "Saving..."
                            : "Assign"}
                        </button>

                      </div>
                    </td>

                    {/* Registered */}

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 whitespace-nowrap text-sm text-gray-500">
                        <CalendarDays size={15} className="text-gray-400" />
                        {formatDate(student.createdAt)}
                      </div>
                    </td>

                    {/* Action */}

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedStudent(student)}
                        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        <UserRound size={15} />
                        View Details
                      </button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {/* Table Footer */}

        <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <p>
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {filteredStudents.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {students.length}
            </span>{" "}
            students
          </p>

          <p>Student Management</p>

        </div>

      </div>

      {/* Student Details Modal */}

      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-[2px] sm:p-5"
          onClick={closeModal}
        >

          <div
            className="my-auto flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3.5 sm:px-6 sm:py-4">

              <div>
                <h2 className="text-base font-bold text-gray-800 sm:text-lg">
                  Student Profile
                </h2>

                <p className="mt-0.5 text-xs text-gray-500">
                  Personal information and academic details
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close student details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                <X size={19} />
              </button>

            </div>

            {/* Scrollable Modal Body */}

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

              {/* Profile Header */}

              <div className="flex flex-col items-center rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-5 text-center sm:py-6">

                {selectedStudent.profilePicture ? (
                  <img
                    src={selectedStudent.profilePicture}
                    alt={selectedStudent.name || "Student"}
                    className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow-sm sm:h-24 sm:w-24">
                    <UserRound size={38} />
                  </div>
                )}

                <h3 className="mt-3 max-w-full break-words text-lg font-bold text-gray-800 sm:text-xl">
                  {selectedStudent.name || "N/A"}
                </h3>

                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-600">
                  <GraduationCap size={14} />
                  Student
                </span>

                <div className="mt-3 rounded-lg bg-white px-4 py-2">
                  <p className="text-[11px] font-medium text-gray-500">
                    Roll Number
                  </p>

                  <p className="text-lg font-bold text-blue-700">
                    {selectedStudent.rollNumber || "Not Assigned"}
                  </p>
                </div>

              </div>

              {/* Information Heading */}

              <div className="mb-3 mt-5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <FileText size={15} />
                </div>

                <h4 className="text-sm font-bold text-gray-800">
                  Personal Information
                </h4>
              </div>

              {/* Information Cards */}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                {/* Email */}

                <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <Mail size={17} />
                    <span className="text-xs font-semibold text-gray-500">
                      Email Address
                    </span>
                  </div>

                  <p className="break-all text-sm font-medium text-gray-800">
                    {selectedStudent.email || "N/A"}
                  </p>
                </div>

                {/* Registration Date */}

                <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <CalendarDays size={17} />
                    <span className="text-xs font-semibold text-gray-500">
                      Registration Date
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-800">
                    {formatDate(selectedStudent.createdAt)}
                  </p>
                </div>

                {/* Student ID */}

                <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <Hash size={17} />
                    <span className="text-xs font-semibold text-gray-500">
                      Student ID
                    </span>
                  </div>

                  <p className="break-all text-xs font-medium text-gray-800">
                    {selectedStudent._id || "N/A"}
                  </p>
                </div>

                {/* Roll Number */}

                <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <GraduationCap size={18} />
                    <span className="text-xs font-semibold text-gray-500">
                      Roll Number
                    </span>
                  </div>

                  <p className="text-sm font-bold text-gray-800">
                    {selectedStudent.rollNumber || "Not Assigned"}
                  </p>
                </div>

                {/* Class */}

                <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <GraduationCap size={18} />
                    <span className="text-xs font-semibold text-gray-500">
                      Assigned Class
                    </span>
                  </div>

                  <p className="break-words text-sm font-medium text-gray-800">
                    {selectedStudent.classId?.className || "Not Assigned"}
                  </p>
                </div>

                {/* Section */}

                <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <Users size={17} />
                    <span className="text-xs font-semibold text-gray-500">
                      Section
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-800">
                    {selectedStudent.classId?.section || "Not Assigned"}
                  </p>
                </div>

                {/* Academic Year */}

                <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <CalendarDays size={17} />
                    <span className="text-xs font-semibold text-gray-500">
                      Academic Year
                    </span>
                  </div>

                  <p className="text-sm font-medium text-gray-800">
                    {selectedStudent.classId?.academicYear || "N/A"}
                  </p>
                </div>

                {/* Address */}

                <div className="min-w-0 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                  <div className="mb-2 flex items-center gap-2 text-blue-600">
                    <MapPin size={17} />
                    <span className="text-xs font-semibold text-gray-500">
                      Address
                    </span>
                  </div>

                  <p className="break-words text-sm font-medium text-gray-800">
                    {selectedStudent.address || "Not provided"}
                  </p>
                </div>

              </div>

              {/* Bio */}

              <div className="mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                <div className="mb-2 flex items-center gap-2 text-blue-600">
                  <FileText size={17} />
                  <span className="text-xs font-semibold text-gray-500">
                    About Student
                  </span>
                </div>

                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                  {selectedStudent.bio || "No bio information available."}
                </p>
              </div>

            </div>

            {/* Modal Footer */}

            <div className="shrink-0 border-t border-gray-100 bg-white p-3.5 sm:px-6 sm:py-4">
              <button
                type="button"
                onClick={closeModal}
                className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Close Profile
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Students;

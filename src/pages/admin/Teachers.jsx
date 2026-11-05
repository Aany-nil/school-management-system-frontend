
import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Plus,
  Search,
  X,
  UserRound,
  Wallet,
  Pencil,
  RefreshCw,
  Mail,
  Printer,
  Eye,
  BookOpen,
  GraduationCap,
  CalendarDays,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import api from "../../services/api";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
};

const formatMoney = (amount) =>
  `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;

const getErrorMessage = (error) =>
  error.response?.data?.message ||
  error.response?.data?.error ||
  error.message ||
  "Something went wrong";

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

const getClassName = (item) => {
  const name = item?.className || "Unknown Class";
  const section = item?.section ? ` - ${item.section}` : "";
  const year = item?.academicYear ? ` (${item.academicYear})` : "";

  return `${name}${section}${year}`;
};

const getStoredUser = () => {
  try {
    const user =
      JSON.parse(localStorage.getItem("tasmina_user")) ||
      JSON.parse(localStorage.getItem("user"));

    return user || {};
  } catch {
    return {};
  }
};

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salarySaving, setSalarySaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState(EMPTY_FORM);

  const [monthlySalary, setMonthlySalary] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");



  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/teachers");

      const data = response.data?.data || response.data;

      const teacherList = Array.isArray(data?.teachers)
        ? data.teachers
        : Array.isArray(data)
        ? data
        : [];

      setTeachers(
        teacherList
          .filter((teacher) => teacher.role === "teacher")
          .map((teacher) => ({
            ...teacher,
            _id: teacher._id || teacher.id,
            monthlySalary: Number(teacher.monthlySalary || 0),
            assignedClasses: Array.isArray(teacher.assignedClasses)
              ? teacher.assignedClasses
              : [],
            assignedSubjects: Array.isArray(teacher.assignedSubjects)
              ? teacher.assignedSubjects
              : [],
          }))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
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
    fetchTeachers();
    fetchSchoolInfo();
  }, []);



  const filteredTeachers = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    if (!searchText) return teachers;

    return teachers.filter((teacher) => {
      const name = teacher.name?.toLowerCase() || "";
      const email = teacher.email?.toLowerCase() || "";

      const classes = teacher.assignedClasses
        .map((item) => getClassName(item).toLowerCase())
        .join(" ");

      const subjects = teacher.assignedSubjects
        .map((item) => item.subjectName?.toLowerCase() || "")
        .join(" ");

      return (
        name.includes(searchText) ||
        email.includes(searchText) ||
        classes.includes(searchText) ||
        subjects.includes(searchText)
      );
    });
  }, [teachers, search]);



  const totalTeachers = teachers.length;

  const teachersWithSalary = teachers.filter(
    (teacher) => Number(teacher.monthlySalary) > 0
  ).length;

  const totalSalary = teachers.reduce(
    (total, teacher) => total + Number(teacher.monthlySalary || 0),
    0
  );

  

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Teacher name and email are required.");
      return;
    }

    if (formData.password.length < 5) {
      setError("Password must be at least 5 characters.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/admin/teachers", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setSuccess("Teacher added successfully!");

      setFormData(EMPTY_FORM);
      setShowForm(false);

      await fetchTeachers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };



  const openSalaryModal = (teacher) => {
    setSelectedTeacher(teacher);
    setMonthlySalary(teacher.monthlySalary || "");
    setShowSalaryModal(true);
    setError("");
  };

  

  const handleSalaryUpdate = async (e) => {
    e.preventDefault();

    if (!selectedTeacher?._id) return;

    if (monthlySalary === "" || Number(monthlySalary) < 0) {
      setError("Please enter a valid monthly salary.");
      return;
    }

    try {
      setSalarySaving(true);
      setError("");
      setSuccess("");

      await api.patch(`/teacher/${selectedTeacher._id}/salary`, {
        monthlySalary: Number(monthlySalary),
      });

      setSuccess("Teacher salary updated successfully!");

      setShowSalaryModal(false);
      setSelectedTeacher(null);
      setMonthlySalary("");

      await fetchTeachers();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSalarySaving(false);
    }
  };



  const openDetails = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDetails(true);
  };

 

  const handlePrint = () => {
    const currentUser = getStoredUser();

    const role =
      currentUser.role ||
      JSON.parse(localStorage.getItem("tasmina_user") || "{}").role;

    if (role !== "admin") {
      setError("Only Admin can print the Teacher List.");
      return;
    }

  
    const printWindow = window.open(
      "",
      "_blank",
      "width=1000,height=750"
    );

    if (!printWindow) {
      setError("Please allow popups to print the Teacher List.");
      return;
    }

    const schoolName = escapeHTML(
      schoolInfo.schoolName || schoolInfo.name || "My School"
    );

    const schoolAddress = escapeHTML(
      schoolInfo.schoolAddress ||
        schoolInfo.address ||
        ""
    );

    const schoolEmail = escapeHTML(schoolInfo.schoolEmail || "");
    const schoolPhone = escapeHTML(schoolInfo.schoolPhone || "");

    const logo = schoolInfo.logo || schoolInfo.schoolLogo || "";

    const safeLogo = /^https?:\/\//i.test(logo)
      ? escapeHTML(logo)
      : "";

    const rows = filteredTeachers
      .map((teacher, index) => {
        const classes = teacher.assignedClasses || [];

        const classText = classes.length
          ? classes
              .map((item) => escapeHTML(getClassName(item)))
              .join("<br>")
          : "Not assigned";

        const subjects = teacher.assignedSubjects || [];

        const subjectText = subjects.length
          ? subjects
              .map((item) =>
                escapeHTML(
                  item.subjectCode
                    ? `${item.subjectName} (${item.subjectCode})`
                    : item.subjectName
                )
              )
              .join("<br>")
          : "Not assigned";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(teacher.name)}</td>
            <td>${escapeHTML(teacher.email)}</td>
            <td>${classText}</td>
            <td>${subjectText}</td>
            <td>${escapeHTML(formatMoney(teacher.monthlySalary))}</td>
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
        <title>Teacher List</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #222;
            margin: 0;
            padding: 25px;
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
            padding: 9px 7px;
            font-size: 10px;
            text-align: left;
            vertical-align: top;
            line-height: 1.6;
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
          <h2>TEACHER LIST REPORT</h2>
          <p>Academic Teacher Information</p>
        </div>

        <div class="report-info">
          <span>Total Teachers: ${filteredTeachers.length}</span>
          <span>Print Date: ${printDate}</span>
        </div>

        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Teacher Name</th>
              <th>Email</th>
              <th>Assigned Classes</th>
              <th>Assigned Subjects</th>
              <th>Monthly Salary</th>
            </tr>
          </thead>

          <tbody>
            ${
              rows ||
              `<tr><td colspan="6" style="text-align:center">No teachers found</td></tr>`
            }
          </tbody>
        </table>

        <div class="summary">
          Total Teachers: ${filteredTeachers.length}
        </div>

        <div class="signature">
          <div>
            Authorized Signature
          </div>
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

 

  const closeModals = () => {
    setShowForm(false);
    setShowSalaryModal(false);
    setShowDetails(false);
    setSelectedTeacher(null);
    setError("");
  };


  return (
    <div className="space-y-6">

      {/* Page Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Teacher Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage teachers, class assignments and salaries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            onClick={fetchTeachers}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-gray-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-600"
          >
            <Printer size={17} />
            Print List
          </button>

          <button
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Teacher
          </button>

        </div>
      </div>

      {/* Alerts */}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            onClick={() => setError("")}
            className="ml-auto"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle size={18} />
          <span>{success}</span>

          <button
            onClick={() => setSuccess("")}
            className="ml-auto"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary Cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Teachers
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {totalTeachers}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Teachers With Salary
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {teachersWithSalary}
              </h2>
            </div>

            <div className="rounded-lg bg-green-100 p-3 text-green-600">
              <Wallet size={24} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Monthly Salary
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {formatMoney(totalSalary)}
              </h2>
            </div>

            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <Wallet size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Teacher List */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              All Teachers
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Teacher information and class assignments.
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
              placeholder="Search teacher, class, subject..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1050px] text-left">

            <thead className="bg-gray-50">
              <tr className="text-xs uppercase tracking-wider text-gray-500">

                <th className="px-5 py-4">Teacher</th>

                <th className="px-5 py-4">Assigned Classes</th>

                <th className="px-5 py-4">Assigned Subjects</th>

                <th className="px-5 py-4">Monthly Salary</th>

                <th className="px-5 py-4 text-center">Actions</th>

              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <RefreshCw
                      size={22}
                      className="mx-auto mb-2 animate-spin"
                    />
                    Loading teachers...
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">
                    <Users size={30} className="mx-auto mb-2 text-gray-300" />
                    No teachers found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => (

                  <tr
                    key={teacher._id}
                    className="transition hover:bg-gray-50"
                  >

                    {/* Teacher */}

                    <td className="px-5 py-4">

                      <div className="flex items-center gap-3">

                        {teacher.profilePicture ? (
                          <img
                            src={teacher.profilePicture}
                            alt={teacher.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <UserRound size={20} />
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-gray-800">
                            {teacher.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            Teacher
                          </p>
                        </div>

                      </div>

                      <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                        <Mail size={13} />
                        {teacher.email}
                      </p>

                    </td>

                    {/* Assigned Classes */}

                    <td className="px-5 py-4">

                      {teacher.assignedClasses.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">

                          {teacher.assignedClasses.slice(0, 3).map((item) => (
                            <span
                              key={item._id}
                              className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                            >
                              {item.className}
                              {item.section ? ` - ${item.section}` : ""}
                            </span>
                          ))}

                          {teacher.assignedClasses.length > 3 && (
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              +{teacher.assignedClasses.length - 3} more
                            </span>
                          )}

                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Not assigned
                        </span>
                      )}

                    </td>

                    {/* Assigned Subjects */}

                    <td className="px-5 py-4">

                      {teacher.assignedSubjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">

                          {teacher.assignedSubjects.slice(0, 3).map((subject) => (
                            <span
                              key={subject._id}
                              className="rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700"
                            >
                              {subject.subjectName}
                            </span>
                          ))}

                          {teacher.assignedSubjects.length > 3 && (
                            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                              +{teacher.assignedSubjects.length - 3} more
                            </span>
                          )}

                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Not assigned
                        </span>
                      )}

                    </td>

                    {/* Salary */}

                    <td className="px-5 py-4">

                      <p className="font-semibold text-gray-800">
                        {formatMoney(teacher.monthlySalary)}
                      </p>

                      <span
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-xs ${
                          teacher.monthlySalary > 0
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {teacher.monthlySalary > 0
                          ? "Fixed Salary"
                          : "Not Set"}
                      </span>

                    </td>

                    {/* Actions */}

                    <td className="px-5 py-4">

                      <div className="flex items-center justify-center gap-2">

                        <button
                          onClick={() => openDetails(teacher)}
                          title="View Details"
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          onClick={() => openSalaryModal(teacher)}
                          title="Update Salary"
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil size={14} />
                          {teacher.monthlySalary > 0 ? "Update" : "Set Salary"}
                        </button>

                      </div>

                    </td>

                  </tr>

                ))
              )}

            </tbody>

          </table>

        </div>

        <div className="border-t border-gray-200 px-5 py-4 text-sm text-gray-500">
          Showing {filteredTeachers.length} of {teachers.length} teachers
        </div>

      </div>

      {/* Add Teacher Modal */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Add New Teacher
                </h2>

                <p className="text-sm text-gray-500">
                  Create a teacher account.
                </p>
              </div>

              <button onClick={closeModals}>
                <X size={22} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddTeacher} className="space-y-4 p-5">

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Teacher Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder="Enter teacher name"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="teacher@example.com"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder="Enter password"
                  minLength={5}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Adding..." : "Add Teacher"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* Salary Modal */}

      {showSalaryModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Manage Monthly Salary
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedTeacher.name}
                </p>
              </div>

              <button onClick={closeModals}>
                <X size={22} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSalaryUpdate} className="space-y-5 p-5">

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Monthly Salary (৳)
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  placeholder="Enter monthly salary"
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-gray-500">
                  Monthly Salary Preview
                </p>

                <p className="mt-1 text-xl font-bold text-blue-700">
                  {formatMoney(monthlySalary)}
                </p>
              </div>

              <div className="flex justify-end gap-3">

                <button
                  type="button"
                  onClick={closeModals}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={salarySaving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {salarySaving ? "Saving..." : "Update Salary"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* Teacher Details Modal */}

      {showDetails && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">

          <div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b p-5">

              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Teacher Details
                </h2>

                <p className="text-sm text-gray-500">
                  Complete teacher assignment information.
                </p>
              </div>

              <button onClick={closeModals}>
                <X size={22} className="text-gray-500" />
              </button>

            </div>

            <div className="space-y-5 p-5">

              {/* Basic Information */}

              <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center">

                {selectedTeacher.profilePicture ? (
                  <img
                    src={selectedTeacher.profilePicture}
                    alt={selectedTeacher.name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <UserRound size={30} />
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    {selectedTeacher.name}
                  </h3>

                  <p className="text-sm text-gray-500">
                    {selectedTeacher.email}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-green-700">
                    Monthly Salary: {formatMoney(selectedTeacher.monthlySalary)}
                  </p>
                </div>

              </div>

              {/* Assigned Classes */}

              <div>

                <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
                  <GraduationCap size={19} className="text-blue-600" />
                  Assigned Classes ({selectedTeacher.assignedClasses?.length || 0})
                </h3>

                {selectedTeacher.assignedClasses?.length > 0 ? (
                  <div className="space-y-3">

                    {selectedTeacher.assignedClasses.map((item) => (

                      <div
                        key={item._id}
                        className="rounded-lg border border-gray-200 p-4"
                      >

                        <div className="flex items-center gap-2 font-semibold text-gray-800">
                          <CalendarDays size={17} className="text-blue-600" />
                          {getClassName(item)}
                        </div>

                        <div className="mt-3">

                          <p className="mb-2 text-xs font-medium uppercase text-gray-500">
                            Subjects in this class
                          </p>

                          {item.subjects?.length > 0 ? (
                            <div className="flex flex-wrap gap-2">

                              {item.subjects.map((subject) => (
                                <span
                                  key={subject._id}
                                  className="flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1.5 text-xs font-medium text-purple-700"
                                >
                                  <BookOpen size={13} />
                                  {subject.subjectName}
                                  {subject.subjectCode
                                    ? ` (${subject.subjectCode})`
                                    : ""}
                                </span>
                              ))}

                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">
                              No subject found.
                            </p>
                          )}

                        </div>

                      </div>

                    ))}

                  </div>
                ) : (
                  <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    This teacher has not been assigned to any class yet.
                  </p>
                )}

              </div>

              <div className="flex justify-end border-t pt-4">

                <button
                  onClick={closeModals}
                  className="rounded-lg bg-gray-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-600"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Teachers;

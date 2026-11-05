
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  Wallet,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Users,
  ReceiptText,
  CreditCard,
  Eye,
  Printer,
} from "lucide-react";
import api from "../../services/api";

const getCurrentMonth = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const initialForm = {
  teacher: "",
  month: getCurrentMonth(),
};

const formatMoney = (amount) =>
  `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;

const getDueAmount = (salary) =>
  Math.max(
    0,
    Number(
      salary.dueAmount ??
        Number(salary.salaryAmount || 0) -
          Number(salary.paidAmount || 0)
    )
  );

const getStatus = (salary) => {
  if (salary.status) return salary.status;

  const due = getDueAmount(salary);
  const paid = Number(salary.paidAmount || 0);

  if (due <= 0) return "Paid";
  if (paid > 0) return "Partial";
  return "Due";
};

const escapeHTML = (value) => {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
};

function SummaryCard({ title, amount, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-500 sm:text-sm">
          {title}
        </p>

        <div className={`shrink-0 rounded-lg p-2 ${colors[color]}`}>
          {icon}
        </div>
      </div>

      <h2 className="mt-3 break-words text-lg font-bold text-gray-800 sm:mt-4 sm:text-2xl">
        {amount}
      </h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Paid: "bg-green-100 text-green-700",
    Partial: "bg-amber-100 text-amber-700",
    Due: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || styles.Due
      }`}
    >
      {status === "Paid" ? (
        <CheckCircle size={14} />
      ) : (
        <Clock size={14} />
      )}
      {status}
    </span>
  );
}

export default function Salary() {
  const [salaries, setSalaries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");

  // Salary report states
  const [reportMonth, setReportMonth] = useState(getCurrentMonth());
  const [schoolInfo, setSchoolInfo] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [payslipLoading, setPayslipLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentSalary, setPaymentSalary] = useState(null);
  const [payslip, setPayslip] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [paidAmount, setPaidAmount] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") ||
          localStorage.getItem("tasmina_user") ||
          "{}"
      );
    } catch {
      return {};
    }
  })();

  const role = (
    localStorage.getItem("role") ||
    storedUser.role ||
    ""
  ).toLowerCase();

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";

  const selectedTeacher = teachers.find(
    (teacher) => teacher._id === form.teacher
  );

  const hasOpenModal =
    showCreateModal || !!paymentSalary || !!payslip;

  // Load salary records
  const loadSalaries = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      if (isAdmin) {
        const response = await api.get("/salary/allsalaries");
        const list = response.data?.data?.salaries;

        setSalaries(Array.isArray(list) ? list : []);
      } else if (isTeacher) {
        const response = await api.get("/salary/teacher-salary");
        const list = response.data?.data?.salaries;

        setSalaries(Array.isArray(list) ? list : []);
      } else {
        setSalaries([]);
        setError("User role not found. Please log in again.");
      }
    } catch (err) {
      setSalaries([]);
      setError(
        err.response?.data?.message ||
          "Failed to load salary records."
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  // Load teachers
  const loadTeachers = async () => {
    if (!isAdmin) return;

    try {
      const response = await api.get("/teacher/all-teachers");
      const data = response.data?.data;

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.teachers)) {
        list = data.teachers;
      } else if (Array.isArray(data?.users)) {
        list = data.users;
      }

      setTeachers(
        list.filter((teacher) => teacher.role === "teacher")
      );
    } catch (err) {
      setTeachers([]);
      setError(
        err.response?.data?.message ||
          "Failed to load teachers."
      );
    }
  };

  // Load school information
  const loadSchoolInfo = async () => {
    try {
      const response = await api.get("/settings/school-info");

      const data =
        response.data?.data?.school ||
        response.data?.school ||
        response.data?.data ||
        response.data;

      setSchoolInfo(data || {});
    } catch (err) {
      console.log("School information could not be loaded.");
      setSchoolInfo({});
    }
  };

  const refreshData = async () => {
    setError("");

    await Promise.all([
      loadSalaries(),
      isAdmin ? loadTeachers() : Promise.resolve(),
    ]);
  };

  useEffect(() => {
    refreshData();

    if (isAdmin) {
      loadSchoolInfo();
    }
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    if (saving) return;

    setShowCreateModal(false);
    setForm(initialForm);
    setError("");
  };

  const closePaymentModal = () => {
    if (saving) return;

    setPaymentSalary(null);
    setPaidAmount("");
    setError("");
  };

  // Create salary
  const handleCreateSalary = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.teacher || !form.month) {
      setError("Please select a teacher and salary month.");
      return;
    }

    const fixedSalary = Number(selectedTeacher?.monthlySalary || 0);

    if (!Number.isFinite(fixedSalary) || fixedSalary <= 0) {
      setError(
        "Please set a valid fixed monthly salary for this teacher first."
      );
      return;
    }

    setSaving(true);

    try {
      const response = await api.post("/salary/create", {
        teacher: form.teacher,
        month: form.month,
      });

      setSuccess(
        response.data?.message ||
          "Salary created successfully."
      );

      setShowCreateModal(false);
      setForm(initialForm);

      await loadSalaries();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create salary."
      );
    } finally {
      setSaving(false);
    }
  };

  // Record payment
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentSalary) return;

    setError("");
    setSuccess("");

    const amount = Number(paidAmount);
    const due = getDueAmount(paymentSalary);

    if (
      paidAmount === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Payment amount must be greater than zero.");
      return;
    }

    if (amount > due) {
      setError("Payment amount cannot exceed the due amount.");
      return;
    }

    setSaving(true);

    try {
      const response = await api.patch(
        `/salary/payment/${paymentSalary._id}`,
        { paidAmount: amount }
      );

      setSuccess(
        response.data?.message ||
          "Payment updated successfully."
      );

      setPaymentSalary(null);
      setPaidAmount("");

      await loadSalaries();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update salary payment."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete salary
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this salary record?"
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");
    setDeletingId(id);

    try {
      const response = await api.delete(`/salary/delete/${id}`);

      setSuccess(
        response.data?.message ||
          "Salary deleted successfully."
      );

      await loadSalaries();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete salary."
      );
    } finally {
      setDeletingId("");
    }
  };

  // View payslip
  const handleViewPayslip = async (id) => {
    setError("");
    setSuccess("");
    setPayslipLoading(true);

    try {
      const response = await api.get(`/salary/payslip/${id}`);
      setPayslip(response.data?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load payslip."
      );
    } finally {
      setPayslipLoading(false);
    }
  };

  // Print monthly salary report - Admin only
  const handlePrintSalaryReport = () => {
    if (!isAdmin) {
      setError("Only admin can print the salary report.");
      return;
    }

    // Match YYYY-MM and date-like month values
    const reportSalaries = salaries.filter((salary) => {
      const salaryMonth = String(salary.month || "").slice(0, 7);
      return salaryMonth === reportMonth;
    });

    if (reportSalaries.length === 0) {
      setError("No salary records found for the selected month.");
      return;
    }

    const [year, month] = reportMonth.split("-");

    const monthName = new Date(
      Number(year),
      Number(month) - 1
    ).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const schoolName =
      schoolInfo.schoolName || schoolInfo.name || "My School";

    const schoolAddress =
      schoolInfo.schoolAddress || schoolInfo.address || "";

    const schoolPhone =
      schoolInfo.schoolPhone || schoolInfo.phone || "";

    const schoolEmail =
      schoolInfo.schoolEmail || schoolInfo.email || "";

    const schoolLogo =
      schoolInfo.logo || schoolInfo.schoolLogo || "";

    const tableRows = reportSalaries
      .map((salary, index) => {
        const teacher = salary.teacher || {};
        const status = getStatus(salary);

        const paymentDate = salary.paymentDate
          ? new Date(salary.paymentDate).toLocaleDateString("en-GB")
          : "N/A";

        return `
          <tr>
            <td>${index + 1}</td>
            <td>
              <strong>${escapeHTML(teacher.name || "Teacher")}</strong>
            </td>
            <td>${escapeHTML(teacher.email || "N/A")}</td>
            <td>${formatMoney(salary.salaryAmount)}</td>
            <td>${formatMoney(salary.paidAmount)}</td>
            <td>${formatMoney(getDueAmount(salary))}</td>
            <td>${escapeHTML(status)}</td>
            <td>${escapeHTML(paymentDate)}</td>
          </tr>
        `;
      })
      .join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      setError(
        "Please allow pop-ups in your browser to print the report."
      );
      return;
    }

    const logoHTML = schoolLogo
      ? `<img src="${escapeHTML(schoolLogo)}" alt="School Logo" class="school-logo" />`
      : "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Teacher Salary Report - ${escapeHTML(monthName)}</title>
          <meta charset="UTF-8" />

          <style>
            @page {
              size: A4 landscape;
              margin: 15mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #111;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
            }

            .school-header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
              padding-bottom: 15px;
              border-bottom: 2px solid #222;
              text-align: center;
            }

            .school-logo {
              width: 65px;
              height: 65px;
              object-fit: contain;
              filter: grayscale(100%);
            }

            .school-details h1 {
              margin: 0 0 6px;
              font-size: 23px;
              font-weight: 700;
              color: #111;
            }

            .school-details p {
              margin: 3px 0;
              font-size: 11px;
              color: #333;
            }

            .report-heading {
              margin: 22px 0 20px;
              text-align: center;
            }

            .report-heading h2 {
              margin: 0 0 7px;
              font-size: 19px;
              font-weight: 700;
              letter-spacing: 1px;
              text-transform: uppercase;
            }

            .report-heading p {
              margin: 0;
              font-size: 12px;
              color: #444;
            }

            .report-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 12px;
              font-size: 11px;
              color: #333;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: auto;
            }

            thead {
              border-top: 1.5px solid #222;
              border-bottom: 1.5px solid #222;
            }

            th {
              padding: 11px 9px;
              text-align: left;
              font-size: 10.5px;
              font-weight: 700;
              color: #111;
              background: #fff;
              white-space: nowrap;
            }

            td {
              padding: 12px 9px;
              text-align: left;
              font-size: 10.5px;
              color: #222;
              border-bottom: 1px solid #d6d6d6;
              vertical-align: middle;
            }

            tbody tr:last-child {
              border-bottom: 1.5px solid #222;
            }

            td strong {
              font-weight: 600;
            }

            .report-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 55px;
              font-size: 11px;
              color: #333;
            }

            .signature {
              width: 190px;
              text-align: center;
            }

            .signature-line {
              padding-top: 8px;
              border-top: 1px solid #222;
            }

            @media print {
              body {
                background: #fff !important;
                color: #000 !important;
              }

              thead {
                display: table-header-group;
              }

              tr {
                page-break-inside: avoid;
              }

              * {
                -webkit-print-color-adjust: economy !important;
                print-color-adjust: economy !important;
              }
            }
          </style>
        </head>

        <body>
          <header class="school-header">
            ${logoHTML}

            <div class="school-details">
              <h1>${escapeHTML(schoolName)}</h1>

              ${schoolAddress
                ? `<p>${escapeHTML(schoolAddress)}</p>`
                : ""}

              ${schoolPhone
                ? `<p>Phone: ${escapeHTML(schoolPhone)}</p>`
                : ""}

              ${schoolEmail
                ? `<p>Email: ${escapeHTML(schoolEmail)}</p>`
                : ""}
            </div>
          </header>

          <section class="report-heading">
            <h2>Teacher Salary Report</h2>
            <p>${escapeHTML(monthName)}</p>
          </section>

          <div class="report-info">
            <span>Salary Records: ${reportSalaries.length}</span>
            <span>Report Month: ${escapeHTML(reportMonth)}</span>
          </div>

          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Teacher Name</th>
                <th>Email</th>
                <th>Total Salary</th>
                <th>Paid Amount</th>
                <th>Due Amount</th>
                <th>Status</th>
                <th>Payment Date</th>
              </tr>
            </thead>

            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <footer class="report-footer">
            <div>
              Printed on:
              ${escapeHTML(new Date().toLocaleDateString("en-GB"))}
            </div>

            <div class="signature">
              <div class="signature-line">
                Authorized Signature
              </div>
            </div>
          </footer>

          <script>
            window.onload = function () {
              const images = Array.from(document.images);

              Promise.all(
                images.map((image) => {
                  if (image.complete) {
                    return Promise.resolve();
                  }

                  return new Promise((resolve) => {
                    image.onload = resolve;
                    image.onerror = resolve;
                  });
                })
              ).then(() => {
                setTimeout(() => {
                  window.print();
                }, 300);
              });
            };

            window.onafterprint = function () {
              window.close();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    setError("");
  };

  // Search filter
  const filteredSalaries = salaries.filter((salary) => {
    const teacher = salary.teacher || {};

    const searchableText = [
      teacher.name,
      teacher.email,
      salary.month,
      getStatus(salary),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  const totalSalary = filteredSalaries.reduce(
    (sum, salary) =>
      sum + Number(salary.salaryAmount || 0),
    0
  );

  const totalPaid = filteredSalaries.reduce(
    (sum, salary) =>
      sum + Number(salary.paidAmount || 0),
    0
  );

  const totalDue = filteredSalaries.reduce(
    (sum, salary) => sum + getDueAmount(salary),
    0
  );

  return (
    <div className="min-h-screen min-w-0 w-full space-y-5 bg-gray-50 p-3 sm:space-y-6 sm:p-5 lg:p-8">
      {/* Payslip Print Styles */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden !important;
            }

            #salary-payslip,
            #salary-payslip * {
              visibility: visible !important;
            }

            #salary-payslip {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              border: none !important;
              padding: 20px !important;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Salary Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage teacher salaries, payments and payslips.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:px-4"
            >
              <Plus size={18} />
              Add Salary
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && !hasOpenModal && (
        <div
          role="alert"
          className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          role="status"
          className="break-words rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {/* Summary Cards - Dashboard UI */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <SummaryCard
          title="Total Salary"
          amount={formatMoney(totalSalary)}
          icon={<Wallet size={20} />}
          color="blue"
        />

        <SummaryCard
          title="Total Paid"
          amount={formatMoney(totalPaid)}
          icon={<CheckCircle size={20} />}
          color="green"
        />

        <div className="col-span-2 xl:col-span-1">
          <SummaryCard
            title="Total Due"
            amount={formatMoney(totalDue)}
            icon={<AlertCircle size={20} />}
            color="red"
          />
        </div>
      </div>

      {/* Salary Table */}
      <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isTeacher ? "My Salary History" : "Salary Records"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredSalaries.length} record(s) found
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            {isAdmin && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  aria-label="Select salary report month"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 sm:w-auto"
                />

                <button
                  type="button"
                  onClick={handlePrintSalaryReport}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-gray-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                >
                  <Printer size={16} />
                  Print Report
                </button>
              </div>
            )}

            <div className="relative w-full sm:max-w-sm">
              <Search
                size={19}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search teacher, month or status..."
                className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 font-semibold">Teacher</th>
                <th className="px-4 py-3 font-semibold">Month</th>
                <th className="px-4 py-3 font-semibold">Salary</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading salary records...
                  </td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Wallet size={32} />

                      <p className="font-medium">
                        No salary records found
                      </p>

                      <p className="text-xs">
                        {search
                          ? "Try another search term."
                          : "No salary records are available yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSalaries.map((salary) => {
                  const teacher = salary.teacher || {};
                  const status = getStatus(salary);
                  const due = getDueAmount(salary);

                  return (
                    <tr
                      key={salary._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Users size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800">
                              {teacher.name || "Teacher"}
                            </p>

                            <p className="mt-1 break-all text-xs text-gray-500">
                              {teacher.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-700">
                        {salary.month}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-800">
                        {formatMoney(salary.salaryAmount)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium text-green-700">
                        {formatMoney(salary.paidAmount)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium text-red-600">
                        {formatMoney(due)}
                      </td>

                      <td className="px-4 py-4">
                        <StatusBadge status={status} />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="View payslip"
                            aria-label="View payslip"
                            disabled={payslipLoading}
                            onClick={() =>
                              handleViewPayslip(salary._id)
                            }
                            className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 disabled:opacity-40"
                          >
                            <Eye size={17} />
                          </button>

                          {isAdmin && due > 0 && (
                            <button
                              type="button"
                              title="Record payment"
                              aria-label="Record payment"
                              onClick={() => {
                                setError("");
                                setPaidAmount("");
                                setPaymentSalary(salary);
                              }}
                              className="rounded-lg p-2 text-green-600 transition hover:bg-green-50"
                            >
                              <CreditCard size={17} />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              title="Delete salary"
                              aria-label="Delete salary"
                              disabled={!!deletingId}
                              onClick={() =>
                                handleDelete(salary._id)
                              }
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2
                                size={17}
                                className={
                                  deletingId === salary._id
                                    ? "animate-pulse"
                                    : ""
                                }
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Salary Modal */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5">
          <div className="my-auto flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                  Create Salary
                </h2>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Select a teacher and month. Fixed salary will be
                  used automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={closeCreateModal}
                disabled={saving}
                aria-label="Close modal"
                className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreateSalary}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                {error && (
                  <div
                    role="alert"
                    className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="teacher"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Select Teacher *
                  </label>

                  <select
                    id="teacher"
                    name="teacher"
                    value={form.teacher}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose a teacher</option>

                    {teachers.map((teacher) => (
                      <option
                        key={teacher._id}
                        value={teacher._id}
                      >
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                  </select>

                  {teachers.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      No teachers found. Check the teacher API and
                      login as admin.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="month"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Salary Month *
                  </label>

                  <input
                    id="month"
                    type="month"
                    name="month"
                    value={form.month}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Fixed Monthly Salary
                  </label>

                  <input
                    type="text"
                    value={
                      selectedTeacher
                        ? formatMoney(selectedTeacher.monthlySalary)
                        : "Select a teacher"
                    }
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700"
                  />

                  {selectedTeacher &&
                    Number(selectedTeacher.monthlySalary || 0) <= 0 && (
                      <p className="mt-1 text-xs text-red-600">
                        Set this teacher's fixed salary in Teacher
                        Management first.
                      </p>
                    )}
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    teachers.length === 0 ||
                    !selectedTeacher ||
                    Number(selectedTeacher?.monthlySalary || 0) <= 0
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving ? "Saving..." : "Create Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentSalary && isAdmin && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5">
          <div className="my-auto flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                  Record Salary Payment
                </h2>

                <p className="mt-1 break-words text-xs text-gray-500 sm:text-sm">
                  {paymentSalary.teacher?.name || "Teacher"} —{" "}
                  {paymentSalary.month}
                </p>
              </div>

              <button
                type="button"
                onClick={closePaymentModal}
                disabled={saving}
                aria-label="Close payment modal"
                className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handlePayment}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
                {error && (
                  <div
                    role="alert"
                    className="break-words rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <div className="space-y-3 rounded-lg bg-gray-50 p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">
                      Total Salary
                    </span>

                    <span className="font-semibold">
                      {formatMoney(paymentSalary.salaryAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">
                      Already Paid
                    </span>

                    <span className="font-semibold text-green-700">
                      {formatMoney(paymentSalary.paidAmount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-gray-600">
                      Remaining Due
                    </span>

                    <span className="font-semibold text-red-600">
                      {formatMoney(getDueAmount(paymentSalary))}
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="paidAmount"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    New Payment Amount (৳) *
                  </label>

                  <input
                    id="paidAmount"
                    type="number"
                    value={paidAmount}
                    onChange={(e) =>
                      setPaidAmount(e.target.value)
                    }
                    min="0.01"
                    max={getDueAmount(paymentSalary)}
                    step="0.01"
                    required
                    placeholder="Enter payment amount"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {payslip && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5">
          <div className="my-auto flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-2">
                <ReceiptText
                  className="shrink-0 text-blue-600"
                  size={24}
                />

                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                    Salary Payslip
                  </h2>

                  <p className="text-xs text-gray-500">
                    Payment details
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPayslip(null)}
                aria-label="Close payslip"
                className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div
                id="salary-payslip"
                className="space-y-4 rounded-xl border border-gray-200 p-4 sm:p-5"
              >
                <div className="border-b border-dashed border-gray-200 pb-4">
                  <p className="text-xs text-gray-500">
                    Payslip Number
                  </p>

                  <p className="mt-1 break-all font-semibold text-gray-800">
                    {payslip.paySlipNumber || "N/A"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">
                      Teacher Name
                    </p>

                    <p className="mt-1 break-words font-semibold text-gray-800">
                      {payslip.teacher?.name || "Teacher"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email</p>

                    <p className="mt-1 break-all font-medium text-gray-800">
                      {payslip.teacher?.email || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Salary Month
                    </p>

                    <p className="mt-1 font-semibold text-gray-800">
                      {payslip.month || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">
                      Payment Date
                    </p>

                    <p className="mt-1 font-medium text-gray-800">
                      {payslip.paymentDate
                        ? new Date(
                            payslip.paymentDate
                          ).toLocaleDateString()
                        : "Not paid yet"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-dashed border-gray-200 pt-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-600">
                      Total Salary
                    </span>

                    <span className="font-semibold">
                      {formatMoney(payslip.salaryAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-600">
                      Paid Amount
                    </span>

                    <span className="font-semibold text-green-700">
                      {formatMoney(payslip.paidAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-gray-600">
                      Due Amount
                    </span>

                    <span className="font-semibold text-red-600">
                      {formatMoney(
                        payslip.dueAmount ??
                          Math.max(
                            0,
                            Number(payslip.salaryAmount || 0) -
                              Number(payslip.paidAmount || 0)
                          )
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                    <span className="font-medium text-gray-700">
                      Status
                    </span>

                    <StatusBadge status={getStatus(payslip)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="no-print flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 sm:flex-row sm:justify-end sm:p-5">
              <button
                type="button"
                onClick={() => setPayslip(null)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
              >
                <Printer size={17} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


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
  Printer,
} from "lucide-react";
import api from "../../services/api";

const initialForm = {
  student: "",
  totalFee: "",
  paidAmount: "0",
};

const getDueAmount = (totalFee, paidAmount) =>
  Math.max(0, Number(totalFee || 0) - Number(paidAmount || 0));

const getPaymentStatus = (totalFee, paidAmount) => {
  const total = Number(totalFee || 0);
  const paid = Number(paidAmount || 0);

  if (paid === total) return "Paid";
  if (paid > 0) return "Partial";
  return "Due";
};

const formatMoney = (amount) =>
  `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });

const formatDate = (date) => {
  if (!date) return "Not recorded";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not recorded";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

function SummaryCard({ title, amount, icon, color }) {
  const colorClasses = {
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

        <div className={`shrink-0 rounded-lg p-2 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>

      <h2 className="mt-3 break-words text-lg font-bold text-gray-800 sm:mt-4 sm:text-2xl">
        {amount}
      </h2>
    </div>
  );
}

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [schoolInfo, setSchoolInfo] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [printingId, setPrintingId] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

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

  // Load school information for receipt
  const loadSchoolInfo = async () => {
    try {
      const response = await api.get("/settings/school-info");

      const school =
        response.data?.data?.school ||
        response.data?.school ||
        {};

      setSchoolInfo(school);
      return school;
    } catch (err) {
      console.error("School information load failed:", err);
      return {};
    }
  };

  const loadFees = async () => {
    setLoading(true);
    setError("");

    try {
      if (isAdmin) {
        const response = await api.get("/fee/all");
        const feeData = response.data?.data?.fees;

        setFees(Array.isArray(feeData) ? feeData : []);

        try {
          const studentResponse = await api.get(
            "/student/all-students"
          );

          const studentData = studentResponse.data?.data;

          let studentList = [];

          if (Array.isArray(studentData)) {
            studentList = studentData;
          } else if (Array.isArray(studentData?.students)) {
            studentList = studentData.students;
          }

          setStudents(
            studentList.filter(
              (student) => student.role === "student"
            )
          );
        } catch {
          setStudents([]);
        }
      } else {
        const response = await api.get("/fee/student-fees");
        const feeData = response.data?.data;

        setFees(
          Array.isArray(feeData)
            ? feeData
            : feeData
              ? [feeData]
              : []
        );
      }
    } catch (err) {
      setFees([]);
      setError(
        err.response?.data?.message ||
          "Fee records load, API ও login token check"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();

    if (isAdmin) {
      loadSchoolInfo();
    }
  }, []);

  // Print individual fee receipt
  const handlePrintReceipt = async (fee) => {
    if (!isAdmin) {
      setError("You are not authorized to print fee receipts.");
      return;
    }

    // Open window immediately to avoid browser popup blocking
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setError("Please allow pop-ups to print the receipt.");
      return;
    }

    setPrintingId(fee._id);
    setError("");

    try {
      let school = schoolInfo;

      if (!school.schoolName) {
        school = await loadSchoolInfo();
      }

      const student = fee.student || {};

      const totalFee = Number(fee.totalFee || 0);
      const paidAmount = Number(fee.paidAmount || 0);

      const dueAmount = Number(
        fee.dueAmount ?? getDueAmount(totalFee, paidAmount)
      );

      const status =
        fee.status || getPaymentStatus(totalFee, paidAmount);

      const studentName = student.name || "Student";
      const studentEmail = student.email || "Not available";
      const studentId = student._id || student.id || "Not available";

      const className =
        student.classId?.name ||
        student.class?.name ||
        student.className ||
        "Not available";

      const rollNumber =
        student.rollNumber ||
        student.roll ||
        "Not available";

      const paymentDate = formatDate(
        fee.paymentDate || fee.updatedAt || fee.createdAt
      );

      const receiptNumber = fee._id
        ? `FEE-${String(fee._id).slice(-8).toUpperCase()}`
        : "Not available";

      const schoolName = escapeHTML(
        school.schoolName || "My School"
      );

      const logo = school.schoolLogo
        ? `<img src="${escapeHTML(school.schoolLogo)}" class="school-logo" alt="School Logo" />`
        : "";

      printWindow.document.open();

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Fee Receipt - ${escapeHTML(receiptNumber)}</title>

          <meta charset="UTF-8" />

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 35px;
              font-family: Arial, sans-serif;
              color: #1f2937;
              background: #fff;
            }

            .receipt {
              max-width: 760px;
              margin: auto;
              border: 1px solid #d1d5db;
              padding: 35px;
            }

            .school-header {
              text-align: center;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 25px;
            }

            .school-logo {
              width: 75px;
              height: 75px;
              object-fit: contain;
              margin-bottom: 10px;
            }

            .school-header h1 {
              margin: 5px 0;
              font-size: 25px;
              color: #1e40af;
            }

            .school-header p {
              margin: 5px 0;
              font-size: 12px;
              color: #4b5563;
            }

            .receipt-title {
              text-align: center;
              margin: 20px 0;
            }

            .receipt-title h2 {
              margin: 0;
              font-size: 21px;
              letter-spacing: 2px;
            }

            .receipt-number {
              text-align: right;
              font-size: 12px;
              margin-bottom: 20px;
            }

            .section-title {
              font-size: 14px;
              font-weight: bold;
              color: #1e40af;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 8px;
              margin: 22px 0 12px;
            }

            .details {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 14px 25px;
            }

            .detail-item {
              font-size: 13px;
            }

            .detail-item span {
              display: block;
              color: #6b7280;
              font-size: 11px;
              margin-bottom: 4px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }

            th, td {
              border: 1px solid #d1d5db;
              padding: 12px;
              font-size: 13px;
              text-align: left;
            }

            th {
              background: #eff6ff;
            }

            .amount {
              text-align: right;
              font-weight: bold;
            }

            .status {
              display: inline-block;
              padding: 5px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
            }

            .paid {
              background: #dcfce7;
              color: #15803d;
            }

            .partial {
              background: #fef3c7;
              color: #b45309;
            }

            .due {
              background: #fee2e2;
              color: #b91c1c;
            }

            .payment-info {
              margin-top: 20px;
              font-size: 13px;
              line-height: 1.8;
            }

            .signature-area {
              display: flex;
              justify-content: space-between;
              gap: 30px;
              margin-top: 85px;
            }

            .signature {
              width: 200px;
              border-top: 1px solid #374151;
              text-align: center;
              padding-top: 8px;
              font-size: 12px;
            }

            .footer {
              text-align: center;
              margin-top: 35px;
              border-top: 1px solid #e5e7eb;
              padding-top: 15px;
              color: #6b7280;
              font-size: 11px;
            }

            .print-button {
              display: block;
              margin: 20px auto;
              padding: 11px 25px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            }

            @media print {
              body {
                padding: 0;
              }

              .receipt {
                border: none;
                padding: 15px;
              }

              .print-button {
                display: none;
              }

              @page {
                size: A4;
                margin: 15mm;
              }
            }

            @media (max-width: 550px) {
              body {
                padding: 10px;
              }

              .receipt {
                padding: 15px;
              }

              .details {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>

        <body>
          <div class="receipt">

            <div class="school-header">
              ${logo}

              <h1>${schoolName}</h1>

              <p>${escapeHTML(school.schoolAddress || "")}</p>
              <p>
                ${school.schoolEmail ? `Email: ${escapeHTML(school.schoolEmail)}` : ""}
                ${school.schoolPhone ? ` | Phone: ${escapeHTML(school.schoolPhone)}` : ""}
              </p>
            </div>

            <div class="receipt-title">
              <h2>FEE PAYMENT RECEIPT</h2>
            </div>

            <div class="receipt-number">
              <strong>Receipt No:</strong> ${escapeHTML(receiptNumber)}
              <br />
              <strong>Payment Date:</strong> ${escapeHTML(paymentDate)}
            </div>

            <div class="section-title">STUDENT INFORMATION</div>

            <div class="details">
              <div class="detail-item">
                <span>Student Name</span>
                <strong>${escapeHTML(studentName)}</strong>
              </div>

              <div class="detail-item">
                <span>Student ID</span>
                <strong>${escapeHTML(studentId)}</strong>
              </div>

              <div class="detail-item">
                <span>Email</span>
                <strong>${escapeHTML(studentEmail)}</strong>
              </div>

              <div class="detail-item">
                <span>Class</span>
                <strong>${escapeHTML(className)}</strong>
              </div>

              <div class="detail-item">
                <span>Roll Number</span>
                <strong>${escapeHTML(rollNumber)}</strong>
              </div>
            </div>

            <div class="section-title">FEE PAYMENT DETAILS</div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td>Fee Type</td>
                  <td class="amount">${escapeHTML(fee.feeType || "Not specified")}</td>
                </tr>

                <tr>
                  <td>Total Fee</td>
                  <td class="amount">${escapeHTML(formatMoney(totalFee))}</td>
                </tr>

                <tr>
                  <td>Paid Amount</td>
                  <td class="amount">${escapeHTML(formatMoney(paidAmount))}</td>
                </tr>

                <tr>
                  <td>Due Amount</td>
                  <td class="amount">${escapeHTML(formatMoney(dueAmount))}</td>
                </tr>
              </tbody>
            </table>

            <div class="payment-info">
              <strong>Payment Method:</strong>
              ${escapeHTML(fee.paymentMethod || "Not recorded")}
              <br />

              <strong>Payment Status:</strong>
              <span class="status ${
                status === "Paid"
                  ? "paid"
                  : status === "Partial"
                    ? "partial"
                    : "due"
              }">
                ${escapeHTML(status)}
              </span>
            </div>

            <div class="signature-area">
              <div class="signature">Student / Guardian Signature</div>
              <div class="signature">Authorized Signature</div>
            </div>

            <div class="footer">
              This is a computer-generated fee receipt.
              <br />
              Thank you.
            </div>
          </div>

          <button class="print-button" onclick="window.print()">
            Print Receipt
          </button>

          <script>
            window.onload = function () {
              const images = Array.from(document.images);

              Promise.all(
                images.map((image) => {
                  if (image.complete) return Promise.resolve();

                  return new Promise((resolve) => {
                    image.onload = resolve;
                    image.onerror = resolve;
                  });
                })
              ).then(() => {
                setTimeout(() => window.print(), 400);
              });
            };
          </script>
        </body>
        </html>
      `);

      printWindow.document.close();
    } catch (err) {
      printWindow.close();

      setError(
        err.response?.data?.message ||
          "Receipt could not be prepared for printing."
      );
    } finally {
      setPrintingId("");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setForm(initialForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setForm(initialForm);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const totalFee = Number(form.totalFee);
    const paidAmount = Number(form.paidAmount);

    if (!form.student) {
      setError("Please select a student.");
      return;
    }

    if (
      form.totalFee === "" ||
      form.paidAmount === "" ||
      !Number.isFinite(totalFee) ||
      !Number.isFinite(paidAmount) ||
      totalFee < 0 ||
      paidAmount < 0
    ) {
      setError("Please enter valid fee amounts. Negative amounts are not allowed.");
      return;
    }

    if (paidAmount > totalFee) {
      setError("Paid amount cannot be greater than total fee.");
      return;
    }

    setSaving(true);

    try {
      const response = await api.post("/fee/create", {
        student: form.student,
        totalFee,
        paidAmount,
      });

      setSuccess(
        response.data?.message || "Fee successfully created."
      );

      setShowForm(false);
      setForm(initialForm);

      await loadFees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Fee creation failed. Please check the backend response."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (feeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this fee record?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(feeId);

    try {
      const response = await api.delete(
        `/fee/delete/${feeId}`
      );

      setSuccess(
        response.data?.message || "Fee successfully deleted."
      );

      await loadFees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Fee deletion failed."
      );
    } finally {
      setDeletingId("");
    }
  };

  const filteredFees = fees.filter((fee) => {
    const student = fee.student || {};

    const searchableText = [
      student.name,
      student.email,
      student.role,
      fee.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(search.toLowerCase());
  });

  const totalExpected = filteredFees.reduce(
    (sum, fee) => sum + Number(fee.totalFee || 0),
    0
  );

  const totalCollected = filteredFees.reduce(
    (sum, fee) => sum + Number(fee.paidAmount || 0),
    0
  );

  const totalDue = filteredFees.reduce(
    (sum, fee) =>
      sum +
      Number(
        fee.dueAmount ??
          getDueAmount(fee.totalFee, fee.paidAmount)
      ),
    0
  );

  const getStatusClasses = (status) => {
    if (status === "Paid") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Partial") {
      return "bg-amber-100 text-amber-700";
    }

    return "bg-red-100 text-red-700";
  };

  return (
    <div className="min-h-screen min-w-0 w-full space-y-5 bg-gray-50 p-3 sm:space-y-6 sm:p-5 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Fee Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage student fees, payments and outstanding dues.
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <button
            type="button"
            onClick={loadFees}
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
              onClick={openCreateForm}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 sm:px-4"
            >
              <Plus size={18} />
              Add Fee
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && !showForm && (
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <SummaryCard
          title="Total Expected"
          amount={formatMoney(totalExpected)}
          icon={<Wallet size={20} />}
          color="blue"
        />

        <SummaryCard
          title="Total Collected"
          amount={formatMoney(totalCollected)}
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

      {/* Table Section */}
      <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              Fee Records
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredFees.length} record(s) found
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or status..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">Total Fee</th>
                <th className="px-4 py-3 font-semibold">Paid Amount</th>
                <th className="px-4 py-3 font-semibold">Due Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>

                {isAdmin && (
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading fee records...
                  </td>
                </tr>
              ) : filteredFees.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 6 : 5}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-gray-500">
                      <Wallet size={32} />

                      <p className="font-medium">
                        No fee records found
                      </p>

                      <p className="text-xs">
                        {search
                          ? "Try another search term."
                          : "No fee record is available yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFees.map((fee) => {
                  const student = fee.student || {};

                  const status =
                    fee.status ||
                    getPaymentStatus(
                      fee.totalFee,
                      fee.paidAmount
                    );

                  return (
                    <tr
                      key={fee._id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Users size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800">
                              {student.name || "Student"}
                            </p>

                            <p className="mt-1 break-all text-xs text-gray-500">
                              {student.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-800">
                        {formatMoney(fee.totalFee)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium text-green-700">
                        {formatMoney(fee.paidAmount)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-medium text-red-600">
                        {formatMoney(
                          fee.dueAmount ??
                            getDueAmount(
                              fee.totalFee,
                              fee.paidAmount
                            )
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                            status
                          )}`}
                        >
                          {status === "Paid" ? (
                            <CheckCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}

                          {status}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handlePrintReceipt(fee)}
                              disabled={!!printingId}
                              title="Print fee receipt"
                              aria-label="Print fee receipt"
                              className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {printingId === fee._id ? (
                                <RefreshCw
                                  size={17}
                                  className="animate-spin"
                                />
                              ) : (
                                <Printer size={17} />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(fee._id)}
                              disabled={!!deletingId}
                              title="Delete fee"
                              aria-label="Delete fee"
                              className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2
                                size={17}
                                className={
                                  deletingId === fee._id
                                    ? "animate-pulse"
                                    : ""
                                }
                              />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Fee Modal */}
      {showForm && isAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5">
          <div className="my-auto flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                  Create New Fee
                </h2>

                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Enter student fee and payment details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
                className="shrink-0 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
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
                    htmlFor="student"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Select Student *
                  </label>

                  <select
                    id="student"
                    name="student"
                    value={form.student}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose a student</option>

                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.email})
                      </option>
                    ))}
                  </select>

                  {students.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700">
                      Student list could not load. Please check the
                      /student/all-students endpoint.
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="totalFee"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Total Fee (৳) *
                  </label>

                  <input
                    id="totalFee"
                    type="number"
                    name="totalFee"
                    value={form.totalFee}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    placeholder="5000"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="paidAmount"
                    className="mb-1.5 block text-sm font-medium text-gray-700"
                  >
                    Paid Amount (৳)
                  </label>

                  <input
                    id="paidAmount"
                    type="number"
                    name="paidAmount"
                    value={form.paidAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600">Due Amount</span>

                    <span className="font-bold text-red-600">
                      {formatMoney(
                        getDueAmount(
                          form.totalFee,
                          form.paidAmount
                        )
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-600">
                      Payment Status
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                        getPaymentStatus(
                          form.totalFee,
                          form.paidAmount
                        )
                      )}`}
                    >
                      {getPaymentStatus(
                        form.totalFee,
                        form.paidAmount
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 sm:flex-row sm:justify-end sm:p-5">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || students.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}

                  {saving ? "Saving..." : "Create Fee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

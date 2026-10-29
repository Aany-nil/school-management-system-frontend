
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

const initialForm = {
  teacher: "",
  month: new Date().toISOString().slice(0, 7),
};

const formatMoney = (amount) =>
  `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;

const getStatus = (salary) => {
  if (salary.status) return salary.status;
  if (Number(salary.dueAmount || 0) <= 0) return "Paid";
  if (Number(salary.paidAmount || 0) > 0) return "Partial";
  return "Due";
};

function SummaryCard({ title, amount, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`rounded-lg p-2.5 ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-800">
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
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentSalary, setPaymentSalary] = useState(null);
  const [payslip, setPayslip] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [paidAmount, setPaidAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
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

  const loadSalaries = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadSalaries();

    if (isAdmin) {
      loadTeachers();
    }
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm(initialForm);
    setError("");
  };

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

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentSalary) return;

    setError("");
    setSuccess("");

    const amount = Number(paidAmount);
    const due = Number(paymentSalary.dueAmount || 0);

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
    }
  };

  const handleViewPayslip = async (id) => {
    setError("");
    setPayslip(null);

    try {
      const response = await api.get(`/salary/payslip/${id}`);
      setPayslip(response.data?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load payslip."
      );
    }
  };

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
    (sum, salary) => sum + Number(salary.salaryAmount || 0),
    0
  );

  const totalPaid = filteredSalaries.reduce(
    (sum, salary) => sum + Number(salary.paidAmount || 0),
    0
  );

  const totalDue = filteredSalaries.reduce(
    (sum, salary) => sum + Number(salary.dueAmount || 0),
    0
  );

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            Salary Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage teacher salaries, payments and payslips.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              loadSalaries();
              if (isAdmin) loadTeachers();
            }}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccess("");
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Salary
            </button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Salary"
          amount={formatMoney(totalSalary)}
          icon={<Wallet size={22} />}
          color="blue"
        />
        <SummaryCard
          title="Total Paid"
          amount={formatMoney(totalPaid)}
          icon={<CheckCircle size={22} />}
          color="green"
        />
        <SummaryCard
          title="Total Due"
          amount={formatMoney(totalDue)}
          icon={<AlertCircle size={22} />}
          color="red"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {isTeacher ? "My Salary History" : "Salary Records"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filteredSalaries.length} record(s) found
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
              placeholder="Search teacher, month or status..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 font-semibold">Teacher</th>
                <th className="px-4 py-3 font-semibold">Month</th>
                <th className="px-4 py-3 font-semibold">Salary</th>
                <th className="px-4 py-3 font-semibold">Paid</th>
                <th className="px-4 py-3 font-semibold">Due</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    Loading salary records...
                  </td>
                </tr>
              ) : filteredSalaries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Wallet size={32} />
                      <p className="font-medium">No salary records found</p>
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

                  return (
                    <tr key={salary._id} className="transition hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <Users size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">
                              {teacher.name || "Teacher"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {teacher.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-700">
                        {salary.month}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-800">
                        {formatMoney(salary.salaryAmount)}
                      </td>
                      <td className="px-4 py-4 font-medium text-green-700">
                        {formatMoney(salary.paidAmount)}
                      </td>
                      <td className="px-4 py-4 font-medium text-red-600">
                        {formatMoney(salary.dueAmount)}
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
                            onClick={() => handleViewPayslip(salary._id)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Eye size={17} />
                          </button>

                          {isAdmin && Number(salary.dueAmount) > 0 && (
                            <button
                              type="button"
                              title="Record payment"
                              aria-label="Record payment"
                              onClick={() => {
                                setError("");
                                setPaidAmount("");
                                setPaymentSalary(salary);
                              }}
                              className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                            >
                              <CreditCard size={17} />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              title="Delete salary"
                              aria-label="Delete salary"
                              onClick={() => handleDelete(salary._id)}
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={17} />
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

      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Create Salary</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select a teacher and month. Fixed salary will be used automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setForm(initialForm);
                }}
                aria-label="Close modal"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSalary} className="space-y-4">
              <div>
                <label htmlFor="teacher" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Select Teacher *
                </label>
                <select
                  id="teacher"
                  name="teacher"
                  value={form.teacher}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Choose a teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher._id} value={teacher._id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>

                {teachers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    No teachers found. Check the teacher API and login as admin.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="month" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Salary Month *
                </label>
                <input
                  id="month"
                  type="month"
                  name="month"
                  value={form.month}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-gray-700"
                />
                {selectedTeacher && Number(selectedTeacher.monthlySalary || 0) <= 0 && (
                  <p className="mt-1 text-xs text-red-600">
                    Set this teacher's fixed salary in Teacher Management first.
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setForm(initialForm);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    saving ||
                    teachers.length === 0 ||
                    !selectedTeacher ||
                    Number(selectedTeacher.monthlySalary || 0) <= 0
                  }
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Create Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentSalary && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Record Salary Payment</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {paymentSalary.teacher?.name || "Teacher"} — {paymentSalary.month}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentSalary(null);
                  setPaidAmount("");
                }}
                aria-label="Close payment modal"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Salary</span>
                <span className="font-semibold">{formatMoney(paymentSalary.salaryAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Already Paid</span>
                <span className="font-semibold text-green-700">{formatMoney(paymentSalary.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remaining Due</span>
                <span className="font-semibold text-red-600">{formatMoney(paymentSalary.dueAmount)}</span>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label htmlFor="paidAmount" className="mb-1.5 block text-sm font-medium text-gray-700">
                  New Payment Amount (৳) *
                </label>
                <input
                  id="paidAmount"
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  min="0.01"
                  max={paymentSalary.dueAmount}
                  step="0.01"
                  required
                  placeholder="Enter payment amount"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSalary(null);
                    setPaidAmount("");
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {payslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText className="text-blue-600" size={24} />
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Salary Payslip</h2>
                  <p className="text-xs text-gray-500">Payment details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayslip(null)}
                aria-label="Close payslip"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div id="salary-payslip" className="space-y-4 rounded-xl border border-gray-200 p-4">
              <div className="border-b border-dashed border-gray-200 pb-4">
                <p className="text-xs text-gray-500">Payslip Number</p>
                <p className="mt-1 break-all font-semibold text-gray-800">
                  {payslip.paySlipNumber || "N/A"}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Teacher Name</p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {payslip.teacher?.name || "Teacher"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="mt-1 break-all font-medium text-gray-800">
                    {payslip.teacher?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Salary Month</p>
                  <p className="mt-1 font-semibold text-gray-800">{payslip.month}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Payment Date</p>
                  <p className="mt-1 font-medium text-gray-800">
                    {payslip.paymentDate
                      ? new Date(payslip.paymentDate).toLocaleDateString()
                      : "Not paid yet"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-dashed border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Salary</span>
                  <span className="font-semibold">{formatMoney(payslip.salaryAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Paid Amount</span>
                  <span className="font-semibold text-green-700">{formatMoney(payslip.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Due Amount</span>
                  <span className="font-semibold text-red-600">{formatMoney(payslip.dueAmount)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="font-medium text-gray-700">Status</span>
                  <StatusBadge status={payslip.status} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayslip(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
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
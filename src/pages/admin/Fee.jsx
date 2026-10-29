
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
} from "lucide-react";
import api from "../../services/api";

const initialForm = {
  student: "",
  totalFee: "",
  paidAmount: "0",
};

const getDueAmount = (totalFee, paidAmount) =>
  Math.max(
    0,
    Number(totalFee || 0) - Number(paidAmount || 0)
  );

const getPaymentStatus = (totalFee, paidAmount) => {
  const total = Number(totalFee || 0);
  const paid = Number(paidAmount || 0);

  if (paid === total) return "Paid";
  if (paid > 0) return "Partial";
  return "Due";
};

const formatMoney = (amount) =>
  `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;

function SummaryCard({ title, amount, icon, color }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-500">
          {title}
        </p>

        <div className={`rounded-lg p-2.5 ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>

      <h2 className="mt-4 text-2xl font-bold text-gray-800">
        {amount}
      </h2>
    </div>
  );
}

export default function Fees() {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(initialForm);
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

        setFees(feeData ? [feeData] : []);
      }
    } catch (err) {
      setFees([]);
      setError(
        err.response?.data?.message ||
          "Fee records load,API ও login token check"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, []);

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
      setError("student select");
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
      setError("Right fee amount, Negative amount");
      return;
    }

    if (paidAmount > totalFee) {
      setError("Paid amount less than total fee");
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

      closeForm();
      await loadFees();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Fee create not active, Backend response"
      );
    } finally {
      setSaving(false);
    }
  };

  // Fee delete
  const handleDelete = async (feeId) => {
    const confirmed = window.confirm(
      "Are you record delete"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

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
          "Fee delete"
      );
    }
  };

  // Search
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

  // Summary
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
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
            Fee Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage student fees, payments and outstanding dues.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={loadFees}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={openCreateForm}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
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
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Expected"
          amount={formatMoney(totalExpected)}
          icon={<Wallet size={22} />}
          color="blue"
        />

        <SummaryCard
          title="Total Collected"
          amount={formatMoney(totalCollected)}
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

      {/* Table section */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
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
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="px-4 py-3 font-semibold">
                  Student
                </th>

                <th className="px-4 py-3 font-semibold">
                  Total Fee
                </th>

                <th className="px-4 py-3 font-semibold">
                  Paid Amount
                </th>

                <th className="px-4 py-3 font-semibold">
                  Due Amount
                </th>

                <th className="px-4 py-3 font-semibold">
                  Status
                </th>

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

                          <div>
                            <p className="font-semibold text-gray-800">
                              {student.name || "Student"}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {student.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium text-gray-800">
                        {formatMoney(fee.totalFee)}
                      </td>

                      <td className="px-4 py-4 font-medium text-green-700">
                        {formatMoney(fee.paidAmount)}
                      </td>

                      <td className="px-4 py-4 font-medium text-red-600">
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
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
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
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(fee._id)
                              }
                              title="Delete fee"
                              aria-label="Delete fee"
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={17} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Create New Fee
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Enter student fee and payment details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                aria-label="Close form"
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    Student list not load/student/all-students endpoint check।
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="space-y-3 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Due Amount
                  </span>

                  <span className="font-bold text-red-600">
                    {formatMoney(
                      getDueAmount(
                        form.totalFee,
                        form.paidAmount
                      )
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || students.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
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

import { useEffect, useState } from "react";
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
} from "lucide-react";

import api from "../../services/api";

const formatMoney = (amount) =>
  `৳ ${Number(amount || 0).toLocaleString("en-BD")}`;

export default function Teachers() {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [salaryTeacher, setSalaryTeacher] = useState(null);
  const [monthlySalary, setMonthlySalary] = useState("");

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [salarySaving, setSalarySaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch Teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/teachers");

      if (!response.data.success) {
        setError(
          response.data.message || "Failed to load teachers."
        );
        return;
      }

      const data = response.data.data;

      const teacherList = Array.isArray(data)
        ? data
        : Array.isArray(data?.teachers)
        ? data.teachers
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const normalizedTeachers = teacherList
        .filter((teacher) => teacher.role === "teacher")
        .map((teacher) => ({
          ...teacher,
          _id: teacher._id || teacher.id,
          monthlySalary: Number(teacher.monthlySalary || 0),
        }));

      setTeachers(normalizedTeachers);
    } catch (err) {
      console.error(
        "Fetch teachers error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to load teachers. Check your backend and login."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Handle Add Teacher Form
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create Teacher
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!name || !email || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 5) {
      setError("Password must be at least 5 characters.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post("/admin/teachers", {
        name,
        email,
        password,
      });

      if (!response.data.success) {
        setError(
          response.data.message || "Failed to create teacher."
        );
        return;
      }

      setShowForm(false);

      setFormData({
        name: "",
        email: "",
        password: "",
      });

      setSuccess("Teacher created successfully!");

      await fetchTeachers();
    } catch (err) {
      console.error(
        "Create teacher error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to create teacher."
      );
    } finally {
      setSaving(false);
    }
  };

  // Open Salary Modal
  const openSalaryForm = (teacher) => {
    setError("");
    setSuccess("");

    const teacherId = teacher?._id || teacher?.id;

    if (!teacherId) {
      console.error("Teacher object has no ID:", teacher);

      setError(
        "Teacher ID not found. Refresh the page and try again."
      );

      return;
    }

    setSalaryTeacher({
      ...teacher,
      _id: teacherId,
    });

    setMonthlySalary(
      teacher.monthlySalary != null &&
        Number(teacher.monthlySalary) > 0
        ? String(teacher.monthlySalary)
        : ""
    );
  };

  // Close Salary Modal
  const closeSalaryForm = () => {
    if (salarySaving) return;

    setSalaryTeacher(null);
    setMonthlySalary("");
  };

  // Update Fixed Monthly Salary
  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const teacherId = salaryTeacher?._id || salaryTeacher?.id;
    const amount = Number(monthlySalary);

    if (!teacherId) {
      setError(
        "Teacher ID is missing. Close the form and select the teacher again."
      );

      console.error("Invalid salary teacher:", salaryTeacher);
      return;
    }

    if (
      monthlySalary.trim() === "" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError("Monthly salary must be greater than zero.");
      return;
    }

    try {
      setSalarySaving(true);

      const response = await api.patch(
        `/teacher/${teacherId}/salary`,
        { monthlySalary: amount }
      );

      if (!response.data.success) {
        setError(
          response.data.message ||
            "Failed to update fixed salary."
        );
        return;
      }

      const teacherName = salaryTeacher.name;

      setSalaryTeacher(null);
      setMonthlySalary("");

      setSuccess(
        `Fixed monthly salary updated for ${teacherName}.`
      );

      await fetchTeachers();
    } catch (err) {
      console.error(
        "Update teacher salary error:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Failed to update salary. Check the teacher API and backend logs."
      );
    } finally {
      setSalarySaving(false);
    }
  };

  // Search Teachers
  const filteredTeachers = teachers.filter((teacher) => {
    const name = teacher.name?.toLowerCase() || "";
    const email = teacher.email?.toLowerCase() || "";
    const query = search.toLowerCase().trim();

    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="min-h-screen w-full min-w-0 space-y-5 bg-slate-50 p-3 text-slate-700 sm:space-y-6 sm:p-5 lg:space-y-8 lg:p-8">

      {/* Page Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Teacher Management
          </h1>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage teachers and their fixed monthly salaries.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">

          <button
            type="button"
            onClick={fetchTeachers}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-3 sm:text-sm"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 sm:px-4 sm:py-3 sm:text-sm"
          >
            <Plus size={18} />
            Add Teacher
          </button>

        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Dismiss success message"
            className="shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span className="break-words">{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
            className="shrink-0"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">

        {/* Total Teachers */}
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-5">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 sm:h-12 sm:w-12">
            <Users size={22} />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500 sm:text-sm">
              Total Teachers
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {teachers.length}
            </h2>
          </div>

        </div>

        {/* Fixed Salary */}
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-5">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700 sm:h-12 sm:w-12">
            <Wallet size={22} />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500 sm:text-sm">
              Teachers with Fixed Salary
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {
                teachers.filter(
                  (teacher) => teacher.monthlySalary > 0
                ).length
              }
            </h2>
          </div>

        </div>

      </div>

      {/* Teacher Table Section */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        {/* Search Header */}
        <div className="border-b border-slate-100 p-4 sm:p-5">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                All Teachers
              </h2>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                View teachers and manage their salaries.
              </p>
            </div>

            <div className="relative w-full sm:max-w-md">

              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:py-3"
              />

            </div>

          </div>

        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">

          <table className="w-full min-w-[800px] text-left">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">

                <th className="px-4 py-4 sm:px-5">
                  Teacher
                </th>

                <th className="px-4 py-4 sm:px-5">
                  Email
                </th>

                <th className="px-4 py-4 sm:px-5">
                  Role
                </th>

                <th className="px-4 py-4 sm:px-5">
                  Fixed Monthly Salary
                </th>

                <th className="px-4 py-4 text-right sm:px-5">
                  Action
                </th>

              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Loading teachers...
                  </td>
                </tr>
              ) : filteredTeachers.length > 0 ? (

                filteredTeachers.map((teacher) => (

                  <tr
                    key={teacher._id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >

                    {/* Teacher Name */}
                    <td className="px-4 py-4 sm:px-5">
                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                          <UserRound size={19} />
                        </div>

                        <span className="whitespace-nowrap text-sm font-semibold text-slate-900">
                          {teacher.name || "N/A"}
                        </span>

                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-4 sm:px-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail
                          size={15}
                          className="shrink-0 text-slate-400"
                        />

                        <span className="whitespace-nowrap">
                          {teacher.email || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4 sm:px-5">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Teacher
                      </span>
                    </td>

                    {/* Salary */}
                    <td className="px-4 py-4 sm:px-5">
                      {teacher.monthlySalary > 0 ? (

                        <span className="whitespace-nowrap text-sm font-semibold text-green-700">
                          {formatMoney(teacher.monthlySalary)}
                        </span>

                      ) : (

                        <span className="whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                          Not set
                        </span>

                      )}
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-right sm:px-5">

                      <button
                        type="button"
                        onClick={() => openSalaryForm(teacher)}
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 sm:text-sm"
                      >
                        <Pencil size={15} />

                        {teacher.monthlySalary > 0
                          ? "Update Salary"
                          : "Set Salary"}
                      </button>

                    </td>

                  </tr>

                ))

              ) : (

                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    {search
                      ? "No teachers match your search."
                      : "No teachers found. Click Add Teacher to get started."}
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

        {/* Table Footer */}
        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <p>
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {filteredTeachers.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-700">
              {teachers.length}
            </span>{" "}
            teachers
          </p>

          <p>Teacher Management</p>

        </div>

      </div>

      {/* Add Teacher Modal */}
      {showForm && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-5"
          onClick={() => {
            if (!saving) {
              setShowForm(false);
              setError("");
            }
          }}
        >

          <div
            className="my-auto flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">

              <div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Add Teacher
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Enter the teacher's account details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                disabled={saving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={19} />
              </button>

            </div>

            {/* Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

              <form
                id="add-teacher-form"
                onSubmit={handleSubmit}
                className="space-y-4"
              >

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    placeholder="Enter teacher name"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    placeholder="teacher@example.com"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={5}
                    required
                    disabled={saving}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    placeholder="Create a password"
                  />

                  <p className="mt-1.5 text-xs text-slate-400">
                    Password must be at least 5 characters.
                  </p>
                </div>

              </form>

            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end sm:px-6">

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                disabled={saving}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="add-teacher-form"
                disabled={saving}
                className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? "Saving..." : "Save Teacher"}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* Fixed Salary Modal */}
      {salaryTeacher && (

        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-5"
          onClick={closeSalaryForm}
        >

          <div
            className="my-auto flex max-h-[94dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Salary Modal Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">

              <div className="min-w-0">

                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
                  <Wallet size={22} />
                </div>

                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  Fixed Monthly Salary
                </h2>

                <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">
                  Set the salary for {salaryTeacher.name}.
                </p>

              </div>

              <button
                type="button"
                onClick={closeSalaryForm}
                disabled={salarySaving}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                aria-label="Close salary form"
              >
                <X size={19} />
              </button>

            </div>

            {/* Salary Modal Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">

              <form
                id="salary-form"
                onSubmit={handleSalarySubmit}
                className="space-y-4"
              >

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Teacher
                  </label>

                  <input
                    value={salaryTeacher.name || ""}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Monthly Salary (৳) *
                  </label>

                  <input
                    type="number"
                    value={monthlySalary}
                    onChange={(e) =>
                      setMonthlySalary(e.target.value)
                    }
                    min="0.01"
                    step="0.01"
                    required
                    disabled={salarySaving}
                    placeholder="Example: 30000"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    This amount will be used when creating this teacher's salary record.
                  </p>
                </div>

                {monthlySalary.trim() !== "" &&
                  Number(monthlySalary) > 0 && (
                    <div className="rounded-xl border border-green-100 bg-green-50 p-3">
                      <p className="text-xs text-green-700">
                        Monthly Salary Preview
                      </p>

                      <p className="mt-1 text-lg font-bold text-green-800">
                        {formatMoney(monthlySalary)}
                      </p>
                    </div>
                  )}

              </form>

            </div>

            {/* Salary Modal Footer */}
            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end sm:px-6">

              <button
                type="button"
                onClick={closeSalaryForm}
                disabled={salarySaving}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="salary-form"
                disabled={salarySaving}
                className="w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {salarySaving
                  ? "Saving..."
                  : "Save Fixed Salary"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

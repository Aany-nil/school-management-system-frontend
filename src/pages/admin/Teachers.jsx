
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

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/teachers");

      if (!response.data.success) {
        setError(response.data.message || "Failed to load teachers.");
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

  // Handle add teacher form
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create teacher
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
        setError(response.data.message || "Failed to create teacher.");
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

  // Open salary modal with a valid teacher ID
  const openSalaryForm = (teacher) => {
    setError("");
    setSuccess("");

    const teacherId = teacher?._id || teacher?.id;

    if (!teacherId) {
      console.error("Teacher object has no ID:", teacher);
      setError("Teacher ID not found. Refresh the page and try again.");
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

  // Close salary modal
  const closeSalaryForm = () => {
    if (salarySaving) return;

    setSalaryTeacher(null);
    setMonthlySalary("");
  };

  // Set or update fixed monthly salary
  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const teacherId = salaryTeacher?._id || salaryTeacher?.id;
    const amount = Number(monthlySalary);

    if (!teacherId) {
      setError("Teacher ID is missing. Close the form and select the teacher again.");
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

      console.log("Updating salary for teacher ID:", teacherId);

      const response = await api.patch(
        `/teacher/${teacherId}/salary`,
        { monthlySalary: amount }
      );

      if (!response.data.success) {
        setError(
          response.data.message || "Failed to update fixed salary."
        );
        return;
      }

      setSalaryTeacher(null);
      setMonthlySalary("");

      setSuccess(
        `Fixed monthly salary updated for ${salaryTeacher.name}.`
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

  // Search teachers
  const filteredTeachers = teachers.filter((teacher) => {
    const name = teacher.name?.toLowerCase() || "";
    const email = teacher.email?.toLowerCase() || "";
    const query = search.toLowerCase().trim();

    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Teacher Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage teachers and their fixed monthly salaries.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchTeachers}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={18} />
            Add Teacher
          </button>
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Teachers</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {teachers.length}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="rounded-xl bg-green-100 p-3 text-green-700">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">
              Teachers with Fixed Salary
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
              {
                teachers.filter(
                  (teacher) => teacher.monthlySalary > 0
                ).length
              }
            </h2>
          </div>
        </div>
      </div>

      {/* Teacher table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[800px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-3 py-3">Teacher</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Fixed Monthly Salary</th>
                <th className="px-3 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-12 text-center text-sm text-slate-500"
                  >
                    Loading teachers...
                  </td>
                </tr>
              ) : filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr
                    key={teacher._id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                          <UserRound size={18} />
                        </div>
                        <span className="font-medium text-slate-900">
                          {teacher.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {teacher.email}
                    </td>

                    <td className="px-3 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        Teacher
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      {teacher.monthlySalary > 0 ? (
                        <span className="font-semibold text-green-700">
                          {formatMoney(teacher.monthlySalary)}
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                          Not set
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openSalaryForm(teacher)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
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
                    className="px-3 py-12 text-center text-sm text-slate-500"
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
      </div>

      {/* Add teacher modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Add Teacher
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the teacher's account details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full Name
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  placeholder="Enter teacher name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  placeholder="teacher@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
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
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  placeholder="Create a password"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fixed salary modal */}
      {salaryTeacher && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="mb-3 inline-flex rounded-xl bg-green-100 p-3 text-green-700">
                  <Wallet size={23} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Fixed Monthly Salary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set the salary for {salaryTeacher.name}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSalaryForm}
                disabled={salarySaving}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close salary form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalarySubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Teacher
                </label>
                <input
                  value={salaryTeacher.name || ""}
                  readOnly
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Monthly Salary (৳) *
                </label>
                <input
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  min="0.01"
                  step="0.01"
                  required
                  disabled={salarySaving}
                  placeholder="Example: 30000"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  This amount will be used when creating this teacher's salary record.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSalaryForm}
                  disabled={salarySaving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={salarySaving}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salarySaving ? "Saving..." : "Save Fixed Salary"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
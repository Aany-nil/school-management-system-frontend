
import { useEffect, useState } from "react";
import {
  School,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Layers,
  UserRound,
  RefreshCw,
} from "lucide-react";
import api from "../../services/api";

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  const [formData, setFormData] = useState({
    className: "",
    section: "",
    academicYear: "2026",
    teacherId: "",
  });

  const [loading, setLoading] = useState(true);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/class/allclasses");

      if (response.data.success) {
        setClasses(
          Array.isArray(response.data.data)
            ? response.data.data
            : []
        );
      } else {
        setError(response.data.message || "Failed to load classes.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load classes. Check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch teachers
  const fetchTeachers = async () => {
    try {
      setTeacherLoading(true);

      const response = await api.get("/teacher/all-teachers");

      if (response.data.success) {
        setTeachers(
          Array.isArray(response.data.data)
            ? response.data.data
            : []
        );
      } else {
        setError(response.data.message || "Failed to load teachers.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load teachers. Please try again."
      );
    } finally {
      setTeacherLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  // Open add form
  const openAddForm = () => {
    setEditingClass(null);

    setFormData({
      className: "",
      section: "",
      academicYear: "2026",
      teacherId: "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = (item) => {
    setEditingClass(item);

    setFormData({
      className: item.className || "",
      section: item.section || "",
      academicYear: String(item.academicYear || ""),
      teacherId: item.teacherId?._id || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update class
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const payload = {
      className: formData.className.trim(),
      section: formData.section.trim(),
      academicYear: Number(formData.academicYear),
      teacherId: formData.teacherId,
    };

    if (
      !payload.className ||
      !payload.section ||
      !payload.academicYear ||
      !payload.teacherId
    ) {
      setError("Please fill in all fields and select a teacher.");
      return;
    }

    try {
      setSaving(true);

      let response;

      if (editingClass) {
        response = await api.patch(
          `/class/update/${editingClass._id}`,
          payload
        );
      } else {
        response = await api.post("/class/create", payload);
      }

      if (!response.data.success) {
        setError(response.data.message || "Could not save class.");
        return;
      }

      setSuccess(
        editingClass
          ? "Class updated successfully!"
          : "Class created successfully!"
      );

      setShowForm(false);
      setEditingClass(null);

      await fetchClasses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save class. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete class
  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${item.className} - Section ${item.section}?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setDeletingId(item._id);

      const response = await api.delete(
        `/class/delete/${item._id}`
      );

      if (!response.data.success) {
        setError(response.data.message || "Failed to delete class.");
        return;
      }

      setSuccess("Class deleted successfully.");
      await fetchClasses();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to delete class. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Search classes
  const filteredClasses = classes.filter((item) => {
    const query = search.toLowerCase();

    return (
      item.className?.toLowerCase().includes(query) ||
      item.section?.toLowerCase().includes(query) ||
      String(item.academicYear || "").toLowerCase().includes(query) ||
      item.teacherId?.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen w-full min-w-0 space-y-5 p-3 sm:space-y-6 sm:p-5 lg:p-8">

      {/* Page Heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Class Management
          </h1>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Create and manage your school's classes.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
        >
          <Plus size={18} />
          Add Class
        </button>
      </div>

      {/* Messages */}
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
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && !showForm && (
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-5">
          <div className="shrink-0 rounded-xl bg-blue-100 p-2.5 text-blue-700 sm:p-3">
            <School size={21} />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500 sm:text-sm">
              Total Classes
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {classes.length}
            </h2>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:gap-4 sm:p-5">
          <div className="shrink-0 rounded-xl bg-indigo-100 p-2.5 text-indigo-700 sm:p-3">
            <Layers size={21} />
          </div>

          <div className="min-w-0">
            <p className="text-xs text-slate-500 sm:text-sm">
              Search Results
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
              {filteredClasses.length}
            </h2>
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">

        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search class, section, year or teacher..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Table */}
        <div className="mt-5 w-full overflow-x-auto rounded-xl">
          <table className="w-full min-w-[750px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 sm:text-sm">
                <th className="px-3 py-3 font-semibold">Class Name</th>
                <th className="px-3 py-3 font-semibold">Section</th>
                <th className="px-3 py-3 font-semibold">Academic Year</th>
                <th className="px-3 py-3 font-semibold">Assigned Teacher</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-12 text-center text-sm text-slate-500"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={17} className="animate-spin" />
                      Loading classes...
                    </div>
                  </td>
                </tr>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 rounded-xl bg-blue-100 p-2 text-blue-700">
                          <School size={18} />
                        </div>

                        <span className="text-sm font-medium text-slate-900">
                          {item.className}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      <span className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                        {item.section}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {item.academicYear}
                    </td>

                    <td className="px-3 py-4">
                      {item.teacherId?.name ? (
                        <div className="flex items-center gap-2">
                          <div className="shrink-0 rounded-full bg-purple-100 p-2 text-purple-700">
                            <UserRound size={16} />
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800">
                              {item.teacherId.name}
                            </p>

                            <p className="break-all text-xs text-slate-500">
                              {item.teacherId.email}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          No teacher assigned
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          aria-label="Edit class"
                          className="rounded-lg border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
                          aria-label="Delete class"
                          className="rounded-lg border border-slate-200 p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === item._id ? (
                            <RefreshCw size={17} className="animate-spin" />
                          ) : (
                            <Trash2 size={17} />
                          )}
                        </button>
                      </div>
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
                      ? "No classes match your search."
                      : "No classes found. Click Add Class to create one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {!loading && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500 sm:text-sm">
              Showing {filteredClasses.length} of {classes.length} classes
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-5">

          <div className="my-auto flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-6">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {editingClass ? "Edit Class" : "Add Class"}
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Enter the class details and assign a teacher.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                disabled={saving}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="space-y-4 overflow-y-auto p-4 sm:p-6">

                {/* Class Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Class Name
                  </label>

                  <input
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    placeholder="e.g. Class 6"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                {/* Section */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Section
                  </label>

                  <input
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    placeholder="e.g. A"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                {/* Academic Year */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Academic Year
                  </label>

                  <input
                    type="number"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleChange}
                    required
                    disabled={saving}
                    placeholder="e.g. 2026"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  />
                </div>

                {/* Teacher Select */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Assign Teacher
                  </label>

                  <select
                    name="teacherId"
                    value={formData.teacherId}
                    onChange={handleChange}
                    required
                    disabled={saving || teacherLoading}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="">
                      {teacherLoading
                        ? "Loading teachers..."
                        : "Select a teacher"}
                    </option>

                    {teachers.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                  </select>

                  {!teacherLoading && teachers.length === 0 && (
                    <p className="mt-2 text-xs text-red-500">
                      No teachers found. Please add a teacher first.
                    </p>
                  )}
                </div>

                {/* Form Error */}
                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600"
                  >
                    {error}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end sm:gap-3 sm:p-5">

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto sm:py-2.5"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || teacherLoading || teachers.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2.5"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : editingClass ? (
                    "Update Class"
                  ) : (
                    "Save Class"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

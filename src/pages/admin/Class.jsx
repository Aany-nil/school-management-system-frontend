
import { useEffect, useState } from "react";
import {
  School,
  Plus,
  Search,
  X,
  Pencil,
  Trash2,
  Layers,
} from "lucide-react";
import api from "../../services/api";

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    className: "",
    section: "",
    academicYear: "2026",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch classes from the backend
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/class/allclasses");

      if (response.data.success) {
        const list = response.data.data;
        setClasses(Array.isArray(list) ? list : []);
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

  useEffect(() => {
    fetchClasses();
  }, []);

  const openAddForm = () => {
    setEditingClass(null);
    setFormData({
      className: "",
      section: "",
      academicYear: "2026",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingClass(item);
    setFormData({
      className: item.className || "",
      section: item.section || "",
      academicYear: String(item.academicYear || ""),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Create or update a class
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      className: formData.className.trim(),
      section: formData.section.trim(),
      academicYear: formData.academicYear.trim(),
    };

    if (!payload.className || !payload.section || !payload.academicYear) {
      setError("Please fill in all fields.");
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

  // Delete a class
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

  const filteredClasses = classes.filter((item) => {
    const query = search.toLowerCase();

    return (
      item.className?.toLowerCase().includes(query) ||
      item.section?.toLowerCase().includes(query) ||
      String(item.academicYear || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Class Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage your school's classes.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Class
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {success}
        </div>
      )}

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
            <School size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Classes</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {classes.length}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Search Results</p>
            <h2 className="text-2xl font-bold text-slate-900">
              {filteredClasses.length}
            </h2>
          </div>
        </div>
      </div>

      {/* Classes table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search class, section or year..."
            className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-3 py-3">Class Name</th>
                <th className="px-3 py-3">Section</th>
                <th className="px-3 py-3">Academic Year</th>
                <th className="px-3 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-12 text-center text-sm text-slate-500"
                  >
                    Loading classes...
                  </td>
                </tr>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-blue-100 p-2 text-blue-700">
                          <School size={18} />
                        </div>
                        <span className="font-medium text-slate-900">
                          {item.className}
                        </span>
                      </div>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
                        {item.section}
                      </span>
                    </td>

                    <td className="px-3 py-4 text-sm text-slate-600">
                      {item.academicYear}
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          aria-label="Edit class"
                          className="rounded-lg border border-slate-200 p-2 text-blue-600 hover:bg-blue-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deletingId === item._id}
                          aria-label="Delete class"
                          className="rounded-lg border border-slate-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === item._id ? (
                            <span className="text-xs">...</span>
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
                    colSpan={4}
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
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <div className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingClass ? "Edit Class" : "Add Class"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the class details below.
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
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Class Name
                </label>
                <input
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  placeholder="e.g. Class 6"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Section
                </label>
                <input
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  placeholder="e.g. A"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Academic Year
                </label>
                <input
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  disabled={saving}
                  placeholder="e.g. 2026"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

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
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingClass
                      ? "Update Class"
                      : "Save Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

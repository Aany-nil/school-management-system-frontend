
import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
  BookMarked,
  School,
} from "lucide-react";

import api from "../../services/api";

const initialForm = {
  subjectName: "",
  subjectCode: "",
  classId: "",
  description: "",
};

const getList = (response) => {
  const data = response?.data?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.subjects)) return data.subjects;
  if (Array.isArray(data?.classes)) return data.classes;

  return [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong. Please try again.";

const getStoredUserId = () => {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) return "";

    const user = JSON.parse(storedUser);
    return user?._id || user?.id || "";
  } catch {
    return "";
  }
};

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [subjectResponse, classResponse] = await Promise.all([
        api.get("/subject/allsubject"),
        api.get("/class/allclasses"),
      ]);

      setSubjects(getList(subjectResponse));
      setClasses(getList(classResponse));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingSubject(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);

    setForm({
      subjectName: subject.subjectName || "",
      subjectCode: subject.subjectCode || "",
      classId:
        subject.classId?._id ||
        subject.classId ||
        "",
      description: subject.description || "",
    });

    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingSubject(null);
    setForm(initialForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.subjectName.trim() ||
      !form.subjectCode.trim() ||
      !form.classId
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        subjectName: form.subjectName.trim(),
        subjectCode: form.subjectCode.trim().toUpperCase(),
        classId: form.classId,
        description: form.description.trim(),
      };

      if (editingSubject) {
        await api.patch(
          `/subject/update/${editingSubject._id}`,
          payload
        );

        setSuccess("Subject updated successfully.");
      } else {
        const creatorId = getStoredUserId();

        if (!creatorId) {
          setError(
            'Admin ID not found. Please check how your login stores the user data in localStorage.'
          );
          setSaving(false);
          return;
        }

        await api.post("/subject/create", {
          ...payload,
          creatorId,
        });

        setSuccess("Subject created successfully.");
      }

      setIsModalOpen(false);
      setEditingSubject(null);
      setForm(initialForm);

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.subjectName}"?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.delete(`/subject/delete/${subject._id}`);

      setSuccess("Subject deleted successfully.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const className =
      typeof subject.classId === "object"
        ? subject.classId?.className || ""
        : "";

    const searchText = [
      subject.subjectName,
      subject.subjectCode,
      className,
      subject.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchText.includes(searchTerm.toLowerCase());
  });

  const getClassName = (subject) => {
    if (typeof subject.classId === "object") {
      const name = subject.classId?.className || "Unknown Class";
      const section = subject.classId?.section;

      return section ? `${name} - ${section}` : name;
    }

    return (
      classes.find((item) => item._id === subject.classId)
        ?.className || "Unknown Class"
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <BookOpen size={16} />
              <span>Academic Management</span>
              <span>/</span>
              <span>Subjects</span>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
              Subject Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create, view, update and manage school subjects.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={19} />
            Add Subject
          </button>
        </div>

        {/* Alerts */}
        {error && !isModalOpen && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 shrink-0" size={19} />
            <div className="flex-1">{error}</div>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss success"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookMarked size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Total Subjects</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {subjects.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <School size={24} />
            </div>

            <div>
              <p className="text-sm text-slate-500">Total Classes</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {classes.length}
              </p>
            </div>
          </div>
        </div>

        {/* Search and Refresh */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by subject name, code or class..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Subject Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-800">
                All Subjects
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Showing {filteredSubjects.length} of {subjects.length} subjects
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-slate-500">
              <LoaderCircle
                size={30}
                className="animate-spin text-blue-600"
              />
              <p className="text-sm">Loading subjects...</p>
            </div>
          ) : error && subjects.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-5 text-center">
              <AlertCircle size={30} className="text-red-500" />
              <p className="text-sm text-slate-600">
                Unable to load subjects. Check your API URL and backend routes.
              </p>
              <button
                type="button"
                onClick={loadData}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 px-5 text-center">
              <BookOpen size={34} className="text-slate-300" />
              <p className="font-medium text-slate-700">
                No subjects found
              </p>
              <p className="text-sm text-slate-500">
                Add a subject or try a different search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Subject</th>
                    <th className="px-5 py-4 font-semibold">Subject Code</th>
                    <th className="px-5 py-4 font-semibold">Class</th>
                    <th className="px-5 py-4 font-semibold">Description</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.map((subject) => (
                    <tr
                      key={subject._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <BookOpen size={20} />
                          </div>
                          <span className="font-medium text-slate-800">
                            {subject.subjectName}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs font-medium text-slate-700">
                          {subject.subjectCode}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {getClassName(subject)}
                      </td>

                      <td className="max-w-xs px-5 py-4 text-slate-500">
                        <span className="block truncate">
                          {subject.description || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(subject)}
                            title="Edit subject"
                            aria-label={`Edit ${subject.subjectName}`}
                            className="rounded-lg border border-blue-100 p-2 text-blue-600 transition hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(subject)}
                            title="Delete subject"
                            aria-label={`Delete ${subject.subjectName}`}
                            className="rounded-lg border border-red-100 p-2 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="subject-modal-title"
                  className="text-xl font-bold text-slate-800"
                >
                  {editingSubject ? "Edit Subject" : "Add New Subject"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the subject information below.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                >
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="subjectName"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Subject Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="subjectName"
                  name="subjectName"
                  type="text"
                  value={form.subjectName}
                  onChange={handleChange}
                  placeholder="Enter your subject name"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="subjectCode"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Subject Code <span className="text-red-500">*</span>
                </label>

                <input
                  id="subjectCode"
                  name="subjectCode"
                  type="text"
                  value={form.subjectCode}
                  onChange={handleChange}
                  placeholder="Enter your subject code"
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="classId"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Class <span className="text-red-500">*</span>
                </label>

                <select
                  id="classId"
                  name="classId"
                  value={form.classId}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a class</option>

                  {classes.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.className}
                      {item.section ? ` - ${item.section}` : ""}
                      {item.academicYear
                        ? ` (${item.academicYear})`
                        : ""}
                    </option>
                  ))}
                </select>

                {classes.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No classes available. Create a class first.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Optional subject description"
                  className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || (!editingSubject && classes.length === 0)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <LoaderCircle size={18} className="animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editingSubject
                      ? "Update Subject"
                      : "Create Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

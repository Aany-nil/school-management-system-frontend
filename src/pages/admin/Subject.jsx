
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

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

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
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);

  const [form, setForm] = useState(initialForm);

  // Load Subjects and Classes
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [subjectResponse, classResponse] = await Promise.all([
        api.get("/subject/allsubject"),
        api.get("/class/allclasses"),
      ]);

      setSubjects(getList(subjectResponse));
      setClasses(getList(classResponse));
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to load subjects. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Get Class Name
  const getClassName = (subject) => {
    const subjectClass = subject?.classId;

    if (subjectClass && typeof subjectClass === "object") {
      const name = subjectClass.className || "Unknown Class";
      const section = subjectClass.section;

      return section ? `${name} - ${section}` : name;
    }

    const matchedClass = classes.find(
      (item) => item._id === subjectClass
    );

    if (!matchedClass) return "Unknown Class";

    return matchedClass.section
      ? `${matchedClass.className} - ${matchedClass.section}`
      : matchedClass.className;
  };

  // Open Add Modal
  const openAddModal = () => {
    setEditingSubject(null);
    setForm(initialForm);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
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

  // Close Modal
  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingSubject(null);
    setForm(initialForm);
    setError("");
  };

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit Subject
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subjectName.trim()) {
      setError("Please enter subject name.");
      return;
    }

    if (!form.subjectCode.trim()) {
      setError("Please enter subject code.");
      return;
    }

    if (!form.classId) {
      setError("Please select a class.");
      return;
    }

    const payload = {
      subjectName: form.subjectName.trim(),
      subjectCode: form.subjectCode.trim().toUpperCase(),
      classId: form.classId,
      description: form.description.trim(),
    };

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingSubject) {
        await api.patch(
          `/subject/update/${editingSubject._id}`,
          payload
        );

        setSuccess("Subject updated successfully!");
      } else {
        const creatorId = getStoredUserId();

        if (!creatorId) {
          setError(
            "Admin ID not found. Please check how your login stores the user data in localStorage."
          );
          return;
        }

        await api.post("/subject/create", {
          ...payload,
          creatorId,
        });

        setSuccess("Subject created successfully!");
      }

      setIsModalOpen(false);
      setEditingSubject(null);
      setForm(initialForm);

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to save subject. Please try again.")
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete Subject
  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${subject.subjectName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(subject._id);
      setError("");
      setSuccess("");

      await api.delete(`/subject/delete/${subject._id}`);

      setSuccess("Subject deleted successfully!");

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(err, "Failed to delete subject. Please try again.")
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Search Filter
  const filteredSubjects = subjects.filter((subject) => {
    const search = searchTerm.toLowerCase();

    return (
      subject.subjectName?.toLowerCase().includes(search) ||
      subject.subjectCode?.toLowerCase().includes(search) ||
      getClassName(subject).toLowerCase().includes(search) ||
      subject.description?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50 p-3 sm:p-5 lg:p-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600">
            Academic Management / Subjects
          </p>

          <h1 className="text-xl font-bold text-slate-800 sm:text-2xl lg:text-3xl">
            Subject Management
          </h1>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Manage all school subjects and their assigned classes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
        >
          <Plus size={18} />
          Add Subject
        </button>
      </div>

      {/* Alerts */}
      {error && !isModalOpen && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span className="break-words">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Total Subjects
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-800 sm:text-2xl">
                {subjects.length}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 sm:p-3">
              <BookOpen size={20} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Total Classes
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-800 sm:text-2xl">
                {classes.length}
              </h2>
            </div>

            <div className="rounded-lg bg-purple-100 p-2 text-purple-600 sm:p-3">
              <School size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Refresh */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search subject, code or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Subjects Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-1 border-b border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <h2 className="font-bold text-slate-800">
            All Subjects
          </h2>

          <p className="text-xs text-slate-500">
            Showing {filteredSubjects.length} of {subjects.length} subjects
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center gap-3">
            <LoaderCircle
              size={32}
              className="animate-spin text-blue-600"
            />
            <p className="text-sm text-slate-500">
              Loading subjects...
            </p>
          </div>
        ) : error && subjects.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-4 text-center">
            <AlertCircle size={32} className="mb-2 text-red-500" />

            <p className="text-sm text-slate-600">{error}</p>

            <button
              onClick={loadData}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-4 text-center">
            <BookMarked size={36} className="mb-3 text-slate-300" />

            <h3 className="font-semibold text-slate-700">
              No Subjects Found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {searchTerm
                ? "Try searching with another keyword."
                : "Add your first subject to get started."}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[750px] text-left">
              <thead className="bg-slate-50">
                <tr className="text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-4 font-semibold">Subject</th>
                  <th className="px-5 py-4 font-semibold">Subject Code</th>
                  <th className="px-5 py-4 font-semibold">Class</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 text-center font-semibold">
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
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <BookOpen size={18} />
                        </div>

                        <span className="font-semibold text-slate-800">
                          {subject.subjectName}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {subject.subjectCode || "N/A"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      {getClassName(subject)}
                    </td>

                    <td className="max-w-[220px] px-5 py-4 text-sm text-slate-500">
                      <p className="truncate">
                        {subject.description || "No description"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(subject)}
                          title="Edit Subject"
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(subject)}
                          disabled={deletingId === subject._id}
                          title="Delete Subject"
                          className="rounded-lg bg-red-50 p-2 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          {deletingId === subject._id ? (
                            <LoaderCircle
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer */}
        {!loading && filteredSubjects.length > 0 && (
          <div className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <span>
              Total {filteredSubjects.length} subjects found
            </span>

            <span>Subject Management</span>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:items-center sm:p-5"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-modal-title"
            className="my-auto flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                  <BookOpen size={20} />
                </div>

                <div className="min-w-0">
                  <h2
                    id="subject-modal-title"
                    className="font-bold text-slate-800 sm:text-lg"
                  >
                    {editingSubject ? "Update Subject" : "Add New Subject"}
                  </h2>

                  <p className="text-xs text-slate-500">
                    {editingSubject
                      ? "Update subject information"
                      : "Enter subject information"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form - Scrollable */}
            <form
              id="subject-form"
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {/* Modal Error */}
                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0"
                    />
                    <span className="break-words">{error}</span>
                  </div>
                )}

                {/* Subject Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Subject Name <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="subjectName"
                    value={form.subjectName}
                    onChange={handleChange}
                    placeholder="Enter subject name"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Subject Code */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Subject Code <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="subjectCode"
                    value={form.subjectCode}
                    onChange={handleChange}
                    placeholder="Example: ENG101"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                {/* Class Select */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Select Class <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="classId"
                    value={form.classId}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Choose a class</option>

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
                    <p className="mt-1.5 text-xs text-amber-600">
                      No classes available. Please create a class first.
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Enter subject description (optional)"
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {/* Modal Footer - Fixed */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="w-full rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="subject-form"
                  disabled={saving || classes.length === 0}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={17} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      {editingSubject ? "Update Subject" : "Create Subject"}
                    </>
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

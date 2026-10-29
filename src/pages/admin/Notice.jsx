
import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  Plus,
  RefreshCw,
  Search,
  Pencil,
  Trash2,
  Eye,
  X,
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  Megaphone,
} from "lucide-react";

import api from "../../services/api";

const INITIAL_FORM = {
  title: "",
  description: "",
  targetRole: "all",
  publishDate: "",
};

function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Something went wrong. Please try again."
  );
}

function getArray(response) {
  const body = response?.data;

  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.notices)) return body.notices;

  return [];
}

function formatDate(date) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toLocalDateTime(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  const offset = parsedDate.getTimezoneOffset() * 60000;

  return new Date(parsedDate.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

function getRoleLabel(role) {
  if (role === "teacher") return "Teachers";
  if (role === "student") return "Students";
  return "Everyone";
}

export default function Notice() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);

  const [editingId, setEditingId] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [role] = useState(() => {
    const keys = ["user", "school_user", "sms_user"];

    for (const key of keys) {
      try {
        const stored = JSON.parse(localStorage.getItem(key) || "null");
        const user = stored?.user || stored;

        if (user?.role) {
          return String(user.role).toLowerCase();
        }
      } catch {
        // Ignore invalid stored data.
      }
    }

    return "";
  });

  const isAdmin = role === "admin";

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/notice/all-notice");
      setNotices(getArray(response));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const filteredNotices = notices.filter((notice) => {
    const keyword = search.trim().toLowerCase();

    const matchesSearch =
      notice.title?.toLowerCase().includes(keyword) ||
      notice.description?.toLowerCase().includes(keyword);

    const matchesRole =
      roleFilter === "all" || notice.targetRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError("");
    setSuccess("");
    setForm(INITIAL_FORM);
    setEditingId(null);
    setShowForm(true);
  };

  const openEditForm = (notice) => {
    setError("");
    setSuccess("");

    setForm({
      title: notice.title || "",
      description: notice.description || "",
      targetRole: notice.targetRole || "all",
      publishDate: toLocalDateTime(notice.publishDate),
    });

    setEditingId(notice._id);
    setShowForm(true);
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

    if (!form.title.trim() || !form.description.trim()) {
      setError("Please complete the title and description.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      targetRole: form.targetRole,
      publishDate: form.publishDate
        ? new Date(form.publishDate).toISOString()
        : new Date().toISOString(),
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.patch(
          `/notice/update-notice/${editingId}`,
          payload
        );

        setSuccess("Notice updated successfully.");
      } else {
        await api.post("/notice/create", payload);
        setSuccess("Notice created successfully.");
      }

      resetForm();
      await fetchNotices();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noticeId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this notice?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(noticeId);

    try {
      await api.delete(`/notice/notice-delete/${noticeId}`);

      setSuccess("Notice deleted successfully.");

      if (selectedNotice?._id === noticeId) {
        setSelectedNotice(null);
      }

      await fetchNotices();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleView = async (notice) => {
    try {
      const response = await api.get(
        `/notice/single-notice/${notice._id}`
      );

      setSelectedNotice(response.data?.data || notice);
    } catch {
      setSelectedNotice(notice);
    }
  };

  const totalNotices = notices.length;
  const everyoneCount = notices.filter(
    (notice) => notice.targetRole === "all"
  ).length;
  const teacherCount = notices.filter(
    (notice) => notice.targetRole === "teacher"
  ).length;
  const studentCount = notices.filter(
    (notice) => notice.targetRole === "student"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-600">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              School Management System
            </div>

            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              <Bell className="h-8 w-8 text-blue-600" />
              Notice Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create and manage school announcements.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchNotices}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Notice
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span className="font-bold">!</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            {success}
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Notices
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalNotices}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  All announcements
                </p>
              </div>

              <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                <Bell className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Everyone
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {everyoneCount}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  General announcements
                </p>
              </div>

              <div className="rounded-2xl bg-violet-50 p-4 text-violet-600">
                <Users className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Teachers
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {teacherCount}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Teacher announcements
                </p>
              </div>

              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                <GraduationCap className="h-7 w-7" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Students
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {studentCount}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Student announcements
                </p>
              </div>

              <div className="rounded-2xl bg-amber-50 p-4 text-amber-600">
                <BookOpen className="h-7 w-7" />
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Notice Form */}
        {showForm && isAdmin && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingId ? "Edit Notice" : "Create Notice"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Fill in the announcement details below.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
                aria-label="Close form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Notice Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={form.title}
                    onChange={handleChange}
                    maxLength={100}
                    placeholder="Enter notice title"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="targetRole"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Target Audience <span className="text-red-500">*</span>
                  </label>

                  <select
                    id="targetRole"
                    name="targetRole"
                    value={form.targetRole}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="all">Everyone</option>
                    <option value="teacher">Teachers</option>
                    <option value="student">Students</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="publishDate"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Publish Date & Time
                  </label>

                  <input
                    id="publishDate"
                    name="publishDate"
                    type="datetime-local"
                    value={form.publishDate}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Notice Description <span className="text-red-500">*</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Write the full notice here..."
                  rows={5}
                  required
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="mt-7 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    "Saving..."
                  ) : editingId ? (
                    <>
                      <Pencil className="h-4 w-4" />
                      Update Notice
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Publish Notice
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Notice List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                All Notices
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredNotices.length} notice
                {filteredNotices.length === 1 ? "" : "s"} found
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <Megaphone className="h-4 w-4" />
              School Announcements
            </span>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:px-6">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3.5 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notices..."
                className="w-full border-0 bg-transparent py-3 text-sm outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              aria-label="Filter notices by audience"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">All Audiences</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-5 py-16">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-4 text-sm text-slate-500">
                Loading notices...
              </p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
                <Bell className="h-10 w-10" />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                No notices found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Try another search or create a new notice.
              </p>

              {isAdmin && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Add First Notice
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-semibold">#</th>
                    <th className="px-5 py-4 font-semibold">Notice</th>
                    <th className="px-5 py-4 font-semibold">Audience</th>
                    <th className="px-5 py-4 font-semibold">Publish Date</th>
                    <th className="px-5 py-4 font-semibold">Created By</th>
                    <th className="px-5 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredNotices.map((notice, index) => (
                    <tr
                      key={notice._id || index}
                      className="transition hover:bg-blue-50/40"
                    >
                      <td className="px-5 py-4 text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </td>

                      <td className="max-w-sm px-5 py-4">
                        <p className="font-semibold text-slate-800">
                          {notice.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {notice.description}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                            notice.targetRole === "teacher"
                              ? "bg-violet-50 text-violet-700"
                              : notice.targetRole === "student"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {getRoleLabel(notice.targetRole)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-slate-400" />
                          {formatDate(notice.publishDate)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {notice.createdBy?.name || "School Admin"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleView(notice)}
                            title="View notice"
                            aria-label="View notice"
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditForm(notice)}
                                title="Edit notice"
                                aria-label="Edit notice"
                                className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-700 transition hover:bg-amber-100"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(notice._id)}
                                disabled={deletingId === notice._id}
                                title="Delete notice"
                                aria-label="Delete notice"
                                className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-400 sm:px-6">
            School Notice Management
          </div>
        </section>

        {/* Notice Details Modal */}
        {selectedNotice && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
            onClick={() => setSelectedNotice(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-xl rounded-2xl bg-white shadow-xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Notice Details
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNotice(null)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                  aria-label="Close details"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6">
                <span className="inline-flex rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  {getRoleLabel(selectedNotice.targetRole)}
                </span>

                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  {selectedNotice.title}
                </h3>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                  {selectedNotice.description}
                </p>

                <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(selectedNotice.publishDate)}
                  </p>

                  <p className="mt-2">
                    Created by:{" "}
                    {selectedNotice.createdBy?.name || "School Admin"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

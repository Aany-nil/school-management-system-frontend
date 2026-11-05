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
  AlertCircle,
  CheckCircle,
  Printer,
} from "lucide-react";

import api from "../../services/api";

const INITIAL_FORM = {
  title: "",
  description: "",
  targetRole: "all",
  publishDate: "",
};

const inputClass =
  "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

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
  if (Array.isArray(body?.data?.notices)) return body.data.notices;

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

function SummaryCard({ title, value, description, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    green: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 sm:text-sm">
            {title}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {value}
          </h2>
          <p className="mt-1 text-[10px] text-slate-400 sm:text-xs">
            {description}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-lg p-2 sm:rounded-xl sm:p-3 ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
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
  const [viewLoading, setViewLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [schoolInfo, setSchoolInfo] = useState(null);

  const [role] = useState(() => {
    const keys = [
      "user",
      "tasmina_user",
      "school_user",
      "sms_user",
    ];

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

    return String(localStorage.getItem("role") || "").toLowerCase();
  });

  const isAdmin = role === "admin";

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/notice/all-notice");
      setNotices(getArray(response));
    } catch (err) {
      setNotices([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch school information for print report.
  const fetchSchoolInfo = useCallback(async () => {
    if (!isAdmin) return;

    try {
      const response = await api.get("/settings/school-info");

      const info =
        response.data?.data?.school ||
        response.data?.data ||
        response.data?.school ||
        response.data;

      setSchoolInfo(info);
    } catch (err) {
      console.error("School information loading failed:", err);
      setSchoolInfo(null);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  useEffect(() => {
    fetchSchoolInfo();
  }, [fetchSchoolInfo]);

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
    setError("");
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

      setForm(INITIAL_FORM);
      setEditingId(null);
      setShowForm(false);

      await fetchNotices();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noticeId) => {
    if (!noticeId) return;

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
    setViewLoading(true);
    setSelectedNotice(notice);

    try {
      const response = await api.get(
        `/notice/single-notice/${notice._id}`
      );

      setSelectedNotice(response.data?.data || notice);
    } catch {
      setSelectedNotice(notice);
    } finally {
      setViewLoading(false);
    }
  };

  // ADMIN ONLY: Print Notice Report.
  const handlePrint = () => {
    if (!isAdmin) return;

    if (filteredNotices.length === 0) {
      window.alert("No notices available to print.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      window.alert("Please allow pop-ups to print the notice report.");
      return;
    }

    const schoolName =
      schoolInfo?.schoolName ||
      schoolInfo?.name ||
      schoolInfo?.institutionName ||
      "School Management System";

    const schoolAddress =
      schoolInfo?.address ||
      schoolInfo?.schoolAddress ||
      "";

    const schoolPhone =
      schoolInfo?.phone ||
      schoolInfo?.contactNumber ||
      schoolInfo?.phoneNumber ||
      "";

    const schoolEmail =
      schoolInfo?.email ||
      schoolInfo?.schoolEmail ||
      "";

    const schoolLogo =
      schoolInfo?.logo ||
      schoolInfo?.schoolLogo ||
      schoolInfo?.logoUrl ||
      "";

    const contactInfo = [
      schoolAddress,
      schoolPhone ? `Phone: ${schoolPhone}` : "",
      schoolEmail ? `Email: ${schoolEmail}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    const escapeHTML = (value) =>
      String(value ?? "—").replace(/[&<>"']/g, (character) => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };

        return entities[character];
      });

    const noticeRows = filteredNotices
      .map(
        (notice, index) => `
          <article class="notice-item">
            <div class="notice-top">
              <span class="notice-number">${String(index + 1).padStart(2, "0")}</span>
              <span class="audience">${escapeHTML(getRoleLabel(notice.targetRole))}</span>
            </div>

            <h3>${escapeHTML(notice.title)}</h3>

            <div class="meta">
              <span><strong>Publish Date:</strong> ${escapeHTML(formatDate(notice.publishDate))}</span>
              <span><strong>Created By:</strong> ${escapeHTML(notice.createdBy?.name || "School Admin")}</span>
            </div>

            <p class="description">${escapeHTML(notice.description).replace(/\n/g, "<br>")}</p>
          </article>
        `
      )
      .join("");

    const filterDescription =
      roleFilter === "all"
        ? "All Audiences"
        : getRoleLabel(roleFilter);

    const printDate = formatDate(new Date());

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Notice Report</title>

          <style>
            @page {
              size: A4 portrait;
              margin: 18mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #111827;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 12px;
              line-height: 1.6;
            }

            .school-header {
              text-align: center;
              padding-bottom: 15px;
              border-bottom: 2px solid #111827;
              margin-bottom: 22px;
            }

            .logo {
              width: 65px;
              height: 65px;
              object-fit: contain;
              margin: 0 auto 8px;
            }

            .school-name {
              font-size: 23px;
              font-weight: 700;
              margin: 0 0 5px;
              text-transform: uppercase;
            }

            .school-contact {
              font-size: 10px;
              color: #4b5563;
              margin: 3px 0;
            }

            .report-title {
              font-size: 19px;
              font-weight: 700;
              text-align: center;
              margin: 22px 0 5px;
              text-transform: uppercase;
            }

            .report-subtitle {
              text-align: center;
              font-size: 11px;
              color: #4b5563;
              margin-bottom: 18px;
            }

            .report-info {
              display: flex;
              justify-content: space-between;
              gap: 12px;
              border-bottom: 1px solid #d1d5db;
              padding-bottom: 10px;
              margin-bottom: 18px;
              font-size: 11px;
            }

            .notice-item {
              padding: 13px 0 16px;
              border-bottom: 1px solid #d1d5db;
              page-break-inside: avoid;
              break-inside: avoid;
            }

            .notice-top {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 7px;
            }

            .notice-number {
              font-size: 11px;
              font-weight: 700;
              color: #6b7280;
            }

            .audience {
              font-size: 10px;
              font-weight: 700;
              padding: 3px 9px;
              border: 1px solid #9ca3af;
              border-radius: 20px;
            }

            .notice-item h3 {
              font-size: 15px;
              margin: 4px 0 7px;
              font-weight: 700;
              color: #111827;
              overflow-wrap: anywhere;
            }

            .meta {
              display: flex;
              flex-wrap: wrap;
              gap: 8px 20px;
              color: #4b5563;
              font-size: 10px;
              margin-bottom: 9px;
            }

            .description {
              font-size: 11px;
              line-height: 1.8;
              color: #374151;
              white-space: normal;
              overflow-wrap: anywhere;
              margin: 0;
            }

            .total-count {
              margin-top: 16px;
              text-align: right;
              font-size: 11px;
              font-weight: 700;
            }

            .print-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 65px;
              page-break-inside: avoid;
            }

            .print-date {
              font-size: 10px;
              color: #6b7280;
            }

            .signature {
              width: 190px;
              text-align: center;
              padding-top: 8px;
              border-top: 1px solid #111827;
              font-size: 11px;
              font-weight: 600;
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>

        <body>
          <header class="school-header">
            ${
              schoolLogo
                ? `<img class="logo" src="${escapeHTML(schoolLogo)}" alt="School Logo" />`
                : ""
            }

            <h1 class="school-name">${escapeHTML(schoolName)}</h1>

            ${
              contactInfo
                ? `<p class="school-contact">${escapeHTML(contactInfo)}</p>`
                : ""
            }
          </header>

          <h2 class="report-title">Notice Report</h2>

          <p class="report-subtitle">
            School Announcements and Notifications
          </p>

          <div class="report-info">
            <span><strong>Audience:</strong> ${escapeHTML(filterDescription)}</span>
            <span><strong>Search:</strong> ${escapeHTML(search.trim() || "All Notices")}</span>
          </div>

          ${noticeRows}

          <p class="total-count">
            Total Notices: ${filteredNotices.length}
          </p>

          <footer class="print-footer">
            <div class="print-date">
              Printed on: ${escapeHTML(printDate)}
            </div>

            <div class="signature">
              Authorized Signature
            </div>
          </footer>

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
                setTimeout(() => {
                  window.print();
                }, 300);
              });
            };

            window.onafterprint = function () {
              window.close();
            };
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
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
    <div className="min-h-screen w-full min-w-0 bg-slate-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto w-full max-w-7xl min-w-0">

        {/* Page Header */}
        <div className="mb-6 flex flex-col justify-between gap-4 sm:mb-8 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-600 sm:text-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              School Management System
            </div>

            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900 sm:gap-3 sm:text-3xl">
              <Bell className="h-7 w-7 shrink-0 text-blue-600 sm:h-8 sm:w-8" />
              Notice Management
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:mt-2 sm:text-sm">
              Create and manage school announcements.
            </p>
          </div>

          <div
            className={`grid w-full gap-2 sm:flex sm:w-auto ${
              isAdmin ? "grid-cols-2 sm:flex-wrap" : "grid-cols-1"
            }`}
          >
            <button
              type="button"
              onClick={fetchNotices}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={loading || filteredNotices.length === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-gray-500 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm"
                >
                  <Printer size={16} />
                  Print Report
                </button>

                <button
                  type="button"
                  onClick={openCreateForm}
                  className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:col-span-1 sm:px-5 sm:text-sm"
                >
                  <Plus size={17} />
                  Create Notice
                </button>
              </>
            )}
          </div>
        </div>

        {/* Page Alerts */}
        {error && !showForm && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="break-words">{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 sm:p-4"
          >
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-5 xl:grid-cols-4">
          <SummaryCard
            title="Total Notices"
            value={totalNotices}
            description="All announcements"
            icon={<Bell size={22} />}
            color="blue"
          />

          <SummaryCard
            title="Everyone"
            value={everyoneCount}
            description="General announcements"
            icon={<Users size={22} />}
            color="violet"
          />

          <SummaryCard
            title="Teachers"
            value={teacherCount}
            description="Teacher announcements"
            icon={<GraduationCap size={22} />}
            color="green"
          />

          <SummaryCard
            title="Students"
            value={studentCount}
            description="Student announcements"
            icon={<BookOpen size={22} />}
            color="amber"
          />
        </div>

        {/* Notice List */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:px-6 sm:py-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                All Notices
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {filteredNotices.length} notice
                {filteredNotices.length === 1 ? "" : "s"} found
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <Megaphone size={15} />
              School Announcements
            </span>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:p-5 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3.5 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
              <Search size={17} className="shrink-0 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search notices..."
                className="w-full min-w-0 border-0 bg-transparent py-3 text-sm outline-none"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              aria-label="Filter notices by audience"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 sm:w-48"
            >
              <option value="all">All Audiences</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-5 py-16">
              <RefreshCw size={32} className="animate-spin text-blue-600" />
              <p className="mt-4 text-sm text-slate-500">
                Loading notices...
              </p>
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="mb-4 rounded-2xl bg-slate-100 p-4 text-slate-400">
                <Bell size={36} />
              </div>

              <h3 className="text-base font-bold text-slate-800">
                No notices found
              </h3>

              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Try another search or create a new notice.
              </p>

              {isAdmin && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Plus size={16} />
                  Add First Notice
                </button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
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
                          <CalendarDays size={15} className="text-slate-400" />
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
                            <Eye size={15} />
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
                                <Pencil size={15} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(notice._id)}
                                disabled={deletingId === notice._id}
                                title="Delete notice"
                                aria-label="Delete notice"
                                className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                              >
                                {deletingId === notice._id ? (
                                  <RefreshCw size={15} className="animate-spin" />
                                ) : (
                                  <Trash2 size={15} />
                                )}
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

          <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-400 sm:px-6">
            School Notice Management
          </div>
        </section>
      </div>

      {/* CREATE / EDIT NOTICE POPUP */}
      {showForm && isAdmin && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              resetForm();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-modal-title"
            className="my-auto flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="hidden rounded-xl bg-blue-50 p-3 text-blue-600 sm:block">
                  {editingId ? <Pencil size={21} /> : <Megaphone size={21} />}
                </div>

                <div className="min-w-0">
                  <h2
                    id="notice-modal-title"
                    className="text-base font-bold text-slate-900 sm:text-lg"
                  >
                    {editingId ? "Edit Notice" : "Create New Notice"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                    {editingId
                      ? "Update your school announcement."
                      : "Fill in the details to publish a notice."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
                aria-label="Close popup"
              >
                <X size={21} />
              </button>
            </div>

            {/* Scrollable Form */}
            <form
              id="notice-form"
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                {error && (
                  <div
                    role="alert"
                    className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    <p className="break-words">{error}</p>
                  </div>
                )}

                <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50/60 p-3 sm:p-4">
                  <p className="text-xs font-semibold text-blue-800 sm:text-sm">
                    Notice Information
                  </p>
                  <p className="mt-1 text-xs text-blue-600">
                    Add a title, audience, publish date and full description.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
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
                      className={inputClass}
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
                      required
                      className={inputClass}
                    >
                      <option value="all">Everyone</option>
                      <option value="teacher">Teachers</option>
                      <option value="student">Students</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
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
                      className={inputClass}
                    />
                    <p className="mt-1.5 text-xs text-slate-400">
                      Leave empty to publish with the current date and time.
                    </p>
                  </div>

                  <div className="sm:col-span-2">
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
                      rows={6}
                      required
                      className={`${inputClass} resize-y`}
                    />
                  </div>
                </div>
              </div>

              {/* Fixed Modal Footer */}
              <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white p-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      {editingId ? <Pencil size={16} /> : <Plus size={17} />}
                      {editingId ? "Update Notice" : "Publish Notice"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* NOTICE DETAILS POPUP */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedNotice(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="notice-details-title"
            className="my-auto flex max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Details Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                  <Bell size={20} />
                </div>

                <div>
                  <h2
                    id="notice-details-title"
                    className="text-base font-bold text-slate-900"
                  >
                    Notice Details
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    School announcement information
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Close details"
              >
                <X size={20} />
              </button>
            </div>

            {/* Details Body */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {viewLoading && (
                <div className="mb-4 flex items-center gap-2 text-xs text-blue-600">
                  <RefreshCw size={14} className="animate-spin" />
                  Refreshing notice details...
                </div>
              )}

              <span
                className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
                  selectedNotice.targetRole === "teacher"
                    ? "bg-violet-50 text-violet-700"
                    : selectedNotice.targetRole === "student"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {getRoleLabel(selectedNotice.targetRole)}
              </span>

              <h3 className="mt-4 break-words text-xl font-bold text-slate-900">
                {selectedNotice.title}
              </h3>

              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
                {selectedNotice.description}
              </p>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-sm text-slate-500">
                <p className="flex items-start gap-2">
                  <CalendarDays size={16} className="mt-0.5 shrink-0" />
                  <span>{formatDate(selectedNotice.publishDate)}</span>
                </p>

                <p>
                  Created by:{" "}
                  {selectedNotice.createdBy?.name || "School Admin"}
                </p>
              </div>
            </div>

            {/* Details Footer */}
            <div className="shrink-0 border-t border-slate-100 bg-white p-4 sm:px-6">
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="w-full rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Search,
  RefreshCw,
  FileText,
  X,
  Loader2,
  AlertCircle,
  Megaphone,
} from "lucide-react";

import api from "../../services/api";

const NoticeManagement = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedNotice, setSelectedNotice] = useState(null);

  // Fetch Student Notices
  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notice/all-notice");

      setNotices(response.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load notices. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // Search Notice
  const filteredNotices = notices.filter((notice) => {
    const searchText = search.toLowerCase();

    return (
      notice.title?.toLowerCase().includes(searchText) ||
      notice.description?.toLowerCase().includes(searchText)
    );
  });

  // Format Date
  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* Page Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-blue-100 p-2">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-800">
              Notice Board
            </h1>
          </div>

          <p className="text-sm text-gray-500">
            Stay updated with the latest school announcements.
          </p>
        </div>

        <button
          onClick={fetchNotices}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary Card */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Notices</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {notices.length}
              </h2>
            </div>

            <div className="rounded-xl bg-blue-100 p-3">
              <Megaphone className="h-7 w-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Showing Notices</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-800">
                {filteredNotices.length}
              </h2>
            </div>

            <div className="rounded-xl bg-purple-100 p-3">
              <FileText className="h-7 w-7 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={19}
          />

          <input
            type="text"
            placeholder="Search notices by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle size={19} />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-52 items-center justify-center rounded-xl bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">
              Loading notices...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Notice List */}
          {filteredNotices.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filteredNotices.map((notice) => (
                <div
                  key={notice._id}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-blue-100 p-3">
                        <Bell className="h-5 w-5 text-blue-600" />
                      </div>

                      <div>
                        <h2 className="font-semibold text-gray-800">
                          {notice.title}
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                          School Announcement
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                      Notice
                    </span>
                  </div>

                  <p className="mb-5 line-clamp-3 text-sm leading-6 text-gray-600">
                    {notice.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays size={15} />
                      {formatDate(notice.publishDate)}
                    </div>

                    <button
                      onClick={() => setSelectedNotice(notice)}
                      className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-600 hover:text-white"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-white px-5 py-16 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-700">
                No Notices Found
              </h3>

              <p className="text-sm text-gray-500">
                {search
                  ? "No notices match your search."
                  : "There are currently no notices available."}
              </p>
            </div>
          )}
        </>
      )}

      {/* Notice Details Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>

                <h2 className="text-lg font-bold text-gray-800">
                  Notice Details
                </h2>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-500"
              >
                <X size={21} />
              </button>
            </div>

            <div className="p-6">
              <h3 className="mb-4 text-xl font-bold text-gray-800">
                {selectedNotice.title}
              </h3>

              <div className="mb-5 flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {formatDate(selectedNotice.publishDate)}
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  {selectedNotice.targetRole === "all"
                    ? "All Users"
                    : "Student"}
                </span>
              </div>

              <div className="rounded-xl bg-gray-50 p-5">
                <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {selectedNotice.description}
                </p>
              </div>

              {selectedNotice.createdBy && (
                <p className="mt-5 text-xs text-gray-400">
                  Published by: {selectedNotice.createdBy.name || "Admin"}
                </p>
              )}
            </div>

            <div className="flex justify-end border-t border-gray-100 p-5">
              <button
                onClick={() => setSelectedNotice(null)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default NoticeManagement;

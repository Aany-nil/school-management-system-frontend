
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

  // Fetch Notices
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

  // Search Notices
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
    <div className="min-h-screen w-full min-w-0 space-y-5 bg-gray-50 p-3 sm:space-y-6 sm:p-5 lg:p-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <div className="shrink-0 rounded-lg bg-blue-100 p-2">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>

            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
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
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 sm:text-sm">
                Total Notices
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
                {notices.length}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-blue-100 p-2.5 sm:p-3">
              <Megaphone className="h-5 w-5 text-blue-600 sm:h-7 sm:w-7" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-gray-500 sm:text-sm">
                Showing Notices
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800 sm:text-3xl">
                {filteredNotices.length}
              </h2>
            </div>

            <div className="shrink-0 rounded-xl bg-purple-100 p-2.5 sm:p-3">
              <FileText className="h-5 w-5 text-purple-600 sm:h-7 sm:w-7" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm sm:p-4">
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
            className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex min-h-52 items-center justify-center rounded-xl border border-gray-100 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 text-blue-600" />

            <p className="text-sm text-gray-500">
              Loading notices...
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Notice List */}
          {filteredNotices.length > 0 ? (
            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5">
              {filteredNotices.map((notice) => (
                <div
                  key={notice._id}
                  className="min-w-0 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-5"
                >
                  {/* Notice Header */}
                  <div className="mb-4 flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <div className="shrink-0 rounded-lg bg-blue-100 p-2.5 sm:p-3">
                        <Bell className="h-5 w-5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words font-semibold text-gray-800">
                          {notice.title}
                        </h2>

                        <p className="mt-1 text-xs text-gray-400">
                          School Announcement
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 sm:px-3">
                      Notice
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mb-5 line-clamp-3 break-words text-sm leading-6 text-gray-600">
                    {notice.description}
                  </p>

                  {/* Footer */}
                  <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays size={15} className="shrink-0" />
                      {formatDate(notice.publishDate)}
                    </div>

                    <button
                      onClick={() => setSelectedNotice(notice)}
                      className="w-full rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 transition hover:bg-blue-600 hover:text-white sm:w-auto"
                    >
                      Read More
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-gray-100 bg-white px-4 py-12 text-center shadow-sm sm:py-16">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-3 sm:p-5"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-gray-100 bg-white p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <div className="shrink-0 rounded-lg bg-blue-100 p-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>

                <h2 className="text-base font-bold text-gray-800 sm:text-lg">
                  Notice Details
                </h2>
              </div>

              <button
                onClick={() => setSelectedNotice(null)}
                className="shrink-0 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-500"
                aria-label="Close notice"
              >
                <X size={21} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <h3 className="mb-4 break-words text-lg font-bold text-gray-800 sm:text-xl">
                {selectedNotice.title}
              </h3>

              <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-gray-500 sm:gap-4">
                <span className="flex items-center gap-2">
                  <CalendarDays size={16} />
                  {formatDate(selectedNotice.publishDate)}
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  {selectedNotice.targetRole === "all"
                    ? "All Users"
                    : selectedNotice.targetRole === "teacher"
                      ? "Teacher"
                      : "Student"}
                </span>
              </div>

              <div className="rounded-xl bg-gray-50 p-4 sm:p-5">
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                  {selectedNotice.description}
                </p>
              </div>

              {selectedNotice.createdBy && (
                <p className="mt-5 text-xs text-gray-400">
                  Published by: {selectedNotice.createdBy.name || "Admin"}
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end border-t border-gray-100 p-4 sm:p-5">
              <button
                onClick={() => setSelectedNotice(null)}
                className="w-full rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 sm:w-auto"
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

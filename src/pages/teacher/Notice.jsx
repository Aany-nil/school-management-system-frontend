
import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import {
  Bell,
  CalendarDays,
  Search,
  RefreshCw,
  AlertCircle,
  Megaphone,
  User,
  FileText,
} from "lucide-react";

const NoticeList = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch Notices
  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/notice/all-notice");
      const data = response.data?.data || [];

      setNotices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notice fetch error:", err);

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

  // Format Date
  const formatDate = (date) => {
    if (!date) return "Date not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date not available";
    }

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Sort Notices
  const sortedNotices = useMemo(() => {
    return [...notices].sort(
      (a, b) =>
        new Date(b.publishDate || b.createdAt || 0) -
        new Date(a.publishDate || a.createdAt || 0)
    );
  }, [notices]);

  // Search Notices
  const filteredNotices = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return sortedNotices;

    return sortedNotices.filter((notice) => {
      const title = notice.title || "";
      const description = notice.description || "";
      const targetRole = notice.targetRole || "";
      const createdBy = notice.createdBy?.name || "";

      return `${title} ${description} ${targetRole} ${createdBy}`
        .toLowerCase()
        .includes(keyword);
    });
  }, [sortedNotices, search]);

  const latestNotice = sortedNotices[0];

  return (
    <div className="space-y-5 p-3 sm:p-5 lg:p-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            Notice Board
          </h1>

          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Stay updated with the latest school announcements.
          </p>
        </div>

        <button
          onClick={fetchNotices}
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          <RefreshCw
            size={17}
            className={loading ? "animate-spin" : ""}
          />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">

        {/* Total Notices */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 sm:text-sm">
                Total Notices
              </p>

              <h2 className="mt-2 text-xl font-bold text-gray-800 sm:text-2xl">
                {notices.length}
              </h2>
            </div>

            <div className="shrink-0 rounded-lg bg-blue-100 p-2 text-blue-600 sm:p-3">
              <Bell size={20} className="sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>

        {/* Latest Notice */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 sm:text-sm">
                Latest Notice
              </p>

              <h2 className="mt-2 truncate text-sm font-bold text-gray-800 sm:text-lg">
                {latestNotice
                  ? formatDate(
                      latestNotice.publishDate ||
                        latestNotice.createdAt
                    )
                  : "No notices"}
              </h2>
            </div>

            <div className="shrink-0 rounded-lg bg-purple-100 p-2 text-purple-600 sm:p-3">
              <CalendarDays size={20} className="sm:h-6 sm:w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 sm:p-4">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <Search
          size={18}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search by title, description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-gray-200 bg-white">
          <div className="text-center">
            <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />

            <p className="text-sm text-gray-500">
              Loading notices...
            </p>
          </div>
        </div>
      )}

      {/* Notice List */}
      {!loading && (
        <>
          {filteredNotices.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4">

              {filteredNotices.map((notice) => (
                <div
                  key={notice._id}
                  className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md sm:p-5"
                >
                  {/* Notice Header */}
                  <div className="flex items-start justify-between gap-2 sm:gap-3">
                    <div className="flex min-w-0 items-start gap-2 sm:gap-3">
                      <div className="shrink-0 rounded-lg bg-blue-100 p-2 text-blue-600 sm:p-2.5">
                        <Megaphone size={20} />
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words text-sm font-semibold text-gray-800 sm:text-lg">
                          {notice.title || "Untitled Notice"}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 text-[10px] text-gray-500 sm:gap-x-3 sm:text-xs">
                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} />
                            {formatDate(
                              notice.publishDate || notice.createdAt
                            )}
                          </span>

                          <span className="flex items-center gap-1">
                            <User size={12} />
                            {notice.createdBy?.name || "Admin"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-[9px] font-medium text-green-700 sm:text-xs">
                      Published
                    </span>
                  </div>

                  {/* Description */}
                  <div className="mt-4 border-t border-gray-100 pt-3 sm:pt-4">
                    <div className="flex items-start gap-2">
                      <FileText
                        size={16}
                        className="mt-1 shrink-0 text-gray-400"
                      />

                      <p className="min-w-0 break-words whitespace-pre-line text-xs leading-6 text-gray-600 sm:text-sm sm:leading-7">
                        {notice.description ||
                          "No description available."}
                      </p>
                    </div>
                  </div>

                  {/* Target Role */}
                  <div className="mt-4 flex justify-end">
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-medium capitalize text-blue-700 sm:px-3 sm:text-xs">
                      For: {notice.targetRole || "all"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-gray-200 bg-white px-5 py-12 text-center shadow-sm">
              <Bell
                size={42}
                className="mx-auto mb-3 text-gray-300"
              />

              <h3 className="font-semibold text-gray-700">
                No Notice Found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "No notices match your search."
                  : "No notices are available at the moment."}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NoticeList;

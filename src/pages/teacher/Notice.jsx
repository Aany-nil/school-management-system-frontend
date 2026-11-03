
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


  const filteredNotices = useMemo(() => {
    return [...notices]
      .filter((notice) => {
        const title = notice.title || "";
        const description = notice.description || "";

        return `${title} ${description}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
      })
      .sort(
        (a, b) =>
          new Date(b.publishDate || b.createdAt || 0) -
          new Date(a.publishDate || a.createdAt || 0)
      );
  }, [notices, search]);


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

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-500">
            Loading notices...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Notice Board
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Stay updated with the latest school announcements.
          </p>
        </div>

        <button
          onClick={fetchNotices}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Notices
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-800">
                {notices.length}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
              <Bell size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Latest Notice
              </p>

              <h2 className="mt-2 text-lg font-bold text-gray-800">
                {filteredNotices.length > 0
                  ? formatDate(
                      filteredNotices[0].publishDate ||
                        filteredNotices[0].createdAt
                    )
                  : "No notices"}
              </h2>
            </div>

            <div className="rounded-lg bg-purple-100 p-3 text-purple-600">
              <CalendarDays size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="relative rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <Search
          size={18}
          className="absolute left-7 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          placeholder="Search notices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {/* Notice List */}
      <div className="space-y-4">
        {filteredNotices.map((notice) => (
          <div
            key={notice._id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            {/* Notice Header */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-blue-100 p-3 text-blue-600">
                  <Megaphone size={22} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    {notice.title || "Untitled Notice"}
                  </h2>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} />
                      {formatDate(
                        notice.publishDate || notice.createdAt
                      )}
                    </span>

                    <span className="flex items-center gap-1">
                      <User size={14} />
                      {notice.createdBy?.name || "Admin"}
                    </span>
                  </div>
                </div>
              </div>

              <span className="w-fit rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Published
              </span>
            </div>

            {/* Description */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <div className="flex items-start gap-2">
                <FileText
                  size={17}
                  className="mt-1 shrink-0 text-gray-400"
                />

                <p className="whitespace-pre-line text-sm leading-7 text-gray-600">
                  {notice.description ||
                    "No description available."}
                </p>
              </div>
            </div>

            {/* Target Role */}
            <div className="mt-4 flex justify-end">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-700">
                For: {notice.targetRole || "all"}
              </span>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {filteredNotices.length === 0 && (
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
      </div>
    </div>
  );
};

export default NoticeList;
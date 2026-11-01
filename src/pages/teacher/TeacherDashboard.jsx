
import { useEffect, useState } from "react";
import api from "../../services/api";

import {
  Users,
  BookOpen,
  Wallet,
  Bell,
  CalendarDays,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  Mail,
  MapPin,
  UserCircle,
  ArrowRight,
} from "lucide-react";

const TeacherDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/teacher");

      setDashboard(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const profile = dashboard?.profile;
  const recentNotices = dashboard?.recentNotices || [];

  const stats = [
    {
      title: "Total Classes",
      value: dashboard?.totalClasses ?? 0,
      icon: Users,
      color: "blue",
      description: "Available classes",
    },
    {
      title: "Total Subjects",
      value: dashboard?.totalSubjects ?? 0,
      icon: BookOpen,
      color: "purple",
      description: "Assigned subjects",
    },
    {
      title: "Monthly Salary",
      value: profile?.monthlySalary
        ? `৳ ${Number(profile.monthlySalary).toLocaleString("en-BD")}`
        : "৳ 0",
      icon: Wallet,
      color: "emerald",
      description: "Fixed monthly salary",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="mx-auto h-9 w-9 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-slate-800">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchDashboard}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-600">
              School Management System
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">
              Teacher Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Welcome back! Here is your teaching overview.
            </p>
          </div>

          <button
            onClick={fetchDashboard}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Profile Welcome Card */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/20">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile?.name || "Teacher"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <GraduationCap size={38} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-blue-100">Welcome back,</p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                {profile?.name || "Teacher"}
              </h2>
              <p className="mt-2 text-sm text-blue-100">
                {profile?.email || "Teacher account"}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                Teacher
              </span>
            </div>

            <div className="hidden text-right sm:block">
              <CalendarDays className="ml-auto mb-2 text-blue-100" size={30} />
              <p className="text-sm text-blue-100">Your Workspace</p>
              <p className="font-semibold">Teacher Portal</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {item.title}
                    </p>
                    <h3 className="mt-3 text-2xl font-bold text-slate-800">
                      {item.value}
                    </h3>
                    <p className="mt-2 text-xs text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  <div className={`rounded-xl p-4 ${colorClasses[item.color]}`}>
                    <Icon size={25} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Profile Information */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-1">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <UserCircle size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">
                  My Profile
                </h3>
                <p className="text-xs text-slate-400">
                  Personal information
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <UserCircle className="mt-0.5 text-slate-400" size={18} />
                <div>
                  <p className="text-xs text-slate-400">Full Name</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {profile?.name || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 text-slate-400" size={18} />
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">Email Address</p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                    {profile?.email || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 text-slate-400" size={18} />
                <div>
                  <p className="text-xs text-slate-400">Address</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {profile?.address || "Address not added"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">About Me</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {profile?.bio || "No bio added yet."}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Notices */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                  <Bell size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    Recent Notices
                  </h3>
                  <p className="text-xs text-slate-400">
                    Latest school announcements
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                {recentNotices.length} Notices
              </span>
            </div>

            {recentNotices.length > 0 ? (
              <div className="space-y-4">
                {recentNotices.map((notice) => (
                  <div
                    key={notice._id}
                    className="rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-lg bg-amber-50 p-2 text-amber-600">
                        <Bell size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-800">
                          {notice.title}
                        </h4>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                          {notice.description}
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                          {notice.publishDate
                            ? new Date(notice.publishDate).toLocaleDateString(
                                "en-BD",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                }
                              )
                            : "Date not available"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 py-12 text-center">
                <Bell className="mx-auto text-slate-300" size={35} />
                <p className="mt-3 font-semibold text-slate-600">
                  No notices available
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  New school announcements will appear here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white px-5 py-4 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-slate-500">
            Keep up with your classes and school announcements.
          </p>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <GraduationCap size={18} />
            Teacher Portal
          </div>
        </div>

      </div>
    </div>
  );
};

export default TeacherDashboard;
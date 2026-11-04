
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
      title: "Total Students",
      value: dashboard?.totalStudents ?? 0,
      icon: Users,
      color: "blue",
      description: "Students in your assigned classes",
    },
    {
      title: "Total Classes",
      value: dashboard?.totalClasses ?? 0,
      icon: GraduationCap,
      color: "purple",
      description: "Your assigned classes",
    },
    {
      title: "Total Subjects",
      value: dashboard?.totalSubjects ?? 0,
      icon: BookOpen,
      color: "emerald",
      description: "Subjects in your assigned classes",
    },
    {
      title: "Monthly Salary",
      value: `৳ ${Number(
        profile?.monthlySalary || 0
      ).toLocaleString("en-BD")}`,
      icon: Wallet,
      color: "amber",
      description: "Fixed monthly salary",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <RefreshCw className="mx-auto h-9 w-9 animate-spin text-blue-600" />
          <p className="mt-3 text-sm font-medium text-slate-600">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-5 sm:p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-4 text-xl font-bold text-slate-800">
            Something went wrong
          </h2>

          <p className="mt-2 text-sm text-slate-500 break-words">
            {error}
          </p>

          <button
            onClick={fetchDashboard}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5 sm:space-y-7">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-blue-600">
              School Management System
            </p>

            <h1 className="mt-1 text-xl font-bold text-slate-800 sm:text-3xl">
              Teacher Dashboard
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Welcome back! Here is your teaching overview.
            </p>
          </div>

          <button
            onClick={fetchDashboard}
            disabled={loading}
            className="inline-flex w-full sm:w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Welcome Profile Card */}
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-4 sm:p-6 lg:p-8 text-white shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/30 bg-white/20">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt={profile?.name || "Teacher"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <GraduationCap size={34} />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm text-blue-100">
                Welcome back,
              </p>

              <h2 className="mt-1 break-words text-xl font-bold sm:text-3xl">
                {profile?.name || "Teacher"}
              </h2>

              <p className="mt-2 break-all text-xs sm:text-sm text-blue-100">
                {profile?.email || "Teacher account"}
              </p>

              <span className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                Teacher
              </span>
            </div>

            <div className="hidden text-right sm:block">
              <CalendarDays
                className="ml-auto mb-2 text-blue-100"
                size={30}
              />

              <p className="text-sm text-blue-100">
                Your Workspace
              </p>

              <p className="font-semibold">
                Teacher Portal
              </p>
            </div>

          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center">

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-500">
                      {item.title}
                    </p>

                    <h3 className="mt-2 break-words text-lg font-bold text-slate-800 sm:mt-3 sm:text-2xl">
                      {item.value}
                    </h3>

                    <p className="mt-1.5 text-[10px] leading-4 text-slate-400 sm:mt-2 sm:text-xs">
                      {item.description}
                    </p>
                  </div>

                  <div
                    className={`w-fit rounded-xl p-2.5 sm:p-3.5 ${colorClasses[item.color]}`}
                  >
                    <Icon size={22} />
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">

          {/* Profile Information */}
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm lg:col-span-1">

            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 sm:p-3 text-blue-600">
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
                <UserCircle
                  className="mt-0.5 shrink-0 text-slate-400"
                  size={18}
                />

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Full Name
                  </p>

                  <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                    {profile?.name || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail
                  className="mt-0.5 shrink-0 text-slate-400"
                  size={18}
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-400">
                    Email Address
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                    {profile?.email || "Not available"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin
                  className="mt-0.5 shrink-0 text-slate-400"
                  size={18}
                />

                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    Address
                  </p>

                  <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                    {profile?.address || "Address not added"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-400">
                  About Me
                </p>

                <p className="mt-2 break-words text-sm leading-6 text-slate-600">
                  {profile?.bio || "No bio added yet."}
                </p>
              </div>

            </div>
          </div>

          {/* Recent Notices */}
          <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm lg:col-span-2">

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">

                <div className="rounded-xl bg-amber-50 p-2.5 sm:p-3 text-amber-600">
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
              <div className="space-y-3 sm:space-y-4">
                {recentNotices.map((notice) => (
                  <div
                    key={notice._id}
                    className="rounded-xl border border-slate-100 p-3 sm:p-4 transition hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/30"
                  >
                    <div className="flex items-start gap-3">

                      <div className="mt-1 shrink-0 rounded-lg bg-amber-50 p-2 text-amber-600">
                        <Bell size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="break-words text-sm font-semibold text-slate-800 sm:text-base">
                          {notice.title}
                        </h4>

                        <p className="mt-2 line-clamp-2 break-words text-xs leading-6 text-slate-500 sm:text-sm">
                          {notice.description}
                        </p>

                        <p className="mt-3 text-xs text-slate-400">
                          {notice.publishDate
                            ? new Date(
                                notice.publishDate
                              ).toLocaleDateString("en-BD", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "Date not available"}
                        </p>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 py-10 sm:py-12 text-center">
                <Bell
                  className="mx-auto text-slate-300"
                  size={35}
                />

                <p className="mt-3 font-semibold text-slate-600">
                  No notices available
                </p>

                <p className="mt-1 px-3 text-xs text-slate-400 sm:text-sm">
                  New school announcements will appear here.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-col items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-4 text-center shadow-sm sm:flex-row sm:px-5 sm:text-left">

          <p className="text-xs text-slate-500 sm:text-sm">
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

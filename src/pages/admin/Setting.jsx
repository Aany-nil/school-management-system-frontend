
import { useEffect, useState } from "react";
import {
  Settings,
  School,
  GraduationCap,
  Globe,
  User,
  Lock,
  Save,
  RotateCcw,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  Image,
  ShieldCheck,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";

const initialSettings = {
  schoolName: "My School",
  schoolEmail: "",
  schoolPhone: "",
  schoolAddress: "",
  schoolLogo: "",
  academicYear: "2026",
  currentSession: "2026-2027",
  semester: "First Semester",
  language: "English",
  timezone: "Asia/Dhaka",
  dateFormat: "DD/MM/YYYY",
  adminName: "",
  adminEmail: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const sections = [
  { id: "school", label: "School Information", icon: School },
  { id: "academic", label: "Academic Settings", icon: GraduationCap },
  { id: "general", label: "General Settings", icon: Globe },
  { id: "profile", label: "Admin Profile", icon: User },
  { id: "password", label: "Password Settings", icon: Lock },
];

export default function SettingsManagement() {
  const [activeTab, setActiveTab] = useState("school");
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get("/settings/setting");

      const data = response.data?.data || {};
      const school = data.school || {};
      const admin = data.admin || {};

      setSettings({
        ...initialSettings,
        schoolName: school.schoolName || "My School",
        schoolEmail: school.schoolEmail || "",
        schoolPhone: school.schoolPhone || "",
        schoolAddress: school.schoolAddress || "",
        schoolLogo: school.schoolLogo || "",
        academicYear: school.academicYear || "2026",
        currentSession: school.currentSession || "2026-2027",
        semester: school.semester || "First Semester",
        language: school.language || "English",
        timezone: school.timezone || "Asia/Dhaka",
        dateFormat: school.dateFormat || "DD/MM/YYYY",
        adminName: admin.name || "",
        adminEmail: admin.email || "",
      });

      setLogoError(false);
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to load settings. Please try again."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "schoolLogo") {
      setLogoError(false);
    }

    setMessage("");
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setMessage("");
    setSaving(true);

    try {
      if (activeTab === "school") {
        const payload = {
          schoolName: settings.schoolName,
          schoolEmail: settings.schoolEmail,
          schoolPhone: settings.schoolPhone,
          schoolAddress: settings.schoolAddress,
          schoolLogo: settings.schoolLogo,
        };

        await api.put("/settings/update-setting", payload);
        setMessage("School information saved successfully.");
      } else if (activeTab === "academic") {
        const payload = {
          academicYear: settings.academicYear,
          currentSession: settings.currentSession,
          semester: settings.semester,
        };

        await api.put("/settings/update-setting", payload);
        setMessage("Academic settings saved successfully.");
      } else if (activeTab === "general") {
        const payload = {
          language: settings.language,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat,
        };

        await api.put("/settings/update-setting", payload);
        setMessage("General settings saved successfully.");
      } else if (activeTab === "profile") {
        const payload = {
          name: settings.adminName,
          email: settings.adminEmail,
        };

        const response = await api.put("/settings/profile", payload);
        const admin = response.data?.data || {};

        setSettings((prev) => ({
          ...prev,
          adminName: admin.name ?? prev.adminName,
          adminEmail: admin.email ?? prev.adminEmail,
        }));

        setMessage("Admin profile updated successfully.");
      } else if (activeTab === "password") {
        const {
          currentPassword,
          newPassword,
          confirmPassword,
        } = settings;

        if (!currentPassword || !newPassword || !confirmPassword) {
          setMessage("Please fill in all password fields.");
          setMessageType("error");
          return;
        }

        if (newPassword.length < 8) {
          setMessage("New password must be at least 8 characters.");
          setMessageType("error");
          return;
        }

        if (newPassword !== confirmPassword) {
          setMessage("New password and confirm password do not match.");
          setMessageType("error");
          return;
        }

        const response = await api.put("/settings/password", {
          currentPassword,
          newPassword,
          confirmPassword,
        });

        setSettings((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));

        setMessage(
          response.data?.message || "Password updated successfully."
        );
      }

      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Something went wrong. Please try again."
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (activeTab === "password") {
      setSettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setMessage("Password fields cleared.");
      setMessageType("success");
      return;
    }

    loadSettings();
  };

  const inputClass =
    "w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-semibold text-slate-700";

  const renderInput = (
    label,
    name,
    placeholder,
    Icon,
    type = "text"
  ) => (
    <div className="w-full min-w-0">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>

      <div className="relative">
        <Icon
          size={17}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          id={name}
          type={type}
          name={name}
          value={settings[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${inputClass} pl-11`}
        />
      </div>
    </div>
  );

  const renderSelect = (label, name, options) => (
    <div className="w-full min-w-0">
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>

      <select
        id={name}
        name={name}
        value={settings[name]}
        onChange={handleChange}
        className={inputClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderSection = () => {
    switch (activeTab) {
      case "school":
        return (
          <div className="space-y-7">
            {/* School Details */}
            <div>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-800">
                  School Details
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Update your school's basic contact information.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {renderInput(
                  "School Name",
                  "schoolName",
                  "Enter school name",
                  School
                )}

                {renderInput(
                  "School Email",
                  "schoolEmail",
                  "Enter school email",
                  Mail
                )}

                {renderInput(
                  "Phone Number",
                  "schoolPhone",
                  "Enter phone number",
                  Phone
                )}

                {renderInput(
                  "School Address",
                  "schoolAddress",
                  "Enter school address",
                  MapPin
                )}
              </div>
            </div>

            {/* School Logo */}
            <div className="border-t border-slate-100 pt-6">
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-800">
                  School Logo
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Add or update your school's logo image.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-[150px_minmax(0,1fr)] md:items-start">
                {/* Logo Preview */}
                <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {settings.schoolLogo && !logoError ? (
                      <img
                        src={settings.schoolLogo}
                        alt="School Logo"
                        className="h-full w-full object-contain p-2"
                        onError={() => setLogoError(true)}
                      />
                    ) : (
                      <Image size={34} className="text-blue-500" />
                    )}
                  </div>

                  <span className="text-xs font-semibold text-slate-600">
                    Logo Preview
                  </span>
                </div>

                {/* Logo URL Input */}
                <div className="min-w-0">
                  <label
                    htmlFor="schoolLogo"
                    className={labelClass}
                  >
                    School Logo URL
                  </label>

                  <input
                    id="schoolLogo"
                    type="url"
                    name="schoolLogo"
                    value={settings.schoolLogo}
                    onChange={handleChange}
                    placeholder="https://example.com/school-logo.png"
                    className={inputClass}
                  />

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Paste a valid image URL to display your school logo.
                    Direct file upload is not configured yet.
                  </p>

                  {logoError && settings.schoolLogo && (
                    <p className="mt-2 text-xs text-red-500">
                      Unable to load this image. Please check the URL.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "academic":
        return (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {renderInput(
              "Academic Year",
              "academicYear",
              "2026",
              CalendarDays
            )}

            {renderInput(
              "Current Session",
              "currentSession",
              "2026-2027",
              GraduationCap
            )}

            {renderSelect("Current Semester", "semester", [
              { value: "First Semester", label: "First Semester" },
              { value: "Second Semester", label: "Second Semester" },
              { value: "Third Semester", label: "Third Semester" },
            ])}
          </div>
        );

      case "general":
        return (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {renderSelect("Language", "language", [
              { value: "English", label: "English" },
              { value: "Bangla", label: "Bangla" },
            ])}

            {renderSelect("Time Zone", "timezone", [
              {
                value: "Asia/Dhaka",
                label: "Bangladesh (Asia/Dhaka)",
              },
              { value: "UTC", label: "UTC" },
            ])}

            {renderSelect("Date Format", "dateFormat", [
              { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
              { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
              { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
            ])}
          </div>
        );

      case "profile":
        return (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {renderInput(
              "Admin Name",
              "adminName",
              "Enter admin name",
              User
            )}

            {renderInput(
              "Admin Email",
              "adminEmail",
              "Enter admin email",
              Mail
            )}
          </div>
        );

      case "password":
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {renderInput(
                "Current Password",
                "currentPassword",
                "Enter current password",
                Lock,
                "password"
              )}

              {renderInput(
                "New Password",
                "newPassword",
                "Enter new password",
                Lock,
                "password"
              )}

              {renderInput(
                "Confirm New Password",
                "confirmPassword",
                "Confirm new password",
                Lock,
                "password"
              )}
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
              <ShieldCheck size={22} className="shrink-0" />
              <p className="leading-6">
                Use a strong password with at least 8 characters.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const activeSection = sections.find(
    (item) => item.id === activeTab
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50 p-4">
        <div className="text-center">
          <RefreshCw
            size={34}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-slate-50 p-3 sm:p-5 lg:p-7">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        {/* Header */}
        <div className="mb-6 flex items-start gap-3 sm:items-center">
          <div className="shrink-0 rounded-xl bg-blue-100 p-3 text-blue-600">
            <Settings size={23} />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Settings Management
            </h1>

            <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
              Manage your school system preferences and configurations.
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="shrink-0 rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <School size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                School Configuration
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-800">
                School Details
              </h3>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="shrink-0 rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                Academic Management
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-800">
                Academic Session
              </h3>
            </div>
          </div>

          <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="shrink-0 rounded-lg bg-violet-50 p-2.5 text-violet-600">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                Account Security
              </p>
              <h3 className="mt-1 text-sm font-semibold text-slate-800">
                Admin Settings
              </h3>
            </div>
          </div>
        </div>

        {/* Settings Layout */}
        <div className="grid min-w-0 grid-cols-1 items-start gap-5 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="min-w-0 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <h2 className="hidden px-3 py-3 text-xs font-bold tracking-wide text-slate-400 lg:block">
              SETTINGS MENU
            </h2>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {sections.map((section) => {
                const Icon = section.icon;
                const isActive = activeTab === section.id;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(section.id);
                      setMessage("");
                    }}
                    className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-3 text-xs font-semibold transition sm:text-sm lg:w-full ${
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="whitespace-nowrap lg:whitespace-normal lg:text-left">
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Form */}
          <main className="min-w-0 rounded-xl border border-slate-100 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-5 sm:px-6">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                {activeSection?.label}
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                Update your {activeSection?.label.toLowerCase()} information.
              </p>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-6 lg:p-7">
              {renderSection()}

              {/* Message */}
              {message && (
                <div
                  role={messageType === "success" ? "status" : "alert"}
                  className={`mt-6 flex items-start gap-2 rounded-xl p-3 text-xs sm:text-sm ${
                    messageType === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {messageType === "success" ? (
                    <CheckCircle size={17} className="mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                  )}
                  <p className="break-words">{message}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving || loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={saving || loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}

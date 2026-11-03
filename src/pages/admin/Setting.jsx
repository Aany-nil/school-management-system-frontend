
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

  // Load settings from MongoDB
  const loadSettings = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get("/settings/setting");

      const school = response.data.data.school || {};
      const admin = response.data.data.admin || {};

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

    setMessage("");
  };

  // Save settings according to active section
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
      }

      else if (activeTab === "academic") {
        const payload = {
          academicYear: settings.academicYear,
          currentSession: settings.currentSession,
          semester: settings.semester,
        };

        await api.put("/settings/update-setting", payload);

        setMessage("Academic settings saved successfully.");
      }

      else if (activeTab === "general") {
        const payload = {
          language: settings.language,
          timezone: settings.timezone,
          dateFormat: settings.dateFormat,
        };

        await api.put("/settings/update-setting", payload);

        setMessage("General settings saved successfully.");
      }

      else if (activeTab === "profile") {
        const payload = {
          name: settings.adminName,
          email: settings.adminEmail,
        };

        const response = await api.put("/settings/profile", payload);

        const admin = response.data.data;

        setSettings((prev) => ({
          ...prev,
          adminName: admin.name,
          adminEmail: admin.email,
        }));

        setMessage("Admin profile updated successfully.");
      }

      else if (activeTab === "password") {
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
          response.data.message || "Password updated successfully."
        );
      }

      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );

      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // Reset current form using saved database values
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
    "w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-2 block text-sm font-medium text-gray-700";

  const renderInput = (label, name, placeholder, Icon) => (
    <div>
      <label className={labelClass}>{label}</label>

      <div className="relative">
        <Icon
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type="text"
          name={name}
          value={settings[name]}
          onChange={handleChange}
          placeholder={placeholder}
          className={`${inputClass} pl-10`}
        />
      </div>
    </div>
  );

  const renderSelect = (label, name, options) => (
    <div>
      <label className={labelClass}>{label}</label>

      <select
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

            <div className="md:col-span-2">
              <label className={labelClass}>School Logo URL</label>

              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-gray-300 p-5">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-blue-50 text-blue-600">
                  {settings.schoolLogo ? (
                    <img
                      src={settings.schoolLogo}
                      alt="School Logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Image size={30} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    School Logo
                  </p>

                  <input
                    type="text"
                    name="schoolLogo"
                    value={settings.schoolLogo}
                    onChange={handleChange}
                    placeholder="Enter school logo image URL"
                    className={`${inputClass} mt-2`}
                  />

                  <p className="mt-1 text-xs text-gray-400">
                    Provide an image URL. Direct file upload is not configured yet.
                  </p>
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Current Password</label>

              <input
                type="password"
                name="currentPassword"
                value={settings.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>New Password</label>

              <input
                type="password"
                name="newPassword"
                value={settings.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>
                Confirm New Password
              </label>

              <input
                type="password"
                name="confirmPassword"
                value={settings.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
              <ShieldCheck size={22} />
              <p>
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-3 text-sm text-gray-500">
            Loading settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Settings size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Settings Management
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Manage your school system preferences and configurations.
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <School className="mb-3 text-blue-600" size={24} />
            <p className="text-sm text-gray-500">
              School Configuration
            </p>
            <h3 className="mt-1 font-semibold text-gray-800">
              School Details
            </h3>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <GraduationCap className="mb-3 text-green-600" size={24} />
            <p className="text-sm text-gray-500">
              Academic Management
            </p>
            <h3 className="mt-1 font-semibold text-gray-800">
              Academic Session
            </h3>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <ShieldCheck className="mb-3 text-purple-600" size={24} />
            <p className="text-sm text-gray-500">
              Account Security
            </p>
            <h3 className="mt-1 font-semibold text-gray-800">
              Admin Settings
            </h3>
          </div>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

          {/* Sidebar */}
          <aside className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
            <h2 className="px-3 py-3 text-sm font-semibold text-gray-500">
              SETTINGS MENU
            </h2>

            <div className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(section.id);
                      setMessage("");
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition ${
                      activeTab === section.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={19} />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Form */}
          <main className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-7 lg:col-span-3">
            <div className="mb-6 border-b border-gray-100 pb-5">
              <h2 className="text-lg font-bold text-gray-800">
                {activeSection?.label}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Update your {activeSection?.label.toLowerCase()} information.
              </p>
            </div>

            <form onSubmit={handleSave}>
              {renderSection()}

              {message && (
                <div
                  className={`mt-5 rounded-lg p-3 text-sm ${
                    messageType === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  <RotateCcw size={17} />
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
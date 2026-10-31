
import { useState } from "react";
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

const initialSettings = {
  schoolName: "My School",
  schoolEmail: "",
  schoolPhone: "",
  schoolAddress: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage("");
  };

  const handleSave = (e) => {
    e.preventDefault();

    if (activeTab === "password") {
      if (
        !settings.currentPassword ||
        !settings.newPassword ||
        !settings.confirmPassword
      ) {
        setMessage("Please fill in all password fields.");
        return;
      }

      if (settings.newPassword.length < 8) {
        setMessage("New password must be at least 8 characters.");
        return;
      }

      if (settings.newPassword !== settings.confirmPassword) {
        setMessage("New password and confirm password do not match.");
        return;
      }

      setMessage(
        "Password validation successful. Backend API is not connected yet."
      );
      return;
    }

    setMessage("Settings updated in this session.");
  };

  const handleReset = () => {
    setSettings(initialSettings);
    setMessage("Form has been reset.");
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
              <label className={labelClass}>School Logo</label>

              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-gray-300 p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Image size={30} />
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Upload School Logo
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Logo upload UI only. Backend upload is not connected.
                  </p>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  className="text-sm"
                />
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
                <div className="mt-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  {message}
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  <RotateCcw size={17} />
                  Reset
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
                >
                  <Save size={17} />
                  Save Changes
                </button>
              </div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}


import { useEffect, useRef, useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Camera,
  Edit,
  Download,
  Save,
  X,
  Loader2,
  GraduationCap,
  FileText,
  Phone,
  CalendarDays,
  HeartPulse,
  Users,
  IdCard,
  Home,
  ShieldCheck,
  Droplet,
} from "lucide-react";

import api from "../services/api";

const bloodGroups = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass =
  "mb-2 block text-sm font-medium text-gray-700";

const getDateValue = (date) => {
  if (!date) return "";

  return String(date).slice(0, 10);
};

export default function ProfilePage() {
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    address: "",
    bio: "",
    profilePicture: "",
    role: "",

    fatherName: "",
    motherName: "",
    phone: "",
    dateOfBirth: "",
    bloodGroup: "",
    religion: "",
    presentAddress: "",
    permanentAddress: "",
    nidNumber: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const getUser = (response) =>
    response?.data?.user ||
    response?.data?.profile ||
    response?.data?.data ||
    response?.data;

  // Fetch Profile
  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await api.get("/profile");
      const user = getUser(response);

      setProfile({
        name: user.name || "",
        email: user.email || "",
        address: user.address || "",
        bio: user.bio || "",
        profilePicture: user.profilePicture || "",
        role: user.role || "",

        fatherName: user.fatherName || "",
        motherName: user.motherName || "",
        phone: user.phone || "",
        dateOfBirth: getDateValue(user.dateOfBirth),
        bloodGroup: user.bloodGroup || "",
        religion: user.religion || "",
        presentAddress: user.presentAddress || user.address || "",
        permanentAddress: user.permanentAddress || "",
        nidNumber: user.nidNumber || "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Profile load failed."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
      ...prev,
      [name]: value,

      // Keep old address field compatible with present address
      ...(name === "presentAddress" ? { address: value } : {}),
    }));
  };

  // Save Profile
  const handleSave = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const response = await api.put("/profile", {
        name: profile.name,
        email: profile.email,
        address: profile.address,
        bio: profile.bio,

        fatherName: profile.fatherName,
        motherName: profile.motherName,
        phone: profile.phone,
        dateOfBirth: profile.dateOfBirth,
        bloodGroup: profile.bloodGroup,
        religion: profile.religion,
        presentAddress: profile.presentAddress,
        permanentAddress: profile.permanentAddress,
        nidNumber: profile.nidNumber,
      });

      setMessage(
        response.data.message || "Profile updated successfully!"
      );
      setMessageType("success");

      await fetchProfile();
      setEditMode(false);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Profile update failed."
      );
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  // Upload Profile Picture
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      setMessageType("error");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be less than 5MB.");
      setMessageType("error");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("profilePicture", file);

    try {
      setUploading(true);
      setMessage("");

      const response = await api.post(
        "/profile/upload-picture",
        formData
      );

      await fetchProfile();

      setMessage(
        response.data.message || "Profile picture updated!"
      );
      setMessageType("success");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Profile picture upload failed."
      );
      setMessageType("error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Download Profile
  const handleDownload = () => {
    window.print();
  };

  // Cancel Editing
  const handleCancel = () => {
    setEditMode(false);
    setMessage("");
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2
          className="animate-spin text-blue-600"
          size={35}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-3 sm:p-5 md:p-6 lg:p-8 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-5xl min-w-0">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
              My Profile
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage your personal information.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 min-[480px]:flex-row sm:w-auto">
            {!editMode ? (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition duration-200 hover:-translate-y-0.5 hover:bg-gray-100 min-[480px]:w-auto"
                >
                  <Download size={17} />
                  Download PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setEditMode(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 min-[480px]:w-auto"
                >
                  <Edit size={17} />
                  Edit Profile
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving || uploading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
              >
                <X size={17} />
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-5 break-words rounded-xl border p-3 text-sm print:hidden ${
              messageType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-blue-100 bg-blue-50 text-blue-700"
            }`}
          >
            {message}
          </div>
        )}

        {/* Profile Document */}
        <div className="w-full min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm sm:rounded-2xl print:rounded-none print:border-0 print:shadow-none">

          {/* Profile Header */}
          <div className="bg-slate-600 px-4 py-8 text-center text-white sm:px-6 sm:py-10 md:px-10">
            <div className="relative mx-auto mb-4 h-28 w-28 sm:h-32 sm:w-32">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="h-28 w-28 rounded-full border-4 border-white object-cover sm:h-32 sm:w-32"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-3xl font-bold text-blue-700 sm:h-32 sm:w-32 sm:text-4xl">
                  {profile.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}

              {editMode && (
                <>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 rounded-full bg-white p-2.5 text-blue-700 shadow-md transition hover:bg-blue-50 disabled:opacity-60 print:hidden"
                    aria-label="Change profile picture"
                  >
                    {uploading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Camera size={18} />
                    )}
                  </button>

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            <h2 className="break-words text-xl font-bold sm:text-2xl">
              {profile.name || "Your Name"}
            </h2>

            <p className="mt-2 break-all text-sm text-blue-100 sm:text-base">
              {profile.email}
            </p>

            <span className="mt-3 inline-block rounded-full bg-white/20 px-5 py-1.5 text-xs font-semibold capitalize sm:text-sm">
              {profile.role || "User"}
            </span>
          </div>

          {/* Profile Information */}
          <div className="space-y-8 p-4 sm:p-6 md:p-8 lg:p-10">

            {/* Personal Information Heading */}
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <GraduationCap
                className="shrink-0 text-blue-600"
                size={25}
              />

              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-800 sm:text-lg">
                  Personal Information
                </h3>

                <p className="text-xs text-gray-500 sm:text-sm">
                  Your basic account and personal details
                </p>
              </div>
            </div>

            {editMode ? (
              <form onSubmit={handleSave} className="space-y-8">

                {/* Basic Information */}
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <User size={19} className="text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800 sm:text-base">
                      Basic Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">

                    <div>
                      <label className={labelClass}>
                        Full Name
                      </label>
                      <input
                        name="name"
                        value={profile.name}
                        onChange={handleChange}
                        required
                        maxLength={30}
                        className={inputClass}
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Email Address
                      </label>
                      <input
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Father's Name
                      </label>
                      <input
                        name="fatherName"
                        value={profile.fatherName}
                        onChange={handleChange}
                        maxLength={50}
                        className={inputClass}
                        placeholder="Enter father's name"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Mother's Name
                      </label>
                      <input
                        name="motherName"
                        value={profile.motherName}
                        onChange={handleChange}
                        maxLength={50}
                        className={inputClass}
                        placeholder="Enter mother's name"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Phone Number
                      </label>
                      <input
                        name="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={handleChange}
                        maxLength={20}
                        className={inputClass}
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Date of Birth
                      </label>
                      <input
                        name="dateOfBirth"
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={handleChange}
                        max={new Date().toISOString().slice(0, 10)}
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Blood Group
                      </label>
                      <select
                        name="bloodGroup"
                        value={profile.bloodGroup}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="">Select Blood Group</option>
                        {bloodGroups.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className={labelClass}>
                        Religion
                      </label>
                      <input
                        name="religion"
                        value={profile.religion}
                        onChange={handleChange}
                        maxLength={30}
                        className={inputClass}
                        placeholder="Enter religion"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelClass}>
                        NID Card Number
                      </label>
                      <input
                        name="nidNumber"
                        type="text"
                        value={profile.nidNumber}
                        onChange={handleChange}
                        maxLength={30}
                        autoComplete="off"
                        className={inputClass}
                        placeholder="Enter NID number (optional)"
                      />
                      <p className="mt-1.5 text-xs text-gray-400">
                        This information is private and optional.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Address Information */}
                <section className="border-t border-gray-100 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin size={19} className="text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800 sm:text-base">
                      Address Information
                    </h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>
                        Present Address
                      </label>
                      <textarea
                        name="presentAddress"
                        value={profile.presentAddress}
                        onChange={handleChange}
                        rows={3}
                        maxLength={300}
                        className={`${inputClass} resize-y`}
                        placeholder="Enter your present address"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Permanent Address
                      </label>
                      <textarea
                        name="permanentAddress"
                        value={profile.permanentAddress}
                        onChange={handleChange}
                        rows={3}
                        maxLength={300}
                        className={`${inputClass} resize-y`}
                        placeholder="Enter your permanent address"
                      />
                    </div>
                  </div>
                </section>

                {/* About Information */}
                <section className="border-t border-gray-100 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText size={19} className="text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800 sm:text-base">
                      About Me
                    </h4>
                  </div>

                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows={4}
                    maxLength={500}
                    className={`${inputClass} resize-y`}
                    placeholder="Write something about yourself..."
                  />
                </section>

                {/* Save Button */}
                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving || uploading}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    <X size={17} />
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving || uploading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}

                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              /* View Profile */
              <div className="space-y-8">

                {/* Basic Information */}
                <section>
                  <div className="mb-4 flex items-center gap-2">
                    <User size={19} className="text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800 sm:text-base">
                      Basic Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">

                    <div className="flex min-w-0 items-start gap-3">
                      <User className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="mt-1 break-words font-semibold text-gray-800">
                          {profile.name || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <Mail className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Email Address</p>
                        <p className="mt-1 break-all font-semibold text-gray-800">
                          {profile.email || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <Users className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Father's Name</p>
                        <p className="mt-1 break-words font-semibold text-gray-800">
                          {profile.fatherName || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <Users className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Mother's Name</p>
                        <p className="mt-1 break-words font-semibold text-gray-800">
                          {profile.motherName || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <Phone className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Phone Number</p>
                        <p className="mt-1 break-words font-semibold text-gray-800">
                          {profile.phone || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <CalendarDays className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="mt-1 font-semibold text-gray-800">
                          {profile.dateOfBirth
                            ? new Date(
                                `${profile.dateOfBirth}T00:00:00`
                              ).toLocaleDateString("en-GB")
                            : "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <Droplet className="mt-1 shrink-0 text-red-500" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Blood Group</p>
                        <p className="mt-1 font-semibold text-gray-800">
                          {profile.bloodGroup || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <HeartPulse className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Religion</p>
                        <p className="mt-1 break-words font-semibold text-gray-800">
                          {profile.religion || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3 sm:col-span-2">
                      <IdCard className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">NID Card Number</p>
                        <p className="mt-1 break-all font-semibold text-gray-800">
                          {profile.nidNumber || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Address Information */}
                <section className="border-t border-gray-100 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <MapPin size={19} className="text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800 sm:text-base">
                      Address Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                    <div className="flex min-w-0 items-start gap-3">
                      <Home className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Present Address</p>
                        <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-gray-800">
                          {profile.presentAddress || "Not provided"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-start gap-3">
                      <MapPin className="mt-1 shrink-0 text-blue-600" size={19} />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">Permanent Address</p>
                        <p className="mt-1 whitespace-pre-wrap break-words font-semibold text-gray-800">
                          {profile.permanentAddress || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* About Me */}
                <section className="border-t border-gray-100 pt-6">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText size={19} className="text-blue-600" />
                    <h4 className="text-sm font-semibold text-gray-800 sm:text-base">
                      About Me
                    </h4>
                  </div>

                  <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700">
                    {profile.bio || "No description added yet."}
                  </p>
                </section>

                {/* Account Information */}
                <section className="border-t border-gray-100 pt-6">
                  <div className="flex min-w-0 items-start gap-3">
                    <ShieldCheck className="mt-1 shrink-0 text-blue-600" size={20} />

                    <div className="min-w-0">
                      <p className="text-sm text-gray-500">Account Role</p>
                      <p className="mt-1 font-semibold capitalize text-gray-800">
                        {profile.role || "Not provided"}
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            <div className="border-t border-gray-100 pt-5 text-center text-xs text-gray-400">
              School Management System · Profile Information
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-gray-400 print:hidden">
          Your profile information is private and visible according to your account permissions.
        </p>
      </div>
    </div>
  );
}

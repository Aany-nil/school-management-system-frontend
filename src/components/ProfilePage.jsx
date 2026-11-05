
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
  Home,
  ShieldCheck,
  Droplet,
  Hash,
  School,
  Layers,
  Wallet,
  BriefcaseBusiness,
  BookOpen,
  CalendarCheck,
} from "lucide-react";

import api from "../services/api";

const bloodGroups = [
  "A+", "A-", "B+", "B-",
  "AB+", "AB-", "O+", "O-",
];

const inputClass =
  "w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

const getDateValue = (date) => {
  if (!date) return "";

  return String(date).slice(0, 10);
};

const formatDate = (date) => {
  if (!date) return "Not provided";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not provided";
  }

  return parsedDate.toLocaleDateString("en-GB");
};

const formatMoney = (amount) => {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
};

const InfoItem = ({ icon: Icon, label, value, iconColor = "text-blue-600" }) => (
  <div className="flex min-w-0 items-start gap-3">
    <Icon className={`mt-1 shrink-0 ${iconColor}`} size={19} />
    <div className="min-w-0">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 break-words font-semibold text-gray-800">
        {value || "Not provided"}
      </p>
    </div>
  </div>
);

const SectionHeading = ({ icon: Icon, title, description }) => (
  <div className="mb-5 flex items-center gap-3 border-b border-gray-100 pb-4">
    <Icon className="shrink-0 text-blue-600" size={23} />
    <div className="min-w-0">
      <h3 className="text-base font-bold text-gray-800 sm:text-lg">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-gray-500 sm:text-sm">{description}</p>
      )}
    </div>
  </div>
);

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
    rollNumber: "",
    classId: null,
    monthlySalary: 0,
    createdAt: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const role = profile.role?.toLowerCase() || "";

  const isStudent = role === "student";
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";

  const studentClass =
    profile.classId && typeof profile.classId === "object"
      ? profile.classId
      : {};

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

      if (!user) {
        throw new Error("Profile information not found.");
      }

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

        rollNumber: user.rollNumber || "",
        classId: user.classId || null,
        monthlySalary: user.monthlySalary ?? 0,
        createdAt: user.createdAt || "",
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          error.message ||
          "Profile load failed."
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
        address: profile.presentAddress,
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

  // Download / Print Profile
  const handleDownload = () => {
    window.print();
  };

  // Cancel Editing
  const handleCancel = async () => {
    setEditMode(false);
    setMessage("");
    await fetchProfile();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={35} />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full min-w-0 bg-gray-50 p-3 sm:p-5 md:p-6 lg:p-8 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-5xl min-w-0">

        {/* Page Header */}
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
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100 min-[480px]:w-auto"
                >
                  <Download size={17} />
                  Print Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMessage("");
                    setEditMode(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 min-[480px]:w-auto"
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

          <div className="space-y-8 p-4 sm:p-6 md:p-8 lg:p-10">

            {/* Student Academic Information */}
            {isStudent && (
              <section>
                <SectionHeading
                  icon={GraduationCap}
                  title="Academic Information"
                  description="Your school and academic details"
                />

                <div className="grid grid-cols-1 gap-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2 sm:gap-6 sm:p-5">
                  <InfoItem
                    icon={Hash}
                    label="Roll Number"
                    value={profile.rollNumber || "Not Assigned"}
                  />

                  <InfoItem
                    icon={School}
                    label="Class"
                    value={studentClass.className || "Not Assigned"}
                  />

                  <InfoItem
                    icon={Layers}
                    label="Section"
                    value={studentClass.section || "Not Assigned"}
                  />

                  <InfoItem
                    icon={CalendarCheck}
                    label="Academic Year"
                    value={studentClass.academicYear || "Not Assigned"}
                  />
                </div>

                <p className="mt-3 text-xs text-gray-500">
                  Roll number and class information are assigned by the school administrator.
                </p>
              </section>
            )}

            {/* Teacher Professional Information */}
            {isTeacher && (
              <section>
                <SectionHeading
                  icon={BriefcaseBusiness}
                  title="Professional Information"
                  description="Your school employment information"
                />

                <div className="grid grid-cols-1 gap-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2 sm:gap-6 sm:p-5">
                  <InfoItem
                    icon={Wallet}
                    label="Monthly Salary"
                    value={formatMoney(profile.monthlySalary)}
                  />

                  <InfoItem
                    icon={CalendarDays}
                    label="Joining / Account Date"
                    value={formatDate(profile.createdAt)}
                  />
                </div>
              </section>
            )}

            {/* Admin Information */}
            {isAdmin && (
              <section>
                <SectionHeading
                  icon={ShieldCheck}
                  title="Administrator Information"
                  description="Your administrator account details"
                />

                <div className="grid grid-cols-1 gap-5 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2 sm:gap-6 sm:p-5">
                  <InfoItem
                    icon={ShieldCheck}
                    label="Account Role"
                    value="Administrator"
                  />

                  <InfoItem
                    icon={CalendarDays}
                    label="Account Created"
                    value={formatDate(profile.createdAt)}
                  />
                </div>
              </section>
            )}

            {/* Personal Information */}
            <section>
              <SectionHeading
                icon={User}
                title="Personal Information"
                description="Your basic personal details"
              />

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
                        <label className={labelClass}>Full Name</label>
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
                        <label className={labelClass}>Email Address</label>
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
                        <label className={labelClass}>Father's Name</label>
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
                        <label className={labelClass}>Mother's Name</label>
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
                        <label className={labelClass}>Phone Number</label>
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
                        <label className={labelClass}>Date of Birth</label>
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
                        <label className={labelClass}>Blood Group</label>
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
                        <label className={labelClass}>Religion</label>
                        <input
                          name="religion"
                          value={profile.religion}
                          onChange={handleChange}
                          maxLength={30}
                          className={inputClass}
                          placeholder="Enter religion"
                        />
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
                        <label className={labelClass}>Present Address</label>
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
                        <label className={labelClass}>Permanent Address</label>
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

                  {/* About Me */}
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

                  {/* Save Buttons */}
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
                      className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                      <InfoItem
                        icon={User}
                        label="Full Name"
                        value={profile.name}
                      />

                      <InfoItem
                        icon={Mail}
                        label="Email Address"
                        value={profile.email}
                      />

                      <InfoItem
                        icon={Users}
                        label="Father's Name"
                        value={profile.fatherName}
                      />

                      <InfoItem
                        icon={Users}
                        label="Mother's Name"
                        value={profile.motherName}
                      />

                      <InfoItem
                        icon={Phone}
                        label="Phone Number"
                        value={profile.phone}
                      />

                      <InfoItem
                        icon={CalendarDays}
                        label="Date of Birth"
                        value={formatDate(profile.dateOfBirth)}
                      />

                      <InfoItem
                        icon={Droplet}
                        label="Blood Group"
                        value={profile.bloodGroup}
                        iconColor="text-red-500"
                      />

                      <InfoItem
                        icon={HeartPulse}
                        label="Religion"
                        value={profile.religion}
                      />
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
                      <InfoItem
                        icon={Home}
                        label="Present Address"
                        value={profile.presentAddress}
                      />

                      <InfoItem
                        icon={MapPin}
                        label="Permanent Address"
                        value={profile.permanentAddress}
                      />
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
                </div>
              )}
            </section>

            {/* Account Information */}
            {!editMode && (
              <section className="border-t border-gray-100 pt-6">
                <SectionHeading
                  icon={ShieldCheck}
                  title="Account Information"
                  description="Your account details"
                />

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <InfoItem
                    icon={ShieldCheck}
                    label="Account Role"
                    value={profile.role}
                  />

                  <InfoItem
                    icon={CalendarDays}
                    label="Account Created"
                    value={formatDate(profile.createdAt)}
                  />
                </div>
              </section>
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

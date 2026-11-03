
import { useEffect, useRef, useState } from "react";
import {
  User, Mail, MapPin, Camera, Edit, Download,
  Save, X, Loader2, GraduationCap, FileText,
} from "lucide-react";
import api from "../services/api";

export default function ProfilePage() {
  const fileRef = useRef(null);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    address: "",
    bio: "",
    profilePicture: "",
    role: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const getUser = (response) =>
    response?.data?.user ||
    response?.data?.profile ||
    response?.data?.data ||
    response?.data;

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
      });
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Profile load failed."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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
      });

      setMessage(
        response.data.message || "Profile updated successfully!"
      );

      await fetchProfile();
      setEditMode(false);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Profile update failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image must be less than 5MB.");
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
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        "Profile picture upload failed."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownload = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={35} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              My Profile
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your personal information.
            </p>
          </div>

          <div className="flex gap-2">
            {!editMode ? (
              <>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Download size={17} />
                  Download PDF
                </button>

                <button
                  onClick={() => {
                    setMessage("");
                    setEditMode(true);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Edit size={17} />
                  Edit Profile
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setEditMode(false);
                  fetchProfile();
                }}
                className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm text-gray-700"
              >
                <X size={17} />
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-700 print:hidden">
            {message}
          </div>
        )}

        {/* Profile Document */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">

          {/* Profile Header */}
          <div className="bg-slate-500 px-6 py-10 text-center text-white md:px-10">
            <div className="relative mx-auto mb-4 h-32 w-32">
              {profile.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="h-32 w-32 rounded-full border-4 border-white object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-blue-100 text-4xl font-bold text-blue-700">
                  {profile.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}

              {editMode && (
                <>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 rounded-full bg-white p-2 text-blue-700 shadow print:hidden"
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

            <h2 className="text-2xl font-bold">
              {profile.name || "Your Name"}
            </h2>

            <p className="mt-2 text-blue-100">
              {profile.email}
            </p>

            <span className="mt-3 inline-block rounded-full bg-white/20 px-5 py-1.5 text-sm font-semibold capitalize">
              {profile.role || "User"}
            </span>
          </div>

          {/* Information */}
          <div className="p-6 md:p-10">

            <div className="mb-6 flex items-center gap-3 border-b pb-4">
              <GraduationCap className="text-blue-600" size={24} />
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Personal Information
                </h3>
                <p className="text-sm text-gray-500">
                  Account details and personal information
                </p>
              </div>
            </div>

            {editMode ? (
              <form onSubmit={handleSave} className="space-y-5">

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    name="name"
                    value={profile.name}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    About Me
                  </label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleChange}
                    rows="4"
                    className="w-full rounded-lg border p-3 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">

                <div className="flex items-start gap-3">
                  <User className="mt-1 text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="mt-1 font-semibold text-gray-800">
                      {profile.name || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="mt-1 text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="mt-1 break-all font-semibold text-gray-800">
                      {profile.email || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="mt-1 font-semibold text-gray-800">
                      {profile.address || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-1 text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Account Role</p>
                    <p className="mt-1 font-semibold capitalize text-gray-800">
                      {profile.role || "Not provided"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 md:col-span-2">
                  <FileText className="mt-1 text-blue-600" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">About Me</p>
                    <p className="mt-1 whitespace-pre-wrap font-medium text-gray-800">
                      {profile.bio || "No description added yet."}
                    </p>
                  </div>
                </div>

              </div>
            )}

            <div className="mt-10 border-t pt-5 text-center text-xs text-gray-400">
              School Management System · Profile Information
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400 print:hidden">
          Your profile information is private and visible according to your account permissions.
        </p>
      </div>
    </div>
  );
}

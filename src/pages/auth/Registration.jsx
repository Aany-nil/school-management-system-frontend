
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  GraduationCap,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

import {
  registerUser,
  clearAuthError,
  clearAuthSuccess,
} from "../../services/authSlice";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, success } = useSelector(
    (state) => state.auth
  );

  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    if (success) {
      dispatch(clearAuthSuccess());

      navigate("/login", {
        replace: true,
        state: {
          message: "Registration successful! Please sign in.",
        },
      });
    }
  }, [success, navigate, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setLocalError("");
    dispatch(clearAuthError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLocalError("");
    dispatch(clearAuthError());

    if (!formData.name.trim()) {
      setLocalError("Please enter your full name.");
      return;
    }

    if (!formData.email.trim()) {
      setLocalError("Please enter your email address.");
      return;
    }

    if (formData.password.length < 5) {
      setLocalError(
        "Password must be at least 5 characters long."
      );
      return;
    }

    try {
      await dispatch(
      registerUser({
       name: formData.name.trim(),
       email: formData.email.trim().toLowerCase(),
      password: formData.password,
  })
).unwrap();
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  const displayedError = localError || error;

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-2">
      {/* Left branding section */}
      <section className="relative hidden overflow-hidden bg-blue-700 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/30" />

        <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-indigo-400/20" />

        <Link to="/" className="relative flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-3">
            <GraduationCap size={30} />
          </div>

          <div>
            <h1 className="text-xl font-bold">Education</h1>
            <p className="text-sm text-blue-100">
              School Management System
            </p>
          </div>
        </Link>

        <div className="relative max-w-lg">
          <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-blue-100">
            Welcome to education
          </span>

          <h2 className="mt-7 text-4xl font-bold leading-tight xl:text-5xl">
            Start your
            <br />
            <span className="text-blue-200">
              learning journey.
            </span>
          </h2>

          <p className="mt-6 leading-7 text-blue-100">
            Create your student account to access academic
            information, school notices and learning resources.
          </p>

          <div className="mt-10 space-y-5">
            {[
              "Access your academic information",
              "Stay updated with school notices",
              "View your routine and results",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <CheckCircle2
                  size={21}
                  className="text-blue-200"
                />
                <span className="text-sm font-medium">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-blue-200">
          © 2026 Education. All rights reserved.
        </p>
      </section>

      {/* Right registration form */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-2 lg:hidden"
          >
            <GraduationCap
              className="text-blue-600"
              size={32}
            />
            <span className="text-xl font-bold text-gray-900">
              Education
            </span>
          </Link>

          <div className="mb-7">
            <div className="mb-4 inline-flex rounded-xl bg-blue-100 p-3 text-blue-700">
              <UserRound size={27} />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Create an account
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Fill in your details to create your student account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Full name */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Full Name
              </label>

              <div className="relative">
                <UserRound
                  size={19}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={5}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 5 characters"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {displayedError && (
              <p role="alert" className="text-sm text-red-600">
                {typeof displayedError === "string"
                  ? displayedError
                  : displayedError?.message ||
                    "Registration failed. Please try again."}
              </p>
            )}

            <p className="text-xs leading-5 text-gray-500">
              By creating an account, you agree to follow your
              school's account and usage policies.
            </p>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </Link>
          </p>

          <div className="mt-7 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck size={16} />
            Your account information is protected.
          </div>
        </div>
      </section>
    </div>
  );
}

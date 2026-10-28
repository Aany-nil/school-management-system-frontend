
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { loginUser } from "../../services/authSlice";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await dispatch(loginUser(formData)).unwrap();

      // Handle the API response structure
      const data = result?.data ?? result;
      const user = data?.user;
      const token = data?.token;

      if (!user || !token) {
        throw new Error("Login response is missing user information or token.");
      }

      // Save login information for AppLayout
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect according to the user's role
      if (user.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "teacher") {
        navigate("/teacher/dashboard", { replace: true });
      } else if (user.role === "student") {
        navigate("/student/dashboard", { replace: true });
      } else {
        setErrorMessage("Your account has an invalid role. Please contact the administrator.");
      }
    } catch (error) {
      const message =
        typeof error === "string"
          ? error
          : error?.message || "Login failed. Please check your email and password.";

      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

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
            Manage your school,
            <br />
            <span className="text-blue-200">
              simplify your future.
            </span>
          </h2>

          <p className="mt-6 max-w-md leading-7 text-blue-100">
            A single platform to organize students, teachers,
            classes, attendance, results and school activities.
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-white/10 p-3">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="font-semibold">Organized Learning</p>
                <p className="text-sm text-blue-100">
                  Keep academic information in one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-white/10 p-3">
                <Users size={22} />
              </div>
              <div>
                <p className="font-semibold">Role-Based Access</p>
                <p className="text-sm text-blue-100">
                  Dedicated experiences for school users.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative text-sm text-blue-200">
          © 2026 Education. All rights reserved.
        </p>
      </section>

      {/* Right login form */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-10 flex items-center justify-center gap-2 lg:hidden"
          >
            <GraduationCap className="text-blue-600" size={32} />
            <span className="text-xl font-bold text-gray-900">
              Education
            </span>
          </Link>

          <div className="mb-8">
            <div className="mb-5 inline-flex rounded-xl bg-blue-100 p-3 text-blue-700">
              <ShieldCheck size={28} />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome !
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Sign in to access your school dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <Link
                  to="/forgot-password"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <LockKeyhole
                  size={19}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-12 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Login error */}
            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign In"}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-blue-600 hover:text-blue-700"
            >
              Create account
            </Link>
          </p>

          <p className="mt-10 text-center text-xs leading-5 text-gray-400">
            Secure access for authorized school users.
          </p>
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../lib/axios";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  

    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      return "Please enter your email.";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    if (!formData.password.trim()) {
      return "Please enter your password.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await API.post(
        "/auth/login",
        {
          email: formData.email
            .trim()
            .toLowerCase(),

          password: formData.password,
        }
      );

      /*
      |--------------------------------------------------------------------------
      | Persist auth session
      |--------------------------------------------------------------------------
      */

      localStorage.setItem(
        "token",
        response.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      /*
      |--------------------------------------------------------------------------
      | Redirect user back to protected route if needed
      |--------------------------------------------------------------------------
      */

      const redirectPath =
        localStorage.getItem(
          "postLoginRedirect"
        );

      if (redirectPath) {
        localStorage.removeItem(
          "postLoginRedirect"
        );

        navigate(redirectPath);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);

      /*
      |--------------------------------------------------------------------------
      | Better API error handling
      |--------------------------------------------------------------------------
      */

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to login right now.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/90 p-8 shadow-2xl shadow-black/40">

        {/* Header */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Login to continue working with your team and projects.
          </p>
        </div>

        {/* Login Form */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Email */}

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
            />
          </div>

          {/* Password */}

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Password
            </label>

            <div className="relative">
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 pr-14 text-sm text-white outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 transition hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Error State */}

          {error && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        {/* Footer */}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-white transition hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
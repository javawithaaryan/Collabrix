import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
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

    /*
    |--------------------------------------------------------------------------
    | Clear stale error while typing
    |--------------------------------------------------------------------------
    */

    if (error) {
      setError("");
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Please enter your name.";
    }

    if (!formData.email.trim()) {
      return "Please enter your email.";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return "Please enter a valid email address.";
    }

    if (!formData.password.trim()) {
      return "Please enter a password.";
    }

    if (formData.password.length < 6) {
      return "Password must be at least 6 characters.";
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
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      /*
      |--------------------------------------------------------------------------
      | Restore redirect path if user was forced to login
      |--------------------------------------------------------------------------
      */

      const redirectPath = localStorage.getItem(
        "postLoginRedirect"
      );

      if (redirectPath) {
        localStorage.removeItem("postLoginRedirect");

        navigate(redirectPath);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Registration error:", err);

      /*
      |--------------------------------------------------------------------------
      | Better backend/API error handling
      |--------------------------------------------------------------------------
      */

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Unable to create account right now.";

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
            Create Account
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Join your workspace and start collaborating with your team.
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* Name */}

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
            />
          </div>

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
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
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

            <p className="mt-2 text-xs text-zinc-600">
              Use at least 6 characters.
            </p>
          </div>

          {/* Error State */}

          {error && (
            <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-4 py-3">
              <p className="text-sm text-red-400">
                {error}
              </p>
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>
        </form>

        {/* Footer */}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-white transition hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
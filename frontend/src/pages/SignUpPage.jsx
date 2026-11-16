
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagepattern";
import {
  MessageSquare,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    if (!formData.fullname.trim()) return false;
    if (!formData.email.trim()) return false;
    if (formData.password.length < 6) return false;

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    signup(formData);
  };

  return (
    <div className="min-h-[100dvh] grid lg:grid-cols-2 bg-base-100 text-base-content">

      {/* Signup Form */}
      <div className="flex flex-col justify-center items-center px-4 py-8 sm:px-8 sm:py-12 lg:p-12">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">

          {/* Logo */}
          <div className="text-center">
            <div className="flex flex-col items-center gap-2 group">

              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <MessageSquare className="size-6 text-primary" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mt-2">
                Create Account
              </h1>

              <p className="text-sm sm:text-base text-base-content/60">
                Get started with your free account
              </p>

            </div>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

            {/* Full Name */}
            <div className="form-control">
              <label className="mb-2 block">
                <span className="text-sm font-medium">
                  Full Name
                </span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                  <User className="size-5 text-base-content/50" />
                </div>

                <input
                  type="text"
                  autoComplete="name"
                  className="input input-bordered w-full h-12 pl-10 bg-base-100 text-base-content text-base"
                  placeholder="John Doe"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullname: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="mb-2 block">
                <span className="text-sm font-medium">
                  Email
                </span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                  <Mail className="size-5 text-base-content/50" />
                </div>

                <input
                  type="email"
                  autoComplete="email"
                  className="input input-bordered w-full h-12 pl-10 bg-base-100 text-base-content text-base"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="mb-2 block">
                <span className="text-sm font-medium">
                  Password
                </span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                  <Lock className="size-5 text-base-content/50" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className="input input-bordered w-full h-12 pl-10 pr-12 bg-base-100 text-base-content text-base"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  required
                />

                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-base-content/50 hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>

              <p className="text-xs text-base-content/50 mt-2">
                Password must contain at least 6 characters.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary w-full h-12 min-h-0"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

          </form>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-base-content/60">
              Already have an account?{" "}
              <Link
                to="/login"
                className="link link-primary font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>

      {/* Right Side Pattern */}
      <div className="hidden lg:flex">
        <AuthImagePattern
          title="Join our community"
          subtitle="Connect with friends, share moments, and stay in touch with the people who matter."
        />
      </div>

    </div>
  );
};

export default SignUpPage;

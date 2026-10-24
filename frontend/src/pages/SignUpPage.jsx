
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {MessageSquare,User,Mail,Lock,Eye,EyeOff,Loader} from "lucide-react";
import { Link } from "react-router-dom";

const SignUpPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
  });

  const { signup, isSigningUp } = useAuthStore();

  const validateForm = () => {
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const success = validateForm();
    if (success === true) signup(formData);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#1c232b] text-slate-100">
      {/* Left side - original position preserved */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">

          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div className="size-12 rounded-xl bg-violet-500/10 flex items-center justify-center transition-colors group-hover:bg-violet-500/20">
                <MessageSquare className="size-6 text-violet-400" />
              </div>

              <h1 className="text-2xl font-bold mt-2 text-slate-100">
                Create Account
              </h1>

              <p className="text-base text-slate-400">
                Get started with your free account
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Full Name Field */}
            <div className="form-control">
              <label className="mb-2 block">
                <span className="text-sm font-medium text-slate-300">
                  Full Name
                </span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="size-5 text-slate-500" />
                </div>

                <input
                  type="text"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-700 bg-transparent text-slate-100 placeholder:text-slate-400 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  placeholder="John Doe"
                  value={formData.fullname}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullname: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="form-control">
              <label className="mb-2 block">
                <span className="text-sm font-medium text-slate-300">
                  Email
                </span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="size-5 text-slate-500" />
                </div>

                <input
                  type="email"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-slate-700 bg-transparent text-slate-100 placeholder:text-slate-400 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-control">
              <label className="mb-2 block">
                <span className="text-sm font-medium text-slate-300">
                  Password
                </span>
              </label>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="size-5 text-slate-500" />
                </div>

                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full h-12 pl-10 pr-12 rounded-lg border border-slate-700 bg-transparent text-slate-100 placeholder:text-slate-400 outline-none transition-all focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-violet-400 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="h-12 w-full rounded-lg bg-[#7778ff] text-sm font-semibold text-[#171a35] transition-colors hover:bg-[#8585ff] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <>
                  <Loader className="size-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-violet-400 underline underline-offset-2 hover:text-violet-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SignUpPage;

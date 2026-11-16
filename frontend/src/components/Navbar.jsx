
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import {
  LogOut,
  MessageSquare,
  Settings,
  User,
  Users,
} from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();

  return (
    <header className="fixed top-0 z-40 w-full border-b border-base-300 bg-base-100/80 backdrop-blur-lg">
      <div className="container mx-auto h-16 px-3 sm:px-4">
        <div className="flex h-full items-center justify-between">

          {/* Logo and Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 transition-all hover:opacity-80"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <MessageSquare className="size-5 text-primary" />
            </div>

            <h1 className="whitespace-nowrap text-base font-bold sm:text-lg">
              Akerim Builds
            </h1>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-1 sm:gap-2">

            {authUser && (
              <Link
                to="/friends"
                className="btn btn-ghost btn-sm gap-2 px-2 sm:btn-md sm:px-3"
                aria-label="Friends"
                title="Friends"
              >
                <Users className="size-5" />
                <span className="hidden sm:inline">Friends</span>
              </Link>
            )}

            <Link
              to="/settings"
              className="btn btn-ghost btn-sm gap-2 px-2 sm:btn-md sm:px-3"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="size-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link
                  to="/profile"
                  className="btn btn-ghost btn-sm gap-2 px-2 sm:btn-md sm:px-3"
                  aria-label="Profile"
                  title="Profile"
                >
                  <User className="size-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>

                <button
                  onClick={logout}
                  className="btn btn-ghost btn-sm gap-2 px-2 sm:btn-md sm:px-3"
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

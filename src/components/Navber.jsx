
import { Bell, Menu, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Navbar({ user, onMenuClick }) {
  const navigate = useNavigate();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={21} />
        </button>

        <span className="font-semibold text-gray-800">
          School Dashboard
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/notices")}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="View notices"
        >
          <Bell size={20} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <UserRound size={18} />
          </span>

          <span className="hidden text-left sm:block">
            <span className="block text-sm font-semibold text-gray-800">
              {user?.name || "User"}
            </span>
            <span className="block text-xs capitalize text-gray-500">
              {user?.role || "student"}
            </span>
          </span>
        </button>
      </div>
    </header>
  );
}



import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Wallet,
  GraduationCap,
  UserRound,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Profile", path: "/profile", icon: UserRound },
  { label: "Students", path: "/students", icon: Users, roles: ["admin", "teacher"] },
  { label: "Teachers", path: "/teachers", icon: GraduationCap, roles: ["admin"] },
  { label: "Classes", path: "/classes", icon: BookOpen },
  { label: "Subjects", path: "/subjects", icon: BookOpen },
  { label: "Routine", path: "/routine", icon: CalendarDays },
  { label: "Attendance", path: "/attendance", icon: ClipboardCheck },
  { label: "Results", path: "/results", icon: FileText },
  { label: "Notices", path: "/notices", icon: FileText },
  { label: "Fees", path: "/fees", icon: Wallet, roles: ["admin", "student"] },
  { label: "Salary", path: "/salaries", icon: Wallet, roles: ["admin", "teacher"] },
];

export default function Sidebar({ role = "student" }) {
  const normalizedRole = role.toLowerCase();

  const visibleItems = menuItems.filter(
    (item) => !item.roles || item.roles.includes(normalizedRole)
  );

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <h2 className="text-xl font-bold text-blue-600">
          School<span className="text-gray-800">Sphere</span>
        </h2>
        <p className="mt-1 text-xs capitalize text-gray-500">
          {normalizedRole} panel
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <Icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gray-100 p-4 text-xs text-gray-500">
        School Management System
      </div>
    </aside>
  );
}

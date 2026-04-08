import { Outlet, Link, useLocation } from "react-router";
import { Home, Activity, Apple, CalendarDays, MessageCircle } from "lucide-react";

export function Root() {
  const location = useLocation();

  const navItems = [
    { path: "/dashboard", icon: Home, label: "Tổng quan" },
    { path: "/dashboard/workout", icon: Activity, label: "Vận động" },
    { path: "/dashboard/nutrition", icon: Apple, label: "Dinh dưỡng" },
    { path: "/dashboard/meal-plan", icon: CalendarDays, label: "Thực đơn" },
    { path: "/dashboard/coach", icon: MessageCircle, label: "Coach" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <h1 className="text-2xl font-bold">💪 FitLife Pro</h1>
        <p className="text-sm text-blue-100">Trợ lý fitness & dinh dưỡng cá nhân</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 shadow-lg">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "fill-blue-100" : ""}`} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
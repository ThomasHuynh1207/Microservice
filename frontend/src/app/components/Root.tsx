import { Link, Outlet, useLocation } from "react-router";
import { Activity, Apple, Bot, CalendarDays, CircleUserRound, Dumbbell, LayoutDashboard } from "lucide-react";
import { getCurrentUser } from "../../services/authService";
import { CoachAIFloatingButton } from "./CoachAIFloatingButton";

export function Root() {
  const location = useLocation();
  const user = getCurrentUser();
  const accountLabel = user?.fullName?.trim() || user?.email?.split("@")[0] || "Người dùng";

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
    { path: "/dashboard/workout", icon: Dumbbell, label: "Vận động" },
    { path: "/dashboard/nutrition", icon: Apple, label: "Dinh dưỡng" },
    { path: "/dashboard/meal-plan", icon: CalendarDays, label: "Thực đơn" },
    { path: "/dashboard/coach", icon: Bot, label: "Coach AI" },
  ];

  return (
    <div className="min-h-screen bg-[#F6F7FB] text-[#111827]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto w-full max-w-7xl px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link to="/dashboard" className="group flex items-center gap-3 text-slate-900">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[linear-gradient(135deg,#6366F1_0%,#8B5CF6_100%)] text-white shadow-[0_8px_20px_-12px_rgba(99,102,241,0.9)] transition-transform duration-200 group-hover:scale-105">
                  <Activity className="h-5 w-5" />
                </span>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">FitLife Pro</h1>
                  <p className="text-xs text-slate-500">Nền tảng sức khỏe cá nhân hóa</p>
                </div>
              </Link>

              <Link
                to="/dashboard/account"
                className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600">
                  <CircleUserRound className="h-4 w-4" />
                </span>
                <span className="flex flex-col items-start leading-tight">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Tài khoản</span>
                  <span className="text-sm font-semibold text-slate-900">{accountLabel}</span>
                </span>
              </Link>
            </div>

            <nav className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-transparent bg-white/70 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {isActive ? <span className="ml-2 h-1.5 w-1.5 rounded-full bg-indigo-600" /> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 py-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white px-6 py-4 text-sm text-slate-600">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p>FitLife Pro - Theo dõi tập luyện, dinh dưỡng và Coach AI trên một nền tảng.</p>
            <p>© 2026 FitLife Pro. Bảo lưu mọi quyền.</p>
          </div>
        </footer>
      </div>
      <CoachAIFloatingButton />
    </div>
  );
}
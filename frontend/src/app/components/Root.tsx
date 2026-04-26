import type { ComponentType } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { Activity, Apple, BarChart3, CircleUserRound, Dumbbell, LayoutDashboard, Search, Sparkles } from "lucide-react";
import { getCurrentUser } from "../../services/authService";
import { CoachAIFloatingButton } from "./CoachAIFloatingButton";

interface NavItem {
  path: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  iconOnly?: boolean;
}

export function Root() {
  const location = useLocation();
  const user = getCurrentUser();
  const accountLabel = user?.fullName?.trim() || user?.email?.split("@")[0] || "Người dùng";
  const isWorkoutRoute = location.pathname.startsWith("/dashboard/workout");

  const navItems: NavItem[] = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { path: "/dashboard/workout", icon: Dumbbell, label: "Tập luyện" },
    { path: "/dashboard/nutrition", icon: Apple, label: "Dinh dưỡng" },
    { path: "/dashboard/progress", icon: BarChart3, label: "Tiến độ" },
    { path: "/dashboard/coach", icon: Sparkles, label: "AI Coach" },
  ];

  const isNavItemActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="isolate min-h-screen bg-[#F6F7FB] text-[#111827]">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-[100] border-b border-slate-200/80 bg-white/95 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.35)] backdrop-blur">
          <div className="border-b border-slate-100 bg-slate-50/70">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500 sm:px-6 sm:text-[11px]">
              <span>FitLife Pro Official</span>
              <span className="text-right">Miễn phí gói cá nhân 14 ngày</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[auto_minmax(280px,1fr)_auto] lg:gap-6">
              <Link to="/dashboard" className="group inline-flex items-center gap-3 text-slate-900">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[linear-gradient(135deg,#2563EB_0%,#4F46E5_100%)] text-white shadow-[0_10px_24px_-16px_rgba(37,99,235,0.9)] transition-transform duration-200 group-hover:scale-105">
                  <Activity className="h-5 w-5" />
                </span>
                <span className="leading-tight">
                  <span className="block text-xl font-semibold tracking-tight sm:text-2xl">FitLife Pro</span>
                  <span className="block text-xs text-slate-500">Nền tảng sức khỏe cá nhân hóa</span>
                </span>
              </Link>

              <label className="group relative hidden w-full items-center lg:flex">
                <Search className="pointer-events-none absolute left-4 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-indigo-500" />
                <input
                  type="search"
                  placeholder="Tìm chương trình tập, dinh dưỡng, tiến độ..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>

              <div className="flex items-center justify-end gap-3">
                <Link
                  to="/dashboard/account"
                  className="inline-flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-slate-100 text-slate-600">
                    <CircleUserRound className="h-4 w-4" />
                  </span>
                  <span className="hidden flex-col items-start leading-tight sm:flex">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tài khoản</span>
                    <span className="max-w-[170px] truncate text-sm font-semibold text-slate-900">{accountLabel}</span>
                  </span>
                </Link>
              </div>
            </div>

            <nav className="mt-4 flex w-full flex-wrap items-center justify-start gap-2 border-t border-slate-100 pt-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-label={item.iconOnly ? "Huấn luyện viên AI" : item.label}
                    title={item.iconOnly ? "Huấn luyện viên AI" : item.label}
                    className={`pointer-events-auto inline-flex min-h-10 shrink-0 items-center rounded-lg border text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 ${
                      item.iconOnly ? "justify-center p-2.5" : "gap-2 px-4 py-2"
                    } ${
                      isActive
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm"
                        : "border-transparent bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <Icon className={item.iconOnly ? "h-5 w-5" : "h-4 w-4"} />
                    {!item.iconOnly ? <span>{item.label}</span> : null}
                    {isActive ? <span className="ml-2 h-1.5 w-1.5 rounded-full bg-indigo-600" /> : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className={`relative z-0 mx-auto w-full flex-1 ${isWorkoutRoute ? "max-w-none px-0 py-8" : "max-w-7xl py-8"}`}>
          <Outlet />
        </main>

      </div>
      <CoachAIFloatingButton />
    </div>
  );
}
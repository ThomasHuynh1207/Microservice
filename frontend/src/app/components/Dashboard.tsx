import { Activity, Flame, HeartPulse, Target, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { LatestSessionEmptyState, WeeklyChartEmptyState, WorkoutPlanEmptyState } from "./ui/EmptyState";
import { getCurrentUser } from "../../services/authService";
import { useDashboardData } from "../../hooks/useDashboardData";

export function Dashboard() {
  const user = getCurrentUser();
  const { data, isLoading, error, refreshData } = useDashboardData(user?.id);

  const hasWorkoutPlan = Boolean(data.todayWorkout?.todayWorkoutCount);
  const isWeeklyEmpty = data.weeklySummary.every((item) => item.calories === 0 && item.steps === 0);

  const handleCreateWorkoutPlan = () => {
    console.log("CTA: Tạo kế hoạch tập luyện");
  };

  const handleLogSession = () => {
    console.log("CTA: Ghi buổi tập hôm nay");
  };

  const handleLogWeeklyActivity = () => {
    console.log("CTA: Ghi hoạt động hôm nay");
  };

  const summaryCards = [
    {
      key: "goals",
      label: "Mục tiêu",
      value: `${data.goals.length || 0}`,
      helper: data.goals.length ? "Mục tiêu đang theo dõi" : "Chưa có mục tiêu nào",
      icon: <Target className="h-6 w-6 text-indigo-600" />,
      iconBg: "bg-[linear-gradient(145deg,#EEF2FF_0%,#E0E7FF_100%)]",
    },
    {
      key: "workout",
      label: "Buổi tập hôm nay",
      value: `${data.todayWorkout?.todayWorkoutCount ?? 0}`,
      helper: data.todayWorkout ? "Dữ liệu từ backend" : "Chưa có buổi tập",
      icon: <Activity className="h-6 w-6 text-emerald-600" />,
      iconBg: "bg-[linear-gradient(145deg,#ECFDF5_0%,#D1FAE5_100%)]",
    },
    {
      key: "nutrition",
      label: "Dinh dưỡng hôm nay",
      value: `${data.todayNutrition?.todayCalories ?? 0}`,
      helper: data.todayNutrition ? "Kcal đã tính" : "Chưa có dữ liệu",
      icon: <Flame className="h-6 w-6 text-orange-600" />,
      iconBg: "bg-[linear-gradient(145deg,#FFF7ED_0%,#FFEDD5_100%)]",
    },
    {
      key: "weekly",
      label: "Hoạt động tuần",
      value: `${data.weeklySummary.reduce((sum, item) => sum + item.steps, 0)}`,
      helper: "Tổng bước trong tuần",
      icon: <TrendingUp className="h-6 w-6 text-violet-600" />,
      iconBg: "bg-[linear-gradient(145deg,#F5F3FF_0%,#EDE9FE_100%)]",
    },
  ];

  return (
    <div className="mx-auto max-w-[1240px] space-y-8 px-6">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">FitLife Pro Dashboard</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Theo dõi sức khỏe và hiệu suất mỗi ngày</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Mọi chỉ số vận động, dinh dưỡng và tiến trình tập luyện đều được tổng hợp theo thời gian thực để bạn ra quyết định tốt hơn.
          </p>

          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Mục tiêu đang theo dõi</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{data.goals.length || 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Phút vận động hôm nay</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{data.todayWorkout?.activeMinutes ?? 0}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Protein mục tiêu</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{data.todayNutrition?.protein ?? 0}g</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)]">
          <p className="text-sm font-medium text-slate-500">Tác vụ nhanh</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Làm mới dữ liệu tổng quan</h3>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Dùng khi bạn vừa cập nhật buổi tập hoặc dinh dưỡng để đồng bộ các chỉ số mới nhất trên dashboard.
          </p>

          <button
            type="button"
            onClick={refreshData}
            disabled={isLoading || !user}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6366F1_0%,#8B5CF6_100%)] px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_-16px_rgba(99,102,241,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_-16px_rgba(139,92,246,0.95)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Đang làm mới..." : "Làm mới"}
          </button>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Không thể tải dữ liệu dashboard</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : null}
        </div>
      </section>

      {isLoading && !data.goals.length ? (
        <Card className="rounded-2xl border-slate-200 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)]">
          <CardContent>
            <p className="text-sm text-slate-500">Đang tải dữ liệu dashboard, vui lòng chờ...</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.key}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(15,23,42,0.4)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="mt-3 text-[2.2rem] font-semibold leading-none tracking-tight text-slate-900">{card.value}</p>
                <p className="mt-3 text-xs text-slate-500">{card.helper}</p>
              </div>
              <span className={`grid h-12 w-12 place-items-center rounded-full ${card.iconBg}`}>
                {card.icon}
              </span>
            </div>
          </article>
        ))}
      </section>

      {!hasWorkoutPlan && !error ? (
        <section className="grid gap-6 xl:grid-cols-2">
          <WorkoutPlanEmptyState onAction={handleCreateWorkoutPlan} />
          <LatestSessionEmptyState onAction={handleLogSession} />
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)]">
          <CardHeader>
            <CardTitle>Calories tuần này</CardTitle>
          </CardHeader>
          <CardContent className="relative overflow-hidden">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.weeklySummary}>
                <defs>
                  <linearGradient id="weeklyCaloriesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
                <Area type="monotone" dataKey="calories" stroke="#8B5CF6" strokeWidth={2.4} fill="url(#weeklyCaloriesFill)" />
              </AreaChart>
            </ResponsiveContainer>
            {isWeeklyEmpty ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/94 px-6 py-8 text-center">
                <WeeklyChartEmptyState onAction={handleLogWeeklyActivity} />
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)]">
          <CardHeader>
            <CardTitle>Số bước tuần này</CardTitle>
          </CardHeader>
          <CardContent className="relative overflow-hidden">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.weeklySummary}>
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="steps" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {isWeeklyEmpty ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/94 px-6 py-8 text-center">
                <WeeklyChartEmptyState onAction={handleLogWeeklyActivity} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-0.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[linear-gradient(145deg,#FFE4E6_0%,#FECDD3_100%)] text-rose-600">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-medium text-slate-500">Calo đốt hôm nay</p>
              <p className="text-xl font-semibold text-slate-900">{data.todayWorkout?.caloriesBurned ?? 0} kcal</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-0.5">
          <p className="text-sm font-medium text-slate-500">Carb hôm nay</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{data.todayNutrition?.carbs ?? 0}g</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.4)] transition-all duration-300 hover:-translate-y-0.5">
          <p className="text-sm font-medium text-slate-500">Chất béo hôm nay</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{data.todayNutrition?.fat ?? 0}g</p>
        </article>
      </section>
    </div>
  );
}

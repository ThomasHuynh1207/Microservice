import { Activity, Flame, HeartPulse, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import {
  WorkoutPlanEmptyState,
  LatestSessionEmptyState,
  NutritionGoalEmptyState,
  ProgressOverviewEmptyState,
  WeeklyChartEmptyState,
} from "./ui/EmptyState";
import { getCurrentUser } from "../../services/authService";
import { getUserSeedData } from "../../services/onboardingService";
import { useDashboardData } from "../../hooks/useDashboardData";

export function Dashboard() {
  const user = getCurrentUser();
  const { data, isLoading, error, refreshData } = useDashboardData(user?.id);

  const seedData = user ? getUserSeedData(user.id) : null;
  const hasWorkoutPlan = Boolean(data.todayWorkout?.todayWorkoutCount);
  const isWeeklyEmpty = data.weeklySummary.every((item) => item.calories === 0 && item.steps === 0);
  const isPostOnboarding = !hasWorkoutPlan && (!data.goals || data.goals.length === 0) && Boolean(seedData);

  const handleCreateWorkoutPlan = () => {
    console.log("CTA: Tạo kế hoạch tập luyện");
  };
  const handleLogSession = () => {
    console.log("CTA: Ghi buổi tập hôm nay");
  };
  const handleSetNutritionGoal = () => {
    console.log("CTA: Đặt mục tiêu dinh dưỡng");
  };
  const handleStartProgress = () => {
    console.log("CTA: Bắt đầu hành trình ngay");
  };
  const handleLogWeeklyActivity = () => {
    console.log("CTA: Ghi hoạt động hôm nay");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Xin chào{user ? `, ${user.fullName || user.email}` : "!"} 👋</h2>
            <p className="text-blue-100 mt-1">
              {isPostOnboarding
                ? "Bắt đầu từ đây với thói quen mới."
                : "Dữ liệu dashboard chỉ tải một lần khi trang được mở."}
            </p>
          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={isLoading || !user}
            className="inline-flex items-center justify-center rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Đang làm mới..." : "Làm mới"}
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">Lỗi tải dữ liệu dashboard</p>
            <p>{error}</p>
          </div>
        )}
      </div>

      {isLoading && !data.goals.length ? (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-500">Đang tải dữ liệu dashboard, vui lòng chờ...</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mục tiêu</p>
                <p className="text-3xl font-bold mt-1">{data.goals.length || 0}</p>
                <p className="text-xs text-slate-500 mt-1">{data.goals.length ? "Mục tiêu đang theo dõi" : "Chưa có mục tiêu nào"}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Buổi tập hôm nay</p>
                <p className="text-3xl font-bold mt-1">{data.todayWorkout?.todayWorkoutCount ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">{data.todayWorkout ? "Dữ liệu từ backend" : "Chưa có buổi tập"}</p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <Activity className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dinh dưỡng hôm nay</p>
                <p className="text-3xl font-bold mt-1">{data.todayNutrition ? data.todayNutrition.todayCalories : 0}</p>
                <p className="text-xs text-slate-500 mt-1">{data.todayNutrition ? "Kcal đã tính" : "Chưa có dữ liệu"}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <Flame className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hoạt động tuần</p>
                <p className="text-3xl font-bold mt-1">{data.weeklySummary.reduce((sum, item) => sum + item.steps, 0)}</p>
                <p className="text-xs text-slate-500 mt-1">Tổng bước trong tuần</p>
              </div>
              <div className="bg-violet-100 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-violet-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!hasWorkoutPlan && !error ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <WorkoutPlanEmptyState onAction={handleCreateWorkoutPlan} />
          <LatestSessionEmptyState onAction={handleLogSession} />
          <NutritionGoalEmptyState onAction={handleSetNutritionGoal} />
          <ProgressOverviewEmptyState onAction={handleStartProgress} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calories tuần này</CardTitle>
          </CardHeader>
          <CardContent className="relative overflow-hidden">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.weeklySummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="calories" stroke="#8b5cf6" fill="#c4b5fd" />
              </AreaChart>
            </ResponsiveContainer>
            {isWeeklyEmpty && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/90 px-6 py-8 text-center">
                <WeeklyChartEmptyState onAction={handleLogWeeklyActivity} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Số bước tuần này</CardTitle>
          </CardHeader>
          <CardContent className="relative overflow-hidden">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.weeklySummary}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="steps" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
            {isWeeklyEmpty && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-white/90 px-6 py-8 text-center">
                <WeeklyChartEmptyState onAction={handleLogWeeklyActivity} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

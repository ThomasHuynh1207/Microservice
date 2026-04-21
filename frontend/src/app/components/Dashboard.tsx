import { BellRing, CheckCircle2, Flame, Gauge, Sparkles, Target, TimerReset, Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { getCurrentUser } from "../../services/authService";
import { useDashboardData } from "../../hooks/useDashboardData";

export function Dashboard() {
  const user = getCurrentUser();
  const { data, isLoading, error, refreshData } = useDashboardData(user?.id);

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 px-6">
      <section className="rounded-3xl border border-slate-200 bg-[linear-gradient(130deg,#0F172A_0%,#1E293B_50%,#334155_100%)] p-7 text-white shadow-[0_30px_70px_-35px_rgba(15,23,42,0.9)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Home</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Trung tâm điều khiển sức khỏe cá nhân</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Tổng hợp dinh dưỡng, bài tập được đề xuất, tiến độ mục tiêu và nhắc nhở quan trọng trong một màn hình.
            </p>
          </div>
          <Button
            type="button"
            onClick={refreshData}
            disabled={isLoading}
            className="rounded-xl bg-white text-slate-900 hover:bg-slate-100"
          >
            {isLoading ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}
          </Button>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Calories đã ăn</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.caloriesEatenToday}</p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-orange-100 text-orange-600">
                <Utensils className="h-5 w-5" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Calories còn lại</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.caloriesRemainingToday}</p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Flame className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Mục tiêu ngày: {data.caloriesGoal} kcal</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Tiến độ mục tiêu</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.goalProgressPercent}%</p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo-100 text-indigo-600">
                <Target className="h-5 w-5" />
              </span>
            </div>
            <Progress value={data.goalProgressPercent} className="mt-4 h-2.5" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Streak tập luyện</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{data.streakDays} ngày</p>
              </div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-600">
                <Gauge className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-500">Tổng phút tập 7 ngày: {data.weeklyWorkoutMinutes}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Bài tập đề xuất hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.todayWorkout ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Ngày {data.todayWorkout.dayOrder}</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">{data.todayWorkout.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{data.todayWorkout.focus}</p>
                </div>

                <div className="space-y-2">
                  {data.todayWorkout.exercises.map((exercise, index) => (
                    <div key={`${exercise.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{exercise.name}</p>
                      <span className="text-xs font-semibold text-slate-500">{exercise.setRep}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  {data.workoutCompletedToday ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      Đã hoàn thành buổi tập hôm nay.
                    </>
                  ) : (
                    <>
                      <TimerReset className="h-4 w-4 text-amber-600" />
                      Bạn chưa ghi nhận buổi tập hôm nay.
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                Chưa có lịch tập. Hoàn tất onboarding để hệ thống tự động tạo kế hoạch tập luyện.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BellRing className="h-5 w-5 text-rose-600" />
              Nhắc nhở thông minh
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.reminders.length ? (
              <div className="space-y-3">
                {data.reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      reminder.priority === "high"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {reminder.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Lịch của bạn đang ổn định. Tiếp tục duy trì nhịp độ hiện tại.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

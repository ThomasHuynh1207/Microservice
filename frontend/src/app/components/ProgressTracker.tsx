import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, Flame, TrendingUp } from "lucide-react";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { getCurrentUser } from "../../services/authService";
import { fetchProgressLogs, ProgressLog } from "../../services/fitnessService";
import api from "../../api/api";

interface ProfileMeta {
  weeklyGoal?: number;
}

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const calculateStreak = (logs: ProgressLog[]) => {
  const dates = new Set(logs.map((item) => item.date));
  let streak = 0;
  const cursor = new Date();

  while (dates.has(toDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

export function ProgressTracker() {
  const user = getCurrentUser();

  const [logs, setLogs] = useState<ProgressLog[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [period, setPeriod] = useState<"week" | "month">("week");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError("");

    try {
      const [logsData, profileRes] = await Promise.all([
        fetchProgressLogs(user.id),
        api.get<ProfileMeta>(`/users/${user.id}/profile`).catch(() => ({ data: {} as ProfileMeta })),
      ]);

      setLogs(logsData.sort((a, b) => (a.date > b.date ? 1 : -1)));
      setWeeklyGoal(Number(profileRes.data.weeklyGoal || 4));
    } catch (err) {
      console.error(err);
      setError("Không thể tải dữ liệu tiến độ lúc này.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    const days = period === "week" ? 7 : 30;
    const threshold = new Date(now);
    threshold.setDate(now.getDate() - (days - 1));

    return logs.filter((item) => new Date(`${item.date}T00:00:00`) >= threshold);
  }, [logs, period]);

  const chartData = useMemo(
    () =>
      filteredLogs.map((item) => ({
        date: item.date.slice(5),
        weight: Number(item.weight || 0),
        workoutMinutes: Number(item.workoutMinutes || 0),
      })),
    [filteredLogs]
  );

  const streakDays = useMemo(() => calculateStreak(logs), [logs]);

  const weeklyMinutes = useMemo(() => {
    const now = new Date();
    const days = new Set(Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - idx);
      return toDateKey(d);
    }));

    return logs
      .filter((item) => days.has(item.date))
      .reduce((sum, item) => sum + Number(item.workoutMinutes || 0), 0);
  }, [logs]);

  const goalCompletion = Math.min(100, Math.round((weeklyMinutes / Math.max(1, weeklyGoal * 60)) * 100));

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">TIẾN ĐỘ</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Theo dõi hành trình tập luyện và thay đổi cơ thể</h2>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi cân nặng, mức độ hoàn thành mục tiêu, streak và lịch sử tập luyện theo thời gian.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadData} disabled={isLoading}>
            {isLoading ? "Đang tải..." : "Tải lại dữ liệu"}
          </Button>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Mục tiêu tuần</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{goalCompletion}%</p>
            <Progress value={goalCompletion} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Streak hiện tại</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{streakDays} ngày</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Tổng phút tập 7 ngày</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{weeklyMinutes}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Số bản ghi</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{logs.length}</p>
          </CardContent>
        </Card>
      </section>

      <section className="flex items-center gap-2">
        <Button type="button" variant={period === "week" ? "default" : "outline"} onClick={() => setPeriod("week")}>
          7 ngày
        </Button>
        <Button type="button" variant={period === "month" ? "default" : "outline"} onClick={() => setPeriod("month")}>
          30 ngày
        </Button>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              Biểu đồ cân nặng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              Biểu đồ phút tập luyện
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#64748B" />
                <YAxis stroke="#64748B" />
                <Tooltip />
                <Bar dataKey="workoutMinutes" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-slate-600" />
            Lịch sử tập luyện
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length ? (
            <div className="space-y-2">
              {logs
                .slice()
                .reverse()
                .slice(0, 12)
                .map((log) => (
                  <div key={`${log.id}-${log.date}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{log.activityType || "Workout"}</p>
                      <p className="text-xs text-slate-500">{log.date} | {log.notes || "Không có ghi chú"}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5" />
                        {log.workoutMinutes || 0} phút
                      </span>
                      <span>{log.weight ? `${log.weight} kg` : "-"}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Chưa có lịch sử tiến độ. Bắt đầu ghi nhận buổi tập để theo dõi hành trình.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

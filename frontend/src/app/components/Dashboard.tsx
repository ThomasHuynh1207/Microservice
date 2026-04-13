import { useEffect, useState } from "react";
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
import { getCurrentUser, getUserProfile } from "../../services/authService";
import { fetchWorkouts } from "../../services/fitnessService";
import { getUserSeedData } from "../../services/onboardingService";

export function Dashboard() {
  const [workouts, setWorkouts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState(
    [
      { day: "T2", calories: 0, steps: 0 },
      { day: "T3", calories: 0, steps: 0 },
      { day: "T4", calories: 0, steps: 0 },
      { day: "T5", calories: 0, steps: 0 },
      { day: "T6", calories: 0, steps: 0 },
      { day: "T7", calories: 0, steps: 0 },
      { day: "CN", calories: 0, steps: 0 },
    ]
  );
  const [seedData, setSeedData] = useState<any | null>(null);

  const user = getCurrentUser();
  const [profile, setProfile] = useState<{ age?: number; gender?: string; height?: number; weight?: number; fitnessGoal?: string; activityLevel?: string; experienceLevel?: string } | null>(null);

  const hasWorkoutPlan = workouts > 0;
  const isWeeklyEmpty = weeklyData.every((item) => item.calories === 0 && item.steps === 0);
  const isPostOnboarding = !hasWorkoutPlan && Boolean(seedData);
  const postOnboardingCards = seedData?.suggestedCards || [];

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

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [data, profileData] = await Promise.all([
          fetchWorkouts(user.id).catch(() => []),
          getUserProfile(user.id).catch(() => null),
        ]);
        setWorkouts(data.length);
        if (profileData) setProfile(profileData);

        const seed = getUserSeedData(user.id);
        if (data.length === 0 && seed) {
          setSeedData(seed);
        } else {
          setSeedData(null);
        }

        const sampleDays = data.slice(0, 7).map((item, index) => ({
          day: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"][index] || "T?",
          calories: 300 + (index + 1) * 50,
          steps: 5000 + (index + 1) * 1200,
        }));
        if (sampleDays.length > 0) setWeeklyData(sampleDays);
      } catch (error) {
        console.error("Lấy dữ liệu dashboard thất bại", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold">Xin chào{user ? `, ${user.fullName || user.email}` : "!"} 👋</h2>
        <p className="text-blue-100 mt-1">
          {isPostOnboarding
            ? "Ngày đầu tiên của bạn bắt đầu tại đây. Tạo thói quen và theo dõi tiến bộ từng bước."
            : "Bảng điều khiển realtime với dữ liệu từ backend"}
        </p>
      </div>

      {profile && (
        <Card>
          <CardContent>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Hồ sơ của bạn</p>
                <p className="text-lg font-semibold mt-1">{profile.gender}, {profile.age} tuổi</p>
                <p className="text-sm text-gray-600 mt-1">{profile.height} cm • {profile.weight} kg</p>
                <p className="text-sm text-gray-600">Mục tiêu: {profile.fitnessGoal}</p>
                <p className="text-sm text-gray-600">Kinh nghiệm: {profile.experienceLevel}</p>
                <p className="text-sm text-gray-600">Hoạt động: {profile.activityLevel}</p>
              </div>
              <div className="bg-white/20 p-2 rounded-full text-blue-100">🏃</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isPostOnboarding && seedData ? (
          seedData.suggestedCards.map((card: any, index: number) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Lời nhắc ngày đầu</p>
                    <p className="text-xl font-semibold mt-2 text-slate-900">{card.title}</p>
                    <p className="text-sm text-slate-600 mt-2">{card.description}</p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-700 shadow-sm">
                    {index === 0 ? <Activity className="w-7 h-7" /> : index === 1 ? <Flame className="w-7 h-7" /> : index === 2 ? <HeartPulse className="w-7 h-7" /> : <TrendingUp className="w-7 h-7" />}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => console.log(card.actionText)}
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 hover:shadow-violet-500/30"
                >
                  {card.actionText}
                </button>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            {hasWorkoutPlan ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Kế hoạch tập luyện</p>
                      <p className="text-3xl font-bold mt-1">{workouts}</p>
                      <p className="text-xs text-green-600 mt-1">{isLoading ? "Đang tải..." : "Đã đồng bộ"}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full"><Activity className="w-8 h-8 text-blue-600" /></div>
                  </div>
                  <Progress value={Math.min(100, workouts * 10)} className="mt-4" />
                </CardContent>
              </Card>
            ) : (
              <WorkoutPlanEmptyState onAction={handleCreateWorkoutPlan} />
            )}

            {hasWorkoutPlan ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Kế hoạch mới nhất</p>
                      <p className="text-3xl font-bold mt-1">Có</p>
                      <p className="text-xs text-blue-600 mt-1">Từ /api/workouts</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full"><Flame className="w-8 h-8 text-orange-600" /></div>
                  </div>
                  <Progress value={80} className="mt-4" />
                </CardContent>
              </Card>
            ) : (
              <LatestSessionEmptyState onAction={handleLogSession} />
            )}

            <NutritionGoalEmptyState onAction={handleSetNutritionGoal} />

            <ProgressOverviewEmptyState onAction={handleStartProgress} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calories tuần này</CardTitle>
          </CardHeader>
          <CardContent className="relative overflow-hidden">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
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
                {seedData?.weeklyMessage && (
                  <p className="mt-3 max-w-xs text-sm text-slate-500">{seedData.weeklyMessage}</p>
                )}
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
              <BarChart data={weeklyData}>
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
                {seedData?.weeklyMessage && (
                  <p className="mt-3 max-w-xs text-sm text-slate-500">{seedData.weeklyMessage}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

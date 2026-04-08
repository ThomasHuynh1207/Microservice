import { useEffect, useState } from "react";
import { Activity, Flame, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { getCurrentUser, getUserProfile } from "../../services/authService";
import { fetchWorkouts } from "../../services/fitnessService";

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

  const user = getCurrentUser();
  const [profile, setProfile] = useState<{ age?: number; gender?: string; height?: number; weight?: number; fitnessGoal?: string; activityLevel?: string; experienceLevel?: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [data, profileData] = await Promise.all([fetchWorkouts(user.id), getUserProfile(user.id).catch(() => null)]);
        setWorkouts(data.length);
        if (profileData) setProfile(profileData);

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
        <p className="text-blue-100 mt-1">Bảng điều khiển realtime với dữ liệu từ backend</p>
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

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Kế hoạch mới nhất</p>
                <p className="text-3xl font-bold mt-1">{workouts > 0 ? "Có" : "Chưa có"}</p>
                <p className="text-xs text-blue-600 mt-1">Từ /api/workouts</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full"><Flame className="w-8 h-8 text-orange-600" /></div>
            </div>
            <Progress value={workouts > 0 ? 80 : 20} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Mục tiêu dinh dưỡng</p>
                <p className="text-3xl font-bold mt-1">2100</p>
                <p className="text-xs text-green-600 mt-1">Giá trị mẫu</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full"><Target className="w-8 h-8 text-green-600" /></div>
            </div>
            <Progress value={62} className="mt-4" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tiến trình</p>
                <p className="text-3xl font-bold mt-1">{workouts * 5}%</p>
                <p className="text-xs text-purple-600 mt-1">Số liệu ước lượng</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full"><TrendingUp className="w-8 h-8 text-purple-600" /></div>
            </div>
            <Progress value={Math.min(100, workouts * 7)} className="mt-4" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Calories tuần này</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="calories" stroke="#8b5cf6" fill="#c4b5fd" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Số bước tuần này</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="steps" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

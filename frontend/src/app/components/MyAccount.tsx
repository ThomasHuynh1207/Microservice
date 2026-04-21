import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarDays, CircleUserRound, LogOut, Mail, Ruler, Target, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { getCurrentUser, getUserProfile, logout, UserProfileResponse } from "../../services/authService";

type WorkoutDayHistoryEntry = {
  key: string;
  userId: number;
  planId: number;
  dayOrder: number;
  planName: string;
  dayName: string;
  completedExercises: number;
  totalExercises: number;
  completedAt: string;
  lastUpdatedAt: string;
};

const workoutDayHistoryStorageKey = (userId: number) => `workout-day-history:${userId}`;

const safeParseJson = <T,>(rawValue: string | null, fallback: T): T => {
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const formatWorkoutDate = (value: string) => {
  try {
    return new Date(value).toLocaleString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

export function MyAccount() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutDayHistoryEntry[]>([]);

  const loadWorkoutHistory = () => {
    if (!currentUser) {
      setWorkoutHistory([]);
      return;
    }

    const raw = localStorage.getItem(workoutDayHistoryStorageKey(currentUser.id));
    const parsed = safeParseJson<WorkoutDayHistoryEntry[]>(raw, []);
    const sorted = [...parsed].sort(
      (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime()
    );
    setWorkoutHistory(sorted);
  };

  useEffect(() => {
    if (!currentUser) return;

    const controller = new AbortController();

    const loadProfile = async () => {
      setIsLoading(true);
      setError("");
      try {
        const data = await getUserProfile(currentUser.id);
        if (!controller.signal.aborted) {
          setProfile(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError("Không thể tải thông tin hồ sơ lúc này.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      controller.abort();
    };
  }, [currentUser]);

  useEffect(() => {
    loadWorkoutHistory();
    window.addEventListener("focus", loadWorkoutHistory);
    return () => window.removeEventListener("focus", loadWorkoutHistory);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!currentUser) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Chưa đăng nhập</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">Vui lòng đăng nhập để xem mục tài khoản.</p>
            <Button className="mt-4 rounded-none" onClick={() => navigate("/login")}>Đi tới đăng nhập</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="rounded-none border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CircleUserRound className="h-5 w-5" />
            Tài khoản của tôi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-none border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Họ tên</p>
              <p className="mt-1 font-semibold text-slate-900">{currentUser.fullName || "Chưa cập nhật"}</p>
            </div>
            <div className="rounded-none border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900 break-all">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-600">
            <User className="h-4 w-4" />
            Mã người dùng: {currentUser.id}
          </div>

          <Button variant="outline" className="rounded-none" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Đăng xuất
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-none border-slate-200">
        <CardHeader>
          <CardTitle>Thông tin hồ sơ luyện tập</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-slate-600">Đang tải hồ sơ...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : profile ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-none border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Mục tiêu thể chất</p>
                <p className="mt-1 font-semibold text-slate-900 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {profile.fitnessGoal || "Chưa cập nhật"}
                </p>
              </div>
              <div className="rounded-none border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Giới tính</p>
                <p className="mt-1 font-semibold text-slate-900">{profile.gender || "Chưa cập nhật"}</p>
              </div>
              <div className="rounded-none border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Chiều cao</p>
                <p className="mt-1 font-semibold text-slate-900 flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  {profile.height ? `${profile.height} cm` : "Chưa cập nhật"}
                </p>
              </div>
              <div className="rounded-none border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">Cân nặng</p>
                <p className="mt-1 font-semibold text-slate-900">{profile.weight ? `${profile.weight} kg` : "Chưa cập nhật"}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-none border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Hồ sơ của bạn chưa có dữ liệu. Hãy hoàn tất onboarding để cập nhật thông tin.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-none border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <CalendarDays className="h-5 w-5" />
            Lịch sử tập luyện
          </CardTitle>
        </CardHeader>
        <CardContent>
          {workoutHistory.length ? (
            <div className="space-y-3">
              {workoutHistory.map((entry) => (
                <div key={entry.key} className="rounded-none border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{entry.dayName}</p>
                      <p className="mt-1 text-xs text-slate-500">{entry.planName}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{formatWorkoutDate(entry.completedAt)}</p>
                      <p className="mt-1">Hoàn thành {entry.completedExercises}/{entry.totalExercises} bài</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-none border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Chưa có lịch sử tập luyện trong tài khoản. Khi hoàn thành đủ bài của một ngày tập, lịch sử sẽ hiện ở đây.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Mail className="h-4 w-4" />
        Mọi thay đổi lớn về tài khoản sẽ được hiển thị tại đây.
      </div>
    </div>
  );
}

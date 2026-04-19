import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "../api/api";

export interface DashboardGoals {
  goalName: string;
  progressPercent: number;
  targetValue: number;
  currentValue: number;
}

export interface DashboardWorkoutSummary {
  todayWorkoutCount: number;
  activeMinutes: number;
  caloriesBurned: number;
}

export interface DashboardNutritionSummary {
  todayCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  waterIntake: number;
}

export interface WeeklyDaySummary {
  day: string;
  calories: number;
  steps: number;
}

export interface DashboardData {
  goals?: DashboardGoals[];
  todayWorkout?: DashboardWorkoutSummary;
  todayNutrition?: DashboardNutritionSummary;
  weeklySummary?: WeeklyDaySummary[];
  profile?: {
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    fitnessGoal?: string;
    activityLevel?: string;
    experienceLevel?: string;
  };
}

interface WorkoutSessionItem {
  id: number;
  startTime?: string;
  durationMinutes?: number;
  completed?: boolean;
}

interface ProgressLogItem {
  id: number;
  date?: string;
  workoutMinutes?: number;
}

interface BackendProfile {
  fitnessLevel?: string;
  preferredWorkoutType?: string;
  weeklyGoal?: number;
  targetCalories?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
}

const defaultWeeklyData: WeeklyDaySummary[] = [
  { day: "T2", calories: 0, steps: 0 },
  { day: "T3", calories: 0, steps: 0 },
  { day: "T4", calories: 0, steps: 0 },
  { day: "T5", calories: 0, steps: 0 },
  { day: "T6", calories: 0, steps: 0 },
  { day: "T7", calories: 0, steps: 0 },
  { day: "CN", calories: 0, steps: 0 },
];

const weekdayLabel = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const toDateKey = (value: Date) => value.toISOString().split("T")[0];

const buildWeeklySummaryFromProgress = (logs: ProgressLogItem[]): WeeklyDaySummary[] => {
  const today = new Date();
  const keys: string[] = [];
  const keySet = new Set<string>();

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const key = toDateKey(day);
    keys.push(key);
    keySet.add(key);
  }

  const map = new Map<string, { calories: number; steps: number }>();

  logs.forEach((log) => {
    if (!log.date || !keySet.has(log.date)) return;
    const minutes = Number(log.workoutMinutes || 0);
    const current = map.get(log.date) || { calories: 0, steps: 0 };
    // Ước tính đơn giản cho dashboard khi backend chưa trả calories/steps tổng hợp.
    current.calories += Math.max(0, Math.round(minutes * 6));
    current.steps += Math.max(0, Math.round(minutes * 120));
    map.set(log.date, current);
  });

  return keys.map((key) => {
    const date = new Date(`${key}T00:00:00`);
    const metric = map.get(key) || { calories: 0, steps: 0 };
    return {
      day: weekdayLabel[date.getDay()],
      calories: metric.calories,
      steps: metric.steps,
    };
  });
};

const buildTodayWorkoutFromSessions = (sessions: WorkoutSessionItem[]): DashboardWorkoutSummary => {
  const todayKey = toDateKey(new Date());
  const todaySessions = sessions.filter((session) => session.startTime?.startsWith(todayKey));
  const activeMinutes = todaySessions.reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0);
  return {
    todayWorkoutCount: todaySessions.length,
    activeMinutes,
    caloriesBurned: Math.max(0, Math.round(activeMinutes * 6)),
  };
};

const buildGoalsFromProfileAndProgress = (
  profile: BackendProfile | undefined,
  logs: ProgressLogItem[]
): DashboardGoals[] => {
  if (!profile) return [];

  const today = new Date();
  const weekKeys = new Set<string>();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    weekKeys.add(toDateKey(day));
  }

  const weeklyMinutes = logs
    .filter((log) => Boolean(log.date) && weekKeys.has(log.date as string))
    .reduce((sum, log) => sum + Number(log.workoutMinutes || 0), 0);

  const goals: DashboardGoals[] = [];

  if (profile.weeklyGoal && profile.weeklyGoal > 0) {
    const targetMinutes = profile.weeklyGoal * 60;
    goals.push({
      goalName: "Vận động mỗi tuần",
      targetValue: targetMinutes,
      currentValue: weeklyMinutes,
      progressPercent: Math.min(100, Math.round((weeklyMinutes / targetMinutes) * 100)),
    });
  }

  if (profile.targetCalories && profile.targetCalories > 0) {
    goals.push({
      goalName: "Mục tiêu calo mỗi ngày",
      targetValue: profile.targetCalories,
      currentValue: profile.targetCalories,
      progressPercent: 100,
    });
  }

  return goals;
};

const fetchDashboardData = async (userId: number, signal: AbortSignal): Promise<DashboardData> => {
  const safeDefault: DashboardData = {
    goals: [],
    todayWorkout: {
      todayWorkoutCount: 0,
      activeMinutes: 0,
      caloriesBurned: 0,
    },
    todayNutrition: {
      todayCalories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      waterIntake: 0,
    },
    weeklySummary: defaultWeeklyData,
    profile: {},
  };

  try {
    console.log("[Dashboard] fetch /dashboard");
    const response = await api.get<DashboardData>("/dashboard", { signal });
    return response.data;
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }

    console.log("[Dashboard] endpoint tổng hợp lỗi, dùng fallback mềm", error);
    try {
      const [profileRes, sessionsRes, progressRes] = await Promise.allSettled([
        api.get<BackendProfile>(`/profile/${userId}`, { signal }),
        api.get<WorkoutSessionItem[]>(`/workouts/sessions/user/${userId}`, { signal }),
        api.get<ProgressLogItem[]>(`/progress/user/${userId}`, { signal }),
      ]);

      const profile = profileRes.status === "fulfilled" ? profileRes.value.data : undefined;
      const sessions = sessionsRes.status === "fulfilled" ? sessionsRes.value.data : [];
      const progressLogs = progressRes.status === "fulfilled" ? progressRes.value.data : [];

      return {
        goals: buildGoalsFromProfileAndProgress(profile, progressLogs),
        todayWorkout: buildTodayWorkoutFromSessions(sessions),
        todayNutrition: {
          todayCalories: Number(profile?.targetCalories || 0),
          protein: Number(profile?.proteinTarget || 0),
          carbs: Number(profile?.carbsTarget || 0),
          fat: Number(profile?.fatTarget || 0),
          waterIntake: 0,
        },
        weeklySummary: buildWeeklySummaryFromProgress(progressLogs),
        profile: {
          fitnessGoal: profile?.preferredWorkoutType,
          activityLevel: profile?.fitnessLevel,
          experienceLevel: profile?.fitnessLevel,
        },
      };
    } catch (fallbackError) {
      if (signal.aborted) {
        throw fallbackError;
      }
      console.error("[Dashboard] fallback lỗi, trả dữ liệu mặc định", fallbackError);
      return safeDefault;
    }
  }
};

export const useDashboardData = (userId?: number) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!userId) return;

    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const payload = await fetchDashboardData(userId, controller.signal);
        if (isMounted) {
          setData(payload);
          console.log("[Dashboard] loadData thành công", payload);
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log("[Dashboard] request aborted");
          return;
        }
        console.error("[Dashboard] loadData error", err);
        if (isMounted) {
          setError(
            axios.isAxiosError(err)
              ? err.response?.data?.message || err.message
              : "Đã có lỗi khi tải dữ liệu dashboard."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [userId]);

  const refreshData = useCallback(() => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    fetchDashboardData(userId, controller.signal)
      .then((payload) => {
        setData(payload);
        console.log("[Dashboard] refreshData thành công", payload);
      })
      .catch((err) => {
        console.error("[Dashboard] refreshData lỗi", err);
        setError(
          axios.isAxiosError(err)
            ? err.response?.data?.message || err.message
            : "Đã có lỗi khi tải lại dữ liệu dashboard."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  const dashboardData = useMemo(
    () => ({
      goals: data?.goals ?? [],
      todayWorkout: data?.todayWorkout,
      todayNutrition: data?.todayNutrition,
      weeklySummary: data?.weeklySummary ?? defaultWeeklyData,
      profile: data?.profile,
    }),
    [data]
  );

  return {
    data: dashboardData,
    isLoading,
    error,
    refreshData,
  };
};

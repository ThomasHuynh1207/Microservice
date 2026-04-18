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

const defaultWeeklyData: WeeklyDaySummary[] = [
  { day: "T2", calories: 0, steps: 0 },
  { day: "T3", calories: 0, steps: 0 },
  { day: "T4", calories: 0, steps: 0 },
  { day: "T5", calories: 0, steps: 0 },
  { day: "T6", calories: 0, steps: 0 },
  { day: "T7", calories: 0, steps: 0 },
  { day: "CN", calories: 0, steps: 0 },
];

const fetchDashboardData = async (userId: number, signal: AbortSignal): Promise<DashboardData> => {
  try {
    console.log("[Dashboard] fetch /dashboard");
    const response = await api.get<DashboardData>("/dashboard", { signal });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // Nếu không có endpoint aggregator, fallback sang các endpoint tách riêng.
      console.log("[Dashboard] /dashboard không tồn tại, fallback sang endpoint riêng");
      const [goalsRes, workoutRes, nutritionRes, weeklyRes, profileRes] = await Promise.all([
        api.get<DashboardGoals[]>("/user/goals", { signal }),
        api.get<DashboardWorkoutSummary>("/workouts/today", { signal }),
        api.get<DashboardNutritionSummary>("/nutrition/today", { signal }),
        api.get<WeeklyDaySummary[]>("/nutrition/weekly", { signal }),
        api.get(`/profile/${userId}`, { signal }),
      ]);
      return {
        goals: goalsRes.data,
        todayWorkout: workoutRes.data,
        todayNutrition: nutritionRes.data,
        weeklySummary: weeklyRes.data,
        profile: profileRes.data,
      };
    }
    throw error;
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

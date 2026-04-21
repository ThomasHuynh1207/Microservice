import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import api from "../api/api";
import {
  DailyMeal,
  fetchMealPlans,
  fetchProgressLogs,
  fetchWorkoutPlanDetail,
  fetchWorkoutPlans,
  fetchWorkoutSessions,
  MealPlan,
  WorkoutDayTemplate,
  WorkoutPlanSummary,
} from "../services/fitnessService";

export interface HomeReminder {
  id: string;
  message: string;
  priority: "high" | "normal";
}

export interface HomeData {
  caloriesGoal: number;
  caloriesEatenToday: number;
  caloriesRemainingToday: number;
  todayWorkout: {
    dayOrder: number;
    title: string;
    focus: string;
    exercises: Array<{ name: string; setRep: string }>;
  } | null;
  goalProgressPercent: number;
  streakDays: number;
  reminders: HomeReminder[];
  workoutCompletedToday: boolean;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  weeklyWorkoutMinutes: number;
}

interface ProfileResponse {
  targetCalories?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  weeklyGoal?: number;
}

const defaultData: HomeData = {
  caloriesGoal: 0,
  caloriesEatenToday: 0,
  caloriesRemainingToday: 0,
  todayWorkout: null,
  goalProgressPercent: 0,
  streakDays: 0,
  reminders: [],
  workoutCompletedToday: false,
  macros: {
    protein: 0,
    carbs: 0,
    fat: 0,
  },
  weeklyWorkoutMinutes: 0,
};

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const getTodayDayFromPlan = (plan: MealPlan | null): DailyMeal | null => {
  if (!plan) return null;
  const todayKey = dateKey(new Date());
  return plan.dailyMeals.find((day) => day.dayDate?.startsWith(todayKey)) || null;
};

const extractWorkoutDayForToday = (days: WorkoutDayTemplate[] | undefined): WorkoutDayTemplate | null => {
  if (!days || !days.length) return null;
  const jsDay = new Date().getDay();
  const mappedDay = jsDay === 0 ? 7 : jsDay;
  return days.find((item) => item.dayOrder === mappedDay) || days[(mappedDay - 1) % days.length] || days[0] || null;
};

const calculateStreak = (dates: string[]): number => {
  if (!dates.length) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = dateKey(cursor);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const buildHomeData = async (userId: number, signal: AbortSignal): Promise<HomeData> => {
  const [profileRes, workoutPlans, mealPlans, sessions, progressLogs] = await Promise.all([
    api.get<ProfileResponse>(`/users/${userId}/profile`, { signal }).catch(() => ({ data: {} as ProfileResponse })),
    fetchWorkoutPlans(userId),
    fetchMealPlans(userId),
    fetchWorkoutSessions(userId),
    fetchProgressLogs(userId),
  ]);

  const profile = profileRes.data || {};
  const latestWorkoutPlan: WorkoutPlanSummary | null = workoutPlans.length ? workoutPlans[0] : null;
  const latestMealPlan: MealPlan | null = mealPlans.length ? mealPlans[0] : null;

  let workoutDayForToday: WorkoutDayTemplate | null = null;
  if (latestWorkoutPlan?.id) {
    try {
      const detail = await fetchWorkoutPlanDetail(latestWorkoutPlan.id);
      workoutDayForToday = extractWorkoutDayForToday(detail.days);
    } catch {
      workoutDayForToday = null;
    }
  }

  const todayMeal = getTodayDayFromPlan(latestMealPlan);
  const caloriesEatenToday = todayMeal
    ? todayMeal.items
        .filter((item) => item.eaten)
        .reduce((sum, item) => sum + Number(item.actualCalories ?? item.calories ?? 0), 0)
    : 0;

  const caloriesGoal = Number(latestMealPlan?.targetCalories || profile.targetCalories || 0);
  const caloriesRemainingToday = Math.max(0, caloriesGoal - caloriesEatenToday);

  const todayKey = dateKey(new Date());
  const workoutCompletedToday = sessions.some((session) => session.startTime?.startsWith(todayKey) && session.completed);

  const now = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - idx);
    return dateKey(d);
  });
  const last7Set = new Set(last7Days);

  const weeklyWorkoutMinutes = progressLogs
    .filter((log) => last7Set.has(log.date))
    .reduce((sum, log) => sum + Number(log.workoutMinutes || 0), 0);

  const weeklyGoalHours = Number(profile.weeklyGoal || 4);
  const goalProgressPercent = Math.min(100, Math.round((weeklyWorkoutMinutes / Math.max(1, weeklyGoalHours * 60)) * 100));

  const streakDays = calculateStreak(
    progressLogs
      .map((item) => item.date)
      .filter(Boolean)
      .sort((a, b) => (a > b ? -1 : 1))
  );

  const reminders: HomeReminder[] = [];
  if (!workoutCompletedToday) {
    reminders.push({
      id: "workout-reminder",
      message: "Nhắc tập luyện: Bạn chưa ghi nhận buổi tập hôm nay.",
      priority: "high",
    });
  }
  if (caloriesGoal > 0 && caloriesEatenToday < caloriesGoal * 0.5) {
    reminders.push({
      id: "nutrition-reminder",
      message: "Nhắc dinh dưỡng: Bạn đang ăn thấp hơn mức calo mục tiêu hôm nay.",
      priority: "normal",
    });
  }
  if (!latestMealPlan) {
    reminders.push({
      id: "meal-plan-reminder",
      message: "Bạn chưa có meal plan. Hoàn tất onboarding hoặc tạo plan mới.",
      priority: "normal",
    });
  }

  return {
    caloriesGoal,
    caloriesEatenToday,
    caloriesRemainingToday,
    todayWorkout: workoutDayForToday
      ? {
          dayOrder: workoutDayForToday.dayOrder,
          title: workoutDayForToday.name,
          focus: workoutDayForToday.focus || "Tập luyện cá nhân hóa",
          exercises: workoutDayForToday.exercises.map((exercise) => ({
            name: exercise.name,
            setRep:
              exercise.setTemplates && exercise.setTemplates.length
                ? `${exercise.setTemplates[0].sets} x ${exercise.setTemplates[0].reps}`
                : "3 x 12",
          })),
        }
      : null,
    goalProgressPercent,
    streakDays,
    reminders,
    workoutCompletedToday,
    macros: {
      protein: Number(latestMealPlan?.proteinTarget || profile.proteinTarget || 0),
      carbs: Number(latestMealPlan?.carbsTarget || profile.carbsTarget || 0),
      fat: Number(latestMealPlan?.fatTarget || profile.fatTarget || 0),
    },
    weeklyWorkoutMinutes,
  };
};

export const useDashboardData = (userId?: number) => {
  const [data, setData] = useState<HomeData>(defaultData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!userId) return;

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const payload = await buildHomeData(userId, controller.signal);
      setData(payload);
    } catch (err) {
      if (!axios.isCancel(err)) {
        setError(axios.isAxiosError(err) ? err.message : "Không thể tải dữ liệu Home lúc này.");
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const refreshData = useCallback(() => {
    void loadData();
  }, [loadData]);

  const stableData = useMemo(() => data || defaultData, [data]);

  return {
    data: stableData,
    isLoading,
    error,
    refreshData,
  };
};

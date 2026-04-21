import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Dumbbell, Share2 } from "lucide-react";
import { Link } from "react-router";
import { getCurrentUser } from "../../services/authService";
import {
  fetchWorkoutPlanDetail,
  fetchWorkoutPlans,
  type WorkoutDayTemplate,
  type WorkoutPlanDetail,
  type WorkoutPlanSummary,
} from "../../services/fitnessService";

type SetResult = {
  weight: string;
  reps: string;
};

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80";

const resultsStorageKey = (userId: number, planId: number, dayOrder: number) =>
  `workout-results:${userId}:${planId}:${dayOrder}`;

const completionStorageKey = (userId: number, planId: number, dayOrder: number) =>
  `workout-completion:${userId}:${planId}:${dayOrder}`;

const safeParseJson = <T,>(rawValue: string | null, fallback: T): T => {
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const getExerciseKey = (exercise: WorkoutDayTemplate["exercises"][number], index: number) =>
  String(exercise.id ?? exercise.exerciseOrder ?? index + 1);

const isFilledSet = (setResult: SetResult) => Boolean(setResult.weight.trim() || setResult.reps.trim());

const calculateCompletedExercises = (
  userId: number | undefined,
  planId: number | null,
  days: WorkoutDayTemplate[]
) => {
  if (!userId || !planId) {
    return 0;
  }

  return days.reduce((total, day) => {
    const storedResults = safeParseJson<Record<string, SetResult[]>>(
      localStorage.getItem(resultsStorageKey(userId, planId, day.dayOrder)),
      {}
    );
    const storedCompletion = safeParseJson<Record<string, boolean>>(
      localStorage.getItem(completionStorageKey(userId, planId, day.dayOrder)),
      {}
    );

    const completedExercises = day.exercises.reduce((dayTotal, exercise, index) => {
      const exerciseKey = getExerciseKey(exercise, index);
      const sets = storedResults[exerciseKey] || [];
      const isDone = Boolean(storedCompletion[exerciseKey] || sets.some(isFilledSet));
      return dayTotal + Number(isDone);
    }, 0);

    return total + completedExercises;
  }, 0);
};

const calculateDayCompletionPercent = (userId: number | undefined, planId: number | null, day: WorkoutDayTemplate) => {
  if (!userId || !planId) {
    return 0;
  }

  const storedResults = safeParseJson<Record<string, SetResult[]>>(
    localStorage.getItem(resultsStorageKey(userId, planId, day.dayOrder)),
    {}
  );
  const storedCompletion = safeParseJson<Record<string, boolean>>(
    localStorage.getItem(completionStorageKey(userId, planId, day.dayOrder)),
    {}
  );

  const completedExercises = day.exercises.reduce((dayTotal, exercise, index) => {
    const exerciseKey = getExerciseKey(exercise, index);
    const sets = storedResults[exerciseKey] || [];
    const isDone = Boolean(storedCompletion[exerciseKey] || sets.some(isFilledSet));
    return dayTotal + Number(isDone);
  }, 0);

  return day.exercises.length ? Math.round((completedExercises / day.exercises.length) * 100) : 0;
};

const sortByDayOrder = (days: WorkoutDayTemplate[]) => [...days].sort((left, right) => left.dayOrder - right.dayOrder);

const buildDayTitle = (day: WorkoutDayTemplate) => day.name?.trim() || `Ngày tập ${day.dayOrder}`;

export function WorkoutHub() {
  const user = getCurrentUser();
  const [plans, setPlans] = useState<WorkoutPlanSummary[]>([]);
  const [planDetail, setPlanDetail] = useState<WorkoutPlanDetail | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setPlans([]);
      setPlanDetail(null);
      return;
    }

    let cancelled = false;

    const loadPlans = async () => {
      try {
        const loadedPlans = await fetchWorkoutPlans(user.id);
        if (!cancelled) {
          setPlans(loadedPlans);
        }
      } catch {
        if (!cancelled) {
          setPlans([]);
        }
      }
    };

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const activePlan = plans[0] ?? null;

  useEffect(() => {
    if (!activePlan?.id) {
      setPlanDetail(null);
      return;
    }

    let cancelled = false;

    const loadPlanDetail = async () => {
      try {
        const detail = await fetchWorkoutPlanDetail(activePlan.id);
        if (!cancelled) {
          setPlanDetail(detail);
        }
      } catch {
        if (!cancelled) {
          setPlanDetail(null);
        }
      }
    };

    void loadPlanDetail();

    return () => {
      cancelled = true;
    };
  }, [activePlan?.id]);

  const days = useMemo(() => sortByDayOrder(planDetail?.days || []), [planDetail]);

  const planName = activePlan?.name || "Chương trình của tôi";
  const completedExerciseCount = calculateCompletedExercises(user?.id, activePlan?.id ?? null, days);
  const highlightedDayOrder = days.find((day) => day.dayOrder === 1)?.dayOrder ?? days[0]?.dayOrder ?? 0;

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1600px] space-y-5 px-4 py-4 sm:px-6 lg:px-8">
      <section
        className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 text-white shadow-[0_22px_55px_-30px_rgba(15,23,42,0.8)]"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.12) 0%, rgba(15,23,42,0.88) 100%), url(${HERO_IMAGE_URL})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.18),transparent_32%)]" />
        <div className="relative min-h-[178px] p-5 sm:p-6">
          <div className="flex h-full flex-col justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-white/82">{planName}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Chương trình của tôi</h1>
            </div>

            <div className="flex items-end justify-between gap-4">
              <p className="text-sm leading-6 text-white/86">Bài tập đã hoàn thành: {completedExerciseCount}</p>
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/18 text-white backdrop-blur-sm" aria-hidden="true">
                <Share2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-700">Ngày tập</h2>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400">
            <ArrowUpDown className="h-5 w-5" />
          </div>
        </div>

        <div className="space-y-3">
          {days.length ? (
            days.map((day) => {
            const targetHref = activePlan?.id ? `/dashboard/workout/day/${activePlan.id}/${day.dayOrder}` : null;
            const isHighlighted = day.dayOrder === highlightedDayOrder;
            const dayPercent = calculateDayCompletionPercent(user?.id, activePlan?.id ?? null, day);

            const content = (
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border-2 bg-white ${
                    isHighlighted ? "border-cyan-300 text-cyan-500" : "border-rose-200 text-rose-500"
                  }`}
                >
                  <span className="text-lg font-semibold">{day.dayOrder}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-500">Ngày {day.dayOrder}</p>
                  <h3 className="mt-1 truncate text-lg font-semibold text-slate-900">{buildDayTitle(day)}</h3>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500">Hoàn thành</p>
                  <p className="text-sm font-semibold text-slate-900">{dayPercent}%</p>
                </div>
              </div>
            );

            return targetHref ? (
              <Link
                key={day.dayOrder}
                to={targetHref}
                className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
              >
                {content}
              </Link>
            ) : (
              <div key={day.dayOrder} className="rounded-xl border border-slate-200 bg-white p-4 opacity-70 shadow-sm">
                {content}
              </div>
            );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
              Chưa có dữ liệu ngày tập từ hệ thống.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

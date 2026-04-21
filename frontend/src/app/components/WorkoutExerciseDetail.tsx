import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { getCurrentUser } from "../../services/authService";
import { translateExerciseName } from "../utils/workoutText";
import {
  ExerciseLibraryItem,
  fetchWorkoutPlanDetail,
  resolveExerciseLibraryItem,
  WorkoutDayTemplate,
} from "../../services/fitnessService";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const formatDisplayLabel = (value: string | undefined, fallback: string) => {
  const raw = (value || "").trim();
  if (!raw) return fallback;
  return raw.replace(/\s*\/\s*/g, " - ").replace(/\s*\|\s*/g, " • ").replace(/\s{2,}/g, " ").trim();
};

type VideoSource = {
  mode: "embed" | "file" | "none";
  src: string;
};

type SetResult = {
  weight: string;
  reps: string;
};

type ExerciseHistoryEntry = {
  setIndex: number;
  summary: string;
  updatedAt: string;
};

const DEFAULT_EXERCISE_VIDEO_MAP: Record<string, string> = {
  "goblet squat": "https://www.youtube.com/watch?v=MeIiIdhvXT4",
  "bench press": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
  "incline dumbbell press": "https://www.youtube.com/watch?v=8iPEnn-ltC8",
  "shoulder press": "https://www.youtube.com/watch?v=qEwKCR5JCog",
  "lat pulldown": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
  "seated row": "https://www.youtube.com/watch?v=HJSVR_67OlM",
  "biceps curl": "https://www.youtube.com/watch?v=ykJmrZ5v0Oo",
  "squat": "https://www.youtube.com/watch?v=U3HlEF_E9fo",
  "romanian deadlift": "https://www.youtube.com/watch?v=2SHsk9AzdjA",
  "plank": "https://www.youtube.com/watch?v=ASdvN_XEl_c",
  "hip thrust": "https://www.youtube.com/watch?v=LM8XHLYJoYs",
  "push-up": "https://www.youtube.com/watch?v=IODxDxX7oi4",
  "tricep pushdown": "https://www.youtube.com/watch?v=2-LAMcpzODU",
  "hammer curl": "https://www.youtube.com/watch?v=zC3nLlEvin4",
};

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

const toEmbeddedVideoUrl = (videoUrl?: string | null) => {
  const raw = (videoUrl || "").trim();
  if (!raw) return "";

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(normalized);
    if (url.hostname.includes("youtube.com")) {
      const videoId = url.searchParams.get("v");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/i);
      if (shortsMatch?.[1]) {
        return `https://www.youtube.com/embed/${shortsMatch[1]}`;
      }
      if (url.pathname.startsWith("/embed/")) {
        return normalized;
      }
    }

    if (url.hostname.includes("youtu.be")) {
      const videoId = url.pathname.replace("/", "");
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch {
    return "";
  }

  return "";
};

const resolveVideoSource = (exerciseName: string, libraryVideoUrl?: string | null): VideoSource => {
  const rawLibraryUrl = (libraryVideoUrl || "").trim();
  const embedded = toEmbeddedVideoUrl(rawLibraryUrl);
  if (embedded) {
    return { mode: "embed", src: embedded };
  }

  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(rawLibraryUrl)) {
    return { mode: "file", src: rawLibraryUrl };
  }

  const fallback = DEFAULT_EXERCISE_VIDEO_MAP[normalizeText(exerciseName)];
  const fallbackEmbedded = toEmbeddedVideoUrl(fallback);
  if (fallbackEmbedded) {
    return { mode: "embed", src: fallbackEmbedded };
  }

  return { mode: "none", src: "" };
};

const safeParseJson = <T,>(rawValue: string | null, fallback: T): T => {
  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatHistoryTime = (value: string) => {
  try {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const getSetCount = (exercise: WorkoutDayTemplate["exercises"][number]) =>
  exercise.setTemplates?.reduce((total, template) => total + Number(template.sets || 0), 0) || 0;

const getExerciseKey = (exercise: WorkoutDayTemplate["exercises"][number], index: number) =>
  String(exercise.id ?? exercise.exerciseOrder ?? index + 1);

const buildEmptySetResults = (exercise: WorkoutDayTemplate["exercises"][number]): SetResult[] =>
  Array.from({ length: Math.max(1, getSetCount(exercise)) }, () => ({ weight: "", reps: "" }));

const isFilledSet = (set: SetResult) => Boolean(set.weight.trim() || set.reps.trim());

const calculateExerciseVolume = (sets: SetResult[]) =>
  sets.reduce((total, entry) => {
    const weight = Number(entry.weight);
    const reps = Number(entry.reps);
    if (Number.isNaN(weight) || Number.isNaN(reps)) {
      return total;
    }
    return total + weight * reps;
  }, 0);

const workoutResultsStorageKey = (userId: number, planId: number, dayOrder: number) =>
  `workout-results:${userId}:${planId}:${dayOrder}`;

const workoutCompletionStorageKey = (userId: number, planId: number, dayOrder: number) =>
  `workout-completion:${userId}:${planId}:${dayOrder}`;

const workoutHistoryStorageKey = (userId: number, planId: number, dayOrder: number, exerciseKey: string) =>
  `workout-history:${userId}:${planId}:${dayOrder}:${exerciseKey}`;

const workoutNoteStorageKey = (userId: number, planId: number, dayOrder: number, exerciseKey: string) =>
  `workout-note:${userId}:${planId}:${dayOrder}:${exerciseKey}`;

const workoutDayHistoryStorageKey = (userId: number) => `workout-day-history:${userId}`;

export function WorkoutExerciseDetail() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userId = user?.id ?? null;
  const params = useParams();
  const [searchParams] = useSearchParams();

  const planId = Number(params.planId || 0);
  const dayOrder = Number(params.dayOrder || 0);
  const exerciseOrder = Number(params.exerciseOrder || 0);
  const exerciseNameHint = searchParams.get("name") || "";

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [planName, setPlanName] = useState("");
  const [day, setDay] = useState<WorkoutDayTemplate | null>(null);
  const [exercise, setExercise] = useState<WorkoutDayTemplate["exercises"][number] | null>(null);
  const [libraryItem, setLibraryItem] = useState<ExerciseLibraryItem | null>(null);
  const [setResults, setSetResults] = useState<SetResult[]>([]);
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({});
  const [historyEntries, setHistoryEntries] = useState<ExerciseHistoryEntry[]>([]);
  const [sessionNote, setSessionNote] = useState("");
  const [restDurationSeconds, setRestDurationSeconds] = useState(120);
  const [restRemainingSeconds, setRestRemainingSeconds] = useState(120);
  const [isRestRunning, setIsRestRunning] = useState(false);

  const persistDayHistory = (nextCompletion: Record<string, boolean>) => {
    if (!userId || !day) {
      return;
    }

    const totalExercises = day.exercises.length;
    if (!totalExercises) {
      return;
    }

    const completedExercises = day.exercises.reduce((total, item, index) => {
      const key = getExerciseKey(item, index);
      return total + Number(Boolean(nextCompletion[key]));
    }, 0);

    if (completedExercises < totalExercises) {
      return;
    }

    const storageKey = workoutDayHistoryStorageKey(userId);
    const existing = safeParseJson<WorkoutDayHistoryEntry[]>(localStorage.getItem(storageKey), []);
    const historyKey = `${planId}-${dayOrder}`;
    const now = new Date().toISOString();
    const previous = existing.find((item) => item.key === historyKey);
    const nextEntry: WorkoutDayHistoryEntry = {
      key: historyKey,
      userId,
      planId,
      dayOrder,
      planName: formatDisplayLabel(planName, "Kế hoạch tập"),
      dayName: formatDisplayLabel(day.name, `Ngày ${day.dayOrder}`),
      completedExercises,
      totalExercises,
      completedAt: previous?.completedAt || now,
      lastUpdatedAt: now,
    };

    const merged = [nextEntry, ...existing.filter((item) => item.key !== historyKey)].sort(
      (left, right) => new Date(right.completedAt).getTime() - new Date(left.completedAt).getTime()
    );
    localStorage.setItem(storageKey, JSON.stringify(merged));
  };

  const currentExerciseKey = useMemo(() => {
    if (!exercise) {
      return "";
    }

    return getExerciseKey(exercise, 0);
  }, [exercise]);

  const completedSets = useMemo(() => setResults.filter(isFilledSet).length, [setResults]);
  const totalVolume = useMemo(() => calculateExerciseVolume(setResults), [setResults]);
  const exerciseHeroTitle = translateExerciseName(exercise?.name || "Bài tập");
  const videoSource = useMemo(
    () => resolveVideoSource(exercise?.name || "", libraryItem?.videoUrl),
    [exercise?.name, libraryItem?.videoUrl]
  );

  useEffect(() => {
    if (!isRestRunning) {
      return;
    }

    const timerId = window.setInterval(() => {
      setRestRemainingSeconds((current) => {
        if (current <= 1) {
          setIsRestRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isRestRunning]);

  const persistExerciseState = (nextResults: SetResult[]) => {
    if (!userId || !day || !exercise || !currentExerciseKey) {
      return;
    }

    const resultsKey = workoutResultsStorageKey(userId, planId, dayOrder);
    const completionKey = workoutCompletionStorageKey(userId, planId, dayOrder);
    const historyKey = workoutHistoryStorageKey(userId, planId, dayOrder, currentExerciseKey);
    const nextCompletion = nextResults.length >= exerciseSetCount && nextResults.slice(0, exerciseSetCount).every(isFilledSet);

    const storedResults = safeParseJson<Record<string, SetResult[]>>(localStorage.getItem(resultsKey), {});
    storedResults[currentExerciseKey] = nextResults;
    localStorage.setItem(resultsKey, JSON.stringify(storedResults));

    const storedCompletion = safeParseJson<Record<string, boolean>>(localStorage.getItem(completionKey), {});
    storedCompletion[currentExerciseKey] = nextCompletion;
    localStorage.setItem(completionKey, JSON.stringify(storedCompletion));
    persistDayHistory(storedCompletion);

    const nextHistory = nextResults
      .map((entry, index) => {
        if (!isFilledSet(entry)) {
          return null;
        }

        return {
          setIndex: index,
          summary: `No.${index + 1} ${entry.weight.trim()} kg x ${entry.reps.trim()} reps`,
          updatedAt: new Date().toISOString(),
        } as ExerciseHistoryEntry;
      })
      .filter((entry): entry is ExerciseHistoryEntry => Boolean(entry));

    localStorage.setItem(historyKey, JSON.stringify(nextHistory));

    setCompletionMap(storedCompletion);
    setHistoryEntries(nextHistory);
  };

  useEffect(() => {
    const loadData = async () => {
      if (!planId || !dayOrder || !exerciseOrder) {
        setError("Đường dẫn bài tập không hợp lệ.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const detail = await fetchWorkoutPlanDetail(planId);
        const selectedDay = detail.days.find((item) => item.dayOrder === dayOrder);
        if (!selectedDay) {
          setError("Không tìm thấy ngày tập này.");
          setIsLoading(false);
          return;
        }

        const selectedIndexByOrder = selectedDay.exercises.findIndex((item) => item.exerciseOrder === exerciseOrder);
        const selectedIndexByName = selectedDay.exercises.findIndex((item) => normalizeText(item.name) === normalizeText(exerciseNameHint));
        const selectedIndex = selectedIndexByOrder >= 0 ? selectedIndexByOrder : selectedIndexByName;
        const selectedExercise = selectedIndex >= 0 ? selectedDay.exercises[selectedIndex] : null;

        if (!selectedExercise) {
          setError("Không tìm thấy bài tập trong ngày này.");
          setIsLoading(false);
          return;
        }

        const resolved = await resolveExerciseLibraryItem(selectedExercise.name).catch(() => null);
        const exerciseKey = getExerciseKey(selectedExercise, selectedIndex);

        const storedResults = userId
          ? safeParseJson<Record<string, SetResult[]>>(
              localStorage.getItem(workoutResultsStorageKey(userId, planId, dayOrder)),
              {}
            )
          : {};
        const storedCompletion = userId
          ? safeParseJson<Record<string, boolean>>(
              localStorage.getItem(workoutCompletionStorageKey(userId, planId, dayOrder)),
              {}
            )
          : {};
        const storedHistory = userId
          ? safeParseJson<ExerciseHistoryEntry[]>(
              localStorage.getItem(workoutHistoryStorageKey(userId, planId, dayOrder, exerciseKey)),
              []
            )
          : [];
        const storedNote = userId
          ? safeParseJson<string>(localStorage.getItem(workoutNoteStorageKey(userId, planId, dayOrder, exerciseKey)), "")
          : "";

        const existingSets = storedResults[exerciseKey] || storedResults[selectedExercise.name] || [];
        const normalizedResults = (existingSets.length ? existingSets : [{ weight: "", reps: "" }]).map((current) => ({
          weight: current?.weight || "",
          reps: current?.reps || "",
        }));

        setPlanName(detail.name || "Kế hoạch tập");
        setDay(selectedDay);
        setExercise(selectedExercise);
        setLibraryItem(resolved);
        setSetResults(normalizedResults);
        setCompletionMap(storedCompletion);
        setHistoryEntries(storedHistory);
        setSessionNote(storedNote);
      } catch (loadError) {
        console.error(loadError);
        setError("Không thể tải chi tiết bài tập.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [dayOrder, exerciseOrder, exerciseNameHint, planId, userId]);

  const updateSetResult = (setIndex: number, field: keyof SetResult, value: string) => {
    setSetResults((current) => {
      const next = current.map((entry, index) =>
        index === setIndex
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      );

      persistExerciseState(next);
      return next;
    });
  };

  const addExerciseSet = () => {
    setSetResults((current) => {
      const next = [...current, { weight: "", reps: "" }];
      persistExerciseState(next);
      return next;
    });
  };

  const removeExerciseSet = (setIndex: number) => {
    setSetResults((current) => {
      if (current.length <= 1) {
        return current;
      }

      const next = current.filter((_, index) => index !== setIndex);
      persistExerciseState(next);
      return next;
    });
  };

  const updateSessionNote = (value: string) => {
    setSessionNote(value);

    if (!userId || !day || !exercise || !currentExerciseKey) {
      return;
    }

    localStorage.setItem(workoutNoteStorageKey(userId, planId, dayOrder, currentExerciseKey), JSON.stringify(value));
  };

  const setExerciseCompletion = (nextDone: boolean) => {
    if (!userId || !day || !currentExerciseKey) {
      return;
    }

    const completionKey = workoutCompletionStorageKey(userId, planId, dayOrder);
    const storedCompletion = safeParseJson<Record<string, boolean>>(localStorage.getItem(completionKey), {});
    storedCompletion[currentExerciseKey] = nextDone;
    localStorage.setItem(completionKey, JSON.stringify(storedCompletion));
    persistDayHistory(storedCompletion);
    setCompletionMap(storedCompletion);
  };

  if (isLoading) {
    return (
      <div className="mx-auto min-h-screen max-w-[1920px] px-4 py-6 sm:px-6 xl:px-10">
        <Card className="!rounded-[28px] border-slate-200">
          <CardContent className="py-14 text-center text-sm text-slate-500">Đang tải chi tiết bài tập...</CardContent>
        </Card>
      </div>
    );
  }

  if (error || !day || !exercise) {
    return (
      <div className="mx-auto min-h-screen max-w-[1920px] space-y-4 px-4 py-6 sm:px-6 xl:px-10">
        <Button type="button" variant="outline" onClick={() => navigate(-1)} className="!rounded-xl">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <Card className="!rounded-[28px] border-slate-200">
          <CardContent className="py-12 text-center text-sm text-slate-600">{error || "Không tìm thấy chi tiết bài tập."}</CardContent>
        </Card>
      </div>
    );
  }

  const exerciseSetCount = Math.max(1, getSetCount(exercise));
  const restClock = formatClock(restRemainingSeconds);
  const completedSetDisplay = Math.min(completedSets, exerciseSetCount);
  const isDone = Boolean(
    currentExerciseKey &&
      (completionMap[currentExerciseKey] || (setResults.length >= exerciseSetCount && setResults.slice(0, exerciseSetCount).every(isFilledSet)))
  );
  const exerciseTargetReps = exercise.setTemplates?.[0]?.reps || "10-12 reps";
  const visibleHistoryEntries = historyEntries.length
    ? historyEntries
    : setResults
        .map((entry, index) => {
          if (!isFilledSet(entry)) {
            return null;
          }

          return {
            setIndex: index,
            summary: `No.${index + 1} ${entry.weight.trim()} kg x ${entry.reps.trim()} reps`,
            updatedAt: new Date().toISOString(),
          } as ExerciseHistoryEntry;
        })
        .filter((entry): entry is ExerciseHistoryEntry => Boolean(entry));

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] space-y-3 px-4 py-4 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="space-y-4 p-4 sm:p-5 xl:p-6">
          <Card className="rounded-2xl border-slate-200 bg-slate-50 shadow-sm">
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                {videoSource.mode === "embed" ? (
                  <iframe
                    src={videoSource.src}
                    title={`Video hướng dẫn ${exerciseHeroTitle}`}
                    className="h-[360px] w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : videoSource.mode === "file" ? (
                  <video controls preload="metadata" className="h-[360px] w-full object-cover">
                    <source src={videoSource.src} />
                  </video>
                ) : (
                  <div className="flex h-[360px] items-center justify-center px-6 text-center text-sm text-slate-300">
                    Chưa có video cho bài này. Có thể bổ sung URL video trong thư viện bài tập để hiển thị tự động.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-slate-50 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Thời gian nghỉ</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const nextDuration = Math.max(15, restDurationSeconds - 15);
                      setRestDurationSeconds(nextDuration);
                      setRestRemainingSeconds((current) => Math.min(current, nextDuration));
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold text-slate-600 transition hover:bg-slate-100"
                    aria-label="Giảm thời gian nghỉ"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextDuration = Math.min(900, restDurationSeconds + 15);
                      setRestDurationSeconds(nextDuration);
                      setRestRemainingSeconds((current) => Math.max(current, nextDuration));
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xl font-semibold text-slate-600 transition hover:bg-slate-100"
                    aria-label="Tăng thời gian nghỉ"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-cyan-400 bg-white text-3xl font-semibold text-slate-900">
                  {restClock}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRestRunning((current) => !current)}
                    className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
                  >
                    {isRestRunning ? "Tạm dừng" : "Bắt đầu nghỉ"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRestRunning(false);
                      setRestRemainingSeconds(restDurationSeconds);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Đặt lại
                  </button>
                </div>
                <p className="text-xs text-slate-500">Mặc định: {formatClock(restDurationSeconds)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Ngày {day.dayOrder}</p>
            <CardTitle className="text-2xl text-slate-900 sm:text-3xl">{exerciseHeroTitle}</CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-slate-500">
              {formatDisplayLabel(day.name, `Ngày ${day.dayOrder}`)} • {formatDisplayLabel(planName, "Kế hoạch tập")}
            </p>
          </div>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base text-slate-900">Set / Rep / Kg</CardTitle>
                <button
                  type="button"
                  onClick={() => setExerciseCompletion(!isDone)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    isDone
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {isDone ? "Bỏ hoàn thành" : "Đánh dấu hoàn thành"}
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {setResults.map((entry, setIndex) => (
                <div
                  key={`${currentExerciseKey}-${setIndex}`}
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(0,1.15fr)_120px_120px_auto] md:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3 text-sm text-slate-600">
                    <span className="rounded-lg bg-white px-2.5 py-1 font-semibold text-slate-700 shadow-sm">Set {setIndex + 1}</span>
                    <span className="leading-5">Ghi kg và reps thực tế</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Kg</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.5"
                      value={entry.weight}
                      onChange={(event) => updateSetResult(setIndex, "weight", event.target.value)}
                      placeholder="20"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Reps</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={entry.reps}
                      onChange={(event) => updateSetResult(setIndex, "reps", event.target.value)}
                      placeholder="10"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeExerciseSet(setIndex)}
                    disabled={setResults.length <= 1}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Xóa set ${setIndex + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={addExerciseSet}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Plus className="h-4 w-4" />
                  Thêm set
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5">Đã nhập {completedSetDisplay}/{exerciseSetCount} set</span>
                  <span className="rounded-lg bg-slate-100 px-3 py-1.5">Volume {Math.round(totalVolume)} kg</span>
                  <span className={`rounded-lg px-3 py-1.5 ${isDone ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {isDone ? "Đã hoàn thành" : "Chưa hoàn thành"}
                  </span>
                </div>
              </div>

              <p className="text-xs leading-6 text-slate-500">
                Khi đủ số set cần thiết và mọi set đều có kg/reps, bài sẽ tự được đánh dấu hoàn thành để đồng bộ về danh sách ngày tập.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-900">Ghi chú</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={sessionNote}
                onChange={(event) => updateSessionNote(event.target.value)}
                rows={2}
                placeholder="Ghi chú ngắn..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              />

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Lịch sử</p>
                <div className="mt-2 space-y-2">
                  {visibleHistoryEntries.length ? (
                    visibleHistoryEntries.map((item) => (
                      <div
                        key={`${item.setIndex}-${item.updatedAt}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-700">No.{item.setIndex + 1}</p>
                          <p className="text-sm text-slate-600">{item.summary}</p>
                        </div>
                        <span className="text-xs text-slate-400">{formatHistoryTime(item.updatedAt)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm text-slate-500">
                      Chưa có dữ liệu lịch sử cho bài tập này.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

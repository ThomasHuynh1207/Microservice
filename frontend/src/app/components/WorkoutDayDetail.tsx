import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { getCurrentUser } from "../../services/authService";
import { translateExerciseName } from "../utils/workoutText";
import {
  fetchExerciseLibrary,
  fetchWorkoutPlanDetail,
  updateWorkoutPlanDetail,
  type ExerciseLibraryItem,
  type ExerciseTemplate,
  type WorkoutDayTemplate,
  type WorkoutPlanDetail,
} from "../../services/fitnessService";

type SetResult = {
  weight: string;
  reps: string;
};

const safeParseJson = <T,>(rawValue: string | null, fallback: T): T => {
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const formatDisplayLabel = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const resultsStorageKey = (userId: number, planId: number, dayOrder: number) => `workout-results:${userId}:${planId}:${dayOrder}`;
const completionStorageKey = (userId: number, planId: number, dayOrder: number) =>
  `workout-completion:${userId}:${planId}:${dayOrder}`;

const getExerciseKey = (exercise: ExerciseTemplate, index: number) => String(exercise.id ?? exercise.exerciseOrder ?? index + 1);

const isFilledSet = (setResult: SetResult) => Boolean(setResult.weight.trim() || setResult.reps.trim());

const sortByDayOrder = (days: WorkoutDayTemplate[]) => [...days].sort((left, right) => left.dayOrder - right.dayOrder);

const buildExerciseFromLibraryItem = (item: ExerciseLibraryItem, order: number): ExerciseTemplate => ({
  exerciseOrder: order,
  name: item.displayName,
  muscleGroup: item.muscleGroup,
  notes: item.guidance || item.highlight || "Bài tập từ thư viện.",
  setTemplates: [{ stepOrder: 1, sets: 3, reps: "10-12" }],
});

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1598971639058-a73c6fcf6ec8?auto=format&fit=crop&w=320&q=80";

const toThumbnailFromVideoUrl = (videoUrl?: string | null) => {
  const raw = (videoUrl || "").trim();
  if (!raw) {
    return FALLBACK_THUMBNAIL;
  }

  const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(normalized);
    if (url.hostname.includes("youtube.com")) {
      const id = url.searchParams.get("v") || url.pathname.match(/^\/shorts\/([^/?#]+)/i)?.[1] || url.pathname.split("/embed/")[1]?.split("/")[0];
      if (id) {
        return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
      }
    }

    if (url.hostname.includes("youtu.be")) {
      const id = url.pathname.replace("/", "");
      if (id) {
        return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
      }
    }

    if (/\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(url.pathname)) {
      return normalized;
    }
  } catch {
    return FALLBACK_THUMBNAIL;
  }

  return FALLBACK_THUMBNAIL;
};

const buildWorkoutExerciseDetailUrl = (
  planId: number,
  dayOrder: number,
  exerciseOrder: number,
  exerciseName: string
) => `/dashboard/workout/exercise/${planId}/${dayOrder}/${exerciseOrder}?name=${encodeURIComponent(exerciseName)}`;

const calculateDayProgress = (userId: number | undefined, planId: number | null, day: WorkoutDayTemplate) => {
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

const buildPlanTitle = (planDetail: WorkoutPlanDetail | null) => planDetail?.name?.trim() || "Gym";

export function WorkoutDayDetail() {
  const user = getCurrentUser();
  const params = useParams();
  const planId = Number(params.planId || 0);
  const dayOrder = Number(params.dayOrder || 0);

  const [planDetail, setPlanDetail] = useState<WorkoutPlanDetail | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryItems, setLibraryItems] = useState<ExerciseLibraryItem[]>([]);
  const [librarySearch, setLibrarySearch] = useState("");
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [exerciseLibraryMap, setExerciseLibraryMap] = useState<Record<string, ExerciseLibraryItem>>({});

  useEffect(() => {
    if (!planId) {
      setPlanDetail(null);
      return;
    }

    let cancelled = false;

    const loadPlanDetail = async () => {
      try {
        const detail = await fetchWorkoutPlanDetail(planId);
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
  }, [planId]);

  const days = useMemo(() => sortByDayOrder(planDetail?.days || []), [planDetail]);

  const selectedDay = useMemo(() => days.find((day) => day.dayOrder === dayOrder) || days[0] || null, [days, dayOrder]);

  const dayProgress = selectedDay ? calculateDayProgress(user?.id, planDetail?.id ?? planId, selectedDay) : 0;

  useEffect(() => {
    let cancelled = false;

    const loadExerciseLibraryMap = async () => {
      try {
        const items = await fetchExerciseLibrary();
        if (cancelled) {
          return;
        }

        const nextMap = items.reduce<Record<string, ExerciseLibraryItem>>((acc, item) => {
          acc[normalizeText(item.displayName)] = item;
          return acc;
        }, {});
        setExerciseLibraryMap(nextMap);
      } catch {
        if (!cancelled) {
          setExerciseLibraryMap({});
        }
      }
    };

    void loadExerciseLibraryMap();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLibraryItems = useMemo(() => {
    const query = normalizeText(librarySearch.trim());
    if (!query) {
      return libraryItems;
    }

    return libraryItems.filter((item) => {
      const haystack = normalizeText([item.displayName, item.muscleGroup, item.guidance, item.highlight, item.technicalNotes].filter(Boolean).join(" "));
      return haystack.includes(query);
    });
  }, [libraryItems, librarySearch]);

  const loadLibraryItems = async () => {
    if (isLoadingLibrary) {
      return;
    }

    setIsLoadingLibrary(true);

    try {
      const remoteItems = await fetchExerciseLibrary();
      setLibraryItems(remoteItems);
    } catch {
      setLibraryItems([]);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const openLibrary = () => {
    setLibrarySearch("");
    setLibraryOpen(true);
    void loadLibraryItems();
  };

  const addExerciseToDay = async (item: ExerciseLibraryItem) => {
    if (!planDetail || !selectedDay) {
      return;
    }

    const nextDays = days.map((day) => {
      if (day.dayOrder !== selectedDay.dayOrder) {
        return day;
      }

      return {
        ...day,
        exercises: [...day.exercises, buildExerciseFromLibraryItem(item, day.exercises.length + 1)],
      };
    });

    const nextDetail: WorkoutPlanDetail = {
      ...planDetail,
      days: nextDays,
    };

    setIsSaving(true);
    setStatus("");

    try {
      const savedPlan = await updateWorkoutPlanDetail(planId, nextDetail);
      setPlanDetail(savedPlan);
      setStatus(`Đã thêm ${translateExerciseName(item.displayName)} vào ${selectedDay.name}.`);
      setLibraryOpen(false);
    } catch {
      setStatus("Không thể thêm bài tập lúc này.");
    } finally {
      setIsSaving(false);
    }
  };

  const firstExercise = selectedDay?.exercises[0] || null;
  const startWorkoutUrl = selectedDay && firstExercise
    ? buildWorkoutExerciseDetailUrl(planId || (planDetail?.id ?? 0), selectedDay.dayOrder, firstExercise.exerciseOrder || 1, firstExercise.name)
    : "";

  return (
    <div className="mx-auto min-h-screen max-w-[1650px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <Card className="!rounded-3xl border-slate-200 bg-slate-50 shadow-sm">
        <CardContent className="p-5 sm:p-6 lg:p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <Link
                  to="/dashboard/workout"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Quay lại"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Workout Detail</p>
              </div>

              <h1 className="mt-3 truncate text-[2rem] font-semibold tracking-tight text-slate-900 sm:text-[2.2rem]">
                {selectedDay ? selectedDay.name : "Các bài tập"}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-2.5 text-sm text-slate-600">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium">{buildPlanTitle(planDetail)}</span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium">{days.length} ngày tập</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <div className="min-w-[94px] rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Tiến độ</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{dayProgress}%</p>
              </div>

              <Button
                type="button"
                onClick={openLibrary}
                disabled={!selectedDay || isSaving}
                className="h-12 rounded-xl bg-indigo-600 px-5 text-base font-semibold text-white transition hover:bg-indigo-700"
                aria-label="Thêm bài tập"
                title="Thêm bài tập"
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm bài tập
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="!rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-slate-900">Danh sách bài tập</CardTitle>
                <p className="mt-2 text-sm text-slate-500">Chạm vào từng bài để mở chi tiết hoặc thêm bài mới cho ngày này.</p>
              </div>

              <Badge variant="secondary" className="rounded-lg px-3 py-1.5 text-sm text-slate-700">
                {selectedDay?.exercises.length || 0} bài tập
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {selectedDay?.exercises.length ? (
              selectedDay.exercises.map((exercise, index) => {
                const exerciseOrder = exercise.exerciseOrder || index + 1;
                const to = buildWorkoutExerciseDetailUrl(planId || (planDetail?.id ?? 0), selectedDay.dayOrder, exerciseOrder, exercise.name);
                const libraryItem = exerciseLibraryMap[normalizeText(exercise.name)];
                const thumbnailSrc = toThumbnailFromVideoUrl(libraryItem?.videoUrl);

                return (
                  <Link
                    key={`${selectedDay.dayOrder}-${exerciseOrder}`}
                    to={to}
                    className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    <img
                      src={thumbnailSrc}
                      alt={`Thumbnail ${translateExerciseName(exercise.name)}`}
                      className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-slate-900">{translateExerciseName(exercise.name)}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDisplayLabel(exercise.muscleGroup, "Nhóm cơ tổng hợp")}</p>
                    </div>
                  </Link>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                Ngày này chưa có bài tập nào. Bấm nút thêm bài tập ở góc trên bên phải.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          {startWorkoutUrl ? (
            <Link
              to={startWorkoutUrl}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-cyan-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-600"
            >
              BẮT ĐẦU TẬP
            </Link>
          ) : (
            <Button type="button" disabled className="h-12 w-full !rounded-xl bg-slate-200 text-slate-500">
              BẮT ĐẦU TẬP
            </Button>
          )}
        </div>

        {status ? <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{status}</div> : null}
      </div>

      <Dialog
        open={libraryOpen}
        onOpenChange={(open) => {
          setLibraryOpen(open);
          if (!open) {
            setLibrarySearch("");
          }
        }}
      >
        <DialogContent className="max-h-[85vh] max-w-[min(1320px,calc(100vw-1rem))] !rounded-xl border-slate-200 bg-white p-0">
          <div className="flex h-[85vh] flex-col">
            <DialogHeader className="border-b border-slate-200 px-6 py-5 text-left">
              <DialogTitle className="text-2xl text-slate-900">Thêm bài tập</DialogTitle>
              <p className="mt-2 text-sm text-slate-500">{selectedDay ? `Thêm vào ${selectedDay.name}` : "Chọn ngày tập trước khi thêm bài."}</p>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={librarySearch}
                  onChange={(event) => setLibrarySearch(event.target.value)}
                  placeholder="Tìm bài tập, nhóm cơ hoặc mô tả..."
                  className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-11 text-sm"
                />
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isLoadingLibrary ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="h-5 w-2/3 rounded-xl bg-slate-200" />
                      <div className="mt-3 h-4 w-1/2 rounded-xl bg-slate-200" />
                      <div className="mt-4 h-16 rounded-xl bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : filteredLibraryItems.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredLibraryItems.map((item) => (
                    <article key={`${item.id || item.displayName}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-900">{translateExerciseName(item.displayName)}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatDisplayLabel(item.muscleGroup, "Nhóm cơ")}</p>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          onClick={() => void addExerciseToDay(item)}
                          disabled={!selectedDay || isSaving || !planDetail}
                          className="h-10 w-10 !rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">{item.guidance || item.highlight || "Bài tập hệ thống"}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
                  Không tìm thấy bài tập phù hợp.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

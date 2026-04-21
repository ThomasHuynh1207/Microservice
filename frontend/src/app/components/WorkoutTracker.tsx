import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  BookOpen,
  CalendarPlus,
  CheckCircle2,
  Dumbbell,
  Flame,
  LibraryBig,
  MessageSquareText,
  Plus,
  Save,
  Search,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { getCurrentUser } from "../../services/authService";
import api from "../../api/api";
import {
  endWorkoutSession,
  fetchExerciseLibrary,
  fetchWorkoutPlanDetail,
  fetchWorkoutPlans,
  saveProgress,
  startWorkoutSession,
  updateWorkoutPlanDetail,
  type ExerciseLibraryItem,
  type ExerciseTemplate,
  type WorkoutDayTemplate,
  type WorkoutPlanDetail,
  type WorkoutPlanSummary,
} from "../../services/fitnessService";

type SetResult = {
  weight: string;
  reps: string;
};

type ProfileSnapshot = {
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  onboardingGoal?: string;
  specificGoal?: string;
  activityLevel?: string;
};

type VisibleExercise = {
  exercise: ExerciseTemplate;
  index: number;
  exerciseKey: string;
  order: number;
  sets: SetResult[];
  setCount: number;
  trackedSets: number;
  volume: number;
  progressPercent: number;
  isDone: boolean;
};

type WorkoutMode = "training" | "builder";

const workoutLibraryCategories = [
  { label: "Tất cả", value: "" },
  { label: "Ngực", value: "Ngực" },
  { label: "Lưng", value: "Lưng" },
  { label: "Chân", value: "Chân" },
  { label: "Cơ mông", value: "Cơ mông" },
  { label: "Cơ delta", value: "Cơ delta" },
  { label: "Cơ tay trước", value: "Cơ tay trước" },
  { label: "Cơ tay sau", value: "Cơ tay sau" },
  { label: "Cẳng tay", value: "Cẳng tay" },
  { label: "Cơ bụng", value: "Cơ bụng" },
  { label: "Luyện tập chức năng", value: "Luyện tập chức năng" },
] as const;

const todayDayOrder = (() => {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
})();

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
    .replace(/[\u0300-\u036f]/g, "");

const formatClock = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const prettifyPlanName = (name?: string) => name?.trim() || "Kế hoạch tập";

const formatDisplayLabel = (value: string | undefined, fallback: string) => value?.trim() || fallback;

const getExerciseKey = (exercise: ExerciseTemplate, index: number) => String(exercise.id ?? exercise.exerciseOrder ?? index + 1);

const getSetCount = (exercise: ExerciseTemplate) =>
  exercise.setTemplates?.reduce((total, template) => total + Number(template.sets || 0), 0) || 0;

const buildEmptySetResults = (exercise: ExerciseTemplate): SetResult[] =>
  Array.from({ length: Math.max(1, getSetCount(exercise)) }, () => ({ weight: "", reps: "" }));

const isFilledSet = (set: SetResult) => Boolean(set.weight.trim() || set.reps.trim());

const calculateExerciseVolume = (sets: SetResult[]) =>
  sets.reduce((total, entry) => {
    const weight = Number(entry.weight);
    const reps = Number(entry.reps);
    if (Number.isNaN(weight) || Number.isNaN(reps)) return total;
    return total + weight * reps;
  }, 0);

const buildVideoSearchUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} tutorial`)}`;

const workoutResultsStorageKey = (userId: number, planId: number, dayOrder: number) => `workout-results:${userId}:${planId}:${dayOrder}`;
const completionStorageKey = (userId: number, planId: number, dayOrder: number) => `workout-completion:${userId}:${planId}:${dayOrder}`;
const sessionNotesStorageKey = (userId: number, planId: number, dayOrder: number) => `workout-notes:${userId}:${planId}:${dayOrder}`;

const buildSessionNotes = (
  day: WorkoutDayTemplate,
  results: Record<string, SetResult[]>,
  durationMinutes: number,
  totalVolume: number,
  note: string
) => {
  const completedExercises = day.exercises.filter((exercise, index) => {
    const exerciseKey = getExerciseKey(exercise, index);
    return (results[exerciseKey] || []).some(isFilledSet);
  }).length;

  const parts = [
    `${day.name}`,
    `${completedExercises}/${day.exercises.length} bài`,
    `Volume ${Math.round(totalVolume)}kg`,
    `${durationMinutes} phút`,
  ];

  if (note.trim()) {
    parts.push(note.trim());
  }

  return parts.join(" | ");
};

const sortByCreatedAtDesc = (plans: WorkoutPlanSummary[]) =>
  [...plans].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

const buildDefaultSetTemplate = () => [{ stepOrder: 1, sets: 3, reps: "10-12" }];

const defaultPlanDayName = (dayOrder: number) => `Ngày ${dayOrder}`;

const getDefaultRepsForLibraryItem = (item: ExerciseLibraryItem) => {
  const text = normalizeText(`${item.displayName} ${item.muscleGroup || ""}`);

  if (text.includes("plank") || text.includes("carry") || text.includes("hold") || text.includes("cẳng tay")) {
    return "30-45s";
  }

  if (text.includes("burpee") || text.includes("mountain climber") || text.includes("jump") || text.includes("cardio")) {
    return "12-15";
  }

  return "8-12";
};

const createExerciseFromLibraryItem = (item: ExerciseLibraryItem, order: number): ExerciseTemplate => ({
  exerciseOrder: order,
  name: item.displayName,
  muscleGroup: item.muscleGroup,
  notes: item.highlight || item.guidance || "Bài tập từ thư viện",
  setTemplates: buildDefaultSetTemplate().map((template) => ({ ...template, reps: getDefaultRepsForLibraryItem(item) })),
});

const normalizeWorkoutDays = (days: WorkoutDayTemplate[]) =>
  [...days]
    .sort((left, right) => left.dayOrder - right.dayOrder)
    .map((day, dayIndex) => ({
      ...day,
      dayOrder: dayIndex + 1,
      name: day.name?.trim() || defaultPlanDayName(dayIndex + 1),
      exercises: [...(day.exercises || [])].map((exercise, exerciseIndex) => ({
        ...exercise,
        exerciseOrder: exerciseIndex + 1,
        setTemplates: [...(exercise.setTemplates || [])].map((setTemplate, setIndex) => ({
          ...setTemplate,
          stepOrder: setIndex + 1,
          sets: Number(setTemplate.sets || 3),
          reps: setTemplate.reps?.trim() || "10-12",
        })),
      })),
    }));

const createNewWorkoutDay = (dayOrder: number): WorkoutDayTemplate => ({
  dayOrder,
  name: defaultPlanDayName(dayOrder),
  focus: "Tự tạo từ thư viện bài tập",
  notes: "Thêm bài tập từ thư viện rồi lưu lại để dùng như các app thực tế.",
  restBetweenDays: "Nghỉ theo cảm nhận",
  exercises: [],
});

const buildFallbackLibraryItem = (exercise: ExerciseTemplate): ExerciseLibraryItem => ({
  id: exercise.id,
  displayName: exercise.name,
  muscleGroup: exercise.muscleGroup,
  guidance: exercise.notes || "Bài tập có sẵn trong kế hoạch hiện tại.",
  highlight: "Có thể dùng tạm làm nguồn bài tập cho builder khi thư viện mẫu chưa có dữ liệu.",
  technicalNotes: "Giữ nhịp đều, kiểm soát biên độ và ưu tiên kỹ thuật trước khi tăng tải.",
  videoUrl: undefined,
});

const buildWorkoutExerciseDetailUrl = (
  planId: number,
  dayOrder: number,
  exerciseOrder: number,
  exerciseName: string
) => `/dashboard/workout/exercise/${planId}/${dayOrder}/${exerciseOrder}?name=${encodeURIComponent(exerciseName)}`;

const findLibraryItemByExerciseName = (items: ExerciseLibraryItem[], exerciseName: string) => {
  const normalizedExerciseName = normalizeText(exerciseName);

  return items.find((item) => {
    const normalizedItemName = normalizeText(item.displayName);
    return (
      normalizedItemName === normalizedExerciseName ||
      normalizedItemName.includes(normalizedExerciseName) ||
      normalizedExerciseName.includes(normalizedItemName)
    );
  }) || null;
};

export function WorkoutTracker() {
  const user = getCurrentUser();

  const [plans, setPlans] = useState<WorkoutPlanSummary[]>([]);
  const [days, setDays] = useState<WorkoutDayTemplate[]>([]);
  const [seedProfile, setSeedProfile] = useState<ProfileSnapshot>({});
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedDayOrder, setSelectedDayOrder] = useState<number>(todayDayOrder);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [completionMap, setCompletionMap] = useState<Record<string, boolean>>({});
  const [exerciseResults, setExerciseResults] = useState<Record<string, SetResult[]>>({});
  const [sessionNote, setSessionNote] = useState("");
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isSessionRunning, setIsSessionRunning] = useState(false);
  const [planDetail, setPlanDetail] = useState<WorkoutPlanDetail | null>(null);
  const [activeMode, setActiveMode] = useState<WorkoutMode>("training");
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [libraryItems, setLibraryItems] = useState<ExerciseLibraryItem[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(false);
  const [libraryDialogOpen, setLibraryDialogOpen] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<(typeof workoutLibraryCategories)[number]["value"]>("");
  const [libraryTargetDayOrder, setLibraryTargetDayOrder] = useState<number | null>(null);

  const workoutSectionRef = useRef<HTMLDivElement | null>(null);

  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlanId) || null,
    [plans, selectedPlanId]
  );

  const selectedDay = useMemo(
    () => days.find((day) => day.dayOrder === selectedDayOrder) || days[0] || null,
    [days, selectedDayOrder]
  );

  const sortedPlans = useMemo(() => sortByCreatedAtDesc(plans), [plans]);

  const builderSummary = useMemo(() => {
    const totalExercises = days.reduce((sum, day) => sum + day.exercises.length, 0);
    const totalSets = days.reduce(
      (sum, day) => sum + day.exercises.reduce((exerciseSum, exercise) => exerciseSum + Math.max(1, getSetCount(exercise)), 0),
      0
    );

    return {
      totalDays: days.length,
      totalExercises,
      totalSets,
    };
  }, [days]);

  const filteredLibraryItems = useMemo(() => {
    const query = normalizeText(librarySearch.trim());
    const activeCategory = libraryCategory.trim();

    return libraryItems.filter((item) => {
      const haystack = normalizeText([item.displayName, item.muscleGroup, item.highlight, item.guidance].filter(Boolean).join(" "));
      const muscleGroup = normalizeText(item.muscleGroup || "");
      const categoryMatch = !activeCategory || muscleGroup.includes(normalizeText(activeCategory));

      if (!categoryMatch) {
        return false;
      }

      if (!query) {
        return true;
      }

      return haystack.includes(query);
    });
  }, [libraryItems, librarySearch, libraryCategory]);

  const fetchLibraryItems = async (forceFallback = false) => {
    if (isLibraryLoading || (libraryItems.length && !forceFallback)) {
      return;
    }

    setIsLibraryLoading(true);

    try {
      const remoteItems = await fetchExerciseLibrary();
      if (remoteItems.length) {
        setLibraryItems(remoteItems);
        return;
      }

      const fallbackItems = days.flatMap((day) => day.exercises.map((exercise) => buildFallbackLibraryItem(exercise)));
      setLibraryItems(fallbackItems);
    } catch (error) {
      console.error(error);
      const fallbackItems = days.flatMap((day) => day.exercises.map((exercise) => buildFallbackLibraryItem(exercise)));
      setLibraryItems(fallbackItems);
    } finally {
      setIsLibraryLoading(false);
    }
  };

  const persistPlanDetail = async (nextDays: WorkoutDayTemplate[]) => {
    if (!selectedPlanId || !planDetail) {
      return;
    }

    const normalizedDays = normalizeWorkoutDays(nextDays);
    const payload: WorkoutPlanDetail = {
      ...planDetail,
      days: normalizedDays,
      totalDaysPerWeek: normalizedDays.length,
    };

    setIsSavingPlan(true);

    try {
      const savedPlan = await updateWorkoutPlanDetail(selectedPlanId, payload);
      const savedDays = normalizeWorkoutDays(savedPlan.days || []);
      setPlanDetail(savedPlan);
      setDays(savedDays);

      if (!savedDays.some((day) => day.dayOrder === selectedDayOrder)) {
        setSelectedDayOrder(savedDays[0]?.dayOrder || todayDayOrder);
      }

      setStatus("Đã lưu thay đổi kế hoạch tập.");
    } catch (error) {
      console.error(error);
      setStatus("Không thể lưu thay đổi kế hoạch lúc này.");
    } finally {
      setIsSavingPlan(false);
    }
  };

  const openBuilderMode = () => {
    setActiveMode("builder");
    setStatus("");
    void fetchLibraryItems();
  };

  const openLibraryForDay = (dayOrder: number) => {
    setLibraryTargetDayOrder(dayOrder);
    setLibrarySearch("");
    setLibraryCategory("");
    setLibraryDialogOpen(true);
    setActiveMode("builder");
    void fetchLibraryItems();
  };

  const addWorkoutDay = () => {
    const nextDayOrder = (days[days.length - 1]?.dayOrder || 0) + 1;
    const nextDays = normalizeWorkoutDays([...days, createNewWorkoutDay(nextDayOrder)]);
    setDays(nextDays);
    setSelectedDayOrder(nextDayOrder);
    setActiveMode("builder");
    void persistPlanDetail(nextDays);
  };

  const removeWorkoutDay = (dayOrder: number) => {
    if (days.length <= 1) {
      setStatus("Kế hoạch cần ít nhất một ngày tập.");
      return;
    }

    const nextDays = normalizeWorkoutDays(days.filter((day) => day.dayOrder !== dayOrder));
    const nextSelectedDayOrder = nextDays.find((day) => day.dayOrder === selectedDayOrder)?.dayOrder || nextDays[0]?.dayOrder || todayDayOrder;

    setDays(nextDays);
    setSelectedDayOrder(nextSelectedDayOrder);
    setActiveMode("builder");
    void persistPlanDetail(nextDays);
  };

  const addExerciseToDay = (dayOrder: number, item: ExerciseLibraryItem) => {
    const nextDays = normalizeWorkoutDays(
      days.map((day) =>
        day.dayOrder === dayOrder
          ? {
              ...day,
              exercises: [...day.exercises, createExerciseFromLibraryItem(item, day.exercises.length + 1)],
            }
          : day
      )
    );

    setDays(nextDays);
    setSelectedDayOrder(dayOrder);
    setLibraryDialogOpen(false);
    setActiveMode("builder");
    setStatus(`Đã thêm ${item.displayName} vào ${defaultPlanDayName(dayOrder)}.`);
    void persistPlanDetail(nextDays);
  };

  const removeExerciseFromDay = (dayOrder: number, exerciseOrder: number) => {
    const nextDays = normalizeWorkoutDays(
      days.map((day) =>
        day.dayOrder === dayOrder
          ? {
              ...day,
              exercises: day.exercises.filter((exercise) => exercise.exerciseOrder !== exerciseOrder),
            }
          : day
      )
    );

    setDays(nextDays);
    setSelectedDayOrder(dayOrder);
    setActiveMode("builder");
    void persistPlanDetail(nextDays);
  };

  const fetchProfileSnapshot = async () => {
    if (!user) return {} as ProfileSnapshot;

    const response = await api.get<ProfileSnapshot>(`/users/${user.id}/profile`).catch(() => ({ data: {} as ProfileSnapshot }));
    const profile = response.data || ({} as ProfileSnapshot);
    setSeedProfile(profile);
    return profile;
  };

  const persistResultsForDay = (nextResults: Record<string, SetResult[]>) => {
    if (!user || !selectedPlanId || !selectedDay) return;
    localStorage.setItem(workoutResultsStorageKey(user.id, selectedPlanId, selectedDay.dayOrder), JSON.stringify(nextResults));
  };

  const persistCompletionForDay = (nextCompletion: Record<string, boolean>) => {
    if (!user || !selectedPlanId || !selectedDay) return;
    localStorage.setItem(completionStorageKey(user.id, selectedPlanId, selectedDay.dayOrder), JSON.stringify(nextCompletion));
  };

  const persistSessionNoteForDay = (nextNote: string) => {
    if (!user || !selectedPlanId || !selectedDay) return;

    if (nextNote.trim()) {
      localStorage.setItem(sessionNotesStorageKey(user.id, selectedPlanId, selectedDay.dayOrder), nextNote);
      return;
    }

    localStorage.removeItem(sessionNotesStorageKey(user.id, selectedPlanId, selectedDay.dayOrder));
  };

  const loadWorkoutData = async () => {
    if (!user) {
      setStatus("Vui lòng đăng nhập để xem kế hoạch tập.");
      return;
    }

    setIsLoading(true);
    setStatus("");

    try {
      await fetchProfileSnapshot();
      const planList = await fetchWorkoutPlans(user.id);
      const sortedPlanList = sortByCreatedAtDesc(planList);
      setPlans(sortedPlanList);

      const nextPlanId = sortedPlanList.some((item) => item.id === selectedPlanId)
        ? selectedPlanId
        : sortedPlanList[0]?.id ?? null;

      setSelectedPlanId(nextPlanId);

      if (nextPlanId) {
        const detail = await fetchWorkoutPlanDetail(nextPlanId);
        const nextDays = normalizeWorkoutDays(detail.days || []);
        setPlanDetail(detail);
        setDays(nextDays);

        const nextDay = nextDays.find((day) => day.dayOrder === todayDayOrder) || nextDays[0] || null;
        setSelectedDayOrder(nextDay?.dayOrder || 1);
      } else {
        setPlanDetail(null);
        setDays([]);
        setSelectedDayOrder(todayDayOrder);
      }
    } catch (error) {
      console.error(error);
      setStatus("Không thể tải kế hoạch tập lúc này.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkoutData();
  }, []);

  useEffect(() => {
    void fetchLibraryItems();
  }, []);

  useEffect(() => {
    if (!user || !selectedPlanId || !selectedDay) {
      setCompletionMap({});
      setExerciseResults({});
      setSessionNote("");
      return;
    }

    try {
      const storedResults = safeParseJson<Record<string, SetResult[]>>(
        localStorage.getItem(workoutResultsStorageKey(user.id, selectedPlanId, selectedDay.dayOrder)),
        {}
      );
      const storedCompletion = safeParseJson<Record<string, boolean>>(
        localStorage.getItem(completionStorageKey(user.id, selectedPlanId, selectedDay.dayOrder)),
        {}
      );
      const storedNote = localStorage.getItem(sessionNotesStorageKey(user.id, selectedPlanId, selectedDay.dayOrder)) || "";

      setSessionNote(storedNote);

      const normalizedResults = selectedDay.exercises.reduce((accumulator, exercise, index) => {
        const exerciseKey = getExerciseKey(exercise, index);
        const expectedCount = Math.max(1, getSetCount(exercise));
        const existingSets = storedResults[exerciseKey] || storedResults[exercise.name] || [];

        accumulator[exerciseKey] = Array.from({ length: expectedCount }, (_, setIndex) => {
          const current = existingSets[setIndex];
          return {
            weight: current?.weight || "",
            reps: current?.reps || "",
          };
        });

        return accumulator;
      }, {} as Record<string, SetResult[]>);

      const normalizedCompletion = selectedDay.exercises.reduce((accumulator, exercise, index) => {
        const exerciseKey = getExerciseKey(exercise, index);
        accumulator[exerciseKey] = Boolean(storedCompletion[exerciseKey] ?? storedCompletion[exercise.name]);
        return accumulator;
      }, {} as Record<string, boolean>);

      setCompletionMap(normalizedCompletion);
      setExerciseResults(normalizedResults);
    } catch {
      setSessionNote("");
      setCompletionMap({});
      setExerciseResults({});
    }
  }, [user, selectedPlanId, selectedDay]);

  useEffect(() => {
    if (!isSessionRunning) return;

    const timerId = window.setInterval(() => {
      setSessionSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [isSessionRunning]);

  const selectedDayCompletionPercent = useMemo(() => {
    if (!selectedDay || !selectedDay.exercises.length) return 0;

    const completedExercises = selectedDay.exercises.reduce((total, exercise, index) => {
      const exerciseKey = getExerciseKey(exercise, index);
      return total + Number(Boolean(completionMap[exerciseKey]));
    }, 0);

    return Math.round((completedExercises / selectedDay.exercises.length) * 100);
  }, [selectedDay, completionMap]);

  const visibleExercises = useMemo<VisibleExercise[]>(() => {
    if (!selectedDay) return [];

    const query = normalizeText(exerciseSearch.trim());

    return selectedDay.exercises
      .map((exercise, index) => {
        const exerciseKey = getExerciseKey(exercise, index);
        const setCount = Math.max(1, getSetCount(exercise));
        const sets = exerciseResults[exerciseKey] || buildEmptySetResults(exercise);
        const trackedSets = sets.filter(isFilledSet).length;
        const volume = calculateExerciseVolume(sets);
        const progressPercent = Math.max(0, Math.min(100, Math.round((trackedSets / setCount) * 100)));
        const order = exercise.exerciseOrder || index + 1;
        const isDone = Boolean(completionMap[exerciseKey]);

        return {
          exercise,
          index,
          exerciseKey,
          order,
          sets,
          setCount,
          trackedSets,
          volume,
          progressPercent,
          isDone,
        };
      })
      .filter((item) => {
        if (showIncompleteOnly && item.isDone) return false;
        if (!query) return true;

        const haystack = normalizeText(
          [item.exercise.name, item.exercise.muscleGroup, item.exercise.notes].filter(Boolean).join(" ")
        );

        return haystack.includes(query);
      });
  }, [selectedDay, exerciseSearch, showIncompleteOnly, completionMap, exerciseResults]);

  const sessionSummary = useMemo(() => {
    if (!selectedDay) {
      return {
        totalExercises: 0,
        completedExercises: 0,
        trackedSets: 0,
        totalVolume: 0,
        durationMinutes: 0,
        caloriesBurned: 0,
      };
    }

    let totalVolume = 0;
    let trackedSets = 0;
    let completedExercises = 0;

    selectedDay.exercises.forEach((exercise, index) => {
      const exerciseKey = getExerciseKey(exercise, index);
      const sets = exerciseResults[exerciseKey] || buildEmptySetResults(exercise);
      totalVolume += calculateExerciseVolume(sets);
      trackedSets += sets.filter(isFilledSet).length;
      completedExercises += Number(Boolean(completionMap[exerciseKey]));
    });

    const durationMinutes = Math.max(1, Math.round(sessionSeconds / 60) || 0);
    const caloriesBurned = Math.round(durationMinutes * 5 + totalVolume / 18 + trackedSets * 2);

    return {
      totalExercises: selectedDay.exercises.length,
      completedExercises,
      trackedSets,
      totalVolume,
      durationMinutes,
      caloriesBurned,
    };
  }, [selectedDay, completionMap, exerciseResults, sessionSeconds]);

  const handleSwitchPlan = async (planId: number) => {
    setSelectedPlanId(planId);
    setExerciseSearch("");
    setShowIncompleteOnly(false);
    setStatus("");
    setCompletionMap({});
    setExerciseResults({});
    setSessionNote("");
    setSessionSeconds(0);
    setIsSessionRunning(false);
    setLibraryDialogOpen(false);
    setLibraryTargetDayOrder(null);

    try {
      const detail = await fetchWorkoutPlanDetail(planId);
      const nextDays = normalizeWorkoutDays(detail.days || []);
      setPlanDetail(detail);
      setDays(nextDays);
      const nextDay = nextDays.find((day) => day.dayOrder === todayDayOrder) || nextDays[0] || null;
      setSelectedDayOrder(nextDay?.dayOrder || 1);
    } catch {
      setStatus("Không thể tải chi tiết kế hoạch này.");
    }
  };

  const selectTodayWorkout = () => {
    if (!days.length) {
      setStatus("Kế hoạch hiện tại chưa có ngày tập.");
      return;
    }

    setActiveMode("training");
    const nextDay = days.find((day) => day.dayOrder === todayDayOrder) || days[0];
    setSelectedDayOrder(nextDay.dayOrder);

    const exercisePreview = nextDay.exercises.slice(0, 3).map((exercise) => exercise.name).join(", ");
    const suffix = nextDay.exercises.length > 3 ? "..." : "";
    setStatus(`Hôm nay: ${nextDay.name}. Bài chính: ${exercisePreview}${suffix}`);

    window.requestAnimationFrame(() => {
      workoutSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const updateSetResult = (exerciseKey: string, setIndex: number, field: keyof SetResult, value: string) => {
    setExerciseResults((current) => {
      const exercise = selectedDay?.exercises.find((item, index) => getExerciseKey(item, index) === exerciseKey || item.name === exerciseKey);
      const currentSets = current[exerciseKey] || (exercise ? buildEmptySetResults(exercise) : []);

      const nextSets = currentSets.map((entry, index) =>
        index === setIndex
          ? {
              ...entry,
              [field]: value,
            }
          : entry
      );

      const next = {
        ...current,
        [exerciseKey]: nextSets,
      };

      persistResultsForDay(next);
      return next;
    });
  };

  const addExerciseSet = (exerciseKey: string) => {
    setExerciseResults((current) => {
      const exercise = selectedDay?.exercises.find((item, index) => getExerciseKey(item, index) === exerciseKey || item.name === exerciseKey);
      if (!exercise) return current;

      const currentSets = current[exerciseKey] || buildEmptySetResults(exercise);
      const next = {
        ...current,
        [exerciseKey]: [...currentSets, { weight: "", reps: "" }],
      };

      persistResultsForDay(next);
      return next;
    });
  };

  const removeExerciseSet = (exerciseKey: string, setIndex: number) => {
    setExerciseResults((current) => {
      const exercise = selectedDay?.exercises.find((item, index) => getExerciseKey(item, index) === exerciseKey || item.name === exerciseKey);
      if (!exercise) return current;

      const currentSets = current[exerciseKey] || buildEmptySetResults(exercise);
      if (currentSets.length <= 1) return current;

      const nextSets = currentSets.filter((_, index) => index !== setIndex);
      const next = {
        ...current,
        [exerciseKey]: nextSets,
      };

      persistResultsForDay(next);
      return next;
    });
  };

  const updateSessionNote = (value: string) => {
    setSessionNote(value);
    persistSessionNoteForDay(value);
  };

  const toggleExerciseDone = (exerciseKey: string) => {
    if (!user || !selectedPlanId || !selectedDay) return;

    setCompletionMap((current) => {
      const next = {
        ...current,
        [exerciseKey]: !current[exerciseKey],
      };

      persistCompletionForDay(next);
      return next;
    });
  };

  const toggleSessionTimer = () => {
    setIsSessionRunning((current) => !current);
  };

  const resetSessionTimer = () => {
    setIsSessionRunning(false);
    setSessionSeconds(0);
  };

  const finishWorkoutSession = async () => {
    if (!user || !selectedPlanId || !selectedDay) return;

    if (!sessionSummary.trackedSets) {
      setStatus("Hãy nhập ít nhất 1 kết quả set trước khi lưu buổi tập.");
      return;
    }

    setIsSaving(true);
    setStatus("");

    try {
      const started = await startWorkoutSession(user.id, selectedPlanId, `Ngày ${selectedDay.dayOrder}`);
      const sessionId = started.id;
      const durationMinutes = Math.max(1, Math.round(sessionSeconds / 60) || sessionSummary.durationMinutes || 1);
      const notes = buildSessionNotes(selectedDay, exerciseResults, durationMinutes, sessionSummary.totalVolume, sessionNote);

      await endWorkoutSession(sessionId);
      await saveProgress(null, user.id, {
        workoutMinutes: durationMinutes,
        activityType: selectedDay.name,
        notes: `Volume ${Math.round(sessionSummary.totalVolume)}kg | ${notes}`,
      });

      setIsSessionRunning(false);
      setSessionSeconds(0);
      setStatus("Đã lưu buổi tập và tiến độ tổng.");
    } catch (error) {
      console.error(error);
      setStatus("Lưu buổi tập thất bại, vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6">
      <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_42%,#334155_100%)] text-white shadow-[0_30px_80px_-42px_rgba(15,23,42,0.95)]">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative px-6 py-7 sm:px-8 sm:py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.24),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.16),transparent_32%)]" />
            <div className="relative space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-300">
                    <Dumbbell className="h-4 w-4" />
                    <span>Tập luyện cá nhân</span>
                  </div>
                  <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {activeMode === "training" ? "Bảng điều khiển buổi tập" : "Tự tạo buổi tập"}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    {activeMode === "training"
                      ? "Theo dõi buổi tập, ghi set/reps và mở hướng dẫn ngay trên từng bài tập như các app thực tế."
                      : "Thêm ngày tập, chọn bài từ thư viện và lưu lại plan để dùng lâu dài."}
                  </p>
                </div>
                <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">
                  {prettifyPlanName(selectedPlan?.name)}
                </Badge>
              </div>

              <div className="max-w-3xl rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Kế hoạch hiện tại</p>
                    <p className="mt-1 text-sm text-slate-300">Chọn plan để giữ set, reps và tiến độ của bạn đồng bộ.</p>
                  </div>
                  <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">
                    {sortedPlans.length} kế hoạch
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Select
                    value={selectedPlanId ? String(selectedPlanId) : ""}
                    onValueChange={(value) => {
                      if (!value) return;
                      void handleSwitchPlan(Number(value));
                    }}
                    disabled={!sortedPlans.length || isLoading}
                  >
                    <SelectTrigger className="h-11 min-w-[260px] flex-1 rounded-2xl border-white/15 bg-white text-slate-900 shadow-sm">
                      <SelectValue placeholder={sortedPlans.length ? "Chọn kế hoạch" : "Chưa có kế hoạch"} />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedPlans.map((plan) => (
                        <SelectItem key={plan.id} value={String(plan.id)}>
                          {prettifyPlanName(plan.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={selectTodayWorkout}
                    disabled={!days.length || isLoading}
                    className="border-white/15 bg-white text-slate-900 hover:bg-slate-100"
                  >
                    Tập hôm nay
                  </Button>

                  <Button
                    type="button"
                    variant={activeMode === "builder" ? "secondary" : "outline"}
                    onClick={activeMode === "builder" ? () => setActiveMode("training") : openBuilderMode}
                    disabled={!days.length}
                    className={activeMode === "builder" ? "bg-white text-slate-900 hover:bg-slate-100" : "border-white/15 bg-white/10 text-white hover:bg-white/20"}
                  >
                    <BookOpen className="h-4 w-4" />
                    {activeMode === "builder" ? "Quay lại buổi tập" : "Tự tạo bài tập"}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {activeMode === "training" ? (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Ngày tập</p>
                      <p className="mt-2 text-sm font-semibold text-white">{selectedDay ? `Ngày ${selectedDay.dayOrder}` : "Chưa chọn"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Tiến độ ngày</p>
                      <p className="mt-2 text-sm font-semibold text-white">{selectedDayCompletionPercent}% hoàn thành</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Bài đang hiển thị</p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {visibleExercises.length}/{selectedDay?.exercises.length || 0}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <CalendarPlus className="h-4 w-4" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Ngày trong plan</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">{builderSummary.totalDays} ngày</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Target className="h-4 w-4" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Bài tập</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">{builderSummary.totalExercises} bài</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <LibraryBig className="h-4 w-4" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Set cấu trúc</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">{builderSummary.totalSets} set gốc</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/8 px-6 py-6 backdrop-blur lg:border-l lg:border-t-0">
            {activeMode === "training" ? (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Màn chi tiết</p>
                    <p className="mt-1 text-sm text-slate-300">Bấm vào từng bài để mở timer, video và hướng dẫn riêng.</p>
                  </div>
                  <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">
                    {selectedDay ? `Ngày ${selectedDay.dayOrder}` : "Chưa chọn"}
                  </Badge>
                </div>

                <div className="mt-4 rounded-[28px] border border-white/10 bg-slate-950/35 p-5 shadow-[0_20px_50px_-30px_rgba(2,6,23,0.8)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ngày đang chọn</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{selectedDay?.name || "Chưa có ngày tập"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedDay
                      ? `${selectedDay.exercises.length} bài tập • ${selectedDayCompletionPercent}% hoàn thành`
                      : "Hãy chọn một ngày để xem danh sách bài tập phía dưới."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">Bài trong ngày</p>
                      <p className="mt-2 text-2xl font-semibold text-white">{visibleExercises.length}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Flame className="h-4 w-4" />
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]">Gợi ý</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white">Chọn bài tập để mở màn chi tiết riêng có timer và video.</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Trình tạo plan</p>
                    <p className="mt-1 text-sm text-slate-300">Lưu tự động khi thêm, xóa hoặc đổi bài tập.</p>
                  </div>
                  <Badge variant="secondary" className="border-white/20 bg-white/15 text-white">
                    {isSavingPlan ? "Đang lưu" : "Auto-save"}
                  </Badge>
                </div>

                <div className="mt-4 rounded-[28px] border border-white/10 bg-slate-950/35 p-5 shadow-[0_20px_50px_-30px_rgba(2,6,23,0.8)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Ngày đang sửa</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{selectedDay ? defaultPlanDayName(selectedDay.dayOrder) : "Chưa có ngày"}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {selectedDay?.focus || "Chọn ngày hoặc thêm ngày mới để bắt đầu thiết kế buổi tập."}
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      onClick={addWorkoutDay}
                      className="border-white/15 bg-white text-slate-900 hover:bg-slate-100"
                    >
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Thêm ngày
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => (selectedDay ? openLibraryForDay(selectedDay.dayOrder) : undefined)}
                      disabled={!selectedDay}
                      className="border-white/15 bg-white/10 text-white hover:bg-white/20"
                    >
                      <LibraryBig className="mr-2 h-4 w-4" />
                      Thêm bài
                    </Button>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void persistPlanDetail(days)}
                      disabled={isSavingPlan || !days.length}
                      className="border-white/15 bg-white/10 text-white hover:bg-white/20"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Lưu nhanh
                    </Button>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-xs leading-5 text-slate-300">
                      Các thay đổi plan sẽ được ghi thẳng vào database để đồng bộ giữa các lần đăng nhập.
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {status ? <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{status}</div> : null}

      {activeMode === "training" ? (
        <section className="rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-[0_18px_50px_-35px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={exerciseSearch}
                    onChange={(event) => setExerciseSearch(event.target.value)}
                    placeholder="Tìm bài, nhóm cơ hoặc ghi chú"
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIncompleteOnly((current) => !current)}
                  className={
                    showIncompleteOnly
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }
                >
                  {showIncompleteOnly ? "Đang lọc bài chưa xong" : "Chỉ hiện bài chưa hoàn thành"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setExerciseSearch("");
                    setShowIncompleteOnly(false);
                  }}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {selectedDay
                  ? `Ngày đang tập: ${selectedDay.name}. Chạm vào tiêu đề bài tập để xem hướng dẫn ngay trong màn hình này.`
                  : "Chọn một ngày tập để bắt đầu ghi kết quả."}
              </div>

              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day.dayOrder}
                    type="button"
                    onClick={() => setSelectedDayOrder(day.dayOrder)}
                    className={`min-w-[120px] rounded-xl border px-4 py-2 text-left text-sm font-medium transition ${
                      day.dayOrder === selectedDayOrder
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-[11px] uppercase tracking-[0.18em] opacity-70">Ngày {day.dayOrder}</span>
                    <span className="mt-1 block text-sm font-semibold">{day.name}</span>
                  </button>
                ))}

                <Badge variant="secondary" className="self-center">
                  Hôm nay: ngày {todayDayOrder}
                </Badge>
              </div>

              {selectedDay ? (
                <Card className="rounded-3xl border-slate-200">
                  <CardHeader className="pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-slate-900">{selectedDay.name}</CardTitle>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDisplayLabel(selectedDay.focus, "Tập luyện theo kế hoạch cá nhân")} • {prettifyPlanName(selectedPlan?.name)}
                        </p>
                      </div>
                      <Badge variant="secondary">{formatDisplayLabel(selectedDay.restBetweenDays, "Nghỉ theo trạng thái cơ thể")}</Badge>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{ width: `${selectedDayCompletionPercent}%` }}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid gap-3">
                        {visibleExercises.length ? (
                          visibleExercises.map(({ exercise, exerciseKey, order, setCount, trackedSets, volume, isDone }) => {
                            const libraryItem = findLibraryItemByExerciseName(libraryItems, exercise.name);
                            const guidancePreview = libraryItem?.guidance || exercise.notes || "Bấm mở chi tiết để xem timer, video và hướng dẫn.";
                            const exerciseOrder = exercise.exerciseOrder || order;

                            return (
                              <article
                                key={`${selectedDay.dayOrder}-${exerciseKey}-${order}`}
                                className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                                  isDone ? "border-emerald-200 ring-1 ring-emerald-100" : "border-slate-200"
                                }`}
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="truncate text-base font-semibold text-slate-900">{exercise.name}</p>
                                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                                        {formatDisplayLabel(exercise.muscleGroup, "Nhóm cơ tổng hợp")}
                                      </Badge>
                                      {isDone ? (
                                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Đã hoàn thành</Badge>
                                      ) : (
                                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                          Chưa hoàn thành
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{guidancePreview}</p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="outline"
                                      onClick={() => removeExerciseFromDay(selectedDay.dayOrder, exerciseOrder)}
                                      className="border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>

                                    <Link
                                      to={buildWorkoutExerciseDetailUrl(
                                        selectedPlanId || 0,
                                        selectedDay.dayOrder,
                                        exerciseOrder,
                                        exercise.name
                                      )}
                                      className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                    >
                                      Mở chi tiết
                                      <ArrowRight className="h-4 w-4" />
                                    </Link>
                                  </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                                  <span className="rounded-full bg-slate-100 px-3 py-1.5">{setCount} set</span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Đã ghi {trackedSets}/{setCount} set</span>
                                  <span className="rounded-full bg-slate-100 px-3 py-1.5">Volume {Math.round(volume)} kg</span>
                                </div>
                              </article>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                            Không có bài tập nào khớp với bộ lọc hiện tại. Hãy xoá bộ lọc hoặc thử tìm bằng từ khoá khác.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-3xl border-slate-200">
                  <CardContent className="px-6 py-10 text-center text-sm text-slate-500">Chưa có ngày tập trong kế hoạch hiện tại.</CardContent>
                </Card>
              )}
            </div>

            <Card className="rounded-3xl border-slate-200 bg-slate-50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <MessageSquareText className="h-4 w-4 text-indigo-600" />
                  <div>
                    <CardTitle className="text-sm">Ghi chú buổi tập</CardTitle>
                    <p className="text-xs text-slate-500">Ghi ngắn thôi, tự lưu cùng progress.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <textarea
                  value={sessionNote}
                  onChange={(event) => updateSessionNote(event.target.value)}
                  placeholder="Cảm nhận buổi tập, mức năng lượng, lưu ý nhanh..."
                  className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                />
                <p className="mt-2 text-xs leading-6 text-slate-500">Ghi chú này sẽ được đính kèm khi lưu tiến độ buổi tập.</p>
              </CardContent>
            </Card>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-slate-900">Ngày tập</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">Chọn ngày để thêm bài từ thư viện.</p>
                  </div>
                  <Button type="button" onClick={addWorkoutDay} className="bg-slate-900 text-white hover:bg-slate-800">
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Thêm ngày
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {days.map((day) => {
                  const isSelected = day.dayOrder === selectedDayOrder;

                  return (
                    <div
                      key={day.dayOrder}
                      className={`rounded-2xl border p-3 transition ${
                        isSelected ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedDayOrder(day.dayOrder)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="text-sm font-semibold text-slate-900">{day.name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {formatDisplayLabel(day.focus, "Tự tạo plan")}
                            {day.exercises.length ? ` • ${day.exercises.length} bài` : " • Chưa có bài"}
                          </p>
                        </button>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => openLibraryForDay(day.dayOrder)}
                            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => removeWorkoutDay(day.dayOrder)}
                            disabled={days.length <= 1}
                            className="border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-slate-900">{selectedDay ? selectedDay.name : "Ngày tập"}</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedDay ? `${formatDisplayLabel(selectedDay.focus, "Tập luyện theo plan")}` : "Chưa chọn ngày nào"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{selectedDay?.exercises.length || 0} bài</Badge>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                      {selectedDay ? defaultPlanDayName(selectedDay.dayOrder) : "Ngày trống"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDay ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Ghi chú ngày</p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {selectedDay.notes || "Bấm vào từng bài tập để mở timer, video, hướng dẫn và set/rep/kg."}
                          </p>
                        </div>
                        <Button type="button" onClick={() => openLibraryForDay(selectedDay.dayOrder)} className="bg-slate-900 text-white hover:bg-slate-800">
                          <LibraryBig className="mr-2 h-4 w-4" />
                          Thêm bài tập
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3">
                      {selectedDay.exercises.length ? (
                        selectedDay.exercises.map((exercise, index) => {
                          const exerciseOrder = exercise.exerciseOrder || index + 1;
                          const libraryItem = findLibraryItemByExerciseName(libraryItems, exercise.name);
                          const guidancePreview = libraryItem?.guidance || exercise.notes || "Chọn bài để xem timer, video và hướng dẫn chi tiết.";

                          return (
                            <div key={`${selectedDay.dayOrder}-${exerciseOrder}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-900">{exercise.name}</p>
                                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                                      {formatDisplayLabel(exercise.muscleGroup, "Nhóm cơ")}
                                    </Badge>
                                    <Badge variant="outline" className="border-slate-200 bg-white text-slate-600">
                                      {exercise.setTemplates?.[0]?.sets || 3} set • {exercise.setTemplates?.[0]?.reps || "10-12"}
                                    </Badge>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-500">{guidancePreview}</p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="outline"
                                    onClick={() => removeExerciseFromDay(selectedDay.dayOrder, exerciseOrder)}
                                    className="border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>

                                  <Link
                                    to={buildWorkoutExerciseDetailUrl(
                                      selectedPlanId || 0,
                                      selectedDay.dayOrder,
                                      exerciseOrder,
                                      exercise.name
                                    )}
                                    className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                                  >
                                    Mở chi tiết
                                    <ArrowRight className="h-4 w-4" />
                                  </Link>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                                <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{exercise.setTemplates?.[0]?.sets || 3} set</span>
                                <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{exercise.setTemplates?.[0]?.reps || "10-12"}</span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-8 text-sm text-slate-500">
                          Chưa có bài tập nào cho ngày này. Bấm “Thêm bài tập” để mở thư viện.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
                    Chưa có ngày tập trong kế hoạch hiện tại.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <Dialog
        open={libraryDialogOpen}
        onOpenChange={(open) => {
          setLibraryDialogOpen(open);
          if (!open) {
            setLibraryTargetDayOrder(null);
          }
        }}
      >
        <DialogContent className="max-w-[min(1180px,calc(100vw-1rem))] overflow-hidden rounded-[32px] border-slate-200 p-0">
          <div className="flex h-[min(90vh,900px)] flex-col bg-slate-50">
            <DialogHeader className="border-b border-slate-200 px-6 py-5 text-left">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-2xl text-slate-900">Thư viện bài tập</DialogTitle>
                  <p className="mt-2 text-sm text-slate-500">
                    Thêm vào {libraryTargetDayOrder ? defaultPlanDayName(libraryTargetDayOrder) : "ngày tập"}.
                  </p>
                </div>

                <Badge variant="secondary" className="border-slate-200 bg-slate-100 text-slate-700">
                  {filteredLibraryItems.length} bài tập
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={librarySearch}
                    onChange={(event) => setLibrarySearch(event.target.value)}
                    placeholder="Tìm bài tập, nhóm cơ hoặc ghi chú..."
                    className="h-11 rounded-2xl border-slate-200 bg-white pl-11 text-sm"
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLibrarySearch("");
                    setLibraryCategory("");
                  }}
                  className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  <X className="mr-2 h-4 w-4" />
                  Xóa bộ lọc
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {workoutLibraryCategories.map((category) => {
                  const isActive = libraryCategory === category.value;
                  return (
                    <button
                      key={category.label}
                      type="button"
                      onClick={() => setLibraryCategory(category.value)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {isLibraryLoading ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="h-5 w-3/5 rounded-full bg-slate-200" />
                      <div className="mt-3 h-4 w-2/5 rounded-full bg-slate-200" />
                      <div className="mt-4 h-16 rounded-2xl bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : filteredLibraryItems.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredLibraryItems.map((item) => (
                    <article
                      key={`${item.id || item.displayName}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{item.displayName}</p>
                          <Badge variant="outline" className="mt-2 border-slate-200 bg-slate-50 text-slate-600">
                            {formatDisplayLabel(item.muscleGroup, "Nhóm cơ")}
                          </Badge>
                        </div>

                        <Button
                          type="button"
                          size="icon"
                          onClick={() => libraryTargetDayOrder && addExerciseToDay(libraryTargetDayOrder, item)}
                          disabled={!libraryTargetDayOrder}
                          className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {item.guidance || item.highlight || "Mô tả bài tập từ thư viện."}
                      </p>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">
                        <p className="font-semibold text-slate-700">Lưu ý kỹ thuật</p>
                        <p className="mt-1">{item.technicalNotes || "Khởi động kỹ trước khi tăng tải."}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
                  Không tìm thấy bài tập phù hợp. Hãy đổi từ khóa hoặc chọn nhóm cơ khác.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

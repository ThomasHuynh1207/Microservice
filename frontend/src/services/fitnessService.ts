import api from "../api/api";

export interface WorkoutPlanSummary {
  id: number;
  userId: number;
  name: string;
  description?: string;
  difficulty?: string;
  durationWeeks?: number;
  goal?: string;
  trainingSplit?: string;
  totalDaysPerWeek?: number;
  createdAt?: string;
}

export interface ExerciseSetTemplate {
  id?: number;
  stepOrder?: number;
  sets: number;
  reps: string;
}

export interface ExerciseTemplate {
  id?: number;
  exerciseOrder?: number;
  name: string;
  muscleGroup?: string;
  notes?: string;
  setTemplates: ExerciseSetTemplate[];
}

export interface WorkoutDayTemplate {
  id?: number;
  dayOrder: number;
  name: string;
  focus?: string;
  notes?: string;
  restBetweenDays?: string;
  exercises: ExerciseTemplate[];
}

export interface WorkoutPlanDetail extends WorkoutPlanSummary {
  days: WorkoutDayTemplate[];
}

export interface CreateWorkoutPlanPayload {
  userId: number;
  name: string;
  description?: string;
  difficulty?: string;
  durationWeeks?: number;
  goal?: string;
  trainingSplit?: string;
  totalDaysPerWeek?: number;
}

export interface ExerciseLibraryItem {
  id?: number;
  displayName: string;
  muscleGroup?: string;
  guidance?: string;
  highlight?: string;
  technicalNotes?: string;
  videoUrl?: string | null;
  updatedAt?: string;
}

export interface SeedWorkoutPayload {
  userId: number;
  gender: string;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: string;
  trainingLevel: string;
  preferences?: string[];
}

export interface WorkoutSession {
  id: number;
  userId: number;
  workoutPlanId: number;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  notes?: string;
  completed?: boolean;
}

export interface ProgressLog {
  id?: number;
  userId: number;
  date: string;
  source?: string;
  activityType?: string;
  distanceKm?: number;
  weight?: number;
  bodyFat?: number;
  workoutMinutes?: number;
  notes?: string;
  mood?: string;
  aiInsight?: string;
}

export interface MealItem {
  id: number;
  name: string;
  mealType: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  eaten: boolean;
  actualCalories?: number;
  actualProtein?: number;
  actualCarbs?: number;
  actualFat?: number;
}

export interface DailyMeal {
  dayIndex: number;
  dayDate: string;
  items: MealItem[];
}

export interface MealPlan {
  id: number;
  userId: number;
  name: string;
  startDate: string;
  endDate: string;
  mealsPerDay: number;
  targetCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  status: string;
  dailyMeals: DailyMeal[];
}

export interface MealPlanProgress {
  planId: number;
  eatenMeals: number;
  totalMeals: number;
  caloriesCompletion: number;
  proteinCompletion: number;
  carbsCompletion: number;
  fatCompletion: number;
}

export interface AddMealItemPayload {
  dayIndex: number;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  customName: string;
  calories: number;
  quantity: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface TrackMealPayload {
  eaten: boolean;
  actualCalories?: number;
  actualProtein?: number;
  actualCarbs?: number;
  actualFat?: number;
}

export interface SaveProgressPayload {
  weight?: number;
  bodyFat?: number;
  workoutMinutes?: number;
  activityType?: string;
  distanceKm?: number;
  notes?: string;
  mood?: string;
}

export const fetchWorkoutPlans = async (userId: number): Promise<WorkoutPlanSummary[]> => {
  const res = await api.get(`/workouts/plans/user/${userId}`);
  return res.data as WorkoutPlanSummary[];
};

export const fetchWorkoutPlanDetail = async (planId: number): Promise<WorkoutPlanDetail> => {
  const res = await api.get(`/workouts/plans/${planId}/detail`);
  return res.data as WorkoutPlanDetail;
};

export const updateWorkoutPlanDetail = async (planId: number, payload: WorkoutPlanDetail): Promise<WorkoutPlanDetail> => {
  const res = await api.put(`/workouts/plans/${planId}/detail`, payload);
  return res.data as WorkoutPlanDetail;
};

export const createWorkoutPlan = async (payload: CreateWorkoutPlanPayload): Promise<WorkoutPlanSummary> => {
  const res = await api.post("/workouts/plans", payload);
  return res.data as WorkoutPlanSummary;
};

export const generateSampleWorkoutPlan = async (payload: SeedWorkoutPayload): Promise<WorkoutPlanDetail> => {
  const res = await api.post("/workouts/generate-sample", payload);
  return res.data as WorkoutPlanDetail;
};

export const fetchExerciseLibrary = async (keyword?: string): Promise<ExerciseLibraryItem[]> => {
  const query = keyword?.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : "";
  const res = await api.get(`/workouts/library${query}`);
  return res.data as ExerciseLibraryItem[];
};

export const resolveExerciseLibraryItem = async (name: string): Promise<ExerciseLibraryItem> => {
  const res = await api.get(`/workouts/library/resolve?name=${encodeURIComponent(name)}`);
  return res.data as ExerciseLibraryItem;
};

export const createExerciseLibraryItem = async (payload: ExerciseLibraryItem): Promise<ExerciseLibraryItem> => {
  const res = await api.post("/workouts/library", payload);
  return res.data as ExerciseLibraryItem;
};

export const updateExerciseLibraryItem = async (id: number, payload: ExerciseLibraryItem): Promise<ExerciseLibraryItem> => {
  const res = await api.put(`/workouts/library/${id}`, payload);
  return res.data as ExerciseLibraryItem;
};

export const deleteExerciseLibraryItem = async (id: number): Promise<void> => {
  await api.delete(`/workouts/library/${id}`);
};

export const fetchWorkoutSessions = async (userId: number): Promise<WorkoutSession[]> => {
  const res = await api.get(`/workouts/sessions/user/${userId}`);
  return res.data as WorkoutSession[];
};

export const startWorkoutSession = async (userId: number, workoutPlanId: number, notes?: string): Promise<WorkoutSession> => {
  const res = await api.post("/workouts/sessions", {
    userId,
    workoutPlanId,
    notes: notes || "Session started from Tap luyen page",
  });
  return res.data as WorkoutSession;
};

export const endWorkoutSession = async (sessionId: number): Promise<WorkoutSession> => {
  const res = await api.put(`/workouts/sessions/${sessionId}/end`);
  return res.data as WorkoutSession;
};

export const fetchMealPlans = async (userId: number): Promise<MealPlan[]> => {
  const res = await api.get(`/v1/meal-plans/user/${userId}`);
  return res.data as MealPlan[];
};

export const fetchMealPlan = async (planId: number): Promise<MealPlan> => {
  const res = await api.get(`/v1/meal-plans/${planId}`);
  return res.data as MealPlan;
};

export const fetchMealPlanProgress = async (planId: number): Promise<MealPlanProgress> => {
  const res = await api.get(`/v1/meal-plans/${planId}/progress`);
  return res.data as MealPlanProgress;
};

export const addCustomMealItem = async (planId: number, payload: AddMealItemPayload): Promise<MealPlan> => {
  const res = await api.post(`/v1/meal-plans/${planId}/items`, payload);
  return res.data as MealPlan;
};

export const trackMeal = async (
  planId: number,
  dayIndex: number,
  itemId: number,
  payload: TrackMealPayload
): Promise<MealPlanProgress> => {
  const res = await api.patch(`/v1/meal-plans/${planId}/days/${dayIndex}/meals/${itemId}/track`, payload);
  return res.data as MealPlanProgress;
};

export const fetchProgressLogs = async (userId: number): Promise<ProgressLog[]> => {
  const res = await api.get(`/progress/user/${userId}`);
  return res.data as ProgressLog[];
};

export const saveProgress = async (
  progressId: number | null,
  userId: number,
  data: SaveProgressPayload
): Promise<ProgressLog> => {
  const payload = {
    userId,
    date: new Date().toISOString().slice(0, 10),
    source: "manual",
    activityType: data.activityType || "Workout",
    distanceKm: data.distanceKm || 0,
    weight: data.weight,
    bodyFat: data.bodyFat,
    workoutMinutes: data.workoutMinutes || 0,
    notes: data.notes,
    mood: data.mood,
  };

  if (progressId) {
    const res = await api.put(`/progress/${progressId}`, payload);
    return res.data as ProgressLog;
  }

  const res = await api.post("/progress", payload);
  return res.data as ProgressLog;
};

export const getTodayMealDayIndex = (plan: MealPlan): number => {
  const today = new Date();
  const start = new Date(`${plan.startDate}T00:00:00`);
  const diffMs = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const rawIndex = diffDays + 1;
  return Math.min(7, Math.max(1, rawIndex));
};

import api from "../api/api";

export interface WorkoutPlan {
  id: number;
  title: string;
  planContent: string;
  goal: string;
  createdAt: string;
}

export interface ProgressEntry {
  weight: number;
  bodyFat: number;
  caloriesBurned: number;
  workoutMinutes: number;
  logDate: string;
}

export const fetchWorkouts = async (userId: number): Promise<WorkoutPlan[]> => {
  const res = await api.get(`/workouts/${userId}`);
  return res.data as WorkoutPlan[];
};

export const createWorkout = async (
  userId: number,
  title: string,
  planContent: string,
  goal: string
): Promise<WorkoutPlan> => {
  const res = await api.post(`/workouts/${userId}`, {
    title,
    planContent,
    goal,
  });
  return res.data as WorkoutPlan;
};

export const saveProgress = async (
  userId: number,
  data: {
    weight: number;
    bodyFat: number;
    caloriesBurned: number;
    workoutMinutes: number;
  }
): Promise<ProgressEntry> => {
  const res = await api.post(`/progress/${userId}`, data);
  return res.data as ProgressEntry;
};

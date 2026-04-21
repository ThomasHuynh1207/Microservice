import api from "../api/api";

export type GoalOption =
  | "lose"
  | "build"
  | "cut"
  | "maintain"
  | "endurance"
  | "wellness";

export type TrainingFrequency =
  | "sedentary"
  | "beginner"
  | "light"
  | "moderate"
  | "active"
  | "very_active"
  | "intense"
  | "adaptive";

export type DietPreference =
  | "no-limit"
  | "vegetarian"
  | "vegan"
  | "low-lactose"
  | "low-carb";

export interface OnboardingProfile {
  userId: number;
  gender: string;
  age: number;
  height: number;
  weight: number;
  targetWeight: number;
  goal: GoalOption;
  trainingFrequency: TrainingFrequency;
  trainingDaysPerWeek: number;
  preferences: string[];
  specificGoal?: string;
  dietPreference: DietPreference;
  allergies: string;
  bmi: number | null;
  recommendedCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  } | null;
}

export interface MealSuggestion {
  title: string;
  description: string;
  calories: number;
}

export interface WorkoutPlanSeed {
  title: string;
  subtitle: string;
  sessions: Array<{ day: string; focus: string; detail: string }>;
}

export interface DashboardSeed {
  userId: number;
  profile: OnboardingProfile;
  bmr: number;
  tdee: number;
  caloriesGoal: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  workoutPlan: WorkoutPlanSeed;
  mealSuggestions: MealSuggestion[];
  suggestedCards: Array<{ title: string; description: string; actionText: string }>;
  weeklyMessage: string;
  createdAt: string;
}

export interface OnboardingStepSetting {
  stepIndex: number;
  stepKey: string;
  title: string;
  headline: string;
  helperText: string;
  imageUrl: string;
  optionImageUrls: Record<string, string>;
}

const ONBOARDING_SEED_PREFIX = "fitlife-pro-onboarding-seed";

const storageKey = (userId: number) => `${ONBOARDING_SEED_PREFIX}-${userId}`;

export const getActivityFactor = (trainingFrequency: TrainingFrequency) => {
  switch (trainingFrequency) {
    case "sedentary":
      return 1.2;
    case "beginner":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
    case "intense":
      return 1.725;
    case "very_active":
      return 1.9;
    default:
      return 1.55;
  }
};

export const computeBMR = (profile: OnboardingProfile) => {
  if (!profile.age || !profile.height || !profile.weight) return 0;
  const normalizedGender = String(profile.gender || "").toLowerCase();
  if (normalizedGender === "female" || normalizedGender === "nu" || normalizedGender === "nữ") {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }
  if (normalizedGender === "male" || normalizedGender === "nam") {
    return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  }
  return 10 * profile.weight + 6.25 * profile.height - 5 * profile.age;
};

export const computeTDEE = (profile: OnboardingProfile) => {
  const bmr = computeBMR(profile);
  return Math.round(bmr * getActivityFactor(profile.trainingFrequency));
};

export const computeCaloriesGoal = (tdee: number, goal: GoalOption) => {
  switch (goal) {
    case "lose":
      return Math.max(1200, tdee - 400);
    case "build":
      return Math.round(tdee + 250);
    case "cut":
      return Math.max(1200, tdee - 250);
    case "maintain":
      return Math.round(tdee);
    case "endurance":
      return Math.round(tdee + 100);
    case "wellness":
      return Math.round(tdee);
    default:
      return Math.round(tdee);
  }
};

export const computeMacros = (calories: number, goal: GoalOption) => {
  if (!calories) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  switch (goal) {
    case "lose":
      return {
        protein: Math.round((calories * 0.35) / 4),
        carbs: Math.round((calories * 0.35) / 4),
        fat: Math.round((calories * 0.3) / 9),
      };
    case "build":
      return {
        protein: Math.round((calories * 0.3) / 4),
        carbs: Math.round((calories * 0.45) / 4),
        fat: Math.round((calories * 0.25) / 9),
      };
    case "cut":
      return {
        protein: Math.round((calories * 0.35) / 4),
        carbs: Math.round((calories * 0.35) / 4),
        fat: Math.round((calories * 0.3) / 9),
      };
    default:
      return {
        protein: Math.round((calories * 0.3) / 4),
        carbs: Math.round((calories * 0.4) / 4),
        fat: Math.round((calories * 0.3) / 9),
      };
  }
};

export const createWorkoutPlanSeed = (goal: GoalOption): WorkoutPlanSeed => ({
  title: "Full Body 3 ngày",
  subtitle: "Kế hoạch khởi động thân thiện cho tuần đầu",
  sessions: [
    {
      day: "Ngày 1",
      focus: "Toàn thân nhẹ nhàng",
      detail: "Squat, đẩy ngực, plank, và đi bộ 20 phút.",
    },
    {
      day: "Ngày 3",
      focus: "Tập cường độ vừa",
      detail: "Deadlift nhẹ, kéo xà, cầu mông, và bài cardio ngắn.",
    },
    {
      day: "Ngày 5",
      focus: "Phục hồi năng lượng",
      detail: "Goblet squat, overhead press, core, và kéo giãn toàn thân.",
    },
  ],
});

export const createMealSuggestions = (profile: OnboardingProfile): MealSuggestion[] => [
  {
    title: "Smoothie buổi sáng giàu protein",
    description: "Sinh tố chuối + bơ đậu phộng + sữa hạnh nhân phù hợp với ngày đầu.",
    calories: Math.round(profile.recommendedCalories * 0.25),
  },
  {
    title: "Salad gà nướng",
    description: "Bữa trưa cân bằng đạm, rau củ và carb từ yến mạch.",
    calories: Math.round(profile.recommendedCalories * 0.35),
  },
  {
    title: "Bữa tối nhẹ nhàng",
    description: "Cá hồi hấp, rau xanh và khoai lang cho phục hồi.",
    calories: Math.round(profile.recommendedCalories * 0.3),
  },
];

export const createDashboardSeed = (profile: OnboardingProfile): DashboardSeed => {
  const bmr = computeBMR(profile);
  const tdee = Math.round(bmr * getActivityFactor(profile.trainingFrequency));
  const caloriesGoal = computeCaloriesGoal(tdee, profile.goal);
  const macros = computeMacros(caloriesGoal, profile.goal);

  return {
    userId: profile.userId,
    profile,
    bmr,
    tdee,
    caloriesGoal,
    macros,
    workoutPlan: createWorkoutPlanSeed(profile.goal),
    mealSuggestions: createMealSuggestions(profile),
    suggestedCards: [
      {
        title: "Bắt đầu với Full Body 3 ngày",
        description: "Kế hoạch khởi động được thiết kế để bạn có buổi tập đầu tiên trọn vẹn.",
        actionText: "Xem kế hoạch hôm nay",
      },
      {
        title: "Mục tiêu calo của bạn",
        description: `Đây là số calo gợi ý cho ngày đầu: ${caloriesGoal} kcal.`,
        actionText: "Khám phá mục tiêu dinh dưỡng",
      },
      {
        title: "Gợi ý bữa ăn ngày đầu",
        description: "3 lựa chọn thực đơn nhẹ nhàng giúp bạn duy trì năng lượng và phục hồi.",
        actionText: "Xem gợi ý ăn uống",
      },
      {
        title: "Hãy ghi hoạt động đầu tiên",
        description: "Mỗi bước và buổi tập sẽ biến thành dữ liệu tiến bộ rõ ràng.",
        actionText: "Bắt đầu ngay",
      },
    ],
    weeklyMessage: "Tuần đầu tiên của bạn – Hãy bắt đầu ghi hoạt động để thấy tiến bộ.",
    createdAt: new Date().toISOString(),
  };
};

export const initializeUserData = async (userId: number, profile: OnboardingProfile): Promise<DashboardSeed> => {
  const seed = createDashboardSeed(profile);

  const allergies = profile.allergies
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  await api.post(`/users/${userId}/onboarding-complete`, {
    gender: profile.gender,
    age: profile.age,
    heightCm: profile.height,
    weightKg: profile.weight,
    goal: profile.goal,
    activityLevel: profile.trainingFrequency,
    trainingDaysPerWeek: profile.trainingDaysPerWeek,
    specificGoal: profile.specificGoal?.trim() || `${profile.goal} den ${profile.targetWeight}kg`,
    preferences: profile.preferences,
    allergies,
    dietPreference: profile.dietPreference,
  });

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(seed));
  } catch {
    console.warn("Không lưu được seed data vào localStorage.");
  }

  return seed;
};

export const getUserSeedData = (userId: number): DashboardSeed | null => {
  try {
    const stored = localStorage.getItem(storageKey(userId));
    if (!stored) return null;
    return JSON.parse(stored) as DashboardSeed;
  } catch {
    return null;
  }
};

export const fetchOnboardingStepSettings = async (): Promise<OnboardingStepSetting[]> => {
  const response = await api.get<OnboardingStepSetting[]>("/auth/onboarding-steps");
  return Array.isArray(response.data) ? response.data : [];
};

export const clearUserSeedData = (userId: number) => {
  localStorage.removeItem(storageKey(userId));
};

// Example Node.js / Express route for onboarding initialization:
//
// import express from "express";
// import { createDashboardSeed } from "./onboardingService";
//
// const router = express.Router();
// router.post("/api/initialize-user-data", async (req, res) => {
//   const { userId, profile } = req.body;
//   if (!userId || !profile) {
//     return res.status(400).json({ message: "Missing userId or profile." });
//   }
//   const payload = createDashboardSeed({ ...profile, userId });
//   // Lưu payload vào database / user metadata
//   // await db.userSeeds.create({ userId, data: payload });
//   return res.status(200).json(payload);
// });
//
// Example Next.js API route:
//
// export default async function handler(req, res) {
//   if (req.method !== "POST") {
//     return res.status(405).end();
//   }
//   const { userId, profile } = req.body;
//   const payload = createDashboardSeed({ ...profile, userId });
//   return res.status(200).json(payload);
// }

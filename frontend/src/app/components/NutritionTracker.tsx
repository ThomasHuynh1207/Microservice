import { useEffect, useMemo, useState } from "react";
import { Apple, Flame, Plus, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { getCurrentUser } from "../../services/authService";
import {
  addCustomMealItem,
  fetchMealPlan,
  fetchMealPlanProgress,
  fetchMealPlans,
  getTodayMealDayIndex,
  MealItem,
  MealPlan,
  MealPlanProgress,
  trackMeal,
} from "../../services/fitnessService";
import api from "../../api/api";

interface ProfileData {
  onboardingGoal?: string;
  height?: number;
  weight?: number;
  activityLevel?: string;
  fitnessGoal?: string;
  bmr?: number;
  tdee?: number;
  targetCalories?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  preferences?: string[];
  allergies?: string[];
}

const foodSuggestionsByGoal: Record<string, Array<{ name: string; calories: number; protein: number; carbs: number; fat: number }>> = {
  lose: [
    { name: "Uc ga nuong + salad", calories: 380, protein: 35, carbs: 20, fat: 14 },
    { name: "Sua chua Hy Lap + hat", calories: 260, protein: 20, carbs: 14, fat: 12 },
    { name: "Ca hoi + rau xanh", calories: 410, protein: 32, carbs: 18, fat: 22 },
  ],
  build: [
    { name: "Com ga bo + rau", calories: 640, protein: 42, carbs: 72, fat: 18 },
    { name: "Yen mach + whey + chuoi", calories: 520, protein: 34, carbs: 62, fat: 14 },
    { name: "Banh mi nguyen cam + trung", calories: 470, protein: 26, carbs: 48, fat: 19 },
  ],
  maintain: [
    { name: "Com lut + tom + rau", calories: 500, protein: 30, carbs: 55, fat: 16 },
    { name: "Pho ga it mo", calories: 460, protein: 28, carbs: 52, fat: 12 },
    { name: "Sinh to bo + sua hat", calories: 320, protein: 10, carbs: 22, fat: 20 },
  ],
};

const mealTypeOptions = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

const normalizeGoal = (goal?: string) => {
  const value = (goal || "maintain").toLowerCase();
  if (value.includes("lose") || value.includes("giam")) return "lose";
  if (value.includes("build") || value.includes("muscle") || value.includes("tang")) return "build";
  return "maintain";
};

export function NutritionTracker() {
  const user = getCurrentUser();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [progress, setProgress] = useState<MealPlanProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [status, setStatus] = useState("");

  const [newMeal, setNewMeal] = useState({
    name: "",
    mealType: "LUNCH" as (typeof mealTypeOptions)[number],
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const goalKey = normalizeGoal(profile?.onboardingGoal);
  const suggestions = foodSuggestionsByGoal[goalKey] || foodSuggestionsByGoal.maintain;

  const todayDayIndex = useMemo(() => (mealPlan ? getTodayMealDayIndex(mealPlan) : 1), [mealPlan]);

  const todayMeal = useMemo(() => {
    if (!mealPlan) return null;
    return mealPlan.dailyMeals.find((day) => day.dayIndex === todayDayIndex) || null;
  }, [mealPlan, todayDayIndex]);

  const caloriesEatenToday = useMemo(() => {
    if (!todayMeal) return 0;
    return todayMeal.items
      .filter((item) => item.eaten)
      .reduce((sum, item) => sum + Number(item.actualCalories ?? item.calories ?? 0), 0);
  }, [todayMeal]);

  const caloriesGoal = Number(mealPlan?.targetCalories || profile?.targetCalories || 0);
  const caloriesRemaining = Math.max(0, caloriesGoal - caloriesEatenToday);

  const ensureMealPlan = async (profileData: ProfileData) => {
    if (!user) return;

    if (!profileData.height || !profileData.weight || !profileData.activityLevel || !(profileData.onboardingGoal || profileData.fitnessGoal)) {
      return;
    }

    await api.post("/v1/meal-plans/generate", {
      userId: user.id,
      startDate: new Date().toISOString().slice(0, 10),
      heightCm: profileData.height,
      weightKg: profileData.weight,
      activityLevel: profileData.activityLevel,
      goal: profileData.onboardingGoal || profileData.fitnessGoal,
      preferences: profileData.preferences || [],
      allergies: profileData.allergies || [],
    });
  };

  const loadNutritionData = async () => {
    if (!user) return;

    setIsLoading(true);
    setStatus("");

    try {
      const profileRes = await api.get<ProfileData>(`/users/${user.id}/profile`).catch(() => ({ data: {} as ProfileData }));
      setProfile(profileRes.data || {});

      let plans = await fetchMealPlans(user.id);
      if (!plans.length) {
        await ensureMealPlan(profileRes.data || {});
        plans = await fetchMealPlans(user.id);
      }

      if (!plans.length) {
        setMealPlan(null);
        setProgress(null);
        return;
      }

      const latestPlan = await fetchMealPlan(plans[0].id);
      setMealPlan(latestPlan);

      const progressData = await fetchMealPlanProgress(plans[0].id);
      setProgress(progressData);
    } catch (error) {
      console.error(error);
      setStatus("Không thể tải dữ liệu dinh dưỡng lúc này.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNutritionData();
  }, []);

  const markMealAsEaten = async (item: MealItem) => {
    if (!mealPlan) return;

    try {
      await trackMeal(mealPlan.id, todayDayIndex, item.id, {
        eaten: !item.eaten,
        actualCalories: item.actualCalories || item.calories,
        actualProtein: item.actualProtein || item.protein,
        actualCarbs: item.actualCarbs || item.carbs,
        actualFat: item.actualFat || item.fat,
      });
      await loadNutritionData();
    } catch {
      setStatus("Không thể cập nhật trạng thái bữa ăn.");
    }
  };

  const addMealFromSuggestion = async (suggestion: { name: string; calories: number; protein: number; carbs: number; fat: number }) => {
    if (!mealPlan) return;

    try {
      const updatedPlan = await addCustomMealItem(mealPlan.id, {
        dayIndex: todayDayIndex,
        mealType: "LUNCH",
        customName: suggestion.name,
        calories: suggestion.calories,
        quantity: 1,
        protein: suggestion.protein,
        carbs: suggestion.carbs,
        fat: suggestion.fat,
      });

      const day = updatedPlan.dailyMeals.find((item) => item.dayIndex === todayDayIndex);
      const created = day?.items.find((item) => item.name === suggestion.name) || day?.items[day.items.length - 1];

      if (created) {
        await trackMeal(mealPlan.id, todayDayIndex, created.id, {
          eaten: true,
          actualCalories: suggestion.calories,
          actualProtein: suggestion.protein,
          actualCarbs: suggestion.carbs,
          actualFat: suggestion.fat,
        });
      }

      await loadNutritionData();
      setStatus("Đã thêm món ăn vào nhật ký hôm nay.");
    } catch (error) {
      console.error(error);
      setStatus("Thêm món ăn gợi ý thất bại.");
    }
  };

  const handleAddManualMeal = async () => {
    if (!mealPlan || !newMeal.name || !newMeal.calories) return;

    try {
      const updatedPlan = await addCustomMealItem(mealPlan.id, {
        dayIndex: todayDayIndex,
        mealType: newMeal.mealType,
        customName: newMeal.name,
        calories: Number(newMeal.calories),
        quantity: 1,
        protein: Number(newMeal.protein || 0),
        carbs: Number(newMeal.carbs || 0),
        fat: Number(newMeal.fat || 0),
      });

      const day = updatedPlan.dailyMeals.find((item) => item.dayIndex === todayDayIndex);
      const created = day?.items.find((item) => item.name === newMeal.name) || day?.items[day.items.length - 1];

      if (created) {
        await trackMeal(mealPlan.id, todayDayIndex, created.id, {
          eaten: true,
          actualCalories: Number(newMeal.calories),
          actualProtein: Number(newMeal.protein || 0),
          actualCarbs: Number(newMeal.carbs || 0),
          actualFat: Number(newMeal.fat || 0),
        });
      }

      setNewMeal({ name: "", mealType: "LUNCH", calories: "", protein: "", carbs: "", fat: "" });
      setIsDialogOpen(false);
      await loadNutritionData();
      setStatus("Đã thêm món ăn thủ công vào hệ thống.");
    } catch (error) {
      console.error(error);
      setStatus("Thêm món ăn thất bại.");
    }
  };

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 px-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">DINH DƯỠNG</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Kế hoạch ăn uống theo TDEE cá nhân</h2>
            <p className="mt-2 text-sm text-slate-500">
              Theo dõi mục tiêu calories, tỷ lệ macro và ghi nhận các món ăn đã dùng trong ngày.
            </p>
          </div>
          <Button type="button" variant="outline" onClick={loadNutritionData} disabled={isLoading}>
            {isLoading ? "Đang tải..." : "Tải lại dữ liệu"}
          </Button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Calories mục tiêu/ngày</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{caloriesGoal}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Calories đã ăn hôm nay</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{caloriesEatenToday}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Calories còn lại</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{caloriesRemaining}</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Tiến độ meal plan</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{Math.round(progress?.caloriesCompletion || 0)}%</p>
            <Progress value={progress?.caloriesCompletion || 0} className="mt-3 h-2" />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-600" />
              Tỷ lệ macro mục tiêu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Protein</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{mealPlan?.proteinTarget || profile?.proteinTarget || 0}g</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Carb</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{mealPlan?.carbsTarget || profile?.carbsTarget || 0}g</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Fat</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{mealPlan?.fatTarget || profile?.fatTarget || 0}g</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium text-slate-700">Món đã ăn hôm nay</p>
              {todayMeal?.items?.length ? (
                <div className="mt-3 space-y-2">
                  {todayMeal.items.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {item.calories} kcal | P {item.protein} - C {item.carbs} - F {item.fat}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void markMealAsEaten(item)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          item.eaten ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.eaten ? "Đã ăn" : "Đánh dấu đã ăn"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu bữa ăn hôm nay.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Gợi ý món theo mục tiêu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestions.map((item) => (
              <article key={item.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">{item.calories} kcal | P {item.protein} - C {item.carbs} - F {item.fat}</p>
                <Button type="button" variant="outline" className="mt-3 w-full" onClick={() => void addMealFromSuggestion(item)}>
                  <Apple className="mr-2 h-4 w-4" />
                  Thêm vào nhật ký
                </Button>
              </article>
            ))}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Nhập món ăn thủ công
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm món ăn thủ công</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                  <div>
                    <Label>Tên món</Label>
                    <Input value={newMeal.name} onChange={(event) => setNewMeal((prev) => ({ ...prev, name: event.target.value }))} />
                  </div>

                  <div>
                    <Label>Loại bữa</Label>
                    <select
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={newMeal.mealType}
                      onChange={(event) => setNewMeal((prev) => ({ ...prev, mealType: event.target.value as (typeof mealTypeOptions)[number] }))}
                    >
                      {mealTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Calories</Label>
                      <Input type="number" value={newMeal.calories} onChange={(event) => setNewMeal((prev) => ({ ...prev, calories: event.target.value }))} />
                    </div>
                    <div>
                      <Label>Protein</Label>
                      <Input type="number" value={newMeal.protein} onChange={(event) => setNewMeal((prev) => ({ ...prev, protein: event.target.value }))} />
                    </div>
                    <div>
                      <Label>Carb</Label>
                      <Input type="number" value={newMeal.carbs} onChange={(event) => setNewMeal((prev) => ({ ...prev, carbs: event.target.value }))} />
                    </div>
                    <div>
                      <Label>Fat</Label>
                      <Input type="number" value={newMeal.fat} onChange={(event) => setNewMeal((prev) => ({ ...prev, fat: event.target.value }))} />
                    </div>
                  </div>

                  <Button type="button" className="w-full" onClick={() => void handleAddManualMeal()}>
                    <Flame className="mr-2 h-4 w-4" />
                    Lưu món ăn
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </section>

      {status ? <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{status}</div> : null}

      {!mealPlan ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          Chưa có meal plan được tạo. Hoàn tất onboarding để hệ thống tạo plan dinh dưỡng tự động theo TDEE.
        </div>
      ) : null}
    </div>
  );
}

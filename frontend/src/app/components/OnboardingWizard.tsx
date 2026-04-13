import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Dumbbell,
  HeartPulse,
  Leaf,
  SkipForward,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
  initializeUserData,
  GoalOption as SeedGoalOption,
  TrainingFrequency as SeedTrainingFrequency,
  DietPreference as SeedDietPreference,
} from "../../services/onboardingService";

type TrainingFrequency =
  | "beginner"
  | "light"
  | "moderate"
  | "intense"
  | "adaptive";

type GoalOption =
  | "lose"
  | "build"
  | "cut"
  | "maintain"
  | "endurance"
  | "wellness";

type DietPreference =
  | "no-limit"
  | "vegetarian"
  | "vegan"
  | "low-lactose"
  | "low-carb";

interface OnboardingData {
  gender: string;
  age: string;
  height: string;
  weight: string;
  targetWeight: string;
  goal: GoalOption | "";
  trainingFrequency: TrainingFrequency | "";
  preferences: string[];
  dietPreference: DietPreference | "";
  allergies: string;
}

const goalOptions: Array<{
  value: GoalOption;
  label: string;
  subtitle: string;
}> = [
  { value: "lose", label: "Giảm cân", subtitle: "Thon gọn, nhẹ nhàng" },
  { value: "build", label: "Tăng cơ bắp", subtitle: "Sức mạnh và vóc dáng" },
  { value: "cut", label: "Giảm mỡ & giữ cơ", subtitle: "Định hình lại cơ thể" },
  { value: "maintain", label: "Duy trì cân nặng", subtitle: "Giữ thăng bằng" },
  { value: "endurance", label: "Tăng sức bền", subtitle: "Chạy lâu hơn, khỏe hơn" },
  { value: "wellness", label: "Cải thiện sức khỏe tổng thể", subtitle: "Sống năng lượng hơn" },
];

const trainingOptions: Array<{
  value: TrainingFrequency;
  title: string;
  description: string;
}> = [
  {
    value: "beginner",
    title: "Người mới bắt đầu",
    description: "1-2 buổi/tuần, khởi động nhẹ nhàng",
  },
  {
    value: "light",
    title: "1-2 buổi/tuần",
    description: "Bắt đầu đều đặn và an toàn",
  },
  {
    value: "moderate",
    title: "3-4 buổi/tuần",
    description: "Tiến triển ổn định và hiệu quả",
  },
  {
    value: "intense",
    title: "5+ buổi/tuần",
    description: "Thử thách bản thân với cường độ cao",
  },
];

const workoutPreferences = [
  { value: "gym", label: "Tập gym (có tạ)", icon: Dumbbell },
  { value: "home", label: "Tập tại nhà (bodyweight)", icon: User },
  { value: "cardio", label: "Cardio & chạy bộ", icon: HeartPulse },
  { value: "yoga", label: "Yoga & linh hoạt", icon: Leaf },
  { value: "mixed", label: "Kết hợp", icon: Sparkles },
];

const dietOptions: Array<{
  value: DietPreference;
  label: string;
  icon: typeof Sparkles;
}> = [
  { value: "no-limit", label: "Không giới hạn", icon: Sparkles },
  { value: "vegetarian", label: "Ăn chay", icon: Leaf },
  { value: "vegan", label: "Ăn thuần chay", icon: Leaf },
  { value: "low-lactose", label: "Không lactose", icon: HeartPulse },
  { value: "low-carb", label: "Ít carb", icon: Target },
];

const stepTitles = [
  "Chào mừng",
  "Thông tin cơ bản",
  "Mục tiêu chính",
  "Mức độ tập luyện",
  "Sở thích tập luyện",
  "Thông tin dinh dưỡng",
  "Hoàn tất & cá nhân hóa",
];

function formatPreferenceLabel(values: string[]) {
  if (values.length === 0) return "Không có lựa chọn";
  return values.map((item) => item.replace(/\b\w/g, (char) => char.toUpperCase())).join(", ");
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    gender: "",
    age: "",
    height: "",
    weight: "",
    targetWeight: "",
    goal: "",
    trainingFrequency: "",
    preferences: [],
    dietPreference: "",
    allergies: "",
  });

  const totalSteps = stepTitles.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const bmi = useMemo(() => {
    const heightM = Number(formData.height) / 100;
    const weight = Number(formData.weight);
    if (!heightM || !weight) return null;
    return +(weight / (heightM * heightM)).toFixed(1);
  }, [formData.height, formData.weight]);

  const activityFactor = useMemo(() => {
    switch (formData.trainingFrequency) {
      case "beginner":
        return 1.375;
      case "light":
        return 1.45;
      case "moderate":
        return 1.55;
      case "intense":
        return 1.725;
      default:
        return 1.45;
    }
  }, [formData.trainingFrequency]);

  const bmr = useMemo(() => {
    const age = Number(formData.age);
    const height = Number(formData.height);
    const weight = Number(formData.weight);
    if (!age || !height || !weight) return 0;

    if (formData.gender === "Nữ") {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
    if (formData.gender === "Nam") {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    }
    return 10 * weight + 6.25 * height - 5 * age;
  }, [formData.gender, formData.age, formData.height, formData.weight]);

  const estimatedCalories = useMemo(() => {
    if (!bmr) return 0;
    const tdee = bmr * activityFactor;
    switch (formData.goal) {
      case "lose":
        return Math.max(1200, Math.round(tdee - 400));
      case "build":
        return Math.round(tdee + 250);
      case "cut":
        return Math.max(1200, Math.round(tdee - 250));
      case "maintain":
        return Math.round(tdee);
      case "endurance":
        return Math.round(tdee + 100);
      case "wellness":
        return Math.round(tdee);
      default:
        return Math.round(tdee);
    }
  }, [bmr, activityFactor, formData.goal]);

  const macroSuggestion = useMemo(() => {
    if (!estimatedCalories) return null;

    const calories = estimatedCalories;
    const macroBase = {
      protein: 0.3,
      carbs: 0.4,
      fat: 0.3,
    };

    switch (formData.goal) {
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
          protein: Math.round((calories * macroBase.protein) / 4),
          carbs: Math.round((calories * macroBase.carbs) / 4),
          fat: Math.round((calories * macroBase.fat) / 9),
        };
    }
  }, [estimatedCalories, formData.goal]);

  const isStepValid = useMemo(() => {
    switch (step) {
      case 0:
        return true;
      case 1:
        return !!formData.gender && !!formData.age && !!formData.height && !!formData.weight;
      case 2:
        return !!formData.goal && !!formData.targetWeight;
      case 3:
        return !!formData.trainingFrequency;
      case 4:
        return formData.preferences.length > 0;
      case 5:
        return !!formData.dietPreference;
      default:
        return true;
    }
  }, [formData, step]);

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSkip = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 5) {
      setFormData((current) => ({ ...current, dietPreference: "no-limit" }));
      setStep(6);
      return;
    }
    setStep((current) => Math.min(current + 1, totalSteps - 1));
  };

  const handleTogglePreference = (value: string) => {
    setFormData((current) => {
      const has = current.preferences.includes(value);
      return {
        ...current,
        preferences: has
          ? current.preferences.filter((item) => item !== value)
          : [...current.preferences, value],
      };
    });
  };

  const handleComplete = async () => {
    setIsSaving(true);
    const payload = {
      ...formData,
      bmi,
      recommendedCalories: estimatedCalories,
      macros: macroSuggestion,
      completedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("fitlife-pro-onboarding", JSON.stringify(payload));

      const currentUser = JSON.parse(localStorage.getItem("fituser") || "null");
      if (currentUser?.id) {
        await initializeUserData(currentUser.id, {
          userId: currentUser.id,
          gender: formData.gender,
          age: Number(formData.age),
          height: Number(formData.height),
          weight: Number(formData.weight),
          targetWeight: Number(formData.targetWeight),
          goal: formData.goal as SeedGoalOption,
          trainingFrequency: formData.trainingFrequency as SeedTrainingFrequency,
          preferences: formData.preferences,
          dietPreference: formData.dietPreference as SeedDietPreference,
          allergies: formData.allergies,
          bmi,
          recommendedCalories: estimatedCalories,
          macros: macroSuggestion,
        });
      }

      // Nếu bạn muốn gọi API, đổi đoạn sau:
      // await fetch("/api/onboarding", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });

      navigate("/dashboard");
    } catch (error) {
      console.error("Lưu onboarding thất bại", error);
      alert("Không thể lưu dữ liệu ngay bây giờ. Vui lòng thử lại sau.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.2),transparent_32%),linear-gradient(180deg,#7C3AED_0%,#A855F7_70%)] text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 shadow-sm">
                <Sparkles className="h-4 w-4" /> FitLife Pro
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-violet-200/80">Welcome to your journey</p>
                <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                  Hành trình fitness & dinh dưỡng cá nhân hóa bắt đầu từ hôm nay
                </h1>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:auto-cols-max lg:grid-flow-col">
              <div className="rounded-3xl bg-white/10 p-4 text-center shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-violet-100/70">Độ dài</p>
                <p className="mt-2 text-2xl font-semibold">7 bước</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center shadow-sm backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-violet-100/70">Quick win</p>
                <p className="mt-2 text-2xl font-semibold">Dashboard sẵn sàng</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl md:p-10">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-violet-100/80">{stepTitles[step]}</p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">
                {step === 0
                  ? "Bắt đầu với vài câu hỏi nhanh"
                  : step === 6
                  ? "Gần hoàn tất rồi!"
                  : "Chuẩn bị để cá nhân hóa lịch trình của bạn"}
              </h2>
            </div>
            <div className="rounded-3xl bg-white/10 px-4 py-2 text-sm text-violet-100 shadow-sm">
              Bước {step + 1} / {totalSteps}
            </div>
          </div>

          <div className="mb-6 rounded-3xl bg-white/10 p-2">
            <Progress value={progress} className="h-3 rounded-full bg-white/20" />
          </div>

          <Card className="border-white/10 bg-white/5 shadow-none">
            <CardContent className="space-y-8">
              {step === 0 && (
                <div className="space-y-6 text-center text-white">
                  <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-white/10 shadow-inner">
                    <Sparkles className="h-12 w-12 text-white" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-lg leading-8 text-violet-100/90">
                      Chào mừng đến với FitLife Pro. Chúng tôi sẽ giúp bạn chọn lộ trình tập luyện và dinh dưỡng phù hợp, không phán xét, chỉ rõ ràng và thân thiện.
                    </p>
                    <p className="text-sm text-violet-200/80">
                      Dành 3-5 phút để trả lời vài câu hỏi, sau đó bạn sẽ có kế hoạch đầu tiên và gợi ý thực đơn.
                    </p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-sm text-violet-100/90">Giới tính</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "Nam", label: "Nam" },
                          { value: "Nữ", label: "Nữ" },
                          { value: "Khác", label: "Khác" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, gender: option.value })}
                            className={`rounded-3xl border px-4 py-4 text-center transition-all hover:border-white/50 ${
                              formData.gender === option.value
                                ? "border-white bg-white/15 text-white"
                                : "border-white/20 bg-white/5 text-violet-50"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="age" className="text-sm text-violet-100/90">Tuổi</Label>
                      <Input
                        id="age"
                        type="number"
                        min={12}
                        max={100}
                        placeholder="25"
                        value={formData.age}
                        onChange={(event) => setFormData({ ...formData, age: event.target.value })}
                        className="bg-white/10 text-white placeholder:text-violet-300"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-3">
                      <Label htmlFor="height" className="text-sm text-violet-100/90">Chiều cao (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min={100}
                        max={250}
                        placeholder="170"
                        value={formData.height}
                        onChange={(event) => setFormData({ ...formData, height: event.target.value })}
                        className="bg-white/10 text-white placeholder:text-violet-300"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="weight" className="text-sm text-violet-100/90">Cân nặng hiện tại (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min={35}
                        max={220}
                        placeholder="70"
                        value={formData.weight}
                        onChange={(event) => setFormData({ ...formData, weight: event.target.value })}
                        className="bg-white/10 text-white placeholder:text-violet-300"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="targetWeight" className="text-sm text-violet-100/90">Cân nặng mục tiêu (kg)</Label>
                      <Input
                        id="targetWeight"
                        type="number"
                        min={35}
                        max={220}
                        placeholder="65"
                        value={formData.targetWeight}
                        onChange={(event) => setFormData({ ...formData, targetWeight: event.target.value })}
                        className="bg-white/10 text-white placeholder:text-violet-300"
                      />
                    </div>
                  </div>

                  {bmi && (
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-violet-100/95">
                      <p className="text-sm">Chỉ số BMI hiện tại của bạn là</p>
                      <p className="mt-2 text-3xl font-semibold">{bmi}</p>
                      <p className="mt-1 text-sm text-violet-200/80">Chúng tôi sẽ dùng thông số này để cá nhân hóa hành trình của bạn.</p>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {goalOptions.map((goal) => (
                      <button
                        key={goal.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, goal: goal.value })}
                        className={`group rounded-3xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-white/50 ${
                          formData.goal === goal.value
                            ? "border-white bg-white/15 text-white"
                            : "border-white/10 bg-white/5 text-violet-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-2xl">{goal.value === "lose" ? "🔥" : goal.value === "build" ? "💪" : goal.value === "cut" ? "⚡" : goal.value === "maintain" ? "⚖️" : goal.value === "endurance" ? "🏃" : "🌿"}</span>
                          <Target className="h-5 w-5 text-violet-200/80" />
                        </div>
                        <div className="mt-4 font-semibold text-lg">{goal.label}</div>
                        <p className="mt-2 text-sm text-violet-200/80">{goal.subtitle}</p>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-violet-100/95">
                    <p className="font-semibold">Mục tiêu chính của bạn sẽ giúp chúng tôi đề xuất kế hoạch tập và dinh dưỡng phù hợp.</p>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid gap-4">
                    {trainingOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, trainingFrequency: option.value })}
                        className={`rounded-3xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                          formData.trainingFrequency === option.value
                            ? "border-white bg-white/15 text-white"
                            : "border-white/10 bg-white/5 text-violet-100"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold">{option.title}</div>
                            <p className="mt-1 text-sm text-violet-200/80">{option.description}</p>
                          </div>
                          <CalendarDays className="h-6 w-6 text-violet-200/80" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-violet-100/95">
                    <p className="text-sm">Chúng tôi sẽ dùng mức độ này để tính lượng calo mục tiêu và gợi ý tần suất tập luyện.</p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <p className="text-violet-100/90">Chọn các sở thích bạn yêu thích. Bạn có thể chọn nhiều loại.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {workoutPreferences.map((option) => {
                      const Icon = option.icon;
                      const selected = formData.preferences.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleTogglePreference(option.value)}
                          className={`group flex items-center gap-4 rounded-3xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                            selected
                              ? "border-white bg-white/15 text-white"
                              : "border-white/10 bg-white/5 text-violet-100"
                          }`}
                        >
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/20 text-xl text-white">
                            <Icon className="h-6 w-6" />
                          </span>
                          <div>
                            <div className="font-semibold">{option.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-violet-100/95">
                    {formData.preferences.length > 0 ? (
                      <p>Đã chọn: {formatPreferenceLabel(formData.preferences)}</p>
                    ) : (
                      <p className="text-violet-200/80">Chọn ít nhất một lựa chọn để chúng tôi có thể cá nhân hóa tốt hơn.</p>
                    )}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {dietOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, dietPreference: option.value })}
                          className={`group rounded-3xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.dietPreference === option.value
                              ? "border-white bg-white/15 text-white"
                              : "border-white/10 bg-white/5 text-violet-100"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="rounded-2xl bg-white/10 p-3 text-violet-100">
                              <Icon className="h-5 w-5" />
                            </span>
                            <div>
                              <div className="font-semibold">{option.label}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="allergies" className="text-sm text-violet-100/90">Dị ứng thức ăn (nếu có)</Label>
                    <Input
                      id="allergies"
                      type="text"
                      placeholder="Ví dụ: đậu phộng, hải sản"
                      value={formData.allergies}
                      onChange={(event) => setFormData({ ...formData, allergies: event.target.value })}
                      className="bg-white/10 text-white placeholder:text-violet-300"
                    />
                    <p className="text-sm text-violet-200/80">Thông tin này giúp FitLife Pro tránh gợi ý thực đơn không phù hợp.</p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-violet-100/95">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.24em] text-violet-200/80">Tóm tắt</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">Kế hoạch cá nhân hóa của bạn</h3>
                      </div>
                      <div className="rounded-3xl bg-violet-600/20 px-4 py-2 text-sm text-violet-100">Sẵn sàng để bắt đầu</div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-3xl bg-white/10 p-4">
                        <p className="text-sm text-violet-200/80">Mục tiêu</p>
                        <p className="mt-2 text-lg font-semibold text-white">{goalOptions.find((item) => item.value === formData.goal)?.label ?? "Chưa chọn"}</p>
                      </div>
                      <div className="rounded-3xl bg-white/10 p-4">
                        <p className="text-sm text-violet-200/80">Calo gợi ý</p>
                        <p className="mt-2 text-lg font-semibold text-white">{estimatedCalories.toLocaleString()} kcal</p>
                      </div>
                      <div className="rounded-3xl bg-white/10 p-4">
                        <p className="text-sm text-violet-200/80">Kế hoạch đầu tiên</p>
                        <p className="mt-2 text-lg font-semibold text-white">{formData.trainingFrequency === "intense" ? "Nâng cao" : formData.trainingFrequency === "moderate" ? "Ổn định" : "Khởi động"}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      {macroSuggestion && (
                        <>
                          <div className="rounded-3xl bg-white/10 p-4">
                            <p className="text-sm text-violet-200/80">Protein</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{macroSuggestion.protein}g</p>
                          </div>
                          <div className="rounded-3xl bg-white/10 p-4">
                            <p className="text-sm text-violet-200/80">Carbs</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{macroSuggestion.carbs}g</p>
                          </div>
                          <div className="rounded-3xl bg-white/10 p-4">
                            <p className="text-sm text-violet-200/80">Fat</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{macroSuggestion.fat}g</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6 rounded-3xl border border-violet-200/10 bg-violet-900/30 p-5 text-violet-100/90">
                      <p className="text-sm font-semibold text-white">Công thức BMR/TDEE</p>
                      <p className="mt-3 text-sm leading-6">
                        BMR được tính theo công thức Mifflin-St Jeor. Sau đó chúng tôi nhân với mức độ hoạt động để có TDEE và gợi ý lượng calo hàng ngày phù hợp mục tiêu của bạn.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  {step > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="rounded-3xl border-white/20 bg-white/5 px-5 py-3 text-white/90 hover:bg-white/10"
                    >
                      <ArrowLeft className="h-4 w-4" /> Quay lại
                    </Button>
                  )}
                  {(step === 0 || step === 5) && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-sm font-medium text-violet-100 transition hover:text-white"
                    >
                      <SkipForward className="inline h-4 w-4 mr-2 align-middle" />
                      {step === 0 ? "Bắt đầu ngay" : "Bỏ qua bước này"}
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid || isSaving}
                    className="rounded-3xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] px-6 py-3 text-white shadow-xl shadow-violet-500/20 hover:shadow-violet-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {step === totalSteps - 1 ? "Hoàn tất và vào Dashboard" : "Tiếp theo"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {step === totalSteps - 1 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-violet-100/90">
                  <p className="font-semibold text-white">Quick win</p>
                  <p className="mt-2">Ngay sau khi vào Dashboard, bạn sẽ thấy gợi ý bắt đầu buổi tập đầu tiên hoặc ghi bữa ăn đầu tiên để giữ đà tiến.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

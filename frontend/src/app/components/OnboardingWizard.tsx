import { useEffect, useMemo, useState } from "react";
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
  fetchOnboardingStepSettings,
  OnboardingStepSetting as RemoteOnboardingStepSetting,
} from "../../services/onboardingService";
import { setOnboardingCompletedLocal, setOnboardingCompletionProofLocal } from "../../services/authService";

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

interface OnboardingDraft {
  step: number;
  formData: OnboardingData;
}

const defaultFormData: OnboardingData = {
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
};

const goalOptions: Array<{
  value: GoalOption;
  label: string;
  subtitle: string;
}> = [
  { value: "lose", label: "Giảm cân", subtitle: "Thon gọn, nhẹ nhàng" },
  { value: "build", label: "Tăng cơ bắp", subtitle: "Sức mạnh và vóc dáng" },
  { value: "cut", label: "Giảm mỡ và giữ cơ", subtitle: "Định hình lại cơ thể" },
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
  {
    value: "gym",
    label: "Tập gym (có tạ)",
    icon: Dumbbell,
    fallbackImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80",
  },
  {
    value: "home",
    label: "Tập tại nhà (trọng lượng cơ thể)",
    icon: User,
    fallbackImage: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=400&q=80",
  },
  {
    value: "cardio",
    label: "Tim mạch và chạy bộ",
    icon: HeartPulse,
    fallbackImage: "https://images.unsplash.com/photo-1506197061617-7f5c0b093236?auto=format&fit=crop&w=400&q=80",
  },
  {
    value: "yoga",
    label: "Yoga và linh hoạt cơ thể",
    icon: Leaf,
    fallbackImage: "https://images.unsplash.com/photo-1549570652-97324981a6fd?auto=format&fit=crop&w=400&q=80",
  },
  {
    value: "mixed",
    label: "Kết hợp",
    icon: Sparkles,
    fallbackImage: "https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=400&q=80",
  },
];

const dietOptions: Array<{
  value: DietPreference;
  label: string;
  icon: typeof Sparkles;
  fallbackImage: string;
}> = [
  {
    value: "no-limit",
    label: "Không giới hạn",
    icon: Sparkles,
    fallbackImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80",
  },
  {
    value: "vegetarian",
    label: "Ăn chay",
    icon: Leaf,
    fallbackImage: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=400&q=80",
  },
  {
    value: "vegan",
    label: "Ăn thuần chay",
    icon: Leaf,
    fallbackImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
  },
  {
    value: "low-lactose",
    label: "Không lactose",
    icon: HeartPulse,
    fallbackImage: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=400&q=80",
  },
  {
    value: "low-carb",
    label: "Ít carb",
    icon: Target,
    fallbackImage: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80",
  },
];

type OnboardingStepSetting = RemoteOnboardingStepSetting;

const defaultStepSettings: OnboardingStepSetting[] = [
  {
    stepIndex: 0,
    stepKey: "welcome",
    title: "Chào mừng",
    headline: "Bắt đầu với vài câu hỏi nhanh",
    helperText: "Dành 3-5 phút để tạo dashboard và lộ trình đầu tiên.",
    imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1000&q=80",
    optionImageUrls: {},
  },
  {
    stepIndex: 1,
    stepKey: "basic-info",
    title: "Thông tin cơ bản",
    headline: "Cho chúng tôi biết thông số hiện tại",
    helperText: "Thông tin này giúp tính BMR, TDEE và mục tiêu calo phù hợp cơ thể bạn.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1000&q=80",
    optionImageUrls: {},
  },
  {
    stepIndex: 2,
    stepKey: "main-goal",
    title: "Mục tiêu chính",
    headline: "Bạn muốn đạt kết quả nào nhất trong 8-12 tuần tới?",
    helperText: "Chọn 1 mục tiêu chính để hệ thống ưu tiên bài tập và dinh dưỡng phù hợp.",
    imageUrl: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=1000&q=80",
    optionImageUrls: {},
  },
  {
    stepIndex: 3,
    stepKey: "training-level",
    title: "Mức độ tập luyện",
    headline: "Đánh giá tần suất và cường độ hiện tại",
    helperText: "Mức độ vận động giúp cân bằng giữa hiệu quả và khả năng phục hồi.",
    imageUrl: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1000&q=80",
    optionImageUrls: {},
  },
  {
    stepIndex: 4,
    stepKey: "workout-preferences",
    title: "Sở thích tập luyện",
    headline: "Chọn kiểu tập bạn dễ duy trì lâu dài",
    helperText: "Bạn có thể chọn nhiều lựa chọn. Ảnh minh họa có thể chỉnh trong trang admin.",
    imageUrl: "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1000&q=80",
    optionImageUrls: {},
  },
  {
    stepIndex: 5,
    stepKey: "nutrition",
    title: "Thông tin dinh dưỡng",
    headline: "Chọn chế độ ăn và lưu ý dị ứng",
    helperText: "Dữ liệu này giúp bộ lọc thực đơn và gợi ý bữa ăn an toàn hơn.",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1000&q=80",
    optionImageUrls: {},
  },
  {
    stepIndex: 6,
    stepKey: "summary",
    title: "Hoàn tất",
    headline: "Kế hoạch cá nhân hóa của bạn đã sẵn sàng",
    helperText: "Xem tổng quan calo, macro và gợi ý khởi động trong ngày đầu tiên.",
    imageUrl: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1000&q=80",
    optionImageUrls: {},
  },
];

function mergeStepSettings(remote: OnboardingStepSetting[]): OnboardingStepSetting[] {
  const remoteByStep = new Map(remote.map((item) => [item.stepIndex, item]));

  return defaultStepSettings.map((fallback) => {
    const item = remoteByStep.get(fallback.stepIndex);
    if (!item) return fallback;

    return {
      ...fallback,
      ...item,
      optionImageUrls: {
        ...fallback.optionImageUrls,
        ...(item.optionImageUrls || {}),
      },
    };
  });
}

const onboardingDraftKey = (userId: number) => `fitlife-onboarding-draft-${userId}`;

function formatPreferenceLabel(values: string[]) {
  if (values.length === 0) return "Không có lựa chọn";
  return values.map((item) => item.replace(/\b\w/g, (char) => char.toUpperCase())).join(", ");
}

export function OnboardingWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>(defaultFormData);
  const [stepSettings, setStepSettings] = useState<OnboardingStepSetting[]>(defaultStepSettings);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const currentUserId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("fituser") || "null") as { id?: number } | null;
      return typeof user?.id === "number" ? user.id : null;
    } catch {
      return null;
    }
  }, []);

  const totalSteps = stepSettings.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const currentStepSetting = stepSettings[step] || defaultStepSettings[step];

  useEffect(() => {
    let isMounted = true;

    fetchOnboardingStepSettings()
      .then((remoteSettings) => {
        if (!isMounted || !Array.isArray(remoteSettings) || remoteSettings.length === 0) {
          return;
        }
        setStepSettings(mergeStepSettings(remoteSettings));
      })
      .catch(() => {
        // Keep local defaults when API is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    try {
      const raw = localStorage.getItem(onboardingDraftKey(currentUserId));
      if (!raw) return;
      const draft = JSON.parse(raw) as OnboardingDraft;
      if (draft?.formData) {
        setFormData({ ...defaultFormData, ...draft.formData });
      }
      if (typeof draft?.step === "number") {
        setStep(Math.max(0, Math.min(draft.step, totalSteps - 1)));
      }
    } catch {
      // Ignore malformed draft data.
    }
  }, [currentUserId, totalSteps]);

  useEffect(() => {
    if (!currentUserId) return;

    const draft: OnboardingDraft = { step, formData };
    localStorage.setItem(onboardingDraftKey(currentUserId), JSON.stringify(draft));
  }, [currentUserId, step, formData]);

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
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
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

  const handleStartNow = () => {
    setStep((current) => Math.max(current, 1));
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

        setOnboardingCompletedLocal(currentUser.id, true);
        setOnboardingCompletionProofLocal(currentUser.id, true);
        localStorage.removeItem(onboardingDraftKey(currentUser.id));
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

  const markImageFailed = (key: string) => {
    setFailedImages((current) => ({ ...current, [key]: true }));
  };

  const resolveOptionImage = (stepIndex: number, optionKey: string, fallbackImage: string) => {
    const stepConfig = stepSettings[stepIndex] || defaultStepSettings[stepIndex];
    return stepConfig?.optionImageUrls?.[optionKey] || fallbackImage;
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-[radial-gradient(circle_at_18%_12%,#fff3e2_0%,#ffe6cb_35%,#f9e6d4_62%,#f5efe7_100%)] px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 pb-6">
        <div className="rounded-3xl border border-[#f5c99b] bg-[linear-gradient(125deg,#3f2c23_0%,#7b4b2c_58%,#bf6a2f_100%)] p-4 shadow-xl md:p-5">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-3">
              <h1 className="text-2xl font-semibold leading-tight text-[#fff7ed] sm:text-3xl">
                Hành trình thể chất và dinh dưỡng cá nhân hóa
              </h1>
              <p className="max-w-2xl text-sm text-[#ffe9d2] sm:text-base">
                Trả lời nhanh 7 bước để nhận lộ trình luyện tập và dinh dưỡng phù hợp với mục tiêu của bạn.
              </p>
              <Button
                type="button"
                onClick={handleStartNow}
                className="rounded-xl border border-[#f9d7b4] bg-[#ffe3c6] px-5 py-2 text-[#5a341a] hover:bg-[#ffe9d4]"
              >
                Bắt đầu ngay
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#f2c89f] bg-[#fff2e4]/20 p-4 text-center shadow-sm backdrop-blur">
                <p className="text-lg font-semibold text-white">7 bước rõ ràng</p>
                <p className="mt-1 text-sm text-[#ffe9d2]">Hoàn thành trong vài phút</p>
              </div>
              <div className="rounded-2xl border border-[#f2c89f] bg-[#fff2e4]/20 p-4 text-center shadow-sm backdrop-blur">
                <p className="text-lg font-semibold text-white">Dashboard sẵn sàng</p>
                <p className="mt-1 text-sm text-[#ffe9d2]">Gợi ý tập và dinh dưỡng ngay sau khi xong</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#f1ccaa] bg-[#fffaf4]/95 p-3 shadow-lg backdrop-blur md:p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#7d5032]">{currentStepSetting.title}</p>
              <h2 className="text-xl font-semibold leading-tight text-[#3a2618] sm:text-2xl">
                {currentStepSetting.headline}
              </h2>
              <p className="text-sm text-[#7a5b42]">{currentStepSetting.helperText}</p>
            </div>
            <div className="rounded-2xl border border-[#efc9a3] bg-[#fff2e2] px-3 py-1.5 text-sm font-medium text-[#6f462b] shadow-sm">
              Bước {step + 1} / {totalSteps}
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-[#efc9a3] bg-[#fff2e2] p-2">
            <Progress value={progress} className="h-3 bg-[#f8cda6]" />
          </div>

          <Card className="rounded-3xl border-[#efc9a3] bg-[#fffdf9] shadow-none">
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-[#efc9a3] bg-[#fdebd7]">
                {!failedImages[`step-${step}`] && currentStepSetting.imageUrl ? (
                  <img
                    src={currentStepSetting.imageUrl}
                    alt={currentStepSetting.title}
                    className="h-40 w-full object-cover sm:h-52"
                    onError={() => markImageFailed(`step-${step}`)}
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-[linear-gradient(120deg,#f7d8b7_0%,#f1c7a0_50%,#e9b88a_100%)] text-sm font-semibold text-[#6f482e] sm:h-52">
                    Ảnh minh họa cho bước {step + 1}
                  </div>
                )}
              </div>

              {step === 0 && (
                <div className="space-y-4 text-center text-[#3a2618]">
                  <div className="space-y-3">
                    <p className="text-lg leading-8 text-[#4c3320]">
                      Chào mừng đến với FitLife Pro. Chúng tôi sẽ giúp bạn chọn lộ trình tập luyện và dinh dưỡng phù hợp, không phán xét, chỉ rõ ràng và thân thiện.
                    </p>
                    <p className="text-sm text-[#7a5a40]">
                      Dành 3-5 phút để trả lời vài câu hỏi, sau đó bạn sẽ có kế hoạch đầu tiên và gợi ý thực đơn.
                    </p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <Label className="text-sm text-[#67472d]">Giới tính</Label>
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
                            className={`rounded-xl border px-4 py-4 text-center transition-all hover:border-[#c1713a] ${
                              formData.gender === option.value
                                ? "border-[#a85422] bg-[#ffe4c7] text-[#3a2618]"
                                : "border-[#efc9a3] bg-[#fff7ee] text-[#4c3320]"
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="age" className="text-sm text-[#67472d]">Tuổi</Label>
                      <Input
                        id="age"
                        type="number"
                        min={12}
                        max={100}
                        value={formData.age}
                        onChange={(event) => setFormData({ ...formData, age: event.target.value })}
                        className="border-[#efc9a3] bg-[#fff7ee] text-[#3a2618]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-3">
                      <Label htmlFor="height" className="text-sm text-[#67472d]">Chiều cao (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        min={100}
                        max={250}
                        value={formData.height}
                        onChange={(event) => setFormData({ ...formData, height: event.target.value })}
                        className="border-[#efc9a3] bg-[#fff7ee] text-[#3a2618]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="weight" className="text-sm text-[#67472d]">Cân nặng hiện tại (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        min={35}
                        max={220}
                        value={formData.weight}
                        onChange={(event) => setFormData({ ...formData, weight: event.target.value })}
                        className="border-[#efc9a3] bg-[#fff7ee] text-[#3a2618]"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="targetWeight" className="text-sm text-[#67472d]">Cân nặng mục tiêu (kg)</Label>
                      <Input
                        id="targetWeight"
                        type="number"
                        min={35}
                        max={220}
                        value={formData.targetWeight}
                        onChange={(event) => setFormData({ ...formData, targetWeight: event.target.value })}
                        className="border-[#efc9a3] bg-[#fff7ee] text-[#3a2618]"
                      />
                    </div>
                  </div>

                  {bmi && (
                    <div className="rounded-2xl border border-[#efc9a3] bg-[#fff7ee] p-4 text-[#4c3320]">
                      <p className="text-sm">Chỉ số BMI hiện tại của bạn là</p>
                      <p className="mt-2 text-3xl font-semibold text-[#3a2618]">{bmi}</p>
                      <p className="mt-1 text-sm text-[#7a5a40]">Chúng tôi sẽ dùng thông số này để cá nhân hóa hành trình của bạn.</p>
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
                        className={`group rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c1713a] ${
                          formData.goal === goal.value
                            ? "border-[#a85422] bg-[#ffe4c7] text-[#3a2618]"
                            : "border-[#efc9a3] bg-[#fff7ee] text-[#4c3320]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-2xl">{goal.value === "lose" ? "🔥" : goal.value === "build" ? "💪" : goal.value === "cut" ? "⚡" : goal.value === "maintain" ? "⚖️" : goal.value === "endurance" ? "🏃" : "🌿"}</span>
                          <Target className="h-5 w-5 text-[#8d613f]" />
                        </div>
                        <div className="mt-4 font-semibold text-lg">{goal.label}</div>
                        <p className="mt-2 text-sm text-[#7a5a40]">{goal.subtitle}</p>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[#efc9a3] bg-[#fff7ee] p-4 text-[#4c3320]">
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
                        className={`rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                          formData.trainingFrequency === option.value
                            ? "border-[#a85422] bg-[#ffe4c7] text-[#3a2618]"
                            : "border-[#efc9a3] bg-[#fff7ee] text-[#4c3320]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold">{option.title}</div>
                            <p className="mt-1 text-sm text-[#7a5a40]">{option.description}</p>
                          </div>
                          <CalendarDays className="h-6 w-6 text-[#8d613f]" />
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-[#efc9a3] bg-[#fff7ee] p-4 text-[#4c3320]">
                    <p className="text-sm">Chúng tôi sẽ dùng mức độ này để tính lượng calo mục tiêu và gợi ý tần suất tập luyện.</p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <p className="text-[#4c3320]">Chọn các sở thích bạn yêu thích. Bạn có thể chọn nhiều loại.</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {workoutPreferences.map((option) => {
                      const Icon = option.icon;
                      const selected = formData.preferences.includes(option.value);
                      const imageUrl = resolveOptionImage(4, option.value, option.fallbackImage);
                      const imageKey = `step4-${option.value}`;
                      const canUseImage = Boolean(imageUrl) && !failedImages[imageKey];

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleTogglePreference(option.value)}
                          className={`group flex items-center gap-4 rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 ${
                            selected
                              ? "border-[#a85422] bg-[#ffe4c7] text-[#3a2618]"
                              : "border-[#efc9a3] bg-[#fff7ee] text-[#4c3320]"
                          }`}
                        >
                          <span className="grid h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#efc9a3] bg-[#fde8d2] text-xl text-[#4c3320]">
                            {canUseImage ? (
                              <img
                                src={imageUrl}
                                alt={option.label}
                                className="h-full w-full object-cover"
                                onError={() => markImageFailed(imageKey)}
                              />
                            ) : (
                              <Icon className="h-6 w-6" />
                            )}
                          </span>
                          <div>
                            <div className="font-semibold">{option.label}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="rounded-2xl border border-[#efc9a3] bg-[#fff7ee] p-4 text-[#4c3320]">
                    {formData.preferences.length > 0 ? (
                      <p>Đã chọn: {formatPreferenceLabel(formData.preferences)}</p>
                    ) : (
                      <p className="text-[#7a5a40]">Chọn ít nhất một lựa chọn để chúng tôi có thể cá nhân hóa tốt hơn.</p>
                    )}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {dietOptions.map((option) => {
                      const Icon = option.icon;
                      const imageUrl = resolveOptionImage(5, option.value, option.fallbackImage);
                      const imageKey = `step5-${option.value}`;
                      const canUseImage = Boolean(imageUrl) && !failedImages[imageKey];

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, dietPreference: option.value })}
                          className={`group rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                            formData.dietPreference === option.value
                              ? "border-[#a85422] bg-[#ffe4c7] text-[#3a2618]"
                              : "border-[#efc9a3] bg-[#fff7ee] text-[#4c3320]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="grid h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[#efc9a3] bg-[#fde8d2] p-0 text-[#4c3320]">
                              {canUseImage ? (
                                <img
                                  src={imageUrl}
                                  alt={option.label}
                                  className="h-full w-full object-cover"
                                  onError={() => markImageFailed(imageKey)}
                                />
                              ) : (
                                <div className="grid h-full w-full place-items-center">
                                  <Icon className="h-5 w-5" />
                                </div>
                              )}
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
                    <Label htmlFor="allergies" className="text-sm text-[#67472d]">Dị ứng thức ăn (nếu có)</Label>
                    <Input
                      id="allergies"
                      type="text"
                      value={formData.allergies}
                      onChange={(event) => setFormData({ ...formData, allergies: event.target.value })}
                      className="border-[#efc9a3] bg-[#fff7ee] text-[#3a2618]"
                    />
                    <p className="text-sm text-[#7a5a40]">Thông tin này giúp FitLife Pro tránh gợi ý thực đơn không phù hợp.</p>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-[#efc9a3] bg-[#fff7ee] p-5 text-[#4c3320]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold text-[#3a2618]">Kế hoạch cá nhân hóa của bạn</h3>
                      </div>
                      <div className="rounded-xl border border-[#efc9a3] bg-[#fff2e2] px-4 py-2 text-sm font-medium text-[#4c3320]">Sẵn sàng để bắt đầu</div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-[#efc9a3] bg-[#fffdf9] p-4">
                        <p className="text-sm text-[#7a5a40]">Mục tiêu</p>
                        <p className="mt-2 text-lg font-semibold text-[#3a2618]">{goalOptions.find((item) => item.value === formData.goal)?.label ?? "Chưa chọn"}</p>
                      </div>
                      <div className="rounded-xl border border-[#efc9a3] bg-[#fffdf9] p-4">
                        <p className="text-sm text-[#7a5a40]">Calo gợi ý</p>
                        <p className="mt-2 text-lg font-semibold text-[#3a2618]">{estimatedCalories.toLocaleString()} kcal</p>
                      </div>
                      <div className="rounded-xl border border-[#efc9a3] bg-[#fffdf9] p-4">
                        <p className="text-sm text-[#7a5a40]">Kế hoạch đầu tiên</p>
                        <p className="mt-2 text-lg font-semibold text-[#3a2618]">{formData.trainingFrequency === "intense" ? "Nâng cao" : formData.trainingFrequency === "moderate" ? "Ổn định" : "Khởi động"}</p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      {macroSuggestion && (
                        <>
                          <div className="rounded-xl border border-[#efc9a3] bg-[#fffdf9] p-4">
                            <p className="text-sm text-[#7a5a40]">Đạm</p>
                            <p className="mt-2 text-2xl font-semibold text-[#3a2618]">{macroSuggestion.protein}g</p>
                          </div>
                          <div className="rounded-xl border border-[#efc9a3] bg-[#fffdf9] p-4">
                            <p className="text-sm text-[#7a5a40]">Tinh bột</p>
                            <p className="mt-2 text-2xl font-semibold text-[#3a2618]">{macroSuggestion.carbs}g</p>
                          </div>
                          <div className="rounded-xl border border-[#efc9a3] bg-[#fffdf9] p-4">
                            <p className="text-sm text-[#7a5a40]">Chất béo</p>
                            <p className="mt-2 text-2xl font-semibold text-[#3a2618]">{macroSuggestion.fat}g</p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="mt-6 rounded-2xl border border-[#efc9a3] bg-[#fffdf9] p-5 text-[#4c3320]">
                      <p className="text-sm font-semibold text-[#3a2618]">Công thức BMR/TDEE</p>
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
                      className="rounded-xl border-[#efc9a3] bg-[#fff7ee] px-5 py-3 text-[#4c3320] hover:bg-[#ffeed9]"
                    >
                      <ArrowLeft className="h-4 w-4" /> Quay lại
                    </Button>
                  )}
                  {(step === 0 || step === 5) && (
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-sm font-medium text-[#7a5a40] transition hover:text-[#3a2618]"
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
                    className="rounded-xl bg-[#a85422] px-6 py-3 text-white shadow-lg hover:bg-[#8a4318] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {step === totalSteps - 1 ? "Hoàn tất và vào bảng điều khiển" : "Tiếp theo"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {step === totalSteps - 1 && (
                <div className="rounded-2xl border border-[#efc9a3] bg-[#fff7ee] p-4 text-sm text-[#4c3320]">
                  <p className="font-semibold text-[#3a2618]">Kết quả nhanh</p>
                  <p className="mt-2">Ngay sau khi vào bảng điều khiển, bạn sẽ thấy gợi ý bắt đầu buổi tập đầu tiên hoặc ghi bữa ăn đầu tiên để giữ đà tiến.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

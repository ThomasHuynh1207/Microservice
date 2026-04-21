import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Footprints, HeartPulse, Scale, Sparkles, Target, UserRound, VenusAndMars } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  getCurrentUser,
  setCurrentUser,
  setOnboardingCompletedLocal,
  setOnboardingCompletionProofLocal,
} from "../../services/authService";
import { fetchOnboardingStepSettings, initializeUserData, OnboardingProfile } from "../../services/onboardingService";

const draftKey = (userId: number) => `fitlife-onboarding-draft-${userId}`;

type StepMeta = {
  id: number;
  title: string;
  subtitle: string;
};

const stepMeta: StepMeta[] = [
  { id: 1, title: "Giới tính", subtitle: "Xác định thông tin cơ bản để tính BMR/TDEE chính xác" },
  { id: 2, title: "Tuổi", subtitle: "Độ tuổi ảnh hưởng trực tiếp đến chỉ số trao đổi chất" },
  { id: 3, title: "Chiều cao", subtitle: "Nhập đơn vị cm để đồng bộ trong hệ thống" },
  { id: 4, title: "Cân nặng", subtitle: "Cân nặng hiện tại giúp tạo mốc ban đầu cho tiến độ" },
  { id: 5, title: "Mục tiêu", subtitle: "Lựa chọn giảm cân, giữ dáng hoặc tăng cơ" },
  { id: 6, title: "Mức độ vận động", subtitle: "Đánh giá tần suất và cường độ hoạt động hiện tại" },
  { id: 7, title: "Lịch tập mỗi tuần", subtitle: "Chọn số ngày tập để hệ thống tạo giáo án phù hợp nhịp sinh hoạt" },
];

const trainingDaysOptions = [2, 3, 4, 5, 6, 7];

const goalOptions = [
  { value: "lose_weight", label: "Giảm cân" },
  { value: "maintain", label: "Giữ dáng" },
  { value: "build_muscle", label: "Tăng cơ" },
];

const activityOptions = [
  { value: "sedentary", label: "Ít vận động (ngồi nhiều)" },
  { value: "light", label: "Vận động nhẹ 1-3 buổi/tuần" },
  { value: "moderate", label: "Vận động vừa 3-5 buổi/tuần" },
  { value: "active", label: "Vận động cao 6-7 buổi/tuần" },
  { value: "very_active", label: "Cường độ cao + lao động nặng" },
];

const dietOptions = [
  { value: "no-limit", label: "Cân bằng" },
  { value: "vegetarian", label: "Ăn chay" },
  { value: "vegan", label: "Thuần chay" },
  { value: "low-lactose", label: "Ít lactose" },
  { value: "low-carb", label: "Giảm tinh bột" },
];

const preferenceOptions = [
  "Gym",
  "Cardio",
  "Yoga",
  "HIIT",
  "Outdoor",
  "Swimming",
];

const parseNumber = (value: string) => Number(value || 0);

export function OnboardingWizard() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const currentUserId = Number(currentUser?.id || 0);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dynamicStepMeta, setDynamicStepMeta] = useState<Record<number, { title: string; subtitle: string; imageUrl: string }>>({});
  const [form, setForm] = useState(() => {
    if (!currentUserId) return null;
    const stored = localStorage.getItem(draftKey(currentUserId));
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const values = useMemo(
    () => ({
      gender: String(form?.gender || ""),
      age: String(form?.age || ""),
      heightCm: String(form?.heightCm || ""),
      weightKg: String(form?.weightKg || ""),
      goal: String(form?.goal || ""),
      activityLevel: String(form?.activityLevel || ""),
      trainingDaysPerWeek: String(form?.trainingDaysPerWeek || "3"),
      specificGoal: String(form?.specificGoal || ""),
      dietPreference: String(form?.dietPreference || "no-limit"),
      allergies: String(form?.allergies || ""),
      preferences: Array.isArray(form?.preferences) ? form.preferences : [],
    }),
    [form]
  );

  const progress = (step / stepMeta.length) * 100;

  useEffect(() => {
    let isMounted = true;

    fetchOnboardingStepSettings()
      .then((items) => {
        if (!isMounted) return;
        const mapped: Record<number, { title: string; subtitle: string; imageUrl: string }> = {};
        items.forEach((item) => {
          mapped[item.stepIndex] = {
            title: item.title?.trim() || stepMeta[item.stepIndex]?.title || "",
            subtitle: item.headline?.trim() || item.helperText?.trim() || stepMeta[item.stepIndex]?.subtitle || "",
            imageUrl: item.imageUrl?.trim() || "",
          };
        });
        setDynamicStepMeta(mapped);
      })
      .catch(() => {
        // Keep local fallback metadata if admin config endpoint is unavailable.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentStepMeta = dynamicStepMeta[step - 1] || {
    title: stepMeta[step - 1].title,
    subtitle: stepMeta[step - 1].subtitle,
    imageUrl: "",
  };

  const patchForm = (payload: Record<string, unknown>) => {
    setForm((prev: Record<string, unknown> | null) => {
      const next = { ...(prev || {}), ...payload };
      if (currentUserId) {
        localStorage.setItem(draftKey(currentUserId), JSON.stringify(next));
      }
      return next;
    });
  };

  const isStepValid = (stepIndex: number) => {
    switch (stepIndex) {
      case 1:
        return values.gender.length > 0;
      case 2:
        return parseNumber(values.age) >= 13;
      case 3:
        return parseNumber(values.heightCm) >= 100;
      case 4:
        return parseNumber(values.weightKg) >= 30;
      case 5:
        return values.goal.length > 0;
      case 6:
        return values.activityLevel.length > 0;
      case 7:
        return parseNumber(values.trainingDaysPerWeek) >= 2 && parseNumber(values.trainingDaysPerWeek) <= 7;
      default:
        return false;
    }
  };

  const goNext = () => {
    setError("");
    if (!isStepValid(step)) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc trước khi tiếp tục.");
      return;
    }
    setStep((prev) => Math.min(stepMeta.length, prev + 1));
  };

  const goBack = () => {
    setError("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const completeOnboarding = async () => {
    if (!isStepValid(7)) {
      setError("Vui lòng chọn số ngày tập mỗi tuần.");
      return;
    }

    if (!currentUserId || !currentUser) {
      setError("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại.");
      return;
    }

    const mappedGoal = values.goal === "lose_weight" ? "lose" : values.goal === "build_muscle" ? "build" : "maintain";
    const mappedTrainingFrequency = values.activityLevel || "moderate";

    const weight = parseNumber(values.weightKg);
    const height = parseNumber(values.heightCm);
    const bmi = height > 0 ? Number((weight / ((height / 100) * (height / 100))).toFixed(1)) : null;

    const profilePayload: OnboardingProfile = {
      userId: currentUserId,
      age: parseNumber(values.age),
      gender: values.gender,
      height,
      weight,
      targetWeight: values.goal === "lose_weight"
        ? Math.max(35, weight - 5)
        : values.goal === "build_muscle"
        ? weight + 3
        : weight,
      goal: mappedGoal,
      trainingFrequency: mappedTrainingFrequency,
      trainingDaysPerWeek: parseNumber(values.trainingDaysPerWeek),
      preferences: values.preferences,
      specificGoal: values.specificGoal.trim(),
      allergies: values.allergies,
      dietPreference: values.dietPreference,
      bmi,
      recommendedCalories: Math.max(1200, Math.round(weight * 30)),
      macros: null,
    };

    setError("");
    setIsSubmitting(true);

    try {
      const result = await initializeUserData(currentUserId, profilePayload);

      const updatedUser = {
        ...currentUser,
        profile: result.profile,
        onboardingCompleted: true,
      };

      localStorage.setItem("fituser", JSON.stringify(updatedUser));
      localStorage.removeItem(draftKey(currentUserId));
      setCurrentUser(updatedUser);
      setOnboardingCompletedLocal(currentUserId, true);
      setOnboardingCompletionProofLocal(currentUserId, true);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Không thể hoàn tất onboarding lúc này. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-3">
            <Label>Chọn giới tính</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { value: "male", label: "Nam" },
                { value: "female", label: "Nữ" },
                { value: "other", label: "Khác" },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => patchForm({ gender: item.value })}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    values.gender === item.value
                      ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-2">
            <Label htmlFor="age">Tuổi</Label>
            <Input
              id="age"
              type="number"
              min={13}
              max={80}
              value={values.age}
              onChange={(event) => patchForm({ age: event.target.value })}
              placeholder="Ví dụ: 28"
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-2">
            <Label htmlFor="height">Chiều cao (cm)</Label>
            <Input
              id="height"
              type="number"
              min={100}
              max={230}
              value={values.heightCm}
              onChange={(event) => patchForm({ heightCm: event.target.value })}
              placeholder="Ví dụ: 170"
            />
          </div>
        );
      case 4:
        return (
          <div className="space-y-2">
            <Label htmlFor="weight">Cân nặng hiện tại (kg)</Label>
            <Input
              id="weight"
              type="number"
              min={30}
              max={250}
              value={values.weightKg}
              onChange={(event) => patchForm({ weightKg: event.target.value })}
              placeholder="Ví dụ: 68"
            />
          </div>
        );
      case 5:
        return (
          <div className="space-y-3">
            <Label>Mục tiêu chính</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {goalOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => patchForm({ goal: item.value })}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    values.goal === item.value
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-3">
            <Label>Mức độ vận động</Label>
            <div className="space-y-2">
              {activityOptions.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => patchForm({ activityLevel: item.value })}
                  className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    values.activityLevel === item.value
                      ? "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Số ngày tập mỗi tuần</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {trainingDaysOptions.map((dayCount) => {
                  const selected = parseNumber(values.trainingDaysPerWeek) === dayCount;
                  return (
                    <button
                      key={dayCount}
                      type="button"
                      onClick={() => patchForm({ trainingDaysPerWeek: String(dayCount) })}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        selected
                          ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {dayCount} ngày
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">Mẹo: Người mới thường phù hợp 3-4 ngày/tuần để dễ duy trì lâu dài.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specificGoal">Mục tiêu cụ thể</Label>
              <Textarea
                id="specificGoal"
                value={values.specificGoal}
                onChange={(event) => patchForm({ specificGoal: event.target.value })}
                placeholder="Ví dụ: Giảm 5kg trong 12 tuần, tập 4 buổi/tuần, ưu tiên giảm mỡ bụng"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Chế độ ăn ưu tiên (khuyến nghị)</Label>
              <div className="grid grid-cols-2 gap-2">
                {dietOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => patchForm({ dietPreference: item.value })}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      values.dietPreference === item.value
                        ? "border-violet-400 bg-violet-50 text-violet-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sở thích tập luyện (khuyến nghị)</Label>
              <div className="flex flex-wrap gap-2">
                {preferenceOptions.map((item) => {
                  const selected = values.preferences.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        const next = selected
                          ? values.preferences.filter((x: string) => x !== item)
                          : [...values.preferences, item];
                        patchForm({ preferences: next });
                      }}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        selected
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Dị ứng (nếu có, cách nhau bởi dấu phẩy)</Label>
              <Input
                id="allergies"
                value={values.allergies}
                onChange={(event) => patchForm({ allergies: event.target.value })}
                placeholder="Ví dụ: hải sản, sữa bò"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const stepIcon = () => {
    switch (step) {
      case 1:
        return <VenusAndMars className="h-5 w-5" />;
      case 2:
        return <UserRound className="h-5 w-5" />;
      case 3:
        return <Target className="h-5 w-5" />;
      case 4:
        return <Scale className="h-5 w-5" />;
      case 5:
        return <HeartPulse className="h-5 w-5" />;
      case 6:
        return <Footprints className="h-5 w-5" />;
      case 7:
        return <CalendarDays className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.12),transparent_42%),radial-gradient(circle_at_82%_10%,rgba(14,165,233,0.12),transparent_36%),#f8fafc] px-4 py-8">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_55px_-30px_rgba(15,23,42,0.45)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700">Quy trình thiết lập và tối ưu mục tiêu thể hình</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">{currentStepMeta.title}</h1>
            <p className="mt-1 text-sm text-slate-700">{currentStepMeta.subtitle}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
            {stepIcon()}
            <span>Bước {step}/7</span>
          </div>
        </div>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all" style={{ width: `${progress}%` }} />
        </div>

        {currentStepMeta.imageUrl ? (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <img src={currentStepMeta.imageUrl} alt={currentStepMeta.title} className="h-44 w-full object-cover" />
          </div>
        ) : null}

        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5">{renderStepContent()}</div>

        {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || isSubmitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>

          {step < 7 ? (
            <Button type="button" onClick={goNext} disabled={isSubmitting}>
              Tiếp tục
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={() => void completeOnboarding()} disabled={isSubmitting}>
              {isSubmitting ? "Đang tạo dữ liệu..." : "Hoàn tất và tạo kế hoạch"}
              <CheckCircle2 className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router";
import { Activity, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent } from "./ui/card";
import { Progress } from "./ui/progress";
import { getCurrentUser, createUserProfile, UserProfileData, setCurrentUser } from "../../services/authService";

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    height: "",
    weight: "",
    targetWeight: "",
    goal: "",
    experienceLevel: "beginner",
    activityLevel: "",
    dietPreference: "",
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      alert("Vui lòng đăng nhập trước khi hoàn tất onboarding.");
      navigate("/login");
      return;
    }

    setIsSaving(true);
    try {
      const profile: UserProfileData = {
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        fitnessGoal: formData.goal,
        experienceLevel: formData.experienceLevel || "beginner",
        activityLevel: formData.activityLevel,
      };
      await createUserProfile(currentUser.id, profile);

      const updatedUser = {
        ...currentUser,
        ...formData,
        onboardingCompleted: true,
      };
      setCurrentUser(updatedUser);

      alert("Hoàn tất hồ sơ! Chuyển tới dashboard.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Lưu hồ sơ thất bại", error);
      alert("Không thể lưu thông tin ngay bây giờ. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.gender && formData.age;
      case 2:
        return formData.height && formData.weight && formData.targetWeight;
      case 3:
        return formData.goal;
      case 4:
        return formData.activityLevel && formData.dietPreference && formData.experienceLevel;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            FitLife Pro
          </h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Bước {step} / {totalSteps}
            </span>
            <span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-2xl border-none">
          <CardContent className="pt-8 pb-8">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">Xin chào! 👋</h2>
                  <p className="text-gray-600">Hãy cho chúng tôi biết thêm về bạn</p>
                </div>

                <div>
                  <Label className="text-base">Giới tính</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: "Nam" })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.gender === "Nam"
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-4xl mb-2">👨</div>
                      <div className="font-semibold">Nam</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: "Nữ" })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.gender === "Nữ"
                          ? "border-pink-600 bg-pink-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-4xl mb-2">👩</div>
                      <div className="font-semibold">Nữ</div>
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="age" className="text-base">Tuổi của bạn</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="25"
                    className="mt-2 text-lg p-6"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Body Metrics */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">Thông số cơ thể 📏</h2>
                  <p className="text-gray-600">Giúp chúng tôi tính toán chính xác</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="height" className="text-base">Chiều cao (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="170"
                      className="mt-2 text-lg p-6"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight" className="text-base">Cân nặng (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70"
                      className="mt-2 text-lg p-6"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="targetWeight" className="text-base">Cân nặng mục tiêu (kg)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    step="0.1"
                    placeholder="65"
                    className="mt-2 text-lg p-6"
                    value={formData.targetWeight}
                    onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                  />
                  {formData.weight && formData.targetWeight && (
                    <p className="text-sm text-gray-500 mt-2">
                      {parseFloat(formData.targetWeight) < parseFloat(formData.weight)
                        ? `Giảm ${(parseFloat(formData.weight) - parseFloat(formData.targetWeight)).toFixed(1)} kg`
                        : `Tăng ${(parseFloat(formData.targetWeight) - parseFloat(formData.weight)).toFixed(1)} kg`}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Goals */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">Mục tiêu của bạn 🎯</h2>
                  <p className="text-gray-600">Bạn muốn đạt được điều gì?</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { value: "lose", emoji: "🔥", title: "Giảm cân", desc: "Đốt cháy mỡ thừa" },
                    { value: "maintain", emoji: "⚖️", title: "Duy trì", desc: "Giữ vóc dáng hiện tại" },
                    { value: "gain", emoji: "📈", title: "Tăng cân", desc: "Tăng cân nặng lành mạnh" },
                    { value: "muscle", emoji: "💪", title: "Tăng cơ", desc: "Xây dựng cơ bắp" },
                  ].map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, goal: goal.value })}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.goal === goal.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{goal.emoji}</div>
                        <div>
                          <div className="font-semibold text-lg">{goal.title}</div>
                          <div className="text-sm text-gray-600">{goal.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Activity & Diet */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold mb-2">Thông tin bổ sung 🏃</h2>
                  <p className="text-gray-600">Gần xong rồi!</p>
                </div>

                <div>
                  <Label className="text-base">Mức độ vận động</Label>
                  <div className="grid grid-cols-1 gap-3 mt-2">
                    {[
                      { value: "sedentary", title: "Ít vận động", desc: "Chủ yếu ngồi, ít hoạt động" },
                      { value: "light", title: "Vận động nhẹ", desc: "Tập 1-2 lần/tuần" },
                      { value: "moderate", title: "Vận động vừa", desc: "Tập 3-5 lần/tuần" },
                      { value: "active", title: "Vận động nhiều", desc: "Tập 6-7 lần/tuần" },
                    ].map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, activityLevel: level.value })}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          formData.activityLevel === level.value
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-semibold">{level.title}</div>
                        <div className="text-sm text-gray-600">{level.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base">Kinh nghiệm tập luyện</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { value: "beginner", title: "Mới bắt đầu" },
                      { value: "intermediate", title: "Trung cấp" },
                      { value: "advanced", title: "Nâng cao" },
                      { value: "expert", title: "Chuyên nghiệp" },
                    ].map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, experienceLevel: level.value })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.experienceLevel === level.value
                            ? "border-indigo-600 bg-indigo-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="font-semibold text-sm">{level.title}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-base">Chế độ ăn ưu tiên</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { value: "normal", emoji: "🍽️", title: "Tất cả" },
                      { value: "vegetarian", emoji: "🥗", title: "Chay" },
                      { value: "keto", emoji: "🥑", title: "Keto" },
                      { value: "lowcarb", emoji: "🍗", title: "Low Carb" },
                    ].map((diet) => (
                      <button
                        key={diet.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, dietPreference: diet.value })}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.dietPreference === diet.value
                            ? "border-green-600 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="text-2xl mb-1">{diet.emoji}</div>
                        <div className="font-semibold text-sm">{diet.title}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center gap-4 mt-8">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" />
                  Quay lại
                </Button>
              )}
              <Button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {step === totalSteps ? "Hoàn tất" : "Tiếp theo"}
                {step < totalSteps && <ChevronRight className="w-5 h-5 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Thông tin của bạn được bảo mật và chỉ dùng để cá nhân hóa trải nghiệm
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, Coffee, UtensilsCrossed, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { getCurrentUser } from "../../services/authService";
import { saveProgress } from "../../services/fitnessService";

interface Meal {
  id: string;
  name: string;
  type: "Sáng" | "Trưa" | "Tối" | "Phụ";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function NutritionTracker() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [newMeal, setNewMeal] = useState({
    name: "",
    type: "Sáng" as "Sáng" | "Trưa" | "Tối" | "Phụ",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [progressId, setProgressId] = useState<number | null>(null);
  const [progress, setProgress] = useState({
    weight: "70",
    bodyFat: "20",
    caloriesBurned: "350",
    workoutMinutes: "45",
  });
  const [lastSaved, setLastSaved] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>("");

  const user = getCurrentUser();

  useEffect(() => {
    setMeals([
      { id: "1", name: "Yến mạch với chuối", type: "Sáng", calories: 380, protein: 12, carbs: 60, fat: 12 },
      { id: "2", name: "Cơm gà nướng", type: "Trưa", calories: 620, protein: 44, carbs: 70, fat: 16 },
    ]);
  }, []);

  const handleAddMeal = () => {
    if (!newMeal.name || !newMeal.calories) return;
    setMeals((prev) => [
      { id: Date.now().toString(), name: newMeal.name, type: newMeal.type, calories: parseInt(newMeal.calories), protein: parseInt(newMeal.protein) || 0, carbs: parseInt(newMeal.carbs) || 0, fat: parseInt(newMeal.fat) || 0 },
      ...prev,
    ]);
    setNewMeal({ name: "", type: "Sáng", calories: "", protein: "", carbs: "", fat: "" });
    setIsDialogOpen(false);
  };

  const handleSaveProgress = async () => {
    if (!user) {
      alert("Bạn cần đăng nhập để lưu tiến trình.");
      return;
    }

    setIsSaving(true);
    setSaveError("");

    try {
      const savedProgress = await saveProgress(progressId, user.id, {
        weight: Number(progress.weight),
        bodyFat: Number(progress.bodyFat),
        caloriesBurned: Number(progress.caloriesBurned),
        workoutMinutes: Number(progress.workoutMinutes),
      });

      if (savedProgress.id) {
        setProgressId(savedProgress.id);
      }

      setLastSaved(new Date().toLocaleString("vi-VN"));
      alert("Lưu tiến trình thành công.");
    } catch (error) {
      console.error(error);
      setSaveError("Lưu tiến trình thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const protein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const carbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const fat = meals.reduce((sum, meal) => sum + meal.fat, 0);
  const calorieGoal = 2000;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Theo dõi dinh dưỡng</h2>
          <p className="text-gray-500 mt-1">Nhận dữ liệu và lưu tiến trình thật từ API</p>
        </div>
        <Button onClick={handleSaveProgress} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          {isSaving ? "Đang lưu..." : "Lưu tiến độ vào backend"}
        </Button>
      </div>
      {saveError && <p className="text-red-600 mt-2">{saveError}</p>}

      <Card>
        <CardHeader>
          <CardTitle>Tiến trình dinh dưỡng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cân nặng (kg)</Label>
              <Input value={progress.weight} onChange={(e) => setProgress((prev) => ({ ...prev, weight: e.target.value }))} />
            </div>
            <div>
              <Label>Body fat (%)</Label>
              <Input value={progress.bodyFat} onChange={(e) => setProgress((prev) => ({ ...prev, bodyFat: e.target.value }))} />
            </div>
            <div>
              <Label>Calories đốt cháy</Label>
              <Input value={progress.caloriesBurned} onChange={(e) => setProgress((prev) => ({ ...prev, caloriesBurned: e.target.value }))} />
            </div>
            <div>
              <Label>Phút tập luyện</Label>
              <Input value={progress.workoutMinutes} onChange={(e) => setProgress((prev) => ({ ...prev, workoutMinutes: e.target.value }))} />
            </div>
          </div>
          {lastSaved && <p className="text-sm text-green-600 mt-2">Đã lưu: {lastSaved}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bữa ăn</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-sm text-gray-500">Tổng kcal hiện tại</p>
              <p className="text-xl font-bold">{totalCalories} kcal</p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)} size="sm" className="bg-blue-600 hover:bg-blue-700">Thêm bữa ăn</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {meals.map((meal) => (
              <div key={meal.id} className="border rounded-md p-3">
                <div className="flex justify-between">
                  <p className="font-semibold">{meal.name}</p>
                  <Badge>{meal.type}</Badge>
                </div>
                <p className="text-sm text-gray-600">{meal.calories} kcal • P{meal.protein} C{meal.carbs} F{meal.fat}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm bữa ăn</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-3">
            <div>
              <Label>Tên món</Label>
              <Input value={newMeal.name} onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })} />
            </div>
            <div>
              <Label>Loại</Label>
              <select className="w-full border rounded-md px-2 py-2" value={newMeal.type} onChange={(e) => setNewMeal({ ...newMeal, type: e.target.value as any })}>
                <option value="Sáng">Sáng</option>
                <option value="Trưa">Trưa</option>
                <option value="Tối">Tối</option>
                <option value="Phụ">Phụ</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" value={newMeal.calories} onChange={(e) => setNewMeal({ ...newMeal, calories: e.target.value })} />
              <Input type="number" value={newMeal.protein} onChange={(e) => setNewMeal({ ...newMeal, protein: e.target.value })} />
              <Input type="number" value={newMeal.carbs} onChange={(e) => setNewMeal({ ...newMeal, carbs: e.target.value })} />
              <Input type="number" value={newMeal.fat} onChange={(e) => setNewMeal({ ...newMeal, fat: e.target.value })} />
            </div>
            <Button onClick={handleAddMeal} className="w-full bg-blue-600 hover:bg-blue-700">Lưu bữa ăn</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

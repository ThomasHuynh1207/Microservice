import { useState } from "react";
import { Sparkles, RefreshCw, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface MealPlan {
  breakfast: string[];
  lunch: string[];
  dinner: string[];
  snacks: string[];
}

const mealDatabase = {
  breakfast: [
    { name: "Yến mạch với chuối & hạt chia", calories: 380, protein: 12, carbs: 60, fat: 12 },
    { name: "Bánh mì nguyên cám trứng & rau", calories: 420, protein: 18, carbs: 45, fat: 16 },
    { name: "Sữa chua Hy Lạp với quả việt quất", calories: 320, protein: 20, carbs: 40, fat: 8 },
    { name: "Smoothie xoài, rau chân vịt & protein", calories: 350, protein: 25, carbs: 48, fat: 6 },
  ],
  lunch: [
    { name: "Cơm gạo lứt + ức gà nướng + rau xào", calories: 650, protein: 45, carbs: 70, fat: 16 },
    { name: "Salad cá hồi + khoai lang + bơ", calories: 580, protein: 38, carbs: 50, fat: 24 },
    { name: "Mì soba + thịt bò xào + súp lơ xanh", calories: 620, protein: 40, carbs: 65, fat: 18 },
    { name: "Quinoa bowl + tôm nướng + rau củ", calories: 590, protein: 42, carbs: 55, fat: 20 },
  ],
  dinner: [
    { name: "Cá hồi nướng + khoai tây nghiền + rau", calories: 520, protein: 38, carbs: 45, fat: 22 },
    { name: "Ức gà áp chảo + cơm gạo lứt + đậu que", calories: 580, protein: 42, carbs: 60, fat: 14 },
    { name: "Phở gà ít dầu + rau thơm", calories: 480, protein: 35, carbs: 55, fat: 12 },
    { name: "Thịt bò xào + cơm lứt + canh rau", calories: 600, protein: 40, carbs: 62, fat: 18 },
  ],
  snacks: [
    { name: "Hạt hỗn hợp (30g)", calories: 180, protein: 6, carbs: 8, fat: 14 },
    { name: "Táo + bơ đậu phộng", calories: 220, protein: 8, carbs: 28, fat: 10 },
    { name: "Sữa chua Hy Lạp với mật ong", calories: 160, protein: 15, carbs: 20, fat: 3 },
    { name: "Protein bar", calories: 200, protein: 20, carbs: 22, fat: 8 },
  ],
};

export function MealPlanner() {
  const [goal, setGoal] = useState<string>("maintain");
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMealPlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const plan: MealPlan = {
        breakfast: [mealDatabase.breakfast[Math.floor(Math.random() * mealDatabase.breakfast.length)].name],
        lunch: [mealDatabase.lunch[Math.floor(Math.random() * mealDatabase.lunch.length)].name],
        dinner: [mealDatabase.dinner[Math.floor(Math.random() * mealDatabase.dinner.length)].name],
        snacks: [mealDatabase.snacks[Math.floor(Math.random() * mealDatabase.snacks.length)].name],
      };
      setMealPlan(plan);
      setIsGenerating(false);
    }, 1000);
  };

  const getGoalDescription = (goal: string) => {
    switch (goal) {
      case "lose":
        return "Giảm cân: Thâm hụt 300-500 calories";
      case "gain":
        return "Tăng cân: Thặng dư 300-500 calories";
      case "muscle":
        return "Tăng cơ: Thặng dư nhẹ + protein cao";
      default:
        return "Duy trì: Cân bằng calories";
    }
  };

  const getTotalNutrition = () => {
    if (!mealPlan) return null;
    
    let totalCal = 0;
    let totalProt = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const allMeals = [
      ...mealPlan.breakfast,
      ...mealPlan.lunch,
      ...mealPlan.dinner,
      ...mealPlan.snacks,
    ];

    allMeals.forEach(mealName => {
      Object.values(mealDatabase).flat().forEach(meal => {
        if (meal.name === mealName) {
          totalCal += meal.calories;
          totalProt += meal.protein;
          totalCarbs += meal.carbs;
          totalFat += meal.fat;
        }
      });
    });

    return { calories: totalCal, protein: totalProt, carbs: totalCarbs, fat: totalFat };
  };

  const nutrition = getTotalNutrition();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">Lập kế hoạch thực đơn</h2>
        <p className="text-gray-500 mt-2">Tạo thực đơn cá nhân hóa theo mục tiêu của bạn</p>
      </div>

      {/* Goal Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn mục tiêu của bạn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={goal} onValueChange={setGoal}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose">🎯 Giảm cân</SelectItem>
              <SelectItem value="maintain">⚖️ Duy trì cân nặng</SelectItem>
              <SelectItem value="gain">📈 Tăng cân</SelectItem>
              <SelectItem value="muscle">💪 Tăng cơ bắp</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <strong>Mục tiêu hiện tại:</strong> {getGoalDescription(goal)}
          </p>
          <Button
            onClick={generateMealPlan}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Đang tạo thực đơn...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Tạo thực đơn ngẫu nhiên
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Meal Plan */}
      {mealPlan && nutrition && (
        <>
          {/* Nutrition Summary */}
          <Card className="bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Tổng dinh dưỡng trong ngày</p>
                  <p className="text-3xl font-bold mt-1">{nutrition.calories} kcal</p>
                </div>
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{nutrition.protein}g</p>
                    <p className="text-xs text-gray-600">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{nutrition.carbs}g</p>
                    <p className="text-xs text-gray-600">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">{nutrition.fat}g</p>
                    <p className="text-xs text-gray-600">Fat</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meal Cards */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="bg-amber-50">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-amber-900">Bữa sáng</CardTitle>
                  <Badge variant="secondary" className="ml-auto">7:00 - 9:00</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {mealPlan.breakfast.map((meal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <p className="font-medium">{meal}</p>
                    {mealDatabase.breakfast.find(m => m.name === meal) && (
                      <Badge variant="outline">
                        {mealDatabase.breakfast.find(m => m.name === meal)?.calories} kcal
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-orange-50">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-orange-900">Bữa trưa</CardTitle>
                  <Badge variant="secondary" className="ml-auto">12:00 - 13:30</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {mealPlan.lunch.map((meal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <p className="font-medium">{meal}</p>
                    {mealDatabase.lunch.find(m => m.name === meal) && (
                      <Badge variant="outline">
                        {mealDatabase.lunch.find(m => m.name === meal)?.calories} kcal
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-indigo-50">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-indigo-600" />
                  <CardTitle className="text-indigo-900">Bữa tối</CardTitle>
                  <Badge variant="secondary" className="ml-auto">18:00 - 20:00</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {mealPlan.dinner.map((meal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <p className="font-medium">{meal}</p>
                    {mealDatabase.dinner.find(m => m.name === meal) && (
                      <Badge variant="outline">
                        {mealDatabase.dinner.find(m => m.name === meal)?.calories} kcal
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-green-50">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-green-900">Bữa phụ</CardTitle>
                  <Badge variant="secondary" className="ml-auto">15:00 - 16:00</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                {mealPlan.snacks.map((meal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <p className="font-medium">{meal}</p>
                    {mealDatabase.snacks.find(m => m.name === meal) && (
                      <Badge variant="outline">
                        {mealDatabase.snacks.find(m => m.name === meal)?.calories} kcal
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Empty State */}
      {!mealPlan && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Chọn mục tiêu và nhấn "Tạo thực đơn" để bắt đầu</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Plus, Clock3, Flame, List, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { getCurrentUser } from "../../services/authService";
import { createWorkout, fetchWorkouts, WorkoutPlan } from "../../services/fitnessService";

export function WorkoutTracker() {
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] = useState({
    title: "",
    goal: "Tăng cường sức khỏe",
    planContent: "",
  });

  const user = getCurrentUser();

  const loadWorkouts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await fetchWorkouts(user.id);
      setWorkouts(data);
    } catch (error) {
      console.error("Lấy workouts thất bại", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const handleAddWorkout = async () => {
    if (!form.title || !form.planContent) return;
    if (!user) {
      alert("Bạn cần đăng nhập để lưu dữ liệu.");
      return;
    }

    setIsLoading(true);
    try {
      const newWorkout = await createWorkout(user.id, form.title, form.planContent, form.goal);
      setWorkouts((prev) => [newWorkout, ...prev]);
      setForm({ title: "", goal: "Tăng cường sức khỏe", planContent: "" });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Tạo workout thất bại", error);
      alert("Không thể lưu kế hoạch tập luyện. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Kế hoạch tập luyện</h2>
          <p className="text-gray-500 mt-1">Lấy dữ liệu thật từ backend và lưu kế hoạch cá nhân</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Thêm kế hoạch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Tạo kế hoạch mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-3">
              <div>
                <Label>Tiêu đề</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kế hoạch Fullbody" />
              </div>
              <div>
                <Label>Mục tiêu</Label>
                <Input value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} placeholder="Tăng cơ" />
              </div>
              <div>
                <Label>Nội dung kế hoạch</Label>
                <textarea
                  className="w-full border rounded-md p-2"
                  value={form.planContent}
                  onChange={(e) => setForm({ ...form, planContent: e.target.value })}
                  placeholder="- Squat 3x12\n- Bench press 3x10"
                  rows={5}
                />
              </div>
              <Button onClick={handleAddWorkout} className="w-full bg-blue-600 hover:bg-blue-700">
                Lưu kế hoạch
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent>
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-blue-100 rounded-full"><List className="w-5 h-5 text-blue-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Số kế hoạch</p>
                <p className="text-2xl font-bold">{workouts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-orange-100 rounded-full"><Flame className="w-5 h-5 text-orange-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Load status</p>
                <p className="text-2xl font-bold">{isLoading ? "Đang tải..." : "Sẵn sàng"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-green-100 rounded-full"><Clock3 className="w-5 h-5 text-green-600" /></div>
              <div>
                <p className="text-sm text-gray-500">Kế hoạch mới nhất</p>
                <p className="text-xl font-bold">{workouts[0]?.title || "Chưa có"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách kế hoạch</CardTitle>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center text-gray-500 p-8">Không có kế hoạch nào. Hãy tạo kế hoạch mới.</div>
          ) : (
            <div className="space-y-3">
              {workouts.map((item) => (
                <div key={item.id} className="border rounded-lg p-3 hover:shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-lg">{item.title}</p>
                      <p className="text-sm text-gray-500 mt-1">Mục tiêu: {item.goal || "Không xác định"}</p>
                    </div>
                    <Badge variant="secondary">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</Badge>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{item.planContent}</pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

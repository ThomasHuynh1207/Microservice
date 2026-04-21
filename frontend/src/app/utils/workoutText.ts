const exerciseNameMap: Record<string, string> = {
  "bench press": "Đẩy ngực đòn",
  "incline bench press": "Đẩy ngực dốc lên",
  "incline dumbbell press": "Đẩy ngực dốc lên bằng tạ đơn",
  "dumbbell bench press": "Đẩy ngực tạ đơn",
  "shoulder press": "Đẩy vai",
  "lat pulldown": "Kéo xô",
  "seated row": "Kéo cáp ngồi",
  "biceps curl": "Cuốn tạ tay trước",
  "dumbbell row": "Kéo tạ đơn",
  "squat": "Squat",
  "goblet squat": "Squat ôm tạ trước ngực",
  "romanian deadlift": "Kéo tạ kiểu Romania",
  "deadlift": "Kéo tạ",
  "hip thrust": "Đẩy hông",
  "lateral raise": "Nâng tay ngang",
  "plank": "Plank",
  "push-up": "Chống đẩy",
  "push up": "Chống đẩy",
  "tricep pushdown": "Đẩy cáp tay sau",
  "overhead tricep extension": "Duỗi tay sau qua đầu",
  "hammer curl": "Cuốn tay trước kiểu búa",
  "mountain climbers": "Leo núi",
  "burpee": "Burpee",
  "farmer's carry": "Đi bộ xách tạ",
  "farmer carry": "Đi bộ xách tạ",
  "dead bug": "Dead bug",
};

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const translateExerciseName = (value: string) => {
  const normalized = normalizeName(value);
  return exerciseNameMap[normalized] || value;
};
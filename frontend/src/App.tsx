import {
  Activity,
  Award,
  BarChart2,
  Bell,
  Bike,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  CreditCard,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Globe,
  Heart,
  Lock,
  LogOut,
  Map,
  MapPin,
  Medal,
  Menu,
  Navigation,
  MessageCircle,
  Mountain,
  Route,
  Salad,
  Search,
  Send,
  Settings,
  Share2,
  Sparkles,
  TrendingUp,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Utensils,
  Watch,
  Waves,
  X,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Page = "dashboard" | "training" | "maps" | "nutrition" | "community" | "ai" | "admin";
type Sport = "RUN" | "SWIM";
type ActivityMode = "RUN" | "TRAIL" | "WALK" | "HIKE" | "BIKE" | "MTB" | "SWIM" | "GYM" | "YOGA" | "OTHER";
type ChallengeSport = Sport | "MIXED";

type Session = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role?: string;
  onboardingCompleted: boolean;
  premiumActive?: boolean;
};

type AthleteProfile = {
  userId: number;
  displayName: string;
  city: string;
  bio?: string;
  primaryGoal: string;
  experienceLevel?: string;
  weeklyRunGoalKm: number;
  weeklySwimGoalMeters: number;
  nutritionFocus: string;
  completedOnboarding: boolean;
  gender?: string;
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
};

type FitnessActivity = {
  id: number;
  userId: number;
  athleteName: string;
  sportType: Sport;
  title: string;
  description: string;
  startedAt: string;
  durationMinutes: number;
  distanceMeters: number;
  averageHeartRate?: number;
  calories?: number;
  elevationGainMeters?: number;
  poolLengthMeters?: number;
  strokes?: number;
  routeName?: string;
  visibility?: string;
  gpsRouteJson?: string;
  averagePaceSecondsPerKm?: number;
};

type Stats = {
  weeklyRunKm: number;
  weeklySwimMeters: number;
  weeklyMinutes: number;
  weeklySessions: number;
  monthlyRunKm: number;
  monthlySwimMeters: number;
};

type NutritionPlan = {
  goal: string;
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  hydrationLiters: number;
  guidance: string;
};

type MealEntry = {
  id: number;
  mealType: string;
  name: string;
  foodId?: number;
  servings?: number;
  servingSize?: string;
  eatenAt?: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

type FoodItem = {
  id: number;
  name: string;
  category: string;
  servingSize: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  active?: boolean;
  aliases?: string;
  note?: string;
};

type RecoverySuggestion = {
  message: string;
  burnedCalories: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  mealIdeas: string[];
};

type TrainingDay = {
  id: string;
  day: string;
  sport: Sport | "REST";
  title: string;
  detail: string;
  duration: string;
  done: boolean;
};

type RouteItem = {
  id: number;
  name: string;
  sportType: Sport;
  place?: string;
  distanceMeters: number;
  note: string;
  createdBy?: number;
  geoJson?: string;
  visibility?: string;
  activityId?: number;
};

type NominatimPlace = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

type Challenge = {
  id: string;
  title: string;
  sportType: ChallengeSport;
  target: string;
  progress: number;
  note: string;
  joined: boolean;
};

type Post = {
  id: number;
  userId: number;
  authorName: string;
  title?: string;
  content: string;
  sportType?: Sport;
  distanceMeters?: number;
  durationMinutes?: number;
  calories?: number;
  routeName?: string;
  likes: number;
  liked: boolean;
  comments: PostComment[];
  commentCount: number;
  createdAt: string;
};

type PostComment = {
  id: number;
  userId?: number;
  authorName: string;
  content: string;
  createdAt: string;
};

type FollowSummary = {
  userId: number;
  displayName: string;
  city?: string;
  primaryGoal?: string;
  experienceLevel?: string;
};

type Badge = {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
};

const API = "/api";

const demoSession: Session = {
  token: "demo",
  userId: 1,
  fullName: "Mèo Mũ Vận Học",
  email: "runner@example.com",
  onboardingCompleted: true,
};

const fallbackProfile: AthleteProfile = {
  userId: 1,
  displayName: "Mèo Mũ Vận Học",
  city: "Ho Chi Minh City",
  bio: "Tập chạy và bơi để khỏe hơn mỗi tuần.",
  primaryGoal: "Chạy đều 35 km và bơi 3.200 m mỗi tuần",
  experienceLevel: "INTERMEDIATE",
  weeklyRunGoalKm: 35,
  weeklySwimGoalMeters: 3200,
  nutritionFocus: "Nạp năng lượng cho sức bền",
  completedOnboarding: true,
  gender: "Nam",
  dateOfBirth: "1995-06-15",
  heightCm: 172,
  weightKg: 68,
};

const fallbackStats: Stats = {
  weeklyRunKm: 0,
  weeklySwimMeters: 0,
  weeklyMinutes: 0,
  weeklySessions: 0,
  monthlyRunKm: 0,
  monthlySwimMeters: 0,
};

const fallbackActivities: FitnessActivity[] = [];

const fallbackPlan: NutritionPlan = {
  goal: "Ăn đủ năng lượng cho ngày chạy và ngày bơi.",
  dailyCalories: 2450,
  proteinGrams: 135,
  carbsGrams: 330,
  fatGrams: 70,
  hydrationLiters: 2.8,
  guidance: "Ưu tiên carb trước buổi chạy, protein sau buổi bơi và bổ sung điện giải khi tập trong thời tiết nóng.",
};

const initialTrainingPlan: TrainingDay[] = [
  { id: "mon", day: "Thứ 2", sport: "RUN", title: "Chạy dễ", detail: "Giữ nhịp thở nói chuyện được, không ép pace.", duration: "35 phút", done: false },
  { id: "tue", day: "Thứ 3", sport: "SWIM", title: "Kỹ thuật freestyle", detail: "300m khởi động, 6x100m đều, 200m thả lỏng.", duration: "1.500 m", done: false },
  { id: "wed", day: "Thứ 4", sport: "RUN", title: "Tempo ngắn", detail: "10 phút khởi động, 3x6 phút nhanh vừa, nghỉ 2 phút.", duration: "45 phút", done: false },
  { id: "thu", day: "Thứ 5", sport: "REST", title: "Phục hồi", detail: "Đi bộ nhẹ, giãn cơ, ngủ đủ.", duration: "20 phút", done: false },
  { id: "fri", day: "Thứ 6", sport: "SWIM", title: "Bơi sức bền", detail: "4x300m ổn định, tập stroke dài.", duration: "1.800 m", done: false },
  { id: "sat", day: "Thứ 7", sport: "RUN", title: "Long run", detail: "Tốc độ dễ, nạp nước nếu trên 60 phút.", duration: "70 phút", done: false },
  { id: "sun", day: "Chủ nhật", sport: "REST", title: "Đánh giá tuần", detail: "Ghi cảm nhận, chuẩn bị dinh dưỡng tuần mới.", duration: "15 phút", done: false },
];


const ALL_BADGES: Badge[] = [
  { id: "first_run", title: "Cú Chạy Đầu Tiên", description: "Ghi nhận buổi chạy bộ đầu tiên", icon: "🏃", earned: false },
  { id: "first_swim", title: "Lần Bơi Đầu Tiên", description: "Ghi nhận buổi bơi đầu tiên", icon: "🏊", earned: false },
  { id: "5k", title: "5K Club", description: "Hoàn thành 5km trong một buổi chạy", icon: "5️⃣", earned: false },
  { id: "10k", title: "10K Runner", description: "Hoàn thành 10km trong một buổi chạy", icon: "🔟", earned: false },
  { id: "50k_month", title: "50K Tháng", description: "Chạy tổng 50km trong một tháng", icon: "📅", earned: false },
  { id: "1000m_swim", title: "Kilomet Nước", description: "Bơi 1000m trong một buổi tập", icon: "🌊", earned: false },
  { id: "5_sessions", title: "Siêng Năng", description: "Ghi nhận 5 buổi tập", icon: "⚡", earned: false },
  { id: "early_bird", title: "Dậy Sớm", description: "Ghi nhận 3 buổi tập trước 7h sáng", icon: "🌅", earned: false },
];

function computeBadges(activities: FitnessActivity[]): Badge[] {
  const hasRun = activities.some((a) => a.sportType === "RUN");
  const hasSwim = activities.some((a) => a.sportType === "SWIM");
  const has5k = activities.some((a) => a.sportType === "RUN" && a.distanceMeters >= 5000);
  const has10k = activities.some((a) => a.sportType === "RUN" && a.distanceMeters >= 10000);
  const monthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const monthlyRunKm = activities
    .filter((a) => a.sportType === "RUN" && new Date(a.startedAt).getTime() >= monthStart)
    .reduce((s, a) => s + a.distanceMeters / 1000, 0);
  const has1000mSwim = activities.some((a) => a.sportType === "SWIM" && a.distanceMeters >= 1000);
  const has5Sessions = activities.length >= 5;
  const earlyBirdCount = activities.filter((a) => {
    const h = new Date(a.startedAt).getHours();
    return h < 7;
  }).length;

  return ALL_BADGES.map((badge) => ({
    ...badge,
    earned:
      (badge.id === "first_run" && hasRun) ||
      (badge.id === "first_swim" && hasSwim) ||
      (badge.id === "5k" && has5k) ||
      (badge.id === "10k" && has10k) ||
      (badge.id === "50k_month" && monthlyRunKm >= 50) ||
      (badge.id === "1000m_swim" && has1000mSwim) ||
      (badge.id === "5_sessions" && has5Sessions) ||
      (badge.id === "early_bird" && earlyBirdCount >= 3),
  }));
}

function buildWeeklyChartData(activities: FitnessActivity[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
    const dayActs = activities.filter((a) => new Date(a.startedAt).toDateString() === date.toDateString());
    return {
      name: date.toLocaleDateString("vi-VN", { weekday: "short" }),
      "Chạy (km)": +dayActs.filter((a) => a.sportType === "RUN").reduce((s, a) => s + a.distanceMeters / 1000, 0).toFixed(1),
      "Bơi (100m)": +(dayActs.filter((a) => a.sportType === "SWIM").reduce((s, a) => s + a.distanceMeters, 0) / 100).toFixed(1),
      Calories: dayActs.reduce((s, a) => s + (a.calories ?? 0), 0),
    };
  });
}

function buildMonthlyChartData(activities: FitnessActivity[]) {
  return Array.from({ length: 4 }, (_, i) => {
    const weekEnd = Date.now() - (3 - i) * 7 * 24 * 60 * 60 * 1000;
    const weekStart = weekEnd - 7 * 24 * 60 * 60 * 1000;
    const weekActs = activities.filter((a) => {
      const t = new Date(a.startedAt).getTime();
      return t >= weekStart && t < weekEnd;
    });
    return {
      name: `Tuần ${i + 1}`,
      "Chạy (km)": +weekActs.filter((a) => a.sportType === "RUN").reduce((s, a) => s + a.distanceMeters / 1000, 0).toFixed(1),
      "Bơi (100m)": +(weekActs.filter((a) => a.sportType === "SWIM").reduce((s, a) => s + a.distanceMeters, 0) / 100).toFixed(1),
      Phút: weekActs.reduce((s, a) => s + a.durationMinutes, 0),
    };
  });
}

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const stored = readStorage<Session | null>("runswim-session", null);
    return stored && stored.token !== "demo" ? stored : null;
  });
  const [page, setPage] = useState<Page>("dashboard");
  const [profile, setProfile] = useState<AthleteProfile>(fallbackProfile);
  const [stats, setStats] = useState<Stats>(fallbackStats);
  const [activities, setActivities] = useState<FitnessActivity[]>(fallbackActivities);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan>(fallbackPlan);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [savedRoutes, setSavedRoutes] = useState<number[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<number[]>([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isPremium, setIsPremium] = useState(() => {
    const stored = readStorage<Session | null>("runswim-session", null);
    return stored?.premiumActive ?? false;
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [connectedDevices, setConnectedDevices] = useState<string[]>(() => readStorage("runswim-devices", []));
  const [trainingPlan, setTrainingPlan] = useState<TrainingDay[]>(() => readStorage("runswim-plan", initialTrainingPlan));
  const [sportDefs, setSportDefs] = useState<SportDef[]>([]);

  useEffect(() => {
    if (!session) return;
    localStorage.setItem("runswim-session", JSON.stringify(session));
    void loadDashboard(session);
  }, [session]);

  useEffect(() => localStorage.setItem("runswim-devices", JSON.stringify(connectedDevices)), [connectedDevices]);
  useEffect(() => localStorage.setItem("runswim-plan", JSON.stringify(trainingPlan)), [trainingPlan]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  type PostApiView = {
    id: number; userId: number; athleteName: string; title?: string; content: string;
    sportType?: Sport; distanceMeters?: number; durationMinutes?: number; calories?: number;
    routeName?: string; createdAt: string; likeCount: number; commentCount: number; likedByMe: boolean;
  };

  function mapPost(v: PostApiView): Post {
    return {
      id: v.id, userId: v.userId, authorName: v.athleteName, title: v.title,
      content: v.content, sportType: v.sportType, distanceMeters: v.distanceMeters,
      durationMinutes: v.durationMinutes, calories: v.calories, routeName: v.routeName, createdAt: v.createdAt,
      likes: v.likeCount, liked: v.likedByMe, commentCount: v.commentCount, comments: [],
    };
  }

  async function loadDashboard(current: Session) {
    const [profileData, statsData, activityData, planData, mealsData, routesData, savedRouteData, challengeData, postData, followingData, sportDefsData] = await Promise.all([
      api<AthleteProfile>(`/athletes/${current.userId}`, current.token, fallbackProfile),
      api<Stats>(`/activities/stats/${current.userId}`, current.token, fallbackStats),
      api<FitnessActivity[]>(`/activities/user/${current.userId}`, current.token, fallbackActivities),
      api<NutritionPlan>(`/nutrition/${current.userId}/plan`, current.token, fallbackPlan),
      api<MealEntry[]>(`/nutrition/${current.userId}/meals`, current.token, []),
      api<RouteItem[]>("/activities/routes", current.token, []),
      api<number[]>(`/activities/routes/saved/${current.userId}`, current.token, []),
      api<Challenge[]>(`/activities/challenges/user/${current.userId}`, current.token, []),
      api<PostApiView[]>(`/community/posts?userId=${current.userId}`, current.token, []),
      api<FollowSummary[]>(`/athletes/${current.userId}/following`, current.token, []),
      api<SportDef[]>("/activities/sports", current.token, []),
    ]);
    setProfile({ ...fallbackProfile, ...profileData });
    setStats(recalculateStats(activityData, statsData));
    setActivities(activityData);
    setNutritionPlan({ ...fallbackPlan, ...planData });
    setMeals(mealsData);
    setRoutes(routesData);
    setSavedRoutes(savedRouteData);
    setChallenges(challengeData);
    setPosts(postData.map(mapPost));
    setFollowing(followingData.map((item) => item.userId));
    if (sportDefsData.length > 0) setSportDefs(sportDefsData);
  }

  async function createActivity(payload: Omit<FitnessActivity, "id" | "startedAt"> & { gpsRouteJson?: string; averagePaceSecondsPerKm?: number }) {
    const fallback = { ...payload, id: Date.now(), startedAt: new Date().toISOString() };
    const created = await api<FitnessActivity>("/activities", session?.token ?? "", fallback, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const nextActivities = [created, ...activities.filter((a) => a.id !== created.id)];
    setActivities(nextActivities);
    setStats(recalculateStats(nextActivities, stats));
    if (session) {
      const refreshed = await api<Challenge[]>(`/activities/challenges/user/${session.userId}`, session.token, challenges);
      setChallenges(refreshed);
    }
    setShowActivityModal(false);
    notify("Đã ghi hoạt động vào nhật ký luyện tập.");
  }

  async function refreshRoutes() {
    if (!session) return;
    const data = await api<RouteItem[]>("/activities/routes", session.token, []);
    setRoutes(data);
  }

  async function toggleSavedRoute(routeId: number) {
    if (!session) return;
    const saved = savedRoutes.includes(routeId);
    const path = `/activities/routes/saved/${session.userId}/${routeId}`;
    if (saved) {
      await apiStrict(path, session.token, { method: "DELETE" });
      setSavedRoutes(savedRoutes.filter((id) => id !== routeId));
      notify("Đã bỏ lưu tuyến.");
    } else {
      await apiStrict(path, session.token, { method: "POST" });
      setSavedRoutes([...savedRoutes, routeId]);
      notify("Đã lưu tuyến vào danh sách của bạn.");
    }
  }

  async function toggleChallenge(challengeId: string, joined: boolean) {
    if (!session) return;
    const path = `/activities/challenges/${challengeId}/join/${session.userId}`;
    if (joined) {
      await apiStrict(path, session.token, { method: "DELETE" });
      notify("Đã rời thử thách.");
    } else {
      await apiStrict(path, session.token, { method: "POST" });
      notify("Đã tham gia thử thách cá nhân.");
    }
    const refreshed = await api<Challenge[]>(`/activities/challenges/user/${session.userId}`, session.token, challenges);
    setChallenges(refreshed);
  }

  async function likePost(postId: number) {
    if (!session) return;
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
    try {
      const res = await apiStrict<{ liked: boolean; likeCount: number }>(
        `/community/posts/${postId}/likes/${session.userId}`, session.token, { method: "POST" }
      );
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked: res.liked, likes: res.likeCount } : p));
    } catch { /* keep optimistic */ }
  }

  async function addComment(postId: number, content: string) {
    if (!session) return;
    const optimistic: PostComment = { id: Date.now(), userId: session.userId, authorName: profile.displayName, content, createdAt: new Date().toISOString() };
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...p.comments, optimistic], commentCount: p.commentCount + 1 } : p));
    try {
      const saved = await apiStrict<{ id: number; userId: number; displayName: string; content: string; createdAt: string }>(
        `/community/posts/${postId}/comments`, session.token,
        { method: "POST", body: JSON.stringify({ userId: session.userId, displayName: profile.displayName, content }) }
      );
      const mapped: PostComment = { id: saved.id, userId: saved.userId, authorName: saved.displayName, content: saved.content, createdAt: saved.createdAt };
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments.filter((c) => c.id !== optimistic.id), mapped] } : p
      ));
    } catch { /* keep optimistic */ }
  }

  async function toggleFollow(userId: number) {
    if (!session) return;
    const isFollowing = following.includes(userId);
    setFollowing((prev) => isFollowing ? prev.filter((id) => id !== userId) : [...prev, userId]);
    notify(isFollowing ? "Đã bỏ theo dõi." : "Đã theo dõi người dùng.");
    try {
      const path = `/athletes/${session.userId}/follow/${userId}`;
      await apiStrict(path, session.token, { method: isFollowing ? "DELETE" : "POST" });
    } catch { /* keep optimistic */ }
  }

  async function createCommunityPost(content: string, activityId?: number) {
    if (!session) return;
    const linkedActivity = activityId ? activities.find((activity) => activity.id === activityId) : undefined;
    const cleanContent = content.trim();
    if (!cleanContent && !linkedActivity) return;
    const optimistic: Post = {
      id: Date.now(),
      userId: session.userId,
      authorName: profile.displayName,
      title: linkedActivity?.title,
      content: cleanContent || `Vừa hoàn thành ${linkedActivity?.title}.`,
      sportType: linkedActivity?.sportType,
      distanceMeters: linkedActivity?.distanceMeters,
      durationMinutes: linkedActivity?.durationMinutes,
      calories: linkedActivity?.calories,
      routeName: linkedActivity?.routeName,
      likes: 0,
      liked: false,
      comments: [],
      commentCount: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [optimistic, ...prev]);
    notify(linkedActivity ? "Đã đăng bài kèm hoạt động." : "Đã đăng bài lên cộng đồng.");
    try {
      const saved = await apiStrict<PostApiView>("/community/posts", session.token, {
        method: "POST",
        body: JSON.stringify({
          userId: session.userId,
          athleteName: profile.displayName,
          title: linkedActivity?.title,
          content: optimistic.content,
          sportType: linkedActivity?.sportType,
          distanceMeters: linkedActivity?.distanceMeters,
          durationMinutes: linkedActivity?.durationMinutes,
          calories: linkedActivity?.calories,
          routeName: linkedActivity?.routeName,
          visibility: "PUBLIC",
        }),
      });
      setPosts((prev) => [mapPost(saved), ...prev.filter((p) => p.id !== optimistic.id)]);
    } catch {
      notify("Đang giữ bài viết tạm thời, chưa đồng bộ được với máy chủ.");
    }
  }

  async function shareActivity(activity: FitnessActivity) {
    if (!session) return;
    const optimistic: Post = {
      id: Date.now(),
      userId: session.userId,
      authorName: profile.displayName,
      title: activity.title,
      content: `Vừa hoàn thành ${activity.title}! ${formatDistance(activity)} trong ${activity.durationMinutes} phút.`,
      sportType: activity.sportType,
      distanceMeters: activity.distanceMeters,
      durationMinutes: activity.durationMinutes,
      routeName: activity.routeName,
      likes: 0, liked: false, comments: [], commentCount: 0,
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) => [optimistic, ...prev]);
    setPage("community");
    notify("Đã chia sẻ hoạt động lên cộng đồng.");
    try {
      const saved = await apiStrict<PostApiView>("/community/posts", session.token, {
        method: "POST",
        body: JSON.stringify({
          userId: session.userId,
          athleteName: profile.displayName,
          title: activity.title,
          content: optimistic.content,
          sportType: activity.sportType,
          distanceMeters: activity.distanceMeters,
          durationMinutes: activity.durationMinutes,
          calories: activity.calories,
          routeName: activity.routeName,
          visibility: "PUBLIC",
        }),
      });
      setPosts((prev) => [mapPost(saved), ...prev.filter((p) => p.id !== optimistic.id)]);
    } catch { /* keep optimistic */ }
  }

  function logout() {
    localStorage.removeItem("runswim-session");
    setSession(null);
  }

  if (!session) {
    return <Onboarding onDone={setSession} />;
  }

  return (
    <main className="strava-app">
      <AppHeader
        page={page}
        setPage={setPage}
        session={session}
        profile={profile}
        routes={routes}
        profileMenuOpen={profileMenuOpen}
        notificationsOpen={notificationsOpen}
        onAdd={() => setShowActivityModal(true)}
        onTrial={() => setShowPremiumModal(true)}
        onProfileMenu={() => setProfileMenuOpen(!profileMenuOpen)}
        onNotifications={() => setNotificationsOpen(!notificationsOpen)}
        onEditProfile={() => { setShowProfileModal(true); setProfileMenuOpen(false); }}
        onLogout={logout}
      />

      <section className={`strava-main${page === "maps" ? " maps-fullscreen" : ""}${page === "training" ? " training-page" : ""}`}>
        {page === "dashboard" && (
          <DashboardPage
            profile={profile}
            stats={stats}
            activities={activities}
            connectedDevices={connectedDevices}
            trainingPlan={trainingPlan}
            nutritionPlan={nutritionPlan}
            challenges={challenges}
            setPage={setPage}
            onAddActivity={() => setShowActivityModal(true)}
            onConnectDevice={() => setShowDeviceModal(true)}
            onTrial={() => setShowPremiumModal(true)}
            isPremium={isPremium}
          />
        )}
        {page === "training" && (
          <TrainingPage
            profile={profile}
            stats={stats}
            trainingPlan={trainingPlan}
            setTrainingPlan={setTrainingPlan}
            notify={notify}
            token={session.token}
            userId={session.userId}
            onSaveActivity={createActivity}
            routes={routes}
            onRouteCreated={refreshRoutes}
            sportDefs={sportDefs}
          />
        )}
        {page === "maps" && (
          <MapsPage
            routes={routes}
            savedRoutes={savedRoutes}
            onToggleRoute={toggleSavedRoute}
            onAddActivity={() => setShowActivityModal(true)}
            token={session.token}
            userId={session.userId}
            onRouteCreated={refreshRoutes}
            sportDefs={sportDefs}
          />
        )}
        {page === "nutrition" && (
          <NutritionPage
            token={session.token}
            userId={session.userId}
            plan={nutritionPlan}
            setPlan={setNutritionPlan}
            meals={meals}
            setMeals={setMeals}
            activities={activities}
            notify={notify}
          />
        )}
        {page === "ai" && <AiCoachPage token={session.token} userId={session.userId} stats={stats} />}
        {page === "admin" && session.role === "ADMIN" && (
          <AdminPage token={session.token} userId={session.userId} notify={notify} />
        )}
        {page === "community" && (
          <CommunityHubPage
            posts={posts}
            setPosts={setPosts}
            token={session.token}
            currentUserId={session.userId}
            profile={profile}
            activities={activities}
            following={following}
            onLike={likePost}
            onComment={addComment}
            onFollow={toggleFollow}
            onCreatePost={createCommunityPost}
            onShareActivity={shareActivity}
            onAddActivity={() => setShowActivityModal(true)}
          />
        )}
      </section>

      {showActivityModal && (
        <ActivityModal
          session={session}
          profile={profile}
          onClose={() => setShowActivityModal(false)}
          onCreate={createActivity}
        />
      )}
      {showDeviceModal && (
        <DeviceModal
          connectedDevices={connectedDevices}
          setConnectedDevices={setConnectedDevices}
          onClose={() => setShowDeviceModal(false)}
          notify={notify}
        />
      )}
      {showPremiumModal && (
        <PremiumModal
          isPremium={isPremium}
          onClose={() => setShowPremiumModal(false)}
          onUpgrade={() => { setIsPremium(true); setShowPremiumModal(false); }}
          notify={notify}
          userId={session.userId}
          token={session.token}
        />
      )}
      {showProfileModal && (
        <ProfileModal
          token={session.token}
          profile={profile}
          setProfile={setProfile}
          onClose={() => setShowProfileModal(false)}
          notify={notify}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function AppHeader({
  page,
  setPage,
  session,
  profile,
  routes,
  profileMenuOpen,
  notificationsOpen,
  onAdd,
  onTrial,
  onProfileMenu,
  onNotifications,
  onEditProfile,
  onLogout,
}: {
  page: Page;
  setPage: (page: Page) => void;
  session: Session;
  profile: AthleteProfile;
  routes: RouteItem[];
  profileMenuOpen: boolean;
  notificationsOpen: boolean;
  onAdd: () => void;
  onTrial: () => void;
  onProfileMenu: () => void;
  onNotifications: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResults = [
    ...routes.map((r) => ({ label: r.name, hint: `${r.place ?? "GPS"} - ${formatRouteDistance(r)}`, page: "maps" as Page })),
    { label: "Kế hoạch dinh dưỡng", hint: "Calories, macro, nước", page: "nutrition" as Page },
    { label: "AI Coach", hint: "Hỏi về lịch tập và phục hồi", page: "ai" as Page },
    { label: "Cộng đồng", hint: "Feed hoạt động bạn bè", page: "community" as Page },
    { label: "Tập luyện", hint: "GPS ghi buổi tập, lịch 7 ngày", page: "training" as Page },
  ]
    .filter((r) => `${r.label} ${r.hint}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  const isAdmin = session.role === "ADMIN";
  const nav: Array<{ id: Page; label: string; icon: ReactNode }> = [
    { id: "dashboard", label: "Trang chủ", icon: <Activity size={17} /> },
    { id: "training", label: "Tập luyện", icon: <CalendarDays size={17} /> },
    { id: "maps", label: "Bản đồ", icon: <Map size={17} /> },
    { id: "nutrition", label: "Dinh dưỡng", icon: <Salad size={17} /> },
    { id: "community", label: "Cộng đồng", icon: <Users size={17} /> },
    { id: "ai", label: "AI Coach", icon: <Bot size={17} /> },
    ...(isAdmin ? [{ id: "admin" as Page, label: "Admin", icon: <Settings size={17} /> }] : []),
  ];

  return (
    <header className="global-header">
      <div className="header-inner">
        <button className="brand-word" onClick={() => setPage("dashboard")} aria-label="RunSwim home">
          RUNSWIM
        </button>
        <div className="header-search" role="search" onClick={() => searchInputRef.current?.focus()}>
          <Search size={20} />
          <input
            ref={searchInputRef}
            aria-label="Tìm kiếm"
            placeholder="Tìm hoạt động, tuyến chạy, hồ bơi..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <div className="search-results">
              {searchResults.length === 0 ? (
                <span>Không có kết quả phù hợp.</span>
              ) : (
                searchResults.map((r) => (
                  <button key={`${r.page}-${r.label}`} onClick={() => { setPage(r.page); setQuery(""); }}>
                    <strong>{r.label}</strong>
                    <small>{r.hint}</small>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <nav className="top-nav">
          {nav.map((item) => (
            <button key={item.id} className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <button className="trial-button" onClick={onTrial}>Bắt đầu dùng thử</button>
        <div className="header-actions">
          <button className="icon-button" onClick={onNotifications} aria-label="Thông báo">
            <Bell size={21} />
          </button>
          <button className="avatar-button" onClick={onProfileMenu} aria-label="Tài khoản">
            <span>{initials(profile.displayName)}</span>
            <ChevronDown size={16} />
          </button>
          <button className="add-button" onClick={onAdd} aria-label="Thêm hoạt động">
            <CirclePlus size={30} />
          </button>
        </div>
        {notificationsOpen && (
          <div className="popover notifications-popover">
            <strong>Thông báo luyện tập</strong>
            <span>Hôm nay nên bơi kỹ thuật nhẹ hoặc nghỉ phục hồi.</span>
            <span>Bạn chưa ghi hoạt động nào trong tuần này.</span>
            <span>Challenge tháng 5 đang chờ bạn tham gia!</span>
          </div>
        )}
        {profileMenuOpen && (
          <div className="popover profile-popover">
            <div className="profile-popover-head">
              <div className="profile-popover-avatar">{initials(profile.displayName)}</div>
              <div className="profile-popover-user">
                <strong>{profile.displayName}</strong>
                <span>{session.email}</span>
                <small>{profile.city}</small>
              </div>
            </div>

            <div className="profile-popover-badges">
              <span>{session.role === "ADMIN" ? "Admin" : "Athlete"}</span>
              <span>{session.premiumActive ? "Premium" : "Free"}</span>
              <span>{profile.primaryGoal}</span>
            </div>

            <div className="profile-popover-stats">
              <div>
                <strong>{profile.weeklyRunGoalKm} km</strong>
                <span>Goal chạy</span>
              </div>
              <div>
                <strong>{profile.weeklySwimGoalMeters} m</strong>
                <span>Goal bơi</span>
              </div>
              <div>
                <strong>{profile.completedOnboarding ? "Đã xong" : "Chưa xong"}</strong>
                <span>Onboarding</span>
              </div>
            </div>

            <div className="profile-popover-actions">
              <button className="profile-popover-primary" onClick={onEditProfile}><Settings size={16} /> Sửa hồ sơ</button>
              <button className="profile-popover-secondary" onClick={onLogout}><LogOut size={16} /> Đăng xuất</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function DashboardPage({
  profile, stats, activities, connectedDevices, trainingPlan, nutritionPlan, challenges,
  setPage, onAddActivity, onConnectDevice, onTrial, isPremium,
}: {
  profile: AthleteProfile;
  stats: Stats;
  activities: FitnessActivity[];
  connectedDevices: string[];
  trainingPlan: TrainingDay[];
  nutritionPlan: NutritionPlan;
  challenges: Challenge[];
  setPage: (page: Page) => void;
  onAddActivity: () => void;
  onConnectDevice: () => void;
  onTrial: () => void;
  isPremium: boolean;
}) {
  const nextWorkout = trainingPlan.find((d) => !d.done) ?? trainingPlan[0];
  const joinedChallenges = challenges.filter((c) => c.joined);
  const weeklyData = buildWeeklyChartData(activities);

  return (
    <div className="dashboard-layout">
      <aside className="left-rail">
        <ProfileSummary profile={profile} stats={stats} activities={activities} onAddActivity={onAddActivity} />
        <SportSummaryCard stats={stats} profile={profile} onTrial={onTrial} />
      </aside>

      <section className="center-column">
        <GettingStartedCard
          hasActivities={activities.length > 0}
          hasDevice={connectedDevices.length > 0}
          onAddActivity={onAddActivity}
          onConnectDevice={onConnectDevice}
          onTraining={() => setPage("training")}
          onNutrition={() => setPage("nutrition")}
          onAi={() => setPage("ai")}
        />
        <TrainingTodayCard nextWorkout={nextWorkout} onTraining={() => setPage("training")} onAddActivity={onAddActivity} />

        {/* Thống kê tuần - hiển thị trực tiếp trên trang chủ */}
        <article className="log-card">
          <div className="section-head">
            <div>
              <span className="section-kicker">Thống kê</span>
              <h2>Quãng đường 7 ngày qua</h2>
            </div>
            <div className="dashboard-stat-chips">
              <span className="stat-chip run"><Flame size={13} /> {stats.weeklyRunKm.toFixed(1)} km chạy</span>
              <span className="stat-chip swim"><Waves size={13} /> {stats.weeklySwimMeters} m bơi</span>
              <span className="stat-chip time"><CalendarDays size={13} /> {stats.weeklyMinutes} phút</span>
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Chạy (km)" fill="var(--orange)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Bơi (100m)" fill="#2188ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {!isPremium && (
            <button className="premium-gate-inline" onClick={onTrial}>
              <Sparkles size={14} /> Nâng cấp Premium để xem biểu đồ calories & pace nâng cao
            </button>
          )}
        </article>

        {joinedChallenges.length > 0 && (
          <article className="log-card">
            <div className="section-head">
              <div>
                <span className="section-kicker">Đang tham gia</span>
                <h2>Thử thách của bạn</h2>
              </div>
            </div>
            <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
              {joinedChallenges.slice(0, 2).map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <Medal size={22} color="var(--orange)" />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: "block" }}>{c.title}</strong>
                    <div className="progress-line" style={{ marginTop: "6px" }}>
                      <span style={{ width: `${Math.max(0, Math.min(100, c.progress))}%` }} />
                    </div>
                  </div>
                  <span style={{ color: "var(--muted)", fontSize: "0.88rem" }}>{Math.round(c.progress)}%</span>
                </div>
              ))}
            </div>
          </article>
        )}
        <ActivityLog activities={activities} onAddActivity={onAddActivity} onCommunity={() => setPage("community")} />
      </section>

      <aside className="right-rail">
        <RailCard icon={<Bot size={24} />} title="AI Coach" action="Hỏi AI" onClick={() => setPage("ai")}>
          Phân tích tải tập tuần này và đề xuất buổi chạy/bơi tiếp theo.
        </RailCard>
        <RailCard icon={<Utensils size={24} />} title="Dinh dưỡng" action="Xem kế hoạch" onClick={() => setPage("nutrition")}>
          {nutritionPlan.guidance}
        </RailCard>
        <RailCard icon={<Users size={24} />} title="Cộng đồng" action="Xem feed" onClick={() => setPage("community")}>
          Bạn bè đang chia sẻ hoạt động mới. Tham gia và theo dõi tiến độ của nhau.
        </RailCard>
        <RailCard icon={<Map size={24} />} title="Bản đồ" action="Mở bản đồ" onClick={() => setPage("maps")}>
          Khám phá tuyến chạy và địa điểm bơi gần bạn.
        </RailCard>
      </aside>
    </div>
  );
}

function ProfileSummary({ profile, stats, activities, onAddActivity }: { profile: AthleteProfile; stats: Stats; activities: FitnessActivity[]; onAddActivity: () => void }) {
  return (
    <article className="profile-card">
      <div className="profile-avatar">{initials(profile.displayName)}</div>
      <h2>{profile.displayName}</h2>
      <span>{profile.city}</span>
      <div className="profile-numbers">
        <div><strong>{activities.length}</strong><span>Hoạt động</span></div>
        <div><strong>{stats.weeklyRunKm.toFixed(1)}</strong><span>Km chạy</span></div>
        <div><strong>{stats.weeklySwimMeters}</strong><span>M bơi</span></div>
      </div>
      <button className="link-row" onClick={onAddActivity}>
        <span>Thêm hoạt động.</span> Ghi lại buổi chạy hoặc bơi.
      </button>
    </article>
  );
}

function SportSummaryCard({ stats, profile, onTrial }: { stats: Stats; profile: AthleteProfile; onTrial: () => void }) {
  const runProgress = Math.min(100, (stats.weeklyRunKm / Math.max(profile.weeklyRunGoalKm, 1)) * 100);
  const swimProgress = Math.min(100, (stats.weeklySwimMeters / Math.max(profile.weeklySwimGoalMeters, 1)) * 100);
  return (
    <article className="sport-summary">
      <div className="sport-tabs">
        <span><Flame size={24} /></span>
        <span><Waves size={24} /></span>
        <span><Salad size={24} /></span>
      </div>
      <div className="upgrade-note">
        <strong>Phân tích luyện tập</strong>
        <p>Duy trì động lực với mục tiêu tuần, tiến trình và gợi ý phục hồi.</p>
        <button onClick={onTrial}>Nâng cấp Premium</button>
      </div>
      <ProgressRow label="Chạy tuần này" value={`${stats.weeklyRunKm.toFixed(1)} / ${profile.weeklyRunGoalKm} km`} progress={runProgress} />
      <ProgressRow label="Bơi tuần này" value={`${stats.weeklySwimMeters} / ${profile.weeklySwimGoalMeters} m`} progress={swimProgress} />
    </article>
  );
}

function GettingStartedCard({
  hasActivities, hasDevice, onAddActivity, onConnectDevice, onTraining, onNutrition, onAi,
}: {
  hasActivities: boolean;
  hasDevice: boolean;
  onAddActivity: () => void;
  onConnectDevice: () => void;
  onTraining: () => void;
  onNutrition: () => void;
  onAi: () => void;
}) {
  return (
    <article className="start-card">
      <div className="start-hero" />
      <div className="start-body">
        <h1>Bắt đầu</h1>
        <p>Một vài bước để biến RunSwim thành nhật ký luyện tập chạy, bơi và phục hồi của bạn.</p>
        <TaskRow done={hasActivities} icon={<Activity size={46} />} title="Ghi hoạt động đầu tiên" text="Nhập quãng đường, thời gian, nhịp tim và ghi chú." action="Ghi hoạt động" onClick={onAddActivity} />
        <TaskRow done={hasDevice} icon={<Watch size={46} />} title="Kết nối thiết bị" text="Đồng bộ Garmin, Apple Watch hoặc file GPX." action="Kết nối thiết bị" onClick={onConnectDevice} />
        <TaskRow icon={<CalendarDays size={46} />} title="Tạo lịch luyện tập" text="Lịch 7 ngày cho chạy và bơi có đánh dấu hoàn thành." action="Xem lịch tập" onClick={onTraining} />
        <TaskRow icon={<Utensils size={46} />} title="Thiết lập dinh dưỡng" text="Theo dõi calories, macro, nước uống." action="Mở dinh dưỡng" onClick={onNutrition} />
        <TaskRow icon={<Bot size={46} />} title="Hỏi AI coach" text="Nhận gợi ý buổi chạy/bơi tiếp theo." action="Hỏi AI" onClick={onAi} />
      </div>
    </article>
  );
}

function TaskRow({ done, icon, title, text, action, onClick }: { done?: boolean; icon: ReactNode; title: string; text: string; action: string; onClick: () => void }) {
  return (
    <div className={done ? "task-row done" : "task-row"}>
      <div className="task-icon">{done ? <CheckCircle2 size={46} /> : icon}</div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        <button className="orange-button" onClick={onClick}>{done ? "Cập nhật" : action}</button>
      </div>
    </div>
  );
}

function TrainingTodayCard({ nextWorkout, onTraining, onAddActivity }: { nextWorkout: TrainingDay; onTraining: () => void; onAddActivity: () => void }) {
  return (
    <article className="training-today">
      <div>
        <span className="section-kicker">Buổi tiếp theo</span>
        <h2>{nextWorkout.title}</h2>
        <p>{nextWorkout.detail}</p>
      </div>
      <div className="today-actions">
        <SportPill sport={nextWorkout.sport} />
        <strong>{nextWorkout.duration}</strong>
        <button className="outline-button" onClick={onTraining}>Xem lịch</button>
        <button className="orange-button" onClick={onAddActivity}>Ghi sau khi tập</button>
      </div>
    </article>
  );
}

function ActivityLog({ activities, onAddActivity, onCommunity }: { activities: FitnessActivity[]; onAddActivity: () => void; onCommunity: () => void }) {
  return (
    <article className="log-card">
      <div className="section-head">
        <div>
          <span className="section-kicker">Nhật ký</span>
          <h2>Hoạt động gần đây</h2>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="outline-button" onClick={onCommunity}><Users size={16} /> Cộng đồng</button>
          <button className="outline-button" onClick={onAddActivity}><CirclePlus size={18} /> Thêm</button>
        </div>
      </div>
      {activities.length === 0 ? (
        <div className="empty-log">
          <Activity size={44} />
          <h3>Chưa có hoạt động nào</h3>
          <p>Ghi một buổi chạy hoặc bơi để bắt đầu theo dõi tiến bộ.</p>
          <button className="orange-button" onClick={onAddActivity}>Ghi hoạt động đầu tiên</button>
        </div>
      ) : (
        <div className="activity-table">
          {activities.map((a) => (
            <div key={a.id} className="activity-row">
              <SportPill sport={a.sportType} />
              <div>
                <strong>{a.title}</strong>
                <span>{a.description || a.routeName}</span>
              </div>
              <span>{formatDistance(a)}</span>
              <span>{a.durationMinutes} phút</span>
              <span>{a.averageHeartRate ?? "--"} bpm</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

type RecordingState = "idle" | "recording" | "paused" | "done";

// ─── Route Create Modal ───────────────────────────────────────────────────────

type SportDef = {
  id: number;
  code: string;
  label: string;
  icon: string;
  category: string;
  backendSport: string;
  sortOrder: number;
  active: boolean;
};

type RouteSuggestion = {
  name: string;
  place: string;
  distanceMeters: number;
  sportType: "RUN" | "SWIM";
  note: string;
  lat: number;
  lon: number;
  thumbnailUrl: string;
};

function buildRouteThumbnailUrl(lat: number, lon: number) {
  const z = 15;
  const n = Math.pow(2, z);
  const x = Math.floor((lon + 180) / 360 * n);
  const r = lat * Math.PI / 180;
  const y = Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n);
  return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

async function fetchRouteSuggestions(lat: number, lon: number, sport: "RUN" | "SWIM"): Promise<RouteSuggestion[]> {
  try {
    const revRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=vi`,
      { headers: { "Accept-Language": "vi" } }
    );
    const revData = await revRes.json() as { address?: { suburb?: string; city_district?: string; quarter?: string; city?: string } };
    const areaName =
      revData.address?.quarter ||
      revData.address?.suburb ||
      revData.address?.city_district ||
      revData.address?.city ||
      "khu vực của bạn";

    const radius = sport === "SWIM" ? 5000 : 3000;
    const overpassFilter = sport === "SWIM"
      ? `["leisure"~"swimming_pool|water_park"]["name"]`
      : `["leisure"~"park|sports_centre|fitness_centre|track"]["name"]`;

    const query =
      `[out:json][timeout:10];(` +
      `node${overpassFilter}(around:${radius},${lat},${lon});` +
      `way${overpassFilter}(around:${radius},${lat},${lon});` +
      `);out center 6;`;

    const overpassRes = await Promise.race([
      fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 8000)),
    ]);
    const overpassData = await (overpassRes as Response).json() as { elements: { tags: { name: string }; lat?: number; lon?: number; center?: { lat: number; lon: number } }[] };

    const runDists = [3000, 5000, 8000, 5000, 3000];
    const swimDists = [500, 1000, 1500, 2000, 1000];

    const poiSuggestions: RouteSuggestion[] = overpassData.elements.slice(0, 5).map((el, i) => {
      const latValue = el.lat ?? el.center?.lat ?? lat;
      const lonValue = el.lon ?? el.center?.lon ?? lon;
      return {
        name: sport === "SWIM" ? `Bơi tại ${el.tags.name}` : `Chạy tại ${el.tags.name}`,
        place: el.tags.name,
        distanceMeters: sport === "SWIM" ? swimDists[i] : runDists[i],
        sportType: sport,
        note: `Gợi ý lộ trình cho ${areaName}`,
        lat: latValue,
        lon: lonValue,
        thumbnailUrl: buildRouteThumbnailUrl(latValue, lonValue),
      };
    });

    if (poiSuggestions.length === 0) {
      return [
        { name: sport === "SWIM" ? `Bơi tại ${areaName}` : `Chạy bộ quanh ${areaName}`, place: areaName, distanceMeters: sport === "SWIM" ? 1000 : 5000, sportType: sport, note: "Gợi ý lộ trình dựa trên vị trí hiện tại", lat, lon, thumbnailUrl: buildRouteThumbnailUrl(lat, lon) },
        { name: sport === "SWIM" ? `Bơi kỹ thuật ${areaName}` : `Chạy sáng ${areaName}`, place: areaName, distanceMeters: sport === "SWIM" ? 1500 : 3000, sportType: sport, note: "Gợi ý lộ trình dựa trên vị trí hiện tại", lat, lon, thumbnailUrl: buildRouteThumbnailUrl(lat, lon) },
      ];
    }
    return poiSuggestions;
  } catch {
    return [];
  }
}

function RouteCreateModal({
  token,
  userId,
  initialSportCode,
  sportDefs,
  onDone,
  onClose,
}: {
  token: string;
  userId: number;
  initialSportCode: string;
  sportDefs: SportDef[];
  onDone: (route: RouteItem) => void;
  onClose: () => void;
}) {
  const [sportCode, setSportCode] = useState(initialSportCode);
  const [place, setPlace] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [savedRoute, setSavedRoute] = useState<RouteItem | null>(null);

  // Map drawing state
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstance = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mlRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wptMarkersRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [waypoints, setWaypoints] = useState<[number, number][]>([]);   // [lat, lng]
  const [routeCoords, setRouteCoords] = useState<number[][]>([]);       // [lon, lat] for MapLibre
  const [osrmDist, setOsrmDist] = useState(0);
  const [routing, setRouting] = useState(false);

  // Search (debounced, no separate button)
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);

  // AI suggestions
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<RouteSuggestion[]>([]);
  const [loadingSugg, setLoadingSugg] = useState(false);

  const FALLBACK_SPORT_DEFS: SportDef[] = [
    { id: 0, code: "RUN",   label: "Chạy bộ",        icon: "🏃", category: "", backendSport: "RUN",  sortOrder: 1, active: true },
    { id: 0, code: "TRAIL", label: "Địa hình",        icon: "🏔️", category: "", backendSport: "RUN",  sortOrder: 2, active: true },
    { id: 0, code: "WALK",  label: "Đi bộ",          icon: "🚶", category: "", backendSport: "RUN",  sortOrder: 3, active: true },
    { id: 0, code: "BIKE",  label: "Xe đạp",         icon: "🚴", category: "", backendSport: "RUN",  sortOrder: 5, active: true },
    { id: 0, code: "SWIM",  label: "Bơi lội",        icon: "🏊", category: "", backendSport: "SWIM", sortOrder: 7, active: true },
    { id: 0, code: "GYM",   label: "Gym",            icon: "🏋️", category: "", backendSport: "RUN",  sortOrder: 8, active: true },
  ];
  const effectiveSportDefs = sportDefs.length > 0 ? sportDefs : FALLBACK_SPORT_DEFS;
  const currentDef = effectiveSportDefs.find((d) => d.code === sportCode) ?? { backendSport: "RUN", label: sportCode, icon: "⚡", category: "" };
  const osrmProfile = currentDef.backendSport === "SWIM" ? null : (["BIKE", "MTB"].includes(sportCode) ? "bike" : "foot");
  const distLabel = osrmDist > 0
    ? (osrmDist >= 1000 ? `${(osrmDist / 1000).toFixed(2)} km` : `${Math.round(osrmDist)} m`)
    : null;

  // Get GPS location
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLat(pos.coords.latitude); setUserLon(pos.coords.longitude); },
      () => {},
      { timeout: 6000 }
    );
  }, []);

  // Load AI suggestions when location or sport changes
  useEffect(() => {
    if (!userLat || !userLon) return;
    setLoadingSugg(true);
    const backendSport = currentDef.backendSport === "SWIM" ? "SWIM" : "RUN";
    fetchRouteSuggestions(userLat, userLon, backendSport as "RUN" | "SWIM").then((res) => {
      setSuggestions(res);
      setLoadingSugg(false);
    });
  }, [userLat, userLon, sportCode]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    const center: [number, number] = userLon && userLat ? [userLon, userLat] : [106.6297, 10.8231];
    import("maplibre-gl").then((ml) => {
      if (cancelled || !mapRef.current) return;
      mlRef.current = ml;
      mapInstance.current?.remove();
      const map = new ml.Map({
        container: mapRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom: 14,
      });
      map.addControl(new ml.NavigationControl(), "top-right");
      map.on("load", () => {
        if (cancelled) return;
        map.addSource("drawn-route", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        map.addLayer({
          id: "drawn-route-casing",
          type: "line", source: "drawn-route",
          paint: { "line-color": "rgba(0,0,0,0.15)", "line-width": 8, "line-blur": 2 },
        });
        map.addLayer({
          id: "drawn-route-line",
          type: "line", source: "drawn-route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#f97316", "line-width": 5, "line-opacity": 0.95 },
        });
        if (userLat && userLon) {
          const dot = document.createElement("div");
          dot.className = "gps-marker";
          const d = document.createElement("div"); d.className = "gps-marker-dot";
          const r = document.createElement("div"); r.className = "gps-marker-ring";
          dot.appendChild(r); dot.appendChild(d);
          new ml.Marker({ element: dot, anchor: "center" }).setLngLat([userLon, userLat]).addTo(map);
        }
        setMapReady(true);
      });
      map.on("click", (e: { lngLat: { lat: number; lng: number } }) => {
        if (cancelled) return;
        setWaypoints((prev) => [...prev, [e.lngLat.lat, e.lngLat.lng]]);
      });
      mapInstance.current = map;
    });
    return () => {
      cancelled = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers and route line when waypoints change
  useEffect(() => {
    if (!mapReady || !mapInstance.current || !mlRef.current) return;
    const ml = mlRef.current;
    const map = mapInstance.current;

    // Rebuild waypoint markers
    wptMarkersRef.current.forEach((m) => m.remove());
    wptMarkersRef.current = [];
    waypoints.forEach((wpt, i) => {
      const el = document.createElement("div");
      el.className = `rcm-wpt-marker${i === 0 ? " start" : i === waypoints.length - 1 ? " end" : ""}`;
      el.textContent = String(i + 1);
      wptMarkersRef.current.push(
        new ml.Marker({ element: el, anchor: "center" }).setLngLat([wpt[1], wpt[0]]).addTo(map)
      );
    });

    // Reverse geocode first waypoint → place name
    if (waypoints.length === 1) {
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${waypoints[0][0]}&lon=${waypoints[0][1]}&format=json&accept-language=vi`)
        .then((r) => r.json())
        .then((d: { address?: { suburb?: string; quarter?: string; city_district?: string; city?: string } }) => {
          const a = d.address ?? {};
          setPlace(a.suburb ?? a.quarter ?? a.city_district ?? a.city ?? "");
        })
        .catch(() => {});
    }

    // Straight line when < 2 points or swimming
    if (waypoints.length < 2) {
      setOsrmDist(0);
      setRouteCoords([]);
      const src = map.getSource("drawn-route");
      if (src) src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} });
      return;
    }
    if (!osrmProfile) {
      // Straight-line distance for swimming
      let total = 0;
      for (let i = 1; i < waypoints.length; i++) {
        const R = 6371000;
        const φ1 = waypoints[i-1][0]*Math.PI/180, φ2 = waypoints[i][0]*Math.PI/180;
        const dφ = (waypoints[i][0]-waypoints[i-1][0])*Math.PI/180;
        const dλ = (waypoints[i][1]-waypoints[i-1][1])*Math.PI/180;
        total += R*2*Math.atan2(Math.sqrt(Math.sin(dφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2), Math.sqrt(1-(Math.sin(dφ/2)**2+Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2)));
      }
      const coords = waypoints.map((w) => [w[1], w[0]]);
      setRouteCoords(coords);
      setOsrmDist(total);
      const src = map.getSource("drawn-route");
      if (src) src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} });
      return;
    }

    // OSRM road routing
    setRouting(true);
    const coordStr = waypoints.map((w) => `${w[1]},${w[0]}`).join(";");
    Promise.race([
      fetch(`https://router.project-osrm.org/route/v1/${osrmProfile}/${coordStr}?overview=full&geometries=geojson`),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000)),
    ])
      .then((r) => (r as Response).json())
      .then((data: { code: string; routes?: { distance: number; geometry: { coordinates: number[][] } }[] }) => {
        if (data.code === "Ok" && data.routes?.[0]) {
          const geom = data.routes[0].geometry.coordinates;
          const dist = data.routes[0].distance;
          setRouteCoords(geom);
          setOsrmDist(dist);
          const src = map.getSource("drawn-route");
          if (src) src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: geom }, properties: {} });
        }
      })
      .catch(() => {})
      .finally(() => setRouting(false));
  }, [waypoints, mapReady, osrmProfile]);

  // Debounced Nominatim search
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 2) { setSearchResults([]); setSearchOpen(false); return; }
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`,
          { headers: { "Accept-Language": "vi,en" } }
        );
        const data: { display_name: string; lat: string; lon: string }[] = await res.json();
        setSearchResults(data);
        setSearchOpen(data.length > 0);
      } catch {}
    }, 380);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function selectResult(r: { display_name: string; lat: string; lon: string }) {
    const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
    mapInstance.current?.flyTo({ center: [lon, lat], zoom: 16 });
    setWaypoints((prev) => [...prev, [lat, lon]]);
    setSearchInput(""); setSearchResults([]); setSearchOpen(false);
  }

  function applySuggestion(s: RouteSuggestion) {
    if (s.sportType !== currentDef.backendSport) setSportCode(s.sportType);
    mapInstance.current?.flyTo({ center: [s.lon, s.lat], zoom: 15, duration: 600 });
    setWaypoints((prev) => prev.length === 0 ? [[s.lat, s.lon]] : prev);
    setPlace(s.place);
  }

  async function handleSave() {
    const distM = Math.round(osrmDist);
    if (routeCoords.length < 2 || distM <= 0) { setError("Hãy thêm ít nhất 2 điểm trên bản đồ."); return; }
    const autoName = place ? `${currentDef.label} tại ${place}` : `${currentDef.label} · ${(distM / 1000).toFixed(1)} km`;
    setCreating(true); setError("");
    try {
      const route = await apiStrict<RouteItem>("/activities/routes", token, {
        method: "POST",
        body: JSON.stringify({
          name: autoName,
          sportType: currentDef.backendSport,
          place: place.trim(),
          distanceMeters: distM,
          note: "",
          geoJson: JSON.stringify({ type: "LineString", coordinates: routeCoords }),
        }),
      });
      setSavedRoute(route);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu lộ trình.");
    } finally { setCreating(false); }
  }

  if (savedRoute) {
    return (
      <div className="modal-backdrop rcm-backdrop" role="dialog" aria-modal="true">
        <section className="modal-card rcm-card" style={{ maxWidth: 420, padding: "36px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={28} style={{ color: "#10b981" }} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem" }}>Lộ trình đã lưu!</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>
              <strong>{savedRoute.name}</strong> · {savedRoute.sportType === "SWIM" ? `${savedRoute.distanceMeters} m` : `${(savedRoute.distanceMeters / 1000).toFixed(1)} km`}
            </p>
            {savedRoute.place && <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: "0.82rem" }}>{savedRoute.place}</p>}
          </div>
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button className="outline-button" style={{ flex: 1 }} onClick={onClose}>
              ← Quay lại
            </button>
            <button className="orange-button" style={{ flex: 1 }} onClick={() => onDone(savedRoute)}>
              Chọn lộ trình này
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="modal-backdrop rcm-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card rcm-card">

        {/* ── Toolbar ─────────────────────────────────── */}
        <div className="rcm-toolbar">
          <button type="button" className="rcm-back-btn" onClick={onClose}>← Quay lại</button>

          {/* Debounced search */}
          <div className="rcm-search-wrap">
            <div className="rcm-search-inner">
              <Search size={13} />
              <input
                placeholder="Tìm địa điểm…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setSearchInput("")}
              />
              {searchInput && (
                <button type="button" className="rcm-search-clear"
                  onClick={() => { setSearchInput(""); setSearchResults([]); setSearchOpen(false); }}>×</button>
              )}
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div className="rcm-search-results">
                {searchResults.map((r, i) => (
                  <div key={i} className="rcm-search-result-item" onClick={() => selectResult(r)}>
                    <MapPin size={11} style={{ flexShrink: 0, color: "var(--muted)" }} />
                    <span>{r.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sport pills */}
          <div className="rcm-sport-pills">
            {effectiveSportDefs.map((d) => (
              <button
                key={d.code}
                type="button"
                className={`rcm-sport-pill${sportCode === d.code ? " active" : ""}`}
                onClick={() => setSportCode(d.code)}
                title={d.label}
              >
                {d.icon}
              </button>
            ))}
          </div>

          {/* Save button */}
          <button
            type="button"
            className="orange-button rcm-save-btn"
            disabled={routeCoords.length < 2 || creating}
            onClick={handleSave}
          >
            {creating ? "Đang lưu…" : routeCoords.length < 2 ? "Vẽ lộ trình" : `Lưu · ${distLabel}`}
          </button>
        </div>

        {/* ── Map ──────────────────────────────────────── */}
        <div className="rcm-map-container">
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          <div className="rcm-map-status">
            {waypoints.length === 0
              ? "👆 Click trên bản đồ để thêm điểm, hoặc tìm địa điểm ở trên"
              : routing
                ? `${waypoints.length} điểm · ⏳ Đang tính theo đường đi thực tế…`
                : distLabel
                  ? `${waypoints.length} điểm · 📏 ${distLabel}${osrmProfile ? " (theo đường đi)" : " (đường thẳng)"}`
                  : `${waypoints.length} điểm`}
          </div>
          {waypoints.length > 0 && (
            <div className="rcm-map-controls">
              <button type="button" className="rcm-map-ctrl-btn"
                onClick={() => setWaypoints((p) => p.slice(0, -1))}>↩ Xóa điểm cuối</button>
              <button type="button" className="rcm-map-ctrl-btn danger"
                onClick={() => { setWaypoints([]); setOsrmDist(0); setRouteCoords([]); }}>✕ Xóa tất cả</button>
            </div>
          )}
        </div>

        {/* ── Suggestions strip ────────────────────────── */}
        <div className="rcm-suggestions-strip">
          <div className="rcm-sugg-strip-header">
            <Sparkles size={13} />
            <span>Gợi ý lộ trình</span>
            {(!userLat || loadingSugg) && (
              <span className="rcm-sugg-loading">{!userLat ? "Đang lấy vị trí GPS…" : "Đang tìm…"}</span>
            )}
          </div>
          {error && <p className="rcm-error" style={{ margin: "0 16px 4px" }}>{error}</p>}
          {userLat && !loadingSugg && suggestions.length === 0 && (
            <p className="rcm-hint">Không tìm thấy địa điểm phù hợp gần bạn.</p>
          )}
          <div className="rcm-sugg-scroll">
            {suggestions.map((s, i) => {
              const distStr = s.distanceMeters >= 1000
                ? `${(s.distanceMeters / 1000).toFixed(1)} km`
                : `${s.distanceMeters} m`;
              return (
                <div key={i} className="rcm-sugg-card" onClick={() => applySuggestion(s)}>
                  <div className={`rcm-sugg-img ${s.sportType === "SWIM" ? "swim" : "run"}`}>
                    <img
                      src={s.thumbnailUrl}
                      alt=""
                      loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="rcm-sugg-sport-icon">{currentDef.icon}</span>
                  </div>
                  <div className="rcm-sugg-body">
                    <div className="rcm-sugg-name">{s.name}</div>
                    <div className="rcm-sugg-meta">{s.place} · {distStr}</div>
                  </div>
                  <button
                    type="button"
                    className="outline-button rcm-sugg-use"
                    onClick={(e) => { e.stopPropagation(); applySuggestion(s); }}
                  >
                    Dùng
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </section>
    </div>
  );
}

function TrainingPage({
  profile, stats, trainingPlan, setTrainingPlan, notify, token, userId, onSaveActivity, routes, onRouteCreated, sportDefs,
}: {
  profile: AthleteProfile;
  stats: Stats;
  trainingPlan: TrainingDay[];
  setTrainingPlan: (plan: TrainingDay[]) => void;
  notify: (msg: string) => void;
  token: string;
  userId: number;
  onSaveActivity: (payload: Omit<FitnessActivity, "id" | "startedAt"> & { gpsRouteJson?: string; averagePaceSecondsPerKm?: number }) => Promise<void>;
  routes: RouteItem[];
  onRouteCreated: () => void;
  sportDefs: SportDef[];
  onActivitiesRefresh?: () => void;
}) {
  const [activityMode, setActivityMode] = useState<string>("RUN");
  const [recordState, setRecordState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [gpsPoints, setGpsPoints] = useState<GpsPoint[]>([]);
  const [gpsError, setGpsError] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number]>([106.6297, 10.8231]);
  const [saving, setSaving] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState("");
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [showCustomPlan, setShowCustomPlan] = useState(false);
  const [cpDays, setCpDays] = useState(4);
  const [cpSport, setCpSport] = useState<"RUN" | "SWIM" | "BOTH">("RUN");
  const [cpDuration, setCpDuration] = useState(45);
  const [cpGoal, setCpGoal] = useState<"endurance" | "speed" | "fat">("endurance");

  const [showModePicker, setShowModePicker] = useState(false);
  const [modeSearch, setModeSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showModePicker) return;
    function handleClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowModePicker(false);
        setModeSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showModePicker]);

  function modeToSport(m: string): Sport {
    const def = sportDefs.find((d) => d.code === m);
    return (def?.backendSport === "SWIM" ? "SWIM" : "RUN") as Sport;
  }

  type SportEntry = { mode: string; label: string; icon: ReactNode };
  type SportCategory = { label: string; sports: SportEntry[] };

  const STATIC_SPORT_CATEGORIES: SportCategory[] = [
    {
      label: "Môn thể thao dùng chân",
      sports: [
        { mode: "RUN",   label: "Chạy bộ",           icon: <Flame      size={18} /> },
        { mode: "TRAIL", label: "Chạy địa hình",      icon: <TrendingUp size={18} /> },
        { mode: "WALK",  label: "Đi bộ",              icon: <Footprints size={18} /> },
        { mode: "HIKE",  label: "Đi bộ đường dài",    icon: <Mountain   size={18} /> },
      ],
    },
    {
      label: "Môn thể thao đạp xe",
      sports: [
        { mode: "BIKE",  label: "Xe đạp",             icon: <Bike size={18} /> },
        { mode: "MTB",   label: "Xe đạp địa hình",    icon: <Bike size={18} /> },
      ],
    },
    {
      label: "Môn thể thao dưới nước",
      sports: [
        { mode: "SWIM",  label: "Bơi lội",            icon: <Waves size={18} /> },
      ],
    },
    {
      label: "Thể dục & Khác",
      sports: [
        { mode: "GYM",   label: "Gym",                icon: <Dumbbell size={18} /> },
        { mode: "YOGA",  label: "Yoga",               icon: <Activity size={18} /> },
        { mode: "OTHER", label: "Khác",               icon: <Zap     size={18} /> },
      ],
    },
  ];

  const iconForCode = (code: string): ReactNode => {
    const map: Record<string, ReactNode> = {
      RUN: <Flame size={18} />, TRAIL: <TrendingUp size={18} />, WALK: <Footprints size={18} />,
      HIKE: <Mountain size={18} />, BIKE: <Bike size={18} />, MTB: <Bike size={18} />,
      SWIM: <Waves size={18} />, GYM: <Dumbbell size={18} />, YOGA: <Activity size={18} />,
      OTHER: <Zap size={18} />,
    };
    return map[code] ?? <Zap size={18} />;
  };

  const SPORT_CATEGORIES: SportCategory[] = sportDefs.length > 0
    ? Object.values(
        sportDefs.reduce<Record<string, SportCategory>>((acc, d) => {
          if (!acc[d.category]) acc[d.category] = { label: d.category, sports: [] };
          acc[d.category].sports.push({ mode: d.code, label: d.label, icon: iconForCode(d.code) });
          return acc;
        }, {})
      )
    : STATIC_SPORT_CATEGORIES;

  const ALL_SPORTS: SportEntry[] = SPORT_CATEGORIES.flatMap((c) => c.sports);

  const currentSport = ALL_SPORTS.find((s) => s.mode === activityMode) ?? ALL_SPORTS[0];

  const filteredCategories = modeSearch.trim()
    ? [{ label: "Kết quả tìm kiếm", sports: ALL_SPORTS.filter((s) => s.label.toLowerCase().includes(modeSearch.toLowerCase())) }]
    : SPORT_CATEGORIES;

  function createCustomPlan() {
    const sportLabels: Record<typeof cpSport, string> = { RUN: "Chạy", SWIM: "Bơi", BOTH: "Đa môn" };
    const goalLabels: Record<typeof cpGoal, string> = { endurance: "sức bền", speed: "tốc độ", fat: "giảm mỡ" };
    const allDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
    const picks = allDays.slice(0, cpDays);
    const newPlan: TrainingDay[] = allDays.map((day, i) => {
      const isRest = !picks.includes(day);
      const dayMode = cpSport === "BOTH" ? (i % 2 === 0 ? "RUN" : "SWIM") : cpSport;
      return {
        id: `custom-${day}`,
        day,
        sport: isRest ? "REST" as const : dayMode as Sport,
        title: isRest ? "Nghỉ ngơi" : `${sportLabels[cpSport]} ${goalLabels[cpGoal]}`,
        detail: isRest ? "Phục hồi và nghỉ ngơi đầy đủ." : `${cpDuration} phút — ${goalLabels[cpGoal]}.`,
        duration: isRest ? "Nghỉ" : `${cpDuration} phút`,
        done: false,
      };
    });
    setTrainingPlan(newPlan);
    setShowCustomPlan(false);
    notify("Đã tạo lịch tập tùy chỉnh!");
  }
  const [coachNote, setCoachNote] = useState("Lịch hiện tại ưu tiên nền tảng sức bền: chạy dễ, bơi kỹ thuật và phục hồi đủ.");
  const activeActivityIdRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void; getSource: (id: string) => { setData: (d: unknown) => void } | undefined; addSource: (id: string, d: unknown) => void; addLayer: (d: unknown) => void; flyTo: (opts: unknown) => void; on: (evt: string, cb: () => void) => void } | null>(null);
  const currentMarkerRef = useRef<{ setLngLat: (lngLat: [number, number]) => void; remove: () => void } | null>(null);
  const latestLocationRef = useRef<[number, number]>(userLocation);

  useEffect(() => {
    latestLocationRef.current = userLocation;
  }, [userLocation]);

  const distanceM = calcGpsDistance(gpsPoints);
  const distKm = distanceM / 1000;
  const paceSecPerKm = distKm > 0.05 && elapsed > 0 ? Math.round(elapsed / distKm) : 0;

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    navigator.geolocation?.getCurrentPosition((pos) => {
      setUserLocation([pos.coords.longitude, pos.coords.latitude]);
    });
    import("maplibre-gl").then((ml) => {
      if (cancelled || !mapRef.current) return;
      mapInstanceRef.current?.remove();
      currentMarkerRef.current?.remove();
      currentMarkerRef.current = null;
      const map = new ml.Map({
        container: mapRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: latestLocationRef.current,
        zoom: 14,
      }) as typeof mapInstanceRef.current;
      map!.on("load", () => {
        map!.addSource("route", {
          type: "geojson",
          lineMetrics: true,
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        map!.addLayer({
          id: "route-casing",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "rgba(10, 20, 40, 0.12)", "line-width": 8, "line-blur": 0.5 },
        });
        map!.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-width": 5,
            "line-opacity": 0.96,
            "line-gradient": [
              "interpolate",
              ["linear"],
              ["line-progress"],
              0,
              "#60a5fa",
              0.45,
              "#34d399",
              1,
              "#f97316",
            ],
          },
        });

        const markerEl = document.createElement("div");
        markerEl.className = "gps-marker";
        const markerDot = document.createElement("div");
        markerDot.className = "gps-marker-dot";
        const markerRing = document.createElement("div");
        markerRing.className = "gps-marker-ring";
        markerEl.appendChild(markerRing);
        markerEl.appendChild(markerDot);
        currentMarkerRef.current = new ml.Marker({ element: markerEl, anchor: "center" })
          .setLngLat(latestLocationRef.current)
          .addTo(map!);
      });
      mapInstanceRef.current = map;
    });
    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      currentMarkerRef.current?.remove();
      currentMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const coords = gpsPoints.map((p) => [p.lng, p.lat]);
    const src = map.getSource("route");
    if (src) {
      src.setData({ type: "Feature", geometry: { type: "LineString", coordinates: coords }, properties: {} });
    }
    if (gpsPoints.length > 0) {
      const last = gpsPoints[gpsPoints.length - 1];
      currentMarkerRef.current?.setLngLat([last.lng, last.lat]);
    } else {
      currentMarkerRef.current?.setLngLat(userLocation);
    }
    if (gpsPoints.length > 0) {
      const last = gpsPoints[gpsPoints.length - 1];
      map.flyTo({ center: [last.lng, last.lat], zoom: 15 });
    }
  }, [gpsPoints, userLocation]);

  async function startRecording() {
    if (!navigator.geolocation) { setGpsError("Trình duyệt không hỗ trợ GPS."); return; }
    setGpsPoints([]);
    setElapsed(0);
    setGpsError("");
    setRecordState("recording");
    navigator.geolocation.getCurrentPosition((pos) => {
      const currentPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
      setUserLocation([currentPoint.lng, currentPoint.lat]);
      setGpsPoints([currentPoint]);
      currentMarkerRef.current?.setLngLat([currentPoint.lng, currentPoint.lat]);
    });
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setGpsPoints((prev) => {
        const nextPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() };
        setUserLocation([nextPoint.lng, nextPoint.lat]);
        currentMarkerRef.current?.setLngLat([nextPoint.lng, nextPoint.lat]);
        return [...prev, nextPoint];
      }),
      () => setGpsError("Không thể lấy vị trí GPS. Kiểm tra quyền truy cập."),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    try {
      const res = await fetch(`${API}/activities/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, athleteName: profile.displayName, sportType: modeToSport(activityMode), visibility: "PUBLIC" }),
      });
      if (res.ok) {
        const data = await res.json() as { id: number };
        activeActivityIdRef.current = data.id;
      }
    } catch {}
  }

  function pauseRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    setRecordState("paused");
  }

  function resumeRecording() {
    setRecordState("recording");
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setGpsPoints((prev) => [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() }]),
      () => {},
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
  }

  async function finishRecording() {
    pauseRecording();
    setRecordState("done");
  }

  async function saveAndReset() {
    setSaving(true);
    const durationMins = Math.max(1, Math.round(elapsed / 60));
    const backendSport = modeToSport(activityMode);
    const isSwim = backendSport === "SWIM";
    const modeLabels: Record<string, string> = { RUN: "Chạy bộ", TRAIL: "Chạy địa hình", WALK: "Đi bộ", HIKE: "Đi bộ đường dài", BIKE: "Đạp xe", MTB: "Đạp xe địa hình", SWIM: "Bơi", GYM: "Tập gym", YOGA: "Yoga", OTHER: "Tập luyện" };
    const modeLabel = ALL_SPORTS.find((s) => s.mode === activityMode)?.label ?? modeLabels[activityMode] ?? activityMode;
    const title = isSwim ? `Bơi ${Math.round(distanceM)} m` : `${modeLabel} ${distKm.toFixed(2)} km`;

    const activityId = activeActivityIdRef.current;
    if (activityId) {
      // Send GPS points then finish via new endpoints
      if (gpsPoints.length > 0) {
        try {
          await fetch(`${API}/activities/${activityId}/gps`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(gpsPoints.map((p, i) => ({ latitude: p.lat, longitude: p.lng, recordedAt: new Date(p.ts).toISOString(), sequenceOrder: i }))),
          });
        } catch {}
      }
      try {
        const res = await fetch(`${API}/activities/${activityId}/finish`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title,
            description: `GPS ghi tự động. ${gpsPoints.length} điểm.`,
            durationMinutes: durationMins,
            distanceMeters: distanceM,
            calories: Math.round(durationMins * (isSwim ? 8 : 9.5)),
            visibility: "PUBLIC",
            routeName: selectedRoute || undefined,
            averagePaceSecondsPerKm: paceSecPerKm || undefined,
          }),
        });
        if (res.ok) {
          activeActivityIdRef.current = null;
          onRouteCreated();
          setSaving(false);
          setRecordState("idle");
          setGpsPoints([]);
          setElapsed(0);
          setSelectedRoute("");
          notify("Đã lưu buổi tập và tạo tuyến đường GPS!");
          return;
        }
      } catch {}
    }

    // Fallback: use legacy single-POST flow
    await onSaveActivity({
      userId,
      athleteName: profile.displayName,
      sportType: backendSport,
      title,
      description: `GPS ghi tự động. ${gpsPoints.length} điểm.`,
      durationMinutes: durationMins,
      distanceMeters: distanceM,
      averageHeartRate: undefined,
      calories: Math.round(durationMins * (isSwim ? 8 : 9.5)),
      elevationGainMeters: undefined,
      poolLengthMeters: isSwim ? 50 : undefined,
      strokes: undefined,
      routeName: selectedRoute || "GPS tự ghi",
      visibility: "PUBLIC",
      gpsRouteJson: gpsPoints.length > 0 ? JSON.stringify(gpsPoints) : undefined,
      averagePaceSecondsPerKm: paceSecPerKm || undefined,
    });
    activeActivityIdRef.current = null;
    setSaving(false);
    setRecordState("idle");
    setGpsPoints([]);
    setElapsed(0);
    setSelectedRoute("");
    notify("Đã lưu buổi tập!");
  }

  async function regeneratePlan() {
    const insight = await api<{ recommendation: string }>("/ai/insights", token, { recommendation: coachNote }, {
      method: "POST",
      body: JSON.stringify({ userId, weeklyRunKm: stats.weeklyRunKm, weeklySwimMeters: stats.weeklySwimMeters, weeklyMinutes: stats.weeklyMinutes }),
    });
    setCoachNote(insight.recommendation);
    setTrainingPlan(initialTrainingPlan.map((d) => ({ ...d, done: false })));
    notify("Đã tạo lại lịch 7 ngày dựa trên tải tập hiện tại.");
  }

  function toggleDone(id: string) {
    setTrainingPlan(trainingPlan.map((d) => (d.id === id ? { ...d, done: !d.done } : d)));
  }

  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${ss}` : `${m}:${ss}`;
  };
  const formatPace = (sec: number) => {
    if (!sec) return "--:--";
    return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;
  };

  const isSwimMode = modeToSport(activityMode) === "SWIM";

  return (
    <div className="training-record-page">
      {/* ─── Two-column webapp layout ─── */}
      <div className="training-web-layout">
        {/* Left sidebar: controls */}
        <div className="training-web-sidebar">
          {/* Sport picker */}
          <div className="sport-picker-wrap" ref={pickerRef}>
            <button
              className="sport-picker-trigger"
              onClick={() => { if (recordState === "idle") { setShowModePicker(!showModePicker); setModeSearch(""); } }}
              disabled={recordState !== "idle"}
            >
              <span className="sport-picker-icon">{currentSport.icon}</span>
              <span className="sport-picker-label">{currentSport.label}</span>
              <ChevronDown size={16} className={`sport-picker-caret${showModePicker ? " open" : ""}`} />
            </button>

            {showModePicker && (
              <div className="sport-picker-dropdown">
                <div className="sport-picker-search">
                  <Search size={15} />
                  <input
                    autoFocus
                    placeholder="Tìm kiếm môn thể thao…"
                    value={modeSearch}
                    onChange={(e) => setModeSearch(e.target.value)}
                  />
                </div>
                <div className="sport-picker-list">
                  {filteredCategories.map((cat) => (
                    <div key={cat.label}>
                      <p className="sport-picker-category">{cat.label}</p>
                      {cat.sports.map((s) => (
                        <button
                          key={s.mode}
                          className={`sport-picker-item${activityMode === s.mode ? " active" : ""}`}
                          onClick={() => { setActivityMode(s.mode); setShowModePicker(false); setModeSearch(""); }}
                        >
                          <span className="sport-picker-item-icon">{s.icon}</span>
                          <span>{s.label}</span>
                          {activityMode === s.mode && <CheckCircle2 size={16} className="sport-picker-check" />}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Route selector */}
          <div className="training-route-selector">
            <p style={{ margin: "0 0 6px", fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Lộ trình
            </p>
            {(() => {
              const sportRoutes = routes.filter((r) => r.sportType === modeToSport(activityMode));
              return (
                <>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select
                      value={selectedRoute}
                      onChange={(e) => setSelectedRoute(e.target.value)}
                      style={{ flex: 1, height: 34, fontSize: "0.85rem" }}
                      disabled={recordState !== "idle"}
                    >
                      <option value="">-- Chọn lộ trình --</option>
                      {sportRoutes.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}{r.geoJson ? " 📍" : ""} · {r.sportType === "SWIM" ? `${r.distanceMeters}m` : `${(r.distanceMeters / 1000).toFixed(1)}km`}
                        </option>
                      ))}
                    </select>
                    {recordState === "idle" && (
                      <button
                        type="button"
                        className="training-add-route-btn"
                        title="Tạo lộ trình mới"
                        onClick={() => setShowCreateRoute(true)}
                      >
                        <CirclePlus size={18} />
                      </button>
                    )}
                  </div>
                  {recordState !== "idle" && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: recordState === "recording" ? "#10b981" : "var(--muted)" }}>
                      {recordState === "recording"
                        ? `GPS đang ghi — ${gpsPoints.length} điểm`
                        : `Sẵn sàng lưu (${gpsPoints.length} điểm GPS)`}
                    </p>
                  )}
                  {selectedRoute && recordState === "idle" && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "var(--orange)" }}>
                      <Route size={12} style={{ verticalAlign: "middle", marginRight: 3 }} />{selectedRoute}
                    </p>
                  )}
                </>
              );
            })()}
          </div>

          {/* Route Create Modal */}
          {showCreateRoute && (
            <RouteCreateModal
              token={token}
              userId={userId}
              initialSportCode={activityMode}
              sportDefs={sportDefs}
              onDone={(newRoute) => {
                setShowCreateRoute(false);
                setSelectedRoute(newRoute.name);
                onRouteCreated();
                notify(`Đã tạo lộ trình "${newRoute.name}"!`);
              }}
              onClose={() => setShowCreateRoute(false)}
            />
          )}

          <div className="record-stats">
            <div className="record-stat">
              <span className="record-stat-value">{formatElapsed(elapsed)}</span>
              <span className="record-stat-label">Thời gian</span>
            </div>
            <div className="record-stat record-stat-center">
              <span className="record-stat-value">{isSwimMode ? Math.round(distanceM) : distKm.toFixed(2)}</span>
              <span className="record-stat-label">{isSwimMode ? "m bơi" : "km"}</span>
            </div>
            <div className="record-stat">
              <span className="record-stat-value">{!isSwimMode ? formatPace(paceSecPerKm) : "--"}</span>
              <span className="record-stat-label">{!isSwimMode ? "min/km" : "pace"}</span>
            </div>
          </div>

          {gpsError && <p className="record-gps-error">{gpsError}</p>}

          <div className="training-sidebar-controls">
            {recordState === "idle" && (
              <button className="record-start-btn" onClick={startRecording}>
                <span className="record-play-icon">▶</span>
                <span>Bắt đầu</span>
              </button>
            )}
            {recordState === "recording" && (
              <>
                <button className="record-pause-btn" onClick={pauseRecording}>⏸ Tạm dừng</button>
                <button className="record-stop-btn" onClick={finishRecording}>⏹ Kết thúc</button>
              </>
            )}
            {recordState === "paused" && (
              <>
                <button className="record-start-btn small" onClick={resumeRecording}>▶ Tiếp tục</button>
                <button className="record-stop-btn" onClick={finishRecording}>⏹ Kết thúc</button>
              </>
            )}
            {recordState === "done" && (
              <div className="record-done-panel">
                <h3>Buổi tập hoàn thành!</h3>
                <div className="record-done-stats">
                  <div><strong>{formatElapsed(elapsed)}</strong><span>Thời gian</span></div>
                  <div><strong>{isSwimMode ? Math.round(distanceM) + " m" : distKm.toFixed(2) + " km"}</strong><span>Quãng đường</span></div>
                  {!isSwimMode && <div><strong>{formatPace(paceSecPerKm)}</strong><span>Pace TB</span></div>}
                  <div><strong>{Math.round((elapsed / 60) * (isSwimMode ? 8 : 9.5))}</strong><span>Cal</span></div>
                </div>
                <div className="record-done-actions">
                  <button className="orange-button" disabled={saving} onClick={saveAndReset}>
                    {saving ? "Đang lưu..." : "Lưu hoạt động"}
                  </button>
                  <button className="outline-button" onClick={() => { setRecordState("idle"); setGpsPoints([]); setElapsed(0); }}>
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>

          {recordState === "recording" && (
            <div className="training-gps-status">
              <span className="gps-dot" /> Đang ghi GPS — {gpsPoints.length} điểm
            </div>
          )}
        </div>

        {/* Right: map */}
        <div className="training-web-map">
          {isSwimMode ? (
            <div className="record-map-placeholder" style={{ height: "100%" }}>
              <Waves size={64} color="var(--muted)" />
              <p>Bơi trong hồ — GPS không áp dụng</p>
            </div>
          ) : (
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          )}
        </div>
      </div>

      {/* ─── Lịch tập 7 ngày ─── */}
      <div className="training-plan-section">
        <div className="section-head" style={{ padding: "0 0 16px" }}>
          <div>
            <span className="section-kicker">Lịch tập</span>
            <h2>Kế hoạch 7 ngày — {profile.displayName}</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "4px" }}>{coachNote}</p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button className="outline-button" onClick={() => setShowCustomPlan(!showCustomPlan)}>
              <CalendarDays size={16} /> Tự tạo lịch
            </button>
            <button className="outline-button" onClick={regeneratePlan}><Sparkles size={16} /> AI tạo lại</button>
          </div>
        </div>

        {/* Custom plan creation panel */}
        {showCustomPlan && (
          <div className="custom-plan-panel">
            <h3 style={{ margin: "0 0 16px", fontSize: "1rem" }}>Tạo lịch tập tùy chỉnh</h3>
            <div className="custom-plan-form">
              <div className="option-group">
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Số ngày / tuần</p>
                <div className="option-row">
                  {[2,3,4,5,6].map((d) => (
                    <button key={d} className={`opt-btn${cpDays === d ? " active" : ""}`} onClick={() => setCpDays(d)}>{d} ngày</button>
                  ))}
                </div>
              </div>
              <div className="option-group">
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Môn thể thao</p>
                <div className="option-row">
                  {(["RUN","SWIM","BOTH"] as const).map((s) => (
                    <button key={s} className={`opt-btn${cpSport === s ? " active" : ""}`} onClick={() => setCpSport(s)}>
                      {s === "RUN" ? "Chạy" : s === "SWIM" ? "Bơi" : "Đa môn"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="option-group">
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Thời lượng / buổi</p>
                <div className="option-row">
                  {[30,45,60,90].map((d) => (
                    <button key={d} className={`opt-btn${cpDuration === d ? " active" : ""}`} onClick={() => setCpDuration(d)}>{d} phút</button>
                  ))}
                </div>
              </div>
              <div className="option-group">
                <p style={{ margin: 0, fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Mục tiêu</p>
                <div className="option-row">
                  {(["endurance","speed","fat"] as const).map((g) => (
                    <button key={g} className={`opt-btn${cpGoal === g ? " active" : ""}`} onClick={() => setCpGoal(g)}>
                      {g === "endurance" ? "Sức bền" : g === "speed" ? "Tốc độ" : "Giảm mỡ"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="orange-button" onClick={createCustomPlan}>Tạo lịch tập</button>
              <button className="outline-button" onClick={() => setShowCustomPlan(false)}>Hủy</button>
            </div>
          </div>
        )}

        <div className="training-grid">
          {trainingPlan.map((day) => (
            <article key={day.id} className={day.done ? "training-day done" : "training-day"}>
              <div className="training-day-head">
                <span>{day.day}</span>
                <SportPill sport={day.sport} />
              </div>
              <h3>{day.title}</h3>
              <p>{day.detail}</p>
              <div className="training-day-foot">
                <strong className="day-duration">{day.duration}</strong>
                <button className={`training-done-btn${day.done ? " done" : ""}`} onClick={() => toggleDone(day.id)}>
                  {day.done ? "✓ Xong" : "Đánh dấu"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapLibreMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    import("maplibre-gl").then((maplibre) => {
      if (cancelled || !mapRef.current) return;
      if (mapInstanceRef.current) mapInstanceRef.current.remove();
      const map = new maplibre.Map({
        container: mapRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom,
      });
      mapInstanceRef.current = map;
    });
    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  return <div ref={mapRef} style={{ width: "100%", height: "350px", borderRadius: "12px" }} />;
}

function MapsPage({ routes, savedRoutes, onToggleRoute, onAddActivity, token, userId, onRouteCreated, sportDefs }: {
  routes: RouteItem[];
  savedRoutes: number[];
  onToggleRoute: (routeId: number) => void;
  onAddActivity: () => void;
  token: string;
  userId: number;
  onRouteCreated: () => void;
  sportDefs: SportDef[];
}) {
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<"ALL" | Sport>("ALL");
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [showCreateRoute, setShowCreateRoute] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nearbyRoutes, setNearbyRoutes] = useState<RouteItem[]>([]);
  const [showNearbyPanel, setShowNearbyPanel] = useState(false);
  const [nearbyMode, setNearbyMode] = useState<"at" | "from">("at");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<NominatimPlace | null>(null);
  const placeMarkerRef = useRef<{ remove: () => void } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>([106.6297, 10.8231]);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{
    remove: () => void;
    flyTo: (o: unknown) => void;
    addControl: (ctrl: unknown, pos?: string) => void;
    on: (evt: string, cb: () => void) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getSource: (id: string) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addSource: (id: string, src: unknown) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addLayer: (layer: unknown) => void;
    removeLayer: (id: string) => void;
    removeSource: (id: string) => void;
    fitBounds: (bounds: [[number, number], [number, number]], opts?: unknown) => void;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mlRef = useRef<any>(null);
  const markersRef = useRef<{ remove: () => void }[]>([]);

  const filtered = useMemo(
    () =>
      routes.filter((r) => {
        const q = `${r.name} ${r.place ?? ""} ${r.sportType}`.toLowerCase();
        const matchesText = q.includes(query.toLowerCase());
        const matchesSport = sportFilter === "ALL" || r.sportType === sportFilter;
        return matchesText && matchesSport;
      }),
    [routes, query, sportFilter]
  );

  // Render selected route GeoJSON polyline on the map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const ROUTE_SOURCE = "selected-route";
    const LAYER_CASING = "sel-route-casing";
    const LAYER_LINE = "sel-route-line";
    try { map.removeLayer(LAYER_LINE); } catch {}
    try { map.removeLayer(LAYER_CASING); } catch {}
    try { map.removeSource(ROUTE_SOURCE); } catch {}
    if (!selectedRoute?.geoJson) return;
    try {
      const geo = JSON.parse(selectedRoute.geoJson) as { type: string; coordinates: [number, number][] };
      if (!geo.coordinates || geo.coordinates.length < 2) return;
      map.addSource(ROUTE_SOURCE, { type: "geojson", data: { type: "Feature", geometry: geo, properties: {} } });
      map.addLayer({ id: LAYER_CASING, type: "line", source: ROUTE_SOURCE, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "rgba(10,20,40,0.15)", "line-width": 9 } });
      map.addLayer({ id: LAYER_LINE, type: "line", source: ROUTE_SOURCE, layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": selectedRoute.sportType === "SWIM" ? "#60a5fa" : "#f97316", "line-width": 5, "line-opacity": 0.95 } });
      const lngs = geo.coordinates.map((c) => c[0]);
      const lats = geo.coordinates.map((c) => c[1]);
      map.fitBounds(
        [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
        { padding: 60, maxZoom: 16, duration: 800 }
      );
    } catch {}
  }, [mapReady, selectedRoute]);

  // Init map
  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    import("maplibre-gl").then((ml) => {
      if (cancelled || !mapRef.current) return;
      mlRef.current = ml;
      mapInstanceRef.current?.remove();
      const map = new ml.Map({
        container: mapRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: userLocation,
        zoom: 13,
      });
      map.addControl(new ml.NavigationControl(), "top-right");
      map.addControl(
        new ml.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: false,
          showUserLocation: true,
        }),
        "top-right"
      );
      map.on("load", () => { if (!cancelled) setMapReady(true); });
      mapInstanceRef.current = map as unknown as typeof mapInstanceRef.current;
    });
    return () => {
      cancelled = true;
      setMapReady(false);
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      mlRef.current = null;
    };
  }, []);

  // Place a simple marker for routes that have a start coordinate (first coord of geoJson)
  useEffect(() => {
    if (!mapReady || !mlRef.current || !mapInstanceRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ml = mlRef.current as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const map = mapInstanceRef.current as any;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    filtered.forEach((route) => {
      let startCoord: [number, number] | null = null;
      if (route.geoJson) {
        try {
          const geo = JSON.parse(route.geoJson) as { coordinates: [number, number][] };
          if (geo.coordinates?.length >= 1) startCoord = geo.coordinates[0];
        } catch {}
      }
      if (!startCoord) return;
      const el = document.createElement("div");
      const isSelected = selectedRoute?.id === route.id;
      el.className = `route-map-marker ${route.sportType === "RUN" ? "run" : "swim"}${isSelected ? " selected" : ""}`;
      el.title = route.name;
      el.addEventListener("click", () => { setSelectedRoute(route); setPanelOpen(true); });
      const m = new ml.Marker({ element: el, anchor: "center" }).setLngLat(startCoord).addTo(map);
      markersRef.current.push({ remove: () => m.remove() });
    });
  }, [mapReady, filtered, selectedRoute?.id]);

  // Debounced Nominatim geocode search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) { setSearchResults([]); return; }
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1`,
          { headers: { "Accept-Language": "vi,en" } }
        );
        const data: NominatimPlace[] = await res.json();
        setSearchResults(data);
      } catch { /* network silently ignored */ }
    }, 380);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  function pinPlace(place: NominatimPlace) {
    setSelectedPlace(place);
    setSelectedRoute(null);
    setSearchFocused(false);
    setSearchResults([]);
    setSearchQuery(place.display_name.split(",")[0]);
    if (!mlRef.current || !mapInstanceRef.current) return;
    const lngLat: [number, number] = [parseFloat(place.lon), parseFloat(place.lat)];
    placeMarkerRef.current?.remove();
    const el = document.createElement("div");
    el.className = "place-pin-marker";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = new (mlRef.current as any).Marker({ element: el, anchor: "bottom" })
      .setLngLat(lngLat)
      .addTo(mapInstanceRef.current as unknown as object);
    placeMarkerRef.current = { remove: () => m.remove() };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mapInstanceRef.current as any).flyTo({ center: lngLat, zoom: 15, duration: 700 });
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchFocused(false);
    setSearchResults([]);
    setSelectedPlace(null);
    placeMarkerRef.current?.remove();
    placeMarkerRef.current = null;
  }

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const place: NominatimPlace = {
        place_id: 0,
        display_name: "Vị trí hiện tại",
        lat: String(pos.coords.latitude),
        lon: String(pos.coords.longitude),
      };
      pinPlace(place);
    }, () => {});
  }

  function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function openNearbyRoutes(mode: "at" | "from") {
    if (!selectedPlace) return;
    const placeLat = parseFloat(selectedPlace.lat);
    const placeLon = parseFloat(selectedPlace.lon);
    const found = routes.filter((r) => {
      if (!r.geoJson) return false;
      try {
        const geo = JSON.parse(r.geoJson) as { coordinates: [number, number][] };
        if (!geo.coordinates?.length) return false;
        if (mode === "from") {
          const [lon, lat] = geo.coordinates[0];
          return haversineKm(placeLat, placeLon, lat, lon) <= 5;
        }
        return geo.coordinates.some(([lon, lat]) => haversineKm(placeLat, placeLon, lat, lon) <= 10);
      } catch { return false; }
    });
    setNearbyRoutes(found);
    setNearbyMode(mode);
    setShowNearbyPanel(true);
  }

  function focusRoute(route: RouteItem) {
    setSelectedPlace(null);
    placeMarkerRef.current?.remove();
    placeMarkerRef.current = null;
    setShowNearbyPanel(false);
    setSelectedRoute(route);
  }

  return (
    <div className="maps-strava-layout">
      {/* ── Left sidebar ─────────────────────────────────── */}
      <div className={`maps-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="maps-sidebar-inner">
        <div className="maps-sidebar-header">
          <div className="maps-sidebar-title">
            <Route size={17} />
            <span>Lộ trình{filtered.length > 0 ? ` (${filtered.length})` : ""}</span>
          </div>
          <button className="orange-button maps-new-route-btn" onClick={() => setShowCreateRoute(true)}>
            <CirclePlus size={13} /> Tạo mới
          </button>
        </div>

        <div className="maps-sidebar-search">
          <Search size={14} />
          <input
            placeholder="Tìm kiếm lộ trình..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="maps-sidebar-list">
          {filtered.length === 0 ? (
            <div className="maps-sidebar-empty">
              <Route size={40} />
              <p>{routes.length === 0 ? "Chưa có lộ trình nào." : "Không tìm thấy lộ trình phù hợp."}</p>
              {routes.length === 0 && (
                <button className="orange-button" style={{ marginTop: 10 }} onClick={() => setShowCreateRoute(true)}>
                  <CirclePlus size={14} /> Tạo lộ trình đầu tiên
                </button>
              )}
            </div>
          ) : (
            filtered.map((route) => (
              <div
                key={route.id}
                className={`maps-route-card${selectedRoute?.id === route.id ? " selected" : ""}`}
                onClick={() => focusRoute(route)}
              >
                <div className="maps-route-card-badges">
                  <SportPill sport={route.sportType} />
                  {route.geoJson && <span className="rc-badge rc-gps">GPS</span>}
                  {route.createdBy === userId && <span className="rc-badge rc-mine">Của tôi</span>}
                  {route.visibility === "PRIVATE" && (
                    <span className="rc-badge rc-private"><Lock size={9} /> Riêng tư</span>
                  )}
                </div>
                <div className="maps-route-card-name">{route.name}</div>
                <div className="maps-route-card-meta">
                  {route.place && <span>{route.place} · </span>}
                  <span className="rc-dist">{formatRouteDistance(route)}</span>
                </div>
                <div className="maps-route-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={savedRoutes.includes(route.id) ? "outline-button" : "orange-button"}
                    style={{ fontSize: "0.75rem", padding: "3px 10px", minHeight: "26px" }}
                    onClick={() => onToggleRoute(route.id)}
                  >
                    {savedRoutes.includes(route.id) ? "Đã lưu" : "Lưu"}
                  </button>
                  {route.createdBy === userId && (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="icon-button"
                        style={{ color: route.visibility === "PRIVATE" ? "#7c3aed" : "#6b7280" }}
                        title={route.visibility === "PRIVATE" ? "Đang ẩn — click để công khai" : "Đang công khai — click để ẩn"}
                        onClick={async () => {
                          await api<RouteItem>(`/activities/routes/${route.id}/visibility`, token, route, { method: "PATCH" });
                          onRouteCreated();
                        }}
                      >
                        {route.visibility === "PRIVATE" ? <Lock size={13} /> : <Globe size={13} />}
                      </button>
                      <button
                        className="icon-button"
                        style={{ color: "#dc2626" }}
                        title="Xóa lộ trình"
                        onClick={async () => {
                          if (!confirm(`Xóa lộ trình "${route.name}"?`)) return;
                          await api<null>(`/activities/routes/${route.id}/mine`, token, null, { method: "DELETE" });
                          if (selectedRoute?.id === route.id) setSelectedRoute(null);
                          onRouteCreated();
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        </div>{/* maps-sidebar-inner */}
      </div>

      {/* ── Map area ─────────────────────────────────────── */}
      <div className="maps-map-area">
        <div ref={mapRef} className="maps-fullscreen-map" />

        {/* ── Location search overlay ───────────────────── */}
        <div className={`maps-loc-search${searchFocused ? " focused" : ""}`}>
          <div className="maps-loc-search-bar">
            <Search size={15} className="mls-icon" />
            <input
              ref={searchInputRef}
              className="mls-input"
              placeholder="Tìm kiếm tại đây"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") clearSearch(); }}
            />
            {(searchFocused || searchQuery) && (
              <button className="mls-cancel" onClick={clearSearch}>Hủy</button>
            )}
          </div>
          {searchFocused && (
            <div className="maps-loc-dropdown">
              <button className="mls-loc-btn" onClick={locateMe}>
                <Navigation size={14} /> Vị trí hiện tại
              </button>
              {searchResults.map((place) => (
                <button
                  key={place.place_id}
                  className="mls-suggestion"
                  onClick={() => pinPlace(place)}
                >
                  <MapPin size={13} className="mls-pin-icon" />
                  <span>
                    <span className="mls-s-name">{place.display_name.split(",")[0]}</span>
                    <span className="mls-s-addr">{place.display_name.split(",").slice(1, 3).join(",").trim()}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Floating action buttons */}
        <div className="maps-map-fabs">
          <button
            className="maps-sidebar-toggle"
            title={sidebarOpen ? "Ẩn danh sách lộ trình" : "Xem danh sách lộ trình"}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={17} />
          </button>
          <button className="outline-button maps-fab-btn" onClick={() => setShowCreateRoute(true)}>
            <CirclePlus size={14} /> Tạo lộ trình
          </button>
          <button className="orange-button maps-fab-btn" onClick={onAddActivity}>
            <Route size={14} /> Ghi hoạt động
          </button>
        </div>

        {/* Selected route detail card */}
        {selectedRoute && (
          <div className="maps-route-detail">
            <div className="maps-route-detail-head">
              <SportPill sport={selectedRoute.sportType} />
              <strong>{selectedRoute.name}</strong>
              {selectedRoute.geoJson && (
                <span className="rc-badge rc-gps" style={{ marginLeft: 4 }}>GPS</span>
              )}
              <button className="icon-button" style={{ marginLeft: "auto" }} onClick={() => setSelectedRoute(null)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ margin: "4px 0 2px", fontSize: "0.88rem" }}>
              {selectedRoute.place ? `${selectedRoute.place} · ` : ""}
              {formatRouteDistance(selectedRoute)}
            </p>
            {selectedRoute.note && (
              <p style={{ color: "var(--muted)", fontSize: "0.83rem", margin: "0 0 10px" }}>{selectedRoute.note}</p>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className={savedRoutes.includes(selectedRoute.id) ? "outline-button" : "orange-button"}
                onClick={() => onToggleRoute(selectedRoute.id)}
              >
                {savedRoutes.includes(selectedRoute.id) ? "Đã lưu" : "Lưu tuyến"}
              </button>
              <button className="outline-button" onClick={onAddActivity}>Ghi hoạt động</button>
            </div>
          </div>
        )}

        {/* Nearby routes panel */}
        {showNearbyPanel && selectedPlace && (
          <div className="maps-nearby-panel">
            <div className="mnp-header">
              <button className="icon-button" onClick={() => setShowNearbyPanel(false)} title="Quay lại">
                <X size={16} />
              </button>
              <span className="mnp-title">
                {nearbyMode === "at" ? "Lộ trình tại đây" : "Lộ trình từ đây"}
                <span className="mnp-place"> · {selectedPlace.display_name.split(",")[0]}</span>
              </span>
              <button className="orange-button mnp-create-btn" onClick={() => setShowCreateRoute(true)}>
                <CirclePlus size={13} /> Tạo mới
              </button>
            </div>

            {nearbyRoutes.length === 0 ? (
              <div className="mnp-empty">
                <Route size={28} />
                <p>Chưa có lộ trình nào trong bán kính {nearbyMode === "at" ? "10" : "5"} km.</p>
                <button className="orange-button" onClick={() => { setShowNearbyPanel(false); setShowCreateRoute(true); }}>
                  <CirclePlus size={14} /> Tạo lộ trình tại đây
                </button>
              </div>
            ) : (
              <div className="mnp-scroll">
                {nearbyRoutes.map((route) => {
                  const km = route.distanceMeters / 1000;
                  const mins = route.sportType === "SWIM"
                    ? Math.round(route.distanceMeters / 100 * 2)
                    : Math.round(km * 6);
                  const timeStr = mins < 60 ? `${mins} phút` : `${Math.floor(mins / 60)} giờ${mins % 60 ? ` ${mins % 60} phút` : ""}`;
                  return (
                    <div
                      key={route.id}
                      className="mnp-card"
                      onClick={() => { focusRoute(route); }}
                    >
                      <div className="mnp-card-top">
                        <SportPill sport={route.sportType} />
                        {route.geoJson && <span className="rc-badge rc-gps">GPS</span>}
                        {route.createdBy === userId && <span className="rc-badge rc-mine">Của tôi</span>}
                      </div>
                      <div className="mnp-card-name">{route.name}</div>
                      <div className="mnp-card-stats">
                        <span><strong>{km.toFixed(1)}</strong> km</span>
                        <span>·</span>
                        <span>{timeStr}</span>
                      </div>
                      <div className="mnp-card-tag">
                        <MapPin size={10} />
                        {nearbyMode === "at" ? "Tuyến đi qua đây" : "Xuất phát từ đây"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected place detail card */}
        {selectedPlace && !searchFocused && !showNearbyPanel && (
          <div className="maps-place-detail">
            <button className="icon-button" style={{ position: "absolute", top: 12, right: 12 }} onClick={clearSearch}>
              <X size={18} />
            </button>
            <h3 className="mpd-name">{selectedPlace.display_name.split(",")[0]}</h3>
            <p className="mpd-addr">
              <MapPin size={12} />{" "}
              {selectedPlace.display_name === "Vị trí hiện tại"
                ? "Vị trí GPS của bạn"
                : selectedPlace.display_name.split(",").slice(1, 4).join(", ").trim()}
            </p>
            <div className="mpd-actions">
              <button
                className="orange-button"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => openNearbyRoutes("at")}
              >
                <Route size={15} /> Lộ trình tại đây
              </button>
              <button
                className="outline-button"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => openNearbyRoutes("from")}
              >
                <MapPin size={15} /> Các lộ trình từ đây
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Route Create Modal */}
      {showCreateRoute && (
        <RouteCreateModal
          token={token}
          userId={userId}
          initialSportCode={sportFilter === "SWIM" ? "SWIM" : "RUN"}
          sportDefs={sportDefs}
          onDone={(newRoute) => {
            setShowCreateRoute(false);
            onRouteCreated();
            setSelectedRoute(newRoute);
          }}
          onClose={() => setShowCreateRoute(false)}
        />
      )}
    </div>
  );
}

function ChallengesPage({ challenges, onToggle }: { challenges: Challenge[]; onToggle: (id: string, joined: boolean) => void }) {
  return (
    <div className="single-page">
      <section className="page-title">
        <span className="section-kicker">Thử thách</span>
        <h1>Mục tiêu cá nhân cho chạy và bơi</h1>
        <p>Dùng thử thách như mốc kiểm tra tiến bộ của chính bạn.</p>
      </section>
      <section className="challenge-grid">
        {challenges.map((c) => (
          <article key={c.id} className="challenge-card">
            <Medal size={32} />
            <SportPill sport={c.sportType} />
            <h3>{c.title}</h3>
            <p>{c.note}</p>
            <ProgressRow label={c.target} value={`${Math.round(c.progress)}%`} progress={c.progress} />
            <button className={c.joined ? "outline-button" : "orange-button"} onClick={() => onToggle(c.id, c.joined)}>
              {c.joined ? "Đang tham gia" : "Tham gia"}
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

function NutritionPage({ token, userId, plan, setPlan, meals, setMeals, activities, notify }: {
  token: string;
  userId: number;
  plan: NutritionPlan;
  setPlan: (plan: NutritionPlan) => void;
  meals: MealEntry[];
  setMeals: (meals: MealEntry[]) => void;
  activities: FitnessActivity[];
  notify: (msg: string) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const [mealType, setMealType] = useState("SNACK");
  const [quickInput, setQuickInput] = useState("1 to pho bo");
  const [foodQuery, setFoodQuery] = useState("");
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<number | null>(null);
  const [servings, setServings] = useState(1);
  const [manualMeal, setManualMeal] = useState({ mealType: "SNACK", name: "Recovery smoothie", calories: 420, proteinGrams: 32, carbsGrams: 58, fatGrams: 8 });
  const [waterMl, setWaterMl] = useState(250);
  const [waterTotalMl, setWaterTotalMl] = useState(0);
  const [selectedActivityId, setSelectedActivityId] = useState<number | "">("");
  const [recovery, setRecovery] = useState<RecoverySuggestion | null>(null);
  const [busyMeal, setBusyMeal] = useState(false);

  useEffect(() => setDraft(plan), [plan]);

  useEffect(() => {
    if (!token || token === "demo") return;
    api<{ totalMl: number }>(`/nutrition/${userId}/water/today`, token, { totalMl: 0 }).then((r) => setWaterTotalMl(r.totalMl));
  }, [token, userId]);

  useEffect(() => {
    if (!token || token === "demo") return;
    let active = true;
    const timer = window.setTimeout(() => {
      const query = foodQuery.trim();
      const path = `/nutrition/foods${query ? `?q=${encodeURIComponent(query)}` : ""}`;
      api<FoodItem[]>(path, token, []).then((items) => {
        if (!active) return;
        setFoods(items);
        setSelectedFoodId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null);
      });
    }, 200);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [foodQuery, token]);

  const recentActivities = useMemo(() => [...activities]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 6), [activities]);

  useEffect(() => {
    setSelectedActivityId((current) => (current || recentActivities[0]?.id) ?? "");
  }, [recentActivities]);

  async function savePlan(e: FormEvent) {
    e.preventDefault();
    const saved = await api<NutritionPlan>(`/nutrition/${userId}/plan`, token, draft, { method: "PUT", body: JSON.stringify(draft) });
    setPlan(saved);
    notify("Da luu ke hoach dinh duong.");
  }

  async function quickAddMeal(e: FormEvent) {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setBusyMeal(true);
    try {
      const created = await apiStrict<MealEntry>(`/nutrition/${userId}/meals/quick`, token, {
        method: "POST",
        body: JSON.stringify({ query: quickInput, mealType }),
      });
      setMeals([created, ...meals]);
      setQuickInput("");
      notify(`Da tinh va them ${created.name}.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Khong tim thay mon phu hop.");
    } finally {
      setBusyMeal(false);
    }
  }

  async function addSelectedFood(e: FormEvent) {
    e.preventDefault();
    if (!selectedFoodId) return;
    setBusyMeal(true);
    try {
      const food = foods.find((item) => item.id === selectedFoodId);
      const created = await apiStrict<MealEntry>(`/nutrition/${userId}/meals/from-food`, token, {
        method: "POST",
        body: JSON.stringify({ foodId: selectedFoodId, mealType, servings, customName: food?.name }),
      });
      setMeals([created, ...meals]);
      notify(`Da them ${created.name} vao nhat ky.`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Khong the them mon an.");
    } finally {
      setBusyMeal(false);
    }
  }

  async function addManualMeal(e: FormEvent) {
    e.preventDefault();
    setBusyMeal(true);
    try {
      const created = await apiStrict<MealEntry>("/nutrition/meals", token, {
        method: "POST",
        body: JSON.stringify({ userId, ...manualMeal }),
      });
      setMeals([created, ...meals]);
      notify("Da them bua an vao nhat ky.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Khong the them bua an.");
    } finally {
      setBusyMeal(false);
    }
  }

  async function logWater(e: FormEvent) {
    e.preventDefault();
    await api<{ amountMl: number }>(`/nutrition/${userId}/water`, token, { amountMl: waterMl }, {
      method: "POST",
      body: JSON.stringify({ amountMl: waterMl }),
    });
    setWaterTotalMl((prev) => prev + waterMl);
    notify(`Da ghi ${waterMl}ml nuoc uong.`);
  }

  async function requestRecoverySuggestion() {
    const activity = recentActivities.find((item) => item.id === selectedActivityId) ?? recentActivities[0];
    if (!activity) return;
    try {
      const suggestion = await apiStrict<RecoverySuggestion>("/nutrition/recovery-suggestion", token, {
        method: "POST",
        body: JSON.stringify({
          userId,
          sportType: activity.sportType,
          distanceMeters: activity.distanceMeters,
          durationMinutes: activity.durationMinutes,
          calories: activity.calories,
        }),
      });
      setRecovery(suggestion);
      notify("Da tao goi y phuc hoi sau buoi tap.");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Khong the tao goi y phuc hoi.");
    }
  }

  const todayKey = new Date().toDateString();
  const todayMeals = meals.filter((meal) => !meal.eatenAt || new Date(meal.eatenAt).toDateString() === todayKey);
  const totals = todayMeals.reduce((s, m) => ({ calories: s.calories + m.calories, protein: s.protein + m.proteinGrams, carbs: s.carbs + m.carbsGrams, fat: s.fat + m.fatGrams }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const waterGoalMl = Math.round(plan.hydrationLiters * 1000);
  const waterPercent = waterGoalMl > 0 ? Math.min(100, Math.round((waterTotalMl / waterGoalMl) * 100)) : 0;
  const selectedFood = foods.find((item) => item.id === selectedFoodId) ?? foods[0];
  const selectedFoodEstimate = selectedFood ? {
    calories: Math.round(selectedFood.calories * servings),
    protein: Math.round(selectedFood.proteinGrams * servings),
    carbs: Math.round(selectedFood.carbsGrams * servings),
    fat: Math.round(selectedFood.fatGrams * servings),
  } : null;

  return (
    <div className="nutrition-page nutrition-page-pro">
      <section className="page-title">
        <span className="section-kicker">Dinh duong</span>
        <h1>Ke hoach nap nang luong</h1>
        <p>Theo doi calories, macro, nuoc uong va bua phuc hoi sau cac buoi chay/boi.</p>
      </section>

      <section className="nutrition-summary-strip">
        <MacroBox icon={<Flame size={18} />} label="Calories" value={`${totals.calories}/${plan.dailyCalories}`} />
        <MacroBox icon={<Utensils size={18} />} label="Protein" value={`${totals.protein}/${plan.proteinGrams}g`} />
        <MacroBox icon={<Activity size={18} />} label="Carb" value={`${totals.carbs}/${plan.carbsGrams}g`} />
        <MacroBox icon={<Droplets size={18} />} label="Fat" value={`${totals.fat}/${plan.fatGrams}g`} />
      </section>

      <section className="nutrition-panels nutrition-panels-pro">
        <form className="white-panel nutrition-form" onSubmit={savePlan}>
          <h2>Muc tieu hang ngay</h2>
          <label>Muc tieu<input value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} /></label>
          <div className="input-grid">
            <NumberField label="Calories" value={draft.dailyCalories} onChange={(v) => setDraft({ ...draft, dailyCalories: v })} />
            <NumberField label="Protein (g)" value={draft.proteinGrams} onChange={(v) => setDraft({ ...draft, proteinGrams: v })} />
            <NumberField label="Carb (g)" value={draft.carbsGrams} onChange={(v) => setDraft({ ...draft, carbsGrams: v })} />
            <NumberField label="Fat (g)" value={draft.fatGrams} onChange={(v) => setDraft({ ...draft, fatGrams: v })} />
          </div>
          <label>Nuoc/ngay (lit)<input type="number" step="0.1" value={draft.hydrationLiters} onChange={(e) => setDraft({ ...draft, hydrationLiters: Number(e.target.value) })} /></label>
          <label>Goi y<textarea value={draft.guidance} onChange={(e) => setDraft({ ...draft, guidance: e.target.value })} /></label>
          <button className="orange-button"><CheckCircle2 size={18} /> Luu ke hoach</button>
        </form>

        <div className="white-panel nutrition-log-panel">
          <div className="nutrition-panel-head">
            <h2>Nhat ky bua an</h2>
            <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
              <option>BREAKFAST</option><option>LUNCH</option><option>DINNER</option><option>SNACK</option>
            </select>
          </div>

          <form className="quick-food-form" onSubmit={quickAddMeal}>
            <div className="food-search-box">
              <Search size={17} />
              <input value={quickInput} onChange={(e) => setQuickInput(e.target.value)} placeholder="VD: 1 to pho bo, 2 qua trung, 200g com" />
            </div>
            <button className="orange-button" disabled={busyMeal}><Sparkles size={16} /> Tu tinh</button>
          </form>

          <div className="food-library-picker">
            <div className="food-search-box">
              <Search size={17} />
              <input value={foodQuery} onChange={(e) => setFoodQuery(e.target.value)} placeholder="Tim trong database mon an" />
            </div>
            <div className="food-result-list">
              {foods.length === 0 ? (
                <div className="empty-log compact">Chua co mon phu hop trong database.</div>
              ) : foods.slice(0, 6).map((food) => (
                <button key={food.id} type="button" className={`food-result${selectedFoodId === food.id ? " active" : ""}`} onClick={() => setSelectedFoodId(food.id)}>
                  <span>
                    <strong>{food.name}</strong>
                    <small>{food.servingSize}</small>
                  </span>
                  <span>{food.calories} kcal</span>
                </button>
              ))}
            </div>
            {selectedFood && selectedFoodEstimate && (
              <form className="selected-food-panel" onSubmit={addSelectedFood}>
                <div>
                  <strong>{selectedFood.name}</strong>
                  <p>{selectedFoodEstimate.calories} kcal | P {selectedFoodEstimate.protein}g | C {selectedFoodEstimate.carbs}g | F {selectedFoodEstimate.fat}g</p>
                </div>
                <label>Khau phan
                  <input type="number" min="0.25" max="10" step="0.25" value={servings} onChange={(e) => setServings(Number(e.target.value))} />
                </label>
                <button className="outline-button" disabled={busyMeal}><CirclePlus size={16} /> Them</button>
              </form>
            )}
          </div>

          <details className="manual-meal-details">
            <summary>Nhap macro thu cong</summary>
            <form className="meal-form" onSubmit={addManualMeal}>
              <select value={manualMeal.mealType} onChange={(e) => setManualMeal({ ...manualMeal, mealType: e.target.value })}>
                <option>BREAKFAST</option><option>LUNCH</option><option>DINNER</option><option>SNACK</option>
              </select>
              <input value={manualMeal.name} onChange={(e) => setManualMeal({ ...manualMeal, name: e.target.value })} />
              <NumberField label="Calories" value={manualMeal.calories} onChange={(v) => setManualMeal({ ...manualMeal, calories: v })} />
              <NumberField label="Protein" value={manualMeal.proteinGrams} onChange={(v) => setManualMeal({ ...manualMeal, proteinGrams: v })} />
              <NumberField label="Carb" value={manualMeal.carbsGrams} onChange={(v) => setManualMeal({ ...manualMeal, carbsGrams: v })} />
              <NumberField label="Fat" value={manualMeal.fatGrams} onChange={(v) => setManualMeal({ ...manualMeal, fatGrams: v })} />
              <button className="orange-button">Them bua</button>
            </form>
          </details>

          <h3>Da an hom nay</h3>
          <div className="meal-list">
            {todayMeals.length === 0 ? (
              <div className="empty-log"><Utensils size={44} /><h3>Chua co bua an</h3><p>Them bua an dau tien.</p></div>
            ) : (
              todayMeals.map((m) => (
                <div key={m.id} className="meal-row meal-row-pro">
                  <span>{m.mealType}</span>
                  <strong>{m.name}<small>{m.servings ? ` x${m.servings}` : ""} {m.servingSize ?? ""}</small></strong>
                  <small>{m.calories} kcal</small>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="white-panel recovery-panel">
          <h2><Sparkles size={20} /> AI phuc hoi sau tap</h2>
          <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(Number(e.target.value))}>
            {recentActivities.length === 0 ? <option value="">Chua co buoi tap</option> : recentActivities.map((activity) => (
              <option key={activity.id} value={activity.id}>
                {activity.title} - {(activity.distanceMeters / 1000).toFixed(activity.sportType === "RUN" ? 1 : 2)} km
              </option>
            ))}
          </select>
          <button className="orange-button" type="button" onClick={requestRecoverySuggestion} disabled={recentActivities.length === 0}>
            <Sparkles size={16} /> Goi y bua phuc hoi
          </button>
          {recovery && (
            <div className="recovery-result">
              <p>{recovery.message}</p>
              <div className="recovery-targets">
                <span>{recovery.burnedCalories} kcal da dot</span>
                <span>{recovery.targetCarbsGrams}g carb</span>
                <span>{recovery.targetProteinGrams}g protein</span>
              </div>
              <div className="recovery-ideas">
                {recovery.mealIdeas.map((idea) => <button type="button" key={idea} onClick={() => setQuickInput(idea)}>{idea}</button>)}
              </div>
            </div>
          )}
        </div>

        <div className="white-panel water-panel">
          <h2><Droplets size={20} /> Nuoc uong hom nay</h2>
          <div className="water-progress-bar">
            <div className="water-progress-fill" style={{ width: `${waterPercent}%` }} />
          </div>
          <p className="water-total">{waterTotalMl} ml / {waterGoalMl} ml ({waterPercent}%)</p>
          <form className="water-form" onSubmit={logWater}>
            <select value={waterMl} onChange={(e) => setWaterMl(Number(e.target.value))}>
              <option value={150}>150 ml</option>
              <option value={250}>250 ml</option>
              <option value={350}>350 ml</option>
              <option value={500}>500 ml</option>
              <option value={750}>750 ml</option>
            </select>
            <button className="orange-button" type="submit"><Droplets size={16} /> Ghi nuoc</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function LegacyNutritionPage({ token, userId, plan, setPlan, meals, setMeals, notify }: {
  token: string;
  userId: number;
  plan: NutritionPlan;
  setPlan: (plan: NutritionPlan) => void;
  meals: MealEntry[];
  setMeals: (meals: MealEntry[]) => void;
  notify: (msg: string) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const [meal, setMeal] = useState({ mealType: "SNACK", name: "Recovery smoothie", calories: 420, proteinGrams: 32, carbsGrams: 58, fatGrams: 8 });
  const [waterMl, setWaterMl] = useState(250);
  const [waterTotalMl, setWaterTotalMl] = useState(0);

  useEffect(() => setDraft(plan), [plan]);

  useEffect(() => {
    if (!token || token === "demo") return;
    api<{ totalMl: number }>(`/nutrition/${userId}/water/today`, token, { totalMl: 0 }).then((r) => setWaterTotalMl(r.totalMl));
  }, [token, userId]);

  async function savePlan(e: FormEvent) {
    e.preventDefault();
    const saved = await api<NutritionPlan>(`/nutrition/${userId}/plan`, token, draft, { method: "PUT", body: JSON.stringify(draft) });
    setPlan(saved);
    notify("Đã lưu kế hoạch dinh dưỡng.");
  }

  async function addMeal(e: FormEvent) {
    e.preventDefault();
    const created = await api<MealEntry>("/nutrition/meals", token, { ...meal, id: Date.now() }, {
      method: "POST",
      body: JSON.stringify({ userId, ...meal }),
    });
    setMeals([created, ...meals]);
    notify("Đã thêm bữa ăn vào nhật ký.");
  }

  async function logWater(e: FormEvent) {
    e.preventDefault();
    await api<{ amountMl: number }>(`/nutrition/${userId}/water`, token, { amountMl: waterMl }, {
      method: "POST",
      body: JSON.stringify({ amountMl: waterMl }),
    });
    setWaterTotalMl((prev) => prev + waterMl);
    notify(`Đã ghi ${waterMl}ml nước uống.`);
  }

  const totals = meals.reduce((s, m) => ({ calories: s.calories + m.calories, protein: s.protein + m.proteinGrams, carbs: s.carbs + m.carbsGrams, fat: s.fat + m.fatGrams }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  const waterGoalMl = Math.round(plan.hydrationLiters * 1000);
  const waterPercent = Math.min(100, Math.round((waterTotalMl / waterGoalMl) * 100));

  return (
    <div className="nutrition-page">
      <section className="page-title">
        <span className="section-kicker">Dinh dưỡng</span>
        <h1>Kế hoạch nạp năng lượng</h1>
        <p>Theo dõi calories, macro và bữa phục hồi cho lịch chạy/bơi.</p>
      </section>
      <section className="nutrition-panels">
        <form className="white-panel nutrition-form" onSubmit={savePlan}>
          <h2>Mục tiêu hằng ngày</h2>
          <label>Mục tiêu<input value={draft.goal} onChange={(e) => setDraft({ ...draft, goal: e.target.value })} /></label>
          <div className="input-grid">
            <NumberField label="Calories" value={draft.dailyCalories} onChange={(v) => setDraft({ ...draft, dailyCalories: v })} />
            <NumberField label="Protein (g)" value={draft.proteinGrams} onChange={(v) => setDraft({ ...draft, proteinGrams: v })} />
            <NumberField label="Carb (g)" value={draft.carbsGrams} onChange={(v) => setDraft({ ...draft, carbsGrams: v })} />
            <NumberField label="Fat (g)" value={draft.fatGrams} onChange={(v) => setDraft({ ...draft, fatGrams: v })} />
          </div>
          <label>Nước/ngày (lít)<input type="number" step="0.1" value={draft.hydrationLiters} onChange={(e) => setDraft({ ...draft, hydrationLiters: Number(e.target.value) })} /></label>
          <label>Gợi ý<textarea value={draft.guidance} onChange={(e) => setDraft({ ...draft, guidance: e.target.value })} /></label>
          <button className="orange-button"><CheckCircle2 size={18} /> Lưu kế hoạch</button>
        </form>
        <div className="white-panel">
          <h2>Đã ăn hôm nay</h2>
          <div className="macro-total-grid">
            <MacroBox icon={<Flame size={18} />} label="Calories" value={`${totals.calories}/${plan.dailyCalories}`} />
            <MacroBox icon={<Utensils size={18} />} label="Protein" value={`${totals.protein}/${plan.proteinGrams}g`} />
            <MacroBox icon={<Activity size={18} />} label="Carb" value={`${totals.carbs}/${plan.carbsGrams}g`} />
            <MacroBox icon={<Droplets size={18} />} label="Fat" value={`${totals.fat}/${plan.fatGrams}g`} />
          </div>
          <form className="meal-form" onSubmit={addMeal}>
            <select value={meal.mealType} onChange={(e) => setMeal({ ...meal, mealType: e.target.value })}>
              <option>BREAKFAST</option><option>LUNCH</option><option>DINNER</option><option>SNACK</option>
            </select>
            <input value={meal.name} onChange={(e) => setMeal({ ...meal, name: e.target.value })} />
            <NumberField label="Calories" value={meal.calories} onChange={(v) => setMeal({ ...meal, calories: v })} />
            <NumberField label="Protein" value={meal.proteinGrams} onChange={(v) => setMeal({ ...meal, proteinGrams: v })} />
            <NumberField label="Carb" value={meal.carbsGrams} onChange={(v) => setMeal({ ...meal, carbsGrams: v })} />
            <NumberField label="Fat" value={meal.fatGrams} onChange={(v) => setMeal({ ...meal, fatGrams: v })} />
            <button className="orange-button">Thêm bữa</button>
          </form>
          <div className="meal-list">
            {meals.length === 0 ? (
              <div className="empty-log"><Utensils size={44} /><h3>Chưa có bữa ăn</h3><p>Thêm bữa ăn đầu tiên.</p></div>
            ) : (
              meals.map((m) => (
                <div key={m.id} className="meal-row">
                  <span>{m.mealType}</span>
                  <strong>{m.name}</strong>
                  <small>{m.calories} kcal</small>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="white-panel water-panel">
          <h2><Droplets size={20} /> Nước uống hôm nay</h2>
          <div className="water-progress-bar">
            <div className="water-progress-fill" style={{ width: `${waterPercent}%` }} />
          </div>
          <p className="water-total">{waterTotalMl} ml / {waterGoalMl} ml ({waterPercent}%)</p>
          <form className="water-form" onSubmit={logWater}>
            <select value={waterMl} onChange={(e) => setWaterMl(Number(e.target.value))}>
              <option value={150}>150 ml (cốc nhỏ)</option>
              <option value={250}>250 ml (cốc thường)</option>
              <option value={350}>350 ml (chai nhỏ)</option>
              <option value={500}>500 ml (chai lớn)</option>
              <option value={750}>750 ml (bình nước)</option>
            </select>
            <button className="orange-button" type="submit"><Droplets size={16} /> Ghi nước</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function AiCoachPage({ token, userId, stats }: { token: string; userId: number; stats: Stats }) {
  const [input, setInput] = useState("Tạo lịch 7 ngày cho chạy và bơi");
  const defaultMessages = [{ role: "assistant", content: "Mình là AI coach cho chạy, bơi và dinh dưỡng. Hãy hỏi về lịch tập, phục hồi hoặc bữa ăn trước/sau buổi tập." }];
  const [messages, setMessages] = useState(defaultMessages);
  const context = useMemo(() => `Weekly run ${stats.weeklyRunKm} km, swim ${stats.weeklySwimMeters} m, training ${stats.weeklyMinutes} minutes.`, [stats]);

  useEffect(() => {
    if (!token || token === "demo") return;
    let active = true;
    api<{ role: string; content: string }[]>(`/ai/chat/${userId}`, token, []).then((history) => {
      if (!active) return;
      setMessages(history.length ? history : defaultMessages);
    });
    return () => { active = false; };
  }, [token, userId]);

  async function send(e?: FormEvent, quickPrompt?: string) {
    e?.preventDefault();
    const userMessage = (quickPrompt ?? input).trim();
    if (!userMessage) return;
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    if (!token || token === "demo") {
      setMessages((prev) => [...prev, { role: "assistant", content: "Bạn đang ở chế độ demo. Hãy đăng nhập để dùng AI coach." }]);
      return;
    }
    try {
      const res = await apiStrict<{ reply: string }>("/ai/chat", token, { method: "POST", body: JSON.stringify({ userId, message: userMessage, context }) });
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err) {
      const msg = err instanceof Error && err.message ? err.message : "Không thể kết nối AI. Hãy kiểm tra token và API gateway.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    }
  }

  return (
    <div className="ai-page">
      <section className="page-title">
        <span className="section-kicker">AI Coach</span>
        <h1>Huấn luyện chạy, bơi và phục hồi</h1>
        <p>AI dùng tải tập hiện tại để gợi ý buổi tiếp theo, lịch tuần và dinh dưỡng.</p>
      </section>
      <div className="quick-prompts">
        {["Tạo lịch 7 ngày", "Hôm nay nên chạy hay bơi?", "Ăn gì trước buổi tempo?", "Cách phục hồi sau long run"].map((p) => (
          <button key={p} className="outline-button" onClick={() => void send(undefined, p)}>{p}</button>
        ))}
      </div>
      <section className="chat-panel">
        <div className="chat-window">
          {messages.map((m, i) => (
            <div key={`${m.role}-${i}`} className={m.role === "user" ? "chat-message user" : "chat-message"}>{m.content}</div>
          ))}
        </div>
        <form className="chat-form" onSubmit={(e) => void send(e)}>
          <input value={input} onChange={(e) => setInput(e.target.value)} />
          <button className="orange-button icon-only" aria-label="Gửi"><Send size={18} /></button>
        </form>
      </section>
    </div>
  );
}

function CommunityHubPage({
  posts,
  setPosts,
  token,
  currentUserId,
  profile,
  activities,
  following,
  onLike,
  onComment,
  onFollow,
  onCreatePost,
  onShareActivity,
  onAddActivity,
}: {
  posts: Post[];
  setPosts: (fn: (prev: Post[]) => Post[]) => void;
  token: string;
  currentUserId: number;
  profile: AthleteProfile;
  activities: FitnessActivity[];
  following: number[];
  onLike: (postId: number) => Promise<void>;
  onComment: (postId: number, content: string) => Promise<void>;
  onFollow: (userId: number) => void | Promise<void>;
  onCreatePost: (content: string, activityId?: number) => Promise<void>;
  onShareActivity: (activity: FitnessActivity) => Promise<void>;
  onAddActivity: () => void;
}) {
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});
  const [feedFilter, setFeedFilter] = useState<"all" | "following" | "mine" | "run" | "swim">("all");
  const [query, setQuery] = useState("");
  const [composeText, setComposeText] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState("");
  const [posting, setPosting] = useState(false);

  const recentActivities = useMemo(() => activities.slice(0, 5), [activities]);
  const totalLikes = useMemo(() => posts.reduce((sum, post) => sum + post.likes, 0), [posts]);
  const filteredPosts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesFilter =
        feedFilter === "all" ||
        (feedFilter === "following" && following.includes(post.userId)) ||
        (feedFilter === "mine" && post.userId === currentUserId) ||
        (feedFilter === "run" && post.sportType === "RUN") ||
        (feedFilter === "swim" && post.sportType === "SWIM");
      const haystack = `${post.authorName} ${post.title ?? ""} ${post.content} ${post.routeName ?? ""}`.toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [posts, query, feedFilter, following, currentUserId]);

  async function submitPost(e: FormEvent) {
    e.preventDefault();
    const activityId = selectedActivityId ? Number(selectedActivityId) : undefined;
    if (!composeText.trim() && !activityId) return;
    setPosting(true);
    await onCreatePost(composeText, activityId);
    setComposeText("");
    setSelectedActivityId("");
    setPosting(false);
  }

  async function toggleComments(postId: number) {
    if (expandedComments.includes(postId)) {
      setExpandedComments((prev) => prev.filter((id) => id !== postId));
      return;
    }
    setExpandedComments((prev) => [...prev, postId]);
    const post = posts.find((p) => p.id === postId);
    if (!post || post.comments.length > 0) return;
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const loaded = await apiStrict<{ id: number; userId: number; displayName: string; content: string; createdAt: string }[]>(
        `/community/posts/${postId}/comments`, token, { method: "GET" }
      );
      const mapped: PostComment[] = loaded.map((c) => ({ id: c.id, userId: c.userId, authorName: c.displayName, content: c.content, createdAt: c.createdAt }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: mapped } : p));
    } catch { /* ignore */ } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function submitComment(postId: number) {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    await onComment(postId, text);
    if (!expandedComments.includes(postId)) setExpandedComments((prev) => [...prev, postId]);
  }

  return (
    <div className="community-page community-page-wide">
      <section className="page-title">
        <span className="section-kicker">Cộng đồng</span>
        <h1>Feed hoạt động</h1>
        <p>Chia sẻ buổi tập, theo dõi bạn bè và cùng nhau tiến bộ mỗi ngày.</p>
        <div className="page-actions">
          <button className="orange-button" onClick={onAddActivity}><CirclePlus size={18} /> Ghi hoạt động</button>
        </div>
      </section>

      <div className="community-layout">
        <div className="community-feed-column">
          <form className="community-composer" onSubmit={(e) => void submitPost(e)}>
            <div className="post-header">
              <div className="post-avatar-small">{initials(profile.displayName)}</div>
              <div className="post-meta">
                <strong>{profile.displayName}</strong>
                <span>Đăng cập nhật hoặc gắn một buổi tập đã hoàn thành</span>
              </div>
            </div>
            <textarea
              value={composeText}
              onChange={(e) => setComposeText(e.target.value)}
              placeholder="Buổi tập hôm nay của bạn thế nào?"
            />
            <div className="composer-actions">
              <select value={selectedActivityId} onChange={(e) => setSelectedActivityId(e.target.value)}>
                <option value="">Không gắn hoạt động</option>
                {recentActivities.map((activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.title} · {formatDistance(activity)} · {activity.durationMinutes} phút
                  </option>
                ))}
              </select>
              <button className="orange-button" disabled={posting || (!composeText.trim() && !selectedActivityId)}>
                <Send size={16} /> Đăng bài
              </button>
            </div>
          </form>

          <div className="community-toolbar">
            <div className="community-search">
              <Search size={15} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm bài, người hoặc lộ trình..." />
            </div>
            <div className="community-filter-tabs">
              {[
                ["all", "Tất cả"],
                ["following", "Đang theo dõi"],
                ["mine", "Của tôi"],
                ["run", "Chạy"],
                ["swim", "Bơi"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={feedFilter === id ? "active" : ""}
                  onClick={() => setFeedFilter(id as typeof feedFilter)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="community-feed">
            {filteredPosts.length === 0 ? (
              <div className="empty-log community-empty">
                <Users size={44} />
                <h3>Chưa có bài phù hợp</h3>
                <p>Hãy ghi một hoạt động hoặc đổi bộ lọc để xem thêm cập nhật.</p>
                <button className="orange-button" onClick={onAddActivity}>Ghi hoạt động</button>
              </div>
            ) : filteredPosts.map((post) => (
              <article key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-avatar-small">{initials(post.authorName)}</div>
                  <div className="post-meta">
                    <strong>{post.authorName}</strong>
                    <span>{formatTimeAgo(post.createdAt)}</span>
                  </div>
                  {post.userId !== currentUserId && (
                    <button
                      className={following.includes(post.userId) ? "outline-button" : "orange-button"}
                      style={{ marginLeft: "auto", minHeight: "32px", padding: "0 12px", fontSize: "0.84rem" }}
                      onClick={() => onFollow(post.userId)}
                    >
                      {following.includes(post.userId) ? <><UserCheck size={14} /> Đang theo dõi</> : <><UserPlus size={14} /> Theo dõi</>}
                    </button>
                  )}
                </div>

                <p className="post-content">{post.content}</p>

                {post.title && post.distanceMeters !== undefined && (
                  <div className="post-activity-badge">
                    <div className="post-activity-title">
                      {post.sportType && <SportPill sport={post.sportType} />}
                      <strong>{post.title}</strong>
                    </div>
                    <div className="post-activity-metrics">
                      <span>{post.sportType === "RUN" ? `${(post.distanceMeters / 1000).toFixed(1)} km` : `${Math.round(post.distanceMeters)} m`}</span>
                      {post.durationMinutes && <span>{post.durationMinutes} phút</span>}
                      {post.calories && <span>{post.calories} kcal</span>}
                      {post.routeName && <span>{post.routeName}</span>}
                    </div>
                  </div>
                )}

                <div className="post-actions">
                  <button className={post.liked ? "post-like-btn liked" : "post-like-btn"} onClick={() => void onLike(post.id)}>
                    <Heart size={16} fill={post.liked ? "currentColor" : "none"} />
                    {post.likes} Thích
                  </button>
                  <button className="post-action-btn" onClick={() => void toggleComments(post.id)}>
                    <MessageCircle size={16} />
                    {post.commentCount ?? post.comments.length} Bình luận
                  </button>
                  <button className="post-action-btn" onClick={() => void navigator.clipboard?.writeText(`${post.authorName}: ${post.content}`)}>
                    <Share2 size={16} />
                    Sao chép
                  </button>
                </div>

                {expandedComments.includes(post.id) && (
                  <div className="comments-section">
                    {loadingComments[post.id] ? (
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "8px 0" }}>Đang tải bình luận...</p>
                    ) : post.comments.length === 0 ? (
                      <p style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "8px 0" }}>Chưa có bình luận.</p>
                    ) : post.comments.map((c) => (
                      <div key={c.id} className="comment-item">
                        <div className="comment-avatar">{initials(c.authorName)}</div>
                        <div className="comment-body">
                          <strong>{c.authorName}</strong>
                          <span>{c.content}</span>
                          <small>{formatTimeAgo(c.createdAt)}</small>
                        </div>
                      </div>
                    ))}
                    <div className="comment-form">
                      <input
                        placeholder="Viết bình luận..."
                        value={commentInputs[post.id] ?? ""}
                        onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") void submitComment(post.id); }}
                      />
                      <button className="orange-button icon-only" onClick={() => void submitComment(post.id)} aria-label="Gửi">
                        <Send size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        <aside className="community-side">
          <div className="community-side-panel">
            <h2>Tổng quan</h2>
            <div className="community-stat-grid">
              <div><strong>{posts.length}</strong><span>Bài viết</span></div>
              <div><strong>{totalLikes}</strong><span>Lượt thích</span></div>
              <div><strong>{following.length}</strong><span>Đang theo dõi</span></div>
              <div><strong>{activities.length}</strong><span>Hoạt động</span></div>
            </div>
          </div>

          <div className="community-side-panel">
            <div className="section-head">
              <h2>Hoạt động gần đây</h2>
              <button className="outline-button" onClick={onAddActivity}><CirclePlus size={15} /> Ghi mới</button>
            </div>
            <div className="share-activity-list">
              {recentActivities.length === 0 ? (
                <p className="muted-note">Chưa có hoạt động để chia sẻ.</p>
              ) : recentActivities.map((activity) => (
                <div key={activity.id} className="share-activity-item">
                  <div>
                    <SportPill sport={activity.sportType} />
                    <strong>{activity.title}</strong>
                    <span>{formatDistance(activity)} · {activity.durationMinutes} phút</span>
                  </div>
                  <button className="outline-button" onClick={() => void onShareActivity(activity)}>
                    <Share2 size={15} /> Đăng
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="community-side-panel">
            <h2>Đang nổi bật</h2>
            <div className="community-trend-list">
              {posts.slice().sort((a, b) => b.likes + b.commentCount - (a.likes + a.commentCount)).slice(0, 3).map((post) => (
                <button key={post.id} onClick={() => setQuery(post.authorName)}>
                  <strong>{post.authorName}</strong>
                  <span>{post.title ?? post.content.slice(0, 42)}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CommunityPage({
  posts, setPosts, token, currentUserId, following, onLike, onComment, onFollow, onAddActivity,
}: {
  posts: Post[];
  setPosts: (fn: (prev: Post[]) => Post[]) => void;
  token: string;
  currentUserId: number;
  following: number[];
  onLike: (postId: number) => Promise<void>;
  onComment: (postId: number, content: string) => Promise<void>;
  onFollow: (userId: number) => void | Promise<void>;
  onAddActivity: () => void;
}) {
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [loadingComments, setLoadingComments] = useState<Record<number, boolean>>({});

  async function toggleComments(postId: number) {
    if (expandedComments.includes(postId)) {
      setExpandedComments((prev) => prev.filter((id) => id !== postId));
      return;
    }
    setExpandedComments((prev) => [...prev, postId]);
    const post = posts.find((p) => p.id === postId);
    if (!post || post.comments.length > 0) return;
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const loaded = await apiStrict<{ id: number; userId: number; displayName: string; content: string; createdAt: string }[]>(
        `/community/posts/${postId}/comments`, token, { method: "GET" }
      );
      const mapped: PostComment[] = loaded.map((c) => ({ id: c.id, userId: c.userId, authorName: c.displayName, content: c.content, createdAt: c.createdAt }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: mapped } : p));
    } catch { /* ignore */ } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function submitComment(postId: number) {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    await onComment(postId, text);
    if (!expandedComments.includes(postId)) setExpandedComments((prev) => [...prev, postId]);
  }

  return (
    <div className="community-page">
      <section className="page-title">
        <span className="section-kicker">Cộng đồng</span>
        <h1>Feed hoạt động</h1>
        <p>Chia sẻ buổi tập, theo dõi bạn bè và cùng nhau tiến bộ mỗi ngày.</p>
        <div className="page-actions">
          <button className="orange-button" onClick={onAddActivity}><CirclePlus size={18} /> Chia sẻ hoạt động</button>
        </div>
      </section>

      <div className="community-feed">
        {posts.map((post) => (
          <article key={post.id} className="post-card">
            <div className="post-header">
              <div className="post-avatar-small">{initials(post.authorName)}</div>
              <div className="post-meta">
                <strong>{post.authorName}</strong>
                <span>{formatTimeAgo(post.createdAt)}</span>
              </div>
              {post.userId !== currentUserId && (
                <button
                  className={following.includes(post.userId) ? "outline-button" : "orange-button"}
                  style={{ marginLeft: "auto", minHeight: "32px", padding: "0 12px", fontSize: "0.84rem" }}
                  onClick={() => onFollow(post.userId)}
                >
                  {following.includes(post.userId) ? <><UserCheck size={14} /> Đang theo dõi</> : <><UserPlus size={14} /> Theo dõi</>}
                </button>
              )}
            </div>

            <p className="post-content">{post.content}</p>

            {post.title && post.distanceMeters !== undefined && (
              <div className="post-activity-badge">
                {post.sportType && <SportPill sport={post.sportType} />}
                <span><strong>{post.title}</strong></span>
                <span>{post.sportType === "RUN" ? `${(post.distanceMeters / 1000).toFixed(1)} km` : `${post.distanceMeters} m`}</span>
                {post.durationMinutes && <span>{post.durationMinutes} phút</span>}
              </div>
            )}

            <div className="post-actions">
              <button className={post.liked ? "post-like-btn liked" : "post-like-btn"} onClick={() => void onLike(post.id)}>
                <Heart size={16} fill={post.liked ? "currentColor" : "none"} />
                {post.likes} Thích
              </button>
              <button className="post-action-btn" onClick={() => void toggleComments(post.id)}>
                <MessageCircle size={16} />
                {post.commentCount ?? post.comments.length} Bình luận
              </button>
              <button className="post-action-btn">
                <Share2 size={16} />
                Chia sẻ
              </button>
            </div>

            {expandedComments.includes(post.id) && (
              <div className="comments-section">
                {loadingComments[post.id] ? (
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", padding: "8px 0" }}>Đang tải bình luận...</p>
                ) : post.comments.map((c) => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-avatar">{initials(c.authorName)}</div>
                    <div className="comment-body">
                      <strong>{c.authorName}</strong>
                      <span>{c.content}</span>
                      <small>{formatTimeAgo(c.createdAt)}</small>
                    </div>
                  </div>
                ))}
                <div className="comment-form">
                  <input
                    placeholder="Viết bình luận..."
                    value={commentInputs[post.id] ?? ""}
                    onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === "Enter") void submitComment(post.id); }}
                  />
                  <button className="orange-button icon-only" onClick={() => void submitComment(post.id)} aria-label="Gửi">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function AnalyticsPage({ activities, stats, isPremium, onTrial }: {
  activities: FitnessActivity[];
  stats: Stats;
  isPremium: boolean;
  onTrial: () => void;
}) {
  const [period, setPeriod] = useState<"week" | "month">("week");
  const weeklyData = useMemo(() => buildWeeklyChartData(activities), [activities]);
  const monthlyData = useMemo(() => buildMonthlyChartData(activities), [activities]);
  const chartData = period === "week" ? weeklyData : monthlyData;

  const runs = activities.filter((a) => a.sportType === "RUN" && a.distanceMeters > 0 && a.durationMinutes > 0);
  const swims = activities.filter((a) => a.sportType === "SWIM" && a.distanceMeters > 0);

  const longestRun = runs.reduce<FitnessActivity | null>((best, a) => (!best || a.distanceMeters > best.distanceMeters) ? a : best, null);
  const bestPaceActivity = runs.reduce<FitnessActivity | null>((best, a) => {
    const pace = a.durationMinutes / (a.distanceMeters / 1000);
    const bestPace = best ? best.durationMinutes / (best.distanceMeters / 1000) : Infinity;
    return pace < bestPace ? a : best;
  }, null);
  const longestSwim = swims.reduce<FitnessActivity | null>((best, a) => (!best || a.distanceMeters > best.distanceMeters) ? a : best, null);

  const totalCalories = activities.reduce((s, a) => s + (a.calories ?? 0), 0);

  return (
    <div className="analytics-page">
      <section className="page-title">
        <span className="section-kicker">Thống kê</span>
        <h1>Phân tích hiệu suất luyện tập</h1>
        <p>Theo dõi sự tiến bộ qua biểu đồ quãng đường, calories và personal records.</p>
      </section>

      <div className="analytics-summary-grid">
        <div className="analytics-stat-card">
          <TrendingUp size={22} color="var(--orange)" />
          <strong>{stats.weeklyRunKm.toFixed(1)} km</strong>
          <span>Chạy tuần này</span>
        </div>
        <div className="analytics-stat-card">
          <Waves size={22} color="var(--blue)" />
          <strong>{stats.weeklySwimMeters} m</strong>
          <span>Bơi tuần này</span>
        </div>
        <div className="analytics-stat-card">
          <Activity size={22} color="var(--green)" />
          <strong>{stats.weeklySessions}</strong>
          <span>Buổi tập tuần này</span>
        </div>
        <div className="analytics-stat-card">
          <Flame size={22} color="#e55a1b" />
          <strong>{totalCalories.toLocaleString()}</strong>
          <span>Tổng calories tiêu thụ</span>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <h2>Quãng đường luyện tập</h2>
          <div className="period-selector">
            <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>Tuần</button>
            <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>Tháng</button>
          </div>
        </div>
        {activities.length === 0 ? (
          <div className="empty-log" style={{ minHeight: "240px" }}>
            <BarChart2 size={44} />
            <h3>Chưa có dữ liệu</h3>
            <p>Ghi hoạt động để xem biểu đồ.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5a6779" }} />
              <YAxis tick={{ fontSize: 12, fill: "#5a6779" }} />
              <Tooltip />
              <Bar dataKey="Chạy (km)" fill="var(--orange)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Bơi (100m)" fill="var(--blue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {isPremium ? (
        <div className="chart-card">
          <div className="chart-header">
            <h2>Calories tiêu thụ</h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#5a6779" }} />
              <YAxis tick={{ fontSize: 12, fill: "#5a6779" }} />
              <Tooltip />
              <Line type="monotone" dataKey="Calories" stroke="#e55a1b" strokeWidth={2} dot={{ r: 4, fill: "#e55a1b" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="premium-gate-card">
          <Sparkles size={28} />
          <div>
            <strong>Biểu đồ calories và pace — Premium</strong>
            <p>Nâng cấp để xem biểu đồ chi tiết calories, pace theo ngày và so sánh hiệu suất giữa các giai đoạn.</p>
          </div>
          <button className="orange-button" onClick={onTrial}>Nâng cấp</button>
        </div>
      )}

      <div className="pr-section">
        <h2>Kỷ lục cá nhân</h2>
        <div className="pr-grid">
          <div className="pr-card">
            <Award size={24} color="var(--orange)" />
            <span>Quãng đường chạy dài nhất</span>
            <strong>{longestRun ? `${(longestRun.distanceMeters / 1000).toFixed(2)} km` : "—"}</strong>
            {longestRun && <small>{longestRun.title}</small>}
          </div>
          <div className="pr-card">
            <TrendingUp size={24} color="var(--orange)" />
            <span>Pace tốt nhất (chạy)</span>
            <strong>
              {bestPaceActivity
                ? `${formatPace(bestPaceActivity.durationMinutes, bestPaceActivity.distanceMeters)} /km`
                : "—"}
            </strong>
            {bestPaceActivity && <small>{bestPaceActivity.title}</small>}
          </div>
          <div className="pr-card">
            <Waves size={24} color="var(--blue)" />
            <span>Quãng đường bơi dài nhất</span>
            <strong>{longestSwim ? `${Math.round(longestSwim.distanceMeters)} m` : "—"}</strong>
            {longestSwim && <small>{longestSwim.title}</small>}
          </div>
          <div className="pr-card">
            <Activity size={24} color="var(--green)" />
            <span>Tổng buổi tập</span>
            <strong>{activities.length}</strong>
            <small>{runs.length} chạy · {swims.length} bơi</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ profile, activities, stats, onEditProfile, onAddActivity, onShare }: {
  profile: AthleteProfile;
  activities: FitnessActivity[];
  stats: Stats;
  onEditProfile: () => void;
  onAddActivity: () => void;
  onShare: (activity: FitnessActivity) => void;
}) {
  const badges = useMemo(() => computeBadges(activities), [activities]);
  const earnedBadges = badges.filter((b) => b.earned);

  const totalRunKm = activities.filter((a) => a.sportType === "RUN").reduce((s, a) => s + a.distanceMeters / 1000, 0);
  const totalSwimM = activities.filter((a) => a.sportType === "SWIM").reduce((s, a) => s + a.distanceMeters, 0);
  const totalMinutes = activities.reduce((s, a) => s + a.durationMinutes, 0);

  return (
    <div className="profile-full-page">
      <div className="profile-page-header">
        <div className="profile-page-cover" />
        <div className="profile-page-info">
          <div className="profile-page-avatar">{initials(profile.displayName)}</div>
          <div className="profile-page-name">
            <h1>{profile.displayName}</h1>
            <span>{profile.city}</span>
            {profile.bio && <p>{profile.bio}</p>}
          </div>
          <div className="profile-page-actions">
            <button className="orange-button" onClick={onEditProfile}><Settings size={16} /> Sửa hồ sơ</button>
            <button className="outline-button" onClick={onAddActivity}><CirclePlus size={16} /> Ghi hoạt động</button>
          </div>
        </div>
        <div className="profile-page-stats">
          <div className="profile-stat-item">
            <strong>{activities.length}</strong>
            <span>Hoạt động</span>
          </div>
          <div className="profile-stat-item">
            <strong>{totalRunKm.toFixed(0)} km</strong>
            <span>Tổng chạy</span>
          </div>
          <div className="profile-stat-item">
            <strong>{Math.round(totalSwimM / 1000).toFixed(1)} km</strong>
            <span>Tổng bơi</span>
          </div>
          <div className="profile-stat-item">
            <strong>{Math.round(totalMinutes / 60)} h</strong>
            <span>Tổng thời gian</span>
          </div>
        </div>
      </div>

      {profile.gender || profile.heightCm || profile.weightKg ? (
        <div className="profile-info-card">
          <h2>Thông tin cá nhân</h2>
          <div className="profile-info-grid">
            {profile.gender && <div><span>Giới tính</span><strong>{profile.gender}</strong></div>}
            {profile.dateOfBirth && <div><span>Ngày sinh</span><strong>{new Date(profile.dateOfBirth).toLocaleDateString("vi-VN")}</strong></div>}
            {profile.heightCm && <div><span>Chiều cao</span><strong>{profile.heightCm} cm</strong></div>}
            {profile.weightKg && <div><span>Cân nặng</span><strong>{profile.weightKg} kg</strong></div>}
            <div><span>Mục tiêu</span><strong>{profile.primaryGoal}</strong></div>
            <div><span>Trình độ</span><strong>{profile.experienceLevel ?? "—"}</strong></div>
          </div>
        </div>
      ) : null}

      <div className="badges-section">
        <div className="section-head">
          <div>
            <span className="section-kicker">Thành tích</span>
            <h2>Huy hiệu</h2>
          </div>
          <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{earnedBadges.length}/{badges.length} đạt được</span>
        </div>
        <div className="badges-grid">
          {badges.map((b) => (
            <div key={b.id} className={b.earned ? "badge-item earned" : "badge-item"}>
              <span className="badge-icon">{b.icon}</span>
              <strong>{b.title}</strong>
              <small>{b.description}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-activities-section">
        <div className="section-head">
          <div>
            <span className="section-kicker">Lịch sử</span>
            <h2>Hoạt động gần đây</h2>
          </div>
          <button className="outline-button" onClick={onAddActivity}><CirclePlus size={18} /> Thêm</button>
        </div>
        {activities.length === 0 ? (
          <div className="empty-log">
            <Activity size={44} />
            <h3>Chưa có hoạt động</h3>
            <p>Ghi buổi tập đầu tiên để bắt đầu xây dựng hồ sơ.</p>
            <button className="orange-button" onClick={onAddActivity}>Ghi hoạt động</button>
          </div>
        ) : (
          <div className="activity-table">
            {activities.map((a) => (
              <div key={a.id} className="activity-row">
                <SportPill sport={a.sportType} />
                <div>
                  <strong>{a.title}</strong>
                  <span>{new Date(a.startedAt).toLocaleDateString("vi-VN")}</span>
                </div>
                <span>{formatDistance(a)}</span>
                <span>{a.durationMinutes} phút</span>
                <span>{a.averageHeartRate ?? "--"} bpm</span>
                <button className="outline-button" style={{ minHeight: "30px", padding: "0 10px", fontSize: "0.82rem" }} onClick={() => onShare(a)}>
                  <Share2 size={13} /> Chia sẻ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

type GpsPoint = { lat: number; lng: number; ts: number };

function ActivityModal({ session, profile, onClose, onCreate }: {
  session: Session;
  profile: AthleteProfile;
  onClose: () => void;
  onCreate: (payload: Omit<FitnessActivity, "id" | "startedAt"> & { gpsRouteJson?: string; averagePaceSecondsPerKm?: number }) => Promise<void>;
}) {
  const [sportType, setSportType] = useState<Sport>("RUN");
  const [title, setTitle] = useState("Chạy dễ buổi chiều");
  const [distance, setDistance] = useState(5);
  const [duration, setDuration] = useState(32);
  const [heartRate, setHeartRate] = useState(145);
  const [calories, setCalories] = useState(320);
  const [notes, setNotes] = useState("Cảm giác ổn, giữ nhịp thở thoải mái.");
  const [saving, setSaving] = useState(false);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [gpsPoints, setGpsPoints] = useState<GpsPoint[]>([]);
  const [gpsError, setGpsError] = useState("");
  const [trackingSeconds, setTrackingSeconds] = useState(0);
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startGps() {
    if (!navigator.geolocation) {
      setGpsError("Trình duyệt không hỗ trợ GPS.");
      return;
    }
    setGpsPoints([]);
    setTrackingSeconds(0);
    setGpsTracking(true);
    setGpsError("");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPoints((prev) => [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() }]);
      },
      () => setGpsError("Không thể lấy vị trí GPS."),
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    timerRef.current = setInterval(() => setTrackingSeconds((s) => s + 1), 1000);
  }

  function stopGps() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setGpsTracking(false);
    if (gpsPoints.length >= 2) {
      const distM = calcGpsDistance(gpsPoints);
      const mins = trackingSeconds / 60;
      setDistance(sportType === "RUN" ? +(distM / 1000).toFixed(2) : Math.round(distM));
      setDuration(Math.round(mins));
    }
  }

  useEffect(() => () => {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const distMeters = sportType === "RUN" ? distance * 1000 : distance;
    const paceSecsPerKm = distMeters > 0 && duration > 0 ? Math.round((duration * 60) / (distMeters / 1000)) : undefined;
    await onCreate({
      userId: session.userId,
      athleteName: profile.displayName,
      sportType,
      title,
      description: notes,
      durationMinutes: duration,
      distanceMeters: distMeters,
      averageHeartRate: heartRate,
      calories,
      elevationGainMeters: sportType === "RUN" ? 24 : undefined,
      poolLengthMeters: sportType === "SWIM" ? 50 : undefined,
      strokes: sportType === "SWIM" ? Math.round(distance * 0.52) : undefined,
      routeName: sportType === "RUN" ? "Tuyến tự ghi" : "Hồ bơi 50m",
      visibility: "PRIVATE",
      gpsRouteJson: gpsPoints.length > 0 ? JSON.stringify(gpsPoints) : undefined,
      averagePaceSecondsPerKm: paceSecsPerKm,
    });
  }

  return (
    <Modal title="Ghi hoạt động" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="segmented">
          <button type="button" className={sportType === "RUN" ? "active" : ""} onClick={() => setSportType("RUN")}><Flame size={18} /> Chạy</button>
          <button type="button" className={sportType === "SWIM" ? "active" : ""} onClick={() => setSportType("SWIM")}><Waves size={18} /> Bơi</button>
        </div>
        {sportType === "RUN" && (
          <div className="gps-tracker">
            {!gpsTracking ? (
              <button type="button" className="outline-button gps-start-btn" onClick={startGps}>
                <Map size={16} /> Bắt đầu theo dõi GPS
              </button>
            ) : (
              <div className="gps-active">
                <span className="gps-dot" />
                <span>GPS đang chạy — {formatTrackingTime(trackingSeconds)} · {gpsPoints.length} điểm</span>
                <button type="button" className="orange-button" onClick={stopGps}>Dừng & nhập</button>
              </div>
            )}
            {gpsError && <p style={{ color: "var(--red, #f85149)", fontSize: "0.85rem" }}>{gpsError}</p>}
            {gpsPoints.length >= 2 && !gpsTracking && (
              <p style={{ color: "var(--green)", fontSize: "0.85rem" }}>
                GPS đã ghi {gpsPoints.length} điểm · {(calcGpsDistance(gpsPoints) / 1000).toFixed(2)} km
              </p>
            )}
          </div>
        )}
        <label>Tên hoạt động<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <div className="input-grid">
          <NumberField label={sportType === "RUN" ? "Quãng đường (km)" : "Quãng đường (m)"} value={distance} onChange={setDistance} />
          <NumberField label="Thời gian (phút)" value={duration} onChange={setDuration} />
          <NumberField label="Nhịp tim TB" value={heartRate} onChange={setHeartRate} />
          <NumberField label="Calories" value={calories} onChange={setCalories} />
        </div>
        <label>Ghi chú<textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <button className="orange-button" disabled={saving}>{saving ? "Đang lưu..." : "Lưu hoạt động"}</button>
      </form>
    </Modal>
  );
}

function calcGpsDistance(points: GpsPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const R = 6371000;
    const lat1 = (points[i - 1].lat * Math.PI) / 180;
    const lat2 = (points[i].lat * Math.PI) / 180;
    const dLat = lat2 - lat1;
    const dLng = ((points[i].lng - points[i - 1].lng) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return total;
}

function formatTrackingTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function DeviceModal({ connectedDevices, setConnectedDevices, onClose, notify }: {
  connectedDevices: string[];
  setConnectedDevices: (devices: string[]) => void;
  onClose: () => void;
  notify: (msg: string) => void;
}) {
  const devices = ["Garmin", "Apple Watch", "Coros", "Strava file upload"];
  function toggle(device: string) {
    const connected = connectedDevices.includes(device);
    setConnectedDevices(connected ? connectedDevices.filter((d) => d !== device) : [...connectedDevices, device]);
    notify(connected ? `Đã ngắt ${device}.` : `Đã kết nối ${device}.`);
  }
  return (
    <Modal title="Kết nối thiết bị" onClose={onClose}>
      <div className="device-list">
        {devices.map((device) => (
          <button key={device} className="device-row" onClick={() => toggle(device)}>
            <Watch size={22} />
            <span>{device}</span>
            <strong>{connectedDevices.includes(device) ? "Đã kết nối" : "Kết nối"}</strong>
          </button>
        ))}
      </div>
    </Modal>
  );
}

function PremiumModal({ isPremium, onClose, onUpgrade, notify, userId, token }: {
  isPremium: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  notify: (msg: string) => void;
  userId: number;
  token: string;
}) {
  const [paypalStep, setPaypalStep] = useState<"select" | "processing" | "success" | "error">("select");
  const [errorMsg, setErrorMsg] = useState("");

  async function payWithPayPal() {
    setPaypalStep("processing");
    try {
      const orderRes = await apiStrict<{ orderId: string; amount: number; currency: string }>(
        "/payments/paypal/create-order",
        token,
        { method: "POST", body: JSON.stringify({ userId, plan: "PREMIUM" }) }
      );

      const { PayPal } = window as unknown as { PayPal?: { Buttons: (opts: Record<string, unknown>) => { render: (el: string) => void } } };
      if (PayPal) {
        PayPal.Buttons({
          createOrder: () => orderRes.orderId,
          onApprove: async () => {
            setPaypalStep("processing");
            const captureRes = await apiStrict<{ status: string; premiumActive: boolean }>(
              `/payments/paypal/capture/${orderRes.orderId}`,
              token,
              { method: "POST" }
            );
            if (captureRes.premiumActive) {
              setPaypalStep("success");
              notify("Thanh toán PayPal thành công! Tài khoản Premium đã được kích hoạt.");
              setTimeout(onUpgrade, 1500);
            } else {
              setPaypalStep("error");
              setErrorMsg("Thanh toán chưa hoàn tất, vui lòng thử lại.");
            }
          },
          onError: () => {
            setPaypalStep("error");
            setErrorMsg("Có lỗi khi thanh toán PayPal, vui lòng thử lại.");
          },
        }).render("#paypal-button-container");
        setPaypalStep("select");
      } else {
        const captureRes = await apiStrict<{ status: string; premiumActive: boolean }>(
          `/payments/paypal/capture/${orderRes.orderId}`,
          token,
          { method: "POST" }
        );
        if (captureRes.premiumActive) {
          setPaypalStep("success");
          notify("Thanh toán PayPal thành công! Tài khoản Premium đã được kích hoạt.");
          setTimeout(onUpgrade, 1500);
        } else {
          setPaypalStep("error");
          setErrorMsg("Thanh toán chưa hoàn tất, vui lòng thử lại.");
        }
      }
    } catch {
      setPaypalStep("error");
      setErrorMsg("Không thể kết nối PayPal. Vui lòng kiểm tra kết nối và thử lại.");
    }
  }

  if (isPremium) {
    return (
      <Modal title="RunSwim Premium" onClose={onClose}>
        <div className="premium-box">
          <Sparkles size={34} />
          <h3>Bạn đang là thành viên Premium!</h3>
          <p>Tất cả tính năng nâng cao đã được mở khóa. Cảm ơn bạn đã ủng hộ RunSwim.</p>
          <button className="outline-button" onClick={onClose}>Đóng</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="RunSwim Premium" onClose={onClose}>
      <div className="premium-content">
        {paypalStep === "processing" && (
          <div className="premium-box">
            <div className="paypal-processing">
              <CreditCard size={40} color="var(--orange)" />
              <h3>Đang xử lý thanh toán...</h3>
              <p>Vui lòng đợi trong giây lát.</p>
            </div>
          </div>
        )}
        {paypalStep === "success" && (
          <div className="premium-box">
            <CheckCircle2 size={40} color="var(--green)" />
            <h3>Thanh toán thành công!</h3>
            <p>Tài khoản Premium của bạn đã được kích hoạt. Email xác nhận đã được gửi.</p>
          </div>
        )}
        {paypalStep === "error" && (
          <div className="premium-box">
            <X size={40} color="var(--red, #f85149)" />
            <h3>Thanh toán thất bại</h3>
            <p>{errorMsg}</p>
            <button className="outline-button" onClick={() => setPaypalStep("select")}>Thử lại</button>
          </div>
        )}
        {paypalStep === "select" && (
          <>
            <div className="premium-comparison">
              <div className="plan-card">
                <h3>Free</h3>
                <ul>
                  <li>✓ Ghi hoạt động cơ bản</li>
                  <li>✓ Lịch tập 7 ngày</li>
                  <li>✓ AI Coach (giới hạn)</li>
                  <li>✓ Theo dõi dinh dưỡng</li>
                  <li>✗ Biểu đồ nâng cao</li>
                  <li>✗ Xuất báo cáo PDF</li>
                  <li>✗ Lịch sử không giới hạn</li>
                </ul>
                <p className="plan-price">Miễn phí</p>
              </div>
              <div className="plan-card featured">
                <div className="plan-badge">Phổ biến nhất</div>
                <h3>Premium</h3>
                <ul>
                  <li>✓ Tất cả tính năng Free</li>
                  <li>✓ Biểu đồ calories & pace</li>
                  <li>✓ AI Coach không giới hạn</li>
                  <li>✓ Xuất báo cáo PDF</li>
                  <li>✓ Lịch sử không giới hạn</li>
                  <li>✓ Đồng bộ nhanh hơn</li>
                  <li>✓ Ưu tiên hỗ trợ</li>
                </ul>
                <p className="plan-price">99.000 ₫<span>/tháng</span></p>
              </div>
            </div>
            <div className="paypal-section">
              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 12px" }}>Thanh toán an toàn qua</p>
              <button className="paypal-button" onClick={() => void payWithPayPal()}>
                <CreditCard size={20} />
                Thanh toán với PayPal
              </button>
              <div id="paypal-button-container" style={{ marginTop: "12px" }} />
              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.8rem", marginTop: "10px" }}>
                Thanh toán bảo mật qua PayPal Sandbox
              </p>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

function ProfileModal({ token, profile, setProfile, onClose, notify }: {
  token: string;
  profile: AthleteProfile;
  setProfile: (profile: AthleteProfile) => void;
  onClose: () => void;
  notify: (msg: string) => void;
}) {
  const [draft, setDraft] = useState(profile);
  async function submit(e: FormEvent) {
    e.preventDefault();
    const saved = await api<AthleteProfile>(`/athletes/${profile.userId}`, token, draft, {
      method: "PUT",
      body: JSON.stringify({
        displayName: draft.displayName,
        city: draft.city,
        bio: draft.bio,
        primaryGoal: draft.primaryGoal,
        experienceLevel: draft.experienceLevel,
        gender: draft.gender,
        dateOfBirth: draft.dateOfBirth,
        heightCm: draft.heightCm,
        weightKg: draft.weightKg,
        preferredTrainingDays: ["MON", "WED", "FRI", "SUN"],
        nutritionFocus: draft.nutritionFocus,
        weeklyRunGoalKm: draft.weeklyRunGoalKm,
        weeklySwimGoalMeters: draft.weeklySwimGoalMeters,
        visibility: "PRIVATE",
      }),
    });
    setProfile(saved);
    notify("Đã cập nhật hồ sơ.");
    onClose();
  }

  return (
    <Modal title="Sửa hồ sơ luyện tập" onClose={onClose}>
      <div className="profile-edit-shell">
        <aside className="profile-edit-aside">
          <div className="profile-edit-kicker">Hồ sơ vận động</div>
          <h3>{draft.displayName}</h3>
          <p>{draft.city}</p>

          <div className="profile-edit-summary">
            <div>
              <span>Mục tiêu</span>
              <strong>{draft.primaryGoal}</strong>
            </div>
            <div>
              <span>Tập trung</span>
              <strong>{draft.nutritionFocus}</strong>
            </div>
            <div>
              <span>Trạng thái</span>
              <strong>{draft.completedOnboarding ? "Đã hoàn tất onboarding" : "Chưa hoàn tất onboarding"}</strong>
            </div>
          </div>

          <div className="profile-edit-note">
            <strong>Thiết lập hiện tại</strong>
            <p>Thông tin này dùng cho trang chủ, AI Coach và các gợi ý luyện tập.</p>
          </div>
        </aside>

        <form className="modal-form profile-edit-form" onSubmit={submit}>
          <div className="form-section-title">Thông tin cơ bản</div>
          <div className="input-grid two-col">
            <label>Tên hiển thị<input value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} /></label>
            <label>Thành phố<input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label>
          </div>
          <label>Giới thiệu<textarea value={draft.bio ?? ""} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></label>

          <div className="form-section-title">Thông tin thể chất</div>
          <div className="input-grid">
            <label>Giới tính
              <select value={draft.gender ?? "Nam"} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}>
                <option>Nam</option><option>Nữ</option><option>Khác</option>
              </select>
            </label>
            <label>Ngày sinh<input type="date" value={draft.dateOfBirth ?? ""} onChange={(e) => setDraft({ ...draft, dateOfBirth: e.target.value })} /></label>
            <NumberField label="Chiều cao (cm)" value={draft.heightCm ?? 170} onChange={(v) => setDraft({ ...draft, heightCm: v })} />
            <NumberField label="Cân nặng (kg)" value={draft.weightKg ?? 65} onChange={(v) => setDraft({ ...draft, weightKg: v })} />
          </div>

          <div className="form-section-title">Mục tiêu luyện tập</div>
          <label>Mục tiêu<input value={draft.primaryGoal} onChange={(e) => setDraft({ ...draft, primaryGoal: e.target.value })} /></label>
          <div className="input-grid">
            <NumberField label="Km chạy/tuần" value={draft.weeklyRunGoalKm} onChange={(v) => setDraft({ ...draft, weeklyRunGoalKm: v })} />
            <NumberField label="Mét bơi/tuần" value={draft.weeklySwimGoalMeters} onChange={(v) => setDraft({ ...draft, weeklySwimGoalMeters: v })} />
          </div>
          <label>Trọng tâm dinh dưỡng<input value={draft.nutritionFocus} onChange={(e) => setDraft({ ...draft, nutritionFocus: e.target.value })} /></label>

          <div className="profile-edit-actions">
            <button className="orange-button">Lưu hồ sơ</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <section className="modal-card">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

const VIETNAMESE_CITIES = [
  "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ",
  "Biên Hòa", "Nha Trang", "Huế", "Vũng Tàu", "Đà Lạt",
  "Quy Nhơn", "Buôn Ma Thuột", "Hội An", "Thanh Hóa", "Vinh",
  "Long Xuyên", "Mỹ Tho", "Bắc Ninh", "Hải Dương", "Nam Định", "Khác",
];

const NUTRITION_OPTIONS = [
  "Nạp năng lượng cho sức bền",
  "Giảm cân & kiểm soát cân nặng",
  "Tăng cơ & sức mạnh",
  "Phục hồi sau tập luyện",
  "Ăn uống lành mạnh & cân bằng",
  "Chế độ ăn đặc biệt (low-carb, keto, ...)",
];

function Onboarding({ onDone }: { onDone: (session: Session) => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [onboardingSession, setOnboardingSession] = useState<Session | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    gender: "",
    dateOfBirth: "",
    heightCm: 0,
    weightKg: 0,
    city: "",
    primaryGoal: "",
    experienceLevel: "INTERMEDIATE",
    nutritionFocus: "",
    weeklyRunGoalKm: 0,
    weeklySwimGoalMeters: 0,
  });

  const isOnboardingOnly = onboardingSession !== null;
  const steps = isOnboardingOnly ? ["Cá nhân", "Mục tiêu"] : ["Tài khoản", "Cá nhân", "Mục tiêu"];
  const currentStep = isOnboardingOnly ? step + 1 : step;

  async function withRetry<T>(operation: () => Promise<T>, attempts = 10, delayMs = 1000): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : "";
        const shouldRetry = message.includes("HTTP 503") || message.includes("fetch") || message.includes("network");
        if (!shouldRetry || attempt === attempts - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
      }
    }

    throw lastError instanceof Error ? lastError : new Error("Không thể kết nối tới dịch vụ.");
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (isOnboardingOnly) {
      if (step < steps.length - 1) { setStep(step + 1); return; }
      if (!onboardingSession) return;
      setLoading(true);
      setAuthError("");
      try {
        await completeOnboarding(onboardingSession);
        onDone({ ...onboardingSession, onboardingCompleted: true });
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : "Không thể hoàn tất. Hãy thử lại.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step < steps.length - 1 && mode === "signup") { setStep(step + 1); return; }

    setLoading(true);
    setAuthError("");
    const authPath = mode === "login" ? "/auth/login" : "/auth/register";
    const authBody = mode === "login"
      ? { email: form.email, password: form.password }
      : { fullName: form.fullName, email: form.email, password: form.password, preferredSports: ["RUN", "SWIM"] };
    try {
      const auth = await withRetry(() => apiStrict<Session>(authPath, "", { method: "POST", body: JSON.stringify(authBody) }));
      if (mode === "signup") {
        try {
          await completeOnboarding(auth);
          onDone({ ...auth, onboardingCompleted: true });
        } catch (onboardingErr) {
          setOnboardingSession(auth);
          setStep(0);
          const msg = onboardingErr instanceof Error ? onboardingErr.message : "";
          setAuthError(msg.includes("503")
            ? "Tài khoản đã tạo. Dịch vụ athlete tạm bận — hãy thử hoàn thiện hồ sơ lại."
            : `Tài khoản đã tạo nhưng hồ sơ chưa lưu được (${msg || "lỗi"}). Hãy thử lại.`);
        }
      } else if (auth.onboardingCompleted) {
        onDone(auth);
      } else {
        setOnboardingSession(auth);
        setStep(0);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setAuthError(msg.includes("503")
        ? "Dịch vụ tạm bận (503) — hãy kiểm tra backend đã khởi động chưa."
        : msg || (mode === "login" ? "Email hoặc mật khẩu chưa đúng." : "Không thể tạo tài khoản."));
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding(auth: Session) {
    await withRetry(() => apiStrict(`/athletes/${auth.userId}/onboarding`, auth.token, {
      method: "POST",
      body: JSON.stringify({
        displayName: form.fullName || undefined,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        heightCm: form.heightCm || undefined,
        weightKg: form.weightKg || undefined,
        city: form.city || undefined,
        primaryGoal: form.primaryGoal || undefined,
        experienceLevel: form.experienceLevel,
        preferredTrainingDays: ["MON", "WED", "FRI", "SUN"],
        nutritionFocus: form.nutritionFocus || undefined,
        weeklyRunGoalKm: form.weeklyRunGoalKm,
        weeklySwimGoalMeters: form.weeklySwimGoalMeters,
        visibility: "PRIVATE",
      }),
    }));
    await withRetry(() => apiStrict(`/auth/users/${auth.userId}/onboarding-complete`, auth.token, { method: "PATCH" }));
  }

  return (
    <main className="onboarding-screen">
      {/* ── Left visual panel ── */}
      <section className="onboarding-visual">
        <div className="ov-inner">
          <div className="ov-logo">
            <span className="ov-logo-name">RunSwim</span>
          </div>
          <div className="ov-hero">
            <div className="ov-badge">Nền tảng thể thao #1</div>
            <h1 className="ov-title">Luyện tập<br />đúng cách.<br />Sống khỏe hơn.</h1>
            <p className="ov-sub">Theo dõi chạy bộ, bơi lội — AI phân tích, lập lịch thông minh và tư vấn dinh dưỡng cá nhân hóa.</p>
          </div>
          <div className="ov-features">
            <div className="ov-feature"><span>🗺️</span><span>GPS &amp; Bản đồ lộ trình</span></div>
            <div className="ov-feature"><span>🤖</span><span>AI Coach cá nhân</span></div>
            <div className="ov-feature"><span>🥗</span><span>Dinh dưỡng thông minh</span></div>
            <div className="ov-feature"><span>🏆</span><span>Thách thức &amp; cộng đồng</span></div>
          </div>
          <div className="ov-stats">
            <div className="ov-stat"><strong>10K+</strong><span>Buổi tập</span></div>
            <div className="ov-stat-divider" />
            <div className="ov-stat"><strong>500+</strong><span>Vận động viên</span></div>
            <div className="ov-stat-divider" />
            <div className="ov-stat"><strong>98%</strong><span>Hài lòng</span></div>
          </div>
        </div>
      </section>

      {/* ── Right form panel ── */}
      <section className="onboarding-panel">
        <div className="op-inner">
          {/* Panel logo */}
          <div className="op-brand">
            <span className="op-brand-name">RunSwim</span>
          </div>

          {!isOnboardingOnly && (
            <div className="op-tab-wrap">
              <button
                type="button"
                className={`op-tab${mode === "login" ? " active" : ""}`}
                onClick={() => { setMode("login"); setStep(0); setAuthError(""); }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className={`op-tab${mode === "signup" ? " active" : ""}`}
                onClick={() => { setMode("signup"); setStep(0); setAuthError(""); }}
              >
                Tạo tài khoản
              </button>
            </div>
          )}

          {/* Step indicator */}
          {(mode === "signup" || isOnboardingOnly) && steps.length > 1 && (
            <div className="op-stepper">
              {steps.map((label, i) => (
                <div key={label} className={`op-step${i < step ? " done" : i === step ? " active" : ""}`}>
                  <div className="op-step-dot">
                    {i < step ? <CheckCircle2 size={14} /> : <span>{i + 1}</span>}
                  </div>
                  <span className="op-step-label">{label}</span>
                </div>
              ))}
              <div className="op-step-line" style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />
            </div>
          )}

          {/* Heading */}
          <div className="op-heading">
            {isOnboardingOnly
              ? <><h2>Hoàn thiện hồ sơ</h2><p>Chỉ vài bước nữa để bắt đầu hành trình luyện tập.</p></>
              : mode === "login"
                ? <><h2>Chào mừng trở lại</h2><p>Đăng nhập để tiếp tục theo dõi luyện tập.</p></>
                : currentStep === 0
                  ? <><h2>Tạo tài khoản</h2><p>Miễn phí, không cần thẻ tín dụng.</p></>
                  : currentStep === 1
                    ? <><h2>Thông tin cá nhân</h2><p>Giúp chúng tôi cá nhân hóa kế hoạch của bạn.</p></>
                    : <><h2>Mục tiêu luyện tập</h2><p>Bước cuối — thiết lập mục tiêu để AI lên lịch.</p></>
            }
          </div>

          <form onSubmit={submit} className="op-form">
            {/* Step 0 — Account info */}
            {!isOnboardingOnly && (mode === "login" || currentStep === 0) && (
              <>
                {mode === "signup" && (
                  <div className="op-field">
                    <label>Họ và tên</label>
                    <div className="op-input-wrap">
                      <input
                        value={form.fullName}
                        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>
                )}
                <div className="op-field">
                  <label>Email</label>
                  <div className="op-input-wrap">
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                <div className="op-field">
                  <div className="op-label-row">
                    <label>Mật khẩu</label>
                    {mode === "login" && <button type="button" className="op-forgot">Quên mật khẩu?</button>}
                  </div>
                  <div className="op-input-wrap">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      required
                    />
                    <button type="button" className="op-eye" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <X size={15} /> : <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }}>Hiện</span>}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Step 1 — Personal info */}
            {currentStep === 1 && (
              <>
                <div className="op-field-row">
                  <div className="op-field">
                    <label>Giới tính</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="">-- Chọn --</option>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div className="op-field">
                    <label>Ngày sinh</label>
                    <input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                  </div>
                </div>
                <div className="op-field-row">
                  <div className="op-field">
                    <label>Chiều cao (cm)</label>
                    <input type="number" min={0} max={250} value={form.heightCm || ""} onChange={(e) => setForm({ ...form, heightCm: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="op-field">
                    <label>Cân nặng (kg)</label>
                    <input type="number" min={0} max={300} step={0.1} value={form.weightKg || ""} onChange={(e) => setForm({ ...form, weightKg: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="op-field">
                  <label>Thành phố</label>
                  <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    <option value="">-- Chọn thành phố --</option>
                    {VIETNAMESE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="op-field">
                  <label>Trình độ luyện tập</label>
                  <div className="op-level-grid">
                    {[
                      { val: "BEGINNER", label: "Mới bắt đầu", icon: "🌱" },
                      { val: "INTERMEDIATE", label: "Trung bình", icon: "⚡" },
                      { val: "ADVANCED", label: "Nâng cao", icon: "🔥" },
                    ].map((lv) => (
                      <button
                        key={lv.val}
                        type="button"
                        className={`op-level-btn${form.experienceLevel === lv.val ? " active" : ""}`}
                        onClick={() => setForm({ ...form, experienceLevel: lv.val })}
                      >
                        <span>{lv.icon}</span>
                        <span>{lv.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Step 2 — Goals */}
            {currentStep === 2 && (
              <>
                <div className="op-sport-row">
                  <div className="op-sport-badge run"><Flame size={18} /> Chạy bộ</div>
                  <div className="op-sport-badge swim"><Waves size={18} /> Bơi lội</div>
                </div>
                <div className="op-field">
                  <label>Mục tiêu chính</label>
                  <select value={form.primaryGoal} onChange={(e) => setForm({ ...form, primaryGoal: e.target.value })}>
                    <option value="">-- Chọn mục tiêu --</option>
                    <option value="Giảm cân">Giảm cân &amp; cải thiện vóc dáng</option>
                    <option value="Cải thiện tốc độ">Cải thiện tốc độ &amp; hiệu suất</option>
                    <option value="Tăng sức bền">Tăng sức bền lâu dài</option>
                    <option value="Luyện tập cho vui">Luyện tập cho vui &amp; thư giãn</option>
                    <option value="Mục tiêu cá nhân">Mục tiêu cá nhân</option>
                  </select>
                </div>
                <div className="op-field-row">
                  <div className="op-field">
                    <label>Km chạy / tuần</label>
                    <input type="number" min={0} step={1} value={form.weeklyRunGoalKm || ""} onChange={(e) => setForm({ ...form, weeklyRunGoalKm: Number(e.target.value) })} />
                  </div>
                  <div className="op-field">
                    <label>Mét bơi / tuần</label>
                    <input type="number" min={0} step={100} value={form.weeklySwimGoalMeters || ""} onChange={(e) => setForm({ ...form, weeklySwimGoalMeters: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="op-field">
                  <label>Trọng tâm dinh dưỡng</label>
                  <select value={form.nutritionFocus} onChange={(e) => setForm({ ...form, nutritionFocus: e.target.value })}>
                    <option value="">-- Chọn trọng tâm --</option>
                    {NUTRITION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </>
            )}

            {authError && (
              <div className="op-error">
                <X size={14} />
                <span>{authError}</span>
              </div>
            )}

            <div className="op-btn-row">
              {step > 0 && mode !== "login" && (
                <button type="button" className="op-back-btn" onClick={() => { setStep(step - 1); setAuthError(""); }}>
                  Quay lại
                </button>
              )}
              <button className="op-submit-btn" disabled={loading}>
                {loading
                  ? <><span className="op-spinner" />Đang xử lý…</>
                  : (mode === "signup" || isOnboardingOnly) && step < steps.length - 1
                    ? "Tiếp tục"
                    : mode === "login" ? "Đăng nhập" : "Bắt đầu hành trình"}
              </button>
            </div>
          </form>

          {!isOnboardingOnly && (
            <p className="op-switch-hint">
              {mode === "login"
                ? <>Chưa có tài khoản? <button type="button" onClick={() => { setMode("signup"); setStep(0); setAuthError(""); }}>Tham gia miễn phí</button></>
                : <>Đã có tài khoản? <button type="button" onClick={() => { setMode("login"); setStep(0); setAuthError(""); }}>Đăng nhập</button></>
              }
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function RailCard({ icon, title, action, children, onClick }: { icon: ReactNode; title: string; action: string; children: ReactNode; onClick: () => void }) {
  return (
    <article className="rail-card">
      <div className="rail-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{children}</p>
      <button onClick={onClick}>{action}</button>
    </article>
  );
}

function ProgressRow({ label, value, progress }: { label: string; value: string; progress: number }) {
  return (
    <div className="progress-row">
      <div><span>{label}</span><strong>{value}</strong></div>
      <div className="progress-line"><span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
    </div>
  );
}

// ─── Admin Page ────────────────────────────────────────────────────────────────

type AdminUser = {
  id: number; fullName: string; email: string; role: string;
  active: boolean; premiumActive: boolean; createdAt: string;
};
type AdminStats = { totalUsers: number; activeUsers: number; premiumUsers: number };

function AdminPage({ token, userId, notify }: { token: string; userId: number; notify: (m: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "ADMIN" | "USER">("ALL");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<AdminStats>("/auth/admin/stats", token),
      api<AdminUser[]>("/auth/admin/users", token),
    ]).then(([s, u]) => {
      setStats(s);
      setUsers(u);
    }).catch(() => notify("Không thể tải dữ liệu admin."))
      .finally(() => setLoading(false));
  }, []);

  async function updateUser(uid: number, patch: { role?: string; active?: boolean; premiumActive?: boolean }) {
    const updated = await api<AdminUser>(`/auth/admin/users/${uid}`, token, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, ...updated } : u)));
    notify("Đã cập nhật.");
  }

  const filtered = users.filter((u) => {
    const matchSearch = `${u.fullName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Quản trị hệ thống</h1>
          <p className="admin-subtitle">Quản lý người dùng và dữ liệu RunSwim Club</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="admin-stats-row">
          {[
            { label: "Tổng người dùng", value: stats.totalUsers, color: "var(--orange)" },
            { label: "Đang hoạt động", value: stats.activeUsers, color: "var(--green)" },
            { label: "Tài khoản Premium", value: stats.premiumUsers, color: "#f59e0b" },
            { label: "Tài khoản thường", value: stats.totalUsers - stats.premiumUsers, color: "var(--muted)" },
          ].map((s) => (
            <div key={s.label} className="admin-stat-card">
              <span className="admin-stat-value" style={{ color: s.color }}>{s.value}</span>
              <span className="admin-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="admin-controls">
        <div className="admin-search">
          <Search size={16} />
          <input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-filter-tabs">
          {(["ALL", "USER", "ADMIN"] as const).map((r) => (
            <button key={r} className={`admin-tab${filterRole === r ? " active" : ""}`} onClick={() => setFilterRole(r)}>
              {r === "ALL" ? "Tất cả" : r === "USER" ? "Người dùng" : "Admin"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="empty-log" style={{ padding: 48 }}><p>Đang tải...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-log" style={{ padding: 48 }}><p>Không có kết quả.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Premium</th>
                <th>Trạng thái</th>
                <th>Ngày đăng ký</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-avatar">{u.fullName.charAt(0).toUpperCase()}</div>
                      <div>
                        <strong>{u.fullName}</strong>
                        <span>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge role-${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.premiumActive ? "premium-yes" : "premium-no"}`}>
                      {u.premiumActive ? "Premium" : "Free"}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.active ? "status-active" : "status-inactive"}`}>
                      {u.active ? "Hoạt động" : "Bị khoá"}
                    </span>
                  </td>
                  <td className="admin-date">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-action-btn"
                        title={u.premiumActive ? "Huỷ Premium" : "Cấp Premium"}
                        onClick={() => updateUser(u.id, { premiumActive: !u.premiumActive })}
                      >
                        {u.premiumActive ? "Huỷ Premium" : "Cấp Premium"}
                      </button>
                      <button
                        className="admin-action-btn danger"
                        title={u.active ? "Khoá tài khoản" : "Mở khoá"}
                        onClick={() => updateUser(u.id, { active: !u.active })}
                      >
                        {u.active ? "Khoá" : "Mở khoá"}
                      </button>
                      <button
                        className={`admin-action-btn${u.role === "ADMIN" ? " warning" : ""}`}
                        title={u.role === "ADMIN" ? "Hạ xuống User" : "Cấp quyền Admin"}
                        onClick={() => updateUser(u.id, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })}
                      >
                        {u.role === "ADMIN" ? "Hạ Admin" : "Cấp Admin"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="admin-footer">Hiển thị {filtered.length} / {users.length} người dùng</p>
    </div>
  );
}

function SportPill({ sport }: { sport: Sport | "REST" | "MIXED" }) {
  const label = sport === "RUN" ? "Chạy" : sport === "SWIM" ? "Bơi" : sport === "REST" ? "Nghỉ" : "Kết hợp";
  return <span className={`sport-pill ${sport.toLowerCase()}`}>{label}</span>;
}

function MacroBox({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="macro-box">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>{label}<input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} /></label>
  );
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "RS";
}

function formatDistance(activity: FitnessActivity) {
  return activity.sportType === "RUN"
    ? `${(activity.distanceMeters / 1000).toFixed(2)} km`
    : `${Math.round(activity.distanceMeters)} m`;
}

function formatRouteDistance(route: RouteItem) {
  return route.sportType === "RUN" ? `${(route.distanceMeters / 1000).toFixed(1)} km` : `${Math.round(route.distanceMeters)} m`;
}

function formatPace(minutes: number, meters: number): string {
  if (meters === 0) return "--";
  const paceMin = minutes / (meters / 1000);
  const m = Math.floor(paceMin);
  const s = Math.round((paceMin - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (mins > 0) return `${mins} phút trước`;
  return "Vừa xong";
}

function recalculateStats(activities: FitnessActivity[], fallback: Stats): Stats {
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const monthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const week = activities.filter((a) => new Date(a.startedAt).getTime() >= weekStart);
  const month = activities.filter((a) => new Date(a.startedAt).getTime() >= monthStart);
  if (activities.length === 0) return fallback;
  return {
    weeklyRunKm: week.filter((a) => a.sportType === "RUN").reduce((s, a) => s + a.distanceMeters, 0) / 1000,
    weeklySwimMeters: Math.round(week.filter((a) => a.sportType === "SWIM").reduce((s, a) => s + a.distanceMeters, 0)),
    weeklyMinutes: week.reduce((s, a) => s + a.durationMinutes, 0),
    weeklySessions: week.length,
    monthlyRunKm: month.filter((a) => a.sportType === "RUN").reduce((s, a) => s + a.distanceMeters, 0) / 1000,
    monthlySwimMeters: Math.round(month.filter((a) => a.sportType === "SWIM").reduce((s, a) => s + a.distanceMeters, 0)),
  };
}

async function api<T>(path: string, token: string, fallback: T, init: RequestInit = {}): Promise<T> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token && token !== "demo" ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (res.status === 204) return fallback;
    return await res.json();
  } catch {
    return fallback;
  }
}

async function apiStrict<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token && token !== "demo" ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const text = await res.text();
      if (text) {
        const data = JSON.parse(text) as { message?: string };
        if (data?.message) message = data.message;
      }
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!text.trim()) return {} as T;
  return JSON.parse(text) as T;
}

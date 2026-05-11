import {
  Activity,
  Award,
  BarChart2,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  CreditCard,
  Droplets,
  Flame,
  Heart,
  LogOut,
  Map,
  Medal,
  MessageCircle,
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

type Page = "dashboard" | "training" | "maps" | "nutrition" | "community" | "ai";
type Sport = "RUN" | "SWIM";
type ChallengeSport = Sport | "MIXED";

type Session = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
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
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
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
  place: string;
  distanceMeters: number;
  note: string;
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
    createdAt: string; likeCount: number; commentCount: number; likedByMe: boolean;
  };

  function mapPost(v: PostApiView): Post {
    return {
      id: v.id, userId: v.userId, authorName: v.athleteName, title: v.title,
      content: v.content, sportType: v.sportType, distanceMeters: v.distanceMeters,
      durationMinutes: v.durationMinutes, calories: v.calories, createdAt: v.createdAt,
      likes: v.likeCount, liked: v.likedByMe, commentCount: v.commentCount, comments: [],
    };
  }

  async function loadDashboard(current: Session) {
    const [profileData, statsData, activityData, planData, mealsData, routesData, savedRouteData, challengeData, postData] = await Promise.all([
      api<AthleteProfile>(`/athletes/${current.userId}`, current.token, fallbackProfile),
      api<Stats>(`/activities/stats/${current.userId}`, current.token, fallbackStats),
      api<FitnessActivity[]>(`/activities/user/${current.userId}`, current.token, fallbackActivities),
      api<NutritionPlan>(`/nutrition/${current.userId}/plan`, current.token, fallbackPlan),
      api<MealEntry[]>(`/nutrition/${current.userId}/meals`, current.token, []),
      api<RouteItem[]>("/activities/routes", current.token, []),
      api<number[]>(`/activities/routes/saved/${current.userId}`, current.token, []),
      api<Challenge[]>(`/activities/challenges/user/${current.userId}`, current.token, []),
      api<PostApiView[]>(`/community/posts?userId=${current.userId}`, current.token, []),
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

      <section className={`strava-main${page === "maps" ? " maps-fullscreen" : ""}`}>
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
          />
        )}
        {page === "maps" && (
          <MapsPage
            routes={routes}
            savedRoutes={savedRoutes}
            onToggleRoute={toggleSavedRoute}
            onAddActivity={() => setShowActivityModal(true)}
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
            notify={notify}
          />
        )}
        {page === "ai" && <AiCoachPage token={session.token} userId={session.userId} stats={stats} />}
        {page === "community" && (
          <CommunityPage
            posts={posts}
            setPosts={setPosts}
            token={session.token}
            currentUserId={session.userId}
            following={following}
            onLike={likePost}
            onComment={addComment}
            onFollow={toggleFollow}
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
  page, setPage, profile, routes, profileMenuOpen, notificationsOpen,
  onAdd, onTrial, onProfileMenu, onNotifications, onEditProfile, onLogout,
}: {
  page: Page;
  setPage: (page: Page) => void;
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
    ...routes.map((r) => ({ label: r.name, hint: `${r.place} - ${formatRouteDistance(r)}`, page: "maps" as Page })),
    { label: "Kế hoạch dinh dưỡng", hint: "Calories, macro, nước", page: "nutrition" as Page },
    { label: "AI Coach", hint: "Hỏi về lịch tập và phục hồi", page: "ai" as Page },
    { label: "Cộng đồng", hint: "Feed hoạt động bạn bè", page: "community" as Page },
    { label: "Tập luyện", hint: "GPS ghi buổi tập, lịch 7 ngày", page: "training" as Page },
  ]
    .filter((r) => `${r.label} ${r.hint}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);

  const nav: Array<{ id: Page; label: string; icon: ReactNode }> = [
    { id: "dashboard", label: "Trang chủ", icon: <Activity size={17} /> },
    { id: "training", label: "Tập luyện", icon: <CalendarDays size={17} /> },
    { id: "maps", label: "Bản đồ", icon: <Map size={17} /> },
    { id: "nutrition", label: "Dinh dưỡng", icon: <Salad size={17} /> },
    { id: "community", label: "Cộng đồng", icon: <Users size={17} /> },
    { id: "ai", label: "AI Coach", icon: <Bot size={17} /> },
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
            <button onClick={onEditProfile}><Settings size={16} /> Sửa hồ sơ</button>
            <button onClick={onLogout}><LogOut size={16} /> Đăng xuất</button>
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

function TrainingPage({
  profile, stats, trainingPlan, setTrainingPlan, notify, token, userId, onSaveActivity,
}: {
  profile: AthleteProfile;
  stats: Stats;
  trainingPlan: TrainingDay[];
  setTrainingPlan: (plan: TrainingDay[]) => void;
  notify: (msg: string) => void;
  token: string;
  userId: number;
  onSaveActivity: (payload: Omit<FitnessActivity, "id" | "startedAt"> & { gpsRouteJson?: string; averagePaceSecondsPerKm?: number }) => Promise<void>;
}) {
  const [sport, setSport] = useState<Sport>("RUN");
  const [recordState, setRecordState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [gpsPoints, setGpsPoints] = useState<GpsPoint[]>([]);
  const [gpsError, setGpsError] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number]>([106.6297, 10.8231]);
  const [saving, setSaving] = useState(false);
  const [coachNote, setCoachNote] = useState("Lịch hiện tại ưu tiên nền tảng sức bền: chạy dễ, bơi kỹ thuật và phục hồi đủ.");
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void; getSource: (id: string) => { setData: (d: unknown) => void } | undefined; addSource: (id: string, d: unknown) => void; addLayer: (d: unknown) => void; flyTo: (opts: unknown) => void; on: (evt: string, cb: () => void) => void } | null>(null);

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
      const map = new ml.Map({
        container: mapRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: userLocation,
        zoom: 14,
      }) as typeof mapInstanceRef.current;
      map!.on("load", () => {
        map!.addSource("route", { type: "geojson", data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} } });
        map!.addLayer({ id: "route-line", type: "line", source: "route", layout: { "line-join": "round", "line-cap": "round" }, paint: { "line-color": "var(--orange, #f97316)", "line-width": 4 } });
      });
      mapInstanceRef.current = map;
    });
    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
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
      map.flyTo({ center: [last.lng, last.lat], zoom: 15 });
    }
  }, [gpsPoints]);

  function startRecording() {
    if (!navigator.geolocation) { setGpsError("Trình duyệt không hỗ trợ GPS."); return; }
    setGpsPoints([]);
    setElapsed(0);
    setGpsError("");
    setRecordState("recording");
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => setGpsPoints((prev) => [...prev, { lat: pos.coords.latitude, lng: pos.coords.longitude, ts: Date.now() }]),
      () => setGpsError("Không thể lấy vị trí GPS. Kiểm tra quyền truy cập."),
      { enableHighAccuracy: true, maximumAge: 2000 }
    );
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
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
    const dist = sport === "RUN" ? distanceM : distanceM;
    await onSaveActivity({
      userId,
      athleteName: profile.displayName,
      sportType: sport,
      title: sport === "RUN" ? `Chạy ${distKm.toFixed(2)} km` : `Bơi ${Math.round(distanceM)} m`,
      description: `GPS ghi tự động. ${gpsPoints.length} điểm.`,
      durationMinutes: durationMins,
      distanceMeters: dist,
      averageHeartRate: undefined,
      calories: Math.round(durationMins * (sport === "RUN" ? 9.5 : 8)),
      elevationGainMeters: sport === "RUN" ? undefined : undefined,
      poolLengthMeters: sport === "SWIM" ? 50 : undefined,
      strokes: undefined,
      routeName: "GPS tự ghi",
      visibility: "PUBLIC",
      gpsRouteJson: gpsPoints.length > 0 ? JSON.stringify(gpsPoints) : undefined,
      averagePaceSecondsPerKm: paceSecPerKm || undefined,
    });
    setSaving(false);
    setRecordState("idle");
    setGpsPoints([]);
    setElapsed(0);
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

  return (
    <div className="training-record-page">
      {/* ─── Two-column webapp layout ─── */}
      <div className="training-web-layout">
        {/* Left sidebar: controls */}
        <div className="training-web-sidebar">
          <div className="record-sport-tabs">
            <button className={sport === "RUN" ? "active" : ""} onClick={() => { if (recordState === "idle") setSport("RUN"); }}>
              <Flame size={18} /> Chạy bộ
            </button>
            <button className={sport === "SWIM" ? "active" : ""} onClick={() => { if (recordState === "idle") setSport("SWIM"); }}>
              <Waves size={18} /> Bơi
            </button>
          </div>

          <div className="record-stats">
            <div className="record-stat">
              <span className="record-stat-value">{formatElapsed(elapsed)}</span>
              <span className="record-stat-label">Thời gian</span>
            </div>
            <div className="record-stat record-stat-center">
              <span className="record-stat-value">{sport === "RUN" ? distKm.toFixed(2) : Math.round(distanceM)}</span>
              <span className="record-stat-label">{sport === "RUN" ? "km" : "m bơi"}</span>
            </div>
            <div className="record-stat">
              <span className="record-stat-value">{sport === "RUN" ? formatPace(paceSecPerKm) : "--"}</span>
              <span className="record-stat-label">{sport === "RUN" ? "min/km" : "pace"}</span>
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
                  <div><strong>{sport === "RUN" ? distKm.toFixed(2) + " km" : Math.round(distanceM) + " m"}</strong><span>Quãng đường</span></div>
                  {sport === "RUN" && <div><strong>{formatPace(paceSecPerKm)}</strong><span>Pace TB</span></div>}
                  <div><strong>{Math.round((elapsed / 60) * (sport === "RUN" ? 9.5 : 8))}</strong><span>Cal</span></div>
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
          {sport === "SWIM" ? (
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
          <button className="outline-button" onClick={regeneratePlan}><Sparkles size={16} /> AI tạo lại</button>
        </div>
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
                <strong>{day.duration}</strong>
                <button className={day.done ? "outline-button" : "orange-button"} onClick={() => toggleDone(day.id)}>
                  {day.done ? "✓ Xong" : "Hoàn thành"}
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

function MapsPage({ routes, savedRoutes, onToggleRoute, onAddActivity }: {
  routes: RouteItem[];
  savedRoutes: number[];
  onToggleRoute: (routeId: number) => void;
  onAddActivity: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState<"ALL" | Sport>("ALL");
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [userLocation, setUserLocation] = useState<[number, number]>([106.6297, 10.8231]);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{ remove: () => void; flyTo: (o: unknown) => void } | null>(null);

  const filtered = routes.filter((r) => {
    const matchesQuery = `${r.name} ${r.place} ${r.sportType}`.toLowerCase().includes(query.toLowerCase());
    const matchesSport = sportFilter === "ALL" || r.sportType === sportFilter;
    return matchesQuery && matchesSport;
  });

  useEffect(() => {
    if (!mapRef.current) return;
    let cancelled = false;
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.longitude, pos.coords.latitude]),
      () => {}
    );
    import("maplibre-gl").then((ml) => {
      if (cancelled || !mapRef.current) return;
      mapInstanceRef.current?.remove();
      const map = new ml.Map({
        container: mapRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: userLocation,
        zoom: 13,
      });
      mapInstanceRef.current = map as typeof mapInstanceRef.current;
    });
    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  function focusRoute(route: RouteItem) {
    setSelectedRoute(route);
    mapInstanceRef.current?.flyTo({ center: userLocation, zoom: 14 });
  }

  return (
    <div className="maps-fullscreen-page">
      {/* Full-screen map */}
      <div ref={mapRef} className="maps-fullscreen-map" />

      {/* Top overlay toolbar */}
      <div className="maps-overlay-toolbar">
        <div className="maps-search-box">
          <Search size={15} />
          <input
            placeholder="Tìm kiếm vị trí, tuyến đường..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="maps-sport-filter-wrap">
          <select
            className="maps-sport-filter"
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value as "ALL" | Sport)}
          >
            <option value="ALL">Tất cả các môn</option>
            <option value="RUN">Chạy bộ</option>
            <option value="SWIM">Bơi lội</option>
          </select>
        </div>
        <div className="maps-toolbar-actions">
          <button className="orange-button" onClick={onAddActivity}><Route size={15} /> Ghi hoạt động</button>
          <button className={`outline-button${panelOpen ? " active" : ""}`} onClick={() => setPanelOpen(!panelOpen)}>
            Lộ trình của tôi {panelOpen ? "←" : "→"}
          </button>
        </div>
      </div>

      {/* Selected route detail overlay */}
      {selectedRoute && (
        <div className="maps-route-detail">
          <div className="maps-route-detail-head">
            <SportPill sport={selectedRoute.sportType} />
            <strong>{selectedRoute.name}</strong>
            <button className="icon-button" onClick={() => setSelectedRoute(null)}><X size={16} /></button>
          </div>
          <p>{selectedRoute.place} · {formatRouteDistance(selectedRoute)}</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{selectedRoute.note}</p>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button className={savedRoutes.includes(selectedRoute.id) ? "outline-button" : "orange-button"} onClick={() => onToggleRoute(selectedRoute.id)}>
              {savedRoutes.includes(selectedRoute.id) ? "Đã lưu" : "Lưu tuyến"}
            </button>
            <button className="outline-button" onClick={onAddActivity}>Ghi hoạt động</button>
          </div>
        </div>
      )}

      {/* Route list side panel */}
      {panelOpen && (
        <div className="maps-route-panel">
          <div className="maps-panel-head">
            <strong>Tuyến đường ({filtered.length})</strong>
            <button className="icon-button" onClick={() => setPanelOpen(false)}><X size={16} /></button>
          </div>
          <div className="maps-panel-list">
            {filtered.length === 0 ? (
              <div className="empty-log" style={{ padding: "24px 0" }}>
                <Route size={36} />
                <p>Không tìm thấy tuyến nào.</p>
              </div>
            ) : (
              filtered.map((route) => (
                <div
                  key={route.id}
                  className={`maps-route-item${selectedRoute?.id === route.id ? " selected" : ""}`}
                  onClick={() => focusRoute(route)}
                >
                  <div className="maps-route-item-info">
                    <SportPill sport={route.sportType} />
                    <strong>{route.name}</strong>
                    <span>{route.place}</span>
                    <span className="maps-route-distance">{formatRouteDistance(route)}</span>
                  </div>
                  <button
                    className={savedRoutes.includes(route.id) ? "outline-button" : "orange-button"}
                    style={{ fontSize: "0.78rem", padding: "4px 10px", minHeight: "28px" }}
                    onClick={(e) => { e.stopPropagation(); onToggleRoute(route.id); }}
                  >
                    {savedRoutes.includes(route.id) ? "Đã lưu" : "Lưu"}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
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

function NutritionPage({ token, userId, plan, setPlan, meals, setMeals, notify }: {
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
        "/auth/payments/paypal/create-order",
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
              `/auth/payments/paypal/capture/${orderRes.orderId}`,
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
          `/auth/payments/paypal/capture/${orderRes.orderId}`,
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
      <form className="modal-form" onSubmit={submit}>
        <label>Tên hiển thị<input value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} /></label>
        <label>Thành phố<input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></label>
        <label>Giới thiệu<textarea value={draft.bio ?? ""} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} /></label>
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
        <label>Mục tiêu<input value={draft.primaryGoal} onChange={(e) => setDraft({ ...draft, primaryGoal: e.target.value })} /></label>
        <div className="input-grid">
          <NumberField label="Km chạy/tuần" value={draft.weeklyRunGoalKm} onChange={(v) => setDraft({ ...draft, weeklyRunGoalKm: v })} />
          <NumberField label="Mét bơi/tuần" value={draft.weeklySwimGoalMeters} onChange={(v) => setDraft({ ...draft, weeklySwimGoalMeters: v })} />
        </div>
        <label>Trọng tâm dinh dưỡng<input value={draft.nutritionFocus} onChange={(e) => setDraft({ ...draft, nutritionFocus: e.target.value })} /></label>
        <button className="orange-button">Lưu hồ sơ</button>
      </form>
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

function Onboarding({ onDone }: { onDone: (session: Session) => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [demoError, setDemoError] = useState("");
  const [onboardingSession, setOnboardingSession] = useState<Session | null>(null);
  const [form, setForm] = useState({
    fullName: "Mèo Mũ Vận Học",
    email: "runner@example.com",
    password: "RunSwim123",
    gender: "Nam",
    dateOfBirth: "1995-06-15",
    heightCm: 172,
    weightKg: 68,
    city: "Ho Chi Minh City",
    primaryGoal: "Chạy đều 35 km và bơi 3.200 m mỗi tuần",
    experienceLevel: "INTERMEDIATE",
    nutritionFocus: "Nạp năng lượng cho sức bền",
    weeklyRunGoalKm: 35,
    weeklySwimGoalMeters: 3200,
  });

  const isOnboardingOnly = onboardingSession !== null;
  const steps = isOnboardingOnly ? ["Cá nhân", "Mục tiêu"] : ["Tài khoản", "Cá nhân", "Mục tiêu"];
  const currentStep = isOnboardingOnly ? step + 1 : step;

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
      } catch {
        setAuthError("Không thể hoàn tất onboarding. Hãy thử lại.");
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
      const auth = await apiStrict<Session>(authPath, "", { method: "POST", body: JSON.stringify(authBody) });
      if (mode === "signup") {
        await completeOnboarding(auth);
        onDone({ ...auth, onboardingCompleted: true });
      } else if (auth.onboardingCompleted) {
        onDone(auth);
      } else {
        setOnboardingSession(auth);
        setStep(0);
      }
    } catch {
      setAuthError(mode === "login" ? "Email hoặc mật khẩu chưa đúng." : "Không thể tạo tài khoản. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function completeOnboarding(auth: Session) {
    await apiStrict(`/athletes/${auth.userId}/onboarding`, auth.token, {
      method: "POST",
      body: JSON.stringify({
        displayName: form.fullName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        heightCm: form.heightCm,
        weightKg: form.weightKg,
        city: form.city,
        primaryGoal: form.primaryGoal,
        experienceLevel: form.experienceLevel,
        preferredTrainingDays: ["MON", "WED", "FRI", "SUN"],
        nutritionFocus: form.nutritionFocus,
        weeklyRunGoalKm: form.weeklyRunGoalKm,
        weeklySwimGoalMeters: form.weeklySwimGoalMeters,
        visibility: "PRIVATE",
      }),
    });
    await apiStrict(`/auth/users/${auth.userId}/onboarding-complete`, auth.token, { method: "PATCH" });
  }

  async function startDemo() {
    setLoading(true);
    setDemoError("");
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: demoSession.email, password: "RunSwim123" }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const auth = await response.json() as Session;
      if (auth.onboardingCompleted) {
        onDone(auth);
      } else {
        setOnboardingSession(auth);
        setStep(0);
      }
    } catch {
      setDemoError("Không thể mở bản demo ngay lúc này. Hãy thử đăng nhập lại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="onboarding-screen">
      <section className="onboarding-visual">
        <div className="hero-copy">
          <span className="eyebrow">RUNSWIM</span>
          <h1>Luyện tập chạy và bơi có kế hoạch hơn.</h1>
          <p>Theo dõi hoạt động, mục tiêu tuần, lịch tập, dinh dưỡng và hỏi AI coach trong một nơi.</p>
        </div>
      </section>
      <section className="onboarding-panel">
        {!isOnboardingOnly && (
          <div className="mode-switch" role="tablist">
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Tham gia</button>
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Đăng nhập</button>
          </div>
        )}
        {(mode === "signup" || isOnboardingOnly) && (
          <div className="stepper" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
            {steps.map((label, i) => <span key={label} className={i <= step ? "active" : ""}>{label}</span>)}
          </div>
        )}
        <form onSubmit={submit} className="onboarding-form">
          {!isOnboardingOnly && (mode === "login" || currentStep === 0) && (
            <>
              {mode === "signup" && <label>Tên<input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>}
              <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label>Mật khẩu<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
            </>
          )}
          {currentStep === 1 && (
            <>
              <label>Giới tính
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option>Nam</option><option>Nữ</option><option>Khác</option>
                </select>
              </label>
              <label>Ngày sinh<input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></label>
              <div className="input-grid">
                <NumberField label="Chiều cao (cm)" value={form.heightCm} onChange={(v) => setForm({ ...form, heightCm: v })} />
                <NumberField label="Cân nặng (kg)" value={form.weightKg} onChange={(v) => setForm({ ...form, weightKg: v })} />
              </div>
              <label>Thành phố<input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              <label>Trình độ
                <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
                  <option>BEGINNER</option><option>INTERMEDIATE</option><option>ADVANCED</option>
                </select>
              </label>
            </>
          )}
          {currentStep === 2 && (
            <>
              <div className="sport-choice selected"><Flame size={20} /> Chạy bộ</div>
              <div className="sport-choice selected"><Waves size={20} /> Bơi lội</div>
              <label>Mục tiêu luyện tập
                <select value={form.primaryGoal} onChange={(e) => setForm({ ...form, primaryGoal: e.target.value })}>
                  <option value="Giảm cân">Giảm cân</option>
                  <option value="Cải thiện tốc độ">Cải thiện tốc độ</option>
                  <option value="Tăng sức bền">Tăng sức bền</option>
                  <option value="Luyện tập cho vui">Luyện tập cho vui</option>
                  <option value="Chạy đều 35 km và bơi 3.200 m mỗi tuần">Mục tiêu cá nhân</option>
                </select>
              </label>
              <div className="input-grid">
                <NumberField label="Km chạy/tuần" value={form.weeklyRunGoalKm} onChange={(v) => setForm({ ...form, weeklyRunGoalKm: v })} />
                <NumberField label="Mét bơi/tuần" value={form.weeklySwimGoalMeters} onChange={(v) => setForm({ ...form, weeklySwimGoalMeters: v })} />
              </div>
              <label>Trọng tâm dinh dưỡng<input value={form.nutritionFocus} onChange={(e) => setForm({ ...form, nutritionFocus: e.target.value })} /></label>
            </>
          )}
          <button className="orange-button wide" disabled={loading}>
            {loading ? "Đang xử lý..." : (mode === "signup" || isOnboardingOnly) && step < steps.length - 1 ? "Tiếp tục" : "Bắt đầu luyện tập"}
          </button>
          {!isOnboardingOnly && (
            <button type="button" className="outline-button centered" disabled={loading} onClick={() => void startDemo()}>
              {loading ? "Đang mở demo..." : "Vào bản demo"}
            </button>
          )}
          {authError && <p className="form-error">{authError}</p>}
          {demoError && <p className="form-error">{demoError}</p>}
        </form>
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
      const data = await res.json() as { message?: string };
      if (data?.message) message = data.message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (res.status === 204) return {} as T;
  return await res.json();
}

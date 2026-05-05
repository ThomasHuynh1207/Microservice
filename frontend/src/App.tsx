import {
  Activity,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CirclePlus,
  Droplets,
  Flame,
  LogOut,
  Map,
  Medal,
  Route,
  Salad,
  Search,
  Send,
  Settings,
  Sparkles,
  Trophy,
  Utensils,
  Watch,
  Waves,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Page = "dashboard" | "training" | "maps" | "challenges" | "nutrition" | "ai";
type Sport = "RUN" | "SWIM";

type Session = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  onboardingCompleted: boolean;
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
  id: string;
  name: string;
  type: Sport;
  place: string;
  distance: string;
  note: string;
};

type Challenge = {
  id: string;
  title: string;
  sport: Sport | "MIXED";
  target: string;
  progress: number;
  note: string;
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

const routeLibrary: RouteItem[] = [
  { id: "river-loop", name: "Saigon River Loop", type: "RUN", place: "Quận 1 - Thủ Thiêm", distance: "7.2 km", note: "Đường phẳng, phù hợp tempo nhẹ." },
  { id: "park-5k", name: "Công viên 5K", type: "RUN", place: "Công viên Gia Định", distance: "5.0 km", note: "Dễ kiểm soát pace và nhịp tim." },
  { id: "pool-50", name: "Hồ bơi 50m", type: "SWIM", place: "Trung tâm TDTT Quận", distance: "1.500 - 3.000 m", note: "Tốt cho bài interval và drill." },
  { id: "pool-recovery", name: "Recovery Swim Lane", type: "SWIM", place: "Hồ bơi Phú Nhuận", distance: "1.000 m", note: "Buổi nhẹ sau long run." },
];

const challengeLibrary: Challenge[] = [
  { id: "run-30", title: "Chạy 30K trong tuần", sport: "RUN", target: "30 km", progress: 0, note: "Tập trung đều đặn, không cần chạy nhanh." },
  { id: "swim-5k", title: "Bơi 5K trong tuần", sport: "SWIM", target: "5.000 m", progress: 0, note: "Chia thành 2-3 buổi để giữ kỹ thuật." },
  { id: "balanced", title: "Cân bằng chạy + bơi", sport: "MIXED", target: "4 buổi", progress: 0, note: "Ít nhất 2 buổi chạy và 2 buổi bơi." },
];

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
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [connectedDevices, setConnectedDevices] = useState<string[]>(() => readStorage("runswim-devices", []));
  const [savedRoutes, setSavedRoutes] = useState<string[]>(() => readStorage("runswim-routes", []));
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>(() => readStorage("runswim-challenges", []));
  const [trainingPlan, setTrainingPlan] = useState<TrainingDay[]>(() => readStorage("runswim-plan", initialTrainingPlan));

  useEffect(() => {
    if (!session) return;
    localStorage.setItem("runswim-session", JSON.stringify(session));
    void loadDashboard(session);
  }, [session]);

  useEffect(() => localStorage.setItem("runswim-devices", JSON.stringify(connectedDevices)), [connectedDevices]);
  useEffect(() => localStorage.setItem("runswim-routes", JSON.stringify(savedRoutes)), [savedRoutes]);
  useEffect(() => localStorage.setItem("runswim-challenges", JSON.stringify(joinedChallenges)), [joinedChallenges]);
  useEffect(() => localStorage.setItem("runswim-plan", JSON.stringify(trainingPlan)), [trainingPlan]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  async function loadDashboard(current: Session) {
    const [profileData, statsData, activityData, planData, mealsData] = await Promise.all([
      api<AthleteProfile>(`/athletes/${current.userId}`, current.token, fallbackProfile),
      api<Stats>(`/activities/stats/${current.userId}`, current.token, fallbackStats),
      api<FitnessActivity[]>(`/activities/user/${current.userId}`, current.token, fallbackActivities),
      api<NutritionPlan>(`/nutrition/${current.userId}/plan`, current.token, fallbackPlan),
      api<MealEntry[]>(`/nutrition/${current.userId}/meals`, current.token, []),
    ]);
    setProfile({ ...fallbackProfile, ...profileData });
    setStats(recalculateStats(activityData, statsData));
    setActivities(activityData);
    setNutritionPlan({ ...fallbackPlan, ...planData });
    setMeals(mealsData);
  }

  async function createActivity(payload: Omit<FitnessActivity, "id" | "startedAt">) {
    const fallback = {
      ...payload,
      id: Date.now(),
      startedAt: new Date().toISOString(),
    };
    const created = await api<FitnessActivity>("/activities", session?.token ?? "", fallback, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const nextActivities = [created, ...activities.filter((activity) => activity.id !== created.id)];
    setActivities(nextActivities);
    setStats(recalculateStats(nextActivities, stats));
    setShowActivityModal(false);
    notify("Đã ghi hoạt động vào nhật ký luyện tập.");
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
        profileMenuOpen={profileMenuOpen}
        notificationsOpen={notificationsOpen}
        onAdd={() => setShowActivityModal(true)}
        onTrial={() => setShowPremiumModal(true)}
        onProfileMenu={() => setProfileMenuOpen(!profileMenuOpen)}
        onNotifications={() => setNotificationsOpen(!notificationsOpen)}
        onEditProfile={() => {
          setShowProfileModal(true);
          setProfileMenuOpen(false);
        }}
        onLogout={logout}
      />

      <section className="strava-main">
        {page === "dashboard" && (
          <DashboardPage
            profile={profile}
            stats={stats}
            activities={activities}
            connectedDevices={connectedDevices}
            trainingPlan={trainingPlan}
            nutritionPlan={nutritionPlan}
            setPage={setPage}
            onAddActivity={() => setShowActivityModal(true)}
            onConnectDevice={() => setShowDeviceModal(true)}
            onTrial={() => setShowPremiumModal(true)}
          />
        )}
        {page === "training" && (
          <TrainingPage
            profile={profile}
            stats={stats}
            trainingPlan={trainingPlan}
            setTrainingPlan={setTrainingPlan}
            onAddActivity={() => setShowActivityModal(true)}
            notify={notify}
            token={session.token}
            userId={session.userId}
          />
        )}
        {page === "maps" && (
          <MapsPage savedRoutes={savedRoutes} setSavedRoutes={setSavedRoutes} notify={notify} onAddActivity={() => setShowActivityModal(true)} />
        )}
        {page === "challenges" && (
          <ChallengesPage stats={stats} joined={joinedChallenges} setJoined={setJoinedChallenges} notify={notify} />
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
      {showPremiumModal && <PremiumModal onClose={() => setShowPremiumModal(false)} notify={notify} />}
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
  profile,
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
  profile: AthleteProfile;
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
    ...routeLibrary.map((item) => ({ label: item.name, hint: `${item.place} - ${item.distance}`, page: "maps" as Page })),
    ...challengeLibrary.map((item) => ({ label: item.title, hint: item.target, page: "challenges" as Page })),
    { label: "Kế hoạch dinh dưỡng", hint: "Calories, macro, nước", page: "nutrition" as Page },
    { label: "AI Coach", hint: "Hỏi về lịch tập và phục hồi", page: "ai" as Page },
  ].filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(query.toLowerCase())).slice(0, 5);
  const nav: Array<{ id: Page; label: string; icon: ReactNode }> = [
    { id: "dashboard", label: "Bảng điều khiển", icon: <Activity size={17} /> },
    { id: "training", label: "Tập luyện", icon: <CalendarDays size={17} /> },
    { id: "maps", label: "Bản đồ", icon: <Map size={17} /> },
    { id: "challenges", label: "Thử thách", icon: <Trophy size={17} /> },
    { id: "nutrition", label: "Dinh dưỡng", icon: <Salad size={17} /> },
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
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <div className="search-results">
              {searchResults.length === 0 ? (
                <span>Không có kết quả phù hợp.</span>
              ) : searchResults.map((result) => (
                <button
                  key={`${result.page}-${result.label}`}
                  onClick={() => {
                    setPage(result.page);
                    setQuery("");
                  }}
                >
                  <strong>{result.label}</strong>
                  <small>{result.hint}</small>
                </button>
              ))}
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
  profile,
  stats,
  activities,
  connectedDevices,
  trainingPlan,
  nutritionPlan,
  setPage,
  onAddActivity,
  onConnectDevice,
  onTrial,
}: {
  profile: AthleteProfile;
  stats: Stats;
  activities: FitnessActivity[];
  connectedDevices: string[];
  trainingPlan: TrainingDay[];
  nutritionPlan: NutritionPlan;
  setPage: (page: Page) => void;
  onAddActivity: () => void;
  onConnectDevice: () => void;
  onTrial: () => void;
}) {
  const nextWorkout = trainingPlan.find((day) => !day.done) ?? trainingPlan[0];
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
        <ActivityLog activities={activities} onAddActivity={onAddActivity} />
      </section>

      <aside className="right-rail">
        <RailCard icon={<Bot size={24} />} title="AI Coach" action="Hỏi AI" onClick={() => setPage("ai")}>
          Phân tích tải tập tuần này và đề xuất buổi chạy/bơi tiếp theo.
        </RailCard>
        <RailCard icon={<Utensils size={24} />} title="Dinh dưỡng" action="Xem kế hoạch" onClick={() => setPage("nutrition")}>
          {nutritionPlan.guidance}
        </RailCard>
        <RailCard icon={<Medal size={24} />} title="Thử thách cá nhân" action="Chọn thử thách" onClick={() => setPage("challenges")}>
          Đặt mục tiêu 30K chạy, 5K bơi hoặc cân bằng cả hai trong tuần.
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
        <button onClick={onTrial}>Nâng cấp</button>
      </div>
      <ProgressRow label="Chạy tuần này" value={`${stats.weeklyRunKm.toFixed(1)} / ${profile.weeklyRunGoalKm} km`} progress={runProgress} />
      <ProgressRow label="Bơi tuần này" value={`${stats.weeklySwimMeters} / ${profile.weeklySwimGoalMeters} m`} progress={swimProgress} />
    </article>
  );
}

function GettingStartedCard({
  hasActivities,
  hasDevice,
  onAddActivity,
  onConnectDevice,
  onTraining,
  onNutrition,
  onAi,
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
        <TaskRow
          done={hasActivities}
          icon={<Activity size={46} />}
          title="Ghi hoạt động đầu tiên của bạn"
          text="Nhập quãng đường, thời gian, nhịp tim và ghi chú để theo dõi tiến bộ."
          action="Ghi hoạt động"
          onClick={onAddActivity}
        />
        <TaskRow
          done={hasDevice}
          icon={<Watch size={46} />}
          title="Kết nối thiết bị"
          text="Mô phỏng kết nối Garmin, Apple Watch hoặc file GPX để đồng bộ buổi tập."
          action="Kết nối thiết bị"
          onClick={onConnectDevice}
        />
        <TaskRow
          icon={<CalendarDays size={46} />}
          title="Tạo lịch luyện tập"
          text="Lịch 7 ngày cho chạy và bơi, có đánh dấu hoàn thành từng buổi."
          action="Xem lịch tập"
          onClick={onTraining}
        />
        <TaskRow
          icon={<Utensils size={46} />}
          title="Thiết lập dinh dưỡng"
          text="Theo dõi calories, macro, nước uống và bữa phục hồi sau tập."
          action="Mở dinh dưỡng"
          onClick={onNutrition}
        />
        <TaskRow
          icon={<Bot size={46} />}
          title="Hỏi AI coach"
          text="Nhận gợi ý buổi chạy/bơi tiếp theo dựa trên tải tập hiện tại."
          action="Hỏi AI"
          onClick={onAi}
        />
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

function ActivityLog({ activities, onAddActivity }: { activities: FitnessActivity[]; onAddActivity: () => void }) {
  return (
    <article className="log-card">
      <div className="section-head">
        <div>
          <span className="section-kicker">Nhật ký</span>
          <h2>Hoạt động gần đây</h2>
        </div>
        <button className="outline-button" onClick={onAddActivity}><CirclePlus size={18} /> Thêm</button>
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
          {activities.map((activity) => (
            <div key={activity.id} className="activity-row">
              <SportPill sport={activity.sportType} />
              <div>
                <strong>{activity.title}</strong>
                <span>{activity.description || activity.routeName}</span>
              </div>
              <span>{formatDistance(activity)}</span>
              <span>{activity.durationMinutes} phút</span>
              <span>{activity.averageHeartRate ?? "--"} bpm</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function TrainingPage({
  profile,
  stats,
  trainingPlan,
  setTrainingPlan,
  onAddActivity,
  notify,
  token,
  userId,
}: {
  profile: AthleteProfile;
  stats: Stats;
  trainingPlan: TrainingDay[];
  setTrainingPlan: (plan: TrainingDay[]) => void;
  onAddActivity: () => void;
  notify: (message: string) => void;
  token: string;
  userId: number;
}) {
  const [coachNote, setCoachNote] = useState("Lịch hiện tại ưu tiên nền tảng sức bền: chạy dễ, bơi kỹ thuật và phục hồi đủ.");

  async function regeneratePlan() {
    const insight = await api<{ recommendation: string }>("/ai/insights", token, { recommendation: coachNote }, {
      method: "POST",
      body: JSON.stringify({ userId, weeklyRunKm: stats.weeklyRunKm, weeklySwimMeters: stats.weeklySwimMeters, weeklyMinutes: stats.weeklyMinutes }),
    });
    setCoachNote(insight.recommendation);
    setTrainingPlan(initialTrainingPlan.map((day) => ({ ...day, done: false })));
    notify("Đã tạo lại lịch 7 ngày dựa trên tải tập hiện tại.");
  }

  function toggleDone(id: string) {
    setTrainingPlan(trainingPlan.map((day) => day.id === id ? { ...day, done: !day.done } : day));
  }

  return (
    <div className="single-page">
      <section className="page-title">
        <span className="section-kicker">Tập luyện</span>
        <h1>Kế hoạch chạy và bơi của {profile.displayName}</h1>
        <p>{coachNote}</p>
        <div className="page-actions">
          <button className="orange-button" onClick={regeneratePlan}><Sparkles size={18} /> Tạo lại bằng AI</button>
          <button className="outline-button" onClick={onAddActivity}><CirclePlus size={18} /> Ghi buổi tập</button>
        </div>
      </section>
      <section className="training-grid">
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
                {day.done ? "Đã xong" : "Hoàn thành"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function MapsPage({ savedRoutes, setSavedRoutes, notify, onAddActivity }: {
  savedRoutes: string[];
  setSavedRoutes: (routes: string[]) => void;
  notify: (message: string) => void;
  onAddActivity: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = routeLibrary.filter((route) => `${route.name} ${route.place} ${route.type}`.toLowerCase().includes(query.toLowerCase()));

  function toggleRoute(id: string) {
    const saved = savedRoutes.includes(id);
    setSavedRoutes(saved ? savedRoutes.filter((routeId) => routeId !== id) : [...savedRoutes, id]);
    notify(saved ? "Đã bỏ lưu tuyến." : "Đã lưu tuyến vào danh sách của bạn.");
  }

  return (
    <div className="single-page">
      <section className="page-title maps-title">
        <span className="section-kicker">Bản đồ</span>
        <h1>Tuyến chạy và địa điểm bơi</h1>
        <p>Tìm tuyến phù hợp với buổi tập, lưu lại và ghi hoạt động sau khi hoàn thành.</p>
        <div className="map-search">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tuyến chạy, hồ bơi, địa điểm..." />
        </div>
      </section>
      <section className="route-grid">
        {filtered.map((route) => (
          <article key={route.id} className="route-card">
            <div className="route-map"><Route size={34} /></div>
            <SportPill sport={route.type} />
            <h3>{route.name}</h3>
            <span>{route.place}</span>
            <p>{route.note}</p>
            <strong>{route.distance}</strong>
            <div className="route-actions">
              <button className={savedRoutes.includes(route.id) ? "outline-button" : "orange-button"} onClick={() => toggleRoute(route.id)}>
                {savedRoutes.includes(route.id) ? "Đã lưu" : "Lưu tuyến"}
              </button>
              <button className="outline-button" onClick={onAddActivity}>Ghi hoạt động</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function ChallengesPage({ stats, joined, setJoined, notify }: {
  stats: Stats;
  joined: string[];
  setJoined: (ids: string[]) => void;
  notify: (message: string) => void;
}) {
  const challenges = challengeLibrary.map((challenge) => ({
    ...challenge,
    progress: challenge.id === "run-30"
      ? Math.min(100, (stats.weeklyRunKm / 30) * 100)
      : challenge.id === "swim-5k"
        ? Math.min(100, (stats.weeklySwimMeters / 5000) * 100)
        : Math.min(100, ((stats.weeklyRunKm > 0 ? 2 : 0) + (stats.weeklySwimMeters > 0 ? 2 : 0)) / 4 * 100),
  }));

  function toggle(id: string) {
    const active = joined.includes(id);
    setJoined(active ? joined.filter((challengeId) => challengeId !== id) : [...joined, id]);
    notify(active ? "Đã rời thử thách." : "Đã tham gia thử thách cá nhân.");
  }

  return (
    <div className="single-page">
      <section className="page-title">
        <span className="section-kicker">Thử thách</span>
        <h1>Mục tiêu cá nhân cho chạy và bơi</h1>
        <p>Không cần mạng xã hội: dùng thử thách như mốc kiểm tra tiến bộ của chính bạn.</p>
      </section>
      <section className="challenge-grid">
        {challenges.map((challenge) => (
          <article key={challenge.id} className="challenge-card">
            <Medal size={32} />
            <SportPill sport={challenge.sport} />
            <h3>{challenge.title}</h3>
            <p>{challenge.note}</p>
            <ProgressRow label={challenge.target} value={`${Math.round(challenge.progress)}%`} progress={challenge.progress} />
            <button className={joined.includes(challenge.id) ? "outline-button" : "orange-button"} onClick={() => toggle(challenge.id)}>
              {joined.includes(challenge.id) ? "Đang tham gia" : "Tham gia"}
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
  notify: (message: string) => void;
}) {
  const [draft, setDraft] = useState(plan);
  const [meal, setMeal] = useState({ mealType: "SNACK", name: "Recovery smoothie", calories: 420, proteinGrams: 32, carbsGrams: 58, fatGrams: 8 });

  useEffect(() => setDraft(plan), [plan]);

  async function savePlan(event: FormEvent) {
    event.preventDefault();
    const saved = await api<NutritionPlan>(`/nutrition/${userId}/plan`, token, draft, {
      method: "PUT",
      body: JSON.stringify(draft),
    });
    setPlan(saved);
    notify("Đã lưu kế hoạch dinh dưỡng.");
  }

  async function addMeal(event: FormEvent) {
    event.preventDefault();
    const created = await api<MealEntry>("/nutrition/meals", token, { ...meal, id: Date.now() }, {
      method: "POST",
      body: JSON.stringify({ userId, ...meal }),
    });
    setMeals([created, ...meals]);
    notify("Đã thêm bữa ăn vào nhật ký.");
  }

  const displayMeals = meals.length ? meals : [
    { id: 1, mealType: "BREAKFAST", name: "Yến mạch chuối", calories: 520, proteinGrams: 28, carbsGrams: 78, fatGrams: 14 },
    { id: 2, mealType: "LUNCH", name: "Cơm gà phục hồi", calories: 720, proteinGrams: 42, carbsGrams: 92, fatGrams: 21 },
  ];
  const totals = displayMeals.reduce((sum, item) => ({
    calories: sum.calories + item.calories,
    protein: sum.protein + item.proteinGrams,
    carbs: sum.carbs + item.carbsGrams,
    fat: sum.fat + item.fatGrams,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

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
          <label>Mục tiêu<input value={draft.goal} onChange={(event) => setDraft({ ...draft, goal: event.target.value })} /></label>
          <div className="input-grid">
            <NumberField label="Calories" value={draft.dailyCalories} onChange={(value) => setDraft({ ...draft, dailyCalories: value })} />
            <NumberField label="Protein (g)" value={draft.proteinGrams} onChange={(value) => setDraft({ ...draft, proteinGrams: value })} />
            <NumberField label="Carb (g)" value={draft.carbsGrams} onChange={(value) => setDraft({ ...draft, carbsGrams: value })} />
            <NumberField label="Fat (g)" value={draft.fatGrams} onChange={(value) => setDraft({ ...draft, fatGrams: value })} />
          </div>
          <label>Nước/ngày (lít)<input type="number" step="0.1" value={draft.hydrationLiters} onChange={(event) => setDraft({ ...draft, hydrationLiters: Number(event.target.value) })} /></label>
          <label>Gợi ý<textarea value={draft.guidance} onChange={(event) => setDraft({ ...draft, guidance: event.target.value })} /></label>
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
            <select value={meal.mealType} onChange={(event) => setMeal({ ...meal, mealType: event.target.value })}>
              <option>BREAKFAST</option>
              <option>LUNCH</option>
              <option>DINNER</option>
              <option>SNACK</option>
            </select>
            <input value={meal.name} onChange={(event) => setMeal({ ...meal, name: event.target.value })} />
            <NumberField label="Calories" value={meal.calories} onChange={(value) => setMeal({ ...meal, calories: value })} />
            <NumberField label="Protein" value={meal.proteinGrams} onChange={(value) => setMeal({ ...meal, proteinGrams: value })} />
            <NumberField label="Carb" value={meal.carbsGrams} onChange={(value) => setMeal({ ...meal, carbsGrams: value })} />
            <NumberField label="Fat" value={meal.fatGrams} onChange={(value) => setMeal({ ...meal, fatGrams: value })} />
            <button className="orange-button">Thêm bữa</button>
          </form>
          <div className="meal-list">
            {displayMeals.map((item) => (
              <div key={item.id} className="meal-row">
                <span>{item.mealType}</span>
                <strong>{item.name}</strong>
                <small>{item.calories} kcal</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function AiCoachPage({ token, userId, stats }: { token: string; userId: number; stats: Stats }) {
  const [input, setInput] = useState("Tạo lịch 7 ngày cho chạy và bơi");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Mình là AI coach cho chạy, bơi và dinh dưỡng. Hãy hỏi về lịch tập, phục hồi hoặc bữa ăn trước/sau buổi tập." },
  ]);
  const context = useMemo(() => `Weekly run ${stats.weeklyRunKm} km, swim ${stats.weeklySwimMeters} m, training ${stats.weeklyMinutes} minutes.`, [stats]);

  async function send(event?: FormEvent, quickPrompt?: string) {
    event?.preventDefault();
    const userMessage = (quickPrompt ?? input).trim();
    if (!userMessage) return;
    setMessages((current) => [...current, { role: "user", content: userMessage }]);
    setInput("");
    if (!token || token === "demo") {
      setMessages((current) => [...current, { role: "assistant", content: "Bạn đang ở chế độ demo hoặc chưa đăng nhập. Hãy đăng nhập để dùng AI coach." }]);
      return;
    }
    try {
      const response = await apiStrict<{ reply: string }>("/ai/chat", token, {
        method: "POST",
        body: JSON.stringify({ userId, message: userMessage, context }),
      });
      setMessages((current) => [...current, { role: "assistant", content: response.reply }]);
    } catch (error) {
      const message = error instanceof Error && error.message
        ? error.message
        : "Không thể kết nối AI lúc này. Hãy kiểm tra token, API gateway và n8n.";
      setMessages((current) => [...current, { role: "assistant", content: message }]);
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
        {["Tạo lịch 7 ngày", "Hôm nay nên chạy hay bơi?", "Ăn gì trước buổi tempo?", "Cách phục hồi sau long run"].map((prompt) => (
          <button key={prompt} className="outline-button" onClick={() => void send(undefined, prompt)}>{prompt}</button>
        ))}
      </div>
      <section className="chat-panel">
        <div className="chat-window">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === "user" ? "chat-message user" : "chat-message"}>
              {message.content}
            </div>
          ))}
        </div>
        <form className="chat-form" onSubmit={(event) => void send(event)}>
          <input value={input} onChange={(event) => setInput(event.target.value)} />
          <button className="orange-button icon-only" aria-label="Gửi"><Send size={18} /></button>
        </form>
      </section>
    </div>
  );
}

function ActivityModal({ session, profile, onClose, onCreate }: {
  session: Session;
  profile: AthleteProfile;
  onClose: () => void;
  onCreate: (payload: Omit<FitnessActivity, "id" | "startedAt">) => Promise<void>;
}) {
  const [sportType, setSportType] = useState<Sport>("RUN");
  const [title, setTitle] = useState("Chạy dễ buổi chiều");
  const [distance, setDistance] = useState(5);
  const [duration, setDuration] = useState(32);
  const [heartRate, setHeartRate] = useState(145);
  const [calories, setCalories] = useState(320);
  const [notes, setNotes] = useState("Cảm giác ổn, giữ nhịp thở thoải mái.");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    await onCreate({
      userId: session.userId,
      athleteName: profile.displayName,
      sportType,
      title,
      description: notes,
      durationMinutes: duration,
      distanceMeters: sportType === "RUN" ? distance * 1000 : distance,
      averageHeartRate: heartRate,
      calories,
      elevationGainMeters: sportType === "RUN" ? 24 : undefined,
      poolLengthMeters: sportType === "SWIM" ? 50 : undefined,
      strokes: sportType === "SWIM" ? Math.round(distance * 0.52) : undefined,
      routeName: sportType === "RUN" ? "Tuyến tự ghi" : "Hồ bơi 50m",
      visibility: "PRIVATE",
    });
  }

  return (
    <Modal title="Ghi hoạt động" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <div className="segmented">
          <button type="button" className={sportType === "RUN" ? "active" : ""} onClick={() => setSportType("RUN")}><Flame size={18} /> Chạy</button>
          <button type="button" className={sportType === "SWIM" ? "active" : ""} onClick={() => setSportType("SWIM")}><Waves size={18} /> Bơi</button>
        </div>
        <label>Tên hoạt động<input value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        <div className="input-grid">
          <NumberField label={sportType === "RUN" ? "Quãng đường (km)" : "Quãng đường (m)"} value={distance} onChange={setDistance} />
          <NumberField label="Thời gian (phút)" value={duration} onChange={setDuration} />
          <NumberField label="Nhịp tim TB" value={heartRate} onChange={setHeartRate} />
          <NumberField label="Calories" value={calories} onChange={setCalories} />
        </div>
        <label>Ghi chú<textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <button className="orange-button" disabled={saving}>{saving ? "Đang lưu..." : "Lưu hoạt động"}</button>
      </form>
    </Modal>
  );
}

function DeviceModal({ connectedDevices, setConnectedDevices, onClose, notify }: {
  connectedDevices: string[];
  setConnectedDevices: (devices: string[]) => void;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const devices = ["Garmin", "Apple Watch", "Coros", "Strava file upload"];
  function toggle(device: string) {
    const connected = connectedDevices.includes(device);
    setConnectedDevices(connected ? connectedDevices.filter((item) => item !== device) : [...connectedDevices, device]);
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

function PremiumModal({ onClose, notify }: { onClose: () => void; notify: (message: string) => void }) {
  return (
    <Modal title="RunSwim Premium" onClose={onClose}>
      <div className="premium-box">
        <Sparkles size={34} />
        <h3>Phân tích sâu hơn cho luyện tập</h3>
        <p>Mở khóa biểu đồ tiến độ, tải tập, gợi ý phục hồi và kế hoạch dinh dưỡng nâng cao.</p>
        <button className="orange-button" onClick={() => notify("Đã kích hoạt dùng thử Premium trong bản demo.")}>Bắt đầu dùng thử</button>
      </div>
    </Modal>
  );
}

function ProfileModal({ token, profile, setProfile, onClose, notify }: {
  token: string;
  profile: AthleteProfile;
  setProfile: (profile: AthleteProfile) => void;
  onClose: () => void;
  notify: (message: string) => void;
}) {
  const [draft, setDraft] = useState(profile);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const saved = await api<AthleteProfile>(`/athletes/${profile.userId}`, token, draft, {
      method: "PUT",
      body: JSON.stringify({
        displayName: draft.displayName,
        city: draft.city,
        bio: draft.bio,
        primaryGoal: draft.primaryGoal,
        experienceLevel: draft.experienceLevel,
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
        <label>Tên hiển thị<input value={draft.displayName} onChange={(event) => setDraft({ ...draft, displayName: event.target.value })} /></label>
        <label>Thành phố<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label>
        <label>Mục tiêu<input value={draft.primaryGoal} onChange={(event) => setDraft({ ...draft, primaryGoal: event.target.value })} /></label>
        <div className="input-grid">
          <NumberField label="Km chạy/tuần" value={draft.weeklyRunGoalKm} onChange={(value) => setDraft({ ...draft, weeklyRunGoalKm: value })} />
          <NumberField label="Mét bơi/tuần" value={draft.weeklySwimGoalMeters} onChange={(value) => setDraft({ ...draft, weeklySwimGoalMeters: value })} />
        </div>
        <label>Trọng tâm dinh dưỡng<input value={draft.nutritionFocus} onChange={(event) => setDraft({ ...draft, nutritionFocus: event.target.value })} /></label>
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
  const [form, setForm] = useState({
    fullName: "Mèo Mũ Vận Học",
    email: "runner@example.com",
    password: "RunSwim123",
    city: "Ho Chi Minh City",
    primaryGoal: "Chạy đều 35 km và bơi 3.200 m mỗi tuần",
    experienceLevel: "INTERMEDIATE",
    nutritionFocus: "Nạp năng lượng cho sức bền",
    weeklyRunGoalKm: 35,
    weeklySwimGoalMeters: 3200,
  });

  const steps = ["Tài khoản", "Môn tập", "Mục tiêu"];

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < steps.length - 1 && mode === "signup") {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    setAuthError("");
    const authPath = mode === "login" ? "/auth/login" : "/auth/register";
    const authBody = mode === "login"
      ? { email: form.email, password: form.password }
      : { fullName: form.fullName, email: form.email, password: form.password, preferredSports: ["RUN", "SWIM"] };
    try {
      const auth = await apiStrict<Session>(authPath, "", {
        method: "POST",
        body: JSON.stringify(authBody),
      });

      if (mode === "signup") {
        await api(`/athletes/${auth.userId}/onboarding`, auth.token, fallbackProfile, {
          method: "POST",
          body: JSON.stringify({
            displayName: form.fullName,
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
      }

      onDone({ ...auth, onboardingCompleted: true });
    } catch {
      setAuthError(mode === "login"
        ? "Email hoặc mật khẩu chưa đúng. Hãy thử lại."
        : "Không thể tạo tài khoản. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  }

  async function startDemo() {
    setLoading(true);
    setDemoError("");

    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: demoSession.email,
          password: "RunSwim123",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const auth = await response.json() as Session;
      onDone({ ...auth, onboardingCompleted: true });
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
        <div className="mode-switch" role="tablist">
          <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Tham gia</button>
          <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Đăng nhập</button>
        </div>
        {mode === "signup" && (
          <div className="stepper">
            {steps.map((label, index) => <span key={label} className={index <= step ? "active" : ""}>{label}</span>)}
          </div>
        )}
        <form onSubmit={submit} className="onboarding-form">
          {mode === "login" || step === 0 ? (
            <>
              {mode === "signup" && <label>Tên<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} /></label>}
              <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
              <label>Mật khẩu<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
            </>
          ) : null}
          {mode === "signup" && step === 1 && (
            <>
              <div className="sport-choice selected"><Flame size={20} /> Chạy bộ</div>
              <div className="sport-choice selected"><Waves size={20} /> Bơi</div>
              <label>Thành phố<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label>
              <label>Kinh nghiệm
                <select value={form.experienceLevel} onChange={(event) => setForm({ ...form, experienceLevel: event.target.value })}>
                  <option>BEGINNER</option>
                  <option>INTERMEDIATE</option>
                  <option>ADVANCED</option>
                </select>
              </label>
            </>
          )}
          {mode === "signup" && step === 2 && (
            <>
              <label>Mục tiêu chính<input value={form.primaryGoal} onChange={(event) => setForm({ ...form, primaryGoal: event.target.value })} /></label>
              <div className="input-grid">
                <NumberField label="Km chạy/tuần" value={form.weeklyRunGoalKm} onChange={(value) => setForm({ ...form, weeklyRunGoalKm: value })} />
                <NumberField label="Mét bơi/tuần" value={form.weeklySwimGoalMeters} onChange={(value) => setForm({ ...form, weeklySwimGoalMeters: value })} />
              </div>
              <label>Dinh dưỡng<input value={form.nutritionFocus} onChange={(event) => setForm({ ...form, nutritionFocus: event.target.value })} /></label>
            </>
          )}
          <button className="orange-button wide" disabled={loading}>
            {loading ? "Đang xử lý..." : mode === "signup" && step < 2 ? "Tiếp tục" : "Bắt đầu luyện tập"}
          </button>
          <button type="button" className="outline-button centered" disabled={loading} onClick={() => void startDemo()}>
            {loading ? "Đang mở demo..." : "Vào bản demo"}
          </button>
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
    <label>{label}<input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>
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
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "RS";
}

function formatDistance(activity: FitnessActivity) {
  return activity.sportType === "RUN" ? `${(activity.distanceMeters / 1000).toFixed(2)} km` : `${Math.round(activity.distanceMeters)} m`;
}

function recalculateStats(activities: FitnessActivity[], fallback: Stats): Stats {
  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const monthStart = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const week = activities.filter((activity) => new Date(activity.startedAt).getTime() >= weekStart);
  const month = activities.filter((activity) => new Date(activity.startedAt).getTime() >= monthStart);
  if (activities.length === 0) return fallback;
  return {
    weeklyRunKm: week.filter((item) => item.sportType === "RUN").reduce((sum, item) => sum + item.distanceMeters, 0) / 1000,
    weeklySwimMeters: Math.round(week.filter((item) => item.sportType === "SWIM").reduce((sum, item) => sum + item.distanceMeters, 0)),
    weeklyMinutes: week.reduce((sum, item) => sum + item.durationMinutes, 0),
    weeklySessions: week.length,
    monthlyRunKm: month.filter((item) => item.sportType === "RUN").reduce((sum, item) => sum + item.distanceMeters, 0) / 1000,
    monthlySwimMeters: Math.round(month.filter((item) => item.sportType === "SWIM").reduce((sum, item) => sum + item.distanceMeters, 0)),
  };
}

async function api<T>(path: string, token: string, fallback: T, init: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token && token !== "demo" ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers || {}),
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (response.status === 204) return fallback;
    return await response.json();
  } catch {
    return fallback;
  }
}

async function apiStrict<T>(path: string, token: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token && token !== "demo" ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json() as { message?: string };
      if (data?.message) message = data.message;
    } catch {
      // Ignore body parse errors for non-JSON responses.
    }
    throw new Error(message);
  }

  if (response.status === 204) return {} as T;
  return await response.json();
}

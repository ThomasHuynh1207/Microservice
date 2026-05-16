import { useState, useEffect, useCallback, useMemo } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Shield,
  TrendingUp,
  Crown,
  UserCheck,
  RefreshCw,
  Search,
  Activity,
  MessageSquare,
  Salad,
  Utensils,
  Flame,
  MapPin,
  Trophy,
  Dumbbell,
  Trash2,
  Plus,
  X,
  ChevronDown,
  Zap,
  Edit2,
  Eye,
  AlertCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page = "dashboard" | "users" | "activities" | "routes" | "community" | "nutrition/foods" | "nutrition/categories" | "training" | "sports" | "onboarding";
type NutPage = "foods" | "categories";

type AdminSession = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
};

type DashboardStats = { totalUsers: number; activeUsers: number; premiumUsers: number };
type ActivityOverview = {
  totalActivities: number; runActivities: number; swimActivities: number;
  totalRoutes: number;
};

type AdminUser = {
  id: number; fullName: string; email: string; role: string;
  active: boolean; premiumActive: boolean; onboardingCompleted: boolean;
  preferredSports?: string; createdAt: string; premiumSince?: string | null;
};

type ActivityItem = {
  id: number; userId: number; athleteName: string; sportType: "RUN" | "SWIM";
  title: string; durationMinutes: number; distanceMeters: number;
  calories: number | null; startedAt: string; createdAt: string;
};

type RouteItem = {
  id: number; name: string; sportType: "RUN" | "SWIM"; place: string;
  distanceMeters: number; note: string; createdAt: string;
};

type CommunityPostItem = {
  id: number; userId: number; athleteName: string; title?: string; content: string;
  sportType?: "RUN" | "SWIM"; distanceMeters?: number; durationMinutes?: number;
  calories?: number; routeName?: string; createdAt: string;
  likeCount: number; commentCount: number; likedByMe: boolean;
};

type CommunityOverview = {
  totalPosts: number; totalComments: number; totalLikes: number; activeAuthors: number;
};

type FoodCategory = { id: number; name: string; description?: string; icon?: string; };
type NutritionFood = {
  id: number; name: string;
  foodCategory: FoodCategory | null;
  category: string;
  servingSize: string; calories: number; proteinGrams: number; carbsGrams: number; fatGrams: number;
  active: boolean; aliases?: string; note?: string; imageUrl?: string; createdAt?: string; updatedAt?: string;
};

type NutritionOverview = {
  totalFoods: number; activeFoods: number; mealsLogged: number;
  usersWithPlans: number; usersLoggedMeals: number; caloriesToday: number;
};

type NutritionMealEntry = {
  id: number; userId: number; mealType: string; name: string; foodId?: number;
  servings?: number; servingSize?: string; calories: number;
  proteinGrams: number; carbsGrams: number; fatGrams: number; eatenAt: string;
};

type ChallengeItem = {
  id: number; code: string; title: string; sportType: string;
  targetValue: number; unit: string; note: string; createdAt: string;
};

type SportDef = {
  id: number; code: string; label: string; icon: string;
  category: string; backendSport: string; sortOrder: number; active: boolean;
};

type AthleteProfile = {
  id: number; userId: number; displayName: string; city: string | null;
  primaryGoal: string | null; experienceLevel: string | null;
  weeklyRunGoalKm: number; weeklySwimGoalMeters: number;
  completedOnboarding: boolean; createdAt: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  nutritionFocus?: string | null;
};

type TrainingStats = {
  totalProfiles: number; completedOnboarding: number;
  avgWeeklyRunGoalKm: number; avgWeeklySwimGoalMeters: number;
};

// ─── API ──────────────────────────────────────────────────────────────────────

const SESSION_KEY = "runswim_admin_session";

function h(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function handleUnauthorized() {
  localStorage.removeItem(SESSION_KEY);
  window.location.reload();
}

async function checkResponse(res: Response): Promise<Response> {
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error("Phiên đăng nhập hết hạn, đang đăng xuất...");
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res;
}

async function get<T>(token: string, url: string): Promise<T> {
  const res = await fetch(url, { headers: h(token) });
  return (await checkResponse(res)).json();
}

async function del(token: string, url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE", headers: h(token) });
  if (res.status === 401) { handleUnauthorized(); return; }
  if (!res.ok && res.status !== 404) throw new Error(`${res.status} ${res.statusText}`);
}

async function post<T>(token: string, url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: h(token), body: JSON.stringify(body) });
  return (await checkResponse(res)).json();
}

async function put<T>(token: string, url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "PUT", headers: h(token), body: JSON.stringify(body) });
  return (await checkResponse(res)).json();
}

async function patch<T>(token: string, url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "PATCH", headers: h(token), body: JSON.stringify(body) });
  return (await checkResponse(res)).json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function fmtDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}

function fmtDist(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${meters} m`;
}

const COLORS = ["#f97316","#3b82f6","#22c55e","#a855f7","#ef4444","#06b6d4","#eab308","#ec4899"];
const avatarColor = (id: number) => COLORS[id % COLORS.length];

// ─── Shared components ────────────────────────────────────────────────────────

function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="al-header">
      <div className="al-header-inner">
        <div className="al-page-title">{title}</div>
        <div className="al-page-sub">{sub}</div>
      </div>
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return <div className="al-loading" style={{ color: "#ef4444" }}>{msg}</div>;
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (s: AdminSession) => void }) {
  const [email, setEmail] = useState("admin@runswim.local");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Email hoặc mật khẩu không đúng");
      const data = await res.json();
      if (data.role !== "ADMIN") { setError("Tài khoản này không có quyền admin"); return; }
      onLogin({ token: data.token, userId: data.userId, fullName: data.fullName, email: data.email, role: data.role });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally { setLoading(false); }
  }

  return (
    <div className="al-login-wrap">
      <div className="al-login-card">
        <div className="al-login-logo">
          <div className="al-login-icon"><Shield size={40} /></div>
          <div className="al-login-title">RunSwim Admin</div>
          <div className="al-login-sub">Cổng quản trị hệ thống</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="al-form-group">
            <label className="al-form-label">Email quản trị</label>
            <input className="al-form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="al-form-group">
            <label className="al-form-label">Mật khẩu</label>
            <input className="al-form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <div className="al-error">{error}</div>}
          <button className="al-login-btn" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS_TOP: { id: Page; label: string; icon: ReactNode }[] = [
  { id: "dashboard",  label: "Dashboard",             icon: <LayoutDashboard size={16} /> },
  { id: "onboarding", label: "Quản lý Onboarding",   icon: <UserCheck size={16} /> },
  { id: "users",      label: "Quản lý người dùng",   icon: <Users size={16} /> },
  { id: "activities", label: "Hoạt động",             icon: <Activity size={16} /> },
  { id: "routes",     label: "Lộ trình",              icon: <MapPin size={16} /> },
  { id: "sports",     label: "Môn thể thao",          icon: <Zap size={16} /> },
  { id: "training",   label: "Cài đặt tập luyện",    icon: <Dumbbell size={16} /> },
];

const NAV_ITEMS_BOTTOM: { id: Page; label: string; icon: ReactNode }[] = [
  { id: "community",  label: "Cộng đồng",             icon: <MessageSquare size={16} /> },
];

const NUT_SUB_ITEMS: { id: Page; label: string }[] = [
  { id: "nutrition/categories", label: "Danh mục" },
  { id: "nutrition/foods",      label: "Món ăn" },
];

function NavItem({ item, active, onClick }: { item: { id: Page; label: string; icon: ReactNode }; active: boolean; onClick: () => void }) {
  return (
    <button className={`al-nav-item${active ? " active" : ""}`} onClick={onClick}>
      {item.icon}{item.label}
    </button>
  );
}

function Sidebar({ page, setPage, session, onLogout }: {
  page: Page; setPage: (p: Page) => void;
  session: AdminSession; onLogout: () => void;
}) {
  const nutActive = page.startsWith("nutrition/");
  const [nutOpen, setNutOpen] = useState(nutActive);

  return (
    <div className="al-sidebar">
      <div className="al-logo">
        <div className="al-logo-brand">🏃 RunSwim</div>
        <div className="al-logo-sub">Admin Dashboard</div>
      </div>

      <nav className="al-nav">
        {NAV_ITEMS_TOP.map(item => (
          <NavItem key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
        ))}

        {/* Expandable Dinh dưỡng */}
        <button
          className={`al-nav-item al-nav-expandable${nutActive ? " active" : ""}`}
          onClick={() => setNutOpen(o => !o)}
        >
          <Salad size={16} />
          <span style={{ flex: 1, textAlign: "left" }}>Dinh dưỡng</span>
          <ChevronDown size={14} className={`al-nav-chevron${nutOpen ? " open" : ""}`} />
        </button>
        <div className={`al-nav-sub${nutOpen ? " open" : ""}`}>
          {NUT_SUB_ITEMS.map(item => (
            <button
              key={item.id}
              className={`al-nav-sub-item${page === item.id ? " active" : ""}`}
              onClick={() => setPage(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {NAV_ITEMS_BOTTOM.map(item => (
          <NavItem key={item.id} item={item} active={page === item.id} onClick={() => setPage(item.id)} />
        ))}
      </nav>

      <div className="al-sidebar-footer">
        <div className="al-user-info">
          <div className="al-user-avatar" style={{ background: avatarColor(session.userId) }}>
            {initials(session.fullName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="al-user-name">{session.fullName}</div>
            <div className="al-user-role">ADMIN</div>
          </div>
        </div>
        <button className="al-logout-btn" onClick={onLogout}>
          <LogOut size={15} /> Đăng xuất
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ session }: { session: AdminSession }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      get<DashboardStats>(session.token, "/api/auth/admin/stats"),
      get<AdminUser[]>(session.token, "/api/auth/admin/users"),
    ])
      .then(([s, u]) => { setStats(s); setRecent(u.slice(0, 6)); })
      .catch(err => setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu"))
      .finally(() => setLoading(false));
  }, [session.token]);

  if (loading) return <div className="al-loading">Đang tải...</div>;
  if (error) return <ErrMsg msg={error} />;
  if (!stats) return null;

  const statCards = [
    { label: "Tổng người dùng", value: stats.totalUsers, icon: <Users size={19} color="#3b82f6" />, bg: "rgba(59,130,246,0.1)" },
    { label: "Đang hoạt động", value: stats.activeUsers, icon: <UserCheck size={19} color="#22c55e" />, bg: "rgba(34,197,94,0.1)" },
    { label: "Premium", value: stats.premiumUsers, icon: <Crown size={19} color="#eab308" />, bg: "rgba(234,179,8,0.1)" },
    { label: "Miễn phí", value: stats.totalUsers - stats.premiumUsers, icon: <TrendingUp size={19} color="#f97316" />, bg: "rgba(249,115,22,0.1)" },
  ];

  return (
    <>
      <PageHeader title="Tổng quan" sub="Thống kê hệ thống RunSwim Club" />
      <div className="al-content">
        <div className="al-stats-row">
          {statCards.map(c => (
            <div key={c.label} className="al-stat-card">
              <div className="al-stat-icon" style={{ background: c.bg }}>{c.icon}</div>
              <div className="al-stat-value">{c.value.toLocaleString("vi-VN")}</div>
              <div className="al-stat-label">{c.label}</div>
            </div>
          ))}
        </div>
        <div className="al-dash-row" style={{ marginBottom: 16 }}>
          <div className="al-card">
            <div className="al-card-title">Tỷ lệ Premium</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[{ name: "Premium", value: stats.premiumUsers }, { name: "Miễn phí", value: Math.max(0, stats.totalUsers - stats.premiumUsers) }]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  <Cell fill="#eab308" /><Cell fill="#e2e8f0" />
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="al-card">
            <div className="al-card-title">Trạng thái hoạt động</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={[{ name: "Hoạt động", value: stats.activeUsers }, { name: "Không hoạt động", value: Math.max(0, stats.totalUsers - stats.activeUsers) }]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  <Cell fill="#22c55e" /><Cell fill="#ef4444" />
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="al-card">
          <div className="al-card-title">Người dùng mới nhất</div>
          <div className="al-recent-list">
            {recent.map(u => (
              <div key={u.id} className="al-recent-item">
                <div className="al-recent-left">
                  <div className="al-avatar" style={{ background: avatarColor(u.id) }}>{initials(u.fullName)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div className="al-recent-name">{u.fullName}</div>
                    <div className="al-recent-email">{u.email}</div>
                  </div>
                </div>
                <div className="al-recent-right">
                  <span className={`al-badge ${u.role === "ADMIN" ? "badge-admin" : "badge-user"}`}>{u.role === "ADMIN" ? "Admin" : "User"}</span>
                  <span className={`al-badge ${u.premiumActive ? "badge-premium" : "badge-free"}`}>{u.premiumActive ? "Premium" : "Free"}</span>
                  <span className="al-date">{fmtDate(u.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────

function UsersManagementPage({ session }: { session: AdminSession }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [profiles, setProfiles] = useState<AthleteProfile[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "PREMIUM" | "FREE" | "PENDING" | "ADMIN">("ALL");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [u, p, a] = await Promise.all([
        get<AdminUser[]>(session.token, "/api/auth/admin/users"),
        get<AthleteProfile[]>(session.token, "/api/athletes/admin/all"),
        get<ActivityItem[]>(session.token, "/api/activities/admin/all"),
      ]);
      setUsers(u);
      setProfiles(p);
      setActivities(a);
      setSelectedUserId((current) => current ?? u[0]?.id ?? null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  async function patchUser(userId: number, update: { role?: string; active?: boolean; premiumActive?: boolean }) {
    setUpdating(userId);
    try {
      const updated = await patch<AdminUser>(session.token, `/api/auth/admin/users/${userId}`, update);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setUpdating(null);
    }
  }

  const profileByUser = useMemo(() => new Map(profiles.map(p => [p.userId, p])), [profiles]);
  const activitiesByUser = useMemo(() => {
    const map = new Map<number, ActivityItem[]>();
    for (const activity of activities) {
      map.set(activity.userId, [...(map.get(activity.userId) ?? []), activity]);
    }
    return map;
  }, [activities]);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchFilter =
      filter === "ALL" ||
      (filter === "ACTIVE" && u.active) ||
      (filter === "INACTIVE" && !u.active) ||
      (filter === "PREMIUM" && u.premiumActive) ||
      (filter === "FREE" && !u.premiumActive) ||
      (filter === "PENDING" && !u.onboardingCompleted) ||
      (filter === "ADMIN" && u.role === "ADMIN");
    return matchSearch && matchFilter;
  });

  const selectedUser = users.find(u => u.id === selectedUserId) ?? filtered[0] ?? null;
  const selectedProfile = selectedUser ? profileByUser.get(selectedUser.id) : undefined;
  const selectedActivities = selectedUser ? (activitiesByUser.get(selectedUser.id) ?? []) : [];
  const selectedRunKm = selectedActivities.filter(a => a.sportType === "RUN").reduce((sum, a) => sum + a.distanceMeters, 0) / 1000;
  const selectedSwimM = selectedActivities.filter(a => a.sportType === "SWIM").reduce((sum, a) => sum + a.distanceMeters, 0);

  return (
    <>
      <PageHeader title="Người dùng" sub="Quản lý tài khoản, gói, onboarding và hồ sơ tập luyện của app người dùng" />
      <div className="al-content">
        <div className="al-stats-row">
          {[
            { label: "Tổng người dùng", value: users.length, color: "#3b82f6" },
            { label: "Đang hoạt động", value: users.filter(u => u.active).length, color: "#22c55e" },
            { label: "Premium", value: users.filter(u => u.premiumActive).length, color: "#eab308" },
            { label: "Chưa onboarding", value: users.filter(u => !u.onboardingCompleted).length, color: "#ef4444" },
          ].map(card => (
            <div key={card.label} className="al-stat-card">
              <div className="al-stat-value" style={{ color: card.color }}>{card.value}</div>
              <div className="al-stat-label">{card.label}</div>
            </div>
          ))}
        </div>

        <div className="al-controls">
          <div className="al-search-wrap">
            <Search size={14} className="al-search-icon" />
            <input className="al-search" placeholder="Tìm tên hoặc email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="al-tabs">
            {[
              ["ALL", "Tất cả"],
              ["ACTIVE", "Hoạt động"],
              ["INACTIVE", "Đã khoá"],
              ["PREMIUM", "Premium"],
              ["FREE", "Free"],
              ["PENDING", "Chưa onboarding"],
              ["ADMIN", "Admin"],
            ].map(([id, label]) => (
              <button key={id} className={`al-tab${filter === id ? " active" : ""}`} onClick={() => setFilter(id as typeof filter)}>
                {label}
              </button>
            ))}
          </div>
          <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
        </div>

        <div className="al-user-management-grid">
          <div className="al-table-wrap">
            {loading ? <div className="al-loading">Đang tải...</div>
              : error ? <ErrMsg msg={error} />
              : filtered.length === 0 ? <div className="al-empty">Không tìm thấy người dùng</div>
              : (
                <table className="al-table">
                  <thead><tr>
                    <th>Người dùng</th><th>Gói</th><th>Onboarding</th>
                    <th>Hoạt động</th><th>Trạng thái</th><th>Thao tác</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(u => {
                      const busy = updating === u.id;
                      const isSelf = u.id === session.userId;
                      const userActivityCount = activitiesByUser.get(u.id)?.length ?? 0;
                      return (
                        <tr key={u.id} className={selectedUserId === u.id ? "al-row-selected" : ""}>
                          <td onClick={() => setSelectedUserId(u.id)}>
                            <div className="al-user-cell">
                              <div className="al-avatar" style={{ background: avatarColor(u.id) }}>{initials(u.fullName)}</div>
                              <div>
                                <div className="al-uname">{u.fullName}{isSelf && <span className="al-self-tag">(bạn)</span>}</div>
                                <div className="al-uemail">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className={`al-badge ${u.premiumActive ? "badge-premium" : "badge-free"}`}>{u.premiumActive ? "Premium" : "Free"}</span></td>
                          <td><span className={`al-badge ${u.onboardingCompleted ? "badge-active" : "badge-inactive"}`}>{u.onboardingCompleted ? "Hoàn thành" : "Chưa xong"}</span></td>
                          <td><span className="al-date">{userActivityCount} buổi</span></td>
                          <td><span className={`al-badge ${u.active ? "badge-active" : "badge-inactive"}`}>{u.active ? "Hoạt động" : "Đã khoá"}</span></td>
                          <td>
                            <div className="al-actions">
                              <button className={`al-action-btn ${u.premiumActive ? "yellow" : "green"}`} disabled={busy}
                                onClick={() => patchUser(u.id, { premiumActive: !u.premiumActive })}>
                                {u.premiumActive ? "Huỷ premium" : "Cấp premium"}
                              </button>
                              <button className={`al-action-btn ${u.active ? "red" : "green"}`} disabled={busy || isSelf}
                                onClick={() => patchUser(u.id, { active: !u.active })}>
                                {u.active ? "Khoá" : "Mở khoá"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
          </div>

          <aside className="al-user-detail">
            {selectedUser ? (
              <>
                <div className="al-user-detail-head">
                  <div className="al-avatar large" style={{ background: avatarColor(selectedUser.id) }}>{initials(selectedUser.fullName)}</div>
                  <div>
                    <h3>{selectedUser.fullName}</h3>
                    <span>{selectedUser.email}</span>
                  </div>
                </div>
                <div className="al-detail-badges">
                  <span className={`al-badge ${selectedUser.role === "ADMIN" ? "badge-admin" : "badge-user"}`}>{selectedUser.role === "ADMIN" ? "Admin" : "User"}</span>
                  <span className={`al-badge ${selectedUser.premiumActive ? "badge-premium" : "badge-free"}`}>{selectedUser.premiumActive ? "Premium" : "Free"}</span>
                  <span className={`al-badge ${selectedUser.active ? "badge-active" : "badge-inactive"}`}>{selectedUser.active ? "Hoạt động" : "Đã khoá"}</span>
                </div>
                <div className="al-detail-grid">
                  <div><span>Ngày tham gia</span><strong>{fmtDate(selectedUser.createdAt)}</strong></div>
                  <div><span>Premium từ</span><strong>{selectedUser.premiumSince ? fmtDate(selectedUser.premiumSince) : "—"}</strong></div>
                  <div><span>Thành phố</span><strong>{selectedProfile?.city ?? "—"}</strong></div>
                  <div><span>Trình độ</span><strong>{selectedProfile?.experienceLevel ?? "—"}</strong></div>
                </div>
                <div className="al-detail-grid">
                  <div><span>Tổng buổi</span><strong>{selectedActivities.length}</strong></div>
                  <div><span>Chạy</span><strong>{selectedRunKm.toFixed(1)} km</strong></div>
                  <div><span>Bơi</span><strong>{Math.round(selectedSwimM)} m</strong></div>
                  <div><span>Mục tiêu chạy</span><strong>{selectedProfile?.weeklyRunGoalKm ?? 0} km/tuần</strong></div>
                </div>
                <div className="al-detail-section">
                  <h4>Mục tiêu người dùng</h4>
                  <p>{selectedProfile?.primaryGoal ?? "Chưa có hồ sơ tập luyện."}</p>
                </div>
                <div className="al-detail-section">
                  <h4>Hoạt động gần nhất</h4>
                  {selectedActivities.slice(0, 4).map(activity => (
                    <div key={activity.id} className="al-mini-activity">
                      <span className={`al-badge ${activity.sportType === "RUN" ? "badge-run" : "badge-swim"}`}>{activity.sportType === "RUN" ? "Chạy" : "Bơi"}</span>
                      <strong>{activity.title}</strong>
                      <small>{fmtDist(activity.distanceMeters)} · {activity.durationMinutes} phút</small>
                    </div>
                  ))}
                  {selectedActivities.length === 0 && <p>Chưa có hoạt động.</p>}
                </div>
                <div className="al-detail-actions">
                  <button className={`al-action-btn ${selectedUser.role === "ADMIN" ? "yellow" : "blue"}`} disabled={selectedUser.id === session.userId || updating === selectedUser.id}
                    onClick={() => patchUser(selectedUser.id, { role: selectedUser.role === "ADMIN" ? "USER" : "ADMIN" })}>
                    {selectedUser.role === "ADMIN" ? "Hạ admin" : "Cấp admin"}
                  </button>
                </div>
              </>
            ) : (
              <div className="al-empty">Chọn người dùng để xem chi tiết</div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}

function UsersPage({ session }: { session: AdminSession }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setUsers(await get<AdminUser[]>(session.token, "/api/auth/admin/users")); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  async function patchUser(userId: number, update: { role?: string; active?: boolean; premiumActive?: boolean }) {
    setUpdating(userId);
    try {
      const updated = await patch<AdminUser>(session.token, `/api/auth/admin/users/${userId}`, update);
      setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi cập nhật"); }
    finally { setUpdating(null); }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return (u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      && (roleFilter === "ALL" || (roleFilter === "ADMIN" ? u.role === "ADMIN" : u.role !== "ADMIN"));
  });

  return (
    <>
      <PageHeader title="Người dùng" sub={`${users.length} người dùng trong hệ thống`} />
      <div className="al-content">
        <div className="al-controls">
          <div className="al-search-wrap">
            <Search size={14} className="al-search-icon" />
            <input className="al-search" placeholder="Tìm tên hoặc email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="al-tabs">
            {(["ALL", "USER", "ADMIN"] as const).map(r => (
              <button key={r} className={`al-tab${roleFilter === r ? " active" : ""}`} onClick={() => setRoleFilter(r)}>
                {r === "ALL" ? "Tất cả" : r === "USER" ? "Người dùng" : "Admin"}
              </button>
            ))}
          </div>
          <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
        </div>
        <div className="al-table-wrap">
          {loading ? <div className="al-loading">Đang tải...</div>
            : error ? <ErrMsg msg={error} />
            : filtered.length === 0 ? <div className="al-empty">Không tìm thấy người dùng</div>
            : (
              <table className="al-table">
                <thead><tr>
                  <th>Người dùng</th><th>Vai trò</th><th>Gói</th>
                  <th>Trạng thái</th><th>Ngày tham gia</th><th>Thao tác</th>
                </tr></thead>
                <tbody>
                  {filtered.map(u => {
                    const busy = updating === u.id;
                    const isSelf = u.id === session.userId;
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="al-user-cell">
                            <div className="al-avatar" style={{ background: avatarColor(u.id) }}>{initials(u.fullName)}</div>
                            <div>
                              <div className="al-uname">{u.fullName}{isSelf && <span className="al-self-tag">(bạn)</span>}</div>
                              <div className="al-uemail">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className={`al-badge ${u.role === "ADMIN" ? "badge-admin" : "badge-user"}`}>{u.role === "ADMIN" ? "Admin" : "User"}</span></td>
                        <td><span className={`al-badge ${u.premiumActive ? "badge-premium" : "badge-free"}`}>{u.premiumActive ? "Premium" : "Free"}</span></td>
                        <td><span className={`al-badge ${u.active ? "badge-active" : "badge-inactive"}`}>{u.active ? "Hoạt động" : "Đã khoá"}</span></td>
                        <td><span className="al-date">{fmtDate(u.createdAt)}</span></td>
                        <td>
                          <div className="al-actions">
                            <button className={`al-action-btn ${u.premiumActive ? "yellow" : "green"}`} disabled={busy}
                              onClick={() => patchUser(u.id, { premiumActive: !u.premiumActive })}>
                              {u.premiumActive ? "Huỷ premium" : "Cấp premium"}
                            </button>
                            <button className={`al-action-btn ${u.active ? "red" : "green"}`} disabled={busy || isSelf}
                              onClick={() => patchUser(u.id, { active: !u.active })}>
                              {u.active ? "Khoá" : "Mở khoá"}
                            </button>
                            <button className={`al-action-btn ${u.role === "ADMIN" ? "yellow" : "blue"}`} disabled={busy || isSelf}
                              onClick={() => patchUser(u.id, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })}>
                              {u.role === "ADMIN" ? "Hạ admin" : "Cấp admin"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </>
  );
}

// ─── Activities Page ──────────────────────────────────────────────────────────

function ActivitiesPage({ session }: { session: AdminSession }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [overview, setOverview] = useState<ActivityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [sportFilter, setSportFilter] = useState<"ALL" | "RUN" | "SWIM">("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ov, acts] = await Promise.all([
        get<ActivityOverview>(session.token, "/api/activities/admin/overview"),
        get<ActivityItem[]>(session.token, "/api/activities/admin/all"),
      ]);
      setOverview(ov); setActivities(acts);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  async function removeActivity(id: number) {
    if (!confirm("Xoá hoạt động này?")) return;
    setDeleting(id);
    try {
      await del(session.token, `/api/activities/admin/${id}`);
      setActivities(prev => prev.filter(a => a.id !== id));
      if (overview) setOverview(prev => prev ? { ...prev, totalActivities: prev.totalActivities - 1 } : prev);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xoá"); }
    finally { setDeleting(null); }
  }

  const filtered = activities.filter(a => {
    const q = search.toLowerCase();
    return (sportFilter === "ALL" || a.sportType === sportFilter)
      && (a.title.toLowerCase().includes(q) || a.athleteName.toLowerCase().includes(q));
  });

  return (
    <>
      <PageHeader title="Hoạt động" sub={`${activities.length} hoạt động trong hệ thống`} />
      <div className="al-content">
        {overview && (
          <div className="al-stats-row" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 20 }}>
            {[
              { label: "Tổng hoạt động", value: overview.totalActivities, color: "#f97316" },
              { label: "Chạy bộ", value: overview.runActivities, color: "#3b82f6" },
              { label: "Bơi lội", value: overview.swimActivities, color: "#06b6d4" },
              { label: "Lộ trình", value: overview.totalRoutes, color: "#22c55e" },
            ].map(c => (
              <div key={c.label} className="al-stat-card" style={{ padding: "14px 16px" }}>
                <div className="al-stat-value" style={{ fontSize: "1.4rem", color: c.color }}>{c.value}</div>
                <div className="al-stat-label">{c.label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="al-controls">
          <div className="al-search-wrap">
            <Search size={14} className="al-search-icon" />
            <input className="al-search" placeholder="Tìm tên hoặc vận động viên..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="al-tabs">
            {(["ALL", "RUN", "SWIM"] as const).map(s => (
              <button key={s} className={`al-tab${sportFilter === s ? " active" : ""}`} onClick={() => setSportFilter(s)}>
                {s === "ALL" ? "Tất cả" : s === "RUN" ? "🏃 Chạy bộ" : "🏊 Bơi lội"}
              </button>
            ))}
          </div>
          <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
        </div>
        <div className="al-table-wrap">
          {loading ? <div className="al-loading">Đang tải...</div>
            : error ? <ErrMsg msg={error} />
            : filtered.length === 0 ? <div className="al-empty">Không có hoạt động</div>
            : (
              <table className="al-table">
                <thead><tr>
                  <th>Vận động viên</th><th>Môn</th><th>Tiêu đề</th>
                  <th>Khoảng cách</th><th>Thời gian</th><th>Calories</th><th>Ngày</th><th></th>
                </tr></thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="al-avatar" style={{ background: avatarColor(a.userId), width: 28, height: 28, fontSize: "0.68rem" }}>
                            {initials(a.athleteName)}
                          </div>
                          <div>
                            <div className="al-uname" style={{ fontSize: "0.82rem" }}>{a.athleteName}</div>
                            <div className="al-uemail">ID {a.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`al-badge ${a.sportType === "RUN" ? "badge-run" : "badge-swim"}`}>
                          {a.sportType === "RUN" ? "🏃 Chạy" : "🏊 Bơi"}
                        </span>
                      </td>
                      <td><span style={{ fontSize: "0.85rem", fontWeight: 500 }}>{a.title}</span></td>
                      <td><span className="al-date">{fmtDist(a.distanceMeters)}</span></td>
                      <td><span className="al-date">{a.durationMinutes} phút</span></td>
                      <td><span className="al-date">{a.calories ?? "—"} kcal</span></td>
                      <td><span className="al-date">{fmtDate(a.startedAt)}</span></td>
                      <td>
                        <button className="al-action-btn red" disabled={deleting === a.id}
                          onClick={() => removeActivity(a.id)}>
                          <Trash2 size={12} style={{ display: "inline", marginRight: 4 }} />
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </>
  );
}

// ─── Routes Page ──────────────────────────────────────────────────────────────

function RoutesPage({ session }: { session: AdminSession }) {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", sportType: "RUN", place: "", distanceMeters: 5000, note: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setRoutes(await get<RouteItem[]>(session.token, "/api/activities/routes")); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Lỗi tải"); }
    finally { setLoading(false); }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  async function addRoute(e: FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const created = await post<RouteItem>(session.token, "/api/activities/admin/routes", { ...form, distanceMeters: Number(form.distanceMeters) });
      setRoutes(prev => [created, ...prev]);
      setShowForm(false);
      setForm({ name: "", sportType: "RUN", place: "", distanceMeters: 5000, note: "" });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi tạo lộ trình"); }
    finally { setSaving(false); }
  }

  async function removeRoute(id: number) {
    if (!confirm("Xoá lộ trình này?")) return;
    setDeleting(id);
    try {
      await del(session.token, `/api/activities/admin/routes/${id}`);
      setRoutes(prev => prev.filter(r => r.id !== id));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xoá"); }
    finally { setDeleting(null); }
  }

  return (
    <>
      <PageHeader title="Lộ trình" sub={`${routes.length} lộ trình trong hệ thống`} />
      <div className="al-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
          <button className="al-add-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Đóng" : "Thêm lộ trình"}
          </button>
        </div>

        {showForm && (
          <div className="al-form-card">
            <div className="al-form-card-title">Thêm lộ trình mới</div>
            <form onSubmit={addRoute} className="al-inline-form">
              <div className="al-form-row">
                <div className="al-form-group">
                  <label className="al-form-label">Tên lộ trình *</label>
                  <input className="al-form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ví dụ: Hồ Tây loop" />
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Địa điểm *</label>
                  <input className="al-form-input" required value={form.place} onChange={e => setForm(f => ({ ...f, place: e.target.value }))} placeholder="Hà Nội, TP.HCM..." />
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Môn thể thao</label>
                  <div className="al-select-wrap">
                    <select className="al-form-input" value={form.sportType} onChange={e => setForm(f => ({ ...f, sportType: e.target.value }))}>
                      <option value="RUN">🏃 Chạy bộ</option>
                      <option value="SWIM">🏊 Bơi lội</option>
                    </select>
                    <ChevronDown size={14} className="al-select-icon" />
                  </div>
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Khoảng cách (m)</label>
                  <input className="al-form-input" type="number" min={100} value={form.distanceMeters} onChange={e => setForm(f => ({ ...f, distanceMeters: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="al-form-group">
                <label className="al-form-label">Ghi chú</label>
                <input className="al-form-input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Mô tả ngắn về lộ trình..." />
              </div>
              <button className="al-add-btn" type="submit" disabled={saving} style={{ marginTop: 4 }}>
                {saving ? "Đang lưu..." : "Lưu lộ trình"}
              </button>
            </form>
          </div>
        )}

        {loading ? <div className="al-loading">Đang tải...</div>
          : error ? <ErrMsg msg={error} />
          : routes.length === 0 ? <div className="al-empty">Chưa có lộ trình nào</div>
          : (
            <div className="al-card-grid">
              {routes.map(r => (
                <div key={r.id} className="al-item-card">
                  <div className="al-item-card-head">
                    <span className={`al-badge ${r.sportType === "RUN" ? "badge-run" : "badge-swim"}`}>
                      {r.sportType === "RUN" ? "🏃 Chạy" : "🏊 Bơi"}
                    </span>
                    <button className="al-icon-del" disabled={deleting === r.id} onClick={() => removeRoute(r.id)} title="Xoá">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="al-item-card-title">{r.name}</div>
                  <div className="al-item-card-meta">
                    <MapPin size={12} /> {r.place} · {fmtDist(r.distanceMeters)}
                  </div>
                  {r.note && <div className="al-item-card-note">{r.note}</div>}
                  <div className="al-date" style={{ marginTop: 8 }}>{fmtDate(r.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}

// ─── Challenges Page ──────────────────────────────────────────────────────────

function CommunityAdminPage({ session }: { session: AdminSession }) {
  const [overview, setOverview] = useState<CommunityOverview | null>(null);
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState<"ALL" | "RUN" | "SWIM">("ALL");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ov, p] = await Promise.all([
        get<CommunityOverview>(session.token, "/api/community/admin/overview"),
        get<CommunityPostItem[]>(session.token, "/api/community/admin/posts"),
      ]);
      setOverview(ov);
      setPosts(p);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi tải cộng đồng");
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  async function removePost(id: number) {
    if (!confirm("Xoá bài viết cộng đồng này?")) return;
    setDeleting(id);
    try {
      await del(session.token, `/api/community/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
      setOverview(prev => prev ? { ...prev, totalPosts: Math.max(0, prev.totalPosts - 1) } : prev);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi xoá bài viết");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = posts.filter(post => {
    const q = search.toLowerCase();
    const matchesSearch = `${post.athleteName} ${post.title ?? ""} ${post.content} ${post.routeName ?? ""}`.toLowerCase().includes(q);
    const matchesSport = sportFilter === "ALL" || post.sportType === sportFilter;
    return matchesSearch && matchesSport;
  });

  return (
    <>
      <PageHeader title="Cộng đồng" sub="Quản lý bài đăng, tương tác và nội dung người dùng chia sẻ" />
      <div className="al-content">
        {overview && (
          <div className="al-stats-row">
            {[
              { label: "Bài viết", value: overview.totalPosts, color: "#3b82f6" },
              { label: "Bình luận", value: overview.totalComments, color: "#22c55e" },
              { label: "Lượt thích", value: overview.totalLikes, color: "#eab308" },
              { label: "Người đăng", value: overview.activeAuthors, color: "#f97316" },
            ].map(card => (
              <div key={card.label} className="al-stat-card">
                <div className="al-stat-value" style={{ color: card.color }}>{card.value}</div>
                <div className="al-stat-label">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="al-controls">
          <div className="al-search-wrap">
            <Search size={14} className="al-search-icon" />
            <input className="al-search" placeholder="Tìm tác giả, nội dung, lộ trình..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="al-tabs">
            {(["ALL", "RUN", "SWIM"] as const).map(s => (
              <button key={s} className={`al-tab${sportFilter === s ? " active" : ""}`} onClick={() => setSportFilter(s)}>
                {s === "ALL" ? "Tất cả" : s === "RUN" ? "Chạy" : "Bơi"}
              </button>
            ))}
          </div>
          <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
        </div>

        <div className="al-community-grid">
          {loading ? <div className="al-loading">Đang tải...</div>
            : error ? <ErrMsg msg={error} />
            : filtered.length === 0 ? <div className="al-empty">Không có bài viết phù hợp</div>
            : filtered.map(post => (
              <article key={post.id} className="al-community-card">
                <div className="al-community-card-head">
                  <div className="al-user-cell">
                    <div className="al-avatar" style={{ background: avatarColor(post.userId) }}>{initials(post.athleteName)}</div>
                    <div>
                      <div className="al-uname">{post.athleteName}</div>
                      <div className="al-uemail">User ID {post.userId} · {fmtDate(post.createdAt)}</div>
                    </div>
                  </div>
                  <button className="al-icon-del" disabled={deleting === post.id} onClick={() => removePost(post.id)} title="Xoá">
                    <Trash2 size={13} />
                  </button>
                </div>
                {post.title && (
                  <div className="al-community-activity">
                    <span className={`al-badge ${post.sportType === "RUN" ? "badge-run" : "badge-swim"}`}>{post.sportType === "RUN" ? "Chạy" : "Bơi"}</span>
                    <strong>{post.title}</strong>
                    <span>{post.distanceMeters ? fmtDist(post.distanceMeters) : "—"} · {post.durationMinutes ?? "—"} phút</span>
                  </div>
                )}
                <p>{post.content}</p>
                <div className="al-community-metrics">
                  <span>{post.likeCount} thích</span>
                  <span>{post.commentCount} bình luận</span>
                  {post.routeName && <span>{post.routeName}</span>}
                </div>
              </article>
            ))}
        </div>
      </div>
    </>
  );
}

function ChallengesPage({ session }: { session: AdminSession }) {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ code: "", title: "", sportType: "RUN", targetValue: 30000, unit: "meters", note: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setChallenges(await get<ChallengeItem[]>(session.token, "/api/activities/challenges")); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Lỗi tải"); }
    finally { setLoading(false); }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  async function addChallenge(e: FormEvent) {
    e.preventDefault(); setSaving(true);
    try {
      const created = await post<ChallengeItem>(session.token, "/api/activities/challenges", { ...form, targetValue: Number(form.targetValue) });
      setChallenges(prev => [created, ...prev]);
      setShowForm(false);
      setForm({ code: "", title: "", sportType: "RUN", targetValue: 30000, unit: "meters", note: "" });
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi tạo thử thách"); }
    finally { setSaving(false); }
  }

  async function removeChallenge(id: number) {
    if (!confirm("Xoá thử thách này?")) return;
    setDeleting(id);
    try {
      await del(session.token, `/api/activities/admin/challenges/${id}`);
      setChallenges(prev => prev.filter(c => c.id !== id));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xoá"); }
    finally { setDeleting(null); }
  }

  const sportLabel = (s: string) => ({ RUN: "🏃 Chạy", SWIM: "🏊 Bơi", MIXED: "🏃🏊 Kết hợp" }[s.toUpperCase()] ?? s);

  return (
    <>
      <PageHeader title="Thử thách" sub={`${challenges.length} thử thách đang có`} />
      <div className="al-content">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
          <button className="al-add-btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Đóng" : "Tạo thử thách"}
          </button>
        </div>

        {showForm && (
          <div className="al-form-card">
            <div className="al-form-card-title">Tạo thử thách mới</div>
            <form onSubmit={addChallenge} className="al-inline-form">
              <div className="al-form-row">
                <div className="al-form-group">
                  <label className="al-form-label">Mã code * <small style={{textTransform:"none",fontWeight:400}}>(unique)</small></label>
                  <input className="al-form-input" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "_") }))} placeholder="VD: RUN_5K_WEEK" />
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Tên thử thách *</label>
                  <input className="al-form-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Chạy 5km mỗi tuần" />
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Môn</label>
                  <div className="al-select-wrap">
                    <select className="al-form-input" value={form.sportType} onChange={e => setForm(f => ({ ...f, sportType: e.target.value }))}>
                      <option value="RUN">🏃 Chạy bộ</option>
                      <option value="SWIM">🏊 Bơi lội</option>
                      <option value="MIXED">🏃🏊 Kết hợp</option>
                    </select>
                    <ChevronDown size={14} className="al-select-icon" />
                  </div>
                </div>
              </div>
              <div className="al-form-row">
                <div className="al-form-group">
                  <label className="al-form-label">Mục tiêu</label>
                  <input className="al-form-input" type="number" min={1} value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: Number(e.target.value) }))} />
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Đơn vị</label>
                  <div className="al-select-wrap">
                    <select className="al-form-input" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                      <option value="meters">meters (m)</option>
                      <option value="activities">activities (buổi)</option>
                    </select>
                    <ChevronDown size={14} className="al-select-icon" />
                  </div>
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Ghi chú</label>
                  <input className="al-form-input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Mô tả thử thách..." />
                </div>
              </div>
              <button className="al-add-btn" type="submit" disabled={saving} style={{ marginTop: 4 }}>
                {saving ? "Đang lưu..." : "Tạo thử thách"}
              </button>
            </form>
          </div>
        )}

        {loading ? <div className="al-loading">Đang tải...</div>
          : error ? <ErrMsg msg={error} />
          : challenges.length === 0 ? <div className="al-empty">Chưa có thử thách nào</div>
          : (
            <div className="al-card-grid">
              {challenges.map(c => (
                <div key={c.id} className="al-item-card">
                  <div className="al-item-card-head">
                    <span className="al-badge badge-admin" style={{ fontFamily: "monospace", letterSpacing: 0 }}>{c.code}</span>
                    <button className="al-icon-del" disabled={deleting === c.id} onClick={() => removeChallenge(c.id)} title="Xoá">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="al-item-card-title">{c.title}</div>
                  <div className="al-item-card-meta">
                    {sportLabel(c.sportType)} · Mục tiêu: {c.targetValue.toLocaleString()} {c.unit}
                  </div>
                  {c.note && <div className="al-item-card-note">{c.note}</div>}
                  <div className="al-date" style={{ marginTop: 8 }}>{fmtDate(c.createdAt)}</div>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}

// ─── Training / Athlete Profiles Page ────────────────────────────────────────

function TrainingPage({ session }: { session: AdminSession }) {
  const [profiles, setProfiles] = useState<AthleteProfile[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [s, p] = await Promise.all([
        get<TrainingStats>(session.token, "/api/athletes/admin/stats"),
        get<AthleteProfile[]>(session.token, "/api/athletes/admin/all"),
      ]);
      setStats(s); setProfiles(p);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Lỗi tải"); }
    finally { setLoading(false); }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  const levels = ["ALL", ...Array.from(new Set(profiles.map(p => p.experienceLevel ?? "").filter(Boolean)))];

  const filtered = profiles.filter(p => {
    const q = search.toLowerCase();
    return (levelFilter === "ALL" || p.experienceLevel === levelFilter)
      && (p.displayName.toLowerCase().includes(q) || (p.city ?? "").toLowerCase().includes(q));
  });

  const goalLabel = (g: string | null) => ({
    WEIGHT_LOSS: "Giảm cân", ENDURANCE: "Sức bền", SPEED: "Tốc độ",
    HEALTH: "Sức khỏe", COMPETITION: "Thi đấu",
  }[g ?? ""] ?? g ?? "—");

  const levelLabel = (l: string | null) => ({
    BEGINNER: "Mới bắt đầu", INTERMEDIATE: "Trung bình", ADVANCED: "Nâng cao",
  }[l ?? ""] ?? l ?? "—");

  return (
    <>
      <PageHeader title="Cài đặt tập luyện" sub="Hồ sơ & mục tiêu tập luyện của vận động viên" />
      <div className="al-content">
        {stats && (
          <div className="al-stats-row" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 20 }}>
            {[
              { label: "Tổng hồ sơ", value: stats.totalProfiles, color: "#3b82f6" },
              { label: "Hoàn thành onboarding", value: stats.completedOnboarding, color: "#22c55e" },
              { label: "Mục tiêu chạy TB / tuần", value: `${stats.avgWeeklyRunGoalKm} km`, color: "#f97316", isText: true },
              { label: "Mục tiêu bơi TB / tuần", value: `${stats.avgWeeklySwimGoalMeters} m`, color: "#06b6d4", isText: true },
            ].map(c => (
              <div key={c.label} className="al-stat-card">
                <div className="al-stat-value" style={{ fontSize: c.isText ? "1.3rem" : "1.8rem", color: c.color }}>
                  {c.value}
                </div>
                <div className="al-stat-label">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="al-controls">
          <div className="al-search-wrap">
            <Search size={14} className="al-search-icon" />
            <input className="al-search" placeholder="Tìm tên hoặc thành phố..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="al-tabs">
            {levels.slice(0, 4).map(l => (
              <button key={l} className={`al-tab${levelFilter === l ? " active" : ""}`} onClick={() => setLevelFilter(l)}>
                {l === "ALL" ? "Tất cả" : levelLabel(l)}
              </button>
            ))}
          </div>
          <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
        </div>

        <div className="al-table-wrap">
          {loading ? <div className="al-loading">Đang tải...</div>
            : error ? <ErrMsg msg={error} />
            : filtered.length === 0 ? <div className="al-empty">Không tìm thấy hồ sơ</div>
            : (
              <table className="al-table">
                <thead><tr>
                  <th>Vận động viên</th><th>Thành phố</th><th>Trình độ</th>
                  <th>Mục tiêu chính</th><th>Mục tiêu chạy/tuần</th><th>Mục tiêu bơi/tuần</th><th>Onboarding</th>
                </tr></thead>
                <tbody>
                  {filtered.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className="al-avatar" style={{ background: avatarColor(p.userId) }}>{initials(p.displayName)}</div>
                          <div>
                            <div className="al-uname">{p.displayName}</div>
                            <div className="al-uemail">User ID: {p.userId}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="al-date">{p.city ?? "—"}</span></td>
                      <td>
                        {p.experienceLevel ? (
                          <span className="al-badge badge-user">{levelLabel(p.experienceLevel)}</span>
                        ) : <span className="al-date">—</span>}
                      </td>
                      <td><span className="al-date">{goalLabel(p.primaryGoal)}</span></td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#f97316" }}>
                          {p.weeklyRunGoalKm} km
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#06b6d4" }}>
                          {p.weeklySwimGoalMeters} m
                        </span>
                      </td>
                      <td>
                        <span className={`al-badge ${p.completedOnboarding ? "badge-active" : "badge-inactive"}`}>
                          {p.completedOnboarding ? "Hoàn thành" : "Chưa xong"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </>
  );
}

// ─── Sports Management ────────────────────────────────────────────────────────

function SportsManagementPage({ session }: { session: AdminSession }) {
  const emptySport: Omit<SportDef, "id"> = { code: "", label: "", icon: "⚡", category: "Thể dục & Khác", backendSport: "RUN", sortOrder: 99, active: true };
  const [sports, setSports] = useState<SportDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptySport);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await get<SportDef[]>(session.token, "/api/activities/admin/sports");
      setSports(data);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Lỗi tải"); }
    finally { setLoading(false); }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditId(null);
    setForm(emptySport);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(s: SportDef) {
    setEditId(s.id);
    setForm({ code: s.code, label: s.label, icon: s.icon, category: s.category, backendSport: s.backendSport, sortOrder: s.sortOrder, active: s.active });
    setFormError("");
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.label.trim()) { setFormError("Mã và tên không được để trống."); return; }
    setSaving(true); setFormError("");
    try {
      if (editId != null) {
        await put(session.token, `/api/activities/admin/sports/${editId}`, form);
      } else {
        await post(session.token, "/api/activities/admin/sports", form);
      }
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Lỗi lưu");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa môn thể thao này?")) return;
    try {
      await del(session.token, `/api/activities/admin/sports/${id}`);
      await load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Lỗi xóa"); }
  }

  return (
    <>
      <PageHeader title="Môn thể thao" sub="Quản lý danh mục môn thể thao hiển thị trong ứng dụng" />
      <div className="al-content">
        <div className="al-controls">
          <button className="al-add-btn" onClick={openCreate}><Plus size={14} /> Thêm môn mới</button>
          <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
        </div>

        {error && <ErrMsg msg={error} />}

        {showForm && (
          <div className="al-form-card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <strong style={{ fontSize: "0.95rem" }}>{editId ? "Chỉnh sửa môn" : "Thêm môn mới"}</strong>
              <button className="al-icon-btn" onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 12 }}>
                <div>
                  <label className="al-form-label">Mã (code) *</label>
                  <input className="al-form-input" placeholder="VD: RUN" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} disabled={editId != null} />
                </div>
                <div>
                  <label className="al-form-label">Tên hiển thị *</label>
                  <input className="al-form-input" placeholder="VD: Chạy bộ" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                </div>
                <div>
                  <label className="al-form-label">Icon (emoji)</label>
                  <input className="al-form-input" placeholder="🏃" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} />
                </div>
                <div>
                  <label className="al-form-label">Danh mục</label>
                  <input className="al-form-input" placeholder="VD: Môn thể thao dùng chân" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                </div>
                <div>
                  <label className="al-form-label">Backend sport</label>
                  <select className="al-form-input" value={form.backendSport} onChange={e => setForm(f => ({ ...f, backendSport: e.target.value }))}>
                    <option value="RUN">RUN (chạy/đạp/gym)</option>
                    <option value="SWIM">SWIM (bơi)</option>
                  </select>
                </div>
                <div>
                  <label className="al-form-label">Thứ tự</label>
                  <input className="al-form-input" type="number" min={1} value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 99 }))} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                  Hiển thị trong app
                </label>
              </div>
              {formError && <p style={{ color: "#dc2626", fontSize: "0.83rem", margin: "0 0 10px" }}>{formError}</p>}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="al-add-btn" disabled={saving}>{saving ? "Đang lưu…" : editId ? "Cập nhật" : "Thêm môn"}</button>
                <button type="button" className="al-refresh-btn" onClick={() => setShowForm(false)}>Hủy</button>
              </div>
            </form>
          </div>
        )}

        <div className="al-table-wrap">
          {loading ? <div className="al-loading">Đang tải...</div>
            : sports.length === 0 ? <div className="al-empty">Chưa có môn thể thao nào</div>
            : (
              <table className="al-table">
                <thead><tr>
                  <th>Thứ tự</th><th>Icon</th><th>Mã</th><th>Tên</th><th>Danh mục</th>
                  <th>Backend</th><th>Trạng thái</th><th>Hành động</th>
                </tr></thead>
                <tbody>
                  {[...sports].sort((a, b) => a.sortOrder - b.sortOrder).map(s => (
                    <tr key={s.id}>
                      <td><span className="al-date">{s.sortOrder}</span></td>
                      <td style={{ fontSize: "1.3rem", textAlign: "center" }}>{s.icon}</td>
                      <td><code style={{ fontSize: "0.82rem", background: "var(--bg)", padding: "2px 6px", borderRadius: 4 }}>{s.code}</code></td>
                      <td><strong style={{ fontSize: "0.88rem" }}>{s.label}</strong></td>
                      <td><span className="al-date">{s.category}</span></td>
                      <td><span className={`al-badge ${s.backendSport === "SWIM" ? "badge-swim" : "badge-run"}`}>{s.backendSport}</span></td>
                      <td>
                        <span className={`al-badge ${s.active ? "badge-active" : "badge-inactive"}`}>
                          {s.active ? "Hiện" : "Ẩn"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="al-icon-btn" title="Sửa" onClick={() => openEdit(s)}><Edit2 size={14} /></button>
                          <button className="al-icon-btn danger" title="Xóa" onClick={() => handleDelete(s.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

function NutritionAdminPage({ session, nutPage }: { session: AdminSession; nutPage: NutPage }) {
  // ── Foods state ──────────────────────────────────────────────────────────────
  const emptyForm = {
    name: "", categoryId: 0, servingSize: "1 serving",
    calories: 300, proteinGrams: 20, carbsGrams: 35, fatGrams: 8,
    aliases: "", note: "", imageUrl: "", active: true,
  };
  const [overview, setOverview] = useState<NutritionOverview | null>(null);
  const [foods, setFoods] = useState<NutritionFood[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "hidden">("active");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ msg: string; onOk: () => void } | null>(null);
  const [detailFood, setDetailFood] = useState<NutritionFood | null>(null);

  // ── Categories CRUD state ────────────────────────────────────────────────────
  const emptyCatForm = { name: "", description: "" };
  const [catSearch, setCatSearch] = useState("");
  const [catForm, setCatForm] = useState(emptyCatForm);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [showCatForm, setShowCatForm] = useState(false);
  const [catSaving, setCatSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [ov, foodItems, cats] = await Promise.all([
        get<NutritionOverview>(session.token, "/api/nutrition/admin/overview"),
        get<NutritionFood[]>(session.token, "/api/nutrition/admin/foods"),
        get<FoodCategory[]>(session.token, "/api/nutrition/admin/categories"),
      ]);
      setOverview(ov);
      setFoods(foodItems);
      setCategories(cats);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu dinh dưỡng");
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);

  // ── Foods CRUD ───────────────────────────────────────────────────────────────
  function openEdit(food: NutritionFood) {
    setEditingId(food.id);
    setForm({
      name: food.name, categoryId: food.foodCategory?.id ?? 0, servingSize: food.servingSize,
      calories: food.calories, proteinGrams: food.proteinGrams, carbsGrams: food.carbsGrams,
      fatGrams: food.fatGrams, aliases: food.aliases ?? "", note: food.note ?? "",
      imageUrl: food.imageUrl ?? "", active: food.active,
    });
    setShowForm(true);
  }

  function resetForm() { setEditingId(null); setForm(emptyForm); setShowForm(false); }

  async function saveFood(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const body = { ...form, calories: Number(form.calories), proteinGrams: Number(form.proteinGrams), carbsGrams: Number(form.carbsGrams), fatGrams: Number(form.fatGrams), categoryId: Number(form.categoryId) };
    try {
      const saved = editingId
        ? await put<NutritionFood>(session.token, `/api/nutrition/admin/foods/${editingId}`, body)
        : await post<NutritionFood>(session.token, "/api/nutrition/admin/foods", body);
      setFoods(prev => editingId ? prev.map(f => f.id === saved.id ? saved : f) : [saved, ...prev]);
      resetForm();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi lưu món ăn"); }
    finally { setSaving(false); }
  }

  async function hideFood(food: NutritionFood) {
    try {
      await del(session.token, `/api/nutrition/admin/foods/${food.id}`);
      setFoods(prev => prev.map(f => f.id === food.id ? { ...f, active: false } : f));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi ẩn món ăn"); }
  }

  async function restoreFood(food: NutritionFood) {
    try {
      const saved = await put<NutritionFood>(session.token, `/api/nutrition/admin/foods/${food.id}`, { ...food, active: true, categoryId: food.foodCategory?.id });
      setFoods(prev => prev.map(f => f.id === food.id ? saved : f));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi khôi phục món ăn"); }
  }

  async function permanentDeleteFood(id: number) {
    try {
      await del(session.token, `/api/nutrition/admin/foods/${id}/permanent`);
      setFoods(prev => prev.filter(f => f.id !== id));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xóa vĩnh viễn"); }
  }

  const filteredFoods = foods.filter(f => {
    const q = search.toLowerCase();
    const matchQ = `${f.name} ${f.category} ${f.aliases ?? ""}`.toLowerCase().includes(q);
    const matchFilter = filter === "all" || (filter === "active" && f.active) || (filter === "hidden" && !f.active);
    return matchQ && matchFilter;
  });

  // ── Categories CRUD ──────────────────────────────────────────────────────────
  function openEditCat(cat: FoodCategory) {
    setEditingCatId(cat.id);
    setCatForm({ name: cat.name, description: cat.description ?? "" });
    setShowCatForm(true);
  }

  function resetCatForm() { setEditingCatId(null); setCatForm(emptyCatForm); setShowCatForm(false); }

  async function saveCat(e: FormEvent) {
    e.preventDefault();
    setCatSaving(true);
    try {
      const saved = editingCatId
        ? await put<FoodCategory>(session.token, `/api/nutrition/admin/categories/${editingCatId}`, catForm)
        : await post<FoodCategory>(session.token, "/api/nutrition/admin/categories", catForm);
      setCategories(prev => editingCatId ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev]);
      resetCatForm();
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi lưu danh mục"); }
    finally { setCatSaving(false); }
  }

  async function deleteCategory(id: number) {
    if (!confirm("Xóa danh mục này? Các món ăn thuộc danh mục sẽ mất phân loại.")) return;
    try {
      await del(session.token, `/api/nutrition/admin/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xóa danh mục"); }
  }

  const foodCountByCategory = useMemo(() => {
    const map: Record<number, number> = {};
    foods.forEach(f => { if (f.foodCategory) map[f.foodCategory.id] = (map[f.foodCategory.id] ?? 0) + 1; });
    return map;
  }, [foods]);

  const filteredCats = categories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
    (c.description ?? "").toLowerCase().includes(catSearch.toLowerCase())
  );

  const PAGE_TITLES: Record<NutPage, { title: string; sub: string }> = {
    foods:      { title: "Món ăn",          sub: "Quản lý danh sách món ăn trong hệ thống" },
    categories: { title: "Danh mục món ăn", sub: "Quản lý và phân loại danh mục món ăn" },
  };

  if (loading) return <div className="al-content"><div className="al-loading">Đang tải dữ liệu dinh dưỡng...</div></div>;
  if (error) return <div className="al-content"><ErrMsg msg={error} /></div>;

  return (
    <>
      <PageHeader title={PAGE_TITLES[nutPage].title} sub={PAGE_TITLES[nutPage].sub} />
      <div className="al-content">

        {/* ══ FOODS ══ */}
        {nutPage === "foods" && (
          <div>
            {overview && (
              <div className="al-stats-row cols-5">
                {[
                  { label: "Món ăn đang hoạt động",  value: overview.activeFoods,    color: "#22c55e", icon: <Salad size={18} /> },
                  { label: "Tổng món trong hệ thống", value: overview.totalFoods,     color: "#3b82f6", icon: <Utensils size={18} /> },
                  { label: "Người dùng dinh dưỡng",   value: overview.usersWithPlans, color: "#a855f7", icon: <Zap size={18} /> },
                  { label: "Lượt ghi nhận bữa ăn",   value: overview.mealsLogged,    color: "#f97316", icon: <Activity size={18} /> },
                  { label: "Tổng calo hôm nay",       value: overview.caloriesToday,  color: "#ef4444", icon: <Flame size={18} /> },
                ].map(card => (
                  <div key={card.label} className="al-stat-card">
                    <div className="al-stat-icon" style={{ background: `${card.color}18`, color: card.color }}>{card.icon}</div>
                    <div className="al-stat-value" style={{ color: card.color }}>{card.value.toLocaleString("vi-VN")}</div>
                    <div className="al-stat-label">{card.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="al-controls">
              <div className="al-search-wrap">
                <Search size={14} className="al-search-icon" />
                <input className="al-search" placeholder="Tìm tên món, danh mục, alias..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="al-tabs">
                <button className={`al-tab${filter === "all"    ? " active" : ""}`} onClick={() => setFilter("all")}>Tất cả</button>
                <button className={`al-tab${filter === "active" ? " active" : ""}`} onClick={() => setFilter("active")}>Đang dùng</button>
                <button className={`al-tab${filter === "hidden" ? " active" : ""}`} onClick={() => setFilter("hidden")}>Đã ẩn</button>
              </div>
              <button className="al-add-btn" onClick={() => { resetForm(); setShowForm(v => !v); }}>
                {showForm && !editingId ? <X size={14} /> : <Plus size={14} />} {showForm && !editingId ? "Đóng" : "Thêm món"}
              </button>
            </div>

            {showForm && (
              <div className="al-form-card al-nutrition-form-card">
                <div className="al-form-card-title">{editingId ? "Cập nhật món ăn" : "Thêm món ăn mới"}</div>
                <form onSubmit={saveFood} className="al-inline-form">
                  <div className="al-nut-form-layout">
                    <div className="al-nut-img-panel">
                      <div className="al-nut-img-preview">
                        {form.imageUrl ? (
                          <img src={form.imageUrl} alt="preview" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="al-nut-img-empty"><Salad size={36} /><span>Chưa có ảnh</span></div>
                        )}
                      </div>
                      <div className="al-form-group">
                        <label className="al-form-label">URL ảnh món ăn</label>
                        <input className="al-form-input" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://images.unsplash.com/..." />
                      </div>
                      {form.imageUrl && (
                        <button type="button" className="al-refresh-btn" style={{ width: "100%" }} onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}>
                          <X size={13} /> Xóa ảnh
                        </button>
                      )}
                    </div>

                    <div className="al-nut-form-fields">
                      <div className="al-form-row">
                        <div className="al-form-group" style={{ gridColumn: "1 / -1" }}>
                          <label className="al-form-label">Tên món <span style={{ color: "#ef4444" }}>*</span></label>
                          <input className="al-form-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Phở bò, Cơm tấm sườn..." />
                        </div>
                      </div>
                      <div className="al-form-row">
                        <div className="al-form-group">
                          <label className="al-form-label">Danh mục</label>
                          <select className="al-form-input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: Number(e.target.value) }))}>
                            <option value={0}>-- Chọn danh mục --</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="al-form-group">
                          <label className="al-form-label">Khẩu phần</label>
                          <input className="al-form-input" value={form.servingSize} onChange={e => setForm(f => ({ ...f, servingSize: e.target.value }))} placeholder="VD: 1 tô, 100g, 1 quả" />
                        </div>
                      </div>
                      <div className="al-form-row">
                        {([ ["calories","Calories (kcal)"], ["proteinGrams","Protein (g)"], ["carbsGrams","Carb (g)"], ["fatGrams","Fat (g)"] ] as [string,string][]).map(([key, label]) => (
                          <div key={key} className="al-form-group">
                            <label className="al-form-label">{label}</label>
                            <input className="al-form-input" type="number" min={0} value={form[key as keyof typeof form] as number} onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))} />
                          </div>
                        ))}
                      </div>
                      <div className="al-form-row">
                        <div className="al-form-group">
                          <label className="al-form-label">Từ khóa tìm kiếm (alias)</label>
                          <input className="al-form-input" value={form.aliases} onChange={e => setForm(f => ({ ...f, aliases: e.target.value }))} placeholder="pho bo beef noodle soup..." />
                        </div>
                        <div className="al-form-group">
                          <label className="al-form-label">Ghi chú</label>
                          <input className="al-form-input" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Phù hợp sau buổi chạy dài..." />
                        </div>
                      </div>
                      <div className="al-form-row" style={{ alignItems: "center" }}>
                        <label className="al-check-line">
                          <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} /> Đang hiển thị cho người dùng
                        </label>
                      </div>
                      <div className="al-form-actions">
                        <button className="al-add-btn" type="submit" disabled={saving}>{saving ? "Đang lưu..." : editingId ? "Cập nhật món ăn" : "Thêm món ăn"}</button>
                        <button className="al-refresh-btn" type="button" onClick={resetForm}>Hủy</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            <div className="al-table-wrap">
              {filteredFoods.length === 0
                ? <div className="al-empty">Không có món phù hợp</div>
                : (
                  <table className="al-table al-food-table">
                    <thead><tr>
                      <th style={{ width: 64 }}>Ảnh</th>
                      <th>Tên món</th>
                      <th>Danh mục</th>
                      <th>Khẩu phần</th>
                      <th>Calories</th>
                      <th>Macro</th>
                      <th>Trạng thái</th>
                      <th></th>
                    </tr></thead>
                    <tbody>
                      {filteredFoods.map(food => (
                        <tr key={food.id}>
                          <td>
                            <div className="al-food-thumb">
                              {food.imageUrl
                                ? <img src={food.imageUrl} alt={food.name} className="al-food-img" />
                                : <div className="al-food-img-ph"><Salad size={16} /></div>}
                            </div>
                          </td>
                          <td>
                            <div className="al-uname">{food.name}</div>
                            {food.note && <div className="al-uemail" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{food.note}</div>}
                          </td>
                          <td>
                            {food.foodCategory
                              ? <span className="al-badge badge-active" style={{ background: "#f0fdf4", color: "#16a34a" }}>{food.foodCategory.name}</span>
                              : <span className="al-badge" style={{ background: "#f1f5f9", color: "#64748b" }}>{food.category || "—"}</span>}
                          </td>
                          <td><span className="al-date">{food.servingSize}</span></td>
                          <td><strong>{food.calories}</strong> kcal</td>
                          <td><span className="al-date">P {food.proteinGrams}g · C {food.carbsGrams}g · F {food.fatGrams}g</span></td>
                          <td>
                            <span className={`al-badge ${food.active ? "badge-active" : "badge-inactive"}`}>
                              {food.active ? "Hiển thị" : "Đã ẩn"}
                            </span>
                          </td>
                          <td>
                            <div className="al-row-actions">
                              <button className="al-refresh-btn" onClick={() => setDetailFood(food)}><Eye size={13} /> Chi tiết</button>
                              <button className="al-refresh-btn" onClick={() => openEdit(food)}><Edit2 size={13} /> Sửa</button>
                              {food.active ? (
                                <button className="al-refresh-btn" onClick={() => setConfirmModal({ msg: `Ẩn "${food.name}" khỏi danh sách người dùng?`, onOk: () => hideFood(food) })}>Ẩn</button>
                              ) : (
                                <button className="al-refresh-btn" onClick={() => restoreFood(food)}>Khôi phục</button>
                              )}
                              <button className="al-icon-del" title="Xóa vĩnh viễn" onClick={() => setConfirmModal({ msg: `Xóa vĩnh viễn "${food.name}"? Hành động này không thể hoàn tác.`, onOk: () => permanentDeleteFood(food.id) })}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        )}

        {/* ══ CATEGORIES ══ */}
        {nutPage === "categories" && (
          <div>
            <div className="al-controls">
              <div className="al-search-wrap">
                <Search size={14} className="al-search-icon" />
                <input className="al-search" placeholder="Tìm danh mục..." value={catSearch} onChange={e => setCatSearch(e.target.value)} />
              </div>
              <button className="al-add-btn" onClick={() => { resetCatForm(); setShowCatForm(v => !v); }}>
                {showCatForm && !editingCatId ? <X size={14} /> : <Plus size={14} />} {showCatForm && !editingCatId ? "Đóng" : "Thêm danh mục"}
              </button>
              <button className="al-refresh-btn" onClick={load}><RefreshCw size={13} /> Làm mới</button>
            </div>

            {showCatForm && (
              <div className="al-form-card">
                <div className="al-form-card-title">{editingCatId ? "Cập nhật danh mục" : "Thêm danh mục mới"}</div>
                <form onSubmit={saveCat} className="al-inline-form">
                  <div className="al-form-row">
                    <div className="al-form-group">
                      <label className="al-form-label">Tên danh mục <span style={{ color: "#ef4444" }}>*</span></label>
                      <input className="al-form-input" required value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Bữa chính, Protein..." />
                    </div>
                  </div>
                  <div className="al-form-row">
                    <div className="al-form-group" style={{ gridColumn: "1 / -1" }}>
                      <label className="al-form-label">Mô tả</label>
                      <input className="al-form-input" value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} placeholder="VD: Bữa ăn chính trong ngày..." />
                    </div>
                  </div>
                  <div className="al-form-actions">
                    <button className="al-add-btn" type="submit" disabled={catSaving}>{catSaving ? "Đang lưu..." : editingCatId ? "Cập nhật" : "Thêm danh mục"}</button>
                    <button className="al-refresh-btn" type="button" onClick={resetCatForm}>Hủy</button>
                  </div>
                </form>
              </div>
            )}

            <div className="al-table-wrap">
              {filteredCats.length === 0
                ? <div className="al-empty">Không có danh mục nào</div>
                : (
                  <table className="al-table">
                    <thead><tr>
                      <th>Tên danh mục</th>
                      <th>Mô tả</th>
                      <th>Số món</th>
                      <th></th>
                    </tr></thead>
                    <tbody>
                      {filteredCats.map(cat => (
                        <tr key={cat.id}>
                          <td><div className="al-uname">{cat.name}</div></td>
                          <td><span className="al-uemail">{cat.description || "—"}</span></td>
                          <td><span className="al-badge badge-active">{foodCountByCategory[cat.id] ?? 0} món</span></td>
                          <td>
                            <div className="al-row-actions">
                              <button className="al-refresh-btn" onClick={() => openEditCat(cat)}><Edit2 size={13} /> Sửa</button>
                              <button className="al-icon-del" title="Xóa danh mục" onClick={() => deleteCategory(cat.id)}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>
          </div>
        )}

      </div>

      {/* ══ CONFIRM MODAL ══ */}
      {confirmModal && (
        <div className="al-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="al-modal-box" onClick={e => e.stopPropagation()}>
            <div className="al-modal-icon"><AlertCircle size={28} /></div>
            <div className="al-modal-msg">{confirmModal.msg}</div>
            <div className="al-modal-actions">
              <button className="al-add-btn" onClick={() => { confirmModal.onOk(); setConfirmModal(null); }}>Xác nhận</button>
              <button className="al-refresh-btn" onClick={() => setConfirmModal(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DETAIL MODAL ══ */}
      {detailFood && (
        <div className="al-modal-overlay" onClick={() => setDetailFood(null)}>
          <div className="al-modal-box al-food-detail" onClick={e => e.stopPropagation()}>
            <div className="al-modal-head">
              <div className="al-modal-title">{detailFood.name}</div>
              <button className="al-icon-btn" onClick={() => setDetailFood(null)}><X size={16} /></button>
            </div>
            {detailFood.imageUrl && (
              <img src={detailFood.imageUrl} alt={detailFood.name} className="al-detail-img" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div className="al-detail-info-grid">
              {[
                ["Danh mục",  detailFood.foodCategory ? detailFood.foodCategory.name : (detailFood.category || "—")],
                ["Khẩu phần", detailFood.servingSize],
                ["Calories",  `${detailFood.calories} kcal`],
                ["Protein",   `${detailFood.proteinGrams}g`],
                ["Carb",      `${detailFood.carbsGrams}g`],
                ["Fat",       `${detailFood.fatGrams}g`],
                ...(detailFood.aliases ? [["Alias", detailFood.aliases]] : []),
                ...(detailFood.note    ? [["Ghi chú", detailFood.note]]  : []),
              ].map(([label, value]) => (
                <div key={label} className="al-detail-info-row">
                  <span className="al-detail-info-label">{label}</span>
                  <span className="al-detail-info-val">{value}</span>
                </div>
              ))}
              <div className="al-detail-info-row">
                <span className="al-detail-info-label">Trạng thái</span>
                <span className={`al-badge ${detailFood.active ? "badge-active" : "badge-inactive"}`}>{detailFood.active ? "Hiển thị" : "Đã ẩn"}</span>
              </div>
            </div>
            <div className="al-modal-actions">
              <button className="al-add-btn" onClick={() => { openEdit(detailFood); setDetailFood(null); }}><Edit2 size={13} /> Chỉnh sửa</button>
              <button className="al-refresh-btn" onClick={() => setDetailFood(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Onboarding Management ────────────────────────────────────────────────────

type OnboardingGoal = { id: number; title: string; description: string; sortOrder: number; active: boolean; createdAt: string; };
type OBTab = "tracking" | "goals" | "levels";

const EXPERIENCE_LEVELS = [
  { code: "BEGINNER",     label: "Mới bắt đầu",  desc: "Chưa có thói quen tập luyện thường xuyên. Mục tiêu: xây dựng nền tảng thể lực cơ bản và tạo thói quen vận động đều đặn.",  sessions: "2–3 buổi/tuần" },
  { code: "INTERMEDIATE", label: "Trung bình",    desc: "Đã tập luyện được vài tháng đến một năm. Có thể hoàn thành các cự ly trung bình và đang hướng đến mục tiêu cụ thể hơn.",   sessions: "3–5 buổi/tuần" },
  { code: "ADVANCED",     label: "Nâng cao",      desc: "Vận động viên có kinh nghiệm, đã tham gia thi đấu hoặc tập luyện cường độ cao. Hướng đến đỉnh cao thành tích cá nhân.",     sessions: "5–7 buổi/tuần" },
];

function OnboardingAdminPage({ session }: { session: AdminSession }) {
  const [tab, setTab] = useState<OBTab>("tracking");

  // ── Tracking state ──
  const [profiles, setProfiles] = useState<AthleteProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "DONE" | "PENDING">("ALL");
  const [selected, setSelected] = useState<AthleteProfile | null>(null);

  // ── Goals state ──
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [goalError, setGoalError] = useState("");
  const [goalForm, setGoalForm] = useState({ title: "", description: "", sortOrder: 0, active: true });
  const [editingGoal, setEditingGoal] = useState<OnboardingGoal | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalConfirm, setGoalConfirm] = useState<{ id: number; title: string } | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true); setProfileError("");
    try { setProfiles(await get<AthleteProfile[]>(session.token, "/api/athletes/admin/all")); }
    catch (e: unknown) { setProfileError(e instanceof Error ? e.message : "Lỗi tải"); }
    finally { setLoadingProfiles(false); }
  }, [session.token]);

  const loadGoals = useCallback(async () => {
    setLoadingGoals(true); setGoalError("");
    try { setGoals(await get<OnboardingGoal[]>(session.token, "/api/athletes/admin/onboarding/goals")); }
    catch (e: unknown) { setGoalError(e instanceof Error ? e.message : "Lỗi tải"); }
    finally { setLoadingGoals(false); }
  }, [session.token]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);
  useEffect(() => { if (tab === "goals") loadGoals(); }, [tab, loadGoals]);

  const filtered = useMemo(() => profiles.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.displayName.toLowerCase().includes(q)
      || (p.city ?? "").toLowerCase().includes(q)
      || String(p.userId).includes(q);
    const matchFilter = filter === "ALL"
      || (filter === "DONE" && p.completedOnboarding)
      || (filter === "PENDING" && !p.completedOnboarding);
    return matchSearch && matchFilter;
  }), [profiles, search, filter]);

  const done = profiles.filter(p => p.completedOnboarding).length;
  const completionRate = profiles.length > 0 ? Math.round((done / profiles.length) * 100) : 0;

  async function saveGoal() {
    if (!goalForm.title.trim()) return;
    try {
      if (editingGoal) {
        const updated = await put<OnboardingGoal>(session.token, `/api/athletes/admin/onboarding/goals/${editingGoal.id}`, goalForm);
        setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
      } else {
        const created = await post<OnboardingGoal>(session.token, "/api/athletes/admin/onboarding/goals", goalForm);
        setGoals(prev => [...prev, created]);
      }
      setShowGoalForm(false); setEditingGoal(null);
      setGoalForm({ title: "", description: "", sortOrder: 0, active: true });
    } catch (e: unknown) { setGoalError(e instanceof Error ? e.message : "Lỗi lưu"); }
  }

  async function deleteGoal(id: number) {
    try {
      await del(session.token, `/api/athletes/admin/onboarding/goals/${id}`);
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (e: unknown) { setGoalError(e instanceof Error ? e.message : "Lỗi xóa"); }
    setGoalConfirm(null);
  }

  function startEdit(g: OnboardingGoal) {
    setEditingGoal(g);
    setGoalForm({ title: g.title, description: g.description ?? "", sortOrder: g.sortOrder, active: g.active });
    setShowGoalForm(true);
  }

  function cancelGoalForm() {
    setShowGoalForm(false); setEditingGoal(null);
    setGoalForm({ title: "", description: "", sortOrder: 0, active: true });
  }

  return (
    <>
      <PageHeader title="Quản lý Onboarding" sub="Cấu hình trải nghiệm đăng ký và theo dõi tiến độ người dùng mới" />
      <div className="al-content">

        {/* Tab bar */}
        <div className="al-tabs" style={{ marginBottom: 20 }}>
          {([
            { id: "tracking", label: "Theo dõi người dùng" },
            { id: "goals",    label: "Mục tiêu sức khỏe" },
            { id: "levels",   label: "Cấp độ luyện tập" },
          ] as { id: OBTab; label: string }[]).map(t => (
            <button key={t.id} className={`al-tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Tracking ── */}
        {tab === "tracking" && (
          <>
            <div className="al-stats-row" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 20 }}>
              {[
                { label: "Tổng hồ sơ",       value: profiles.length,            color: "#3b82f6" },
                { label: "Hoàn thành",        value: done,                       color: "#22c55e" },
                { label: "Chưa hoàn thành",   value: profiles.length - done,     color: "#ef4444" },
                { label: "Tỷ lệ hoàn thành",  value: `${completionRate}%`,       color: "#f97316" },
              ].map(c => (
                <div key={c.label} className="al-stat-card">
                  <div className="al-stat-value" style={{ color: c.color }}>{c.value}</div>
                  <div className="al-stat-label">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="al-controls">
              <div className="al-search-wrap">
                <Search size={14} className="al-search-icon" />
                <input className="al-search" placeholder="Tìm tên, thành phố, user ID..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div className="al-tabs">
                {(["ALL", "DONE", "PENDING"] as const).map(f => (
                  <button key={f} className={`al-tab${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
                    {f === "ALL" ? `Tất cả (${profiles.length})` : f === "DONE" ? `Hoàn thành (${done})` : `Chưa xong (${profiles.length - done})`}
                  </button>
                ))}
              </div>
              <button className="al-refresh-btn" onClick={loadProfiles}><RefreshCw size={13} /> Làm mới</button>
            </div>

            <div className="al-table-wrap">
              {loadingProfiles ? <div className="al-loading">Đang tải...</div>
                : profileError ? <ErrMsg msg={profileError} />
                : filtered.length === 0 ? <div className="al-empty">Không có dữ liệu</div>
                : (
                  <table className="al-table">
                    <thead><tr>
                      <th>Vận động viên</th>
                      <th>Thành phố</th>
                      <th>Trình độ</th>
                      <th>Mục tiêu chính</th>
                      <th>Chạy/tuần</th>
                      <th>Bơi/tuần</th>
                      <th>Ngày tạo</th>
                      <th>Onboarding</th>
                    </tr></thead>
                    <tbody>
                      {filtered.map(p => (
                        <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => setSelected(p)}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="al-avatar" style={{ background: avatarColor(p.userId) }}>{initials(p.displayName)}</div>
                              <div>
                                <div className="al-uname">{p.displayName}</div>
                                <div className="al-uemail">ID: {p.userId}</div>
                              </div>
                            </div>
                          </td>
                          <td>{p.city ?? "—"}</td>
                          <td>
                            <span className="al-badge" style={{ background: p.experienceLevel === "ADVANCED" ? "#fef3c7" : p.experienceLevel === "INTERMEDIATE" ? "#dbeafe" : "#f0fdf4", color: p.experienceLevel === "ADVANCED" ? "#92400e" : p.experienceLevel === "INTERMEDIATE" ? "#1d4ed8" : "#166534" }}>
                              {p.experienceLevel === "BEGINNER" ? "Mới bắt đầu" : p.experienceLevel === "INTERMEDIATE" ? "Trung bình" : p.experienceLevel === "ADVANCED" ? "Nâng cao" : p.experienceLevel ?? "—"}
                            </span>
                          </td>
                          <td className="al-truncate" style={{ maxWidth: 180 }}>{p.primaryGoal ?? "—"}</td>
                          <td>{p.weeklyRunGoalKm} km</td>
                          <td>{p.weeklySwimGoalMeters} m</td>
                          <td>{fmtDate(p.createdAt)}</td>
                          <td>
                            <span className={`al-badge ${p.completedOnboarding ? "badge-active" : "badge-inactive"}`}>
                              {p.completedOnboarding ? "Hoàn thành" : "Chưa xong"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>

            {selected && (
              <div className="modal-backdrop" onClick={() => setSelected(null)}>
                <div className="al-detail-card" onClick={e => e.stopPropagation()}>
                  <div className="al-detail-header">
                    <div className="al-avatar-lg" style={{ background: avatarColor(selected.userId) }}>{initials(selected.displayName)}</div>
                    <div style={{ flex: 1 }}>
                      <div className="al-detail-name">{selected.displayName}</div>
                      <div className="al-detail-sub">User ID: {selected.userId}</div>
                    </div>
                    <button className="al-icon-btn" onClick={() => setSelected(null)}><X size={16} /></button>
                  </div>
                  <div className="al-detail-grid">
                    {([
                      ["Giới tính", selected.gender ?? "—"],
                      ["Ngày sinh", selected.dateOfBirth ?? "—"],
                      ["Chiều cao", selected.heightCm ? `${selected.heightCm} cm` : "—"],
                      ["Cân nặng", selected.weightKg ? `${selected.weightKg} kg` : "—"],
                      ["Thành phố", selected.city ?? "—"],
                      ["Trình độ", selected.experienceLevel ?? "—"],
                      ["Mục tiêu chính", selected.primaryGoal ?? "—"],
                      ["Trọng tâm dinh dưỡng", selected.nutritionFocus ?? "—"],
                      ["Mục tiêu chạy/tuần", `${selected.weeklyRunGoalKm} km`],
                      ["Mục tiêu bơi/tuần", `${selected.weeklySwimGoalMeters} m`],
                      ["Ngày tạo hồ sơ", fmtDate(selected.createdAt)],
                      ["Trạng thái", selected.completedOnboarding ? "Hoàn thành" : "Chưa xong"],
                    ] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="al-detail-row">
                        <span className="al-detail-key">{k}</span>
                        <span className="al-detail-val">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Tab 2: Goals ── */}
        {tab === "goals" && (
          <>
            <div className="al-controls" style={{ marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Danh sách mục tiêu sức khỏe hiển thị trong form đăng ký onboarding của người dùng.
                </div>
              </div>
              <button className="al-add-btn" onClick={() => { setShowGoalForm(true); setEditingGoal(null); setGoalForm({ title: "", description: "", sortOrder: goals.length + 1, active: true }); }}>
                <Plus size={14} /> Thêm mục tiêu
              </button>
              <button className="al-refresh-btn" onClick={loadGoals}><RefreshCw size={13} /> Làm mới</button>
            </div>

            {goalError && <ErrMsg msg={goalError} />}

            {showGoalForm && (
              <div className="al-form-card" style={{ marginBottom: 16, padding: "20px 24px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                <div style={{ fontWeight: 600, marginBottom: 14, color: "#1e293b" }}>
                  {editingGoal ? "Chỉnh sửa mục tiêu" : "Thêm mục tiêu mới"}
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Tên mục tiêu *</label>
                  <input className="al-form-input" value={goalForm.title} onChange={e => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="VD: Giảm cân & cải thiện vóc dáng" />
                </div>
                <div className="al-form-group">
                  <label className="al-form-label">Mô tả</label>
                  <textarea className="al-form-input" rows={3} value={goalForm.description} onChange={e => setGoalForm({ ...goalForm, description: e.target.value })} placeholder="Giải thích ngắn gọn về mục tiêu này..." style={{ resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div className="al-form-group" style={{ flex: "0 0 140px", marginBottom: 0 }}>
                    <label className="al-form-label">Thứ tự</label>
                    <input className="al-form-input" type="number" min={0} value={goalForm.sortOrder} onChange={e => setGoalForm({ ...goalForm, sortOrder: Number(e.target.value) })} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, marginTop: 18 }}>
                    <input type="checkbox" checked={goalForm.active} onChange={e => setGoalForm({ ...goalForm, active: e.target.checked })} />
                    Đang kích hoạt
                  </label>
                  <div style={{ flex: 1 }} />
                  <button className="al-btn-secondary" onClick={cancelGoalForm} style={{ marginTop: 0 }}>Hủy</button>
                  <button className="al-add-btn" onClick={saveGoal} style={{ marginTop: 0 }}>
                    {editingGoal ? "Lưu thay đổi" : "Thêm mục tiêu"}
                  </button>
                </div>
              </div>
            )}

            <div className="al-table-wrap">
              {loadingGoals ? <div className="al-loading">Đang tải...</div>
                : goals.length === 0 ? <div className="al-empty">Chưa có mục tiêu nào. Nhấn "Thêm mục tiêu" để bắt đầu.</div>
                : (
                  <table className="al-table">
                    <thead><tr>
                      <th style={{ width: 50 }}>STT</th>
                      <th>Tên mục tiêu</th>
                      <th>Mô tả</th>
                      <th style={{ width: 100 }}>Trạng thái</th>
                      <th style={{ width: 110 }}>Thao tác</th>
                    </tr></thead>
                    <tbody>
                      {goals.map(g => (
                        <tr key={g.id}>
                          <td style={{ textAlign: "center", color: "#94a3b8" }}>{g.sortOrder}</td>
                          <td><div className="al-uname">{g.title}</div></td>
                          <td style={{ color: "#64748b", fontSize: 13 }}>{g.description || "—"}</td>
                          <td>
                            <span className={`al-badge ${g.active ? "badge-active" : "badge-inactive"}`}>
                              {g.active ? "Kích hoạt" : "Tắt"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button className="al-action-btn" title="Sửa" onClick={() => startEdit(g)}><Edit2 size={13} /></button>
                              <button className="al-action-btn danger" title="Xóa" onClick={() => setGoalConfirm({ id: g.id, title: g.title })}><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </div>

            {goalConfirm && (
              <div className="al-modal-overlay" onClick={() => setGoalConfirm(null)}>
                <div className="al-modal-box" onClick={e => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <AlertCircle size={22} color="#ef4444" />
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Xóa mục tiêu</div>
                  </div>
                  <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>
                    Xóa mục tiêu <strong>"{goalConfirm.title}"</strong>? Hành động này không thể hoàn tác.
                  </p>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <button className="al-btn-secondary" onClick={() => setGoalConfirm(null)}>Hủy</button>
                    <button className="al-add-btn" style={{ background: "#ef4444" }} onClick={() => deleteGoal(goalConfirm.id)}>Xóa</button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Tab 3: Experience Levels ── */}
        {tab === "levels" && (
          <>
            <div style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>
              Ba cấp độ luyện tập được sử dụng trong quá trình onboarding để phân loại vận động viên và gợi ý kế hoạch phù hợp.
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {EXPERIENCE_LEVELS.map((lv, i) => (
                <div key={lv.code} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: i === 0 ? "#f0fdf4" : i === 1 ? "#dbeafe" : "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {i === 0 ? "🌱" : i === 1 ? "⚡" : "🔥"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{lv.label}</div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: i === 0 ? "#dcfce7" : i === 1 ? "#dbeafe" : "#fef9c3", color: i === 0 ? "#166534" : i === 1 ? "#1d4ed8" : "#713f12" }}>
                        {lv.code}
                      </span>
                    </div>
                    <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>{lv.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}>
                      <span style={{ fontWeight: 600, color: "#475569" }}>Tần suất đề xuất:</span>
                      {lv.sessions}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span className="al-badge badge-active">Đang dùng</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: "14px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#64748b" }}>
              Thông tin cấp độ luyện tập được hiển thị cho người dùng trong bước "Cá nhân" của quy trình đăng ký. Người dùng chọn cấp độ phù hợp nhất với khả năng hiện tại của mình.
            </div>
          </>
        )}

      </div>
    </>
  );
}

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null") as AdminSession | null; }
    catch { return null; }
  });
  const [page, setPage] = useState<Page>("dashboard");

  if (!session) return <LoginPage onLogin={s => { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); setSession(s); }} />;

  return (
    <div className="al-root">
      <Sidebar page={page} setPage={setPage} session={session}
        onLogout={() => { localStorage.removeItem(SESSION_KEY); setSession(null); }} />
      <div className="al-main">
        {page === "dashboard"              && <DashboardPage session={session} />}
        {page === "users"                  && <UsersManagementPage session={session} />}
        {page === "activities"             && <ActivitiesPage session={session} />}
        {page === "routes"                 && <RoutesPage session={session} />}
        {page === "community"              && <CommunityAdminPage session={session} />}
        {page.startsWith("nutrition/")     && <NutritionAdminPage session={session} nutPage={page.split("/")[1] as NutPage} />}
        {page === "training"               && <TrainingPage session={session} />}
        {page === "sports"                 && <SportsManagementPage session={session} />}
        {page === "onboarding"             && <OnboardingAdminPage session={session} />}
      </div>
    </div>
  );
}

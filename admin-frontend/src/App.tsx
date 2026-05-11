import { useState, useEffect, useCallback } from "react";
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
  MapPin,
  Trophy,
  Dumbbell,
  Trash2,
  Plus,
  X,
  ChevronDown,
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

type Page = "dashboard" | "users" | "activities" | "routes" | "challenges" | "training";

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
  totalRoutes: number; totalChallenges: number;
};

type AdminUser = {
  id: number; fullName: string; email: string; role: string;
  active: boolean; premiumActive: boolean; createdAt: string;
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

type ChallengeItem = {
  id: number; code: string; title: string; sportType: string;
  targetValue: number; unit: string; note: string; createdAt: string;
};

type AthleteProfile = {
  id: number; userId: number; displayName: string; city: string | null;
  primaryGoal: string | null; experienceLevel: string | null;
  weeklyRunGoalKm: number; weeklySwimGoalMeters: number;
  completedOnboarding: boolean; createdAt: string;
};

type TrainingStats = {
  totalProfiles: number; completedOnboarding: number;
  avgWeeklyRunGoalKm: number; avgWeeklySwimGoalMeters: number;
};

// ─── API ──────────────────────────────────────────────────────────────────────

function h(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function get<T>(token: string, url: string): Promise<T> {
  const res = await fetch(url, { headers: h(token) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function del(token: string, url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE", headers: h(token) });
  if (!res.ok && res.status !== 404) throw new Error(`${res.status} ${res.statusText}`);
}

async function post<T>(token: string, url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "POST", headers: h(token), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function patch<T>(token: string, url: string, body: unknown): Promise<T> {
  const res = await fetch(url, { method: "PATCH", headers: h(token), body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
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

const NAV_GROUPS: { label: string; items: { id: Page; label: string; icon: ReactNode }[] }[] = [
  {
    label: "Tổng quan",
    items: [
      { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
      { id: "users", label: "Người dùng", icon: <Users size={16} /> },
    ],
  },
  {
    label: "Tập luyện",
    items: [
      { id: "activities", label: "Hoạt động", icon: <Activity size={16} /> },
      { id: "routes", label: "Lộ trình", icon: <MapPin size={16} /> },
      { id: "challenges", label: "Thử thách", icon: <Trophy size={16} /> },
      { id: "training", label: "Cài đặt tập luyện", icon: <Dumbbell size={16} /> },
    ],
  },
];

function Sidebar({ page, setPage, session, onLogout }: {
  page: Page; setPage: (p: Page) => void;
  session: AdminSession; onLogout: () => void;
}) {
  return (
    <div className="al-sidebar">
      <div className="al-logo">
        <div className="al-logo-brand">🏃 RunSwim</div>
        <div className="al-logo-sub">Admin Dashboard</div>
      </div>

      <nav className="al-nav">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="al-nav-group">
            <div className="al-nav-group-label">{group.label}</div>
            {group.items.map(item => (
              <button
                key={item.id}
                className={`al-nav-item${page === item.id ? " active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
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
          <div className="al-stats-row" style={{ gridTemplateColumns: "repeat(5,1fr)", marginBottom: 20 }}>
            {[
              { label: "Tổng hoạt động", value: overview.totalActivities, color: "#f97316" },
              { label: "Chạy bộ", value: overview.runActivities, color: "#3b82f6" },
              { label: "Bơi lội", value: overview.swimActivities, color: "#06b6d4" },
              { label: "Lộ trình", value: overview.totalRoutes, color: "#22c55e" },
              { label: "Thử thách", value: overview.totalChallenges, color: "#a855f7" },
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

// ─── App Root ─────────────────────────────────────────────────────────────────

const SESSION_KEY = "runswim_admin_session";

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
        {page === "dashboard"   && <DashboardPage session={session} />}
        {page === "users"       && <UsersPage session={session} />}
        {page === "activities"  && <ActivitiesPage session={session} />}
        {page === "routes"      && <RoutesPage session={session} />}
        {page === "challenges"  && <ChallengesPage session={session} />}
        {page === "training"    && <TrainingPage session={session} />}
      </div>
    </div>
  );
}

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

type Page = "dashboard" | "users";

type AdminSession = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
};

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
};

type AdminUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  premiumActive: boolean;
  createdAt: string;
};

// ─── API ──────────────────────────────────────────────────────────────────────

const API = "/api";

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Email hoặc mật khẩu không đúng");
  return res.json();
}

async function apiGetStats(token: string): Promise<DashboardStats> {
  const res = await fetch(`${API}/auth/admin/stats`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Không thể tải thống kê");
  return res.json();
}

async function apiGetUsers(token: string): Promise<AdminUser[]> {
  const res = await fetch(`${API}/auth/admin/users`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Không thể tải danh sách người dùng");
  return res.json();
}

async function apiUpdateUser(
  token: string,
  userId: number,
  patch: { role?: string; active?: boolean; premiumActive?: boolean }
): Promise<AdminUser> {
  const res = await fetch(`${API}/auth/admin/users/${userId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Cập nhật không thành công");
  return res.json();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const AVATAR_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#eab308",
  "#ec4899",
];

function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
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
      const data = await apiLogin(email, password);
      if (data.role !== "ADMIN") {
        setError("Tài khoản này không có quyền admin");
        return;
      }
      onLogin({
        token: data.token,
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="al-login-wrap">
      <div className="al-login-card">
        <div className="al-login-logo">
          <div className="al-login-icon">
            <Shield size={40} />
          </div>
          <div className="al-login-title">RunSwim Admin</div>
          <div className="al-login-sub">Cổng quản trị hệ thống</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="al-form-group">
            <label className="al-form-label">Email quản trị</label>
            <input
              className="al-form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="al-form-group">
            <label className="al-form-label">Mật khẩu</label>
            <input
              className="al-form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
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

function Sidebar({
  page,
  setPage,
  session,
  onLogout,
}: {
  page: Page;
  setPage: (p: Page) => void;
  session: AdminSession;
  onLogout: () => void;
}) {
  const navItems: { id: Page; label: string; icon: ReactNode }[] = [
    {
      id: "dashboard",
      label: "Tổng quan",
      icon: <LayoutDashboard size={17} />,
    },
    { id: "users", label: "Người dùng", icon: <Users size={17} /> },
  ];

  return (
    <div className="al-sidebar">
      <div className="al-logo">
        <div className="al-logo-brand">🏃 RunSwim</div>
        <div className="al-logo-sub">Admin Dashboard</div>
      </div>

      <nav className="al-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`al-nav-item${page === item.id ? " active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="al-sidebar-footer">
        <div className="al-user-info">
          <div
            className="al-user-avatar"
            style={{ background: avatarColor(session.userId) }}
          >
            {initials(session.fullName)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="al-user-name">{session.fullName}</div>
            <div className="al-user-role">ADMIN</div>
          </div>
        </div>
        <button className="al-logout-btn" onClick={onLogout}>
          <LogOut size={15} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ session }: { session: AdminSession }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([apiGetStats(session.token), apiGetUsers(session.token)])
      .then(([s, u]) => {
        setStats(s);
        setRecentUsers(u.slice(0, 6));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
      })
      .finally(() => setLoading(false));
  }, [session.token]);

  if (loading) return <div className="al-loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="al-loading" style={{ color: "#ef4444" }}>{error}</div>;
  if (!stats) return null;

  const statCards = [
    {
      label: "Tổng người dùng",
      value: stats.totalUsers,
      icon: <Users size={19} color="#3b82f6" />,
      bg: "rgba(59,130,246,0.1)",
    },
    {
      label: "Đang hoạt động",
      value: stats.activeUsers,
      icon: <UserCheck size={19} color="#22c55e" />,
      bg: "rgba(34,197,94,0.1)",
    },
    {
      label: "Premium",
      value: stats.premiumUsers,
      icon: <Crown size={19} color="#eab308" />,
      bg: "rgba(234,179,8,0.1)",
    },
    {
      label: "Miễn phí",
      value: stats.totalUsers - stats.premiumUsers,
      icon: <TrendingUp size={19} color="#f97316" />,
      bg: "rgba(249,115,22,0.1)",
    },
  ];

  const premiumData = [
    { name: "Premium", value: stats.premiumUsers },
    { name: "Miễn phí", value: Math.max(0, stats.totalUsers - stats.premiumUsers) },
  ];
  const activeData = [
    { name: "Hoạt động", value: stats.activeUsers },
    { name: "Không hoạt động", value: Math.max(0, stats.totalUsers - stats.activeUsers) },
  ];

  return (
    <>
      <div className="al-header">
        <div className="al-header-inner">
          <div className="al-page-title">Tổng quan</div>
          <div className="al-page-sub">Thống kê hệ thống RunSwim Club</div>
        </div>
      </div>
      <div className="al-content">
        <div className="al-stats-row">
          {statCards.map((c) => (
            <div key={c.label} className="al-stat-card">
              <div className="al-stat-icon" style={{ background: c.bg }}>
                {c.icon}
              </div>
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
                <Pie
                  data={premiumData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#eab308" />
                  <Cell fill="#e2e8f0" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="al-card">
            <div className="al-card-title">Trạng thái hoạt động</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={activeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="al-card">
          <div className="al-card-title">Người dùng mới nhất</div>
          <div className="al-recent-list">
            {recentUsers.map((u) => (
              <div key={u.id} className="al-recent-item">
                <div className="al-recent-left">
                  <div
                    className="al-avatar"
                    style={{ background: avatarColor(u.id) }}
                  >
                    {initials(u.fullName)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="al-recent-name">{u.fullName}</div>
                    <div className="al-recent-email">{u.email}</div>
                  </div>
                </div>
                <div className="al-recent-right">
                  <span
                    className={`al-badge ${u.role === "ADMIN" ? "badge-admin" : "badge-user"}`}
                  >
                    {u.role === "ADMIN" ? "Admin" : "User"}
                  </span>
                  <span
                    className={`al-badge ${u.premiumActive ? "badge-premium" : "badge-free"}`}
                  >
                    {u.premiumActive ? "Premium" : "Free"}
                  </span>
                  <span className="al-date">{formatDate(u.createdAt)}</span>
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGetUsers(session.token);
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function patch(
    userId: number,
    update: { role?: string; active?: boolean; premiumActive?: boolean }
  ) {
    setUpdating(userId);
    try {
      const updated = await apiUpdateUser(session.token, userId, update);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Lỗi cập nhật");
    } finally {
      setUpdating(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole =
      roleFilter === "ALL" ||
      (roleFilter === "ADMIN" && u.role === "ADMIN") ||
      (roleFilter === "USER" && u.role !== "ADMIN");
    return matchSearch && matchRole;
  });

  return (
    <>
      <div className="al-header">
        <div className="al-header-inner">
          <div className="al-page-title">Quản lý người dùng</div>
          <div className="al-page-sub">
            {users.length} người dùng trong hệ thống
          </div>
        </div>
      </div>
      <div className="al-content">
        <div className="al-controls">
          <div className="al-search-wrap">
            <Search size={14} className="al-search-icon" />
            <input
              className="al-search"
              placeholder="Tìm tên hoặc email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="al-tabs">
            {(["ALL", "USER", "ADMIN"] as const).map((r) => (
              <button
                key={r}
                className={`al-tab${roleFilter === r ? " active" : ""}`}
                onClick={() => setRoleFilter(r)}
              >
                {r === "ALL" ? "Tất cả" : r === "USER" ? "Người dùng" : "Admin"}
              </button>
            ))}
          </div>
          <button className="al-refresh-btn" onClick={loadUsers}>
            <RefreshCw size={13} />
            Làm mới
          </button>
        </div>

        <div className="al-table-wrap">
          {loading ? (
            <div className="al-loading">Đang tải...</div>
          ) : error ? (
            <div className="al-loading" style={{ color: "#ef4444" }}>
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="al-empty">Không tìm thấy người dùng</div>
          ) : (
            <table className="al-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Gói</th>
                  <th>Trạng thái</th>
                  <th>Ngày tham gia</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const busy = updating === u.id;
                  const isSelf = u.id === session.userId;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="al-user-cell">
                          <div
                            className="al-avatar"
                            style={{ background: avatarColor(u.id) }}
                          >
                            {initials(u.fullName)}
                          </div>
                          <div>
                            <div className="al-uname">
                              {u.fullName}
                              {isSelf && (
                                <span className="al-self-tag">(bạn)</span>
                              )}
                            </div>
                            <div className="al-uemail">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`al-badge ${u.role === "ADMIN" ? "badge-admin" : "badge-user"}`}
                        >
                          {u.role === "ADMIN" ? "Admin" : "User"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`al-badge ${u.premiumActive ? "badge-premium" : "badge-free"}`}
                        >
                          {u.premiumActive ? "Premium" : "Free"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`al-badge ${u.active ? "badge-active" : "badge-inactive"}`}
                        >
                          {u.active ? "Hoạt động" : "Đã khoá"}
                        </span>
                      </td>
                      <td>
                        <span className="al-date">
                          {formatDate(u.createdAt)}
                        </span>
                      </td>
                      <td>
                        <div className="al-actions">
                          {u.premiumActive ? (
                            <button
                              className="al-action-btn yellow"
                              disabled={busy}
                              onClick={() =>
                                patch(u.id, { premiumActive: false })
                              }
                            >
                              Huỷ premium
                            </button>
                          ) : (
                            <button
                              className="al-action-btn green"
                              disabled={busy}
                              onClick={() =>
                                patch(u.id, { premiumActive: true })
                              }
                            >
                              Cấp premium
                            </button>
                          )}
                          {u.active ? (
                            <button
                              className="al-action-btn red"
                              disabled={busy || isSelf}
                              title={isSelf ? "Không thể khoá chính mình" : ""}
                              onClick={() => patch(u.id, { active: false })}
                            >
                              Khoá
                            </button>
                          ) : (
                            <button
                              className="al-action-btn green"
                              disabled={busy}
                              onClick={() => patch(u.id, { active: true })}
                            >
                              Mở khoá
                            </button>
                          )}
                          {u.role === "ADMIN" ? (
                            <button
                              className="al-action-btn yellow"
                              disabled={busy || isSelf}
                              title={isSelf ? "Không thể hạ chính mình" : ""}
                              onClick={() => patch(u.id, { role: "USER" })}
                            >
                              Hạ admin
                            </button>
                          ) : (
                            <button
                              className="al-action-btn blue"
                              disabled={busy}
                              onClick={() => patch(u.id, { role: "ADMIN" })}
                            >
                              Cấp admin
                            </button>
                          )}
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

// ─── App Root ─────────────────────────────────────────────────────────────────

const SESSION_KEY = "runswim_admin_session";

export default function App() {
  const [session, setSession] = useState<AdminSession | null>(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? (JSON.parse(saved) as AdminSession) : null;
    } catch {
      return null;
    }
  });
  const [page, setPage] = useState<Page>("dashboard");

  function handleLogin(s: AdminSession) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="al-root">
      <Sidebar
        page={page}
        setPage={setPage}
        session={session}
        onLogout={handleLogout}
      />
      <div className="al-main">
        {page === "dashboard" && <DashboardPage session={session} />}
        {page === "users" && <UsersPage session={session} />}
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { FormEvent, ReactNode } from "react";
import "leaflet/dist/leaflet.css";
import * as L from "leaflet";
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
  Salad,
  Utensils,
  Flame,
  MapPin,
  Trophy,
  Trash2,
  Plus,
  X,
  ChevronDown,
  Zap,
  Edit2,
  Eye,
  AlertCircle,
  CreditCard,
  BadgeCheck,
  Ban,
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

type Page = "dashboard" | "users" | "activities" | "routes" | "nutrition/foods" | "nutrition/categories" | "nutrition/meals" | "sports" | "payment/transactions" | "payment/premium";
type NutPage = "foods" | "categories" | "meals";
type PayPage = "transactions" | "premium";

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
  visibility?: "PUBLIC" | "PRIVATE";
  notes?: string;
  avgPacePerKm?: number;
  elevationGainMeters?: number;
  gpsRoute?: { lat: number; lng: number }[];
};

type RouteItem = {
  id: number; name: string; sportType: "RUN" | "SWIM"; place: string;
  distanceMeters: number; note: string; createdAt: string;
  createdBy?: number | null;
  geoJson?: string | null;
  visibility?: string;
  activityId?: number | null;
};

type RouteStats = { total: number; run: number; swim: number };

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

type AdminMealLog = {
  id: number;
  userId: number;
  userName: string;
  mealType: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  itemCount: number;
  loggedAt: string;
  items?: Pick<NutritionMealEntry, "name" | "calories" | "proteinGrams" | "carbsGrams" | "fatGrams" | "servings" | "servingSize">[];
};

type PaymentTx = {
  id: number; userId: number; userName: string | null; userEmail: string | null;
  orderId: string; provider: string; status: string;
  amount: number; currency: string; plan: string | null;
  createdAt: string; updatedAt: string;
};

type PaymentStats = {
  totalTransactions: number; totalRevenue: number; totalPremiumUsers: number;
  successfulTransactions: number; failedTransactions: number;
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

// ─── GPS / GeoJSON helpers ────────────────────────────────────────────────────

type LatLng = [number, number]; // [lng, lat]

function parseGeoJsonCoords(raw: string | null | undefined): LatLng[] {
  if (!raw) return [];
  try {
    const geo = JSON.parse(raw);
    if (geo.type === "LineString" && Array.isArray(geo.coordinates)) return geo.coordinates;
    if (geo.type === "Feature" && geo.geometry?.type === "LineString") return geo.geometry.coordinates;
    if (geo.type === "FeatureCollection") {
      for (const f of geo.features ?? []) {
        if (f.geometry?.type === "LineString") return f.geometry.coordinates;
      }
    }
    // legacy: [{lat,lng},...] or [[lat,lng],...]
    if (Array.isArray(geo)) {
      if (typeof geo[0] === "object" && "lat" in geo[0]) return geo.map((p: {lat:number;lng:number}) => [p.lng, p.lat]);
      if (Array.isArray(geo[0]) && geo[0].length >= 2) return geo;
    }
  } catch { /* ignore */ }
  return [];
}

function buildSvgPath(coords: LatLng[], W = 560, H = 240, PAD = 28): {
  d: string; start: [number,number]; end: [number,number];
  firstCoord: LatLng; lastCoord: LatLng; centerCoord: LatLng;
} | null {
  if (coords.length < 2) return null;
  const lngs = coords.map(c => c[0]);
  const lats  = coords.map(c => c[1]);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat  = Math.min(...lats),  maxLat  = Math.max(...lats);
  const rangeLng = maxLng - minLng || 0.0001;
  const rangeLat  = maxLat  - minLat  || 0.0001;
  const toSvg = ([lng, lat]: LatLng): [number,number] => [
    PAD + ((lng - minLng) / rangeLng) * (W - PAD * 2),
    H - PAD - ((lat - minLat) / rangeLat) * (H - PAD * 2),
  ];
  const pts = coords.map(toSvg);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const mid = coords[Math.floor(coords.length / 2)];
  return { d, start: pts[0], end: pts[pts.length - 1], firstCoord: coords[0], lastCoord: coords[coords.length - 1], centerCoord: mid };
}

function MiniGpsMap({ geoJson, onClick }: { geoJson: string | null | undefined; onClick?: () => void }) {
  const coords = parseGeoJsonCoords(geoJson);
  const W = 120, H = 70, PAD = 6;

  if (coords.length < 2) return (
    <div
      onClick={onClick}
      style={{
        width: W, height: H, borderRadius: 7, background: "#f1f5f9",
        border: "1.5px dashed #cbd5e1", display: "flex", alignItems: "center",
        justifyContent: "center", cursor: onClick ? "pointer" : "default",
      }}
    >
      <MapPin size={16} style={{ color: "#94a3b8", opacity: 0.5 }} />
    </div>
  );

  const svg = buildSvgPath(coords, W, H, PAD)!;
  return (
    <div
      onClick={onClick}
      title="Nhấn để xem chi tiết"
      style={{
        width: W, height: H, borderRadius: 7, overflow: "hidden",
        border: "1.5px solid #e2e8f0", background: "#e8f4fd",
        cursor: onClick ? "pointer" : "default", flexShrink: 0,
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 2px #f97316"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ display: "block" }}>
        {/* grid */}
        {[1,2,3].map(i => <line key={`h${i}`} x1={0} y1={H*i/4} x2={W} y2={H*i/4} stroke="#c8dff0" strokeWidth="0.6"/>)}
        {[1,2,3,4].map(i => <line key={`v${i}`} x1={W*i/5} y1={0} x2={W*i/5} y2={H} stroke="#c8dff0" strokeWidth="0.6"/>)}
        {/* glow */}
        <path d={svg.d} fill="none" stroke="rgba(249,115,22,0.18)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        {/* line */}
        <path d={svg.d} fill="none" stroke="#f97316" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        {/* start */}
        <circle cx={svg.start[0]} cy={svg.start[1]} r="4.5" fill="#22c55e" stroke="#fff" strokeWidth="1.5"/>
        {/* end */}
        <circle cx={svg.end[0]} cy={svg.end[1]} r="4.5" fill="#ef4444" stroke="#fff" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

function GpsMapViewer({ geoJson }: { geoJson: string | null | undefined }) {
  const coords = parseGeoJsonCoords(geoJson);
  const W = 560, H = 240;

  if (!geoJson) return (
    <div style={{ background: "#f8fafc", borderRadius: 10, border: "1.5px dashed #e2e8f0", padding: "32px 20px", textAlign: "center", color: "#94a3b8" }}>
      <MapPin size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
      <div style={{ fontSize: 13, fontWeight: 500 }}>Lộ trình này không có dữ liệu GPS</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>Người dùng chưa ghi lại tọa độ khi tạo route</div>
    </div>
  );

  if (coords.length < 2) return (
    <div style={{ background: "#f8fafc", borderRadius: 10, border: "1.5px dashed #e2e8f0", padding: "32px 20px", textAlign: "center", color: "#94a3b8" }}>
      <AlertCircle size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.35 }} />
      <div style={{ fontSize: 13, fontWeight: 500 }}>Dữ liệu GPS không đủ điểm để hiển thị</div>
      <div style={{ fontSize: 12, marginTop: 4 }}>{coords.length} điểm GPS được tìm thấy (cần ít nhất 2)</div>
    </div>
  );

  const svg = buildSvgPath(coords, W, H)!;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${svg.centerCoord[1].toFixed(6)}&mlon=${svg.centerCoord[0].toFixed(6)}&zoom=14`;

  return (
    <div>
      {/* SVG Map */}
      <div style={{ borderRadius: 10, overflow: "hidden", border: "1.5px solid #e2e8f0", background: "#e8f4fd", position: "relative" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
          {/* Background grid */}
          {[...Array(5)].map((_, i) => (
            <line key={`h${i}`} x1={0} y1={H * (i + 1) / 6} x2={W} y2={H * (i + 1) / 6} stroke="#c8dff0" strokeWidth="0.8" />
          ))}
          {[...Array(7)].map((_, i) => (
            <line key={`v${i}`} x1={W * (i + 1) / 8} y1={0} x2={W * (i + 1) / 8} y2={H} stroke="#c8dff0" strokeWidth="0.8" />
          ))}

          {/* Route shadow */}
          <path d={svg.d} fill="none" stroke="rgba(249,115,22,0.2)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
          {/* Route line */}
          <path d={svg.d} fill="none" stroke="#f97316" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />


          {/* Start marker */}
          <circle cx={svg.start[0]} cy={svg.start[1]} r="9" fill="#22c55e" stroke="#fff" strokeWidth="2.5" />
          <text x={svg.start[0]} y={svg.start[1] + 4.5} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">S</text>

          {/* End marker */}
          <circle cx={svg.end[0]} cy={svg.end[1]} r="9" fill="#ef4444" stroke="#fff" strokeWidth="2.5" />
          <text x={svg.end[0]} y={svg.end[1] + 4.5} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="700">E</text>
        </svg>

        {/* Map label */}
        <div style={{ position: "absolute", top: 8, left: 10, fontSize: 10, color: "#64748b", background: "rgba(255,255,255,0.85)", borderRadius: 5, padding: "2px 7px", fontWeight: 600 }}>
          GPS POLYLINE — {coords.length} điểm
        </div>
      </div>

      {/* Coordinate info */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 14px", border: "1px solid #bbf7d0" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Điểm bắt đầu</div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#166534" }}>
            {svg.firstCoord[1].toFixed(6)}, {svg.firstCoord[0].toFixed(6)}
          </div>
          <div style={{ fontSize: 11, color: "#4ade80", marginTop: 2 }}>lat, lng</div>
        </div>
        <div style={{ background: "#fff1f2", borderRadius: 8, padding: "10px 14px", border: "1px solid #fecdd3" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Điểm kết thúc</div>
          <div style={{ fontFamily: "monospace", fontSize: 12, color: "#991b1b" }}>
            {svg.lastCoord[1].toFixed(6)}, {svg.lastCoord[0].toFixed(6)}
          </div>
          <div style={{ fontSize: 11, color: "#f87171", marginTop: 2 }}>lat, lng</div>
        </div>
      </div>

      {/* OpenStreetMap link */}
      <a href={osmUrl} target="_blank" rel="noreferrer" style={{
        display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10,
        fontSize: 12, color: "#3b82f6", fontWeight: 500, textDecoration: "none"
      }}>
        <MapPin size={13} /> Xem vị trí trên OpenStreetMap
      </a>
    </div>
  );
}

function RouteLeafletMap({ geoJson, height = 320 }: { geoJson: string | null | undefined; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const coords = parseGeoJsonCoords(geoJson);
    if (!containerRef.current || coords.length < 2) return;

    // cleanup previous instance
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const latLngs: L.LatLngTuple[] = coords.map(([lng, lat]) => [lat, lng]);

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const polyline = L.polyline(latLngs, {
      color: "#f97316", weight: 4, opacity: 0.9,
      lineJoin: "round", lineCap: "round",
    }).addTo(map);

    // start marker (green)
    L.circleMarker(latLngs[0], {
      radius: 8, fillColor: "#22c55e", color: "#fff", weight: 2.5, fillOpacity: 1,
    }).bindTooltip("Bắt đầu", { permanent: false }).addTo(map);

    // end marker (red)
    L.circleMarker(latLngs[latLngs.length - 1], {
      radius: 8, fillColor: "#ef4444", color: "#fff", weight: 2.5, fillOpacity: 1,
    }).bindTooltip("Kết thúc", { permanent: false }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [24, 24] });

    return () => { map.remove(); mapRef.current = null; };
  }, [geoJson]);

  const coords = parseGeoJsonCoords(geoJson);

  if (coords.length < 2) return (
    <div style={{
      height, borderRadius: 10, background: "#f8fafc",
      border: "1.5px dashed #e2e8f0", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 8, color: "#94a3b8",
    }}>
      <MapPin size={30} style={{ opacity: 0.35 }} />
      <div style={{ fontSize: 13, fontWeight: 500 }}>Lộ trình không có dữ liệu GPS</div>
      <div style={{ fontSize: 12 }}>Người dùng chưa ghi lại tọa độ</div>
    </div>
  );

  const osmUrl = `https://www.openstreetmap.org/?mlat=${coords[0][1].toFixed(6)}&mlon=${coords[0][0].toFixed(6)}&zoom=14`;

  return (
    <div>
      <div ref={containerRef} style={{ height, borderRadius: 10, overflow: "hidden", border: "1.5px solid #e2e8f0" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <div style={{ fontSize: 12, color: "var(--al-muted)" }}>
          {coords.length} điểm GPS · Bắt đầu: {coords[0][1].toFixed(5)}, {coords[0][0].toFixed(5)}
        </div>
        <a href={osmUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#3b82f6", fontWeight: 500, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <MapPin size={12} /> Xem trên OSM
        </a>
      </div>
    </div>
  );
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
  { id: "users",      label: "Quản lý người dùng",   icon: <Users size={16} /> },
  { id: "activities", label: "Quản lý hoạt động",     icon: <Activity size={16} /> },
  { id: "routes",     label: "Quản lý lộ trình",      icon: <MapPin size={16} /> },
  { id: "sports",     label: "Môn thể thao",          icon: <Zap size={16} /> },
];

const NAV_ITEMS_BOTTOM: { id: Page; label: string; icon: ReactNode }[] = [];

const NUT_SUB_ITEMS: { id: Page; label: string }[] = [
  { id: "nutrition/categories", label: "Danh mục" },
  { id: "nutrition/foods",      label: "Món ăn" },
  { id: "nutrition/meals",      label: "Meal Logs" },
];

const PAY_SUB_ITEMS: { id: Page; label: string }[] = [
  { id: "payment/transactions", label: "Giao dịch" },
  { id: "payment/premium",      label: "Quản lý Premium" },
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
  const payActive = page.startsWith("payment/");
  const [nutOpen, setNutOpen] = useState(nutActive);
  const [payOpen, setPayOpen] = useState(payActive);

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

        {/* Expandable Thanh toán & Premium */}
        <button
          className={`al-nav-item al-nav-expandable${payActive ? " active" : ""}`}
          onClick={() => setPayOpen(o => !o)}
        >
          <CreditCard size={16} />
          <span style={{ flex: 1, textAlign: "left" }}>Thanh toán & Premium</span>
          <ChevronDown size={14} className={`al-nav-chevron${payOpen ? " open" : ""}`} />
        </button>
        <div className={`al-nav-sub${payOpen ? " open" : ""}`}>
          {PAY_SUB_ITEMS.map(item => (
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
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "PREMIUM" | "FREE" | "ADMIN">("ALL");
  const [updating, setUpdating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ role: "USER", premiumActive: false, active: true });

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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setCurrentPage(1); }, [search, filter, pageSize]);

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
      (filter === "ADMIN" && u.role === "ADMIN");
    return matchSearch && matchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function softDeleteUser(u: AdminUser) {
    if (!confirm(`Vô hiệu hóa tài khoản "${u.fullName}"?\nTài khoản sẽ bị khoá và không thể đăng nhập.`)) return;
    await patchUser(u.id, { active: false });
  }

  async function saveEdit() {
    if (!editUser) return;
    await patchUser(editUser.id, { role: editForm.role, premiumActive: editForm.premiumActive, active: editForm.active });
    setEditUser(null);
  }

  return (
    <>
      <PageHeader title="Người dùng" sub="Quản lý tài khoản và hồ sơ tập luyện của người dùng" />
      <div className="al-content">
        <div className="al-stats-row">
          {[
            { label: "Tổng người dùng", value: users.length, color: "#3b82f6" },
            { label: "Đang hoạt động", value: users.filter(u => u.active).length, color: "#22c55e" },
            { label: "Premium", value: users.filter(u => u.premiumActive).length, color: "#eab308" },
            { label: "Admin", value: users.filter(u => u.role === "ADMIN").length, color: "#8b5cf6" },
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
              ["ADMIN", "Admin"],
            ].map(([id, label]) => (
              <button key={id} className={`al-tab${filter === id ? " active" : ""}`} onClick={() => setFilter(id as typeof filter)}>
                {label}
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
              <>
                <table className="al-table">
                  <thead><tr>
                    <th>Người dùng</th><th>Vai trò</th><th>Gói</th>
                    <th>Hoạt động</th><th>Trạng thái</th><th>Thao tác</th>
                  </tr></thead>
                  <tbody>
                    {paginated.map(u => {
                      const busy = updating === u.id;
                      const isSelf = u.id === session.userId;
                      const userActivityCount = activitiesByUser.get(u.id)?.length ?? 0;
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
                          <td><span className="al-date">{userActivityCount} buổi</span></td>
                          <td><span className={`al-badge ${u.active ? "badge-active" : "badge-inactive"}`}>{u.active ? "Hoạt động" : "Đã khoá"}</span></td>
                          <td>
                            <div className="al-actions">
                              <button className="al-action-btn blue" onClick={() => setDetailUser(u)}>
                                <Eye size={12} /> Chi tiết
                              </button>
                              <button className="al-action-btn green" disabled={busy}
                                onClick={() => { setEditUser(u); setEditForm({ role: u.role, premiumActive: u.premiumActive, active: u.active }); }}>
                                <Edit2 size={12} /> Sửa
                              </button>
                              <button className="al-action-btn red" disabled={busy || isSelf || !u.active}
                                onClick={() => softDeleteUser(u)}>
                                <Trash2 size={12} /> Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="al-pagination">
                  <div className="al-page-size">
                    <span>Hiển thị</span>
                    <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                      {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span>/ trang</span>
                  </div>
                  <div className="al-page-nav">
                    <button className="al-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Trước</button>
                    <span className="al-page-info">Trang {currentPage} / {totalPages} &nbsp;·&nbsp; {filtered.length} kết quả</span>
                    <button className="al-page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Tiếp →</button>
                  </div>
                </div>
              </>
            )}
        </div>

        {/* ── Detail Modal ── */}
        {detailUser && (() => {
          const profile = profileByUser.get(detailUser.id);
          const userActivities = activitiesByUser.get(detailUser.id) ?? [];
          const runKm = userActivities.filter(a => a.sportType === "RUN").reduce((s, a) => s + a.distanceMeters, 0) / 1000;
          const swimM = userActivities.filter(a => a.sportType === "SWIM").reduce((s, a) => s + a.distanceMeters, 0);
          return (
            <div className="al-modal-overlay" onClick={() => setDetailUser(null)}>
              <div className="al-modal-box al-modal-detail" onClick={e => e.stopPropagation()}>
                <button className="al-modal-close" onClick={() => setDetailUser(null)}><X size={15} /></button>
                <div className="al-user-detail-head">
                  <div className="al-avatar large" style={{ background: avatarColor(detailUser.id) }}>{initials(detailUser.fullName)}</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem" }}>{detailUser.fullName}</h3>
                    <span style={{ fontSize: "0.83rem", color: "#64748b" }}>{detailUser.email}</span>
                  </div>
                </div>
                <div className="al-detail-badges">
                  <span className={`al-badge ${detailUser.role === "ADMIN" ? "badge-admin" : "badge-user"}`}>{detailUser.role === "ADMIN" ? "Admin" : "User"}</span>
                  <span className={`al-badge ${detailUser.premiumActive ? "badge-premium" : "badge-free"}`}>{detailUser.premiumActive ? "Premium" : "Free"}</span>
                  <span className={`al-badge ${detailUser.active ? "badge-active" : "badge-inactive"}`}>{detailUser.active ? "Hoạt động" : "Đã khoá"}</span>
                </div>
                <div className="al-detail-grid">
                  <div><span>Ngày tham gia</span><strong>{fmtDate(detailUser.createdAt)}</strong></div>
                  <div><span>Premium từ</span><strong>{detailUser.premiumSince ? fmtDate(detailUser.premiumSince) : "—"}</strong></div>
                  <div><span>Thành phố</span><strong>{profile?.city ?? "—"}</strong></div>
                  <div><span>Trình độ</span><strong>{profile?.experienceLevel ?? "—"}</strong></div>
                </div>
                <div className="al-detail-grid">
                  <div><span>Tổng buổi</span><strong>{userActivities.length}</strong></div>
                  <div><span>Chạy</span><strong>{runKm.toFixed(1)} km</strong></div>
                  <div><span>Bơi</span><strong>{Math.round(swimM)} m</strong></div>
                  <div><span>Mục tiêu chạy</span><strong>{profile?.weeklyRunGoalKm ?? 0} km/tuần</strong></div>
                </div>
                <div className="al-detail-section">
                  <h4>Mục tiêu luyện tập</h4>
                  <p style={{ margin: "4px 0 0", color: "#475569", fontSize: "0.88rem" }}>{profile?.primaryGoal ?? "Chưa có hồ sơ."}</p>
                </div>
                <div className="al-detail-section">
                  <h4>Hoạt động gần nhất</h4>
                  {userActivities.slice(0, 4).map(a => (
                    <div key={a.id} className="al-mini-activity">
                      <span className={`al-badge ${a.sportType === "RUN" ? "badge-run" : "badge-swim"}`}>{a.sportType === "RUN" ? "Chạy" : "Bơi"}</span>
                      <strong>{a.title}</strong>
                      <small>{fmtDist(a.distanceMeters)} · {a.durationMinutes} phút</small>
                    </div>
                  ))}
                  {userActivities.length === 0 && <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "4px 0 0" }}>Chưa có hoạt động.</p>}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Edit Modal ── */}
        {editUser && (
          <div className="al-modal-overlay" onClick={() => setEditUser(null)}>
            <div className="al-modal-box" onClick={e => e.stopPropagation()}>
              <button className="al-modal-close" onClick={() => setEditUser(null)}><X size={15} /></button>
              <h3 style={{ margin: 0, fontSize: "1rem" }}>Sửa: {editUser.fullName}</h3>
              <div className="al-edit-form">
                <label className="al-edit-field">
                  <span>Vai trò</span>
                  <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </label>
                <label className="al-edit-field">
                  <span>Gói</span>
                  <select value={String(editForm.premiumActive)} onChange={e => setEditForm(f => ({ ...f, premiumActive: e.target.value === "true" }))}>
                    <option value="false">Free</option>
                    <option value="true">Premium</option>
                  </select>
                </label>
                <label className="al-edit-field">
                  <span>Trạng thái</span>
                  <select value={String(editForm.active)} onChange={e => setEditForm(f => ({ ...f, active: e.target.value === "true" }))}>
                    <option value="true">Hoạt động</option>
                    <option value="false">Đã khoá</option>
                  </select>
                </label>
              </div>
              <div className="al-modal-actions">
                <button className="al-add-btn" disabled={updating === editUser.id} onClick={saveEdit}>
                  {updating === editUser.id ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
                <button className="al-refresh-btn" onClick={() => setEditUser(null)}>Hủy</button>
              </div>
            </div>
          </div>
        )}

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

function fmtPace(distanceMeters: number, durationMinutes: number, sport: "RUN" | "SWIM"): string {
  if (distanceMeters <= 0 || durationMinutes <= 0) return "—";
  if (sport === "RUN") {
    const paceMinPerKm = durationMinutes / (distanceMeters / 1000);
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.round((paceMinPerKm - mins) * 60);
    return `${mins}'${String(secs).padStart(2, "0")}" /km`;
  } else {
    const secPer100m = (durationMinutes * 60) / (distanceMeters / 100);
    const mins = Math.floor(secPer100m / 60);
    const secs = Math.round(secPer100m % 60);
    return `${mins}'${String(secs).padStart(2, "0")}" /100m`;
  }
}

function isToday(dateStr: string) {
  const d = new Date(dateStr); const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}
function isWithin7Days(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() <= 7 * 24 * 60 * 60 * 1000;
}
function isThisMonth(dateStr: string) {
  const d = new Date(dateStr); const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function ActivitiesPage({ session }: { session: AdminSession }) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [overview, setOverview] = useState<ActivityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [sportFilter, setSportFilter] = useState<"ALL" | "RUN" | "SWIM">("ALL");
  const [timeFilter, setTimeFilter] = useState<"ALL" | "TODAY" | "7D" | "MONTH">("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [detailActivity, setDetailActivity] = useState<ActivityItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ActivityItem | null>(null);

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
  useEffect(() => { setCurrentPage(1); }, [search, sportFilter, timeFilter, pageSize]);

  async function confirmDeleteActivity() {
    if (!confirmDelete) return;
    setDeleting(confirmDelete.id);
    setConfirmDelete(null);
    try {
      await del(session.token, `/api/activities/admin/${confirmDelete.id}`);
      setActivities(prev => prev.filter(a => a.id !== confirmDelete.id));
      if (overview) setOverview(prev => prev ? { ...prev, totalActivities: prev.totalActivities - 1 } : prev);
    } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi xoá"); }
    finally { setDeleting(null); }
  }

  const totalDistKm = activities.reduce((s, a) => s + a.distanceMeters, 0) / 1000;
  const totalCalories = activities.reduce((s, a) => s + (a.calories ?? 0), 0);

  const filtered = activities.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.title.toLowerCase().includes(q) || a.athleteName.toLowerCase().includes(q);
    const matchSport = sportFilter === "ALL" || a.sportType === sportFilter;
    const matchTime =
      timeFilter === "ALL" ||
      (timeFilter === "TODAY" && isToday(a.startedAt)) ||
      (timeFilter === "7D" && isWithin7Days(a.startedAt)) ||
      (timeFilter === "MONTH" && isThisMonth(a.startedAt));
    return matchSearch && matchSport && matchTime;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <PageHeader title="Quản lý hoạt động" sub={`${activities.length} hoạt động trong hệ thống`} />
      <div className="al-content">

        {/* ── Stats ── */}
        <div className="al-stats-row" style={{ gridTemplateColumns: "repeat(5,1fr)" }}>
          {[
            { label: "Tổng hoạt động", value: overview?.totalActivities ?? activities.length, color: "#f97316", suffix: "" },
            { label: "Chạy bộ", value: overview?.runActivities ?? activities.filter(a => a.sportType === "RUN").length, color: "#3b82f6", suffix: "" },
            { label: "Bơi lội", value: overview?.swimActivities ?? activities.filter(a => a.sportType === "SWIM").length, color: "#06b6d4", suffix: "" },
            { label: "Tổng quãng đường", value: totalDistKm.toFixed(0), color: "#22c55e", suffix: " km" },
            { label: "Tổng calories", value: Math.round(totalCalories / 1000), color: "#ef4444", suffix: "k kcal" },
          ].map(c => (
            <div key={c.label} className="al-stat-card">
              <div className="al-stat-value" style={{ fontSize: "1.5rem", color: c.color }}>{c.value}{c.suffix}</div>
              <div className="al-stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="al-controls" style={{ flexWrap: "wrap", gap: 8 }}>
          <div className="al-search-wrap">
            <Search size={14} className="al-search-icon" />
            <input className="al-search" placeholder="Tìm người dùng hoặc tiêu đề..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="al-tabs">
            {(["ALL", "RUN", "SWIM"] as const).map(s => (
              <button key={s} className={`al-tab${sportFilter === s ? " active" : ""}`} onClick={() => setSportFilter(s)}>
                {s === "ALL" ? "Tất cả môn" : s === "RUN" ? "Chạy bộ" : "Bơi lội"}
              </button>
            ))}
          </div>
          <div className="al-tabs">
            {([["ALL", "Mọi thời gian"], ["TODAY", "Hôm nay"], ["7D", "7 ngày"], ["MONTH", "Tháng này"]] as const).map(([id, label]) => (
              <button key={id} className={`al-tab${timeFilter === id ? " active" : ""}`} onClick={() => setTimeFilter(id)}>
                {label}
              </button>
            ))}
          </div>
          <button className="al-refresh-btn" style={{ marginLeft: "auto" }} onClick={load}><RefreshCw size={13} /> Làm mới</button>
        </div>

        {/* ── Table ── */}
        <div className="al-table-wrap">
          {loading ? <div className="al-loading">Đang tải...</div>
            : error ? <ErrMsg msg={error} />
            : filtered.length === 0 ? <div className="al-empty">Không có hoạt động phù hợp</div>
            : (
              <>
                <table className="al-table">
                  <thead><tr>
                    <th>Vận động viên</th>
                    <th>Môn</th>
                    <th>Tiêu đề</th>
                    <th>Khoảng cách</th>
                    <th>Thời gian</th>
                    <th>Pace</th>
                    <th>Calories</th>
                    <th>Ngày</th>
                    <th>Thao tác</th>
                  </tr></thead>
                  <tbody>
                    {paginated.map(a => (
                      <tr key={a.id}>
                        <td>
                          <div className="al-user-cell">
                            <div className="al-avatar" style={{ background: avatarColor(a.userId), width: 32, height: 32, fontSize: "0.72rem" }}>
                              {initials(a.athleteName)}
                            </div>
                            <div>
                              <div className="al-uname" style={{ fontSize: "0.83rem" }}>{a.athleteName}</div>
                              <div className="al-uemail">ID {a.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`al-badge ${a.sportType === "RUN" ? "badge-run" : "badge-swim"}`}>
                            {a.sportType === "RUN" ? "Chạy" : "Bơi"}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>{a.title}</span>
                        </td>
                        <td><span className="al-date">{fmtDist(a.distanceMeters)}</span></td>
                        <td><span className="al-date">{a.durationMinutes} phút</span></td>
                        <td><span className="al-date" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtPace(a.distanceMeters, a.durationMinutes, a.sportType)}</span></td>
                        <td><span className="al-date">{a.calories != null ? `${a.calories} kcal` : "—"}</span></td>
                        <td><span className="al-date">{fmtDate(a.startedAt)}</span></td>
                        <td>
                          <div className="al-actions">
                            <button className="al-action-btn blue" onClick={() => setDetailActivity(a)}>
                              <Eye size={12} /> Chi tiết
                            </button>
                            <button className="al-action-btn red" disabled={deleting === a.id}
                              onClick={() => setConfirmDelete(a)}>
                              <Trash2 size={12} /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="al-pagination">
                  <div className="al-page-size">
                    <span>Hiển thị</span>
                    <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                      {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span>/ trang</span>
                  </div>
                  <div className="al-page-nav">
                    <button className="al-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>← Trước</button>
                    <span className="al-page-info">Trang {currentPage} / {totalPages} &nbsp;·&nbsp; {filtered.length} kết quả</span>
                    <button className="al-page-btn" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Tiếp →</button>
                  </div>
                </div>
              </>
            )}
        </div>

        {/* ── Detail Modal ── */}
        {detailActivity && (
          <div className="al-modal-overlay" onClick={() => setDetailActivity(null)}>
            <div className="al-modal-box al-modal-detail" onClick={e => e.stopPropagation()}>
              <button className="al-modal-close" onClick={() => setDetailActivity(null)}><X size={15} /></button>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="al-avatar large" style={{ background: avatarColor(detailActivity.userId), width: 48, height: 48, fontSize: "1rem" }}>
                  {initials(detailActivity.athleteName)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>{detailActivity.title}</div>
                  <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginTop: 2 }}>
                    {detailActivity.athleteName} · {fmtDate(detailActivity.startedAt)}
                  </div>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span className={`al-badge ${detailActivity.sportType === "RUN" ? "badge-run" : "badge-swim"}`}>
                    {detailActivity.sportType === "RUN" ? "Chạy bộ" : "Bơi lội"}
                  </span>
                </div>
              </div>

              {/* Key metrics grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
                {[
                  { label: "Khoảng cách", value: fmtDist(detailActivity.distanceMeters) },
                  { label: "Thời gian", value: `${detailActivity.durationMinutes} phút` },
                  { label: "Pace TB", value: fmtPace(detailActivity.distanceMeters, detailActivity.durationMinutes, detailActivity.sportType) },
                  { label: "Calories", value: detailActivity.calories != null ? `${detailActivity.calories} kcal` : "—" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
                      {m.label}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* GPS map placeholder */}
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
                  GPS Route
                </div>
                {detailActivity.gpsRoute && detailActivity.gpsRoute.length > 0 ? (
                  <div style={{ background: "#e2e8f0", borderRadius: 10, height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.85rem" }}>
                    Bản đồ GPS · {detailActivity.gpsRoute.length} điểm
                  </div>
                ) : (
                  <div style={{ background: "#f8fafc", border: "1px dashed var(--border)", borderRadius: 10, height: 100, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.83rem" }}>
                    Không có dữ liệu GPS
                  </div>
                )}
              </div>

              {/* Notes */}
              {detailActivity.notes && (
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Ghi chú</div>
                  <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: "0.88rem", color: "var(--text-primary)", lineHeight: 1.6 }}>
                    {detailActivity.notes}
                  </div>
                </div>
              )}

              {/* Footer actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
                <button className="al-action-btn red" disabled={deleting === detailActivity.id}
                  onClick={() => { setConfirmDelete(detailActivity); setDetailActivity(null); }}>
                  <Trash2 size={12} /> Xóa hoạt động
                </button>
                <button className="al-refresh-btn" onClick={() => setDetailActivity(null)}>Đóng</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm Delete Modal ── */}
        {confirmDelete && (
          <div className="al-modal-overlay" onClick={() => setConfirmDelete(null)}>
            <div className="al-modal-box" style={{ maxWidth: 400, textAlign: "center", gap: 16 }} onClick={e => e.stopPropagation()}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 6 }}>Xác nhận xóa hoạt động</div>
                <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  Bạn có chắc muốn xóa hoạt động <strong>"{confirmDelete.title}"</strong> của <strong>{confirmDelete.athleteName}</strong>?
                  <br />Hành động này không thể hoàn tác.
                </div>
              </div>
              <div className="al-modal-actions">
                <button className="al-action-btn red" style={{ padding: "8px 20px", fontSize: "0.88rem" }}
                  onClick={confirmDeleteActivity}>
                  Xóa hoạt động
                </button>
                <button className="al-refresh-btn" onClick={() => setConfirmDelete(null)}>Hủy bỏ</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

// ─── Routes Page ──────────────────────────────────────────────────────────────

function RoutesPage({ session }: { session: AdminSession }) {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [detailRoute, setDetailRoute] = useState<RouteItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<RouteItem | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const loadStats = useCallback(async () => {
    try { setStats(await get<RouteStats>(session.token, "/api/activities/admin/routes/stats")); }
    catch { /* ignore */ }
  }, [session.token]);

  const loadRoutes = useCallback(async (pg = 0, sz = 10, q = "", sp = "ALL") => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(pg), size: String(sz), sport: sp, ...(q ? { search: q } : {}) });
      const data = await get<{ content: RouteItem[]; totalElements: number; totalPages: number }>(
        session.token, `/api/activities/admin/routes?${params}`
      );
      setRoutes(data.content);
      setTotal(data.totalElements);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    loadStats();
    loadRoutes(0, pageSize, search, sportFilter);
  }, []); // eslint-disable-line

  function applyFilters() {
    setCurrentPage(0);
    loadRoutes(0, pageSize, search, sportFilter);
  }

  async function doDelete(route: RouteItem) {
    setDeleting(route.id);
    try {
      await del(session.token, `/api/activities/admin/routes/${route.id}`);
      setConfirmDelete(null);
      loadRoutes(currentPage, pageSize, search, sportFilter);
      loadStats();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi xóa lộ trình");
    } finally {
      setDeleting(null);
    }
  }


  return (
    <>
      <PageHeader title="Quản lý lộ trình" sub="Danh sách các lộ trình người dùng lưu trong hệ thống" />
      <div className="al-content">

        {/* Stats */}
        {stats && (
          <div className="al-stats-row" style={{ marginBottom: 20 }}>
            {[
              { label: "Tổng lộ trình", value: stats.total, color: "#3b82f6" },
              { label: "Chạy bộ (RUN)", value: stats.run,   color: "#f97316" },
              { label: "Bơi lội (SWIM)", value: stats.swim, color: "#06b6d4" },
            ].map(c => (
              <div key={c.label} className="al-stat-card">
                <div className="al-stat-value" style={{ color: c.color }}>{c.value.toLocaleString("vi-VN")}</div>
                <div className="al-stat-label">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="al-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 220px" }}>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--al-muted)" }}>Tìm kiếm</label>
              <div className="al-search-wrap">
                <Search size={14} className="al-search-icon" />
                <input
                  className="al-search"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="Tên lộ trình..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && applyFilters()}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--al-muted)" }}>Môn thể thao</label>
              <select className="al-select" value={sportFilter} onChange={e => setSportFilter(e.target.value)}>
                <option value="ALL">Tất cả</option>
                <option value="RUN">Chạy bộ</option>
                <option value="SWIM">Bơi lội</option>
              </select>
            </div>
            <button className="al-add-btn" onClick={applyFilters}><Search size={13} /> Tìm kiếm</button>
            <button className="al-refresh-btn" onClick={() => { setSearch(""); setSportFilter("ALL"); setCurrentPage(0); loadRoutes(0, pageSize, "", "ALL"); loadStats(); }}>
              <RefreshCw size={13} /> Đặt lại
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="al-card">
          {loading && <div className="al-loading">Đang tải...</div>}
          {error   && <ErrMsg msg={error} />}
          {!loading && !error && (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="al-table">
                  <thead>
                    <tr>
                      <th>Tên lộ trình</th>
                      <th>Người tạo</th>
                      <th>Môn</th>
                      <th>Khoảng cách</th>
                      <th>Ngày tạo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--al-muted)", padding: "32px 0" }}>Không có lộ trình nào</td></tr>
                    )}
                    {routes.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500, maxWidth: 180 }}>{r.name}</td>
                        <td style={{ color: "var(--al-muted)", fontSize: 13 }}>
                          {r.createdBy ? `User #${r.createdBy}` : "Hệ thống"}
                        </td>
                        <td>
                          <span className={`al-badge ${r.sportType === "RUN" ? "badge-run" : "badge-swim"}`}>
                            {r.sportType === "RUN" ? "Chạy" : "Bơi"}
                          </span>
                        </td>
                        <td>{fmtDist(r.distanceMeters)}</td>
                        <td style={{ fontSize: 12 }}>{fmtDate(r.createdAt)}</td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button className="al-icon-btn" title="Chi tiết" onClick={() => setDetailRoute(r)}><Eye size={14} /></button>
                            <button className="al-icon-btn danger" title="Xóa" onClick={() => setConfirmDelete(r)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="al-pagination">
                <div className="al-page-size">
                  Hiển thị
                  <select className="al-select" value={pageSize} onChange={e => { const s = Number(e.target.value); setPageSize(s); setCurrentPage(0); loadRoutes(0, s, search, sportFilter); }}>
                    {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  / {total} lộ trình
                </div>
                <div className="al-page-nav">
                  <button className="al-page-btn" disabled={currentPage === 0} onClick={() => { setCurrentPage(p => p - 1); loadRoutes(currentPage - 1, pageSize, search, sportFilter); }}>‹</button>
                  <span className="al-page-info">Trang {currentPage + 1} / {Math.max(1, totalPages)}</span>
                  <button className="al-page-btn" disabled={currentPage >= totalPages - 1} onClick={() => { setCurrentPage(p => p + 1); loadRoutes(currentPage + 1, pageSize, search, sportFilter); }}>›</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Detail modal ── */}
      {detailRoute && (
        <div className="al-modal-overlay" onClick={() => setDetailRoute(null)}>
          <div className="al-modal-box al-modal-detail" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <button className="al-modal-close" onClick={() => setDetailRoute(null)}><X size={16} /></button>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Chi tiết lộ trình</div>

            <div className="al-detail-info-grid">
              {[
                ["Tên lộ trình",  detailRoute.name],
                ["Người tạo",    detailRoute.createdBy ? `User #${detailRoute.createdBy}` : "Hệ thống"],
                ["Môn thể thao", detailRoute.sportType === "RUN" ? "Chạy bộ" : "Bơi lội"],
                ["Khoảng cách",  fmtDist(detailRoute.distanceMeters)],
                ["Địa điểm",     detailRoute.place || "—"],
                ["Ghi chú",      detailRoute.note || "—"],
                ["Ngày tạo",     fmtDate(detailRoute.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="al-detail-info-row">
                  <span className="al-detail-info-label">{label}</span>
                  <span className="al-detail-info-val">{value}</span>
                </div>
              ))}
              <div className="al-detail-info-row">
                <span className="al-detail-info-label">Hiển thị</span>
                <span className={`al-badge ${detailRoute.visibility === "PRIVATE" ? "badge-inactive" : "badge-active"}`}>
                  {detailRoute.visibility === "PRIVATE" ? "Riêng tư" : "Công khai"}
                </span>
              </div>
            </div>

            {/* GPS Map */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--al-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Bản đồ lộ trình GPS
              </div>
              <RouteLeafletMap geoJson={detailRoute.geoJson} height={300} />
            </div>

            <div className="al-modal-actions" style={{ marginTop: 20 }}>
              <button className="al-delete-btn" onClick={() => { setDetailRoute(null); setConfirmDelete(detailRoute); }}>
                <Trash2 size={13} /> Xóa lộ trình
              </button>
              <button className="al-refresh-btn" onClick={() => setDetailRoute(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete modal ── */}
      {confirmDelete && (
        <div className="al-modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="al-modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Xóa lộ trình</div>
            <p style={{ color: "var(--al-muted)", marginBottom: 20 }}>
              Xác nhận xóa lộ trình <strong>"{confirmDelete.name}"</strong>? Hành động này không thể hoàn tác.
            </p>
            <div className="al-modal-actions">
              <button className="al-delete-btn" disabled={deleting === confirmDelete.id} onClick={() => doDelete(confirmDelete)}>
                <Trash2 size={13} /> {deleting === confirmDelete.id ? "Đang xóa..." : "Xóa"}
              </button>
              <button className="al-refresh-btn" onClick={() => setConfirmDelete(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
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
                  <th>Thứ tự</th><th>Mã</th><th>Tên</th><th>Danh mục</th>
                  <th>Backend</th><th>Trạng thái</th><th>Hành động</th>
                </tr></thead>
                <tbody>
                  {[...sports].sort((a, b) => a.sortOrder - b.sortOrder).map(s => (
                    <tr key={s.id}>
                      <td><span className="al-date">{s.sortOrder}</span></td>
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

  // ── Meal Logs state ──────────────────────────────────────────────────────────
  const [mealLogs, setMealLogs] = useState<AdminMealLog[]>([]);
  const [mealLogsLoading, setMealLogsLoading] = useState(false);
  const [mealLogsError, setMealLogsError] = useState("");
  const [mealSearch, setMealSearch] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState<"ALL" | "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("ALL");
  const [mealTimeFilter, setMealTimeFilter] = useState<"ALL" | "TODAY" | "7D" | "MONTH">("ALL");
  const [mealPage, setMealPage] = useState(1);
  const [mealPageSize, setMealPageSize] = useState(10);
  const [detailMeal, setDetailMeal] = useState<AdminMealLog | null>(null);
  const [confirmMealDelete, setConfirmMealDelete] = useState<AdminMealLog | null>(null);
  const [deletingMeal, setDeletingMeal] = useState<number | null>(null);

  const loadMealLogs = useCallback(async () => {
    setMealLogsLoading(true); setMealLogsError("");
    try {
      const data = await get<AdminMealLog[]>(session.token, "/api/nutrition/admin/meal-logs");
      setMealLogs(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setMealLogsError(e instanceof Error ? e.message : "Lỗi tải meal logs");
    } finally {
      setMealLogsLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    if (nutPage === "meals") loadMealLogs();
  }, [nutPage, loadMealLogs]);

  useEffect(() => { setMealPage(1); }, [mealSearch, mealTypeFilter, mealTimeFilter, mealPageSize]);

  async function deleteMealLog(log: AdminMealLog) {
    setDeletingMeal(log.id);
    setConfirmMealDelete(null);
    try {
      await del(session.token, `/api/nutrition/admin/meal-logs/${log.id}`);
      setMealLogs(prev => prev.filter(m => m.id !== log.id));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi xóa meal log");
    } finally {
      setDeletingMeal(null);
    }
  }

  function mealTypeLabel(t: string) {
    return ({ BREAKFAST: "Sáng", LUNCH: "Trưa", DINNER: "Tối", SNACK: "Snack" } as Record<string, string>)[t] ?? t;
  }
  function mealTypeColor(t: string) {
    return ({ BREAKFAST: "#f97316", LUNCH: "#3b82f6", DINNER: "#8b5cf6", SNACK: "#22c55e" } as Record<string, string>)[t] ?? "#64748b";
  }
  function isMealToday(d: string) { const dt = new Date(d), n = new Date(); return dt.getFullYear()===n.getFullYear()&&dt.getMonth()===n.getMonth()&&dt.getDate()===n.getDate(); }
  function isMeal7D(d: string) { return Date.now() - new Date(d).getTime() <= 7*24*60*60*1000; }
  function isMealMonth(d: string) { const dt = new Date(d), n = new Date(); return dt.getFullYear()===n.getFullYear()&&dt.getMonth()===n.getMonth(); }

  const filteredMeals = mealLogs.filter(m => {
    const q = mealSearch.toLowerCase();
    const matchSearch = m.userName.toLowerCase().includes(q);
    const matchType = mealTypeFilter === "ALL" || m.mealType === mealTypeFilter;
    const matchTime = mealTimeFilter === "ALL"
      || (mealTimeFilter === "TODAY" && isMealToday(m.loggedAt))
      || (mealTimeFilter === "7D" && isMeal7D(m.loggedAt))
      || (mealTimeFilter === "MONTH" && isMealMonth(m.loggedAt));
    return matchSearch && matchType && matchTime;
  });
  const mealTotalPages = Math.max(1, Math.ceil(filteredMeals.length / mealPageSize));
  const paginatedMeals = filteredMeals.slice((mealPage - 1) * mealPageSize, mealPage * mealPageSize);

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
    meals:      { title: "Meal Logs",        sub: "Nhật ký bữa ăn của người dùng trong hệ thống" },
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
                  { label: "Món ăn đang hoạt động",  value: overview.activeFoods,    color: "#22c55e" },
                  { label: "Tổng món trong hệ thống", value: overview.totalFoods,     color: "#3b82f6" },
                  { label: "Người dùng dinh dưỡng",   value: overview.usersWithPlans, color: "#a855f7" },
                  { label: "Lượt ghi nhận bữa ăn",   value: overview.mealsLogged,    color: "#f97316" },
                  { label: "Tổng calo hôm nay",       value: overview.caloriesToday,  color: "#ef4444" },
                ].map(card => (
                  <div key={card.label} className="al-stat-card">
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

      {/* ══ MEALS ══ */}
        {nutPage === "meals" && (
          <div>
            {/* Stats */}
            <div className="al-stats-row" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 20 }}>
              {[
                { label: "Tổng meal logs",    value: mealLogs.length,                                         color: "#3b82f6" },
                { label: "Hôm nay",           value: mealLogs.filter(m => isMealToday(m.loggedAt)).length,    color: "#f97316" },
                { label: "Tổng calories TB",  value: mealLogs.length > 0 ? Math.round(mealLogs.reduce((s,m) => s + m.totalCalories, 0) / mealLogs.length) : 0, color: "#ef4444" },
                { label: "Người dùng",        value: new Set(mealLogs.map(m => m.userId)).size,               color: "#22c55e" },
              ].map(c => (
                <div key={c.label} className="al-stat-card">
                  <div className="al-stat-value" style={{ color: c.color }}>{c.value}</div>
                  <div className="al-stat-label">{c.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="al-controls" style={{ flexWrap: "wrap", gap: 8 }}>
              <div className="al-search-wrap">
                <Search size={14} className="al-search-icon" />
                <input className="al-search" placeholder="Tìm tên người dùng..." value={mealSearch} onChange={e => setMealSearch(e.target.value)} />
              </div>
              <div className="al-tabs">
                {([["ALL","Tất cả"],["BREAKFAST","Sáng"],["LUNCH","Trưa"],["DINNER","Tối"],["SNACK","Snack"]] as const).map(([id, label]) => (
                  <button key={id} className={`al-tab${mealTypeFilter === id ? " active" : ""}`} onClick={() => setMealTypeFilter(id)}>{label}</button>
                ))}
              </div>
              <div className="al-tabs">
                {([["ALL","Mọi lúc"],["TODAY","Hôm nay"],["7D","7 ngày"],["MONTH","Tháng này"]] as const).map(([id, label]) => (
                  <button key={id} className={`al-tab${mealTimeFilter === id ? " active" : ""}`} onClick={() => setMealTimeFilter(id)}>{label}</button>
                ))}
              </div>
              <button className="al-refresh-btn" style={{ marginLeft: "auto" }} onClick={loadMealLogs}><RefreshCw size={13} /> Làm mới</button>
            </div>

            {/* Table */}
            <div className="al-table-wrap">
              {mealLogsLoading ? <div className="al-loading">Đang tải...</div>
                : mealLogsError ? <ErrMsg msg={mealLogsError} />
                : filteredMeals.length === 0 ? <div className="al-empty">Không có meal log phù hợp</div>
                : (
                  <>
                    <table className="al-table">
                      <thead><tr>
                        <th>Người dùng</th>
                        <th>Bữa ăn</th>
                        <th>Số món</th>
                        <th>Calories</th>
                        <th>Protein</th>
                        <th>Carb</th>
                        <th>Fat</th>
                        <th>Ngày ghi</th>
                        <th>Thao tác</th>
                      </tr></thead>
                      <tbody>
                        {paginatedMeals.map(m => (
                          <tr key={m.id}>
                            <td>
                              <div className="al-user-cell">
                                <div className="al-avatar" style={{ background: avatarColor(m.userId), width: 32, height: 32, fontSize: "0.72rem" }}>{initials(m.userName)}</div>
                                <div>
                                  <div className="al-uname" style={{ fontSize: "0.83rem" }}>{m.userName}</div>
                                  <div className="al-uemail">ID {m.userId}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="al-badge" style={{ background: `${mealTypeColor(m.mealType)}18`, color: mealTypeColor(m.mealType), border: "none" }}>
                                {mealTypeLabel(m.mealType)}
                              </span>
                            </td>
                            <td><span className="al-date">{m.itemCount} món</span></td>
                            <td><span className="al-date" style={{ fontWeight: 600, color: "#ef4444" }}>{m.totalCalories} kcal</span></td>
                            <td><span className="al-date">{m.totalProteinGrams}g</span></td>
                            <td><span className="al-date">{m.totalCarbsGrams}g</span></td>
                            <td><span className="al-date">{m.totalFatGrams}g</span></td>
                            <td><span className="al-date">{fmtDate(m.loggedAt)}</span></td>
                            <td>
                              <div className="al-actions">
                                <button className="al-action-btn blue" onClick={() => setDetailMeal(m)}><Eye size={12} /> Chi tiết</button>
                                <button className="al-action-btn red" disabled={deletingMeal === m.id} onClick={() => setConfirmMealDelete(m)}><Trash2 size={12} /> Xóa</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="al-pagination">
                      <div className="al-page-size">
                        <span>Hiển thị</span>
                        <select value={mealPageSize} onChange={e => setMealPageSize(Number(e.target.value))}>
                          {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span>/ trang</span>
                      </div>
                      <div className="al-page-nav">
                        <button className="al-page-btn" disabled={mealPage === 1} onClick={() => setMealPage(p => p - 1)}>← Trước</button>
                        <span className="al-page-info">Trang {mealPage} / {mealTotalPages} &nbsp;·&nbsp; {filteredMeals.length} kết quả</span>
                        <button className="al-page-btn" disabled={mealPage >= mealTotalPages} onClick={() => setMealPage(p => p + 1)}>Tiếp →</button>
                      </div>
                    </div>
                  </>
                )}
            </div>
          </div>
        )}

      </div>

      {/* ══ MEAL DETAIL MODAL ══ */}
      {detailMeal && (
        <div className="al-modal-overlay" onClick={() => setDetailMeal(null)}>
          <div className="al-modal-box al-modal-detail" onClick={e => e.stopPropagation()}>
            <button className="al-modal-close" onClick={() => setDetailMeal(null)}><X size={15} /></button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="al-avatar large" style={{ background: avatarColor(detailMeal.userId), width: 48, height: 48, fontSize: "1rem" }}>{initials(detailMeal.userName)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>{detailMeal.userName}</div>
                <div style={{ fontSize: "0.83rem", color: "var(--text-muted)", marginTop: 2 }}>{fmtDate(detailMeal.loggedAt)}</div>
              </div>
              <span className="al-badge" style={{ background: `${mealTypeColor(detailMeal.mealType)}18`, color: mealTypeColor(detailMeal.mealType), border: "none", fontSize: "0.8rem" }}>
                {mealTypeLabel(detailMeal.mealType)}
              </span>
            </div>

            {/* Macro summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
              {[
                { label: "Calories",  value: `${detailMeal.totalCalories} kcal`, color: "#ef4444" },
                { label: "Protein",   value: `${detailMeal.totalProteinGrams}g`,  color: "#3b82f6" },
                { label: "Carb",      value: `${detailMeal.totalCarbsGrams}g`,    color: "#f97316" },
                { label: "Fat",       value: `${detailMeal.totalFatGrams}g`,      color: "#a855f7" },
              ].map(m => (
                <div key={m.label} style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Items list */}
            <div>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>
                Danh sách món ({detailMeal.itemCount} món)
              </div>
              {detailMeal.items && detailMeal.items.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {detailMeal.items.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>{item.name}</div>
                        {item.servingSize && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>{item.servings ? `${item.servings} × ` : ""}{item.servingSize}</div>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.88rem" }}>{item.calories} kcal</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>P:{item.proteinGrams}g C:{item.carbsGrams}g F:{item.fatGrams}g</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "#f8fafc", border: "1px dashed var(--border)", borderRadius: 8, padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  Không có thông tin chi tiết món ăn
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 4, borderTop: "1px solid var(--border)" }}>
              <button className="al-action-btn red" disabled={deletingMeal === detailMeal.id}
                onClick={() => { setConfirmMealDelete(detailMeal); setDetailMeal(null); }}>
                <Trash2 size={12} /> Xóa meal log
              </button>
              <button className="al-refresh-btn" onClick={() => setDetailMeal(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MEAL DELETE CONFIRM ══ */}
      {confirmMealDelete && (
        <div className="al-modal-overlay" onClick={() => setConfirmMealDelete(null)}>
          <div className="al-modal-box" style={{ maxWidth: 400, textAlign: "center", gap: 16 }} onClick={e => e.stopPropagation()}>
            <div className="al-modal-icon"><AlertCircle size={28} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)", marginBottom: 6 }}>Xác nhận xóa meal log</div>
              <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
                Xóa bữa <strong>{mealTypeLabel(confirmMealDelete.mealType)}</strong> của <strong>{confirmMealDelete.userName}</strong> ngày <strong>{fmtDate(confirmMealDelete.loggedAt)}</strong>?
                <br />Hành động này không thể hoàn tác.
              </div>
            </div>
            <div className="al-modal-actions">
              <button className="al-add-btn" onClick={() => deleteMealLog(confirmMealDelete)}>Xóa</button>
              <button className="al-refresh-btn" onClick={() => setConfirmMealDelete(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

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

// ─── Payment & Premium Management ────────────────────────────────────────────

const TX_STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Thành công", CREATED: "Đang xử lý", FAILED: "Thất bại", CANCELLED: "Đã hủy",
};
const TX_STATUS_CLASS: Record<string, string> = {
  COMPLETED: "badge-active", CREATED: "badge-pending", FAILED: "badge-inactive", CANCELLED: "badge-inactive",
};

function fmtMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

function PaymentAdminPage({ session, payPage }: { session: AdminSession; payPage: PayPage }) {
  // ── Transactions state ──────────────────────────────────────────────────────
  const [txList, setTxList] = useState<PaymentTx[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txLoading, setTxLoading] = useState(false);
  const [txError, setTxError] = useState("");
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("ALL");
  const [txPeriod, setTxPeriod] = useState("ALL");
  const [txPage, setTxPage] = useState(0);
  const [txSize, setTxSize] = useState(10);
  const [txTotalPages, setTxTotalPages] = useState(0);
  const [detailTx, setDetailTx] = useState<PaymentTx | null>(null);

  // ── Stats state ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<PaymentStats | null>(null);

  // ── Premium users state ─────────────────────────────────────────────────────
  const [premUsers, setPremUsers] = useState<AdminUser[]>([]);
  const [premLoading, setPremLoading] = useState(false);
  const [premError, setPremError] = useState("");
  const [premSearch, setPremSearch] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState<AdminUser | null>(null);
  const [confirmGrant, setConfirmGrant] = useState<AdminUser | null>(null);
  const [premActing, setPremActing] = useState<number | null>(null);

  // ── Load transactions ───────────────────────────────────────────────────────
  const loadTx = useCallback(async (pg = txPage, sz = txSize, search = txSearch, status = txStatus, period = txPeriod) => {
    setTxLoading(true); setTxError("");
    try {
      const params = new URLSearchParams({
        page: String(pg), size: String(sz),
        ...(search ? { search } : {}),
        status, period,
      });
      const data = await get<{ content: PaymentTx[]; totalElements: number; totalPages: number }>(
        session.token, `/api/payments/admin/transactions?${params}`
      );
      setTxList(data.content);
      setTxTotal(data.totalElements);
      setTxTotalPages(data.totalPages);
    } catch (e) {
      setTxError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setTxLoading(false);
    }
  }, [session.token, txPage, txSize, txSearch, txStatus, txPeriod]);

  // ── Load premium users + stats ──────────────────────────────────────────────
  const loadPremUsers = useCallback(async () => {
    setPremLoading(true); setPremError("");
    try {
      const users = await get<AdminUser[]>(session.token, "/api/auth/admin/users");
      const premList = users.filter(u => u.premiumActive);
      setPremUsers(users);
      // Pass premiumUsers count to stats endpoint
      const statsData = await get<PaymentStats>(
        session.token, `/api/payments/admin/stats?premiumUsers=${premList.length}`
      );
      setStats(statsData);
    } catch (e) {
      setPremError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
    } finally {
      setPremLoading(false);
    }
  }, [session.token]);

  useEffect(() => { if (payPage === "transactions") { loadTx(0, txSize, txSearch, txStatus, txPeriod); } }, [payPage]); // eslint-disable-line
  useEffect(() => { if (payPage === "premium") { loadPremUsers(); } }, [payPage, loadPremUsers]);

  // ── Revoke / Grant premium ──────────────────────────────────────────────────
  async function setPremium(userId: number, active: boolean) {
    setPremActing(userId);
    try {
      await patch<AdminUser>(session.token, `/api/auth/admin/users/${userId}`, { premiumActive: active });
      await loadPremUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Lỗi cập nhật");
    } finally {
      setPremActing(null);
      setConfirmRevoke(null);
      setConfirmGrant(null);
    }
  }

  // ── Tx search handler ────────────────────────────────────────────────────────
  function applyTxFilters() {
    setTxPage(0);
    loadTx(0, txSize, txSearch, txStatus, txPeriod);
  }

  const PAGE_TITLES: Record<PayPage, { title: string; sub: string }> = {
    transactions: { title: "Giao dịch thanh toán", sub: "Lịch sử và theo dõi thanh toán trong hệ thống" },
    premium: { title: "Quản lý Premium", sub: "Danh sách người dùng Premium và thao tác cấp/thu hồi" },
  };

  const filteredPrem = premUsers.filter(u =>
    u.premiumActive &&
    (premSearch === "" || u.fullName.toLowerCase().includes(premSearch.toLowerCase()) || u.email.toLowerCase().includes(premSearch.toLowerCase()))
  );

  return (
    <>
      <PageHeader title={PAGE_TITLES[payPage].title} sub={PAGE_TITLES[payPage].sub} />
      <div className="al-content">

        {/* ── TRANSACTIONS TAB ── */}
        {payPage === "transactions" && (
          <>
            {/* Stats row */}
            {stats && (
              <div className="al-stats-row" style={{ marginBottom: 20 }}>
                {[
                  { label: "Tổng giao dịch",    value: stats.totalTransactions.toLocaleString("vi-VN"),        color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
                  { label: "Doanh thu",          value: fmtMoney(stats.totalRevenue),                           color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
                  { label: "Người dùng Premium", value: stats.totalPremiumUsers.toLocaleString("vi-VN"),        color: "#eab308", bg: "rgba(234,179,8,0.1)" },
                  { label: "Thành công",         value: stats.successfulTransactions.toLocaleString("vi-VN"),   color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
                  { label: "Thất bại",           value: stats.failedTransactions.toLocaleString("vi-VN"),       color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
                ].map(c => (
                  <div key={c.label} className="al-stat-card">
                    <div className="al-stat-value" style={{ color: c.color }}>{c.value}</div>
                    <div className="al-stat-label">{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="al-card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--al-muted)" }}>Tìm kiếm</label>
                  <div className="al-search-wrap">
                    <Search size={14} className="al-search-icon" />
                    <input
                      className="al-search"
                      style={{ width: "100%", boxSizing: "border-box" }}
                      placeholder="Tên người dùng, email..."
                      value={txSearch}
                      onChange={e => setTxSearch(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && applyTxFilters()}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--al-muted)" }}>Trạng thái</label>
                  <select className="al-select" value={txStatus} onChange={e => setTxStatus(e.target.value)}>
                    <option value="ALL">Tất cả</option>
                    <option value="COMPLETED">Thành công</option>
                    <option value="CREATED">Đang xử lý</option>
                    <option value="FAILED">Thất bại</option>
                    <option value="CANCELLED">Đã hủy</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, marginBottom: 4, color: "var(--al-muted)" }}>Thời gian</label>
                  <select className="al-select" value={txPeriod} onChange={e => setTxPeriod(e.target.value)}>
                    <option value="ALL">Tất cả</option>
                    <option value="TODAY">Hôm nay</option>
                    <option value="7D">7 ngày qua</option>
                    <option value="MONTH">30 ngày qua</option>
                  </select>
                </div>
                <button className="al-add-btn" onClick={applyTxFilters}><Search size={13} /> Tìm kiếm</button>
                <button className="al-refresh-btn" onClick={() => { setTxSearch(""); setTxStatus("ALL"); setTxPeriod("ALL"); loadTx(0, txSize, "", "ALL", "ALL"); }}>
                  <RefreshCw size={13} /> Đặt lại
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="al-card">
              {txLoading && <div className="al-loading">Đang tải...</div>}
              {txError  && <ErrMsg msg={txError} />}
              {!txLoading && !txError && (
                <>
                  <div style={{ overflowX: "auto" }}>
                    <table className="al-table">
                      <thead>
                        <tr>
                          <th>Mã GD</th><th>Người dùng</th><th>Email</th>
                          <th>Gói</th><th>Số tiền</th><th>Phương thức</th>
                          <th>Trạng thái</th><th>Thời gian</th><th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {txList.length === 0 && (
                          <tr><td colSpan={9} style={{ textAlign: "center", color: "var(--al-muted)", padding: "32px 0" }}>Không có giao dịch nào</td></tr>
                        )}
                        {txList.map(tx => (
                          <tr key={tx.id}>
                            <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{tx.orderId.slice(0, 12)}…</span></td>
                            <td>{tx.userName ?? `User #${tx.userId}`}</td>
                            <td style={{ color: "var(--al-muted)", fontSize: 13 }}>{tx.userEmail ?? "—"}</td>
                            <td><span className="al-badge badge-active">{tx.plan ?? "PREMIUM"}</span></td>
                            <td style={{ fontWeight: 600 }}>{fmtMoney(tx.amount, tx.currency)}</td>
                            <td>{tx.provider}</td>
                            <td><span className={`al-badge ${TX_STATUS_CLASS[tx.status] ?? "badge-pending"}`}>{TX_STATUS_LABEL[tx.status] ?? tx.status}</span></td>
                            <td style={{ fontSize: 12 }}>{fmtDate(tx.createdAt)}</td>
                            <td>
                              <button className="al-icon-btn" title="Chi tiết" onClick={() => setDetailTx(tx)}><Eye size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="al-pagination">
                    <div className="al-page-size">
                      Hiển thị
                      <select className="al-select" value={txSize} onChange={e => { const s = Number(e.target.value); setTxSize(s); loadTx(0, s, txSearch, txStatus, txPeriod); }}>
                        {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                      / {txTotal} giao dịch
                    </div>
                    <div className="al-page-nav">
                      <button className="al-page-btn" disabled={txPage === 0} onClick={() => { setTxPage(txPage - 1); loadTx(txPage - 1, txSize, txSearch, txStatus, txPeriod); }}>‹</button>
                      <span className="al-page-info">Trang {txPage + 1} / {Math.max(1, txTotalPages)}</span>
                      <button className="al-page-btn" disabled={txPage >= txTotalPages - 1} onClick={() => { setTxPage(txPage + 1); loadTx(txPage + 1, txSize, txSearch, txStatus, txPeriod); }}>›</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── PREMIUM USERS TAB ── */}
        {payPage === "premium" && (
          <>
            {/* Stats */}
            {stats && (
              <div className="al-stats-row" style={{ marginBottom: 20 }}>
                {[
                  { label: "Tổng Premium",  value: stats.totalPremiumUsers.toLocaleString("vi-VN"),       color: "#eab308" },
                  { label: "Doanh thu",      value: fmtMoney(stats.totalRevenue),                          color: "#22c55e" },
                  { label: "Giao dịch",      value: stats.totalTransactions.toLocaleString("vi-VN"),       color: "#3b82f6" },
                ].map(c => (
                  <div key={c.label} className="al-stat-card">
                    <div className="al-stat-value" style={{ color: c.color }}>{c.value}</div>
                    <div className="al-stat-label">{c.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="al-card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div className="al-search-wrap" style={{ flex: 1 }}>
                  <Search size={14} className="al-search-icon" />
                  <input className="al-search" style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="Tìm theo tên hoặc email..."
                    value={premSearch} onChange={e => setPremSearch(e.target.value)} />
                </div>
                <button className="al-refresh-btn" onClick={loadPremUsers}><RefreshCw size={13} /> Làm mới</button>
              </div>
            </div>

            {/* Table */}
            <div className="al-card">
              {premLoading && <div className="al-loading">Đang tải...</div>}
              {premError  && <ErrMsg msg={premError} />}
              {!premLoading && !premError && (
                <div style={{ overflowX: "auto" }}>
                  <table className="al-table">
                    <thead>
                      <tr>
                        <th>Người dùng</th><th>Email</th><th>Vai trò</th>
                        <th>Premium từ</th><th>Trạng thái TK</th><th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPrem.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--al-muted)", padding: "32px 0" }}>Không có người dùng Premium</td></tr>
                      )}
                      {filteredPrem.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="al-user-avatar" style={{ background: avatarColor(u.id), width: 30, height: 30, fontSize: 11 }}>{initials(u.fullName)}</div>
                              <span style={{ fontWeight: 500 }}>{u.fullName}</span>
                            </div>
                          </td>
                          <td style={{ color: "var(--al-muted)", fontSize: 13 }}>{u.email}</td>
                          <td><span className="al-badge badge-pending">{u.role}</span></td>
                          <td style={{ fontSize: 12 }}>{u.premiumSince ? fmtDate(u.premiumSince) : "—"}</td>
                          <td><span className={`al-badge ${u.active ? "badge-active" : "badge-inactive"}`}>{u.active ? "Hoạt động" : "Đã khóa"}</span></td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className="al-add-btn" style={{ fontSize: 12, padding: "4px 10px" }}
                                disabled={premActing === u.id}
                                onClick={() => setConfirmGrant(u)}
                                title="Gia hạn Premium"
                              >
                                <BadgeCheck size={13} /> Gia hạn
                              </button>
                              <button
                                className="al-delete-btn" style={{ fontSize: 12, padding: "4px 10px" }}
                                disabled={premActing === u.id}
                                onClick={() => setConfirmRevoke(u)}
                                title="Thu hồi Premium"
                              >
                                <Ban size={13} /> Thu hồi
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Non-premium users who can be granted */}
            <div className="al-card" style={{ marginTop: 20 }}>
              <div className="al-card-title" style={{ marginBottom: 12 }}>Cấp Premium thủ công</div>
              <div style={{ overflowX: "auto" }}>
                <table className="al-table">
                  <thead>
                    <tr><th>Người dùng</th><th>Email</th><th>Trạng thái</th><th>Thao tác</th></tr>
                  </thead>
                  <tbody>
                    {premUsers.filter(u => !u.premiumActive && (premSearch === "" || u.fullName.toLowerCase().includes(premSearch.toLowerCase()) || u.email.toLowerCase().includes(premSearch.toLowerCase()))).slice(0, 10).map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="al-user-avatar" style={{ background: avatarColor(u.id), width: 30, height: 30, fontSize: 11 }}>{initials(u.fullName)}</div>
                            <span style={{ fontWeight: 500 }}>{u.fullName}</span>
                          </div>
                        </td>
                        <td style={{ color: "var(--al-muted)", fontSize: 13 }}>{u.email}</td>
                        <td><span className="al-badge badge-inactive">Miễn phí</span></td>
                        <td>
                          <button className="al-add-btn" style={{ fontSize: 12, padding: "4px 10px" }} disabled={premActing === u.id} onClick={() => setConfirmGrant(u)}>
                            <BadgeCheck size={13} /> Cấp Premium
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Transaction detail modal ── */}
      {detailTx && (
        <div className="al-modal-backdrop" onClick={() => setDetailTx(null)}>
          <div className="al-modal-box al-modal-detail" onClick={e => e.stopPropagation()}>
            <button className="al-modal-close" onClick={() => setDetailTx(null)}><X size={16} /></button>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Chi tiết giao dịch</div>
            <div className="al-detail-info-grid">
              {[
                ["Mã giao dịch", detailTx.orderId],
                ["Người dùng",   detailTx.userName ?? `User #${detailTx.userId}`],
                ["Email",        detailTx.userEmail ?? "—"],
                ["Gói Premium",  detailTx.plan ?? "PREMIUM"],
                ["Số tiền",      fmtMoney(detailTx.amount, detailTx.currency)],
                ["Phương thức",  detailTx.provider],
                ["Trạng thái",   TX_STATUS_LABEL[detailTx.status] ?? detailTx.status],
                ["Ngày tạo",     fmtDate(detailTx.createdAt)],
                ["Cập nhật",     fmtDate(detailTx.updatedAt)],
              ].map(([label, value]) => (
                <div key={label} className="al-detail-info-row">
                  <span className="al-detail-info-label">{label}</span>
                  <span className="al-detail-info-val">{value}</span>
                </div>
              ))}
              <div className="al-detail-info-row">
                <span className="al-detail-info-label">Trạng thái</span>
                <span className={`al-badge ${TX_STATUS_CLASS[detailTx.status] ?? "badge-pending"}`}>{TX_STATUS_LABEL[detailTx.status] ?? detailTx.status}</span>
              </div>
            </div>
            <div className="al-modal-actions">
              <button className="al-refresh-btn" onClick={() => setDetailTx(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm revoke modal ── */}
      {confirmRevoke && (
        <div className="al-modal-backdrop" onClick={() => setConfirmRevoke(null)}>
          <div className="al-modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Thu hồi Premium</div>
            <p style={{ color: "var(--al-muted)", marginBottom: 20 }}>
              Bạn có chắc muốn thu hồi Premium của <strong>{confirmRevoke.fullName}</strong>? Người dùng sẽ mất quyền truy cập Premium ngay lập tức.
            </p>
            <div className="al-modal-actions">
              <button className="al-delete-btn" disabled={premActing === confirmRevoke.id} onClick={() => setPremium(confirmRevoke.id, false)}>
                <Ban size={13} /> {premActing === confirmRevoke.id ? "Đang xử lý..." : "Thu hồi"}
              </button>
              <button className="al-refresh-btn" onClick={() => setConfirmRevoke(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm grant modal ── */}
      {confirmGrant && (
        <div className="al-modal-backdrop" onClick={() => setConfirmGrant(null)}>
          <div className="al-modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Cấp Premium</div>
            <p style={{ color: "var(--al-muted)", marginBottom: 20 }}>
              Xác nhận cấp / gia hạn Premium cho <strong>{confirmGrant.fullName}</strong>?
            </p>
            <div className="al-modal-actions">
              <button className="al-add-btn" disabled={premActing === confirmGrant.id} onClick={() => setPremium(confirmGrant.id, true)}>
                <BadgeCheck size={13} /> {premActing === confirmGrant.id ? "Đang xử lý..." : "Xác nhận cấp"}
              </button>
              <button className="al-refresh-btn" onClick={() => setConfirmGrant(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
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
        {page.startsWith("nutrition/")     && <NutritionAdminPage session={session} nutPage={page.split("/")[1] as NutPage} />}
        {page.startsWith("payment/")       && <PaymentAdminPage session={session} payPage={page.split("/")[1] as PayPage} />}
        {page === "sports"                 && <SportsManagementPage session={session} />}
      </div>
    </div>
  );
}

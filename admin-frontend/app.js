const API_PREFIX = "/api";
const TOKEN_KEY = "fitlife-admin-token";

let authToken = "";
let usersCache = [];
let workoutPlansCache = [];
let workoutSessionsCache = [];
let exerciseLibraryCache = [];
let editingExerciseLibraryId = null;
let selectedWorkoutPlanId = null;
let selectedWorkoutPlanDetail = null;
let nutritionPlansCache = [];
let progressLogsCache = [];
let activeView = "users";
let selectedUserId = null;
let selectedUserDetail = null;
let selectedUserNotice = "";
let currentUserPage = 1;
let totalUserPages = 1;
let userPageSize = 5;

const refs = {
  authScreen: document.getElementById("authScreen"),
  adminShell: document.getElementById("adminShell"),
  authStatus: document.getElementById("authStatus"),
  loginForm: document.getElementById("loginForm"),
  emailInput: document.getElementById("emailInput"),
  passwordInput: document.getElementById("passwordInput"),

  sidebar: document.getElementById("sidebar"),
  topbarTitle: document.getElementById("topbarTitle"),
  menuToggle: document.getElementById("menuToggle"),
  logoutBtn: document.getElementById("logoutBtn"),
  statusBar: document.getElementById("statusBar"),
  centerNotification: document.getElementById("centerNotification"),

  navUsers: document.getElementById("navUsers"),
  navWorkout: document.getElementById("navWorkout"),
  navNutrition: document.getElementById("navNutrition"),
  navProgress: document.getElementById("navProgress"),

  usersView: document.getElementById("usersView"),
  workoutView: document.getElementById("workoutView"),
  nutritionView: document.getElementById("nutritionView"),
  progressView: document.getElementById("progressView"),

  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  searchBtn: document.getElementById("searchBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  lastUpdated: document.getElementById("lastUpdated"),
  pageSizeSelect: document.getElementById("pageSizeSelect"),
  prevPageBtn: document.getElementById("prevPageBtn"),
  nextPageBtn: document.getElementById("nextPageBtn"),
  pageInfo: document.getElementById("pageInfo"),
  userRows: document.getElementById("userRows"),
  userDetailModal: document.getElementById("userDetailModal"),
  closeUserDetailBtn: document.getElementById("closeUserDetailBtn"),
  userDetailBody: document.getElementById("userDetailBody"),
  userDetailHint: document.getElementById("userDetailHint"),

  workoutStatus: document.getElementById("workoutStatus"),
  workoutUserIdInput: document.getElementById("workoutUserIdInput"),
  workoutPlanSearchInput: document.getElementById("workoutPlanSearchInput"),
  workoutPlanDifficultyFilter: document.getElementById("workoutPlanDifficultyFilter"),
  loadWorkoutBtn: document.getElementById("loadWorkoutBtn"),
  generateWorkoutBtn: document.getElementById("generateWorkoutBtn"),
  workoutPlanCount: document.getElementById("workoutPlanCount"),
  workoutSessionCount: document.getElementById("workoutSessionCount"),
  workoutCompletedCount: document.getElementById("workoutCompletedCount"),
  workoutGoalLabel: document.getElementById("workoutGoalLabel"),
  workoutAverageDuration: document.getElementById("workoutAverageDuration"),
  workoutPlanRows: document.getElementById("workoutPlanRows"),
  workoutDetailBody: document.getElementById("workoutDetailBody"),
  workoutPlanEditorPanel: document.getElementById("workoutPlanEditorPanel"),
  workoutPlanEditorId: document.getElementById("workoutPlanEditorId"),
  workoutPlanNameInput: document.getElementById("workoutPlanNameInput"),
  workoutPlanDescriptionInput: document.getElementById("workoutPlanDescriptionInput"),
  workoutPlanDifficultyInput: document.getElementById("workoutPlanDifficultyInput"),
  workoutPlanGoalInput: document.getElementById("workoutPlanGoalInput"),
  workoutPlanSplitInput: document.getElementById("workoutPlanSplitInput"),
  workoutPlanDurationInput: document.getElementById("workoutPlanDurationInput"),
  workoutPlanDaysPerWeekInput: document.getElementById("workoutPlanDaysPerWeekInput"),
  saveWorkoutPlanBtn: document.getElementById("saveWorkoutPlanBtn"),
  resetWorkoutPlanBtn: document.getElementById("resetWorkoutPlanBtn"),
  workoutSessionRows: document.getElementById("workoutSessionRows"),
  exerciseLibraryKeywordInput: document.getElementById("exerciseLibraryKeywordInput"),
  loadExerciseLibraryBtn: document.getElementById("loadExerciseLibraryBtn"),
  exerciseLibraryNameInput: document.getElementById("exerciseLibraryNameInput"),
  exerciseLibraryMuscleInput: document.getElementById("exerciseLibraryMuscleInput"),
  exerciseLibraryVideoInput: document.getElementById("exerciseLibraryVideoInput"),
  exerciseLibraryGuidanceInput: document.getElementById("exerciseLibraryGuidanceInput"),
  exerciseLibraryHighlightInput: document.getElementById("exerciseLibraryHighlightInput"),
  exerciseLibraryTechnicalInput: document.getElementById("exerciseLibraryTechnicalInput"),
  saveExerciseLibraryBtn: document.getElementById("saveExerciseLibraryBtn"),
  resetExerciseLibraryFormBtn: document.getElementById("resetExerciseLibraryFormBtn"),
  exerciseLibraryRows: document.getElementById("exerciseLibraryRows"),

  nutritionStatus: document.getElementById("nutritionStatus"),
  nutritionUserIdInput: document.getElementById("nutritionUserIdInput"),
  loadNutritionBtn: document.getElementById("loadNutritionBtn"),
  generateNutritionBtn: document.getElementById("generateNutritionBtn"),
  nutritionPlanCount: document.getElementById("nutritionPlanCount"),
  nutritionTargetCalories: document.getElementById("nutritionTargetCalories"),
  nutritionCaloriesProgress: document.getElementById("nutritionCaloriesProgress"),
  nutritionPlanStatus: document.getElementById("nutritionPlanStatus"),
  nutritionPlanRows: document.getElementById("nutritionPlanRows"),
  nutritionMealBody: document.getElementById("nutritionMealBody"),

  progressStatus: document.getElementById("progressStatus"),
  progressUserIdInput: document.getElementById("progressUserIdInput"),
  loadProgressBtn: document.getElementById("loadProgressBtn"),
  addProgressBtn: document.getElementById("addProgressBtn"),
  progressDateInput: document.getElementById("progressDateInput"),
  progressActivityInput: document.getElementById("progressActivityInput"),
  progressMinutesInput: document.getElementById("progressMinutesInput"),
  progressWeightInput: document.getElementById("progressWeightInput"),
  progressNotesInput: document.getElementById("progressNotesInput"),
  progressLogCount: document.getElementById("progressLogCount"),
  progressMinutesTotal: document.getElementById("progressMinutesTotal"),
  progressLatestWeight: document.getElementById("progressLatestWeight"),
  progressLatestDate: document.getElementById("progressLatestDate"),
  progressRows: document.getElementById("progressRows")
};

const viewConfig = {
  users: {
    title: "Quản trị người dùng FitLife",
    nav: refs.navUsers,
    panel: refs.usersView
  },
  workout: {
    title: "Quản lý kế hoạch tập luyện",
    nav: refs.navWorkout,
    panel: refs.workoutView
  },
  nutrition: {
    title: "Quản lý kế hoạch dinh dưỡng",
    nav: refs.navNutrition,
    panel: refs.nutritionView
  },
  progress: {
    title: "Quản lý tiến độ",
    nav: refs.navProgress,
    panel: refs.progressView
  }
};

function normalizeRole(role) {
  return String(role || "USER").toUpperCase().replace("ROLE_", "");
}

function normalizeStatus(status) {
  return String(status || "ACTIVE").toUpperCase();
}

function getStatusLabel(status) {
  switch (normalizeStatus(status)) {
    case "LOCKED":
      return "Đã khóa";
    case "DELETED":
      return "Đã xóa";
    default:
      return "Đang hoạt động";
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setStatusBar(el, message, isError = false) {
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("error", Boolean(isError));
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function setAuthStatus(message, isError = false) {
  setStatusBar(refs.authStatus, message, isError);
}

function stripHtmlTags(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readErrorMessage(response, fallbackMessage) {
  const status = Number(response?.status || 0);
  const contentType = String(response.headers?.get("content-type") || "").toLowerCase();

  if (status === 502 || status === 503 || status === 504) {
    return "Hệ thống API đang tạm thời chưa sẵn sàng (gateway lỗi). Vui lòng thử lại sau vài giây.";
  }

  let raw = "";
  try {
    raw = await response.text();
  } catch {
    raw = "";
  }

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(raw || "{}");
      const msg = parsed?.message || parsed?.error || parsed?.detail;
      if (msg) return String(msg);
    } catch {
      // Ignore malformed JSON and fallback below.
    }
  }

  const cleaned = stripHtmlTags(raw);
  if (cleaned) {
    return cleaned.length > 220 ? `${cleaned.slice(0, 220)}...` : cleaned;
  }

  if (status === 401) {
    return "Email hoặc mật khẩu không đúng.";
  }

  if (status === 403) {
    return "Tài khoản không có quyền truy cập.";
  }

  return fallbackMessage || `Yêu cầu thất bại (HTTP ${status || "?"}).`;
}

function setStatus(message, type = "info") {
  setStatusBar(refs.statusBar, message, type === "error");
}

function setWorkoutStatus(message, isError = false) {
  setStatusBar(refs.workoutStatus, message, isError);
}

function setNutritionStatus(message, isError = false) {
  setStatusBar(refs.nutritionStatus, message, isError);
}

function setProgressStatus(message, isError = false) {
  setStatusBar(refs.progressStatus, message, isError);
}

function showCenteredStatus(message, type = "info", duration = 3500) {
  const el = refs.centerNotification || document.getElementById("centerNotification");
  if (!el) return;
  el.textContent = message;
  // normalize classes
  el.classList.remove("error", "success", "info");
  if (type === "error") {
    el.classList.add("error");
  } else if (type === "success") {
    el.classList.add("success");
  } else {
    el.classList.add("info");
  }
  el.classList.remove("hidden");
  if (el._hideTimer) {
    clearTimeout(el._hideTimer);
  }
  el._hideTimer = setTimeout(() => {
    el.classList.add("hidden");
    el._hideTimer = null;
  }, duration);
}

function setActiveView(view) {
  if (!viewConfig[view]) return;

  activeView = view;

  Object.entries(viewConfig).forEach(([key, config]) => {
    config.panel.classList.toggle("hidden", key !== view);
    config.nav.classList.toggle("active", key === view);
  });

  refs.topbarTitle.textContent = viewConfig[view].title;
  refs.sidebar.classList.remove("open");

  if (view === "workout" && authToken && refs.exerciseLibraryRows && exerciseLibraryCache.length === 0) {
    loadExerciseLibrary().catch((error) => {
      setWorkoutStatus(error.message || "Không thể tải thư viện bài tập.", true);
    });
  }
}

function clearToken() {
  authToken = "";
  localStorage.removeItem(TOKEN_KEY);
}

function saveToken(token) {
  authToken = token;
  localStorage.setItem(TOKEN_KEY, token);
}

function showAuthScreen() {
  refs.authScreen.classList.remove("hidden");
  refs.adminShell.classList.add("hidden");
  refs.authScreen.style.display = "grid";
  refs.adminShell.style.display = "none";
}

function showAdminShell() {
  refs.authScreen.classList.add("hidden");
  refs.adminShell.classList.remove("hidden");
  refs.authScreen.style.display = "none";
  refs.adminShell.style.display = "grid";
}

function openUserDetailModal() {
  if (!refs.userDetailModal) return;
  refs.userDetailModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeUserDetailModal() {
  if (!refs.userDetailModal) return;
  refs.userDetailModal.classList.add("hidden");
  document.body.style.overflow = "";
}

function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(payload)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isAdminToken(token) {
  const payload = parseJwtPayload(token);
  if (!payload) return false;

  if (normalizeRole(payload.role) !== "ADMIN") return false;

  if (typeof payload.exp === "number") {
    const expiresAt = payload.exp * 1000;
    if (Date.now() >= expiresAt) return false;
  }

  return true;
}

async function login(email, password) {
  const retryDelays = [0, 800, 1500, 2200];
  let lastError = null;

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    const delay = retryDelays[attempt];
    if (delay > 0) {
      await sleep(delay);
    }

    const response = await fetch(`${API_PREFIX}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const rawToken = (await response.text()).trim();
      const token = rawToken.replace(/^"|"$/g, "");

      if (!isAdminToken(token)) {
        throw new Error("Tài khoản không có quyền ADMIN để vào trang quản trị.");
      }

      return token;
    }

    const status = Number(response.status || 0);
    const message = await readErrorMessage(response, "Đăng nhập thất bại.");
    const isGatewayTemporaryError = status === 502 || status === 503 || status === 504;

    if (!isGatewayTemporaryError || attempt === retryDelays.length - 1) {
      throw new Error(`Đăng nhập thất bại: ${message}`);
    }

    lastError = message;
  }

  throw new Error(`Đăng nhập thất bại: ${lastError || "Hệ thống API chưa sẵn sàng."}`);
}

async function request(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${authToken}`
  };

  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    if (response.status === 401 || response.status === 403) {
      clearToken();
      showAuthScreen();
      setAuthStatus("Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.", true);
    }
    throw new Error(`HTTP ${response.status}: ${errorMessage}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

function parseUserId(inputEl) {
  const value = Number(inputEl.value || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.floor(value);
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function formatWorkoutMinutes(value) {
  const minutes = Number(value || 0);
  return `${Math.max(0, Math.round(minutes))}m`;
}

function parseOptionalInteger(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.floor(parsed));
}

function isWorkoutDifficultyMatch(planDifficulty, filterValue) {
  const normalizedDifficulty = normalizePlainText(planDifficulty);
  switch (filterValue) {
    case "BEGINNER":
      return normalizedDifficulty.includes("beginner") || normalizedDifficulty.includes("new") || normalizedDifficulty.includes("thap");
    case "INTERMEDIATE":
      return normalizedDifficulty.includes("intermediate") || normalizedDifficulty.includes("trung") || normalizedDifficulty.includes("medium");
    case "ADVANCED":
      return normalizedDifficulty.includes("advanced") || normalizedDifficulty.includes("cao") || normalizedDifficulty.includes("hard");
    default:
      return true;
  }
}

function getFilteredWorkoutPlans() {
  const searchTerm = normalizePlainText(refs.workoutPlanSearchInput?.value || "");
  const difficultyFilter = String(refs.workoutPlanDifficultyFilter?.value || "ALL").toUpperCase();

  return [...workoutPlansCache]
    .sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;

      if (rightTime !== leftTime) {
        return rightTime - leftTime;
      }

      return (Number(right.id || 0) - Number(left.id || 0));
    })
    .filter((plan) => {
      if (!isWorkoutDifficultyMatch(plan.difficulty, difficultyFilter)) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const searchable = normalizePlainText(
        [plan.name, plan.description, plan.goal, plan.trainingSplit, plan.difficulty]
          .filter(Boolean)
          .join(" ")
      );

      return searchable.includes(searchTerm);
    });
}

function fillWorkoutPlanEditor(plan) {
  selectedWorkoutPlanId = Number(plan?.id || 0) || null;
  selectedWorkoutPlanDetail = plan ? { ...plan } : null;

  if (!refs.workoutPlanEditorPanel) return;

  refs.workoutPlanEditorId.value = plan?.id ? String(plan.id) : "";
  refs.workoutPlanNameInput.value = String(plan?.name || "");
  refs.workoutPlanDescriptionInput.value = String(plan?.description || "");
  refs.workoutPlanDifficultyInput.value = String(plan?.difficulty || "");
  refs.workoutPlanGoalInput.value = String(plan?.goal || "");
  refs.workoutPlanSplitInput.value = String(plan?.trainingSplit || "");
  refs.workoutPlanDurationInput.value = plan?.durationWeeks ? String(plan.durationWeeks) : "";
  refs.workoutPlanDaysPerWeekInput.value = plan?.totalDaysPerWeek ? String(plan.totalDaysPerWeek) : "";
  refs.saveWorkoutPlanBtn.disabled = !selectedWorkoutPlanId;
  refs.resetWorkoutPlanBtn.disabled = !selectedWorkoutPlanId;
}

function clearWorkoutPlanEditor() {
  selectedWorkoutPlanId = null;
  selectedWorkoutPlanDetail = null;

  if (!refs.workoutPlanEditorPanel) return;

  refs.workoutPlanEditorId.value = "";
  refs.workoutPlanNameInput.value = "";
  refs.workoutPlanDescriptionInput.value = "";
  refs.workoutPlanDifficultyInput.value = "";
  refs.workoutPlanGoalInput.value = "";
  refs.workoutPlanSplitInput.value = "";
  refs.workoutPlanDurationInput.value = "";
  refs.workoutPlanDaysPerWeekInput.value = "";
  refs.saveWorkoutPlanBtn.disabled = true;
  refs.resetWorkoutPlanBtn.disabled = true;
}

function getWorkoutPlanPayloadFromEditor() {
  return {
    id: selectedWorkoutPlanId,
    userId: Number(selectedWorkoutPlanDetail?.userId || 0),
    name: refs.workoutPlanNameInput.value.trim(),
    description: refs.workoutPlanDescriptionInput.value.trim(),
    difficulty: refs.workoutPlanDifficultyInput.value.trim(),
    durationWeeks: parseOptionalInteger(refs.workoutPlanDurationInput.value),
    goal: refs.workoutPlanGoalInput.value.trim(),
    trainingSplit: refs.workoutPlanSplitInput.value.trim(),
    totalDaysPerWeek: parseOptionalInteger(refs.workoutPlanDaysPerWeekInput.value)
  };
}

function createWorkoutSessionBadge(session) {
  const badge = document.createElement("span");
  const completed = Boolean(session.completed);
  const running = !completed && !session.endTime;

  badge.className = `status-badge ${completed ? "active" : running ? "locked" : "deleted"}`;
  badge.textContent = completed ? "Hoàn tất" : running ? "Đang chạy" : "Tạm dừng";
  return badge;
}

function renderWorkoutSessions() {
  if (!refs.workoutSessionRows) return;

  refs.workoutSessionRows.innerHTML = "";

  const sessions = [...workoutSessionsCache].sort((left, right) => {
    const leftTime = left.startTime ? new Date(left.startTime).getTime() : 0;
    const rightTime = right.startTime ? new Date(right.startTime).getTime() : 0;

    return rightTime - leftTime;
  });

  if (!sessions.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "Người dùng này chưa có session tập luyện nào.";
    row.appendChild(cell);
    refs.workoutSessionRows.appendChild(row);
    return;
  }

  sessions.forEach((session) => {
    const row = document.createElement("tr");
    if (selectedWorkoutPlanId && Number(session.workoutPlanId) === Number(selectedWorkoutPlanId)) {
      row.classList.add("selected");
    }

    row.appendChild(createCell(String(session.id || "-")));
    row.appendChild(createCell(formatDateTime(session.startTime)));
    row.appendChild(createCell(formatDateTime(session.endTime)));
    row.appendChild(createCell(formatWorkoutMinutes(session.durationMinutes)));

    const statusCell = document.createElement("td");
    statusCell.appendChild(createWorkoutSessionBadge(session));
    row.appendChild(statusCell);

    row.appendChild(createCell(String(session.notes || "-")));
    refs.workoutSessionRows.appendChild(row);
  });
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createStatusBadge(status) {
  const badge = document.createElement("span");
  const normalized = normalizeStatus(status);
  badge.className = `status-badge ${normalized === "LOCKED" ? "locked" : normalized === "DELETED" ? "deleted" : "active"}`;
  badge.textContent = getStatusLabel(normalized);
  return badge;
}

function formatUserValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Có" : "Không";
  }

  return String(value);
}

function normalizePlainText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function toVietnameseGoal(value) {
  const normalized = normalizePlainText(value);
  if (!normalized) return value;

  if (normalized.includes("giam mo")) return "Giảm mỡ";
  if (normalized.includes("giam can") || normalized.includes("lose") || normalized.includes("fat")) return "Giảm cân";
  if (normalized.includes("tang co") || normalized.includes("build") || normalized.includes("muscle")) return "Tăng cơ";
  if (normalized.includes("duy tri") || normalized.includes("maintain")) return "Duy trì";
  if (normalized.includes("suc ben") || normalized.includes("endurance")) return "Tăng sức bền";

  return value;
}

function toVietnameseActivityLevel(value) {
  const normalized = normalizePlainText(value);
  if (!normalized) return value;

  if (normalized.includes("sedentary") || normalized.includes("beginner") || normalized.includes("new") || normalized.includes("thap")) {
    return "Ít vận động";
  }
  if (normalized.includes("light") || normalized.includes("1-2")) {
    return "Vận động nhẹ";
  }
  if (normalized.includes("moderate") || normalized.includes("intermediate") || normalized.includes("3-4")) {
    return "Trung bình";
  }
  if (normalized.includes("active") || normalized.includes("intense") || normalized.includes("5") || normalized.includes("6-7")) {
    return "Năng động";
  }
  if (normalized.includes("very_active") || normalized.includes("very") || normalized.includes("athlete")) {
    return "Rất năng động";
  }

  return value;
}

function hasMeaningfulValue(value) {
  return !(value === null || value === undefined || value === "");
}

function hasAnyProfileData(detail) {
  return [
    "age",
    "gender",
    "height",
    "weight",
    "onboardingGoal",
    "activityLevel",
    "specificGoal",
    "tdee",
    "targetCalories",
    "proteinTarget",
    "carbsTarget",
    "fatTarget",
    "mealsPerDay",
    "weeklyGoal"
  ].some((key) => hasMeaningfulValue(detail?.[key]));
}

function mergeUserDetailField(target, key, value) {
  if (hasMeaningfulValue(value)) {
    target[key] = value;
  }
}

async function enrichUserDetail(detail, userId) {
  const merged = detail && typeof detail === "object" ? { ...detail } : {};

  try {
    const profile = await request(`/users/${userId}/profile`);
    if (profile && typeof profile === "object") {
      [
        "age",
        "gender",
        "height",
        "weight",
        "onboardingGoal",
        "activityLevel",
        "specificGoal",
        "tdee",
        "weeklyGoal",
        "targetCalories",
        "proteinTarget",
        "carbsTarget",
        "fatTarget",
        "mealsPerDay"
      ].forEach((field) => {
        mergeUserDetailField(merged, field, profile[field]);
      });
    }
  } catch {
    // Keep admin detail data when profile endpoint is unavailable.
  }

  if (!hasMeaningfulValue(merged.age)
    || !hasMeaningfulValue(merged.height)
    || !hasMeaningfulValue(merged.weight)
    || !hasMeaningfulValue(merged.fitnessGoal)) {
    try {
      const user = await request(`/users/${userId}`);
      if (user && typeof user === "object") {
        mergeUserDetailField(merged, "age", user.age);
        mergeUserDetailField(merged, "gender", user.gender);
        mergeUserDetailField(merged, "height", user.height);
        mergeUserDetailField(merged, "weight", user.weight);
        mergeUserDetailField(merged, "fitnessGoal", user.fitnessGoal);
      }
    } catch {
      // Keep current detail data when user endpoint is unavailable.
    }
  }

  if (!hasMeaningfulValue(merged.fitnessGoal) && hasMeaningfulValue(merged.onboardingGoal)) {
    merged.fitnessGoal = merged.onboardingGoal;
  }

  return merged;
}

function buildUserDetailField(label, value) {
  return `
    <div class="user-detail-field">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(formatUserValue(value))}</strong>
    </div>
  `;
}

function createStatusBadgeMarkup(statusClass, label) {
  return `<span class="status-badge ${statusClass}">${escapeHtml(label)}</span>`;
}

function updateUserPagination(totalItems) {
  const safePageSize = Number.isFinite(userPageSize) && userPageSize > 0 ? Math.floor(userPageSize) : 5;
  const computedTotalPages = Math.max(1, Math.ceil(totalItems / safePageSize));

  totalUserPages = computedTotalPages;
  if (currentUserPage > totalUserPages) {
    currentUserPage = totalUserPages;
  }
  if (currentUserPage < 1) {
    currentUserPage = 1;
  }

  refs.pageInfo.textContent = `Trang ${currentUserPage}/${totalUserPages}`;
  refs.prevPageBtn.disabled = currentUserPage <= 1;
  refs.nextPageBtn.disabled = currentUserPage >= totalUserPages;
}

function getPagedUsers(users) {
  const start = (currentUserPage - 1) * userPageSize;
  return users.slice(start, start + userPageSize);
}

function renderUserDetail(detail = selectedUserDetail) {
  if (!refs.userDetailBody || !refs.userDetailHint) {
    return;
  }

  if (!detail) {
    refs.userDetailBody.className = "user-detail-empty";
    refs.userDetailBody.textContent = "Chưa có người dùng nào được chọn.";
    refs.userDetailHint.textContent = "Chọn một người dùng để xem thông tin cá nhân, profile và thao tác quản trị.";
    return;
  }

  const normalizedStatus = normalizeStatus(detail.status);
  const statusLabel = getStatusLabel(normalizedStatus);
  const statusClass = normalizedStatus === "LOCKED" ? "locked" : normalizedStatus === "DELETED" ? "deleted" : "active";
  const canLock = normalizedStatus === "ACTIVE";
  const canUnlock = normalizedStatus === "LOCKED";
  const canReset = normalizedStatus !== "DELETED";
  const canDelete = normalizedStatus !== "DELETED";
  const fitnessGoalLabel = toVietnameseGoal(detail.fitnessGoal || detail.onboardingGoal);
  const onboardingGoalLabel = toVietnameseGoal(detail.onboardingGoal);
  const activityLevelLabel = toVietnameseActivityLevel(detail.activityLevel);
  const specificGoalLabel = toVietnameseGoal(detail.specificGoal);
  refs.userDetailHint.textContent = `Đang xem chi tiết tài khoản #${detail.id || selectedUserId || "-"}`;
  refs.userDetailBody.className = "detail-list";
  refs.userDetailBody.innerHTML = `
    <article class="detail-card detail-summary">
      <div class="user-detail-header">
        <div>
          <h4>${escapeHtml(detail.name || "Chưa cập nhật")}</h4>
          <p>${escapeHtml(detail.email || "-")}</p>
        </div>
        ${createStatusBadgeMarkup(statusClass, statusLabel)}
      </div>
      ${selectedUserNotice ? `<div class="user-detail-note">${escapeHtml(selectedUserNotice)}</div>` : ""}
        <div class="user-detail-actions">
          ${canLock ? '<button type="button" class="inline-btn lock" data-user-action="lock">Khóa tài khoản</button>' : ""}
          ${canUnlock ? '<button type="button" class="inline-btn unlock" data-user-action="unlock">Mở khóa tài khoản</button>' : ""}
          ${canReset ? '<button type="button" class="inline-btn" data-user-action="reset">Reset mật khẩu</button>' : ""}
          ${canDelete ? '<button type="button" class="inline-btn danger" data-user-action="delete">Xóa vĩnh viễn</button>' : ""}
        </div>
    </article>

    <article class="detail-card">
      <h4>Thông tin cá nhân</h4>
      <div class="user-detail-grid">
        ${buildUserDetailField("Tên", detail.name)}
        ${buildUserDetailField("Email", detail.email)}
        ${buildUserDetailField("Tuổi", detail.age)}
        ${buildUserDetailField("Giới tính", detail.gender)}
        ${buildUserDetailField("Chiều cao", detail.height ? `${detail.height} cm` : null)}
        ${buildUserDetailField("Cân nặng", detail.weight ? `${detail.weight} kg` : null)}
      </div>
    </article>

    <article class="detail-card">
      <h4>Hồ sơ fitness</h4>
      <div class="user-detail-grid">
        ${buildUserDetailField("Mục tiêu fitness", fitnessGoalLabel)}
        ${buildUserDetailField("Mục tiêu onboarding", onboardingGoalLabel)}
        ${buildUserDetailField("Mức độ vận động", activityLevelLabel)}
        ${buildUserDetailField("Mục tiêu cụ thể", specificGoalLabel)}
        ${buildUserDetailField("TDEE", detail.tdee ? `${detail.tdee} kcal` : null)}
        ${buildUserDetailField("Mục tiêu calories", detail.targetCalories ? `${detail.targetCalories} kcal` : null)}
        ${buildUserDetailField("Protein", detail.proteinTarget ? `${detail.proteinTarget} g` : null)}
        ${buildUserDetailField("Carb", detail.carbsTarget ? `${detail.carbsTarget} g` : null)}
        ${buildUserDetailField("Fat", detail.fatTarget ? `${detail.fatTarget} g` : null)}
        ${buildUserDetailField("Bữa/ngày", detail.mealsPerDay)}
        ${buildUserDetailField("Mục tiêu tuần", detail.weeklyGoal)}
      </div>
    </article>
  `;

  refs.userDetailBody.querySelectorAll("[data-user-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.getAttribute("data-user-action");
      await handleUserAction(action, Number(detail.id || selectedUserId));
    });
  });
}

function renderUserRows(users) {
  refs.userRows.innerHTML = "";
  const sourceUsers = Array.isArray(users) ? users : [];
  const rowStartIndex = (currentUserPage - 1) * userPageSize;

  updateUserPagination(sourceUsers.length);

  if (sourceUsers.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "Không có dữ liệu phù hợp bộ lọc hiện tại.";
    row.appendChild(cell);
    refs.userRows.appendChild(row);
    return;
  }

  getPagedUsers(sourceUsers).forEach((user, index) => {
    const row = document.createElement("tr");
    const currentStatus = normalizeStatus(user.status);
    const userId = Number(user.id || 0);

    if (selectedUserId && Number(selectedUserId) === userId) {
      row.classList.add("selected");
    }

    row.appendChild(createCell(String(rowStartIndex + index + 1)));
    row.appendChild(createCell(String(user.name || "Chưa cập nhật")));
    row.appendChild(createCell(String(user.email || "-")));

    const statusCell = document.createElement("td");
    statusCell.appendChild(createStatusBadge(currentStatus));
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "user-action-group";

    if (currentStatus === "ACTIVE") {
      const lockButton = document.createElement("button");
      lockButton.type = "button";
      lockButton.className = "inline-btn lock";
      lockButton.textContent = "Khóa";
      lockButton.addEventListener("click", async () => {
        await handleUserAction("lock", userId);
      });
      actionWrap.appendChild(lockButton);
    } else if (currentStatus === "LOCKED") {
      const unlockButton = document.createElement("button");
      unlockButton.type = "button";
      unlockButton.className = "inline-btn unlock";
      unlockButton.textContent = "Mở khóa";
      unlockButton.addEventListener("click", async () => {
        await handleUserAction("unlock", userId);
      });
      actionWrap.appendChild(unlockButton);
    }

    if (currentStatus !== "DELETED") {
      const resetButton = document.createElement("button");
      resetButton.type = "button";
      resetButton.className = "inline-btn";
      resetButton.textContent = "Reset";
      resetButton.addEventListener("click", async () => {
        await handleUserAction("reset", userId);
      });
      actionWrap.appendChild(resetButton);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "inline-btn danger";
      deleteButton.textContent = "Xóa";
      deleteButton.addEventListener("click", async () => {
        await handleUserAction("delete", userId);
      });
      actionWrap.appendChild(deleteButton);
    }

    // Xem chi tiết ở cuối cùng (theo yêu cầu: Khóa, Reset, Xóa, Xem chi tiết)
    const detailButton = document.createElement("button");
    detailButton.type = "button";
    detailButton.className = "inline-btn";
    detailButton.textContent = "Xem chi tiết";
    detailButton.addEventListener("click", () => {
      openUserDetailModal();
      loadUserDetail(userId).catch((error) => {
        setStatus(error.message || "Không thể tải chi tiết user.", "error");
      });
    });
    actionWrap.appendChild(detailButton);

    actionCell.appendChild(actionWrap);
    row.appendChild(actionCell);

    refs.userRows.appendChild(row);
  });
}

function renderDashboard() {
  renderUserRows(usersCache);
}

async function loadUsers(resetPage = true) {
  if (!authToken) {
    showAuthScreen();
    setAuthStatus("Vui lòng đăng nhập để truy cập trang admin.", true);
    return;
  }

  if (resetPage) {
    currentUserPage = 1;
  }

  const keyword = refs.searchInput.value.trim();
  const params = new URLSearchParams();

  if (keyword) {
    params.set("search", keyword);
  }

  if (refs.statusFilter.value && refs.statusFilter.value !== "ALL") {
    params.set("status", refs.statusFilter.value);
  }

  const query = params.toString() ? `?${params.toString()}` : "";

  setStatus("Đang tải danh sách người dùng...");
  const users = await request(`/admin/users${query}`);
  usersCache = Array.isArray(users)
    ? users
      .filter((user) => normalizeRole(user.role) !== "ADMIN")
      .filter((user) => normalizeStatus(user.status) !== "DELETED")
    : [];

  if (selectedUserId && !usersCache.some((user) => Number(user.id) === Number(selectedUserId))) {
    selectedUserId = null;
    selectedUserDetail = null;
    selectedUserNotice = "";
    closeUserDetailModal();
  }

  renderDashboard();
  setStatus("");
}

async function loadUserDetail(userId) {
  const numericUserId = Number(userId || 0);
  if (!numericUserId) {
    return null;
  }

  openUserDetailModal();
  selectedUserId = numericUserId;
  selectedUserNotice = "";

  if (refs.userDetailHint) {
    refs.userDetailHint.textContent = `Đang tải chi tiết tài khoản #${numericUserId}...`;
  }

  if (refs.userDetailBody) {
    refs.userDetailBody.className = "user-detail-empty";
    refs.userDetailBody.textContent = `Đang tải chi tiết tài khoản #${numericUserId}...`;
  }

  try {
    const detail = await request(`/admin/users/${numericUserId}`);
    const enrichedDetail = await enrichUserDetail(detail, numericUserId);
    selectedUserDetail = enrichedDetail;

    if (!hasAnyProfileData(enrichedDetail)) {
      selectedUserNotice = "Người dùng chưa có dữ liệu profile/onboarding trong database hoặc chưa hoàn tất onboarding.";
    }

    renderUserDetail(enrichedDetail);
    return enrichedDetail;
  } catch (error) {
    selectedUserDetail = null;
    if (refs.userDetailBody) {
      refs.userDetailBody.className = "user-detail-empty";
      refs.userDetailBody.textContent = error.message || "Không thể tải chi tiết tài khoản.";
    }
    if (refs.userDetailHint) {
      refs.userDetailHint.textContent = "Không thể tải chi tiết tài khoản.";
    }
    throw error;
  }
}

async function refreshAfterMutation(userId, updatedUser, notice = "", isDeleteAction = false) {
  const numericUserId = Number(userId || 0);

  if (selectedUserDetail && Number(selectedUserDetail.id) === numericUserId) {
    if (updatedUser) {
      selectedUserDetail = { ...selectedUserDetail, ...updatedUser };
    } else {
      selectedUserDetail = null;
      selectedUserId = null;
    }
    selectedUserNotice = notice;
  }

  await loadUsers(false);

  if (isDeleteAction) {
    closeUserDetailModal();
    return;
  }

  if (selectedUserDetail && Number(selectedUserDetail.id) === numericUserId) {
    renderUserDetail(selectedUserDetail);
  }
}

async function handleUserAction(action, userId) {
  const numericUserId = Number(userId || 0);
  if (!numericUserId) {
    return;
  }

  try {
    setStatus(`Đang xử lý thao tác ${action} cho user #${numericUserId}...`);

    let updatedUser = null;
    let notice = "";

    switch (action) {
      case "lock":
        updatedUser = await request(`/admin/users/${numericUserId}/lock`, { method: "POST" });
        break;
      case "unlock":
        updatedUser = await request(`/admin/users/${numericUserId}/unlock`, { method: "POST" });
        break;
      case "delete": {
        const confirmed = window.confirm(`Bạn có chắc muốn xóa vĩnh viễn user #${numericUserId}?`);
        if (!confirmed) {
          setStatus("Đã hủy thao tác xóa.");
          return;
        }
        await request(`/admin/users/${numericUserId}`, { method: "DELETE" });
        break;
      }
      case "reset": {
        const resetResponse = await request(`/admin/users/${numericUserId}/force-reset-password`, { method: "POST" });
        updatedUser = resetResponse?.user || null;
        notice = resetResponse?.temporaryPassword
          ? `Mật khẩu tạm thời: ${resetResponse.temporaryPassword}`
          : "Đã tạo mật khẩu tạm thời.";
        break;
      }
      default:
        return;
    }

    await refreshAfterMutation(numericUserId, updatedUser, notice, action === "delete");

    if (action === "reset") {
      setStatus(`Đã tạo mật khẩu tạm thời cho user #${numericUserId}.`);
    } else if (action === "delete") {
      showCenteredStatus("Đã xóa thành công", "success", 4000);
    } else if (action === "lock") {
      setStatus(`Đã khóa user #${numericUserId}.`);
    } else if (action === "unlock") {
      setStatus("Cập nhật trạng thái tài khoản thành công.");
    }
  } catch (error) {
    setStatus(error.message || "Thao tác thất bại.", "error");
  }
}

function renderWorkoutKpis() {
  const completed = workoutSessionsCache.filter((session) => Boolean(session.completed)).length;
  const completedSessions = workoutSessionsCache.filter((session) => Boolean(session.completed) && Number(session.durationMinutes || 0) > 0);
  const totalCompletedDuration = completedSessions.reduce((sum, session) => sum + Number(session.durationMinutes || 0), 0);
  const averageDuration = completedSessions.length ? Math.round(totalCompletedDuration / completedSessions.length) : 0;

  refs.workoutPlanCount.textContent = String(workoutPlansCache.length);
  refs.workoutSessionCount.textContent = String(workoutSessionsCache.length);
  refs.workoutCompletedCount.textContent = String(completed);
  refs.workoutGoalLabel.textContent = selectedWorkoutPlanDetail?.goal || workoutPlansCache[0]?.goal || "-";
  if (refs.workoutAverageDuration) {
    refs.workoutAverageDuration.textContent = `${averageDuration}m`;
  }
}

function renderWorkoutDetail(detail) {
  if (!detail || !Array.isArray(detail.days) || detail.days.length === 0) {
    refs.workoutDetailBody.className = "detail-list empty";
    refs.workoutDetailBody.textContent = "Kế hoạch này chưa có chi tiết bài tập.";
    return;
  }

  const sortedDays = detail.days
    .slice()
    .sort((a, b) => Number(a.dayOrder || 0) - Number(b.dayOrder || 0))
  const dayCount = sortedDays.length;
  const exerciseCount = sortedDays.reduce((sum, day) => sum + (Array.isArray(day.exercises) ? day.exercises.length : 0), 0);
  const totalSets = sortedDays.reduce((sum, day) => {
    return sum + (Array.isArray(day.exercises)
      ? day.exercises.reduce((daySum, exercise) => {
          const setTemplates = Array.isArray(exercise.setTemplates) ? exercise.setTemplates : [];
          return daySum + setTemplates.reduce((setSum, setTemplate) => setSum + Number(setTemplate.sets || 0), 0);
        }, 0)
      : 0);
  }, 0);

  const summary = `
    <article class="detail-card detail-summary workout-plan-summary">
      <div class="user-detail-header">
        <div>
          <h4>${escapeHtml(detail.name || "Kế hoạch tập luyện")}</h4>
          <p>${escapeHtml(detail.goal || "-")} • ${escapeHtml(detail.trainingSplit || "-")} • ${escapeHtml(detail.difficulty || "-")}</p>
        </div>
        <div class="workout-detail-actions">
          <button type="button" class="inline-btn" data-plan-action="edit">Sửa kế hoạch</button>
          <button type="button" class="inline-btn" data-plan-action="refresh">Tải lại</button>
        </div>
      </div>
      <div class="workout-detail-stats">
        <div class="user-detail-field">
          <span>Số ngày</span>
          <strong>${escapeHtml(String(dayCount))}</strong>
        </div>
        <div class="user-detail-field">
          <span>Số bài tập</span>
          <strong>${escapeHtml(String(exerciseCount))}</strong>
        </div>
        <div class="user-detail-field">
          <span>Tổng set</span>
          <strong>${escapeHtml(String(totalSets))}</strong>
        </div>
        <div class="user-detail-field">
          <span>Ngày tạo</span>
          <strong>${escapeHtml(formatDateTime(detail.createdAt))}</strong>
        </div>
      </div>
      <div class="workout-plan-description">
        <strong>Mô tả:</strong>
        <span>${escapeHtml(detail.description || "Kế hoạch được tạo tự động từ hồ sơ người dùng.")}</span>
      </div>
    </article>
  `;

  const items = sortedDays
    .map((day) => {
      const exercises = Array.isArray(day.exercises) ? day.exercises : [];
      const dayExerciseCount = exercises.length;
      const exerciseHtml = exercises.length
        ? exercises.map((exercise) => {
          const setText = Array.isArray(exercise.setTemplates)
            ? exercise.setTemplates
              .map((set) => `${set.sets || 0} set x ${set.reps || "?"}`)
              .join(" | ")
            : "";
          return `
            <li>
              <strong>${exercise.name || "Bài tập"}</strong>
              <span>${exercise.muscleGroup || ""}</span>
              <p>${setText}</p>
            </li>
          `;
        }).join("")
        : "<li><p>Chưa có bài tập.</p></li>";

      return `
        <article class="detail-card">
          <div class="workout-day-header">
            <div>
              <h4>Ngày ${day.dayOrder || "?"}: ${day.name || "Buổi tập"}</h4>
              <p>${day.focus || "Không có mô tả mục tiêu."}</p>
            </div>
            <span class="status-badge active">${dayExerciseCount} bài tập</span>
          </div>
          <p class="workout-day-notes">${day.notes || "Chưa có ghi chú riêng cho ngày này."}</p>
          <ul>${exerciseHtml}</ul>
        </article>
      `;
    })
    .join("");

  refs.workoutDetailBody.className = "detail-list";
  refs.workoutDetailBody.innerHTML = summary + items;

  refs.workoutDetailBody.querySelectorAll("[data-plan-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.getAttribute("data-plan-action");

      if (action === "edit") {
        fillWorkoutPlanEditor(detail);
        if (refs.workoutPlanEditorPanel) {
          refs.workoutPlanEditorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (refs.workoutPlanNameInput) {
          refs.workoutPlanNameInput.focus();
        }
        setWorkoutStatus(`Đã nạp kế hoạch #${detail.id} vào form chỉnh sửa.`);
        return;
      }

      if (action === "refresh") {
        await loadWorkoutDetail(detail.id);
      }
    });
  });
}

async function loadWorkoutDetail(planId) {
  try {
    setWorkoutStatus(`Đang tải chi tiết kế hoạch #${planId}...`);
    const detail = await request(`/workouts/plans/${planId}/detail`);
    selectedWorkoutPlanId = Number(planId || 0) || null;
    selectedWorkoutPlanDetail = detail || null;
    fillWorkoutPlanEditor(detail);
    renderWorkoutDetail(detail);
    renderWorkoutKpis();
    renderWorkoutPlans();
    renderWorkoutSessions();
    setWorkoutStatus(`Đã tải chi tiết kế hoạch tập luyện #${planId}.`);
  } catch (error) {
    renderWorkoutDetail(null);
    setWorkoutStatus(error.message || "Không thể tải chi tiết kế hoạch tập luyện.", true);
  }
}

function renderWorkoutPlans() {
  refs.workoutPlanRows.innerHTML = "";
  const filteredPlans = getFilteredWorkoutPlans();

  if (!Array.isArray(workoutPlansCache) || workoutPlansCache.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "Người dùng này chưa có kế hoạch tập luyện.";
    row.appendChild(cell);
    refs.workoutPlanRows.appendChild(row);
    renderWorkoutDetail(null);
    clearWorkoutPlanEditor();
    return;
  }

  if (!filteredPlans.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "Không có kế hoạch nào khớp với bộ lọc hiện tại.";
    row.appendChild(cell);
    refs.workoutPlanRows.appendChild(row);
    return;
  }

  filteredPlans.forEach((plan) => {
    const row = document.createElement("tr");
    if (selectedWorkoutPlanId && Number(plan.id) === Number(selectedWorkoutPlanId)) {
      row.classList.add("selected");
    }

    row.appendChild(createCell(String(plan.id || "-")));
    row.appendChild(createCell(String(plan.name || "-")));
    row.appendChild(createCell(String(plan.difficulty || "-")));
    row.appendChild(createCell(String(plan.trainingSplit || "-")));
    row.appendChild(createCell(String(plan.durationWeeks || "-")));

    const actionCell = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "user-action-group";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "inline-btn";
    button.textContent = "Xem chi tiết";
    button.addEventListener("click", () => {
      loadWorkoutDetail(plan.id).catch(() => {
        setWorkoutStatus("Không thể tải chi tiết kế hoạch.", true);
      });
    });

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "inline-btn";
    editButton.textContent = "Sửa";
    editButton.addEventListener("click", async () => {
      try {
        await loadWorkoutDetail(plan.id);
        if (refs.workoutPlanEditorPanel) {
          refs.workoutPlanEditorPanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (refs.workoutPlanNameInput) {
          refs.workoutPlanNameInput.focus();
        }
      } catch {
        setWorkoutStatus("Không thể nạp kế hoạch vào form chỉnh sửa.", true);
      }
    });

    actionWrap.appendChild(button);
    actionWrap.appendChild(editButton);
    actionCell.appendChild(actionWrap);
    row.appendChild(actionCell);

    refs.workoutPlanRows.appendChild(row);
  });
}

async function loadWorkoutData() {
  const userId = parseUserId(refs.workoutUserIdInput);
  if (!userId) {
    setWorkoutStatus("Vui lòng nhập User ID hợp lệ.", true);
    return;
  }

  try {
    setWorkoutStatus("Đang tải dữ liệu kế hoạch tập luyện...");
    const [plans, sessions] = await Promise.all([
      request(`/workouts/plans/user/${userId}`),
      request(`/workouts/sessions/user/${userId}`)
    ]);

    workoutPlansCache = Array.isArray(plans) ? plans : [];
    workoutSessionsCache = Array.isArray(sessions) ? sessions : [];

    const preferredPlanId = selectedWorkoutPlanId && workoutPlansCache.some((plan) => Number(plan.id) === Number(selectedWorkoutPlanId))
      ? selectedWorkoutPlanId
      : workoutPlansCache[0]?.id || null;

    selectedWorkoutPlanId = preferredPlanId;
    selectedWorkoutPlanDetail = null;

    renderWorkoutKpis();
    renderWorkoutPlans();
    renderWorkoutSessions();

    if (preferredPlanId) {
      await loadWorkoutDetail(preferredPlanId);
    } else {
      renderWorkoutDetail(null);
      clearWorkoutPlanEditor();
      setWorkoutStatus("Người dùng chưa có kế hoạch tập luyện. Có thể bấm Tạo kế hoạch mẫu để khởi tạo.");
    }
  } catch (error) {
    setWorkoutStatus(error.message || "Không thể tải dữ liệu kế hoạch tập luyện.", true);
  }
}

async function generateWorkoutSample() {
  const userId = parseUserId(refs.workoutUserIdInput);
  if (!userId) {
    setWorkoutStatus("Vui lòng nhập User ID hợp lệ.", true);
    return;
  }

  try {
    setWorkoutStatus("Đang tạo kế hoạch tập luyện mẫu...");
    const profile = await request(`/profile/${userId}`);

    const payload = {
      userId,
      gender: String(profile?.gender || "other"),
      age: Number(profile?.age || 25),
      heightCm: Number(profile?.height || 170),
      weightKg: Number(profile?.weight || 65),
      goal: String(profile?.onboardingGoal || "maintain"),
      trainingLevel: String(profile?.activityLevel || "moderate"),
      preferences: Array.isArray(profile?.preferences) ? profile.preferences : []
    };

    await request("/workouts/generate-sample", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setWorkoutStatus("Đã tạo kế hoạch tập luyện mẫu thành công.");
    await loadWorkoutData();
  } catch (error) {
    setWorkoutStatus(error.message || "Không thể tạo kế hoạch tập luyện mẫu.", true);
  }
}

async function saveWorkoutPlanMeta() {
  const planId = Number(selectedWorkoutPlanId || 0);
  if (!planId) {
    setWorkoutStatus("Hãy chọn một kế hoạch để chỉnh sửa trước.", true);
    return;
  }

  const payload = getWorkoutPlanPayloadFromEditor();
  if (!payload.name) {
    setWorkoutStatus("Tên kế hoạch không được để trống.", true);
    refs.workoutPlanNameInput.focus();
    return;
  }

  try {
    setWorkoutStatus(`Đang lưu thay đổi kế hoạch #${planId}...`);
    const updatedPlan = await request(`/workouts/plans/${planId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    workoutPlansCache = workoutPlansCache.map((plan) => (Number(plan.id) === planId ? { ...plan, ...updatedPlan } : plan));
    selectedWorkoutPlanDetail = selectedWorkoutPlanDetail ? { ...selectedWorkoutPlanDetail, ...updatedPlan } : { ...updatedPlan };
    renderWorkoutKpis();
    renderWorkoutPlans();
    await loadWorkoutDetail(planId);
    setWorkoutStatus(`Đã lưu thay đổi kế hoạch #${planId}.`);
  } catch (error) {
    setWorkoutStatus(error.message || "Không thể lưu thay đổi kế hoạch.", true);
  }
}

function resetWorkoutPlanEditorForm() {
  if (selectedWorkoutPlanDetail) {
    fillWorkoutPlanEditor(selectedWorkoutPlanDetail);
    setWorkoutStatus("Đã khôi phục form theo kế hoạch đang chọn.");
    return;
  }

  clearWorkoutPlanEditor();
  setWorkoutStatus("Chưa có kế hoạch nào được chọn.", true);
}

function clearExerciseLibraryForm() {
  editingExerciseLibraryId = null;
  refs.exerciseLibraryNameInput.value = "";
  refs.exerciseLibraryMuscleInput.value = "";
  refs.exerciseLibraryVideoInput.value = "";
  refs.exerciseLibraryGuidanceInput.value = "";
  refs.exerciseLibraryHighlightInput.value = "";
  refs.exerciseLibraryTechnicalInput.value = "";
  refs.saveExerciseLibraryBtn.textContent = "Lưu bài tập";
}

function fillExerciseLibraryForm(item) {
  editingExerciseLibraryId = Number(item?.id || 0) || null;
  refs.exerciseLibraryNameInput.value = String(item?.displayName || "");
  refs.exerciseLibraryMuscleInput.value = String(item?.muscleGroup || "");
  refs.exerciseLibraryVideoInput.value = String(item?.videoUrl || "");
  refs.exerciseLibraryGuidanceInput.value = String(item?.guidance || "");
  refs.exerciseLibraryHighlightInput.value = String(item?.highlight || "");
  refs.exerciseLibraryTechnicalInput.value = String(item?.technicalNotes || "");
  refs.saveExerciseLibraryBtn.textContent = editingExerciseLibraryId ? "Cập nhật bài tập" : "Lưu bài tập";
}

function readExerciseLibraryPayload() {
  return {
    displayName: refs.exerciseLibraryNameInput.value.trim(),
    muscleGroup: refs.exerciseLibraryMuscleInput.value.trim(),
    videoUrl: refs.exerciseLibraryVideoInput.value.trim(),
    guidance: refs.exerciseLibraryGuidanceInput.value.trim(),
    highlight: refs.exerciseLibraryHighlightInput.value.trim(),
    technicalNotes: refs.exerciseLibraryTechnicalInput.value.trim()
  };
}

function renderExerciseLibraryRows() {
  refs.exerciseLibraryRows.innerHTML = "";

  if (!Array.isArray(exerciseLibraryCache) || exerciseLibraryCache.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "Chưa có bài tập trong thư viện. Hãy thêm mới để user xem hướng dẫn/video.";
    row.appendChild(cell);
    refs.exerciseLibraryRows.appendChild(row);
    return;
  }

  exerciseLibraryCache.forEach((item) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(String(item.id || "-")));
    row.appendChild(createCell(String(item.displayName || "-")));
    row.appendChild(createCell(String(item.muscleGroup || "-")));
    row.appendChild(createCell(item.videoUrl ? "Đã có video" : "Chưa có"));

    const actionCell = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "user-action-group";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "inline-btn";
    editButton.textContent = "Sửa";
    editButton.addEventListener("click", () => {
      fillExerciseLibraryForm(item);
      refs.exerciseLibraryNameInput.focus();
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "inline-btn danger";
    deleteButton.textContent = "Xóa";
    deleteButton.addEventListener("click", () => {
      deleteExerciseLibraryItemById(item.id).catch((error) => {
        setWorkoutStatus(error.message || "Không thể xóa bài tập thư viện.", true);
      });
    });

    actionWrap.appendChild(editButton);
    actionWrap.appendChild(deleteButton);
    actionCell.appendChild(actionWrap);
    row.appendChild(actionCell);

    refs.exerciseLibraryRows.appendChild(row);
  });
}

async function loadExerciseLibrary() {
  const keyword = refs.exerciseLibraryKeywordInput.value.trim();
  const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : "";
  setWorkoutStatus("Đang tải thư viện bài tập...");

  const data = await request(`/workouts/library${query}`);
  exerciseLibraryCache = Array.isArray(data) ? data : [];
  renderExerciseLibraryRows();
  setWorkoutStatus(`Đã tải ${exerciseLibraryCache.length} bài tập trong thư viện.`);
}

async function saveExerciseLibraryItem() {
  const payload = readExerciseLibraryPayload();
  if (!payload.displayName) {
    setWorkoutStatus("Tên bài tập không được để trống.", true);
    refs.exerciseLibraryNameInput.focus();
    return;
  }

  const method = editingExerciseLibraryId ? "PUT" : "POST";
  const endpoint = editingExerciseLibraryId
    ? `/workouts/library/${editingExerciseLibraryId}`
    : "/workouts/library";

  setWorkoutStatus(editingExerciseLibraryId ? "Đang cập nhật bài tập..." : "Đang thêm bài tập mới...");

  await request(endpoint, {
    method,
    body: JSON.stringify(payload)
  });

  clearExerciseLibraryForm();
  await loadExerciseLibrary();
}

async function deleteExerciseLibraryItemById(itemId) {
  const numericId = Number(itemId || 0);
  if (!numericId) return;

  const confirmed = window.confirm(`Bạn có chắc muốn xóa bài tập #${numericId} khỏi thư viện?`);
  if (!confirmed) return;

  setWorkoutStatus(`Đang xóa bài tập #${numericId}...`);
  await request(`/workouts/library/${numericId}`, { method: "DELETE" });

  if (editingExerciseLibraryId === numericId) {
    clearExerciseLibraryForm();
  }

  await loadExerciseLibrary();
}

function renderNutritionKpis(plan, progress) {
  refs.nutritionPlanCount.textContent = String(nutritionPlansCache.length);
  refs.nutritionTargetCalories.textContent = String(plan?.targetCalories || 0);
  refs.nutritionCaloriesProgress.textContent = `${Math.round(Number(progress?.caloriesCompletion || 0))}%`;
  refs.nutritionPlanStatus.textContent = String(plan?.status || "-");
}

function renderNutritionDetail(plan, progress) {
  if (!plan) {
    refs.nutritionMealBody.className = "detail-list empty";
    refs.nutritionMealBody.textContent = "Chọn một kế hoạch dinh dưỡng để xem chi tiết các bữa ăn.";
    return;
  }

  const dailyMeals = Array.isArray(plan.dailyMeals) ? plan.dailyMeals : [];
  const rows = dailyMeals
    .map((day) => {
      const items = Array.isArray(day.items) ? day.items : [];
      const itemHtml = items.length
        ? items.map((meal) => `
            <li>
              <strong>${meal.name || "Món ăn"}</strong>
              <span>${meal.mealType || "-"}</span>
              <p>${meal.calories || 0} kcal | Đạm ${meal.protein || 0} | Tinh bột ${meal.carbs || 0} | Chất béo ${meal.fat || 0}</p>
            </li>
          `).join("")
        : "<li><p>Không có món ăn.</p></li>";

      return `
        <article class="detail-card">
          <h4>Ngày ${day.dayIndex || "?"} (${day.dayDate || "-"})</h4>
          <ul>${itemHtml}</ul>
        </article>
      `;
    })
    .join("");

  const header = `
    <article class="detail-card detail-summary">
      <h4>${plan.name || "Kế hoạch dinh dưỡng"}</h4>
      <p>Mục tiêu kcal: ${plan.targetCalories || 0} | Đạm: ${plan.proteinTarget || 0}g | Tinh bột: ${plan.carbsTarget || 0}g | Chất béo: ${plan.fatTarget || 0}g</p>
      <p>Tiến độ kcal: ${Math.round(Number(progress?.caloriesCompletion || 0))}%</p>
    </article>
  `;

  refs.nutritionMealBody.className = "detail-list";
  refs.nutritionMealBody.innerHTML = header + rows;
}

async function loadNutritionPlanDetail(planId) {
  try {
    setNutritionStatus(`Đang tải chi tiết kế hoạch dinh dưỡng #${planId}...`);
    const [plan, progress] = await Promise.all([
      request(`/v1/meal-plans/${planId}`),
      request(`/v1/meal-plans/${planId}/progress`)
    ]);

    renderNutritionKpis(plan, progress);
    renderNutritionDetail(plan, progress);
    setNutritionStatus(`Đã tải chi tiết kế hoạch dinh dưỡng #${planId}.`);
  } catch (error) {
    setNutritionStatus(error.message || "Không thể tải chi tiết kế hoạch dinh dưỡng.", true);
  }
}

function renderNutritionPlans() {
  refs.nutritionPlanRows.innerHTML = "";

  if (!Array.isArray(nutritionPlansCache) || nutritionPlansCache.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "Người dùng này chưa có kế hoạch dinh dưỡng.";
    row.appendChild(cell);
    refs.nutritionPlanRows.appendChild(row);
    renderNutritionKpis(null, null);
    renderNutritionDetail(null, null);
    return;
  }

  nutritionPlansCache.forEach((plan) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(String(plan.id || "-")));
    row.appendChild(createCell(String(plan.name || "-")));
    row.appendChild(createCell(String(plan.startDate || "-")));
    row.appendChild(createCell(String(plan.endDate || "-")));
    row.appendChild(createCell(String(plan.targetCalories || 0)));
    row.appendChild(createCell(String(plan.status || "-")));

    const actionCell = document.createElement("td");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "inline-btn";
    button.textContent = "Xem chi tiết";
    button.addEventListener("click", () => {
      loadNutritionPlanDetail(plan.id).catch(() => {
        setNutritionStatus("Không thể tải chi tiết kế hoạch dinh dưỡng.", true);
      });
    });
    actionCell.appendChild(button);
    row.appendChild(actionCell);

    refs.nutritionPlanRows.appendChild(row);
  });
}

async function loadNutritionData() {
  const userId = parseUserId(refs.nutritionUserIdInput);
  if (!userId) {
    setNutritionStatus("Vui lòng nhập User ID hợp lệ.", true);
    return;
  }

  try {
    setNutritionStatus("Đang tải kế hoạch dinh dưỡng...");
    const plans = await request(`/v1/meal-plans/user/${userId}`);
    nutritionPlansCache = Array.isArray(plans) ? plans : [];
    renderNutritionPlans();

    if (nutritionPlansCache[0]?.id) {
      await loadNutritionPlanDetail(nutritionPlansCache[0].id);
    } else {
      setNutritionStatus("Người dùng chưa có kế hoạch dinh dưỡng. Có thể bấm Tạo kế hoạch dinh dưỡng để khởi tạo.");
    }
  } catch (error) {
    setNutritionStatus(error.message || "Không thể tải kế hoạch dinh dưỡng.", true);
  }
}

async function generateNutritionPlan() {
  const userId = parseUserId(refs.nutritionUserIdInput);
  if (!userId) {
    setNutritionStatus("Vui lòng nhập User ID hợp lệ.", true);
    return;
  }

  try {
    setNutritionStatus("Đang tạo kế hoạch dinh dưỡng từ hồ sơ...");
    const profile = await request(`/profile/${userId}`);

    const payload = {
      userId,
      startDate: new Date().toISOString().slice(0, 10),
      heightCm: Number(profile?.height || 0) || null,
      weightKg: Number(profile?.weight || 0) || null,
      activityLevel: profile?.activityLevel || null,
      goal: profile?.onboardingGoal || profile?.fitnessGoal || null,
      preferences: Array.isArray(profile?.preferences) ? profile.preferences : [],
      allergies: Array.isArray(profile?.allergies) ? profile.allergies : []
    };

    await request("/v1/meal-plans/generate", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setNutritionStatus("Đã tạo kế hoạch dinh dưỡng thành công.");
    await loadNutritionData();
  } catch (error) {
    setNutritionStatus(error.message || "Không thể tạo kế hoạch dinh dưỡng.", true);
  }
}

function renderProgressKpis() {
  const totalMinutes = progressLogsCache.reduce((sum, item) => sum + Number(item.workoutMinutes || 0), 0);
  const latest = progressLogsCache[0] || null;

  refs.progressLogCount.textContent = String(progressLogsCache.length);
  refs.progressMinutesTotal.textContent = String(totalMinutes);
  refs.progressLatestWeight.textContent = latest?.weight ? `${latest.weight} kg` : "-";
  refs.progressLatestDate.textContent = latest?.date || "-";
}

function renderProgressRows() {
  refs.progressRows.innerHTML = "";

  if (!Array.isArray(progressLogsCache) || progressLogsCache.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 7;
    cell.textContent = "Chưa có nhật ký tiến độ cho người dùng này.";
    row.appendChild(cell);
    refs.progressRows.appendChild(row);
    return;
  }

  progressLogsCache.forEach((log) => {
    const row = document.createElement("tr");
    row.appendChild(createCell(String(log.id || "-")));
    row.appendChild(createCell(String(log.date || "-")));
    row.appendChild(createCell(String(log.activityType || "Buổi tập")));
    row.appendChild(createCell(String(log.workoutMinutes || 0)));
    row.appendChild(createCell(log.weight ? `${log.weight} kg` : "-"));
    row.appendChild(createCell(String(log.notes || "-")));

    const actionCell = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "inline-btn danger";
    deleteBtn.textContent = "Xóa";
    deleteBtn.addEventListener("click", async () => {
      try {
        deleteBtn.disabled = true;
        setProgressStatus(`Đang xóa bản ghi #${log.id}...`);
        await request(`/progress/${log.id}`, { method: "DELETE" });
        setProgressStatus(`Đã xóa bản ghi #${log.id}.`);
        await loadProgressData();
      } catch (error) {
        setProgressStatus(error.message || "Xóa bản ghi thất bại.", true);
      } finally {
        deleteBtn.disabled = false;
      }
    });

    actionCell.appendChild(deleteBtn);
    row.appendChild(actionCell);

    refs.progressRows.appendChild(row);
  });
}

async function loadProgressData() {
  const userId = parseUserId(refs.progressUserIdInput);
  if (!userId) {
    setProgressStatus("Vui lòng nhập User ID hợp lệ.", true);
    return;
  }

  try {
    setProgressStatus("Đang tải nhật ký tiến độ...");
    const logs = await request(`/progress/user/${userId}`);
    progressLogsCache = Array.isArray(logs)
      ? logs.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))
      : [];

    renderProgressKpis();
    renderProgressRows();
    setProgressStatus("Đã tải nhật ký tiến độ thành công.");
  } catch (error) {
    setProgressStatus(error.message || "Không thể tải nhật ký tiến độ.", true);
  }
}

async function addProgressLog() {
  const userId = parseUserId(refs.progressUserIdInput);
  if (!userId) {
    setProgressStatus("Vui lòng nhập User ID hợp lệ.", true);
    return;
  }

  const date = refs.progressDateInput.value || new Date().toISOString().slice(0, 10);
  const activityType = refs.progressActivityInput.value.trim() || "Buổi tập";
  const workoutMinutes = Number(refs.progressMinutesInput.value || 0);
  const weightRaw = refs.progressWeightInput.value;
  const notes = refs.progressNotesInput.value.trim();

  try {
    setProgressStatus("Đang tạo nhật ký tiến độ...");
    await request("/progress", {
      method: "POST",
      body: JSON.stringify({
        userId,
        date,
        source: "ADMIN",
        activityType,
        workoutMinutes,
        weight: weightRaw ? Number(weightRaw) : null,
        notes
      })
    });

    refs.progressActivityInput.value = "";
    refs.progressMinutesInput.value = "";
    refs.progressWeightInput.value = "";
    refs.progressNotesInput.value = "";

    setProgressStatus("Đã thêm nhật ký tiến độ thành công.");
    await loadProgressData();
  } catch (error) {
    setProgressStatus(error.message || "Không thể tạo nhật ký tiến độ.", true);
  }
}

function bindEvents() {
  refs.menuToggle.addEventListener("click", () => {
    refs.sidebar.classList.toggle("open");
  });

  refs.navUsers.addEventListener("click", () => setActiveView("users"));
  refs.navWorkout.addEventListener("click", () => setActiveView("workout"));
  refs.navNutrition.addEventListener("click", () => setActiveView("nutrition"));
  refs.navProgress.addEventListener("click", () => setActiveView("progress"));

  refs.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = refs.emailInput.value.trim();
    const password = refs.passwordInput.value;

    if (!email || !password) {
      setAuthStatus("Vui lòng nhập đầy đủ email và mật khẩu.", true);
      return;
    }

    try {
      setAuthStatus("Đang đăng nhập...");
      const token = await login(email, password);
      saveToken(token);
      showAdminShell();
      setActiveView("users");
      selectedUserId = null;
      selectedUserDetail = null;
      selectedUserNotice = "";
      renderUserDetail(null);
      setStatus("Đăng nhập thành công. Đang tải dữ liệu...");

      await Promise.all([
        loadUsers()
      ]);
    } catch (error) {
      setAuthStatus(error.message || "Đăng nhập thất bại.", true);
    }
  });

  refs.searchBtn.addEventListener("click", () => {
    loadUsers().catch((error) => setStatus(error.message || "Không thể tải danh sách người dùng.", "error"));
  });

  refs.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadUsers().catch((error) => setStatus(error.message || "Không thể tải danh sách người dùng.", "error"));
    }
  });

  refs.statusFilter.addEventListener("change", () => {
    loadUsers().catch((error) => setStatus(error.message || "Không thể tải danh sách người dùng.", "error"));
  });

  refs.pageSizeSelect.addEventListener("change", () => {
    const nextPageSize = Number(refs.pageSizeSelect.value || 5);
    userPageSize = Number.isFinite(nextPageSize) && nextPageSize > 0 ? Math.floor(nextPageSize) : 5;
    currentUserPage = 1;
    renderDashboard();
  });

  refs.prevPageBtn.addEventListener("click", () => {
    if (currentUserPage <= 1) {
      return;
    }
    currentUserPage -= 1;
    renderDashboard();
  });

  refs.nextPageBtn.addEventListener("click", () => {
    if (currentUserPage >= totalUserPages) {
      return;
    }
    currentUserPage += 1;
    renderDashboard();
  });

  refs.refreshBtn.addEventListener("click", () => {
    loadUsers().catch((error) => setStatus(error.message || "Làm mới dữ liệu thất bại.", "error"));
  });

  refs.closeUserDetailBtn.addEventListener("click", closeUserDetailModal);
  refs.userDetailModal.addEventListener("click", (event) => {
    if (event.target === refs.userDetailModal) {
      closeUserDetailModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && refs.userDetailModal && !refs.userDetailModal.classList.contains("hidden")) {
      closeUserDetailModal();
    }
  });

  refs.loadWorkoutBtn.addEventListener("click", () => {
    loadWorkoutData().catch((error) => setWorkoutStatus(error.message || "Không thể tải kế hoạch tập luyện.", true));
  });

  refs.workoutPlanSearchInput.addEventListener("input", () => {
    renderWorkoutPlans();
  });

  refs.workoutPlanDifficultyFilter.addEventListener("change", () => {
    renderWorkoutPlans();
  });

  refs.generateWorkoutBtn.addEventListener("click", () => {
    generateWorkoutSample().catch((error) => setWorkoutStatus(error.message || "Không thể tạo kế hoạch tập luyện.", true));
  });

  refs.saveWorkoutPlanBtn.addEventListener("click", () => {
    saveWorkoutPlanMeta().catch((error) => setWorkoutStatus(error.message || "Không thể lưu kế hoạch.", true));
  });

  refs.resetWorkoutPlanBtn.addEventListener("click", () => {
    resetWorkoutPlanEditorForm();
  });

  refs.loadExerciseLibraryBtn.addEventListener("click", () => {
    loadExerciseLibrary().catch((error) => setWorkoutStatus(error.message || "Không thể tải thư viện bài tập.", true));
  });

  refs.exerciseLibraryKeywordInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadExerciseLibrary().catch((error) => setWorkoutStatus(error.message || "Không thể tải thư viện bài tập.", true));
    }
  });

  refs.saveExerciseLibraryBtn.addEventListener("click", () => {
    saveExerciseLibraryItem().catch((error) => setWorkoutStatus(error.message || "Không thể lưu bài tập thư viện.", true));
  });

  refs.resetExerciseLibraryFormBtn.addEventListener("click", () => {
    clearExerciseLibraryForm();
    setWorkoutStatus("Đã làm mới form bài tập.");
  });

  refs.loadNutritionBtn.addEventListener("click", () => {
    loadNutritionData().catch((error) => setNutritionStatus(error.message || "Không thể tải kế hoạch dinh dưỡng.", true));
  });

  refs.generateNutritionBtn.addEventListener("click", () => {
    generateNutritionPlan().catch((error) => setNutritionStatus(error.message || "Không thể tạo kế hoạch dinh dưỡng.", true));
  });

  refs.loadProgressBtn.addEventListener("click", () => {
    loadProgressData().catch((error) => setProgressStatus(error.message || "Không thể tải nhật ký tiến độ.", true));
  });

  refs.addProgressBtn.addEventListener("click", () => {
    addProgressLog().catch((error) => setProgressStatus(error.message || "Không thể thêm nhật ký tiến độ.", true));
  });

  refs.logoutBtn.addEventListener("click", () => {
    clearToken();
    showAuthScreen();
    usersCache = [];
    workoutPlansCache = [];
    workoutSessionsCache = [];
    exerciseLibraryCache = [];
    editingExerciseLibraryId = null;
    selectedWorkoutPlanId = null;
    selectedWorkoutPlanDetail = null;
    nutritionPlansCache = [];
    progressLogsCache = [];
    selectedUserId = null;
    selectedUserDetail = null;
    selectedUserNotice = "";
    currentUserPage = 1;
    refs.searchInput.value = "";
    refs.statusFilter.value = "ALL";
    refs.pageSizeSelect.value = "5";
    refs.workoutPlanSearchInput.value = "";
    refs.workoutPlanDifficultyFilter.value = "ALL";
    refs.exerciseLibraryKeywordInput.value = "";
    clearExerciseLibraryForm();
    clearWorkoutPlanEditor();
    renderExerciseLibraryRows();
    renderWorkoutPlans();
    renderWorkoutSessions();
    userPageSize = 5;
    closeUserDetailModal();
    renderUserDetail(null);
    setActiveView("users");
    setAuthStatus("Bạn đã đăng xuất khỏi trang admin.");
  });
}

function bootstrap() {
  bindEvents();
  clearToken();
  selectedUserId = null;
  selectedUserDetail = null;
  selectedUserNotice = "";
  currentUserPage = 1;
  refs.searchInput.value = "";
  refs.statusFilter.value = "ALL";
  refs.pageSizeSelect.value = "5";
  refs.workoutPlanSearchInput.value = "";
  refs.workoutPlanDifficultyFilter.value = "ALL";
  refs.exerciseLibraryKeywordInput.value = "";
  clearExerciseLibraryForm();
  clearWorkoutPlanEditor();
  renderExerciseLibraryRows();
  renderWorkoutPlans();
  renderWorkoutSessions();
  userPageSize = 5;
  closeUserDetailModal();
  renderUserDetail(null);
  refs.progressDateInput.value = new Date().toISOString().slice(0, 10);
  showAuthScreen();
  setAuthStatus("Vui lòng đăng nhập để truy cập trang quản trị.");
}

bootstrap();

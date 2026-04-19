const API_PREFIX = "/api";
const TOKEN_KEY = "fitlife-admin-token";

let authToken = "";
let usersCache = [];
let onboardingSettingsCache = [];
let activeView = "users";

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
  searchInput: document.getElementById("searchInput"),
  roleFilter: document.getElementById("roleFilter"),
  searchBtn: document.getElementById("searchBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  lastUpdated: document.getElementById("lastUpdated"),
  statusBar: document.getElementById("statusBar"),
  kpiTotalUsers: document.getElementById("kpiTotalUsers"),
  kpiAdmins: document.getElementById("kpiAdmins"),
  kpiUsers: document.getElementById("kpiUsers"),
  kpiVisible: document.getElementById("kpiVisible"),
  userRows: document.getElementById("userRows"),
  navUsers: document.getElementById("navUsers"),
  navOnboarding: document.getElementById("navOnboarding"),
  usersView: document.getElementById("usersView"),
  onboardingView: document.getElementById("onboardingView"),
  onboardingStatus: document.getElementById("onboardingStatus"),
  onboardingStepSelect: document.getElementById("onboardingStepSelect"),
  reloadOnboardingBtn: document.getElementById("reloadOnboardingBtn"),
  saveOnboardingBtn: document.getElementById("saveOnboardingBtn"),
  onboardingTitleInput: document.getElementById("onboardingTitleInput"),
  onboardingHeadlineInput: document.getElementById("onboardingHeadlineInput"),
  onboardingHelperInput: document.getElementById("onboardingHelperInput"),
  onboardingImageInput: document.getElementById("onboardingImageInput"),
  onboardingOptionImagesInput: document.getElementById("onboardingOptionImagesInput"),
  onboardingPreviewImage: document.getElementById("onboardingPreviewImage"),
  onboardingPreviewTitle: document.getElementById("onboardingPreviewTitle"),
  onboardingPreviewHeadline: document.getElementById("onboardingPreviewHeadline"),
  onboardingPreviewHelper: document.getElementById("onboardingPreviewHelper")
};

function normalizeRole(role) {
  return String(role || "USER").toUpperCase().replace("ROLE_", "");
}

function setAuthStatus(message, isError = false) {
  refs.authStatus.textContent = message;
  refs.authStatus.classList.toggle("error", Boolean(isError));
}

function setStatus(message, type = "info") {
  refs.statusBar.textContent = message;
  refs.statusBar.classList.toggle("error", type === "error");
}

function setOnboardingStatus(message, isError = false) {
  if (!refs.onboardingStatus) return;
  refs.onboardingStatus.textContent = message;
  refs.onboardingStatus.classList.toggle("error", Boolean(isError));
}

function setActiveView(view) {
  activeView = view;

  const isUsers = view === "users";
  refs.usersView.classList.toggle("hidden", !isUsers);
  refs.onboardingView.classList.toggle("hidden", isUsers);

  refs.navUsers.classList.toggle("active", isUsers);
  refs.navOnboarding.classList.toggle("active", !isUsers);

  refs.topbarTitle.textContent = isUsers
    ? "Quản trị người dùng FitLife"
    : "Cài đặt onboarding FitLife";

  refs.sidebar.classList.remove("open");
}

function clearToken() {
  authToken = "";
  localStorage.removeItem(TOKEN_KEY);
}

function saveToken(token) {
  authToken = token;
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

function parseJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
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

  const role = normalizeRole(payload.role);
  if (role !== "ADMIN") return false;

  if (typeof payload.exp === "number") {
    const expiresAt = payload.exp * 1000;
    if (Date.now() >= expiresAt) return false;
  }

  return true;
}

async function login(email, password) {
  const response = await fetch(`${API_PREFIX}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Đăng nhập thất bại: ${errorText || response.status}`);
  }

  const rawToken = (await response.text()).trim();
  const token = rawToken.replace(/^"|"$/g, "");

  if (!isAdminToken(token)) {
    throw new Error("Tài khoản không có quyền ADMIN để vào trang quản trị.");
  }

  return token;
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
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403) {
      clearToken();
      showAuthScreen();
      setAuthStatus("Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.", true);
    }
    throw new Error(`HTTP ${response.status}: ${errorText || "Request failed"}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

function createRoleBadge(role) {
  const badge = document.createElement("span");
  const normalized = normalizeRole(role);
  badge.className = `role-badge ${normalized === "ADMIN" ? "admin" : "user"}`;
  badge.textContent = normalized;
  return badge;
}

function getVisibleUsers() {
  const filter = refs.roleFilter.value;
  if (filter === "ALL") return usersCache;
  return usersCache.filter((user) => normalizeRole(user.role) === filter);
}

function updateKpis(visibleUsers) {
  const adminCount = usersCache.filter((user) => normalizeRole(user.role) === "ADMIN").length;
  const userCount = usersCache.filter((user) => normalizeRole(user.role) === "USER").length;

  refs.kpiTotalUsers.textContent = String(usersCache.length);
  refs.kpiAdmins.textContent = String(adminCount);
  refs.kpiUsers.textContent = String(userCount);
  refs.kpiVisible.textContent = String(visibleUsers.length);
}

function renderUserRows(users) {
  refs.userRows.innerHTML = "";

  if (!Array.isArray(users) || users.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "Không có dữ liệu phù hợp bộ lọc hiện tại.";
    row.appendChild(cell);
    refs.userRows.appendChild(row);
    return;
  }

  users.forEach((user) => {
    const row = document.createElement("tr");
    const currentRole = normalizeRole(user.role);
    const userId = Number(user.id || 0);

    row.appendChild(createCell(String(userId || "-")));
    row.appendChild(createCell(String(user.name || "Chưa cập nhật")));
    row.appendChild(createCell(String(user.email || "-")));

    const roleCell = document.createElement("td");
    roleCell.appendChild(createRoleBadge(currentRole));
    row.appendChild(roleCell);

    const actionCell = document.createElement("td");
    const actionWrap = document.createElement("div");
    actionWrap.className = "role-action";

    const roleSelect = document.createElement("select");
    roleSelect.className = "role-select";
    ["USER", "ADMIN"].forEach((role) => {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = role;
      option.selected = role === currentRole;
      roleSelect.appendChild(option);
    });

    const updateBtn = document.createElement("button");
    updateBtn.type = "button";
    updateBtn.className = "inline-btn";
    updateBtn.textContent = "Cập nhật";
    updateBtn.addEventListener("click", async () => {
      const nextRole = normalizeRole(roleSelect.value);
      if (nextRole === currentRole) {
        setStatus("Role không thay đổi, không cần cập nhật.");
        return;
      }
      try {
        updateBtn.disabled = true;
        setStatus(`Đang cập nhật role cho user #${userId}...`);
        const updatedUser = await request(`/admin/users/${userId}/role`, {
          method: "PUT",
          body: JSON.stringify({ role: nextRole })
        });
        usersCache = usersCache.map((item) => (Number(item.id) === userId ? updatedUser : item));
        renderDashboard();
        setStatus(`Đã cập nhật role user #${userId} thành ${nextRole}.`);
      } catch (error) {
        setStatus(error.message || "Cập nhật role thất bại.", "error");
      } finally {
        updateBtn.disabled = false;
      }
    });

    actionWrap.appendChild(roleSelect);
    actionWrap.appendChild(updateBtn);
    actionCell.appendChild(actionWrap);
    row.appendChild(actionCell);

    refs.userRows.appendChild(row);
  });
}

function renderDashboard() {
  const visibleUsers = getVisibleUsers();
  updateKpis(visibleUsers);
  renderUserRows(visibleUsers);
}

function normalizeOnboardingStep(raw) {
  return {
    stepIndex: Number(raw?.stepIndex ?? 0),
    stepKey: String(raw?.stepKey || ""),
    title: String(raw?.title || ""),
    headline: String(raw?.headline || ""),
    helperText: String(raw?.helperText || ""),
    imageUrl: String(raw?.imageUrl || ""),
    optionImageUrls: raw?.optionImageUrls && typeof raw.optionImageUrls === "object"
      ? raw.optionImageUrls
      : {}
  };
}

function updateOnboardingPreview() {
  refs.onboardingPreviewTitle.textContent = refs.onboardingTitleInput.value.trim() || "Preview tiêu đề";
  refs.onboardingPreviewHeadline.textContent = refs.onboardingHeadlineInput.value.trim() || "Preview headline";
  refs.onboardingPreviewHelper.textContent = refs.onboardingHelperInput.value.trim() || "Preview mô tả";

  const imageUrl = refs.onboardingImageInput.value.trim();
  if (imageUrl) {
    refs.onboardingPreviewImage.src = imageUrl;
    refs.onboardingPreviewImage.style.display = "block";
  } else {
    refs.onboardingPreviewImage.removeAttribute("src");
    refs.onboardingPreviewImage.style.display = "none";
  }
}

function getSelectedOnboardingStep() {
  const selectedStepIndex = Number(refs.onboardingStepSelect.value || "0");
  return onboardingSettingsCache.find((step) => step.stepIndex === selectedStepIndex) || null;
}

function applyOnboardingStepToForm() {
  const selected = getSelectedOnboardingStep();
  if (!selected) {
    refs.onboardingTitleInput.value = "";
    refs.onboardingHeadlineInput.value = "";
    refs.onboardingHelperInput.value = "";
    refs.onboardingImageInput.value = "";
    refs.onboardingOptionImagesInput.value = "{}";
    updateOnboardingPreview();
    return;
  }

  refs.onboardingTitleInput.value = selected.title;
  refs.onboardingHeadlineInput.value = selected.headline;
  refs.onboardingHelperInput.value = selected.helperText;
  refs.onboardingImageInput.value = selected.imageUrl;
  refs.onboardingOptionImagesInput.value = JSON.stringify(selected.optionImageUrls || {}, null, 2);
  updateOnboardingPreview();
}

function renderOnboardingStepSelect() {
  const previous = Number(refs.onboardingStepSelect.value || "-1");
  refs.onboardingStepSelect.innerHTML = "";

  onboardingSettingsCache
    .slice()
    .sort((a, b) => a.stepIndex - b.stepIndex)
    .forEach((setting) => {
      const option = document.createElement("option");
      option.value = String(setting.stepIndex);
      option.textContent = `Bước ${setting.stepIndex + 1} - ${setting.title}`;
      refs.onboardingStepSelect.appendChild(option);
    });

  if (onboardingSettingsCache.length === 0) {
    applyOnboardingStepToForm();
    return;
  }

  const hasPrevious = onboardingSettingsCache.some((item) => item.stepIndex === previous);
  refs.onboardingStepSelect.value = String(hasPrevious ? previous : onboardingSettingsCache[0].stepIndex);
  applyOnboardingStepToForm();
}

async function loadOnboardingSettings() {
  if (!authToken) {
    setOnboardingStatus("Cần đăng nhập ADMIN để tải cài đặt onboarding.", true);
    return;
  }

  setOnboardingStatus("Đang tải cài đặt onboarding...");
  const result = await request("/admin/onboarding-steps");
  onboardingSettingsCache = Array.isArray(result)
    ? result.map(normalizeOnboardingStep)
    : [];

  renderOnboardingStepSelect();
  setOnboardingStatus("Đã tải cài đặt onboarding từ database.");
}

function parseOptionImageMap(rawJson) {
  if (!rawJson.trim()) return {};

  const parsed = JSON.parse(rawJson);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Ảnh option phải là JSON object, ví dụ: {\"gym\":\"https://...\"}");
  }

  const normalized = {};
  Object.entries(parsed).forEach(([key, value]) => {
    const keyText = String(key || "").trim();
    const valueText = String(value || "").trim();
    if (keyText && valueText) {
      normalized[keyText] = valueText;
    }
  });

  return normalized;
}

async function saveOnboardingStep() {
  const selected = getSelectedOnboardingStep();
  if (!selected) {
    setOnboardingStatus("Không có bước nào để lưu.", true);
    return;
  }

  const title = refs.onboardingTitleInput.value.trim();
  const headline = refs.onboardingHeadlineInput.value.trim();
  const helperText = refs.onboardingHelperInput.value.trim();
  const imageUrl = refs.onboardingImageInput.value.trim();

  if (!title || !headline || !helperText || !imageUrl) {
    setOnboardingStatus("Tiêu đề, headline, mô tả và URL ảnh không được để trống.", true);
    return;
  }

  let optionImageUrls;
  try {
    optionImageUrls = parseOptionImageMap(refs.onboardingOptionImagesInput.value);
  } catch (error) {
    setOnboardingStatus(error.message || "JSON ảnh option không hợp lệ.", true);
    return;
  }

  setOnboardingStatus(`Đang lưu bước ${selected.stepIndex + 1}...`);

  const payload = {
    title,
    headline,
    helperText,
    imageUrl,
    optionImageUrls
  };

  const updated = await request(`/admin/onboarding-steps/${selected.stepIndex}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });

  const normalizedUpdated = normalizeOnboardingStep(updated);
  onboardingSettingsCache = onboardingSettingsCache.map((item) => (
    item.stepIndex === normalizedUpdated.stepIndex ? normalizedUpdated : item
  ));

  renderOnboardingStepSelect();
  refs.onboardingStepSelect.value = String(normalizedUpdated.stepIndex);
  applyOnboardingStepToForm();
  setOnboardingStatus(`Đã lưu bước ${normalizedUpdated.stepIndex + 1} thành công.`);
}

async function loadUsers() {
  if (!authToken) {
    showAuthScreen();
    setAuthStatus("Vui lòng đăng nhập để truy cập trang admin.", true);
    return;
  }

  const keyword = refs.searchInput.value.trim();
  const query = keyword ? `?search=${encodeURIComponent(keyword)}` : "";

  setStatus("Đang tải danh sách người dùng...");
  const users = await request(`/admin/users${query}`);
  usersCache = Array.isArray(users) ? users : [];
  renderDashboard();
  refs.lastUpdated.textContent = `Cập nhật: ${new Date().toLocaleString("vi-VN")}`;
  setStatus("Đã tải dữ liệu thành công.");
}

function bindEvents() {
  refs.menuToggle.addEventListener("click", () => {
    refs.sidebar.classList.toggle("open");
  });

  refs.navUsers.addEventListener("click", () => {
    setActiveView("users");
  });

  refs.navOnboarding.addEventListener("click", () => {
    setActiveView("onboarding");
    if (onboardingSettingsCache.length === 0) {
      loadOnboardingSettings().catch((error) => {
        setOnboardingStatus(error.message || "Không thể tải cài đặt onboarding.", true);
      });
    }
  });

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
      setStatus("Đăng nhập thành công. Đang tải dữ liệu...");
      await Promise.all([
        loadUsers(),
        loadOnboardingSettings().catch((error) => {
          setOnboardingStatus(error.message || "Không thể tải cài đặt onboarding.", true);
        })
      ]);
    } catch (error) {
      setAuthStatus(error.message || "Đăng nhập thất bại.", true);
    }
  });

  refs.searchBtn.addEventListener("click", () => {
    loadUsers().catch((error) => setStatus(error.message || "Không thể tải danh sách user.", "error"));
  });

  refs.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      loadUsers().catch((error) => setStatus(error.message || "Không thể tải danh sách user.", "error"));
    }
  });

  refs.roleFilter.addEventListener("change", () => {
    renderDashboard();
  });

  refs.refreshBtn.addEventListener("click", () => {
    loadUsers().catch((error) => setStatus(error.message || "Làm mới dữ liệu thất bại.", "error"));
  });

  refs.onboardingStepSelect.addEventListener("change", () => {
    applyOnboardingStepToForm();
  });

  refs.reloadOnboardingBtn.addEventListener("click", () => {
    loadOnboardingSettings().catch((error) => {
      setOnboardingStatus(error.message || "Không thể tải lại cài đặt onboarding.", true);
    });
  });

  refs.saveOnboardingBtn.addEventListener("click", () => {
    saveOnboardingStep().catch((error) => {
      setOnboardingStatus(error.message || "Lưu cài đặt onboarding thất bại.", true);
    });
  });

  [
    refs.onboardingTitleInput,
    refs.onboardingHeadlineInput,
    refs.onboardingHelperInput,
    refs.onboardingImageInput
  ].forEach((input) => {
    input.addEventListener("input", () => {
      updateOnboardingPreview();
    });
  });

  refs.onboardingPreviewImage.addEventListener("error", () => {
    refs.onboardingPreviewImage.style.display = "none";
  });

  refs.logoutBtn.addEventListener("click", () => {
    clearToken();
    showAuthScreen();
    usersCache = [];
    onboardingSettingsCache = [];
    setActiveView("users");
    setAuthStatus("Bạn đã đăng xuất khỏi trang admin.");
  });
}

async function bootstrap() {
  bindEvents();
  clearToken();
  showAuthScreen();
  setAuthStatus("Vui lòng đăng nhập để truy cập trang quản trị.");
}

bootstrap();

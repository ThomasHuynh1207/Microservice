import axios from "axios";

const api = axios.create({
  baseURL: "/api"
});

const getToken = (): string => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};

const clearAuthStorage = () => {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("fituser");
  } catch {
    // Ignore storage cleanup failures.
  }
};

const isPublicPath = (url?: string): boolean => {
  const path = String(url || "");
  return path.startsWith("/auth/login") || path.startsWith("/auth/register");
};

let isRedirectingToLogin = false;

const redirectToLogin = () => {
  if (typeof window === "undefined" || isRedirectingToLogin) {
    return;
  }

  const path = window.location.pathname;
  const isAuthPage = path.startsWith("/login") || path.startsWith("/register");
  if (isAuthPage) {
    return;
  }

  isRedirectingToLogin = true;
  window.location.replace("/login");
};

api.interceptors.request.use((config) => {
  const token = getToken();
  const requestPath = String(config.url || "");

  if (!token && !isPublicPath(requestPath)) {
    clearAuthStorage();
    redirectToLogin();
    return Promise.reject(new Error("AUTH_REQUIRED"));
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = Number(error?.response?.status || 0);
    if (status === 401) {
      clearAuthStorage();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default api;
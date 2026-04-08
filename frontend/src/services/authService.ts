import api from "../api/api";

export interface LoggedUser {
  id: number;
  email: string;
  fullName?: string;
}

const USER_STORAGE_KEY = "fituser";

export const getCurrentUser = (): LoggedUser | null => {
  const stored = localStorage.getItem(USER_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as LoggedUser;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: LoggedUser) => {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const login = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  const token = res.data;
  localStorage.setItem("token", token);

  const usersRes = await api.get("/users");
  const users = usersRes.data as Array<{ id: number; email: string; fullName?: string }>;
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    throw new Error("Đã xảy ra lỗi khi lấy thông tin người dùng.");
  }

  const logged: LoggedUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
  };

  setCurrentUser(logged);

  return logged;
};

export const register = async (fullName: string, email: string, password: string) => {
  const res = await api.post("/auth/register", { name: fullName, email, password });
  const user = res.data as { id: number; email: string; fullName?: string };

  // After register, automatically log in to get JWT and store user locally
  await login(email, password);

  return user;
};

export interface UserProfileData {
  age: number;
  gender: string;
  height: number;
  weight: number;
  fitnessGoal: string;
  experienceLevel: string;
  activityLevel: string;
}

export interface UserProfileResponse extends UserProfileData {}

export const createUserProfile = async (userId: number, profile: UserProfileData) => {
  const res = await api.post(`/profile/${userId}`, profile);
  return res.data as UserProfileResponse;
};

export const getUserProfile = async (userId: number) => {
  const res = await api.get(`/profile/${userId}`);
  return res.data as UserProfileResponse;
};
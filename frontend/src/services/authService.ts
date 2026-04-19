import api from "../api/api";
import { getUserSeedData } from "./onboardingService";

export interface LoggedUser {
  id: number;
  email: string;
  fullName?: string;
}

const USER_STORAGE_KEY = "fituser";
const ONBOARDING_COMPLETED_PREFIX = "fitlife-onboarding-completed";
const ONBOARDING_DRAFT_PREFIX = "fitlife-onboarding-draft";
const ONBOARDING_PROOF_PREFIX = "fitlife-onboarding-proof";

const onboardingCompletedKey = (userId: number) => `${ONBOARDING_COMPLETED_PREFIX}-${userId}`;
const onboardingDraftKey = (userId: number) => `${ONBOARDING_DRAFT_PREFIX}-${userId}`;
const onboardingProofKey = (userId: number) => `${ONBOARDING_PROOF_PREFIX}-${userId}`;

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

export const isOnboardingCompletedLocal = (userId: number): boolean => {
  return localStorage.getItem(onboardingCompletedKey(userId)) === "true";
};

export const setOnboardingCompletedLocal = (userId: number, completed: boolean) => {
  localStorage.setItem(onboardingCompletedKey(userId), completed ? "true" : "false");
};

export const setOnboardingCompletionProofLocal = (userId: number, completed: boolean) => {
  localStorage.setItem(onboardingProofKey(userId), completed ? "true" : "false");
};

export const hasOnboardingDraftLocal = (userId: number): boolean => {
  const draft = localStorage.getItem(onboardingDraftKey(userId));
  if (!draft) return false;
  try {
    const parsed = JSON.parse(draft) as { step?: number };
    return typeof parsed.step === "number";
  } catch {
    return false;
  }
};

export const hasOnboardingCompletionProof = (userId: number): boolean => {
  // Proof can come from local generated seed or from a confirmed backend profile check.
  if (localStorage.getItem(onboardingProofKey(userId)) === "true") {
    return true;
  }
  return Boolean(getUserSeedData(userId));
};

const hasCompletedOnboardingInDatabase = async (userId: number): Promise<boolean> => {
  try {
    await api.get(`/profile/${userId}`);
    return true;
  } catch {
    return false;
  }
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

export const resolveInitialRouteAfterLogin = async (userId: number): Promise<"/onboarding" | "/dashboard"> => {
  const completedInDatabase = await hasCompletedOnboardingInDatabase(userId);
  if (completedInDatabase) {
    setOnboardingCompletedLocal(userId, true);
    setOnboardingCompletionProofLocal(userId, true);
    localStorage.removeItem(onboardingDraftKey(userId));
    return "/dashboard";
  }

  if (hasOnboardingDraftLocal(userId)) {
    setOnboardingCompletedLocal(userId, false);
    setOnboardingCompletionProofLocal(userId, false);
    return "/onboarding";
  }

  if (isOnboardingCompletedLocal(userId) && hasOnboardingCompletionProof(userId)) {
    return "/dashboard";
  }

  setOnboardingCompletedLocal(userId, false);
  setOnboardingCompletionProofLocal(userId, false);
  return "/onboarding";
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
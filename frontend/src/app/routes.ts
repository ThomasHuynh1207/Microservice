import { createElement } from "react";
import { Navigate, createBrowserRouter } from "react-router";
import { Landing } from "./components/Landing";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { Root } from "./components/Root";
import { Dashboard } from "./components/Dashboard";
import { WorkoutTracker } from "./components/WorkoutTracker";
import { NutritionTracker } from "./components/NutritionTracker";
import { MealPlanner } from "./components/MealPlanner";
import { FitnessCoach } from "./components/FitnessCoach";
import { MyAccount } from "./components/MyAccount";
import {
  getCurrentUser,
  hasOnboardingCompletionProof,
  hasOnboardingDraftLocal,
  isOnboardingCompletedLocal,
} from "../services/authService";

function OnboardingRoute() {
  const user = getCurrentUser();
  if (!user) {
    return createElement(Navigate, { to: "/login", replace: true });
  }
  if (isOnboardingCompletedLocal(user.id) && hasOnboardingCompletionProof(user.id) && !hasOnboardingDraftLocal(user.id)) {
    return createElement(Navigate, { to: "/dashboard", replace: true });
  }
  return createElement(OnboardingWizard);
}

function DashboardRoute() {
  const user = getCurrentUser();
  if (!user) {
    return createElement(Navigate, { to: "/login", replace: true });
  }
  const canAccessDashboard =
    isOnboardingCompletedLocal(user.id) &&
    hasOnboardingCompletionProof(user.id) &&
    !hasOnboardingDraftLocal(user.id);

  if (!canAccessDashboard) {
    return createElement(Navigate, { to: "/onboarding", replace: true });
  }
  return createElement(Root);
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/onboarding",
    Component: OnboardingRoute,
  },
  {
    path: "/dashboard",
    Component: DashboardRoute,
    children: [
      { index: true, Component: Dashboard },
      { path: "workout", Component: WorkoutTracker },
      { path: "nutrition", Component: NutritionTracker },
      { path: "meal-plan", Component: MealPlanner },
      { path: "coach", Component: FitnessCoach },
      { path: "account", Component: MyAccount },
    ],
  },
]);
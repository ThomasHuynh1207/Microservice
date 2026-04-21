import { createElement } from "react";
import { Navigate, createBrowserRouter } from "react-router";
import { Landing } from "./components/Landing";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { OnboardingWizard } from "./components/OnboardingWizard";
import { Root } from "./components/Root";
import { Dashboard } from "./components/Dashboard";
import { WorkoutHub } from "./components/WorkoutHub";
import { WorkoutDayDetail } from "./components/WorkoutDayDetail";
import { WorkoutExerciseDetail } from "./components/WorkoutExerciseDetail";
import { NutritionTracker } from "./components/NutritionTracker";
import { ProgressTracker } from "./components/ProgressTracker";
import { FitnessCoach } from "./components/FitnessCoach";
import { MyAccount } from "./components/MyAccount";
import {
  getCurrentUser,
  hasOnboardingCompletionProof,
  isOnboardingCompletedLocal,
} from "../services/authService";

function OnboardingRoute() {
  const user = getCurrentUser();
  if (!user) {
    return createElement(Navigate, { to: "/login", replace: true });
  }
  if (isOnboardingCompletedLocal(user.id) && hasOnboardingCompletionProof(user.id)) {
    return createElement(Navigate, { to: "/dashboard", replace: true });
  }
  return createElement(OnboardingWizard);
}

function DashboardRoute() {
  const user = getCurrentUser();
  if (!user) {
    return createElement(Navigate, { to: "/login", replace: true });
  }
  const canAccessDashboard = isOnboardingCompletedLocal(user.id) && hasOnboardingCompletionProof(user.id);

  if (!canAccessDashboard) {
    return createElement(Navigate, { to: "/onboarding", replace: true });
  }
  return createElement(Root);
}

function LegacyMealPlanRoute() {
  return createElement(Navigate, { to: "/dashboard/nutrition", replace: true });
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
      { path: "workout", Component: WorkoutHub },
      { path: "workout/day/:planId/:dayOrder", Component: WorkoutDayDetail },
      { path: "workout/exercise/:planId/:dayOrder/:exerciseOrder", Component: WorkoutExerciseDetail },
      { path: "nutrition", Component: NutritionTracker },
      { path: "progress", Component: ProgressTracker },
      { path: "meal-plan", Component: LegacyMealPlanRoute },
      { path: "coach", Component: FitnessCoach },
      { path: "account", Component: MyAccount },
    ],
  },
]);
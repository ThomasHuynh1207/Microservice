import { createBrowserRouter } from "react-router";
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
    Component: OnboardingWizard,
  },
  {
    path: "/dashboard",
    Component: Root,
    children: [
      { index: true, Component: Dashboard },
      { path: "workout", Component: WorkoutTracker },
      { path: "nutrition", Component: NutritionTracker },
      { path: "meal-plan", Component: MealPlanner },
      { path: "coach", Component: FitnessCoach },
    ],
  },
]);
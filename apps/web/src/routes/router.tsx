import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
} from "@tanstack/react-router";
import { RootLayout } from "@/components/layout/RootLayout";

// Pages
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";
import { SearchPage } from "@/pages/SearchPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { ProfileSetupPage } from "@/pages/ProfileSetupPage";
import { ProfileEditPage } from "@/pages/ProfileEditPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { MessagesPage } from "@/pages/MessagesPage";
import { JobsPage } from "@/pages/JobsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { SafetyCenterPage, PrivacyPage, TermsPage } from "@/pages/StaticPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

// Admin
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";

// ---------------------------------------------------------------------------
// Root route
// ---------------------------------------------------------------------------
const rootRoute = createRootRoute({
  component: () => (
    <RootLayout>
      <Outlet />
    </RootLayout>
  ),
  notFoundComponent: NotFoundPage,
});

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/forgot-password",
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reset-password",
  component: ResetPasswordPage,
});

const verifyEmailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-email",
  component: VerifyEmailPage,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/discover",
  component: SearchPage,
});

const jobsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/jobs",
  component: JobsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/people/$slug",
  component: ProfilePage,
});

// ---------------------------------------------------------------------------
// Authenticated routes
// ---------------------------------------------------------------------------
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const messagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/messages",
  component: MessagesPage,
});

const profileSetupRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/setup",
  component: ProfileSetupPage,
});

const profileEditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile/edit",
  component: ProfileEditPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const safetyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/safety",
  component: SafetyCenterPage,
});

const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/terms",
  component: TermsPage,
});

// ---------------------------------------------------------------------------
// Admin routes
// ---------------------------------------------------------------------------
const adminLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminLayout,
});

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminLayoutRoute,
  path: "/",
  component: AdminDashboardPage,
});

// ---------------------------------------------------------------------------
// Route tree
// ---------------------------------------------------------------------------
const routeTree = rootRoute.addChildren([
  homeRoute,
  // Auth
  loginRoute,
  registerRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  verifyEmailRoute,
  // Discovery
  searchRoute,
  jobsRoute,
  profileRoute,
  // Authenticated
  dashboardRoute,
  messagesRoute,
  profileSetupRoute,
  profileEditRoute,
  settingsRoute,
  // Static
  safetyRoute,
  privacyRoute,
  termsRoute,
  // Admin
  adminLayoutRoute.addChildren([adminDashboardRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

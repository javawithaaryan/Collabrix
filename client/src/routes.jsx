import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/layouts/AppShell";
import PageLoader from "./components/ui/PageLoader";

/*
|--------------------------------------------------------------------------
| Lazy Loaded Pages
|--------------------------------------------------------------------------
| Keeps the initial bundle smaller and improves route loading speed.
|--------------------------------------------------------------------------
*/

// Public Pages
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const JoinWorkspace = lazy(() => import("./pages/JoinWorkspace"));

// Global Pages (after login)
const GlobalDashboard = lazy(() => import("./pages/GlobalDashboard"));
const MyWorkspaces = lazy(() => import("./pages/MyWorkspaces"));
const GlobalResourceHub = lazy(() => import("./pages/GlobalResourceHub"));
const EngineersSpace = lazy(() => import("./pages/EngineersSpace"));
const Insights = lazy(() => import("./pages/Insights"));
const Account = lazy(() => import("./pages/Account"));

// Workspace Pages
const WorkspaceDashboard = lazy(() => import("./pages/WorkspaceDashboard"));
const Projects = lazy(() => import("./pages/Projects"));
const Project = lazy(() => import("./pages/Project"));
const Chat = lazy(() => import("./pages/Chat"));
const ResourceHub = lazy(() => import("./pages/ResourceHub"));
const Wiki = lazy(() => import("./pages/Wiki"));
const Snippets = lazy(() => import("./pages/Snippets"));
const CodeReview = lazy(() => import("./pages/CodeReview"));
const SprintPlanner = lazy(() => import("./pages/SprintPlanner"));
const WorkspaceSettings = lazy(() => import("./pages/Settings"));
const Tasks = lazy(() => import("./pages/Tasks"));
const AICommandCenter = lazy(() => import("./pages/AICommandCenter"));
const Pulse = lazy(() => import("./pages/Pulse"));
const Activity = lazy(() => import("./pages/Activity"));
const Notifications = lazy(() => import("./pages/Notifications"));

// Legacy Pages (to be removed)
const Billing = lazy(() => import("./pages/Billing"));

const NotFound = lazy(() => import("./pages/NotFound"));

/*
|--------------------------------------------------------------------------
| Shared Suspense Wrapper
|--------------------------------------------------------------------------
*/

const renderWithLoader = (component) => (
  <Suspense fallback={<PageLoader />}>
    {component}
  </Suspense>
);

/*
|--------------------------------------------------------------------------
| Router Configuration
|--------------------------------------------------------------------------
*/

const router = createBrowserRouter([
  /*
  |--------------------------------------------------------------------------
  | Public Pages
  |--------------------------------------------------------------------------
  */

  {
    path: "/",
    element: renderWithLoader(<Landing />),
  },

  {
    path: "/login",
    element: renderWithLoader(<Login />),
  },

  {
    path: "/register",
    element: renderWithLoader(<Register />),
  },

  {
    path: "/join/:token",
    element: renderWithLoader(<JoinWorkspace />),
  },

  /*
  |--------------------------------------------------------------------------
  | Global Pages (After Login)
  |--------------------------------------------------------------------------
  */

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        {renderWithLoader(<GlobalDashboard />)}
      </ProtectedRoute>
    ),
  },

  {
    path: "/my-workspaces",
    element: (
      <ProtectedRoute>
        {renderWithLoader(<MyWorkspaces />)}
      </ProtectedRoute>
    ),
  },

  {
    path: "/community",
    element: (
      <ProtectedRoute>
        {renderWithLoader(<EngineersSpace />)}
      </ProtectedRoute>
    ),
  },

  {
    path: "/resources",
    element: (
      <ProtectedRoute>
        {renderWithLoader(<GlobalResourceHub />)}
      </ProtectedRoute>
    ),
  },

  {
    path: "/insights",
    element: (
      <ProtectedRoute>
        {renderWithLoader(<Insights />)}
      </ProtectedRoute>
    ),
  },

  {
    path: "/account",
    element: (
      <ProtectedRoute>
        {renderWithLoader(<Account />)}
      </ProtectedRoute>
    ),
  },

  /*
  |--------------------------------------------------------------------------
  | Workspace Routes
  |--------------------------------------------------------------------------
  */

  {
    path: "/workspace/:id",

    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),

    children: [
      /*
      |--------------------------------------------------------------------------
      | Default Workspace Route
      |--------------------------------------------------------------------------
      */

      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },

      /*
      |--------------------------------------------------------------------------
      | Workspace Pages
      |--------------------------------------------------------------------------
      */

      {
        path: "dashboard",
        element: renderWithLoader(<WorkspaceDashboard />),
      },

      {
        path: "projects",
        element: renderWithLoader(<Projects />),
      },

      {
        path: "kanban",
        element: renderWithLoader(<Project />),
      },

      {
        path: "kanban/:projectId",
        element: renderWithLoader(<Project />),
      },

      {
        path: "chat",
        element: renderWithLoader(<Chat />),
      },

      {
        path: "chat/:projectId",
        element: renderWithLoader(<Chat />),
      },

      {
        path: "pulse",
        element: renderWithLoader(<Pulse />),
      },

      {
        path: "resources",
        element: renderWithLoader(<ResourceHub />),
      },

      {
        path: "wiki",
        element: renderWithLoader(<Wiki />),
      },

      {
        path: "snippets",
        element: renderWithLoader(<Snippets />),
      },

      {
        path: "code-review",
        element: renderWithLoader(<CodeReview />),
      },

      {
        path: "sprint-planner",
        element: renderWithLoader(<SprintPlanner />),
      },

      {
        path: "tasks",
        element: renderWithLoader(<Tasks />),
      },

      {
        path: "ai",
        element: renderWithLoader(<AICommandCenter />),
      },

      {
        path: "activity",
        element: renderWithLoader(<Activity />),
      },

      {
        path: "notifications",
        element: renderWithLoader(<Notifications />),
      },

      {
        path: "billing",
        element: renderWithLoader(<Billing />),
      },

      {
        path: "settings",
        element: renderWithLoader(<WorkspaceSettings />),
      },
    ],
  },

  /*
  |--------------------------------------------------------------------------
  | Legacy Project Redirect
  |--------------------------------------------------------------------------
  | Prevents older project links from breaking after routing changes.
  |--------------------------------------------------------------------------
  */

  {
    path: "/project/:id",

    element: (
      <ProtectedRoute>
        <LegacyProjectRedirect />
      </ProtectedRoute>
    ),
  },

  /*
  |--------------------------------------------------------------------------
  | Fallback Route
  |--------------------------------------------------------------------------
  */

  {
    path: "*",
    element: renderWithLoader(<NotFound />),
  },
]);

/*
|--------------------------------------------------------------------------
| Legacy Redirect Component
|--------------------------------------------------------------------------
*/

function LegacyProjectRedirect() {
  return <Navigate to="/dashboard" replace />;
}

export default router;

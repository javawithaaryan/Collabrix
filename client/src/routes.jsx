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

const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Workspace = lazy(() => import("./pages/Workspace"));

const Project = lazy(() => import("./pages/Project"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Chat = lazy(() => import("./pages/Chat"));

const ResourceHub = lazy(() => import("./pages/ResourceHub"));
const Pulse = lazy(() => import("./pages/Pulse"));
const Wiki = lazy(() => import("./pages/Wiki"));
const Snippets = lazy(() => import("./pages/Snippets"));

const CodeReview = lazy(() => import("./pages/CodeReview"));
const SprintPlanner = lazy(() => import("./pages/SprintPlanner"));

const Notifications = lazy(() => import("./pages/Notifications"));
const Activity = lazy(() => import("./pages/Activity"));

const Billing = lazy(() => import("./pages/Billing"));
const Settings = lazy(() => import("./pages/Settings"));

const JoinWorkspace = lazy(() => import("./pages/JoinWorkspace"));

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
  | Main Dashboard
  |--------------------------------------------------------------------------
  */

  {
    path: "/dashboard",

    element: (
      <ProtectedRoute>
        {renderWithLoader(<Dashboard />)}
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
      | Core Workspace Pages
      |--------------------------------------------------------------------------
      */

      {
        path: "dashboard",
        element: renderWithLoader(<Workspace />),
      },

      {
        path: "projects",
        element: renderWithLoader(<Workspace />),
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
        path: "tasks",
        element: renderWithLoader(<Tasks />),
      },

      {
        path: "chat",
        element: renderWithLoader(<Chat />),
      },

      {
        path: "chat/:projectId",
        element: renderWithLoader(<Chat />),
      },

      /*
      |--------------------------------------------------------------------------
      | Knowledge & Resources
      |--------------------------------------------------------------------------
      */

      {
        path: "resources",
        element: renderWithLoader(<ResourceHub />),
      },

      {
        path: "pulse",
        element: renderWithLoader(<Pulse />),
      },

      {
        path: "wiki",
        element: renderWithLoader(<Wiki />),
      },

      {
        path: "snippets",
        element: renderWithLoader(<Snippets />),
      },

      /*
      |--------------------------------------------------------------------------
      | AI & Collaboration
      |--------------------------------------------------------------------------
      */

      {
        path: "code-review",
        element: renderWithLoader(<CodeReview />),
      },

      {
        path: "sprint-planner",
        element: renderWithLoader(<SprintPlanner />),
      },

      {
        path: "notifications",
        element: renderWithLoader(<Notifications />),
      },

      {
        path: "activity",
        element: renderWithLoader(<Activity />),
      },

      /*
      |--------------------------------------------------------------------------
      | Workspace Administration
      |--------------------------------------------------------------------------
      */

      {
        path: "billing",
        element: renderWithLoader(<Billing />),
      },

      {
        path: "settings",
        element: renderWithLoader(<Settings />),
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
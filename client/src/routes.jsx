import { createBrowserRouter } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Project from "./pages/Project";
import NotFound from "./pages/NotFound";
import JoinWorkspace from "./pages/JoinWorkspace";

import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },

  {
    path: "/login",
    element: <Login />,
  },

  {
    path: "/register",
    element: <Register />,
  },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },

  {
    path: "/workspace/:id",
    element: (
      <ProtectedRoute>
        <Workspace />
      </ProtectedRoute>
    ),
  },

  {
    path: "/project/:id",
    element: (
      <ProtectedRoute>
        <Project />
      </ProtectedRoute>
    ),
  },

  {
    path: "/join/:token",
    element: <JoinWorkspace />,
  },

  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;
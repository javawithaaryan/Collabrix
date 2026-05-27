import React, { Component } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import WorkspaceSidebar from "./WorkspaceSidebar";
import Topbar from "./Topbar";
import { useNotifications } from "../../context/NotificationContext";

// --- React Error Boundary Catching Unexpected UI Crashes ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary] Caught an unexpected UI crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <span className="text-5xl block">⚠️</span>
            <h1 className="text-xl font-bold text-white tracking-wide">Something went wrong</h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              An unexpected interface crash occurred. Reload the page or return to your dashboard.
            </p>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-left text-xs font-mono text-rose-400 overflow-x-auto max-h-32 scrollbar-thin">
              {this.state.error?.toString() || "Unknown rendering exception"}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-sm transition-all shadow-lg shadow-indigo-600/20 cursor-pointer text-white"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- AppShell Component ---
export function AppShellContent() {
  const { toasts } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* Workspace Sidebar Navigation */}
      <WorkspaceSidebar />

      {/* Main Container Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <Topbar />

        {/* Dynamic Nested Page Content Router View */}
        <main className="flex-1 overflow-y-auto bg-slate-950/40 relative">
          <Outlet />
        </main>

        {/* Realtime Floating Toast Stack (Bottom-Right corner) */}
        <div className="fixed bottom-6 right-6 z-[120] flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="pointer-events-auto w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-start space-x-3 text-slate-100 backdrop-blur-md animate-in slide-in-from-right duration-250 hover:scale-[1.02] transition-transform"
              style={{
                boxShadow: "0 10px 30px -10px rgba(79, 70, 229, 0.15), 0 1px 1px rgba(255, 255, 255, 0.05) inset"
              }}
            >
              <span className="text-xl flex items-center justify-center mt-0.5">{t.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-300 font-medium leading-relaxed leading-snug">{t.message}</p>
                {t.actionLink && (
                  <button
                    onClick={() => {
                      if (t.actionLink.startsWith("/")) {
                        navigate(t.actionLink);
                      } else {
                        window.open(t.actionLink, "_blank");
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 mt-2 flex items-center space-x-1 cursor-pointer transition-all"
                  >
                    <span>View details</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  return (
    <ErrorBoundary>
      <AppShellContent />
    </ErrorBoundary>
  );
}

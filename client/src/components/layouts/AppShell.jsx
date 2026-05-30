import React, { Component, useState, useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import WorkspaceSidebar from "./WorkspaceSidebar";
import Topbar from "./Topbar";
import { useNotifications } from "../../context/NotificationContext";
import { useWorkspace } from "../../context/WorkspaceContext";
import api from "../../lib/axios";
import { isObjectId, workspacePath } from "../../utils/workspaceRoutes";

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
  const { id: workspaceId } = useParams();
  const { toasts } = useNotifications();
  const { activeWorkspaceId, switchWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [globalSearch, setGlobalSearch] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (workspaceId && !isObjectId(workspaceId)) {
      console.error("[workspace-route] Invalid workspace id in URL:", workspaceId);
      navigate("/my-workspaces", { replace: true });
      return;
    }
    if (workspaceId && workspaceId !== activeWorkspaceId) {
      switchWorkspace(workspaceId);
    }
  }, [workspaceId, activeWorkspaceId, switchWorkspace, navigate]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setGlobalSearch(true);
      }
      if (e.key === "Escape") setGlobalSearch(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!globalSearch || !searchQ.trim() || !isObjectId(workspaceId)) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [projRes, taskRes, wikiRes, resRes] = await Promise.all([
          api.get(`/projects/workspace/${workspaceId}`).catch(()=>({data:[]})),
          api.get(`/tasks/workspace/${workspaceId}`).catch(()=>({data:[]})),
          api.get(`/wiki/workspace/${workspaceId}`).catch(()=>({data:{wikis:[]}})),
          api.get(`/resources/workspace/${workspaceId}`).catch(()=>({data:{resources:[]}}))
        ]);

        const sq = searchQ.toLowerCase();
        let results = [];

        // Projects
        (projRes.data || []).filter(p => p.name.toLowerCase().includes(sq)).forEach(p => {
          results.push({ id: p._id, type: 'Project', title: p.name, icon: '🗂', path: `/workspace/${workspaceId}/kanban?project=${p._id}` });
        });
        
        // Tasks
        (taskRes.data || []).filter(t => t.title.toLowerCase().includes(sq)).forEach(t => {
          results.push({ id: t._id, type: 'Task', title: t.title, icon: '✓', path: `/workspace/${workspaceId}/kanban?project=${t.project}` });
        });

        // Wiki
        (wikiRes.data?.wikis || []).filter(w => w.title.toLowerCase().includes(sq)).forEach(w => {
          results.push({ id: w._id, type: 'Wiki', title: w.title, icon: '📖', path: `/workspace/${workspaceId}/wiki` });
        });

        // Resources
        (resRes.data?.resources || []).filter(r => r.title.toLowerCase().includes(sq)).forEach(r => {
          results.push({ id: r._id, type: 'Resource', title: r.title, icon: '📎', path: `/workspace/${workspaceId}/resources` });
        });

        setSearchResults(results.slice(0, 15));
        setSelectedIndex(0);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQ, globalSearch, workspaceId]);

  const handleKeyDown = (e) => {
    if (!globalSearch) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (searchResults.length || 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (searchResults.length || 1)) % (searchResults.length || 1));
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (!searchQ.trim()) return;
      const selected = searchResults[selectedIndex];
      if (selected) {
        navigate(selected.path);
        setGlobalSearch(false);
        setSearchQ("");
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans" onKeyDown={handleKeyDown}>
      {/* Global Search Modal */}
      {globalSearch && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-start justify-center pt-24 px-4" onClick={() => setGlobalSearch(false)}>
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-900">
              <span className="text-zinc-500">🔍</span>
              <input
                autoFocus
                type="text"
                placeholder="Search projects, tasks, wiki, resources..."
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                className="flex-1 bg-transparent text-white outline-none text-sm placeholder-zinc-600"
              />
              <kbd className="text-[10px] text-zinc-600 font-mono border border-zinc-800 rounded px-1.5 py-0.5">ESC</kbd>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {!searchQ.trim() ? (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: "🗂", label: "Projects", path: "projects" },
                    { icon: "✓", label: "Tasks", path: "kanban" },
                    { icon: "📖", label: "Wiki", path: "wiki" },
                    { icon: "📎", label: "Resources", path: "resources" },
                    { icon: "💬", label: "Chat", path: "chat" },
                    { icon: "🤖", label: "AI Center", path: "ai" },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => {
                        const path = workspacePath(workspaceId, item.path);
                        if (path) navigate(path);
                        setGlobalSearch(false);
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 hover:border-zinc-800 text-left transition"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm text-zinc-300">{item.label}</span>
                    </button>
                  ))}
                </div>
              ) : searchLoading ? (
                <div className="text-center py-6 text-zinc-600 text-xs">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-xs">No results found for "{searchQ}"</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {searchResults.map((res, i) => (
                    <button
                      key={res.id}
                      onClick={() => {
                        navigate(res.path);
                        setGlobalSearch(false);
                        setSearchQ("");
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition ${selectedIndex === i ? "bg-zinc-800 border-zinc-700 text-white" : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/40"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-lg flex-shrink-0">{res.icon}</span>
                        <span className="text-sm truncate">{res.title}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{res.type}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center gap-3 text-[10px] text-zinc-700 font-mono border-t border-zinc-900 pt-3">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>ESC Close</span>
              </div>
            </div>
          </div>
        </div>
      )}

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

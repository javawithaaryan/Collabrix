import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/axios";
import { isObjectId, workspacePath } from "../utils/workspaceRoutes";

const RESULT_TYPES = [
  { key: "projects", label: "Projects", icon: "🗂", color: "text-violet-400" },
  { key: "tasks", label: "Tasks", icon: "✓", color: "text-emerald-400" },
  { key: "wiki", label: "Wiki", icon: "📖", color: "text-blue-400" },
  { key: "resources", label: "Resources", icon: "📎", color: "text-amber-400" },
  { key: "members", label: "Members", icon: "👤", color: "text-pink-400" },
];

export default function GlobalSearch({ workspaceId: propWorkspaceId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(0);
  const [allItems, setAllItems] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const params = useParams();
  const workspaceId = propWorkspaceId || params.id;

  // Ctrl+K to open
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults({});
      setFocused(0);
    }
  }, [open]);

  // Search
  const search = useCallback(async (q) => {
    if (!q.trim() || !isObjectId(workspaceId)) { setResults({}); setAllItems([]); return; }
    setLoading(true);
    try {
      const [projRes, taskRes, wikiRes, resRes, wsRes] = await Promise.allSettled([
        api.get(`/projects/workspace/${workspaceId}`),
        api.get(`/tasks/workspace/${workspaceId}`),
        api.get(`/wiki/workspace/${workspaceId}`),
        api.get(`/resources/workspace/${workspaceId}`),
        api.get(`/workspaces/${workspaceId}`),
      ]);

      const ql = q.toLowerCase();

      const projects = (projRes.value?.data || []).filter(p =>
        p.name?.toLowerCase().includes(ql) || p.description?.toLowerCase().includes(ql)
      ).slice(0, 4);

      const tasks = (taskRes.value?.data || []).filter(t =>
        t.title?.toLowerCase().includes(ql) || t.description?.toLowerCase().includes(ql)
      ).slice(0, 5);

      const wikiList = (wikiRes.value?.data?.wikis || []).filter(w =>
        w.title?.toLowerCase().includes(ql) ||
        w.content?.toLowerCase().includes(ql) ||
        w.category?.toLowerCase().includes(ql) ||
        w.tags?.some(tag => tag.toLowerCase().includes(ql)) ||
        w.author?.name?.toLowerCase().includes(ql)
      ).slice(0, 5);

      const resources = (resRes.value?.data?.resources || []).filter(r =>
        r.title?.toLowerCase().includes(ql) || r.description?.toLowerCase().includes(ql)
      ).slice(0, 4);

      const members = (wsRes.value?.data?.members || []).filter(m =>
        m.user?.name?.toLowerCase().includes(ql) || m.user?.email?.toLowerCase().includes(ql)
      ).slice(0, 4);

      const grouped = {};
      if (projects.length) grouped.projects = projects;
      if (tasks.length) grouped.tasks = tasks;
      if (wikiList.length) grouped.wiki = wikiList;
      if (resources.length) grouped.resources = resources;
      if (members.length) grouped.members = members;

      setResults(grouped);

      // Build flat list for keyboard navigation
      const flat = [];
      if (projects.length) projects.forEach(p => flat.push({ type: 'projects', item: p }));
      if (tasks.length) tasks.forEach(t => flat.push({ type: 'tasks', item: t }));
      if (wikiList.length) wikiList.forEach(w => flat.push({ type: 'wiki', item: w }));
      if (resources.length) resources.forEach(r => flat.push({ type: 'resources', item: r }));
      if (members.length) members.forEach(m => flat.push({ type: 'members', item: m }));
      setAllItems(flat);
      setFocused(0);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const navigateTo = (type, item) => {
    setOpen(false);
    if (!isObjectId(workspaceId)) return;
    const openWorkspacePath = (section) => {
      const path = workspacePath(workspaceId, section);
      if (path) navigate(path);
    };
    switch (type) {
      case 'projects': openWorkspacePath(`kanban?project=${item._id}`); break;
      case 'tasks': openWorkspacePath(`kanban?project=${item.project}`); break;
      case 'wiki': openWorkspacePath("wiki"); break;
      case 'resources': openWorkspacePath("resources"); break;
      case 'members': openWorkspacePath("settings?tab=members"); break;
      default: break;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setFocused(f => Math.min(f + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
    if (e.key === "Enter" && allItems[focused]) {
      navigateTo(allItems[focused].type, allItems[focused].item);
    }
  };

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition"
    >
      <span>🔍</span>
      <span>Search...</span>
      <kbd className="text-[9px] font-mono border border-zinc-700 rounded px-1 text-zinc-600">⌘K</kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-900">
          <span className="text-zinc-500 text-lg">{loading ? '⟳' : '🔍'}</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search projects, tasks, wiki, resources, members..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-zinc-600"
          />
          <kbd
            onClick={() => setOpen(false)}
            className="text-[10px] text-zinc-600 font-mono border border-zinc-800 rounded px-1.5 py-0.5 cursor-pointer hover:text-zinc-400"
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query ? (
            <div className="p-5">
              <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mb-3">Quick Navigate</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: '🗂', label: 'Projects', path: 'projects' },
                  { icon: '📋', label: 'Kanban', path: 'kanban' },
                  { icon: '💬', label: 'Chat', path: 'chat' },
                  { icon: '📖', label: 'Wiki', path: 'wiki' },
                  { icon: '📎', label: 'Resources', path: 'resources' },
                  { icon: '✨', label: 'AI Center', path: 'ai' },
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => {
                      const path = workspacePath(workspaceId, item.path);
                      if (path) navigate(path);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 p-3 bg-zinc-900/50 border border-zinc-900 rounded-xl hover:border-zinc-700 text-xs text-zinc-400 hover:text-white transition text-left"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : Object.keys(results).length === 0 && !loading ? (
            <div className="py-12 text-center text-zinc-600 text-xs">
              No results for "{query}"
            </div>
          ) : (
            <div className="p-3">
              {RESULT_TYPES.map(typeConfig => {
                const items = results[typeConfig.key];
                if (!items?.length) return null;
                let itemIndex = 0;
                // Calculate offset for this type
                for (const t of RESULT_TYPES) {
                  if (t.key === typeConfig.key) break;
                  itemIndex += (results[t.key]?.length || 0);
                }
                return (
                  <div key={typeConfig.key} className="mb-3">
                    <div className={`flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold ${typeConfig.color} font-mono uppercase tracking-wider`}>
                      <span>{typeConfig.icon}</span>
                      <span>{typeConfig.label}</span>
                    </div>
                    {items.map((item, i) => {
                      const globalIdx = itemIndex + i;
                      const isFocused = focused === globalIdx;
                      return (
                        <button
                          key={item._id}
                          onClick={() => navigateTo(typeConfig.key, item)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs transition ${
                            isFocused ? 'bg-zinc-800 border border-zinc-700' : 'hover:bg-zinc-900/60 border border-transparent'
                          }`}
                        >
                          <span className="text-base flex-shrink-0">{typeConfig.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-zinc-200 font-semibold truncate">
                              {item.name || item.title || item.user?.name || '?'}
                            </div>
                            {(item.description || item.summary || item.user?.email) && (
                              <div className="text-zinc-600 truncate text-[10px] mt-0.5">
                                {item.description || item.summary || item.user?.email}
                              </div>
                            )}
                          </div>
                          {typeConfig.key === 'wiki' && item.category && (
                            <span className="text-[9px] text-zinc-600 font-mono bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 flex-shrink-0">
                              {item.category}
                            </span>
                          )}
                          {typeConfig.key === 'tasks' && item.status && (
                            <span className={`text-[9px] font-mono rounded px-1.5 py-0.5 flex-shrink-0 border ${
                              item.status === 'done' ? 'text-emerald-400 border-emerald-900 bg-emerald-950/40' :
                              item.status === 'in-progress' ? 'text-blue-400 border-blue-900 bg-blue-950/40' :
                              'text-zinc-500 border-zinc-800 bg-zinc-900'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-zinc-900 flex items-center gap-4 text-[10px] text-zinc-700 font-mono">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>ESC Close</span>
          {allItems.length > 0 && <span className="ml-auto">{allItems.length} results</span>}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { projectService } from "../../services/project.service";
import { taskService } from "../../services/task.service";
import { resourceService } from "../../services/resource.service";

export default function CommandPalette({ isOpen, onClose }) {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [dataStore, setDataStore] = useState({
    projects: [],
    tasks: [],
    resources: [],
  });

  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Load all workspace resources when opened
  useEffect(() => {
    if (!isOpen || !workspaceId) return;

    const loadSearchData = async () => {
      setLoading(true);
      try {
        const [projects, tasks, resources] = await Promise.all([
          projectService.getProjectsByWorkspace(workspaceId).catch(() => []),
          taskService.getTasksByWorkspace(workspaceId).catch(() => []),
          resourceService.getResources(workspaceId).catch(() => []),
        ]);

        setDataStore({
          projects: projects || [],
          tasks: tasks || [],
          resources: resources || [],
        });
      } catch (err) {
        console.error("Failed to load command palette data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSearchData();
    setQuery("");
    setSelectedIndex(0);

    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [isOpen, workspaceId]);

  // Perform client-side search filtering
  useEffect(() => {
    if (!query.trim()) {
      // Show recent or empty
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const tempResults = [];

    // Search Projects
    dataStore.projects.forEach((p) => {
      if (p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
        tempResults.push({
          id: p._id,
          title: p.name,
          subtitle: p.description || "Project",
          type: "Project",
          icon: "📁",
          action: () => navigate(`/workspace/${workspaceId}/kanban?project=${p._id}`),
        });
      }
    });

    // Search Tasks
    dataStore.tasks.forEach((t) => {
      if (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        tempResults.push({
          id: t._id,
          title: t.title,
          subtitle: `Task in state: ${t.status?.toUpperCase()}`,
          type: "Task",
          icon: "☑️",
          action: () => navigate(`/workspace/${workspaceId}/kanban?task=${t._id}`),
        });
      }
    });

    // Search Resources (Wiki, Snippets, Links)
    dataStore.resources.forEach((r) => {
      if (r.title?.toLowerCase().includes(q) || r.content?.toLowerCase().includes(q) || r.tags?.some(tag => tag.toLowerCase().includes(q))) {
        const typeLabel = r.type ? r.type.charAt(0).toUpperCase() + r.type.slice(1) : "Resource";
        let icon = "📚";
        let path = `/workspace/${workspaceId}/resources`;
        if (r.type === "wiki") {
          icon = "📖";
          path = `/workspace/${workspaceId}/wiki`;
        } else if (r.type === "snippet") {
          icon = "💻";
          path = `/workspace/${workspaceId}/snippets`;
        }

        tempResults.push({
          id: r._id,
          title: r.title,
          subtitle: r.description || `${typeLabel} item`,
          type: typeLabel,
          icon,
          action: () => navigate(path),
        });
      }
    });

    setResults(tempResults.slice(0, 8)); // limit to top 8
    setSelectedIndex(0);
  }, [query, dataStore, navigate, workspaceId]);

  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
          onClose();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl shadow-indigo-500/5 backdrop-blur-md flex flex-col text-slate-100 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-800/80">
          <span className="text-xl text-slate-500 mr-3">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="w-full py-4 bg-transparent outline-none border-none text-slate-100 placeholder-slate-500 text-base"
            placeholder="Search tasks, projects, wiki entries or snippets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-xs font-bold text-slate-500 hover:text-slate-300 bg-slate-800 px-2 py-1 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
          <span className="text-xs text-slate-500 border border-slate-800 bg-slate-950 px-2 py-1 rounded ml-2">
            ESC
          </span>
        </div>

        {/* Content Area */}
        <div className="max-h-[350px] overflow-y-auto p-2 scrollbar-thin">
          {loading && (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Indexing active workspace...</span>
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div className="py-12 text-center text-slate-500">
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-slate-600 mt-1">Try searching another term</p>
            </div>
          )}

          {!loading && !query && (
            <div className="py-8 px-4 text-center text-slate-500">
              <p className="text-sm font-medium text-slate-400">Search Workspace</p>
              <p className="text-xs text-slate-600 mt-1">
                Type anything to locate projects, items, board tickets, snippets, and documents instantly.
              </p>
              <div className="flex items-center justify-center space-x-4 mt-6 text-xs text-slate-500">
                <span>🎯 Arrow keys to move</span>
                <span>💡 Enter to navigate</span>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                Matching Search Results
              </div>
              {results.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}-${index}`}
                  className={`flex items-center px-3 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                    index === selectedIndex
                      ? "bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/10"
                      : "hover:bg-slate-800/50 text-slate-300"
                  }`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                >
                  <span className="text-xl mr-3 flex items-center justify-center">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div
                      className={`text-xs truncate ${
                        index === selectedIndex ? "text-indigo-200" : "text-slate-500"
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      index === selectedIndex
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {item.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

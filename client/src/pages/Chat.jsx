import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { projectService } from "../services/project.service";
import ChatPanel from "../components/chat/ChatPanel";
import { useWorkspace } from "../context/WorkspaceContext";

export default function Chat() {
  const { id: workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeProjectId = searchParams.get("project");
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { activeWorkspace } = useWorkspace();

  useEffect(() => {
    if (!workspaceId) return;

    const loadProjects = async () => {
      setLoading(true);
      try {
        const data = await projectService.getProjectsByWorkspace(workspaceId);
        setProjects(data || []);
        
        // If there are projects and no project is selected, select the first one by default
        if (data && data.length > 0 && !activeProjectId) {
          setSearchParams({ project: data[0]._id });
        }
      } catch (err) {
        console.error("Failed to load projects for chat rooms:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [workspaceId, activeProjectId, setSearchParams]);

  const handleSelectProject = (projectId) => {
    setSearchParams({ project: projectId });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-slate-950 text-slate-100 overflow-hidden">
      {/* Channels/Projects Sidebar list */}
      <div className="w-64 border-r border-slate-900 bg-slate-950 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-900">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Chat Channels
          </h2>
          <p className="text-[10px] text-slate-500 mt-1 font-mono">
            {activeWorkspace?.name || "Workspace"} Boards
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <span className="inline-block w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-2"></span>
              Loading channels...
            </div>
          ) : projects.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs px-2">
              <p>No active boards yet</p>
              <p className="text-[9px] text-slate-600 mt-0.5">Create a board to open a chat channel</p>
            </div>
          ) : (
            projects.map((proj) => (
              <button
                key={proj._id}
                onClick={() => handleSelectProject(proj._id)}
                className={`w-full flex items-center px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                  proj._id === activeProjectId
                    ? "bg-slate-900 border border-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200"
                }`}
              >
                <span className="text-sm mr-2 flex-shrink-0">#️⃣</span>
                <span className="truncate">{proj.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Live Chat Panel content area */}
      <div className="flex-1 h-full p-6 flex flex-col bg-slate-900/10">
        {activeProjectId ? (
          <div className="flex-1 h-full">
            <ChatPanel projectId={activeProjectId} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-950/60 border border-slate-900 rounded-3xl m-6">
            <span className="text-4xl mb-3">💬</span>
            <h3 className="text-sm font-bold text-slate-300">Welcome to Chat Center</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Select a project board channel from the sidebar to chat with teammates, share resources, and monitor sprint updates in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

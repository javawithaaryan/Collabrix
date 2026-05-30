import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { projectService } from "../services/project.service";
import { taskService } from "../services/task.service";
import { useNotifications } from "../context/NotificationContext";
import api from "../lib/axios";

export default function WorkspaceDashboard() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();
  const { triggerToast } = useNotifications();

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [resources, setResources] = useState([]);
  const [wikis, setWikis] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);

  const fetchDashboardData = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      // Fetch Projects, Tasks, and Activities concurrently
      const [projData, taskData, activityRes, aiRes, resRes, wikiRes] = await Promise.all([
        projectService.getProjectsByWorkspace(workspaceId),
        taskService.getTasksByWorkspace(workspaceId),
        api.get(`/pulse/workspace/${workspaceId}`),
        api.get(`/pulse/workspace/${workspaceId}/summary`),
        api.get(`/resources/workspace/${workspaceId}`),
        api.get(`/wiki/workspace/${workspaceId}`),
      ]);

      setProjects(projData || []);
      setTasks(taskData || []);
      setActivities(activityRes.data?.events || []);
      setAiSummary(aiRes.data?.summary || null);
      setResources(resRes.data?.resources || []);
      setWikis(wikiRes.data?.wikis || []);
    } catch (err) {
      console.error("Dashboard data fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [workspaceId]);

  const handleTriggerAiSummary = async () => {
    setGeneratingAi(true);
    try {
      const res = await api.get(`/pulse/workspace/${workspaceId}/summary`);
      setAiSummary(res.data?.summary);
      triggerToast("AI workspace summary updated!", "✨");
    } catch (err) {
      console.error("Failed to regenerate summary", err);
      triggerToast("Failed to generate AI summary", "❌");
    } finally {
      setGeneratingAi(false);
    }
  };

  if (loading || workspaceLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Assembling workspace command center...</p>
      </div>
    );
  }

  // Calculate metrics
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasksCount = tasks.length;
  const sprintCompletionRate = totalTasksCount > 0 ? Math.round((doneTasks / totalTasksCount) * 100) : 0;
  
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  
  const blockedTasksCount = tasks.filter((t) => t.blockers && t.blockers.length > 0 && t.status !== "done").length;
  
  // Calculate upcoming deadlines (tasks with due dates or timeline hints, or projects ending soon)
  const upcomingDeadlines = tasks
    .filter((t) => t.status !== "done" && t.milestone)
    .slice(0, 4);

  // Calculate Velocity (tasks completed in last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const velocity = tasks.filter((t) => t.status === "done" && new Date(t.updatedAt) >= lastWeek).length;

  // Recent discussions (extracting message/comment events from activities)
  const recentDiscussions = activities.filter((a) => a.type === "message_sent" || a.type === "comment_added").slice(0, 3);


  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-6">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
            Command Center
          </span>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mt-1">
            {activeWorkspace?.name || "Workspace"}
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            {activeWorkspace?.description || "High-performance collaborative engineering workspace."}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to={`/workspace/${workspaceId}/sprint-planner`}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
          >
            <span>✨ AI Sprint Planner</span>
          </Link>
          <Link
            to={`/workspace/${workspaceId}/projects`}
            className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 rounded-xl text-xs font-bold transition-all"
          >
            Manage Projects
          </Link>
        </div>
      </div>

      {/* Top Level Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Sprint Completion Card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
              <span>Sprint Health</span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 font-mono">
              {sprintCompletionRate}%
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${sprintCompletionRate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
              <span>{doneTasks} Completed</span>
              <span>{totalTasksCount} Total Tasks</span>
            </div>
          </div>
        </div>

        {/* Blocked Tasks Card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
              <span>Blocked Tasks</span>
              {blockedTasksCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>}
            </div>
            <div className={`text-3xl font-extrabold mt-2 font-mono ${blockedTasksCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {blockedTasksCount}
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 font-mono leading-relaxed">
            {blockedTasksCount > 0 
              ? `${blockedTasksCount} critical items require developer attention to unblock progress.`
              : "All clear! No current active blockers reported."}
          </div>
        </div>

        {/* Velocity Card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
          <div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
              Team Velocity
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 font-mono flex items-baseline gap-1">
              {velocity} <span className="text-sm text-slate-500 font-sans font-medium">tasks/wk</span>
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 font-mono">
            Measured by tasks completed over the trailing 7 days.
          </div>
        </div>

        {/* Active Projects Card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between">
          <div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
              Active Projects
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 font-mono">
              {projects.length}
            </div>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 font-mono">
            {projects.length > 0
              ? `Tracking ${projects.filter((p) => p.status === "Active").length} active development branches.`
              : "No active projects. Click Manage Projects to seed."}
          </div>
        </div>

        {/* Work Distribution Card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 hover:border-slate-800 transition-all flex flex-col justify-between hidden md:flex">
          <div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-mono">
              Tasks in Backlog
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 font-mono">
              {tasks.filter((t) => t.status !== "done").length}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-1 text-[9px] font-mono text-center">
            <div className="bg-slate-950 p-1 rounded border border-slate-900">
              <span className="text-slate-500 block">TODO</span>
              <span className="text-white font-bold">{todoTasks}</span>
            </div>
            <div className="bg-slate-950 p-1 rounded border border-slate-900">
              <span className="text-slate-500 block">DOING</span>
              <span className="text-indigo-400 font-bold">{inProgressTasks}</span>
            </div>
            <div className="bg-slate-950 p-1 rounded border border-slate-900">
              <span className="text-slate-500 block">DONE</span>
              <span className="text-emerald-400 font-bold">{doneTasks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Atmosphere Card */}
      <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/40 to-slate-950/20 border border-indigo-500/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-wide">
                AI Workspace Intelligence
              </h2>
              <p className="text-[10px] text-slate-500 font-mono">
                Gemini LLM real-time analysis of team timeline, conversations, and commits
              </p>
            </div>
          </div>
          <button
            onClick={handleTriggerAiSummary}
            disabled={generatingAi}
            className="text-[10px] font-bold font-mono bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50"
          >
            {generatingAi ? "Regenerating..." : "Regenerate Summary"}
          </button>
        </div>

        {aiSummary ? (
          <div className="grid md:grid-cols-3 gap-6 mt-4">
            <div className="md:col-span-2 space-y-4">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                  Weekly Summary
                </span>
                <p className="text-xs text-slate-300 leading-relaxed mt-1 font-medium">
                  "{aiSummary.weeklySummary}"
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Current Focus
                  </span>
                  <p className="text-xs text-white font-semibold mt-1 truncate">
                    🎯 {aiSummary.focus}
                  </p>
                </div>
                <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Synergy & Collaboration
                  </span>
                  <p className="text-xs text-white font-semibold mt-1 truncate">
                    🤝 {aiSummary.collaborationSpikes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/30 border border-slate-900/60 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono block mb-2">
                  Atmosphere Metrics
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Momentum</span>
                    <span className="text-white font-bold font-mono">{aiSummary.sprintMomentum}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Busiest Area</span>
                    <span className="text-white font-bold font-mono truncate max-w-[140px]">
                      {aiSummary.busiestArea}
                    </span>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-900/80 pt-3">
                <span className="text-[9px] text-amber-500 font-bold uppercase tracking-wider font-mono">
                  🚨 Active Blocker
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                  {aiSummary.blockers}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No intelligence generated. Click Regenerate to compile.
          </div>
        )}
      </div>

      {/* Main Grid: Projects & Deadlines | Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Projects and Deadlines */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Projects Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-white tracking-wide">
                Project Roadmap Planning
              </h2>
              <Link
                to={`/workspace/${workspaceId}/projects`}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                View all projects →
              </Link>
            </div>

            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/workspace/${workspaceId}/kanban?project=${project._id}`)}
                    className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-4 transition-all cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-white hover:text-indigo-400 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-1 max-w-md">
                        {project.description || "No project description seeded."}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mt-1">
                        <span>Milestones: {project.milestones?.length || 0}</span>
                        <span>Releases: {project.releases?.length || 0}</span>
                        <span>Status: <span className="text-indigo-400">{project.status}</span></span>
                      </div>
                    </div>
                    <div className="w-full md:w-32 flex flex-col items-end gap-1">
                      <span className="text-[10px] font-mono text-slate-400">{project.progress || 0}% Complete</span>
                      <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No projects created. Go to Projects and create one.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Deadlines / Milestones */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Upcoming Deadlines & Milestones
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((task) => (
                  <div
                    key={task._id}
                    onClick={() => navigate(`/workspace/${workspaceId}/kanban?project=${task.project}`)}
                    className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between hover:border-slate-800 transition cursor-pointer"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider font-mono bg-slate-900 border border-slate-850 px-2 py-0.5 rounded">
                          {task.milestone}
                        </span>
                        <span className={`text-[8px] font-bold font-mono px-1.5 py-0.5 rounded border uppercase ${
                          task.priority === "high" ? "bg-red-950/40 text-red-400 border-red-900/30" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white mt-2 line-clamp-1">
                        {task.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                    <div className="border-t border-slate-900/80 mt-3 pt-2 text-[9px] text-slate-500 font-mono flex justify-between">
                      <span>Owner: {task.suggestedOwner || "Unassigned"}</span>
                      <span className="text-indigo-400">Seq {task.deployOrder}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500 col-span-2">
                  No upcoming deadlines found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: Activity and Discussions */}
        <div className="space-y-6">
          {/* Team Activity Feed */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-extrabold text-white tracking-wide">
              Recent Activity Feed
            </h2>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {activities.length > 0 ? (
                activities.slice(0, 10).map((act) => (
                  <div key={act._id} className="flex gap-3 text-xs leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-350 text-[9px] uppercase flex-shrink-0 mt-0.5">
                      {act.actorName?.[0] || "S"}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-slate-300 font-medium">
                        <span className="text-white font-bold">{act.actorName || "System"}</span>{" "}
                        {act.content}
                      </p>
                      <span className="text-[9px] text-slate-550 font-mono block">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-500">
                  No activity logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Recent Discussions */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-white tracking-wide">
                Recent Discussions
              </h2>
              <Link to={`/workspace/${workspaceId}/chat`} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold font-mono">ALL CHATS</Link>
            </div>
            <div className="space-y-3">
              {recentDiscussions.length > 0 ? (
                recentDiscussions.map((disc, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex flex-col gap-1 hover:border-slate-800 transition">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-white">{disc.actorName}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{new Date(disc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{disc.content.replace(`${disc.actorName} sent a message: `, "").replace(`${disc.actorName} added a comment: `, "")}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-500">
                  No recent chatter. Check the team chat!
                </div>
              )}
            </div>
          </div>

          {/* Resource Usage */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-extrabold text-white tracking-wide">
                Knowledge Resources
              </h2>
              <Link to={`/workspace/${workspaceId}/resources`} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold font-mono">VIEW ALL ({resources.length})</Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {resources.length > 0 ? (
                resources.slice(0, 4).map((res) => (
                  <a href={res.url} target="_blank" rel="noreferrer" key={res._id} className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl flex items-center gap-3 hover:bg-slate-900 transition">
                    {res.favicon ? <img src={res.favicon} alt="" className="w-5 h-5 rounded-sm" onError={e => e.target.style.display='none'} /> : <span className="text-xl">📄</span>}
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{res.title}</p>
                      <p className="text-[9px] text-slate-500 font-mono capitalize truncate">{res.type}</p>
                    </div>
                  </a>
                ))
              ) : (
                <div className="col-span-2 text-center py-4 text-xs text-slate-500">
                  No resources saved. Link external docs to this workspace!
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-extrabold text-white tracking-wide mb-1">
              Command Shortcuts
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={`/workspace/${workspaceId}/kanban`}
                className="bg-slate-950/60 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white p-3 rounded-xl text-center text-xs font-bold transition-all"
              >
                📋 Kanban Board
              </Link>
              <Link
                to={`/workspace/${workspaceId}/chat`}
                className="bg-slate-950/60 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white p-3 rounded-xl text-center text-xs font-bold transition-all"
              >
                💬 Team Chat
              </Link>
              <Link
                to={`/workspace/${workspaceId}/resources`}
                className="bg-slate-950/60 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white p-3 rounded-xl text-center text-xs font-bold transition-all"
              >
                📂 Resource Hub
              </Link>
              <Link
                to={`/workspace/${workspaceId}/wiki`}
                className="bg-slate-950/60 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white p-3 rounded-xl text-center text-xs font-bold transition-all"
              >
                📖 Team Wiki
              </Link>
              <Link
                to={`/workspace/${workspaceId}/snippets`}
                className="bg-slate-950/60 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white p-3 rounded-xl text-center text-xs font-bold transition-all"
              >
                💻 Code Ledger
              </Link>
              <Link
                to={`/workspace/${workspaceId}/code-review`}
                className="bg-slate-950/60 border border-slate-900 hover:border-slate-800 text-slate-300 hover:text-white p-3 rounded-xl text-center text-xs font-bold transition-all"
              >
                🔬 AI Code Auditor
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Team Health & Knowledge Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Workload Distribution */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold text-white mb-4">👥 Workload Distribution</h3>
          <div className="space-y-2">
            {(() => {
              const owners = {};
              tasks.filter(t => t.status !== 'done').forEach(t => {
                const name = t.assignee?.name || 'Unassigned';
                owners[name] = (owners[name] || 0) + 1;
              });
              const max = Math.max(...Object.values(owners), 1);
              return Object.entries(owners).sort(([,a],[,b]) => b-a).slice(0,6).map(([name, count]) => (
                <div key={name} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-violet-700 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">{name[0]}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-slate-300 font-medium">{name.split(' ')[0]}</span>
                      <span className="text-slate-500 font-mono">{count} tasks</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1">
                      <div className="bg-violet-500 h-1 rounded-full" style={{width: `${(count/max)*100}%`}} />
                    </div>
                  </div>
                </div>
              ));
            })()}
            {tasks.filter(t => t.status !== 'done').length === 0 && (
              <div className="text-center py-4 text-xs text-slate-500">All tasks completed! 🎉</div>
            )}
          </div>
        </div>

        {/* Knowledge Health */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold text-white mb-4">📖 Knowledge Health</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-violet-400 font-mono">{wikis.length}</div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Wiki Docs</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-blue-400 font-mono">{resources.length}</div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Resources</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-emerald-400 font-mono">{[...new Set(wikis.map(w=>w.category))].filter(Boolean).length}</div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Categories</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-amber-400 font-mono">{wikis.filter(w=>w.status==='Published').length}</div>
              <div className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Published</div>
            </div>
          </div>
          <Link to={`/workspace/${workspaceId}/wiki`} className="mt-3 block text-center text-[10px] text-indigo-400 hover:text-indigo-300 font-mono">View Wiki →</Link>
        </div>

        {/* Sprint Risk Radar */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5">
          <h3 className="text-sm font-extrabold text-white mb-4">⚠️ Sprint Risk Radar</h3>
          <div className="space-y-3">
            {blockedTasksCount > 0 && (
              <div className="flex items-start gap-2 p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-xl">
                <span className="text-rose-400 mt-0.5">🔴</span>
                <div>
                  <div className="text-xs font-bold text-rose-400">{blockedTasksCount} Blocked Tasks</div>
                  <div className="text-[10px] text-slate-500">Require immediate attention</div>
                </div>
              </div>
            )}
            {tasks.filter(t=>t.status==='todo').length > tasks.filter(t=>t.status==='done').length && (
              <div className="flex items-start gap-2 p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-xl">
                <span className="text-amber-400 mt-0.5">🟡</span>
                <div>
                  <div className="text-xs font-bold text-amber-400">High Backlog</div>
                  <div className="text-[10px] text-slate-500">{tasks.filter(t=>t.status==='todo').length} tasks in queue</div>
                </div>
              </div>
            )}
            {velocity >= 5 && (
              <div className="flex items-start gap-2 p-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                <span className="text-emerald-400 mt-0.5">🟢</span>
                <div>
                  <div className="text-xs font-bold text-emerald-400">Strong Velocity</div>
                  <div className="text-[10px] text-slate-500">{velocity} tasks/week — above target</div>
                </div>
              </div>
            )}
            {blockedTasksCount === 0 && velocity < 5 && tasks.filter(t=>t.status==='todo').length <= tasks.filter(t=>t.status==='done').length && (
              <div className="flex items-start gap-2 p-2.5 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                <span className="text-emerald-400 mt-0.5">🟢</span>
                <div>
                  <div className="text-xs font-bold text-emerald-400">Sprint Healthy</div>
                  <div className="text-[10px] text-slate-500">No major risks detected</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

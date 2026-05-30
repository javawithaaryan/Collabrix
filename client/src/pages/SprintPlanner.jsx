import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectService } from "../services/project.service";
import { useWorkspace } from "../context/WorkspaceContext";
import { useNotifications } from "../context/NotificationContext";
import api from "../lib/axios";
import socket from "../socket";

const PRIORITY_STYLES = {
  high: "bg-red-950/45 text-red-400 border-red-900/40",
  medium: "bg-amber-950/30 text-amber-400 border-amber-900/30",
  low: "bg-zinc-800/40 text-zinc-400 border-zinc-700/40",
};

const LOADING_STAGES = [
  "Analyzing project requirements...",
  "Planning sprint architecture...",
  "Identifying engineering milestones...",
  "Sequencing task dependencies...",
  "Assigning priorities and timelines...",
  "Assembling collaborative sprint plan...",
];

export default function SprintPlanner() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();
  const { user } = useWorkspace();
  const { triggerToast } = useNotifications();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [sprint, setSprint] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");
  const [rejectedTasks, setRejectedTasks] = useState(new Set());
  const [populating, setPopulating] = useState(false);
  const [populateProgress, setPopulateProgress] = useState(0);

  const stageTimerRef = useRef(null);

  useEffect(() => {
    if (!workspaceId) return;
    const loadProjects = async () => {
      try {
        const data = await projectService.getProjectsByWorkspace(workspaceId);
        setProjects(data || []);
        if (data && data.length > 0) {
          setSelectedProjectId(data[0]._id);
        }
      } catch (err) {
        console.error("Failed to load projects for planner:", err);
      }
    };
    loadProjects();
    return () => clearInterval(stageTimerRef.current);
  }, [workspaceId]);

  const startLoadingCycle = () => {
    setLoadingStage(0);
    let stage = 0;
    stageTimerRef.current = setInterval(() => {
      stage = (stage + 1) % LOADING_STAGES.length;
      setLoadingStage(stage);
    }, 1800);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedProjectId || generating) return;
    setError("");
    setSprint(null);
    setRejectedTasks(new Set());
    setGenerating(true);
    startLoadingCycle();

    try {
      const res = await api.post("/ai/generate-sprint", {
        prompt: prompt.trim(),
        projectId: selectedProjectId,
      });
      setSprint(res.data);
      setIsFallback(res.data.isFallback || false);
      setSelectedTab("overview");

      if (res.data.createdTasks > 0) {
        triggerToast(`Sprint populated! ${res.data.createdTasks} tasks added to board.`, "🚀");
        navigate(`/workspace/${workspaceId}/kanban?project=${selectedProjectId}`);
      }
    } catch (err) {
      setError("Sprint generation failed. Please try again.");
      console.error(err);
    } finally {
      clearInterval(stageTimerRef.current);
      setGenerating(false);
    }
  };

  const toggleTaskRejection = (taskIdx) => {
    setRejectedTasks((prev) => {
      const next = new Set(prev);
      next.has(taskIdx) ? next.delete(taskIdx) : next.add(taskIdx);
      return next;
    });
  };

  const acceptedTasks = sprint?.tasks?.filter((_, i) => !rejectedTasks.has(i)) || [];

  const handlePopulateSprint = async () => {
    if (!acceptedTasks.length || populating) return;
    setPopulating(true);
    setPopulateProgress(0);

    const created = [];
    for (let i = 0; i < acceptedTasks.length; i++) {
      const task = acceptedTasks[i];
      try {
        const r = await api.post("/tasks", {
          title: task.title,
          description: task.description || "",
          project: selectedProjectId,
          priority: task.priority || "medium",
          labels: task.labels || [],
          milestone: task.milestone || "",
          suggestedOwner: task.suggestedOwner || "",
          dependencies: task.dependencies || [],
          blockers: task.blockers || [],
          reviewStage: task.reviewStage || "",
          deployOrder: task.deployOrder || 0,
          subtasks: (task.subtasks || []).map((s) =>
            typeof s === "string" ? { title: s, isCompleted: false } : s
          ),
          status: "todo",
        });
        created.push(r.data);
      } catch (e) {
        console.warn("Skipped task setup:", e);
      }
      setPopulateProgress(Math.round(((i + 1) / acceptedTasks.length) * 100));
      await new Promise((r) => setTimeout(r, 100));
    }

    if (created.length > 0) {
      socket.emit("tasks-ai-generated", {
        projectId: selectedProjectId,
        count: created.length,
        actorName: user?.name || "AI Planner",
      });

      triggerToast(`Sprint populated! ${created.length} tasks added to board`, "🚀");
      navigate(`/workspace/${workspaceId}/kanban?project=${selectedProjectId}`);
    }
    setPopulating(false);
  };

  const milestoneGroups = sprint?.milestones?.reduce((acc, m) => {
    acc[m.name] = sprint.tasks?.filter((t) => t.milestone === m.name) || [];
    return acc;
  }, {}) || {};

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          AI Sprint Planner Workshop
        </h1>
        <p className="text-slate-500 text-xs font-mono mt-1">
          Plan milestones, sequence task dependencies, and populate board backlog using Gemini.
        </p>
      </div>

      {!sprint ? (
        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Target project selector */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                Select Project Board
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Describe the features & goals for this sprint
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build an authentication portal using Google OAuth, secure cookie session rotations, and a profile customization portal..."
              rows={4}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 outline-none resize-none focus:border-slate-700 transition text-xs text-white"
            />
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {generating ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{LOADING_STAGES[loadingStage]}</p>
                <p className="text-[10px] text-slate-550 font-mono mt-0.5">Gemini AI is designing sprint sequences...</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || !selectedProjectId}
              className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-slate-200 transition disabled:opacity-40 text-xs"
            >
              Generate AI Sprint Proposal
            </button>
          )}
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-900 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
          {/* Summary bar */}
          <div className="p-6 bg-slate-900/40 border-b border-slate-850 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>{sprint.projectType || "Sprint Proposal"}</span>
                {isFallback && (
                  <span className="text-[9px] bg-amber-950/40 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                    Offline Fallback
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {sprint.milestones?.length || 0} milestones · {acceptedTasks.length} tasks ready to deploy
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSprint(null)}
                className="text-xs text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 px-4 py-2 rounded-xl transition"
              >
                ← Back
              </button>
              <button
                onClick={handlePopulateSprint}
                disabled={!acceptedTasks.length || populating}
                className="bg-white text-black text-xs font-extrabold px-5 py-2 rounded-xl hover:bg-slate-200 transition disabled:opacity-40"
              >
                {populating ? `Populating... ${populateProgress}%` : `Confirm Board Population (${acceptedTasks.length})`}
              </button>
            </div>
          </div>

          {/* Progress loader */}
          {populating && (
            <div className="h-1 bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${populateProgress}%` }}
              />
            </div>
          )}

          {/* Tabs header */}
          <div className="px-6 border-b border-slate-900 bg-slate-950/40 flex gap-2">
            {[
              { id: "overview", label: "Overview Map" },
              { id: "milestones", label: "Milestones Ledger" },
              { id: "tasks", label: `Sequence Items (${sprint.tasks?.length || 0})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTab(t.id)}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition ${
                  selectedTab === t.id ? "border-indigo-500 text-white" : "border-transparent text-slate-500 hover:text-slate-400"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
            {selectedTab === "overview" && (
              <div className="space-y-4">
                {sprint.milestones?.map((m, idx) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-850 rounded-2xl p-4 flex gap-4">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-extrabold text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{m.name}</h4>
                      <p className="text-[11px] text-slate-550 mt-0.5 leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedTab === "milestones" && (
              <div className="space-y-6">
                {sprint.milestones?.map((m, idx) => {
                  const tasks = milestoneGroups[m.name] || [];
                  return (
                    <div key={idx} className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-350 tracking-wide uppercase border-b border-slate-900 pb-2">
                        {m.name}
                      </h4>
                      <div className="space-y-2 pl-4">
                        {tasks.map((t, tIdx) => {
                          const globalIdx = sprint.tasks?.indexOf(t);
                          const rejected = rejectedTasks.has(globalIdx);
                          return (
                            <div
                              key={tIdx}
                              onClick={() => toggleTaskRejection(globalIdx)}
                              className={`p-3 border rounded-xl cursor-pointer transition ${
                                rejected
                                  ? "bg-slate-950/20 border-slate-900/60 opacity-40 line-through text-slate-600"
                                  : "bg-slate-900/40 border-slate-800 hover:border-slate-750 text-slate-300"
                              }`}
                            >
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-semibold">{t.title}</span>
                                <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[t.priority]}`}>
                                  {t.priority}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selectedTab === "tasks" && (
              <div className="space-y-2.5">
                {sprint.tasks?.map((t, idx) => {
                  const rejected = rejectedTasks.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTaskRejection(idx)}
                      className={`p-3 border rounded-xl cursor-pointer transition ${
                        rejected
                          ? "bg-slate-950/20 border-slate-900/60 opacity-40 line-through text-slate-600"
                          : "bg-slate-900/40 border-slate-800 hover:border-slate-750 text-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-mono">Seq {idx + 1}</span>
                          <span className="font-semibold">{t.title}</span>
                        </div>
                        <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[t.priority]}`}>
                          {t.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import api from "../../lib/axios";
import socket from "../../socket";

const PRIORITY_STYLES = {
  high: "bg-red-950/40 text-red-400 border-red-900/40",
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

export default function AiSprintModal({ projectId, onClose, onSprintAccepted, actorName }) {
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
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.focus();
    return () => clearInterval(stageTimerRef.current);
  }, []);

  const startLoadingCycle = () => {
    setLoadingStage(0);
    let stage = 0;
    stageTimerRef.current = setInterval(() => {
      stage = (stage + 1) % LOADING_STAGES.length;
      setLoadingStage(stage);
    }, 1800);
  };

  const generate = async () => {
    if (!prompt.trim() || generating) return;
    setError("");
    setSprint(null);
    setRejectedTasks(new Set());
    setGenerating(true);
    startLoadingCycle();

    try {
      const res = await api.post("/ai/generate-sprint", { prompt: prompt.trim(), projectId });
      setSprint(res.data);
      setIsFallback(res.data.isFallback || false);
      setSelectedTab("overview");
    } catch (err) {
      setError("Sprint generation failed. Please try again.");
      console.error("Sprint generation error:", err.message);
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

  const populateSprint = async () => {
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
          project: projectId,
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
        console.warn("Skipped a sprint task:", e.message);
      }
      setPopulateProgress(Math.round(((i + 1) / acceptedTasks.length) * 100));
      // small delay for the animated board population feel
      await new Promise((r) => setTimeout(r, 120));
    }

    if (created.length > 0) {
      socket.emit("tasks-ai-generated", {
        projectId,
        count: created.length,
        actorName: actorName || "Someone",
      });

      try {
        const msgRes = await api.post("/messages", {
          project: projectId,
          text: `🤖 Gemini AI has generated a new collaborative sprint: "${sprint.projectType || "Sprint"}" containing ${created.length} sequence-planned tasks. Board populated!`,
          isSystem: true,
        });
        socket.emit("send-message", { projectId, message: msgRes.data });
      } catch (err) {
        console.warn("Failed to inject persistent chat announcement:", err.message);
      }
    }

    setPopulating(false);
    onSprintAccepted(created);
    onClose();
  };

  const milestoneGroups = sprint?.milestones?.reduce((acc, m) => {
    acc[m.name] = sprint.tasks?.filter((t) => t.milestone === m.name) || [];
    return acc;
  }, {}) || {};

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-overlay">
      <style>{`
        @keyframes overlayFade {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(4px); }
        }
        @keyframes modalScaleUp {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-overlay {
          animation: overlayFade 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-modal {
          animation: modalScaleUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-modal">
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-900 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-zinc-950 to-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <span className="text-sm">✨</span>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight">AI Sprint Planner</h2>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Collaborative sprint generation powered by Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition p-2 rounded-xl hover:bg-zinc-900"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Input Stage */}
          {!sprint && (
            <div className="p-8 flex flex-col gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Describe your project
                </label>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) generate();
                  }}
                  placeholder={`e.g. "Build a food delivery app with restaurant listings, cart, Stripe payments, and order tracking"\n\nBe specific — the more context you give, the more realistic the sprint.`}
                  className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-zinc-600 transition resize-none h-36 leading-relaxed font-sans"
                />
                <p className="text-zinc-600 text-[10px] mt-2 font-mono">Tip: Press ⌘+Enter to generate</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  "Build a food delivery app with Stripe payments",
                  "Create a real-time team chat platform",
                  "Build an e-commerce store with admin panel",
                  "Design a SaaS analytics dashboard",
                  "Create a social media platform with feeds",
                  "Build a job board with applicant tracking",
                ].map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setPrompt(ex)}
                    className="text-left text-xs text-zinc-500 bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700 hover:text-zinc-300 rounded-xl px-3 py-2.5 transition leading-snug"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-950/30 border border-red-900/30 rounded-xl p-3">
                  ⚠ {error}
                </p>
              )}

              {generating ? (
                <div className="flex flex-col items-center gap-5 py-8">
                  <div className="relative w-16 h-16">
                    <span className="absolute inset-0 rounded-full border-2 border-violet-900/40" />
                    <span className="absolute inset-0 rounded-full border-2 border-t-violet-500 animate-spin" />
                    <span className="absolute inset-2 rounded-full border border-t-indigo-400 animate-spin [animation-duration:1.5s] [animation-direction:reverse]" />
                    <span className="absolute inset-0 flex items-center justify-center text-lg">✨</span>
                  </div>
                  <div className="text-center">
                    <p className="text-zinc-300 text-sm font-medium">{LOADING_STAGES[loadingStage]}</p>
                    <p className="text-zinc-600 text-xs mt-1.5 font-mono">This usually takes 5–15 seconds</p>
                  </div>
                </div>
              ) : (
                <button
                  onClick={generate}
                  disabled={!prompt.trim()}
                  className="bg-white text-black py-3.5 rounded-2xl text-sm font-extrabold hover:bg-zinc-100 transition disabled:opacity-40 tracking-wide"
                >
                  Generate Sprint Plan
                </button>
              )}
            </div>
          )}

          {/* Sprint Preview Stage */}
          {sprint && (
            <div className="flex flex-col">
              {/* Sprint Summary Header */}
              <div className="px-6 py-4 bg-zinc-900/30 border-b border-zinc-900 flex-shrink-0">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-extrabold text-white capitalize">
                        {sprint.projectType || "Sprint Plan"}
                      </h3>
                      {isFallback && (
                        <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-950/40 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded-full">
                          Offline Mode
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {sprint.milestones?.length || 0} milestones · {acceptedTasks.length} tasks selected
                      {rejectedTasks.size > 0 && ` · ${rejectedTasks.size} rejected`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setSprint(null); setError(""); }}
                      className="text-xs text-zinc-400 border border-zinc-800 hover:border-zinc-700 hover:text-zinc-300 px-4 py-2 rounded-xl transition"
                    >
                      ← Regenerate
                    </button>
                    <button
                      onClick={populateSprint}
                      disabled={!acceptedTasks.length || populating}
                      className="bg-white text-black text-xs font-extrabold px-5 py-2 rounded-xl hover:bg-zinc-100 transition disabled:opacity-40 flex items-center gap-2"
                    >
                      {populating ? (
                        <>
                          <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Populating... {populateProgress}%
                        </>
                      ) : (
                        `✓ Populate Board (${acceptedTasks.length} tasks)`
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress bar during population */}
                {populating && (
                  <div className="mt-3 h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-300 rounded-full"
                      style={{ width: `${populateProgress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Tab Navigation */}
              <div className="px-6 border-b border-zinc-900 flex gap-1 flex-shrink-0 bg-zinc-950/40">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "milestones", label: `Milestones (${sprint.milestones?.length || 0})` },
                  { id: "tasks", label: `All Tasks (${sprint.tasks?.length || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`text-xs font-bold py-3 px-4 border-b-2 transition ${
                      selectedTab === tab.id
                        ? "border-white text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-400"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {/* Overview Tab */}
                {selectedTab === "overview" && (
                  <div className="flex flex-col gap-5">
                    {/* Milestone Cards */}
                    <div className="grid gap-4">
                      {sprint.milestones?.map((m, mi) => {
                        const milestoneTasks = milestoneGroups[m.name] || [];
                        const acceptedCount = milestoneTasks.filter(
                          (t) => !rejectedTasks.has(sprint.tasks?.indexOf(t))
                        ).length;
                        return (
                          <div
                            key={mi}
                            className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5 hover:border-zinc-700 transition"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-extrabold text-zinc-400">
                                  {m.order || mi + 1}
                                </span>
                                <h4 className="text-sm font-extrabold text-white">{m.name}</h4>
                              </div>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {acceptedCount} / {milestoneTasks.length} tasks
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 leading-relaxed">{m.description}</p>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {milestoneTasks.slice(0, 4).map((t, ti) => {
                                const globalIdx = sprint.tasks?.indexOf(t);
                                const rejected = rejectedTasks.has(globalIdx);
                                return (
                                  <span
                                    key={ti}
                                    className={`text-[9px] px-2 py-0.5 rounded-full border font-mono transition ${
                                      rejected
                                        ? "bg-zinc-900/20 text-zinc-700 border-zinc-900 line-through"
                                        : "bg-zinc-900/60 text-zinc-400 border-zinc-800"
                                    }`}
                                  >
                                    {t.title.length > 30 ? t.title.slice(0, 30) + "…" : t.title}
                                  </span>
                                );
                              })}
                              {milestoneTasks.length > 4 && (
                                <span className="text-[9px] text-zinc-600 font-mono">
                                  +{milestoneTasks.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Milestones Tab — grouped task lists */}
                {selectedTab === "milestones" && (
                  <div className="flex flex-col gap-6">
                    {sprint.milestones?.map((m, mi) => {
                      const milestoneTasks = milestoneGroups[m.name] || [];
                      return (
                        <div key={mi}>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[9px] font-extrabold text-zinc-400 flex-shrink-0">
                              {m.order || mi + 1}
                            </span>
                            <h4 className="text-xs font-extrabold text-zinc-300 uppercase tracking-wider">{m.name}</h4>
                            <span className="text-[9px] text-zinc-600 font-mono ml-auto">{m.description}</span>
                          </div>
                          <div className="flex flex-col gap-2 pl-7">
                            {milestoneTasks.map((task) => {
                              const globalIdx = sprint.tasks?.indexOf(task);
                              const rejected = rejectedTasks.has(globalIdx);
                              return (
                                <TaskPreviewCard
                                  key={globalIdx}
                                  task={task}
                                  rejected={rejected}
                                  onToggle={() => toggleTaskRejection(globalIdx)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* All Tasks Tab */}
                {selectedTab === "tasks" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-zinc-500">
                        Click tasks to include/exclude them from the sprint
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRejectedTasks(new Set())}
                          className="text-[9px] font-extrabold uppercase text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded-lg transition"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setRejectedTasks(new Set(sprint.tasks?.map((_, i) => i)))}
                          className="text-[9px] font-extrabold uppercase text-zinc-500 hover:text-zinc-400 border border-zinc-900 px-2.5 py-1 rounded-lg transition"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>
                    {sprint.tasks?.map((task, i) => (
                      <TaskPreviewCard
                        key={i}
                        task={task}
                        rejected={rejectedTasks.has(i)}
                        onToggle={() => toggleTaskRejection(i)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskPreviewCard({ task, rejected, onToggle }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-xl transition-all duration-200 ${
        rejected
          ? "bg-zinc-950/30 border-zinc-900/60 opacity-50 font-sans"
          : "bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 font-sans"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <button
          onClick={onToggle}
          className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition ${
            rejected
              ? "border-zinc-700 bg-transparent"
              : "border-violet-500 bg-violet-500/20"
          }`}
        >
          {!rejected && <span className="text-violet-300 text-[8px]">✓</span>}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <h5 className={`text-xs font-bold leading-snug ${rejected ? "text-zinc-600 line-through" : "text-zinc-200"}`}>
              {task.title}
            </h5>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.deployOrder && (
                <span className="text-[9px] bg-zinc-900 text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded font-mono" title="Deploy sequence order">
                  #{task.deployOrder}
                </span>
              )}
              {task.timeline && (
                <span className="text-[9px] text-zinc-650 font-mono">{task.timeline}</span>
              )}
              <span
                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                  PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                }`}
              >
                {task.priority}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mt-1.5">
            {task.milestone && (
              <span className="text-[9px] bg-violet-950/30 text-violet-400 border border-violet-900/30 px-1.5 py-0.5 rounded font-mono">
                {task.milestone}
              </span>
            )}
            {(task.labels || []).map((l, li) => (
              <span
                key={li}
                className="text-[9px] bg-zinc-900 text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded font-mono"
              >
                {l}
              </span>
            ))}
            {task.suggestedOwner && (
              <span className="text-[9px] text-zinc-400 font-mono bg-zinc-900/60 border border-zinc-850 px-1.5 py-0.5 rounded">
                👤 {task.suggestedOwner}
              </span>
            )}
            {task.reviewStage && (
              <span className="text-[9px] bg-indigo-950/30 text-indigo-400 border border-indigo-900/30 px-1.5 py-0.5 rounded font-mono">
                🔍 {task.reviewStage}
              </span>
            )}
          </div>

          {task.description && (
            <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Dependencies / Blockers */}
          {((task.dependencies && task.dependencies.length > 0) || (task.blockers && task.blockers.length > 0)) && (
            <div className="flex flex-col gap-1.5 mt-2.5 border-t border-zinc-900/50 pt-2 font-mono text-[9px]">
              {task.blockers && task.blockers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-red-400/80 font-extrabold text-[8px] uppercase tracking-wider">🚫 Blocked By:</span>
                  {task.blockers.map((b, bi) => (
                    <span key={bi} className="bg-red-950/10 text-red-400 border border-red-950/20 px-1.5 py-0.5 rounded">
                      {b}
                    </span>
                  ))}
                </div>
              )}
              {task.dependencies && task.dependencies.length > 0 && !task.blockers?.includes(task.dependencies[0]) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-550 font-extrabold text-[8px] uppercase tracking-wider">⛓ Prerequisites:</span>
                  {task.dependencies.map((d, di) => (
                    <span key={di} className="bg-zinc-900/60 text-zinc-450 border border-zinc-800/80 px-1.5 py-0.5 rounded">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {task.subtasks?.length > 0 && (
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-[9px] text-zinc-600 hover:text-zinc-400 mt-2 transition font-mono"
            >
              {expanded ? "▾ Hide" : "▸ Show"} {task.subtasks.length} subtasks
            </button>
          )}
          {expanded && (
            <ul className="mt-2 flex flex-col gap-1 pl-2">
              {task.subtasks.map((s, si) => (
                <li key={si} className="text-[9px] text-zinc-650 flex items-start gap-1.5">
                  <span className="mt-0.5 flex-shrink-0 text-zinc-700">◦</span>
                  {typeof s === "string" ? s : s.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

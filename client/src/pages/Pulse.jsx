import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import Avatar from "../components/ui/Avatar";
import Skeleton from "../components/ui/Skeleton";

export default function Pulse() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState("");
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const fetchPulseTimeline = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/pulse/workspace/${workspaceId}`);
      setEvents(res.data.events || []);
      setInsight(res.data.temporalInsight || "");
    } catch (err) {
      console.error("Failed to load Engineer’s Space:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceSummary = async () => {
    try {
      setLoadingSummary(true);
      const res = await api.get(`/pulse/workspace/${workspaceId}/summary`);
      setAiSummary(res.data.summary || null);
    } catch (err) {
      console.error("Failed to load AI summary:", err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchPulseTimeline();
    fetchWorkspaceSummary();
  }, [workspaceId]);

  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit("join-workspace", { workspaceId });

    const onNewPulse = (newEvent) => {
      setEvents((prev) => {
        if (prev.some((e) => e._id === newEvent._id)) return prev;
        return [newEvent, ...prev];
      });
    };

    const onPulseUpdated = (updatedEvent) => {
      setEvents((prev) =>
        prev.map((e) => (e._id === updatedEvent._id ? updatedEvent : e))
      );
    };

    socket.on("pulse:new", onNewPulse);
    socket.on("pulse:updated", onPulseUpdated);

    return () => {
      socket.off("pulse:new", onNewPulse);
      socket.off("pulse:updated", onPulseUpdated);
    };
  }, [workspaceId]);

  const handleDeepLink = (event) => {
    const meta = event.metadata || {};
    if (meta.taskId) {
      navigate(`/project/${meta.projectId || workspaceId}?task=${meta.taskId}`);
    } else if (meta.resourceId) {
      navigate(`/workspace/${workspaceId}/resources`);
    } else if (meta.wikiId || event.type === "wiki_updated") {
      navigate(`/workspace/${workspaceId}/wiki`);
    } else if (meta.snippetId || event.type === "snippet_saved") {
      navigate(`/workspace/${workspaceId}/snippets`);
    } else if (meta.reviewId || event.type === "review_generated") {
      navigate(`/workspace/${workspaceId}/code-review`);
    } else if (meta.projectId) {
      navigate(`/project/${meta.projectId}`);
    }
  };

  const groupEvents = (rawEvents) => {
    if (!rawEvents || rawEvents.length === 0) return [];
    const grouped = [];
    let currentGroup = null;

    for (const event of rawEvents) {
      const isTaskDone = event.content && (
        event.content.includes("completed task") || 
        (event.content.includes("moved") && event.content.includes("to Done")) ||
        (event.content.includes("marked") && event.content.includes("as completed"))
      );
      const actorName = event.actor?.name || event.actorName || "A teammate";

      if (isTaskDone) {
        if (currentGroup && currentGroup.actorName === actorName) {
          currentGroup.count += 1;
          currentGroup.details.push(event.content);
          currentGroup.ids.push(event._id);
        } else {
          if (currentGroup) grouped.push(currentGroup);
          currentGroup = {
            _id: event._id,
            isGroup: true,
            actorName,
            type: "task_completion",
            count: 1,
            content: `${actorName} completed task`,
            details: [event.content],
            ids: [event._id],
            createdAt: event.createdAt,
            metadata: event.metadata,
          };
        }
      } else {
        if (currentGroup) {
          grouped.push(currentGroup);
          currentGroup = null;
        }
        grouped.push({
          ...event,
          actorName,
        });
      }
    }
    if (currentGroup) grouped.push(currentGroup);
    return grouped;
  };

  const processedEvents = groupEvents(events);

  return (
    <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto scrollbar-thin flex flex-col gap-6">
          <div className="border-b border-zinc-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase font-mono">
                Engineer’s Space
              </h1>
              <p className="text-zinc-550 text-xs mt-1.5 font-mono">
                Collaborative engineering memory & realtime workspace heartbeat.
              </p>
            </div>

            {insight && (
              <div className="bg-zinc-950/80 border border-zinc-900 px-4 py-2 rounded-xl text-[10px] font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                {insight}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 flex flex-col gap-4">
              {loading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 flex gap-4 items-center">
                      <Skeleton className="h-6 w-16 rounded font-mono" />
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </div>
                  ))}
                </div>
              ) : processedEvents.length === 0 ? (
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-16 text-center flex flex-col items-center gap-4">
                  <span className="text-4xl select-none font-mono">⚡</span>
                  <h3 className="text-sm font-bold text-zinc-300 font-mono">[space_empty]</h3>
                  <p className="text-zinc-655 text-xs max-w-sm font-mono leading-relaxed">
                    No timeline logs generated yet. Try seeding a new AI sprint, moving board cards, or sharing resource hubs. Let's build your team's engineering memory.
                  </p>
                </div>
              ) : (
                <div className="relative border-l border-zinc-900 ml-4 pl-6 flex flex-col gap-6">
                  {processedEvents.map((event) => {
                    const timeStr = new Date(event.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });
                    const hasDeepLink = event.metadata?.taskId || event.metadata?.resourceId || event.metadata?.projectId || event.metadata?.wikiId || event.metadata?.snippetId || event.metadata?.reviewId || event.type?.includes("wiki") || event.type?.includes("snippet") || event.type?.includes("review");

                    return (
                      <div
                        key={event._id}
                        onClick={() => hasDeepLink && handleDeepLink(event)}
                        className={`relative group flex items-start gap-4 p-3.5 bg-zinc-950/20 border border-zinc-900/60 rounded-2xl transition hover:border-zinc-800 ${
                          hasDeepLink ? "cursor-pointer" : ""
                        } animate-fade-in`}
                      >
                        <span className="absolute -left-[31px] top-[22px] w-2.5 h-2.5 rounded-full bg-zinc-950 border-2 border-zinc-800 group-hover:border-zinc-500 transition" />

                        <span className="text-[10px] text-zinc-600 font-mono mt-0.5 whitespace-nowrap select-none">
                          {timeStr}
                        </span>

                        <div className="flex-1">
                          {event.isGroup ? (
                            <div>
                              <p className="text-xs text-emerald-400 font-sans font-semibold leading-relaxed">
                                🛠️ {event.actorName} completed {event.count} engineering tasks
                              </p>
                              <div className="mt-1.5 pl-3 border-l border-zinc-800 flex flex-col gap-1 text-[11px] text-zinc-400 font-mono">
                                {event.details.map((detail, dIdx) => (
                                  <div key={dIdx} className="hover:text-zinc-200 transition">
                                    • {detail.replace(event.actorName, "").trim()}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-300 font-sans leading-relaxed group-hover:text-white transition">
                              {event.content}
                            </p>
                          )}

                          {event.metadata?.count > 1 && event.metadata?.updates?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1 font-mono text-[9px] text-zinc-500">
                              <span>Reconfigured:</span>
                              {event.metadata.updates.map((upd, uIdx) => (
                                <span key={uIdx} className="bg-zinc-900/60 border border-zinc-855 px-1.5 py-0.5 rounded">
                                  {upd}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {hasDeepLink && (
                          <span className="text-zinc-650 group-hover:text-white transition text-xs select-none pl-2">
                            →
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-1 flex flex-col gap-6">
              {aiSummary?.weeklySummary && (
                <div className="bg-gradient-to-br from-zinc-950 to-zinc-900/90 border border-emerald-900/40 rounded-3xl p-5 shadow-lg shadow-black/40">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm">📅</span>
                    <h3 className="text-xs font-extrabold uppercase font-mono text-emerald-400 tracking-wider">Weekly Summary</h3>
                  </div>
                  <p className="text-xs text-zinc-350 font-mono leading-relaxed bg-zinc-900/20 p-3 rounded-xl border border-zinc-900">
                    {aiSummary.weeklySummary}
                  </p>
                </div>
              )}

              <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-5">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-zinc-900">
                  <span className="text-sm select-none font-mono">🤖</span>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase font-mono text-zinc-400">Workspace Intelligence</h3>
                    <p className="text-[9px] text-zinc-600 font-mono">Workspace diagnostics and diagnostics ledger</p>
                  </div>
                </div>

                {loadingSummary ? (
                  <div className="flex flex-col gap-3 animate-pulse py-2">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                ) : aiSummary ? (
                  <div className="flex flex-col gap-4 font-mono text-[10px]">
                    <div>
                      <span className="text-zinc-500 block uppercase tracking-wider mb-1">🎯 Active Focus</span>
                      <p className="text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900">{aiSummary.focus}</p>
                    </div>

                    <div>
                      <span className="text-zinc-500 block uppercase tracking-wider mb-1">🛑 Blockers</span>
                      <p className="text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900">{aiSummary.blockers}</p>
                    </div>

                    <div>
                      <span className="text-zinc-500 block uppercase tracking-wider mb-1">📈 Collaboration Trends</span>
                      <p className="text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900">{aiSummary.trends}</p>
                    </div>

                    <div className="border-t border-zinc-900 pt-4 mt-1 flex flex-col gap-3">
                      <div>
                        <span className="text-zinc-500 block uppercase tracking-wider mb-1">🔥 Most Active Sprint</span>
                        <p className="text-emerald-400 font-bold">{aiSummary.mostActiveSprint || "Sprint 2 (Realtime & Sec)"}</p>
                      </div>

                      <div>
                        <span className="text-zinc-500 block uppercase tracking-wider mb-1">⚡ Busiest Engineering Area</span>
                        <p className="text-zinc-300">{aiSummary.busiestArea || "Realtime Sync Framework"}</p>
                      </div>

                      <div>
                        <span className="text-zinc-500 block uppercase tracking-wider mb-1">🔗 Collaboration Spikes</span>
                        <p className="text-violet-400">{aiSummary.collaborationSpikes || "Aryan + Bhoomi pairing on tasks"}</p>
                      </div>

                      <div>
                        <span className="text-zinc-500 block uppercase tracking-wider mb-1">🚀 Sprint Momentum</span>
                        <p className="text-amber-400 font-bold">{aiSummary.sprintMomentum || "86% completion"}</p>
                      </div>

                      <div>
                        <span className="text-zinc-500 block uppercase tracking-wider mb-1">💬 Most Discussed Task</span>
                        <p className="text-zinc-300 truncate" title={aiSummary.mostDiscussedTask}>{aiSummary.mostDiscussedTask || "JWT Socket Hardening"}</p>
                      </div>
                    </div>

                    <div className="border-t border-zinc-900 pt-3">
                      <span className="text-zinc-500 block uppercase tracking-wider mb-1">✨ Atmosphere</span>
                      <p className="text-zinc-300 leading-relaxed bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-900 italic">{aiSummary.atmosphere}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600 italic">No workspace diagnostics generated yet.</p>
                )}
              </div>
          </div>
        </div>
      </div>
  );
}

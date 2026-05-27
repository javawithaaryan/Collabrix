import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import socket from "../socket";
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
      console.error("Failed to load workspace pulse:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceSummary = async () => {
    try {
      setLoadingSummary(true);

      const res = await api.get(
        `/pulse/workspace/${workspaceId}/summary`
      );

      setAiSummary(res.data.summary || null);
    } catch (err) {
      console.error("Failed to load workspace summary:", err.message);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchPulseTimeline();
    fetchWorkspaceSummary();
  }, [workspaceId]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.emit("join-workspace", { workspaceId });

    const onNewPulse = (newEvent) => {
      setEvents((prev) => {
        if (prev.some((e) => e._id === newEvent._id)) {
          return prev;
        }

        return [newEvent, ...prev];
      });
    };

    const onPulseUpdated = (updatedEvent) => {
      setEvents((prev) =>
        prev.map((e) =>
          e._id === updatedEvent._id ? updatedEvent : e
        )
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
      navigate(
        `/project/${meta.projectId || workspaceId}?task=${meta.taskId}`
      );
    } else if (meta.resourceId) {
      navigate(`/workspace/${workspaceId}/resources`);
    } else if (meta.wikiId || event.type === "wiki_updated") {
      navigate(`/workspace/${workspaceId}/wiki`);
    } else if (
      meta.snippetId ||
      event.type === "snippet_saved"
    ) {
      navigate(`/workspace/${workspaceId}/snippets`);
    } else if (
      meta.reviewId ||
      event.type === "review_generated"
    ) {
      navigate(`/workspace/${workspaceId}/code-review`);
    } else if (meta.projectId) {
      navigate(`/project/${meta.projectId}`);
    }
  };

  const groupEvents = (rawEvents) => {
    if (!rawEvents || rawEvents.length === 0) {
      return [];
    }

    const grouped = [];
    let currentGroup = null;

    for (const event of rawEvents) {
      const isTaskDone =
        event.content &&
        (
          event.content.includes("completed task") ||
          (
            event.content.includes("moved") &&
            event.content.includes("to Done")
          ) ||
          (
            event.content.includes("marked") &&
            event.content.includes("as completed")
          )
        );

      const actorName =
        event.actor?.name ||
        event.actorName ||
        "A teammate";

      if (isTaskDone) {
        if (
          currentGroup &&
          currentGroup.actorName === actorName
        ) {
          currentGroup.count += 1;
          currentGroup.details.push(event.content);
          currentGroup.ids.push(event._id);
        } else {
          if (currentGroup) {
            grouped.push(currentGroup);
          }

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

    if (currentGroup) {
      grouped.push(currentGroup);
    }

    return grouped;
  };

  const processedEvents = groupEvents(events);

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-8">
        <div className="flex flex-col gap-6">

          {/* Header */}
          <div className="flex flex-col gap-4 border-b border-zinc-900 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
                Workspace Pulse
              </h1>

              <p className="mt-1 text-sm text-zinc-500">
                Realtime engineering activity and collaboration updates.
              </p>
            </div>

            {insight && (
              <div className="flex items-center gap-2 rounded-xl border border-zinc-900 bg-zinc-950/80 px-4 py-2 text-xs text-emerald-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                {insight}
              </div>
            )}
          </div>

          {/* Main Grid */}
          <div className="grid gap-8 lg:grid-cols-3">

            {/* Timeline */}
            <div className="lg:col-span-2">

              {loading ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-4"
                    >
                      <Skeleton className="h-5 w-full rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : processedEvents.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl border border-zinc-900 bg-zinc-950 p-16 text-center">
                  <span className="text-4xl">⚡</span>

                  <h3 className="text-sm font-semibold text-zinc-300">
                    No activity yet
                  </h3>

                  <p className="max-w-sm text-xs leading-relaxed text-zinc-500">
                    Workspace events will appear here once your team
                    starts collaborating on projects, tasks, and resources.
                  </p>
                </div>
              ) : (
                <div className="relative ml-4 flex flex-col gap-6 border-l border-zinc-900 pl-6">

                  {processedEvents.map((event) => {
                    const timeStr = new Date(
                      event.createdAt
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    const hasDeepLink =
                      event.metadata?.taskId ||
                      event.metadata?.resourceId ||
                      event.metadata?.projectId ||
                      event.metadata?.wikiId ||
                      event.metadata?.snippetId ||
                      event.metadata?.reviewId;

                    return (
                      <div
                        key={event._id}
                        onClick={() =>
                          hasDeepLink &&
                          handleDeepLink(event)
                        }
                        className={`group relative flex items-start gap-4 rounded-2xl border border-zinc-900/60 bg-zinc-950/20 p-4 transition hover:border-zinc-800 ${
                          hasDeepLink
                            ? "cursor-pointer"
                            : ""
                        }`}
                      >
                        <span className="absolute -left-[31px] top-[22px] h-2.5 w-2.5 rounded-full border-2 border-zinc-800 bg-zinc-950 transition group-hover:border-zinc-500" />

                        <span className="mt-0.5 whitespace-nowrap text-[11px] text-zinc-600">
                          {timeStr}
                        </span>

                        <div className="flex-1">

                          {event.isGroup ? (
                            <div>
                              <p className="text-sm font-semibold text-emerald-400">
                                {event.actorName} completed{" "}
                                {event.count} tasks
                              </p>

                              <div className="mt-2 flex flex-col gap-1 border-l border-zinc-800 pl-3 text-xs text-zinc-400">
                                {event.details.map(
                                  (detail, dIdx) => (
                                    <div key={dIdx}>
                                      •{" "}
                                      {detail
                                        .replace(
                                          event.actorName,
                                          ""
                                        )
                                        .trim()}
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed text-zinc-300 transition group-hover:text-white">
                              {event.content}
                            </p>
                          )}

                        </div>

                        {hasDeepLink && (
                          <span className="pl-2 text-sm text-zinc-500 transition group-hover:text-white">
                            →
                          </span>
                        )}
                      </div>
                    );
                  })}

                </div>
              )}

            </div>

            {/* AI Summary */}
            <div className="flex flex-col gap-6">

              {aiSummary?.weeklySummary && (
                <div className="rounded-3xl border border-emerald-900/40 bg-gradient-to-br from-zinc-950 to-zinc-900/90 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <span>📅</span>

                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Weekly Summary
                    </h3>
                  </div>

                  <p className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-3 text-xs leading-relaxed text-zinc-300">
                    {aiSummary.weeklySummary}
                  </p>
                </div>
              )}

              <div className="rounded-3xl border border-zinc-900 bg-zinc-950/80 p-5">

                <div className="mb-4 border-b border-zinc-900 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Workspace Intelligence
                  </h3>

                  <p className="mt-1 text-[11px] text-zinc-600">
                    AI-generated collaboration insights and workspace analysis.
                  </p>
                </div>

                {loadingSummary ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                ) : aiSummary ? (
                  <div className="flex flex-col gap-4 text-xs">

                    <div>
                      <span className="mb-1 block uppercase tracking-wider text-zinc-500">
                        Active Focus
                      </span>

                      <p className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-3 leading-relaxed text-zinc-300">
                        {aiSummary.focus}
                      </p>
                    </div>

                    <div>
                      <span className="mb-1 block uppercase tracking-wider text-zinc-500">
                        Blockers
                      </span>

                      <p className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-3 leading-relaxed text-zinc-300">
                        {aiSummary.blockers}
                      </p>
                    </div>

                    <div>
                      <span className="mb-1 block uppercase tracking-wider text-zinc-500">
                        Collaboration Trends
                      </span>

                      <p className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-3 leading-relaxed text-zinc-300">
                        {aiSummary.trends}
                      </p>
                    </div>

                    <div>
                      <span className="mb-1 block uppercase tracking-wider text-zinc-500">
                        Workspace Atmosphere
                      </span>

                      <p className="rounded-xl border border-zinc-900 bg-zinc-900/40 p-3 italic leading-relaxed text-zinc-300">
                        {aiSummary.atmosphere}
                      </p>
                    </div>

                  </div>
                ) : (
                  <p className="text-xs italic text-zinc-600">
                    No workspace insights available yet.
                  </p>
                )}

              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
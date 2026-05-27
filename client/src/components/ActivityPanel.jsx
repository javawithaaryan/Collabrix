// Activity feed + online presence panel
// Human-readable event summaries, grouped noise reduction, avatar-linked actions

function relativeTime(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Avatar initials + deterministic color
function getInitials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "?";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function nameToHue(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 360);
}

function MiniAvatar({ name }) {
  const hue = nameToHue(name);
  const initials = getInitials(name);
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white flex-shrink-0 select-none shadow-sm border border-white/10"
      style={{ backgroundColor: `hsl(${hue}, 60%, 48%)` }}
      title={name}
    >
      {initials}
    </div>
  );
}

// Map event types to icons and human-readable label templates
const ACTIVITY_CONFIG = {
  task_created: {
    icon: "＋",
    color: "text-emerald-400",
    format: (msg) => msg,
  },
  task_moved: {
    icon: "→",
    color: "text-blue-400",
    format: (msg) => msg,
  },
  task_completed: {
    icon: "✓",
    color: "text-emerald-400",
    format: (msg) => msg,
  },
  ai_generated: {
    icon: "✨",
    color: "text-violet-400",
    format: (msg) => msg,
  },
  task_updated: {
    icon: "↻",
    color: "text-zinc-400",
    format: (msg) => msg,
  },
  message_sent: {
    icon: "💬",
    color: "text-blue-300",
    format: (msg) => msg,
  },
  sprint_generated: {
    icon: "🚀",
    color: "text-violet-400",
    format: (msg) => msg,
  },
  default: {
    icon: "•",
    color: "text-zinc-500",
    format: (msg) => msg,
  },
};

// Extract the actor name from an activity message (heuristic — name is first word(s) before verb)
function extractActorName(message) {
  if (!message) return null;
  // Messages are like "Aryan completed ...", "Bhoomi generated ..."
  const firstWord = message.split(" ")[0];
  // If first word looks like a name (capitalized, not a verb), return it
  if (firstWord && firstWord[0] === firstWord[0].toUpperCase() && firstWord.length > 2) {
    return firstWord;
  }
  return null;
}

export default function ActivityPanel({ activities = [], onlineUsers = [], onTaskClick }) {
  // Group consecutive activities from the same actor within 3 minutes
  const grouped = [];
  for (const activity of activities) {
    const last = grouped[grouped.length - 1];
    const actorName = extractActorName(
      typeof activity === "string" ? activity : activity.message
    );
    const ts = activity.timestamp ? new Date(activity.timestamp).getTime() : Date.now();

    if (
      last &&
      last.actorName === actorName &&
      actorName &&
      ts - last.lastTs < 3 * 60 * 1000 &&
      last.type === activity.type
    ) {
      // Merge into existing group
      last.count = (last.count || 1) + 1;
      last.lastTs = ts;
    } else {
      grouped.push({
        ...activity,
        actorName,
        lastTs: ts,
        count: 1,
      });
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden hover:border-zinc-800 transition">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">Activity</h2>
        </div>
        {activities.length > 0 && (
          <span className="text-[9px] font-mono text-zinc-600">
            {activities.length} event{activities.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Online users */}
      <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-950/40 flex-shrink-0">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-extrabold mb-2">
          Online Now
        </p>
        {onlineUsers.length === 0 ? (
          <p className="text-zinc-700 text-xs italic flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            Just you
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 bg-zinc-900 text-zinc-300 text-[11px] px-2.5 py-1 rounded-full border border-zinc-800"
              >
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
                {u.name || u}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1 scrollbar-thin">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <span className="text-xl mb-3 opacity-40">📋</span>
            <p className="text-zinc-600 text-xs leading-relaxed">
              Activity will appear here as your team works. Move tasks, generate sprints, leave comments.
            </p>
          </div>
        ) : (
          grouped.map((activity, i) => {
            const config =
              ACTIVITY_CONFIG[activity.type] || ACTIVITY_CONFIG.default;
            const msg =
              typeof activity === "string"
                ? activity
                : activity.message || JSON.stringify(activity);
            const ts = activity.timestamp ? relativeTime(activity.timestamp) : "";
            const hasTaskRef = activity.taskId && onTaskClick;
            const actorName = activity.actorName;

            // If grouped multiple events, annotate the message
            const displayMsg =
              activity.count > 1
                ? `${msg} (×${activity.count})`
                : msg;

            return (
              <div
                key={i}
                onClick={() => hasTaskRef && onTaskClick(activity.taskId)}
                className={`flex items-start gap-2.5 py-2 px-2.5 rounded-xl transition-all group ${
                  hasTaskRef
                    ? "cursor-pointer hover:bg-zinc-900/40 hover:text-white"
                    : ""
                }`}
              >
                {/* Actor mini-avatar */}
                {actorName ? (
                  <MiniAvatar name={actorName} />
                ) : (
                  <span className={`text-xs mt-0.5 w-5 text-center flex-shrink-0 font-mono ${config.color}`}>
                    {config.icon}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-zinc-400 leading-snug break-words group-hover:text-zinc-300 transition">
                    {displayMsg}
                    {hasTaskRef && (
                      <span className="inline-flex items-center text-[8px] font-extrabold text-zinc-600 group-hover:text-zinc-400 border border-zinc-900 group-hover:border-zinc-700 bg-zinc-950/40 px-1.5 py-0.5 rounded ml-2 select-none tracking-wider font-mono transition">
                        OPEN
                      </span>
                    )}
                  </p>
                  {ts && (
                    <span className="text-zinc-600 text-[9px] mt-0.5 block font-mono">{ts}</span>
                  )}
                </div>

                {/* Type icon on right for quick scanning */}
                <span className={`text-[10px] flex-shrink-0 mt-0.5 ${config.color} opacity-60`}>
                  {config.icon}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

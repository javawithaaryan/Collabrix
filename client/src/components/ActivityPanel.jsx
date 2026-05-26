// Shows live activity feed and who's currently online in the project.
export default function ActivityPanel({ activities = [], onlineUsers = [] }) {
  return (
    <div className="flex flex-col h-full bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden hover:border-zinc-800 transition">
      <div className="px-5 py-4 border-b border-zinc-900 flex items-center gap-2">
        <span className="text-sm">⚡</span>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-zinc-400">Activity</h2>
      </div>

      {/* Online users */}
      <div className="px-5 py-3.5 border-b border-zinc-900 bg-zinc-950/40">
        <p className="text-zinc-500 text-[10px] uppercase tracking-wider font-extrabold mb-2.5">Online Now</p>
        {onlineUsers.length === 0 ? (
          <p className="text-zinc-700 text-xs italic">Just you</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((u, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 bg-zinc-900 text-zinc-300 text-xs px-2.5 py-1 rounded-full border border-zinc-850"
              >
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                {u.name || u}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Activity feed */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 scrollbar-thin">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <span className="text-xl mb-1">📋</span>
            <p className="text-zinc-600 text-xs">No activity logged yet.</p>
          </div>
        ) : (
          activities.map((activity, i) => (
            <div key={i} className="text-xs text-zinc-400 border-b border-zinc-900/50 pb-2.5 flex items-start gap-2">
              <span className="text-zinc-500">•</span>
              <p className="leading-relaxed">
                {typeof activity === "string" ? activity : activity.message || JSON.stringify(activity)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

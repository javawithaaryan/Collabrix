const ActivityPanel = ({
  activities,
  onlineUsers,
}) => {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 h-full">
      <h2 className="text-2xl font-bold mb-5">
        Live Activity
      </h2>

      <div className="mb-8">
        <h3 className="text-sm uppercase text-zinc-500 mb-3">
          Online Members
        </h3>

        <div className="flex flex-col gap-2">
          {onlineUsers.map((user, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-zinc-900 rounded-xl px-3 py-2"
            >
              <div className="w-3 h-3 rounded-full bg-green-500" />

              <p>{user.name}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm uppercase text-zinc-500 mb-3">
          Activity Feed
        </h3>

        <div className="flex flex-col gap-3">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="bg-zinc-900 rounded-xl p-3 text-sm"
            >
              {activity.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityPanel;
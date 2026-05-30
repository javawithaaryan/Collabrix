export default function WorkspaceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Workspace Settings</h1>
        <p className="text-slate-400">Manage your team and workspace</p>
      </div>

      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Basic Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="text-slate-400 text-sm">Workspace Name</label>
              <input
                type="text"
                defaultValue="Collabrix Core Team"
                className="w-full mt-2 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 text-sm">Description</label>
              <textarea
                rows={3}
                defaultValue="Building the future of engineering collaboration"
                className="w-full mt-2 bg-slate-700 border border-slate-600 rounded px-4 py-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-xl font-bold text-white mb-4">Team Members</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex justify-between items-center p-3 bg-slate-700 rounded-lg"
              >
                <span className="text-white">Team Member {i}</span>
                <button className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
            ))}
          </div>
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">
            Add Member
          </button>
        </div>

        {/* Save Button */}
        <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition">
          Save Changes
        </button>
      </div>
    </div>
  );
}

import GlobalLayout from "../components/layouts/GlobalLayout";

export default function GlobalDashboard() {
  return (
    <GlobalLayout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-2">
          Welcome back
        </h1>
        <p className="text-slate-400 mb-8">
          Your engineering command center
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Quick Stats */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Active Workspaces</div>
            <div className="text-3xl font-bold text-white">5</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Total Projects</div>
            <div className="text-3xl font-bold text-white">15</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Tasks This Week</div>
            <div className="text-3xl font-bold text-white">23</div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="text-slate-400 text-sm mb-2">Ship Index</div>
            <div className="text-3xl font-bold text-green-400">1,240</div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <p className="text-slate-400">No recent activity yet</p>
        </div>
      </div>
    </GlobalLayout>
  );
}

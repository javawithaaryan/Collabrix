import GlobalLayout from "../components/layouts/GlobalLayout";

export default function Insights() {
  return (
    <GlobalLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-white mb-2">Insights</h1>
        <p className="text-slate-400 mb-8">
          Engineering intelligence tailored for you
        </p>

        <div className="space-y-8">
          {/* Tech World */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Tech World</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition"
                >
                  <div className="text-blue-400 text-sm font-semibold mb-2">
                    AI News
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    GPT-5 released with new capabilities
                  </h3>
                  <p className="text-slate-400 text-sm mb-4">
                    Why it matters: Enhanced reasoning capabilities...
                  </p>
                  <button className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition">
                    Read more →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Workspace Insights */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Workspace Insights
            </h2>
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
              <div className="space-y-4">
                <div>
                  <div className="text-slate-400 text-sm mb-2">Sprint Health</div>
                  <div className="text-white font-semibold">On Track</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-2">Team Progress</div>
                  <div className="text-white font-semibold">45% Complete</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm mb-2">Active Blockers</div>
                  <div className="text-white font-semibold">2 items blocking progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
}

import { ArrowRight, Activity, Target, ShieldAlert } from "lucide-react";
import Sidebar from "../components/Sidebar";

const Insights = () => {
  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 p-10 overflow-y-auto">
        {/* Header */}
        <div className="mb-10 max-w-5xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Insights
          </h1>
          <p className="text-zinc-400 text-sm">Engineering intelligence tailored for you</p>
        </div>

        <div className="max-w-5xl flex flex-col gap-10">
          
          {/* Tech World Section */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Tech World</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="relative group rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_8px_30px_-12px_rgba(59,130,246,0.3)] cursor-pointer">
                  <div className="text-xs font-bold tracking-wider uppercase text-blue-400 mb-3 group-hover:text-blue-300 transition-colors">
                    AI News
                  </div>
                  <h3 className="text-lg font-bold text-zinc-200 mb-2 group-hover:text-white transition-colors">
                    GPT-5 released with new capabilities
                  </h3>
                  <p className="text-sm text-zinc-400 mb-6 line-clamp-2 group-hover:text-zinc-300 transition-colors">
                    Why it matters: Enhanced reasoning capabilities allow for deeper code analysis and faster bug resolution across complex repositories.
                  </p>
                  <div className="text-sm font-semibold text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1">
                    Read more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Workspace Insights Section */}
          <section>
            <h2 className="text-lg font-bold text-white mb-4">Workspace Insights</h2>
            
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <Activity className="w-4 h-4" /> Sprint Health
                  </div>
                  <div className="text-xl font-bold text-white">On Track</div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <Target className="w-4 h-4" /> Team Progress
                  </div>
                  <div className="text-xl font-bold text-white">45% Complete</div>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
                    <ShieldAlert className="w-4 h-4" /> Active Blockers
                  </div>
                  <div className="text-xl font-bold text-red-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    2 items blocking progress
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Insights;
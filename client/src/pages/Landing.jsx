import { Link } from "react-router-dom";
import { 
  Hexagon, 
  Sparkles, 
  Zap, 
  Terminal, 
  ArrowRight,
  Code2
} from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 font-sans overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-extrabold text-white">
            <Hexagon className="w-8 h-8 text-emerald-500 fill-emerald-500/20" />
            Collabrix
          </div>
          
          <div className="flex items-center gap-6">
            <Link 
              to="/login" 
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-xl hover:bg-zinc-200 transition-colors active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-mono mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Collabrix 2.0 is now live
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
            The Engineering Hub for <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              Ship-Fast Teams.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Replace scattered tools with a unified workspace. Generate AI sprints, track real-time blockers, and manage code repositories in one sleek environment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to="/register" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-xl text-base font-bold hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95"
            >
              Start Building Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white px-8 py-4 rounded-xl text-base font-bold hover:bg-white/10 transition-all active:scale-95"
            >
              <Code2 className="w-5 h-5 text-zinc-400" /> View Demo
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid (Glassmorphism) */}
        <div className="max-w-6xl mx-auto mt-32 grid md:grid-cols-3 gap-6">
          
          <div className="group relative rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-violet-500/50 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 group-hover:border-violet-500/50 transition-colors">
                <Sparkles className="w-7 h-7 text-zinc-400 group-hover:text-violet-400 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">AI-Powered Sprints</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Let Atmosphere_AI automatically analyze your codebase and generate weekly sprint tasks, identifying blockers before they happen.
              </p>
            </div>
          </div>

          <div className="group relative rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-emerald-500/50 hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 group-hover:border-emerald-500/50 transition-colors">
                <Zap className="w-7 h-7 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Real-Time Pulse</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                A live, multiplayer timeline of every pull request, task completion, and team message. Never ask "what's the status?" again.
              </p>
            </div>
          </div>

          <div className="group relative rounded-3xl bg-white/5 border border-white/10 p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center mb-6 group-hover:border-blue-500/50 transition-colors">
                <Terminal className="w-7 h-7 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Engineer's Space</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                A dedicated terminal-like environment for resource hubs, architecture wikis, and deep-focus code reviews.
              </p>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-white/10 py-10 mt-20 text-center">
        <p className="text-zinc-500 text-sm font-mono">
          &copy; {new Date().getFullYear()} Collabrix. Built for the modern developer.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
import { Link } from "react-router-dom";
// 1. Import sleek SVG icons instead of using emojis
import { Zap, Bot, LayoutTemplate, MessageSquare, Briefcase, ShieldCheck } from "lucide-react";

// 2. Map the icons directly as components in your data array
const FEATURES = [
  {
    icon: Zap,
    title: "Real-Time Collaboration",
    description: "Work together with your team in real-time. See changes instantly — no refreshing, no delays.",
  },
  {
    icon: Bot,
    title: "AI Task Generation",
    description: "Describe your project and let AI generate a full task board in seconds. Built for speed.",
  },
  {
    icon: LayoutTemplate,
    title: "Kanban Task Boards",
    description: "Drag-and-drop tasks across Todo, In Progress, and Done. Visualize your team's momentum.",
  },
  {
    icon: MessageSquare,
    title: "Built-In Team Chat",
    description: "Chat with your team inside every project. No need to switch between Slack and your task board.",
  },
  {
    icon: Briefcase,
    title: "Workspaces",
    description: "Organize projects inside dedicated workspaces. Perfect for managing multiple hackathons or teams.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by Default",
    description: "JWT-protected routes, hashed passwords, and auth middleware guard every API endpoint.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden selection:bg-zinc-800">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-900 max-w-7xl mx-auto">
        <span className="text-2xl font-bold tracking-tight">Collabrix</span>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-zinc-400 hover:text-white transition text-sm">
            Login
          </Link>
          <Link to="/register" className="bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero (Left exactly as is - it's already great) */}
      <section className="max-w-7xl mx-auto px-8 py-28 text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 text-xs text-zinc-400 mb-10">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Built for developer teams &amp; hackathons
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
          Ship faster,
          <br />
          <span className="text-zinc-500">together.</span>
        </h1>

        <p className="text-zinc-400 text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          Collabrix brings your team's tasks, chat, and real-time collaboration
          into one focused workspace. Stop context-switching. Start building.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-base hover:opacity-90 transition shadow-[0_0_30px_-5px_rgba(255,255,255,0.3)]">
            Start for free →
          </Link>
          <Link to="/login" className="border border-zinc-800 text-zinc-300 px-8 py-4 rounded-2xl font-semibold text-base hover:border-zinc-600 hover:text-white transition bg-zinc-950/50">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features - UPGRADED */}
      <section className="max-w-7xl mx-auto px-8 pb-28">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything your dev team needs
        </h2>
        <p className="text-zinc-500 text-center mb-14 text-base">
          No bloat. Just the tools that matter for shipping.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              tabIndex="0" // Makes the div clickable/focusable for the glow effect
              className="relative group outline-none bg-zinc-950 border border-zinc-900 rounded-3xl p-7 transition-all duration-500 hover:border-zinc-600 hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.1)] focus:border-zinc-300 focus:shadow-[0_0_40px_-10px_rgba(255,255,255,0.25)] focus:-translate-y-1 cursor-pointer overflow-hidden"
            >
              {/* Subtle inner gradient that fades in on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                {/* Icon wrapper with a subtle background and pop animation */}
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 text-zinc-400 transition-all duration-300 group-hover:text-white group-hover:scale-110 group-focus:text-white group-focus:border-zinc-500 group-focus:bg-zinc-800">
                  <feature.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                
                <h3 className="text-lg font-semibold mb-2 text-zinc-200 transition-colors duration-300 group-hover:text-white group-focus:text-white">
                  {feature.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed transition-colors duration-300 group-hover:text-zinc-400 group-focus:text-zinc-400">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900 py-24 text-center px-8 relative overflow-hidden">
        {/* Subtle background glow for the CTA area */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-zinc-800/20 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold mb-4">Ready to collaborate?</h2>
          <p className="text-zinc-500 mb-8">
            Free to use. No credit card needed.
          </p>
          <Link to="/register" className="inline-block bg-white text-black px-10 py-4 rounded-2xl font-bold text-base hover:opacity-90 transition">
            Create your workspace →
          </Link>
        </div>
      </section>

      {/* Footer - UPGRADED */}
      <footer className="border-t border-zinc-900 bg-zinc-950/50 pt-16 pb-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          {/* Logo & Tagline */}
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
            <span className="text-xl font-bold tracking-tight text-white">Collabrix</span>
            <span className="hidden md:inline text-zinc-700">|</span>
            <span className="text-zinc-500 text-sm">Built for developer teams that ship.</span>
          </div>
          
          {/* Faux Links */}
          <div className="flex gap-6 text-sm text-zinc-500 font-medium">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
            <a href="#" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
        
        <div className="text-center text-zinc-700 text-xs">
          © {new Date().getFullYear()} Collabrix. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
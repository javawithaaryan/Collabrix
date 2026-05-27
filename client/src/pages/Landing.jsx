import { Link } from "react-router-dom";

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time Collaboration",
    description:
      "Work together with your team in real-time. See changes instantly — no refreshing, no delays.",
  },
  {
    icon: "🤖",
    title: "AI Task Generation",
    description:
      "Describe your project and let AI generate a full task board in seconds. Built for speed.",
  },
  {
    icon: "📋",
    title: "Kanban Task Boards",
    description:
      "Drag-and-drop tasks across Todo, In Progress, and Done. Visualize your team's momentum.",
  },
  {
    icon: "💬",
    title: "Built-In Team Chat",
    description:
      "Chat with your team inside every project. No need to switch between Slack and your task board.",
  },
  {
    icon: "🏠",
    title: "Workspaces",
    description:
      "Organize projects inside dedicated workspaces. Perfect for managing multiple hackathons or teams.",
  },
  {
    icon: "🔒",
    title: "Secure by Default",
    description:
      "JWT-protected routes, hashed passwords, and auth middleware guard every API endpoint.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-zinc-900 max-w-7xl mx-auto">
        <span className="text-2xl font-bold tracking-tight">Collabrix</span>
        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="text-zinc-400 hover:text-white transition text-sm"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-white text-black px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
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
          <Link
            to="/register"
            className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-base hover:opacity-90 transition"
          >
            Start for free →
          </Link>
          <Link
            to="/login"
            className="border border-zinc-800 text-zinc-300 px-8 py-4 rounded-2xl font-semibold text-base hover:border-zinc-600 hover:text-white transition"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
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
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-7 hover:border-zinc-700 transition group"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2 group-hover:text-white transition">
                {feature.title}
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-900 py-24 text-center px-8">
        <h2 className="text-4xl font-extrabold mb-4">Ready to collaborate?</h2>
        <p className="text-zinc-500 mb-8">
          Free to use. No credit card needed.
        </p>
        <Link
          to="/register"
          className="inline-block bg-white text-black px-10 py-4 rounded-2xl font-bold text-base hover:opacity-90 transition"
        >
          Create your workspace →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-zinc-600 text-sm px-8">
        © {new Date().getFullYear()} Collabrix. Built for teams that ship.
      </footer>
    </div>
  );
};

export default Landing;
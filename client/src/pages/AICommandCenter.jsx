import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios";

// ─── AI Command Definitions ───────────────────────────────────────────────────
const AI_COMMANDS = [
  {
    id: "sprint-generator",
    icon: "🎯",
    title: "Sprint Generator",
    subtitle: "Generate a full sprint plan from a description",
    color: "violet",
    placeholder: "Describe your sprint goal... e.g. 'Build user authentication with JWT, registration, and role-based access control'",
    examples: ["Build a real-time chat system", "Implement payment gateway with Stripe", "Set up CI/CD pipeline with GitHub Actions"],
  },
  {
    id: "project-breakdown",
    icon: "🗂",
    title: "Project Breakdown",
    subtitle: "Break down a project into tasks, milestones & architecture",
    color: "blue",
    placeholder: "Describe your project... e.g. 'SaaS Learning Management System with video uploads and progress tracking'",
    examples: ["SaaS CRM for small businesses", "E-commerce platform with inventory", "Mobile app with offline sync"],
  },
  {
    id: "architecture-review",
    icon: "🏗️",
    title: "Architecture Review",
    subtitle: "Analyze your system design and suggest improvements",
    color: "emerald",
    placeholder: "Describe your current architecture or paste a system diagram description...",
    examples: ["Microservices with Docker + K8s", "Monolith Express API with MongoDB", "Event-driven architecture with RabbitMQ"],
  },
  {
    id: "risk-analysis",
    icon: "⚠️",
    title: "Risk Analysis",
    subtitle: "Identify risks, blockers and mitigation strategies",
    color: "amber",
    placeholder: "Describe your project or current situation to analyze risks...",
    examples: ["Scaling to 100k users next month", "Migrating from REST to GraphQL", "Launching mobile app in 2 weeks"],
  },
  {
    id: "tech-stack-advisor",
    icon: "🔧",
    title: "Tech Stack Advisor",
    subtitle: "Get personalized tech stack recommendations",
    color: "cyan",
    placeholder: "Describe what you're building and your requirements...",
    examples: ["Real-time collaborative document editor", "High-traffic API gateway", "Mobile-first social platform"],
  },
  {
    id: "doc-generator",
    icon: "📝",
    title: "Documentation Generator",
    subtitle: "Generate technical documentation from code or descriptions",
    color: "pink",
    placeholder: "Paste your code or describe the system to document...",
    examples: ["REST API endpoint documentation", "Database schema documentation", "Architecture decision record"],
  },
  {
    id: "task-estimator",
    icon: "⏱",
    title: "Task Estimator",
    subtitle: "Get time and complexity estimates for development tasks",
    color: "rose",
    placeholder: "List the tasks or features you want to estimate...",
    examples: ["Build user profile page with avatar upload", "Integrate Stripe payments", "Add full-text search with Elasticsearch"],
  },
  {
    id: "workspace-summary",
    icon: "📊",
    title: "Workspace Summary",
    subtitle: "Generate an executive summary of workspace activity",
    color: "indigo",
    placeholder: "Describe your team and project status...",
    examples: ["Q3 sprint retrospective", "Weekly standup summary", "Monthly progress report"],
  },
  {
    id: "workspace-health-check",
    icon: "💊",
    title: "Workspace Health Check",
    subtitle: "Real-time analysis of sprint health, blockers, and team velocity",
    color: "emerald",
    placeholder: "Describe your current sprint situation for deeper analysis...",
    examples: ["Analyze current sprint blockers", "Team velocity trends", "Resource allocation review"],
  },
  {
    id: "wiki-generator",
    icon: "📝",
    title: "Wiki Page Generator",
    subtitle: "Auto-generate engineering documentation from code or description",
    color: "blue",
    placeholder: "Describe what you want documented (API, architecture, process)...",
    examples: ["Document our REST API authentication flow", "Write ADR for database choice", "Create SOP for deployment"],
  },
  {
    id: "code-pattern-analyzer",
    icon: "🔬",
    title: "Code Pattern Analyzer",
    subtitle: "Identify anti-patterns, suggest refactors, and review architecture",
    color: "rose",
    placeholder: "Paste your code or describe the pattern you want analyzed...",
    examples: ["N+1 query detection", "React re-render optimization", "API security vulnerability scan"],
  },
];

const colorMap = {
  violet: { border: "border-violet-800/40", bg: "bg-violet-950/20", text: "text-violet-300", badge: "bg-violet-900/60 border-violet-700 text-violet-300", glow: "shadow-violet-900/40", btn: "bg-violet-700 hover:bg-violet-600" },
  blue: { border: "border-blue-800/40", bg: "bg-blue-950/20", text: "text-blue-300", badge: "bg-blue-900/60 border-blue-700 text-blue-300", glow: "shadow-blue-900/40", btn: "bg-blue-700 hover:bg-blue-600" },
  emerald: { border: "border-emerald-800/40", bg: "bg-emerald-950/20", text: "text-emerald-300", badge: "bg-emerald-900/60 border-emerald-700 text-emerald-300", glow: "shadow-emerald-900/40", btn: "bg-emerald-700 hover:bg-emerald-600" },
  amber: { border: "border-amber-800/40", bg: "bg-amber-950/20", text: "text-amber-300", badge: "bg-amber-900/60 border-amber-700 text-amber-300", glow: "shadow-amber-900/40", btn: "bg-amber-700 hover:bg-amber-600" },
  cyan: { border: "border-cyan-800/40", bg: "bg-cyan-950/20", text: "text-cyan-300", badge: "bg-cyan-900/60 border-cyan-700 text-cyan-300", glow: "shadow-cyan-900/40", btn: "bg-cyan-700 hover:bg-cyan-600" },
  pink: { border: "border-pink-800/40", bg: "bg-pink-950/20", text: "text-pink-300", badge: "bg-pink-900/60 border-pink-700 text-pink-300", glow: "shadow-pink-900/40", btn: "bg-pink-700 hover:bg-pink-600" },
  rose: { border: "border-rose-800/40", bg: "bg-rose-950/20", text: "text-rose-300", badge: "bg-rose-900/60 border-rose-700 text-rose-300", glow: "shadow-rose-900/40", btn: "bg-rose-700 hover:bg-rose-600" },
  indigo: { border: "border-indigo-800/40", bg: "bg-indigo-950/20", text: "text-indigo-300", badge: "bg-indigo-900/60 border-indigo-700 text-indigo-300", glow: "shadow-indigo-900/40", btn: "bg-indigo-700 hover:bg-indigo-600" },
};

// ─── Typing Animation ─────────────────────────────────────────────────────────
function TypingEffect({ text, speed = 15 }) {
  const [displayed, setDisplayed] = useState("");
  const idx = useRef(0);

  useEffect(() => {
    setDisplayed("");
    idx.current = 0;
    const interval = setInterval(() => {
      if (idx.current < text.length) {
        setDisplayed(text.slice(0, idx.current + 1));
        idx.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayed}<span className="animate-pulse">▋</span></span>;
}

// ─── Result Renderer ──────────────────────────────────────────────────────────
function ResultCard({ result, command }) {
  const colors = colorMap[command.color];

  if (!result) return null;

  // Handle task array results
  if (Array.isArray(result)) {
    return (
      <div className="mt-6 flex flex-col gap-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Generated {result.length} Items</h3>
        {result.map((item, i) => (
          <div key={i} className={`p-4 border rounded-xl ${colors.border} ${colors.bg}`}>
            <div className="flex items-start gap-3">
              <span className={`text-xs font-mono font-bold ${colors.text} mt-0.5 min-w-[1.5rem]`}>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                {item.description && <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.description}</p>}
                {item.estimate && <span className="text-[10px] text-zinc-500 font-mono mt-1 block">⏱ {item.estimate}</span>}
                {item.priority && <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border mt-1 inline-block ${
                  item.priority === "high" ? "bg-red-950/40 border-red-800 text-red-400" :
                  item.priority === "medium" ? "bg-amber-950/40 border-amber-800 text-amber-400" :
                  "bg-zinc-900 border-zinc-800 text-zinc-400"
                }`}>{item.priority}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Handle object results (architecture review, risk analysis, etc.)
  if (typeof result === "object") {
    return (
      <div className="mt-6 flex flex-col gap-4">
        {Object.entries(result).map(([key, value]) => {
          if (!value) return null;
          const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());

          if (Array.isArray(value)) {
            return (
              <div key={key} className={`p-4 border rounded-xl ${colors.border} ${colors.bg}`}>
                <h4 className={`text-xs font-bold ${colors.text} uppercase tracking-wider font-mono mb-3`}>{label}</h4>
                <div className="flex flex-col gap-2">
                  {value.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className={`text-xs ${colors.text} mt-0.5 flex-shrink-0`}>▸</span>
                      <span>{typeof item === "object" ? JSON.stringify(item) : item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (typeof value === "object") {
            return (
              <div key={key} className={`p-4 border rounded-xl ${colors.border} ${colors.bg}`}>
                <h4 className={`text-xs font-bold ${colors.text} uppercase tracking-wider font-mono mb-3`}>{label}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(value).map(([k, v]) => (
                    <div key={k} className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-3">
                      <div className="text-[9px] text-zinc-500 font-mono uppercase">{k}</div>
                      <div className={`text-sm font-bold mt-0.5 ${colors.text}`}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={key} className={`p-4 border rounded-xl ${colors.border} ${colors.bg}`}>
              <h4 className={`text-xs font-bold ${colors.text} uppercase tracking-wider font-mono mb-2`}>{label}</h4>
              <p className="text-sm text-zinc-300 leading-relaxed">{String(value)}</p>
            </div>
          );
        })}
      </div>
    );
  }

  // Plain text
  return (
    <div className={`mt-6 p-5 border rounded-xl ${colors.border} ${colors.bg}`}>
      <pre className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">{String(result)}</pre>
    </div>
  );
}

// ─── AI Command Panel ─────────────────────────────────────────────────────────
function AICommandPanel({ command, workspaceId, onBack }) {
  const colors = colorMap[command.color];
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isFallback, setIsFallback] = useState(false);

  const handleRun = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setResult(null); setIsFallback(false);

    try {
      let res;
      if (command.id === "sprint-generator") {
        res = await api.post("/ai/generate-tasks", { prompt: input });
        setResult(res.data.result);
        setIsFallback(res.data.isFallback);
      } else if (command.id === "project-breakdown") {
        res = await api.post("/ai/generate-tasks", { prompt: `Full project breakdown for: ${input}` });
        setResult(res.data.result);
        setIsFallback(res.data.isFallback);
      } else if (command.id === "architecture-review") {
        res = await api.post("/ai/code-review", { code: input, language: "System Design" });
        setResult(res.data.review);
        setIsFallback(res.data.isFallback);
      } else if (command.id === "workspace-health-check") {
        res = await api.post("/ai/generate-tasks", { prompt: `Workspace health analysis: ${input}. Analyze sprint health, team velocity, blockers, and provide actionable recommendations.` });
        setResult(res.data.result);
        setIsFallback(res.data.isFallback);
      } else if (command.id === "wiki-generator") {
        res = await api.post("/ai/generate-tasks", { prompt: `Generate comprehensive wiki documentation for: ${input}. Include overview, technical details, code examples, and best practices.` });
        setResult(res.data.result);
        setIsFallback(res.data.isFallback);
      } else if (command.id === "code-pattern-analyzer") {
        res = await api.post("/ai/code-review", { code: input, language: "Pattern Analysis" });
        setResult(res.data.review);
        setIsFallback(res.data.isFallback);
      } else {
        // Fallback: use generate-tasks for all other commands
        res = await api.post("/ai/generate-tasks", { prompt: `${command.title}: ${input}` });
        setResult(res.data.result);
        setIsFallback(res.data.isFallback);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "AI command failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className={`flex items-center justify-between px-8 py-5 border-b border-zinc-900`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition text-xs"
          >
            ←
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{command.icon}</span>
              <h2 className="text-sm font-extrabold text-white">{command.title}</h2>
            </div>
            <p className="text-[10px] text-zinc-500">{command.subtitle}</p>
          </div>
        </div>
        <div className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${colors.badge}`}>
          AI · Powered by Gemini
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        {/* Examples */}
        {!result && (
          <div className="mb-5">
            <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider mb-2">Try an example</p>
            <div className="flex flex-wrap gap-2">
              {command.examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setInput(ex)}
                  className={`px-3 py-1.5 rounded-full border text-[10px] transition ${colors.border} ${colors.bg} ${colors.text} hover:opacity-80`}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="mb-4">
          <textarea
            placeholder={command.placeholder}
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-sm text-zinc-200 outline-none focus:border-zinc-700 transition placeholder-zinc-700 resize-none font-sans leading-relaxed scrollbar-thin"
            style={{ minHeight: "120px" }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-zinc-700 font-mono">{input.length} chars</span>
            <button
              onClick={handleRun}
              disabled={!input.trim() || loading}
              className={`flex items-center gap-2 px-5 py-2 ${colors.btn} text-white rounded-xl text-xs font-bold disabled:opacity-40 transition shadow-lg`}
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <><span>✨</span> Run {command.title}</>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-950/40 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-xs mb-4">
            {error}
          </div>
        )}

        {/* Fallback Notice */}
        {isFallback && (
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl px-4 py-3 text-amber-400 text-xs mb-4 flex items-center gap-2">
            <span>⚡</span>
            <span>AI is operating in fallback mode — results are template-based but still useful.</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col gap-3 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-xl animate-pulse">
                <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2" />
                <div className="h-3 bg-zinc-800/60 rounded w-2/3" />
              </div>
            ))}
          </div>
        )}

        {/* Result */}
        {result && !loading && <ResultCard result={result} command={command} />}
      </div>
    </div>
  );
}

// ─── Live Workspace Status ────────────────────────────────────────────────────
function LiveWorkspaceStatus({ workspaceId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      api.get(`/tasks/workspace/${workspaceId}`).catch(() => ({ data: [] })),
      api.get(`/projects/workspace/${workspaceId}`).catch(() => ({ data: [] })),
      api.get(`/wiki/workspace/${workspaceId}`).catch(() => ({ data: { wikis: [] } })),
      api.get(`/resources/workspace/${workspaceId}`).catch(() => ({ data: { resources: [] } })),
    ]).then(([taskRes, projRes, wikiRes, resRes]) => {
      const tasks = taskRes.data || [];
      setStats({
        total: tasks.length,
        done: tasks.filter(t => t.status === 'done').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        blocked: tasks.filter(t => t.blockers?.length > 0 && t.status !== 'done').length,
        projects: (projRes.data || []).length,
        wikis: (wikiRes.data?.wikis || []).length,
        resources: (resRes.data?.resources || []).length,
      });
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading || !stats) return null;

  const completion = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="px-8 py-4 border-b border-zinc-900 flex-shrink-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">Live Workspace Status</span>
        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          real-time
        </span>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
        {[
          { label: 'Sprint', value: `${completion}%`, sub: 'complete', color: 'text-violet-400' },
          { label: 'In Progress', value: stats.inProgress, sub: 'tasks', color: 'text-blue-400' },
          { label: 'Done', value: stats.done, sub: 'tasks', color: 'text-emerald-400' },
          { label: 'Blocked', value: stats.blocked, sub: 'tasks', color: stats.blocked > 0 ? 'text-rose-400' : 'text-zinc-600' },
          { label: 'Projects', value: stats.projects, sub: 'active', color: 'text-amber-400' },
          { label: 'Wiki Docs', value: stats.wikis, sub: 'pages', color: 'text-cyan-400' },
          { label: 'Resources', value: stats.resources, sub: 'saved', color: 'text-pink-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-2.5 text-center">
            <div className={`text-lg font-extrabold font-mono ${stat.color}`}>{stat.value}</div>
            <div className="text-[9px] text-zinc-600 uppercase font-mono">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main AI Page ─────────────────────────────────────────────────────────────
export default function AICommandCenter() {
  const { id: workspaceId } = useParams();
  const [activeCommand, setActiveCommand] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(100,100,100,0.3); border-radius: 9999px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {activeCommand ? (
        <AICommandPanel
          command={activeCommand}
          workspaceId={workspaceId}
          onBack={() => setActiveCommand(null)}
        />
      ) : (
        <>
          {/* Hero Header */}
          <div className="relative px-8 pt-10 pb-8 border-b border-zinc-900 overflow-hidden flex-shrink-0">
            {/* Background glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-violet-900/15 blur-3xl pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-32 bg-blue-900/10 blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">✨</span>
                    <span className="text-[10px] font-mono text-violet-400 border border-violet-800/40 bg-violet-950/40 px-2 py-0.5 rounded-full">Collabrix AI · Command Center</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                    What can I help you build?
                  </h1>
                  <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
                    AI-powered tools for engineering teams. Generate sprints, analyze architecture, estimate tasks, and document systems — all from one command center.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
                    document.dispatchEvent(event);
                  }}
                  className="hidden lg:flex items-center gap-3 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-500 hover:border-zinc-700 hover:text-zinc-400 transition"
                >
                  <span>🔍</span>
                  <span>Search everything...</span>
                  <kbd className="text-[9px] font-mono border border-zinc-700 rounded px-1.5 py-0.5 text-zinc-600">⌘K</kbd>
                </button>
              </div>
            </div>
          </div>

          {/* Workspace Live Status */}
          <LiveWorkspaceStatus workspaceId={workspaceId} />

          {/* Command Grid */}
          <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              {AI_COMMANDS.map((cmd, i) => {
                const colors = colorMap[cmd.color];
                return (
                  <button
                    key={cmd.id}
                    onClick={() => setActiveCommand(cmd)}
                    className={`p-5 border rounded-2xl text-left transition group hover:scale-[1.01] hover:shadow-xl ${colors.border} ${colors.bg} hover:shadow-${cmd.color}-900/20 animate-fade-up`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{cmd.icon}</span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${colors.badge} opacity-0 group-hover:opacity-100 transition`}>
                        Run →
                      </span>
                    </div>
                    <h3 className={`text-sm font-extrabold ${colors.text} mb-1`}>{cmd.title}</h3>
                    <p className="text-xs text-zinc-500 leading-relaxed">{cmd.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {cmd.examples.slice(0, 2).map((ex, ei) => (
                        <span key={ei} className="text-[9px] text-zinc-600 bg-zinc-900/60 border border-zinc-800 px-2 py-0.5 rounded-full font-mono truncate max-w-[140px]">
                          {ex}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="border-t border-zinc-900 pt-6">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { icon: "⌨️", label: "Global Search", action: () => { const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }); document.dispatchEvent(event); } },
                  { icon: "🗂", label: "Open Projects", path: "projects" },
                  { icon: "📖", label: "Open Wiki", path: "wiki" },
                  { icon: "🎯", label: "Sprint Planner", path: "sprint-planner" },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action || (() => navigate(`/workspace/${workspaceId}/${item.path}`))}
                    className="flex items-center gap-2 p-3 bg-zinc-900/40 border border-zinc-900 rounded-xl hover:border-zinc-800 transition text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

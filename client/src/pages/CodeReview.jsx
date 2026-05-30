import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/axios";
import Sidebar from "../components/Sidebar";

export default function CodeReview() {
  const { id: workspaceId } = useParams();

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [error, setError] = useState("");
  const [role, setRole] = useState("member");

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const wsRes = await api.get(`/workspaces/${workspaceId}`);
        const member = wsRes.data?.members?.find(
          (m) => m.user === currentUser.id || m.user?._id === currentUser.id
        );
        if (member) setRole(member.role);
      } catch (_) {}
    };
    fetchRole();
  }, [workspaceId]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError("");
    setReview(null);
    try {
      const res = await api.post("/ai/code-review", {
        code: code.trim(),
        language,
      });
      setReview(res.data.review);
    } catch (err) {
      console.error("AI review failed:", err.message);
      setError("AI Code Auditor failed to analyze this block. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const isViewer = role === "viewer";

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Main code editor block */}
        <div className="flex-1 p-8 overflow-y-auto scrollbar-thin flex flex-col gap-6">
          <div className="border-b border-zinc-900 pb-6">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent uppercase font-mono">
              [code_audit_ai]
            </h1>
            <p className="text-zinc-550 text-xs mt-1.5 font-mono">
              Rigorously audit code blocks for security flaws, memory leaks, and performance scaling.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Input code block */}
            <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Input Source Code</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1 text-[11px] text-zinc-400 font-mono"
                >
                  <option value="javascript">JavaScript / Node</option>
                  <option value="typescript">TypeScript</option>
                  <option value="python">Python</option>
                  <option value="go">Go</option>
                  <option value="html">HTML / CSS</option>
                </select>
              </div>

              <form onSubmit={handleReviewSubmit} className="flex flex-col gap-4">
                <textarea
                  placeholder="// Paste your functions, controller actions, or middleware here to audit..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 outline-none focus:border-zinc-700 transition text-xs text-white placeholder-zinc-750 font-mono h-96 resize-none scrollbar-thin"
                />

                {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-100 transition disabled:opacity-40 text-xs uppercase tracking-wider font-mono"
                >
                  {loading ? "Auditing AST & Sockets..." : "Trigger AI Code Audit"}
                </button>
              </form>
            </div>

            {/* Results code review block */}
            <div className="flex flex-col gap-6">
              {loading ? (
                <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-8 text-center flex flex-col items-center gap-4 py-20">
                  <span className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-400 rounded-full animate-spin" />
                  <p className="text-zinc-500 text-xs font-mono">Decompiling functions and scanning for security patterns...</p>
                </div>
              ) : review ? (
                <div className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-6 flex flex-col gap-6 animate-fade-in">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase font-mono text-zinc-300">Audit Diagnostics</h3>
                        <p className="text-[9px] text-zinc-600 font-mono">Automated Code Review Engine</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">SCORE</span>
                      <span className={`text-2xl font-black font-mono ${review.overallScore >= 80 ? "text-emerald-400" : "text-amber-400"}`}>
                        {review.overallScore}/100
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4 text-xs font-sans">
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase">Risk Level</span>
                        <span className={`text-lg font-black font-mono mt-1 ${review.riskLevel === 'Critical' || review.riskLevel === 'High' ? 'text-red-500' : review.riskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>{review.riskLevel}</span>
                      </div>
                      <div className="bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 flex flex-col justify-center gap-1">
                         <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase text-center mb-1">Severity Scores</span>
                         <div className="flex justify-between items-center px-2 text-[9px] font-mono"><span className="text-rose-400">Security</span> <span>{review.severityScoring?.security}/100</span></div>
                         <div className="flex justify-between items-center px-2 text-[9px] font-mono"><span className="text-amber-400">Perf</span> <span>{review.severityScoring?.performance}/100</span></div>
                         <div className="flex justify-between items-center px-2 text-[9px] font-mono"><span className="text-blue-400">Maintain</span> <span>{review.severityScoring?.maintainability}/100</span></div>
                         <div className="flex justify-between items-center px-2 text-[9px] font-mono"><span className="text-violet-400">Arch</span> <span>{review.severityScoring?.architecture}/100</span></div>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold font-mono text-rose-500 block uppercase tracking-wider mb-1">🔒 Security Review</span>
                      <p className="text-zinc-300 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 leading-relaxed">{review.securityReview}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold font-mono text-amber-400 block uppercase tracking-wider mb-1">⚡ Performance Review</span>
                      <p className="text-zinc-300 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 leading-relaxed">{review.performanceReview}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold font-mono text-blue-400 block uppercase tracking-wider mb-1">📖 Maintainability Review</span>
                      <p className="text-zinc-300 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 leading-relaxed">{review.maintainabilityReview}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold font-mono text-violet-400 block uppercase tracking-wider mb-1">🏗 Architecture Review</span>
                      <p className="text-zinc-300 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 leading-relaxed">{review.architectureReview}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold font-mono text-emerald-400 block uppercase tracking-wider mb-1">💡 Actionable Suggestions</span>
                      <ul className="text-zinc-300 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 leading-relaxed list-disc list-inside">
                        {review.suggestions?.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-16 text-center flex flex-col items-center gap-4 py-32">
                  <span className="text-4xl select-none font-mono">🔍</span>
                  <h3 className="text-sm font-bold text-zinc-300 font-mono">[diagnostics_idle]</h3>
                  <p className="text-zinc-650 text-xs max-w-xs font-mono leading-relaxed">
                    Paste source code or custom handler blocks on the left to initiate the automated code review system.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

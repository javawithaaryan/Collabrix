import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { wikiService } from "../services/wiki.service";

// ─── Markdown Renderer ──────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-white mt-5 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-6 mb-2 border-b border-zinc-800 pb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-extrabold text-white mt-6 mb-3 border-b border-zinc-700 pb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="text-zinc-300 italic">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-emerald-400 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-x-auto my-3"><code class="text-xs font-mono text-zinc-200">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`
    )
    .replace(/^\- (.+)$/gm, '<li class="ml-4 text-zinc-300 text-sm flex gap-2"><span class="text-zinc-600 mt-1">▸</span><span>$1</span></li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-zinc-300 text-sm flex gap-2"><span class="text-zinc-500 font-mono font-bold min-w-[1.2rem]">$1.</span><span>$2</span></li>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-violet-400 hover:text-violet-300 underline">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-2 border-violet-500 pl-4 text-zinc-400 italic my-2 text-sm">$1</blockquote>')
    .replace(/^---$/gm, '<hr class="border-zinc-800 my-4" />')
    .replace(/\n/g, "<br />");
}

// ─── Category Config ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "Architecture", label: "Architecture", icon: "🏗️", color: "violet" },
  { id: "Backend", label: "Backend", icon: "⚙️", color: "blue" },
  { id: "Frontend", label: "Frontend", icon: "🎨", color: "emerald" },
  { id: "Database", label: "Database", icon: "🗄️", color: "amber" },
  { id: "DevOps", label: "DevOps", icon: "🚀", color: "rose" },
  { id: "Security", label: "Security", icon: "🔐", color: "red" },
  { id: "Infrastructure", label: "Infrastructure", icon: "🌐", color: "cyan" },
  { id: "Testing", label: "Testing", icon: "🧪", color: "lime" },
  { id: "Onboarding", label: "Onboarding", icon: "👋", color: "pink" },
  { id: "Processes", label: "Processes", icon: "📋", color: "indigo" },
  { id: "Runbooks", label: "Runbooks", icon: "📖", color: "orange" },
  { id: "General", label: "General", icon: "📝", color: "zinc" },
];

const categoryColors = {
  violet: { bg: "bg-violet-950/40", text: "text-violet-300", border: "border-violet-800/40", badge: "bg-violet-900/60 text-violet-300 border-violet-700" },
  blue: { bg: "bg-blue-950/40", text: "text-blue-300", border: "border-blue-800/40", badge: "bg-blue-900/60 text-blue-300 border-blue-700" },
  emerald: { bg: "bg-emerald-950/40", text: "text-emerald-300", border: "border-emerald-800/40", badge: "bg-emerald-900/60 text-emerald-300 border-emerald-700" },
  amber: { bg: "bg-amber-950/40", text: "text-amber-300", border: "border-amber-800/40", badge: "bg-amber-900/60 text-amber-300 border-amber-700" },
  rose: { bg: "bg-rose-950/40", text: "text-rose-300", border: "border-rose-800/40", badge: "bg-rose-900/60 text-rose-300 border-rose-700" },
  red: { bg: "bg-red-950/40", text: "text-red-300", border: "border-red-800/40", badge: "bg-red-900/60 text-red-300 border-red-700" },
  cyan: { bg: "bg-cyan-950/40", text: "text-cyan-300", border: "border-cyan-800/40", badge: "bg-cyan-900/60 text-cyan-300 border-cyan-700" },
  lime: { bg: "bg-lime-950/40", text: "text-lime-300", border: "border-lime-800/40", badge: "bg-lime-900/60 text-lime-300 border-lime-700" },
  pink: { bg: "bg-pink-950/40", text: "text-pink-300", border: "border-pink-800/40", badge: "bg-pink-900/60 text-pink-300 border-pink-700" },
  indigo: { bg: "bg-indigo-950/40", text: "text-indigo-300", border: "border-indigo-800/40", badge: "bg-indigo-900/60 text-indigo-300 border-indigo-700" },
  orange: { bg: "bg-orange-950/40", text: "text-orange-300", border: "border-orange-800/40", badge: "bg-orange-900/60 text-orange-300 border-orange-700" },
  zinc: { bg: "bg-zinc-900/40", text: "text-zinc-300", border: "border-zinc-800/40", badge: "bg-zinc-900/60 text-zinc-300 border-zinc-700" },
};

function getCategoryMeta(catId) {
  return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[CATEGORIES.length - 1];
}

// ─── TimeAgo ────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
function Av({ name, size = "sm" }) {
  const colors = ["bg-violet-700", "bg-blue-700", "bg-emerald-700", "bg-amber-700", "bg-rose-700", "bg-indigo-700"];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sizeClass = size === "sm" ? "w-6 h-6 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

// ─── Category Badge ──────────────────────────────────────────────────────────
function CatBadge({ category }) {
  const meta = getCategoryMeta(category);
  const colors = categoryColors[meta.color] || categoryColors.zinc;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.badge} font-mono uppercase tracking-wider`}>
      <span>{meta.icon}</span>
      {category}
    </span>
  );
}

// ─── Wiki Editor ─────────────────────────────────────────────────────────────
function WikiEditor({ workspaceId, editingWiki, onSaved, onCancel }) {
  const [title, setTitle] = useState(editingWiki?.title || "");
  const [content, setContent] = useState(editingWiki?.content || "");
  const [summary, setSummary] = useState(editingWiki?.summary || "");
  const [category, setCategory] = useState(editingWiki?.category || "Architecture");
  const [tags, setTags] = useState(editingWiki ? (editingWiki.tags || []).join(", ") : "");
  const [status, setStatus] = useState(editingWiki?.status || "Published");
  const [editorMode, setEditorMode] = useState('edit'); // 'edit' | 'preview' | 'split'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const autoSaveRef = useRef(null);
  const [autoSaved, setAutoSaved] = useState(false);

  useEffect(() => {
    if (!editingWiki) return;
    autoSaveRef.current = setTimeout(() => {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 3000);
    return () => clearTimeout(autoSaveRef.current);
  }, [title, content, summary]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) { setError("Title and content are required."); return; }
    setSaving(true); setError("");
    try {
      const payload = {
        workspaceId,
        title: title.trim(),
        content: content.trim(),
        summary: summary.trim(),
        category,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        status,
        changeSummary: changeSummary.trim() || (editingWiki ? "Updated content" : "Initial creation"),
      };
      let result;
      if (editingWiki) {
        result = await wikiService.updateWiki(editingWiki._id, payload);
      } else {
        result = await wikiService.createWiki(payload);
      }
      onSaved(result.wiki);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition text-xs">
            ← Back
          </button>
          <div>
            <h2 className="text-sm font-bold text-white">{editingWiki ? "Edit Document" : "New Document"}</h2>
            <p className="text-[10px] text-zinc-500 font-mono">{autoSaved ? "✓ Auto-saved" : "Unsaved changes"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            {['edit','split','preview'].map(mode => (
              <button
                key={mode}
                onClick={() => setEditorMode(mode)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                  editorMode === mode ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {mode === 'edit' ? '✎ Edit' : mode === 'preview' ? '👁 Preview' : '⊞ Split'}
              </button>
            ))}
          </div>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 outline-none"
          >
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Archived">Archived</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
          >
            {saving ? "Saving..." : editingWiki ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin">
        {error && <div className="bg-red-950/40 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-xs">{error}</div>}

        {/* Title */}
        <input
          type="text"
          placeholder="Document title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-transparent border-b border-zinc-800 focus:border-zinc-600 outline-none text-2xl font-extrabold text-white placeholder-zinc-700 pb-3 transition w-full"
        />

        {/* Meta Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-zinc-500 font-mono uppercase mb-1 block">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
            >
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-zinc-500 font-mono uppercase mb-1 block">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="e.g. auth, security, jwt"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="text-[10px] text-zinc-500 font-mono uppercase mb-1 block">Summary (one-liner)</label>
          <input
            type="text"
            placeholder="Brief description of this document..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
          />
        </div>

        {/* Change Summary (for edits) */}
        {editingWiki && (
          <div>
            <label className="text-[10px] text-zinc-500 font-mono uppercase mb-1 block">Change Summary (optional)</label>
            <input
              type="text"
              placeholder="Describe what changed in this version..."
              value={changeSummary}
              onChange={e => setChangeSummary(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700"
            />
          </div>
        )}

        {/* Editor / Preview / Split */}
        {editorMode === 'split' ? (
          <div className="flex gap-4" style={{ minHeight: '400px' }}>
            <div className="flex-1 flex flex-col">
              <label className="text-[10px] text-zinc-500 font-mono uppercase mb-1 block">✎ Editor</label>
              <div className="relative flex-1">
                <textarea
                  placeholder={`# Document Title\n\nWrite your documentation here...`}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-zinc-200 outline-none focus:border-zinc-700 transition font-mono leading-relaxed resize-none scrollbar-thin"
                  style={{ minHeight: '400px' }}
                />
                <div className="absolute bottom-3 right-4 text-[9px] text-zinc-700 font-mono pointer-events-none">
                  {content.length} chars
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <label className="text-[10px] text-zinc-500 font-mono uppercase mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live Preview
              </label>
              <div className="flex-1 bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 overflow-y-auto scrollbar-thin">
                <h1 className="text-xl font-extrabold text-white mb-3">{title || 'Untitled'}</h1>
                <div
                  className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </div>
            </div>
          </div>
        ) : editorMode === 'preview' ? (
          <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-6 min-h-[400px]">
            <div className="text-xs text-zinc-500 font-mono mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Preview Mode
            </div>
            <h1 className="text-2xl font-extrabold text-white mb-4">{title || "Untitled"}</h1>
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          </div>
        ) : (
          <div className="flex-1">
            <label className="text-[10px] text-zinc-500 font-mono uppercase mb-1 block">Content (Markdown)</label>
            <div className="relative">
              <textarea
                placeholder={`# Document Title\n\nWrite your documentation here...\n\n## Overview\nUse markdown for rich formatting.\n\n## Code Example\n\`\`\`js\nconsole.log("Hello World");\n\`\`\``}
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 text-xs text-zinc-200 outline-none focus:border-zinc-700 transition font-mono leading-relaxed resize-none min-h-[400px] scrollbar-thin"
                style={{ minHeight: "400px" }}
              />
              <div className="absolute bottom-3 right-4 text-[9px] text-zinc-700 font-mono pointer-events-none">
                {content.length} chars · {content.split('\n').length} lines
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Version History Modal ───────────────────────────────────────────────────
function VersionHistoryModal({ wikiId, onClose, onRestored }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    wikiService.getWikiVersions(wikiId).then(data => {
      setVersions(data.versions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [wikiId]);

  const handleRestore = async (versionNumber) => {
    setRestoring(true);
    try {
      const res = await wikiService.restoreWikiVersion(wikiId, versionNumber);
      onRestored(res.wiki);
      onClose();
    } catch (err) {
      console.error("Failed to restore version", err);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
          <div>
            <h3 className="text-sm font-bold text-white">Version History</h3>
            <p className="text-[10px] text-zinc-500 font-mono">{versions.length} versions recorded</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition text-xs">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-thin">
          {loading ? (
            <div className="text-center py-8 text-zinc-500 text-xs">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">No version history yet.</div>
          ) : versions.map((v, i) => (
            <div
              key={v._id}
              onClick={() => setSelectedVersion(selectedVersion?._id === v._id ? null : v)}
              className={`p-4 rounded-xl border cursor-pointer transition ${selectedVersion?._id === v._id ? "bg-zinc-900 border-zinc-700" : "bg-zinc-950/60 border-zinc-900 hover:border-zinc-800"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-violet-400 font-bold">v{v.versionNumber}</span>
                  {i === 0 && <span className="text-[9px] bg-emerald-900/60 text-emerald-400 border border-emerald-800 rounded-full px-2 py-0.5 font-mono">current</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">{timeAgo(v.createdAt)}</span>
                  {i > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(v.versionNumber); }}
                      disabled={restoring}
                      className="px-2 py-1 text-[9px] bg-violet-900/40 border border-violet-800 text-violet-400 rounded-lg hover:bg-violet-900/70 transition font-bold"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Av name={v.editedBy?.name} />
                <span className="text-[10px] text-zinc-400">{v.editedBy?.name || "Unknown"}</span>
                {v.changeSummary && <span className="text-[10px] text-zinc-600">— {v.changeSummary}</span>}
              </div>
              {selectedVersion?._id === v._id && (
                <div className="mt-3 bg-zinc-950 border border-zinc-900 rounded-xl p-3 overflow-x-auto">
                  <pre className="text-[10px] font-mono text-zinc-400 whitespace-pre-wrap max-h-40 overflow-y-auto scrollbar-thin">
                    {v.contentSnapshot || "(empty)"}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Wiki Viewer ─────────────────────────────────────────────────────────────
function WikiViewer({ wiki, onEdit, onDelete, onDuplicate, onArchive, userRole }) {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [restoredWiki, setRestoredWiki] = useState(null);
  const displayWiki = restoredWiki || wiki;
  const isViewer = userRole === "viewer";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {showVersionHistory && (
        <VersionHistoryModal
          wikiId={wiki._id}
          onClose={() => setShowVersionHistory(false)}
          onRestored={(w) => { setRestoredWiki(w); setShowVersionHistory(false); }}
        />
      )}

      {/* Viewer Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 flex-shrink-0 bg-zinc-950/50">
        <div className="flex items-center gap-2">
          <CatBadge category={displayWiki.category} />
          {displayWiki.status === "Draft" && (
            <span className="text-[9px] bg-amber-950/60 text-amber-400 border border-amber-800 rounded-full px-2 py-0.5 font-mono">Draft</span>
          )}
          {displayWiki.status === "Archived" && (
            <span className="text-[9px] bg-zinc-900 text-zinc-500 border border-zinc-800 rounded-full px-2 py-0.5 font-mono">Archived</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowVersionHistory(true)}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition font-mono"
          >
            🕐 History
          </button>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition font-mono"
          >
            🔗 Copy Link
          </button>
          {!isViewer && (
            <>
              <button
                onClick={() => onDuplicate(wiki._id)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-white hover:border-zinc-700 transition font-mono"
              >
                ⧉ Duplicate
              </button>
              <button
                onClick={() => onEdit(wiki)}
                className="px-3 py-1.5 bg-violet-900/50 border border-violet-800 rounded-lg text-[10px] text-violet-300 hover:bg-violet-900/80 transition font-bold"
              >
                ✎ Edit
              </button>
              <button
                onClick={() => displayWiki.isArchived ? onArchive(wiki._id, 'restore') : onArchive(wiki._id, 'archive')}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-amber-400 hover:border-amber-800 transition font-mono"
              >
                {displayWiki.isArchived ? "↩ Restore" : "⊗ Archive"}
              </button>
              <button
                onClick={() => onDelete(wiki._id)}
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 hover:text-red-400 hover:border-red-900 transition font-mono"
              >
                🗑
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6 scrollbar-thin">
        {/* Title + Meta */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-white mb-3 leading-tight">{displayWiki.title}</h1>
          {displayWiki.summary && (
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">{displayWiki.summary}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5">
              <Av name={displayWiki.author?.name} />
              <span>{displayWiki.author?.name || "Unknown"}</span>
            </div>
            <span className="text-zinc-700">·</span>
            <span>Updated {timeAgo(displayWiki.updatedAt)}</span>
            <span className="text-zinc-700">·</span>
            <span>v{displayWiki.version}</span>
            <span className="text-zinc-700">·</span>
            <span>👁 {displayWiki.views || 0} views</span>
            {displayWiki.contributors?.length > 0 && (
              <>
                <span className="text-zinc-700">·</span>
                <div className="flex items-center gap-1">
                  {displayWiki.contributors.slice(0, 3).map((c, i) => (
                    <Av key={i} name={c.name} />
                  ))}
                  {displayWiki.contributors.length > 3 && (
                    <span className="text-zinc-600">+{displayWiki.contributors.length - 3}</span>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Tags */}
          {displayWiki.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {displayWiki.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-full text-[10px] text-zinc-400 font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <hr className="border-zinc-900 mb-6" />

        {/* Rendered Markdown */}
        <div
          className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(displayWiki.content) }}
        />

        {/* Relations */}
        {(displayWiki.linkedProjects?.length > 0 || displayWiki.linkedTasks?.length > 0 || displayWiki.linkedResources?.length > 0) && (
          <div className="mt-8 border-t border-zinc-900 pt-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono mb-3">Linked Resources</h3>
            <div className="flex flex-col gap-2">
              {displayWiki.linkedProjects?.map(p => (
                <div key={p._id} className="flex items-center gap-2 p-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl text-xs text-zinc-400">
                  <span>🗂</span> <span className="text-zinc-300">{p.name}</span>
                  <span className="ml-auto text-[9px] text-zinc-600 font-mono">project</span>
                </div>
              ))}
              {displayWiki.linkedTasks?.map(t => (
                <div key={t._id} className="flex items-center gap-2 p-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl text-xs text-zinc-400">
                  <span>✓</span> <span className="text-zinc-300">{t.title}</span>
                  <span className="ml-auto text-[9px] text-zinc-600 font-mono">task</span>
                </div>
              ))}
              {displayWiki.linkedResources?.map(r => (
                <div key={r._id} className="flex items-center gap-2 p-2.5 bg-zinc-900/50 border border-zinc-900 rounded-xl text-xs text-zinc-400">
                  <span>📎</span> <span className="text-zinc-300">{r.title}</span>
                  <span className="ml-auto text-[9px] text-zinc-600 font-mono">resource</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Wiki Sidebar ─────────────────────────────────────────────────────────────
function WikiSidebar({ wikis, selectedId, onSelect, onNew, searchQ, onSearch, filterCat, onFilterCat, loading, userRole }) {
  const filtered = wikis.filter(w => {
    const searchLower = searchQ.toLowerCase();
    const matchSearch = !searchQ || 
      w.title.toLowerCase().includes(searchLower) || 
      w.content?.toLowerCase().includes(searchLower) ||
      w.category?.toLowerCase().includes(searchLower) ||
      (w.tags && w.tags.some(t => t.toLowerCase().includes(searchLower))) ||
      w.author?.name?.toLowerCase().includes(searchLower);
    const matchCat = !filterCat || w.category === filterCat;
    return matchSearch && matchCat;
  });

  const grouped = {};
  filtered.forEach(w => {
    const cat = w.category || "General";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(w);
  });

  const isViewer = userRole === "viewer";

  return (
    <div className="flex flex-col h-full bg-zinc-950/30">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-900 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight font-mono">[wiki]</h1>
            <p className="text-[9px] text-zinc-600 font-mono mt-0.5">{wikis.length} documents</p>
          </div>
          {!isViewer && (
            <button
              onClick={onNew}
              className="p-1.5 rounded-lg bg-violet-900/60 border border-violet-800 text-violet-300 hover:bg-violet-900/90 transition text-xs font-bold"
              title="New document"
            >
              +
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQ}
            onChange={e => onSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-zinc-300 outline-none focus:border-zinc-700 transition placeholder-zinc-700"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-1 mt-2 flex-wrap">
          <button
            onClick={() => onFilterCat("")}
            className={`text-[9px] px-2 py-0.5 rounded-full border font-mono transition ${!filterCat ? "bg-zinc-800 border-zinc-700 text-white" : "border-zinc-900 text-zinc-600 hover:text-zinc-400"}`}
          >
            All
          </button>
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => onFilterCat(filterCat === c.id ? "" : c.id)}
              className={`text-[9px] px-2 py-0.5 rounded-full border font-mono transition ${filterCat === c.id ? "bg-zinc-800 border-zinc-700 text-white" : "border-zinc-900 text-zinc-600 hover:text-zinc-400"}`}
            >
              {c.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5 scrollbar-thin">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 rounded-xl bg-zinc-900/40 animate-pulse">
              <div className="h-3 bg-zinc-800 rounded w-3/4 mb-2" />
              <div className="h-2 bg-zinc-800/60 rounded w-1/2" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-xs">
            {searchQ ? "No results found" : "No documents yet"}
          </div>
        ) : Object.entries(grouped).map(([cat, docs]) => {
          const meta = getCategoryMeta(cat);
          const colors = categoryColors[meta.color] || categoryColors.zinc;
          return (
            <div key={cat} className="mb-2">
              <div className={`flex items-center gap-1.5 px-2 py-1 text-[9px] font-bold ${colors.text} font-mono uppercase tracking-wider mb-1`}>
                <span>{meta.icon}</span>
                <span>{cat}</span>
                <span className="ml-auto text-zinc-700">{docs.length}</span>
              </div>
              {docs.map(w => (
                <button
                  key={w._id}
                  onClick={() => onSelect(w)}
                  className={`w-full text-left p-3 rounded-xl border transition mb-0.5 ${
                    selectedId === w._id
                      ? "bg-zinc-900 border-zinc-700 shadow-md"
                      : "bg-transparent border-transparent hover:bg-zinc-900/40 hover:border-zinc-900"
                  }`}
                >
                  <div className="text-xs font-semibold text-zinc-200 truncate">{w.title}</div>
                  <div className="text-[9px] text-zinc-600 mt-0.5 truncate">{w.summary || w.content?.slice(0, 60) || "No summary"}</div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-zinc-700 font-mono">
                    <span>{timeAgo(w.updatedAt)}</span>
                    {w.status === "Draft" && <span className="text-amber-600">· draft</span>}
                    {w.isArchived && <span className="text-zinc-600">· archived</span>}
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Wiki Dashboard ───────────────────────────────────────────────────────────
function WikiDashboard({ wikis, onSelect, onNew, userRole }) {
  const recent = [...wikis].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);
  const popular = [...wikis].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);
  const byCategory = {};
  wikis.forEach(w => { byCategory[w.category] = (byCategory[w.category] || 0) + 1; });

  return (
    <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Engineering Wiki</h2>
          <p className="text-sm text-zinc-500 mt-1">{wikis.length} documents · team knowledge base</p>
        </div>
        {userRole !== "viewer" && (
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition"
          >
            <span>+</span> New Document
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Docs", value: wikis.length, icon: "📄", color: "text-violet-400" },
          { label: "Published", value: wikis.filter(w => w.status === "Published").length, icon: "✓", color: "text-emerald-400" },
          { label: "Drafts", value: wikis.filter(w => w.status === "Draft").length, icon: "✏️", color: "text-amber-400" },
          { label: "Total Views", value: wikis.reduce((s, w) => s + (w.views || 0), 0), icon: "👁", color: "text-blue-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-950/60 border border-zinc-900 rounded-2xl p-4">
            <div className={`text-lg font-mono ${stat.color}`}>{stat.icon} {stat.value}</div>
            <div className="text-[10px] text-zinc-500 mt-1 font-mono uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Categories Overview */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono mb-3">Categories</h3>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(byCategory).sort(([,a],[,b]) => b - a).map(([cat, count]) => {
            const meta = getCategoryMeta(cat);
            const colors = categoryColors[meta.color] || categoryColors.zinc;
            return (
              <button
                key={cat}
                className={`p-3 rounded-xl border ${colors.border} ${colors.bg} text-left transition hover:opacity-80`}
              >
                <div className={`text-lg mb-1`}>{meta.icon}</div>
                <div className={`text-xs font-bold ${colors.text}`}>{cat}</div>
                <div className="text-[10px] text-zinc-600 font-mono">{count} docs</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently Updated */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono mb-3">Recently Updated</h3>
        <div className="flex flex-col gap-2">
          {recent.map(w => (
            <button
              key={w._id}
              onClick={() => onSelect(w)}
              className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl text-left hover:border-zinc-800 transition group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CatBadge category={w.category} />
                    {w.status === "Draft" && <span className="text-[9px] text-amber-400 font-mono">draft</span>}
                  </div>
                  <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition truncate">{w.title}</h4>
                  {w.summary && <p className="text-xs text-zinc-500 mt-1 truncate">{w.summary}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[9px] text-zinc-600 font-mono">{timeAgo(w.updatedAt)}</div>
                  <div className="text-[9px] text-zinc-600 font-mono mt-0.5">v{w.version}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Av name={w.author?.name || w.lastEditedBy?.name} />
                <span className="text-[10px] text-zinc-600">{w.lastEditedBy?.name || w.author?.name}</span>
                <span className="ml-auto text-[10px] text-zinc-700 font-mono">👁 {w.views || 0}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Docs */}
      {popular.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono mb-3">Most Viewed</h3>
          <div className="grid grid-cols-2 gap-3">
            {popular.map((w, i) => (
              <button
                key={w._id}
                onClick={() => onSelect(w)}
                className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl text-left hover:border-zinc-800 transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl font-extrabold text-zinc-700 font-mono leading-none">#{i + 1}</span>
                  <CatBadge category={w.category} />
                </div>
                <h4 className="text-xs font-bold text-zinc-200 truncate">{w.title}</h4>
                <div className="text-[9px] text-zinc-600 font-mono mt-1">👁 {w.views || 0} views</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Wiki Page ───────────────────────────────────────────────────────────
export default function Wiki() {
  const { id: workspaceId } = useParams();
  const [wikis, setWikis] = useState([]);
  const [selectedWiki, setSelectedWiki] = useState(null);
  const [editingWiki, setEditingWiki] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [userRole, setUserRole] = useState("member");
  const [view, setView] = useState("dashboard"); // "dashboard" | "viewer" | "editor"
  const [confirmDelete, setConfirmDelete] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchWikis = useCallback(async () => {
    try {
      setLoading(true);
      const [wsRes, wikiRes] = await Promise.all([
        import("../lib/axios").then(m => m.default.get(`/workspaces/${workspaceId}`)),
        wikiService.getWorkspaceWikis(workspaceId),
      ]);

      const member = wsRes.data?.members?.find(m => m.user === currentUser.id || m.user?._id === currentUser.id);
      if (member) setUserRole(member.role);

      setWikis(wikiRes.wikis || []);
    } catch (err) {
      console.error("Failed to load wiki:", err);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchWikis(); }, [fetchWikis]);

  const handleSelectWiki = (w) => {
    setSelectedWiki(w);
    setView("viewer");
  };

  const handleNew = () => {
    setEditingWiki(null);
    setIsCreating(true);
    setView("editor");
  };

  const handleEdit = (w) => {
    setEditingWiki(w);
    setIsCreating(false);
    setView("editor");
  };

  const handleSaved = (wiki) => {
    setWikis(prev => {
      const idx = prev.findIndex(w => w._id === wiki._id);
      if (idx >= 0) { const updated = [...prev]; updated[idx] = wiki; return updated; }
      return [wiki, ...prev];
    });
    setSelectedWiki(wiki);
    setView("viewer");
  };

  const handleDelete = async (wikiId) => {
    if (!window.confirm("Delete this document? This cannot be undone.")) return;
    try {
      await wikiService.deleteWiki(wikiId);
      setWikis(prev => prev.filter(w => w._id !== wikiId));
      setSelectedWiki(null);
      setView("dashboard");
    } catch (err) { console.error("Failed to delete", err); }
  };

  const handleDuplicate = async (wikiId) => {
    try {
      const res = await wikiService.duplicateWiki(wikiId);
      setWikis(prev => [res.wiki, ...prev]);
      setSelectedWiki(res.wiki);
      setView("viewer");
    } catch (err) { console.error("Failed to duplicate", err); }
  };

  const handleArchive = async (wikiId, action) => {
    try {
      const res = action === "archive"
        ? await wikiService.archiveWiki(wikiId)
        : await wikiService.restoreWiki(wikiId);
      setWikis(prev => prev.map(w => w._id === wikiId ? res.wiki : w));
      if (selectedWiki?._id === wikiId) setSelectedWiki(res.wiki);
    } catch (err) { console.error("Failed to archive/restore", err); }
  };

  const handleCancel = () => {
    setView(selectedWiki ? "viewer" : "dashboard");
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(100,100,100,0.3); border-radius: 9999px; }
        .prose h1, .prose h2, .prose h3 { color: white; }
        .prose li { list-style: none; }
      `}</style>

      {/* LEFT SIDEBAR */}
      <div className="w-72 border-r border-zinc-900 flex flex-col flex-shrink-0">
        {/* Dashboard Toggle */}
        <div className="p-3 border-b border-zinc-900">
          <button
            onClick={() => { setView("dashboard"); setSelectedWiki(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition ${view === "dashboard" ? "bg-zinc-900 border border-zinc-800 text-white" : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/30"}`}
          >
            <span>🏠</span> Wiki Home
          </button>
        </div>

        <WikiSidebar
          wikis={wikis}
          selectedId={selectedWiki?._id}
          onSelect={handleSelectWiki}
          onNew={handleNew}
          searchQ={searchQ}
          onSearch={setSearchQ}
          filterCat={filterCat}
          onFilterCat={setFilterCat}
          loading={loading}
          userRole={userRole}
        />
      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {view === "editor" ? (
          <WikiEditor
            workspaceId={workspaceId}
            editingWiki={editingWiki}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        ) : view === "viewer" && selectedWiki ? (
          <WikiViewer
            wiki={selectedWiki}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            userRole={userRole}
          />
        ) : (
          loading && wikis.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl mb-3 animate-pulse">📖</div>
                <p className="text-zinc-600 text-sm font-mono">Loading wiki...</p>
              </div>
            </div>
          ) : (
            <WikiDashboard
              wikis={wikis}
              onSelect={handleSelectWiki}
              onNew={handleNew}
              userRole={userRole}
            />
          )
        )}
      </div>
    </div>
  );
}

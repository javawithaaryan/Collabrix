import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/axios";
import socket from "../socket";
import Sidebar from "../components/Sidebar";
import Avatar from "../components/ui/Avatar";
import Skeleton from "../components/ui/Skeleton";

const CATEGORIES = [
  { id: "all", label: "All Knowledge", icon: "📦" },
  { id: "backend", label: "Backend", icon: "⚙️" },
  { id: "auth", label: "Auth / Security", icon: "🔑" },
  { id: "deployment", label: "Deployment", icon: "🚀" },
  { id: "security", label: "Security", icon: "🛡️" },
  { id: "realtime", label: "Realtime Systems", icon: "⚡" },
  { id: "performance", label: "Performance", icon: "📈" },
  { id: "ui-inspiration", label: "UI / UX Inspiration", icon: "🎨" },
  { id: "ai", label: "AI & LLMs", icon: "🤖" },
  { id: "bug-fix", label: "Bug Fixes", icon: "🐛" },
  { id: "architecture", label: "Architecture", icon: "🏛️" },
  { id: "database", label: "Databases", icon: "💾" },
  { id: "devops", label: "DevOps", icon: "⚙️" },
];

const DISCOVERY_STARTER_PACKS = [
  {
    title: "Vite + Tailwind Starter Stack",
    description: "Production-ready base stack featuring code-splitting configuration and responsive drawer architecture.",
    url: "https://github.com/vitejs/vite",
    category: "ui-inspiration",
    tags: ["vite", "react", "tailwindcss", "starter-pack"],
    domain: "github.com",
    type: "github"
  },
  {
    title: "Socket.IO horizontal scaling config",
    description: "Complete setup for Multi-node Socket.IO streams using Redis Pub/Sub adapters.",
    url: "https://socket.io/docs/v4/redis-adapter/",
    category: "realtime",
    tags: ["socket-io", "redis", "scaling", "realtime"],
    domain: "socket.io",
    type: "docs"
  },
  {
    title: "JWT Token Rotation architecture",
    description: "Industry-standard JSON Web Token refresh mechanisms with secure rotate-on-reuse and blacklist algorithms.",
    url: "https://auth0.com/docs/tokens/refresh-tokens",
    category: "auth",
    tags: ["jwt", "auth", "security", "best-practices"],
    domain: "auth0.com",
    type: "docs"
  }
];

export default function ResourceHub() {
  const { id: workspaceId } = useParams();
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPrivateOnly, setShowPrivateOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Curated Engineering Collections / Playbooks
  const [collections, setCollections] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState("all");
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDesc, setNewCollectionDesc] = useState("");
  const [newCollectionResources, setNewCollectionResources] = useState([]);
  const [allWorkspaceResources, setAllWorkspaceResources] = useState([]);

  // Recommendations and Projects
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  // Add Resource Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  
  // Resource Form States
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState("url");
  const [formFavicon, setFormFavicon] = useState("");
  const [formPreviewImage, setFormPreviewImage] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formCategory, setFormCategory] = useState("other");
  const [formTags, setFormTags] = useState([]);
  const [formTagInput, setFormTagInput] = useState("");
  const [formSuggestedTags, setFormSuggestedTags] = useState([]);
  const [formCodeSnippet, setFormCodeSnippet] = useState("");
  const [formAiPrompt, setFormAiPrompt] = useState("");
  const [formIsPrivate, setFormIsPrivate] = useState(false);
  const [formPublishToFeed, setFormPublishToFeed] = useState(true);
  const [formSelectedProjectId, setFormSelectedProjectId] = useState("");
  const [formSelectedTaskId, setFormSelectedTaskId] = useState("");

  // Comment & Expanded States
  const [expandedCommentsId, setExpandedCommentsId] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentType, setCommentType] = useState("note");
  const [solvedIndicator, setSolvedIndicator] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Presence tracker
  const [activeResourceViewers, setActiveResourceViewers] = useState({}); // { resourceId: [userName] }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const urlTimerRef = useRef(null);

  // Global keydown paste capture overlay (Ctrl/Cmd + K)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowAddModal(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // ─── Fetch Resources ───────────────────────────────────────────────────
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      let queryParams = `?page=${page}&limit=12`;
      if (activeCategory !== "all") queryParams += `&category=${activeCategory}`;
      if (activeType !== "all") queryParams += `&type=${activeType}`;
      if (searchQuery.trim()) queryParams += `&query=${encodeURIComponent(searchQuery.trim())}`;
      if (showPrivateOnly) queryParams += `&isPrivate=true`;

      const res = await api.get(`/resources/workspace/${workspaceId}${queryParams}`);
      setResources(res.data.resources || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error("Failed to load resources:", err.message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, activeCategory, activeType, searchQuery, showPrivateOnly, page]);

  // Curated Engineering Playbooks Fetch
  const fetchCollections = useCallback(async () => {
    try {
      const res = await api.get(`/collections/workspace/${workspaceId}`);
      setCollections(res.data || []);
    } catch (_) {}
  }, [workspaceId]);

  // ─── Fetch Recommendations & Context ───────────────────────────────
  const fetchRecommendations = useCallback(async () => {
    try {
      setLoadingRecs(true);
      const res = await api.get(`/resources/workspace/${workspaceId}/recommend`);
      setRecommendations(res.data.recommendations || []);
    } catch (err) {
      console.error("Failed to load recommendations:", err.message);
    } finally {
      setLoadingRecs(false);
    }
  }, [workspaceId]);

  // Track AI feedback
  const handleTrackFeedback = async (rec, action) => {
    try {
      await api.post("/resources/feedback", {
        workspaceId,
        resourceTitle: rec.title,
        resourceDomain: rec.domain || "",
        action,
      });
      if (action === "saved") {
        handleQuickAdd(rec);
      }
      // Remove from active recommended options
      setRecommendations((prev) => prev.filter((r) => r.title !== rec.title));
    } catch (_) {}
  };

  // Track resource views and trigger historical memory logs
  const handleTrackView = async (resId) => {
    try {
      const res = await api.post(`/resources/${resId}/view`);
      setResources((prev) => prev.map((r) => (r._id === resId ? res.data : r)));
    } catch (_) {}
  };

  const fetchWorkspaceProjects = useCallback(async () => {
    try {
      const res = await api.get(`/projects/${workspaceId}`);
      setProjects(res.data || []);
    } catch (_) {}
  }, [workspaceId]);

  const fetchProjectTasks = async (projectId) => {
    if (!projectId) {
      setTasks([]);
      return;
    }
    try {
      const res = await api.get(`/tasks/${projectId}`);
      setTasks(res.data || []);
    } catch (_) {}
  };

  useEffect(() => {
    localStorage.setItem("activeWorkspaceId", workspaceId);
    fetchResources();
    fetchCollections();
    fetchRecommendations();
    fetchWorkspaceProjects();
  }, [workspaceId, fetchResources, fetchCollections, fetchRecommendations, fetchWorkspaceProjects]);

  // ─── Realtime Socket Listeners ──────────────────────────────────────────
  useEffect(() => {
    if (!socket.connected) socket.connect();
    socket.emit("join-workspace", { workspaceId, userId: user.id, userName: user.name });

    const onResourceCreated = (newRes) => {
      setResources((prev) => {
        const exists = prev.some((r) => r._id === newRes._id);
        if (exists) return prev;
        return [newRes, ...prev];
      });
    };

    const onResourceUpdated = (updatedRes) => {
      setResources((prev) => prev.map((r) => (r._id === updatedRes._id ? updatedRes : r)));
    };

    const onResourceDeleted = (deletedId) => {
      setResources((prev) => prev.filter((r) => r._id !== deletedId));
    };

    const onResourceViewed = ({ resourceId, userName }) => {
      setActiveResourceViewers((prev) => {
        const current = prev[resourceId] || [];
        if (current.includes(userName)) return prev;
        return { ...prev, [resourceId]: [...current, userName] };
      });
    };

    socket.on("resource:created", onResourceCreated);
    socket.on("resource:updated", onResourceUpdated);
    socket.on("resource:deleted", onResourceDeleted);
    socket.on("resource:viewed", onResourceViewed);

    return () => {
      socket.off("resource:created", onResourceCreated);
      socket.off("resource:updated", onResourceUpdated);
      socket.off("resource:deleted", onResourceDeleted);
      socket.off("resource:viewed", onResourceViewed);
    };
  }, [workspaceId]);

  // ─── Instant URL Scraping (WOW #1 & #2) ──────────────────────────────
  const handleUrlChange = (value) => {
    setUrlInput(value);
    
    if (urlTimerRef.current) clearTimeout(urlTimerRef.current);

    const trimmed = value.trim();
    if (!trimmed) return;

    // Detect if valid URL string
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (urlPattern.test(trimmed)) {
      setScraping(true);
      urlTimerRef.current = setTimeout(async () => {
        try {
          const res = await api.post("/resources/extract", { url: trimmed });
          const { title, description, favicon, previewImage, domain, type, category, suggestedTags } = res.data.metadata;
          
          setFormTitle(title || "");
          setFormDesc(description || "");
          setFormType(type || "url");
          setFormFavicon(favicon || "");
          setFormPreviewImage(previewImage || "");
          setFormDomain(domain || "");
          setFormCategory(category || "other");
          setFormSuggestedTags(suggestedTags || []);
        } catch (err) {
          console.error("Instant scraping failed:", err.message);
        } finally {
          setScraping(false);
        }
      }, 800);
    }
  };

  // ─── Save Resource ─────────────────────────────────────────────────────
  const saveResource = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setSaving(true);
    try {
      const payload = {
        title: formTitle.trim(),
        description: formDesc.trim(),
        url: urlInput.trim(),
        type: formType,
        favicon: formFavicon,
        previewImage: formPreviewImage,
        domain: formDomain,
        codeSnippet: formCodeSnippet,
        aiPrompt: formAiPrompt,
        category: formCategory,
        tags: formTags,
        workspaceId,
        projectId: formSelectedProjectId || null,
        taskId: formSelectedTaskId || null,
        isPrivate: formIsPrivate,
        publishToFeed: formPublishToFeed,
      };

      await api.post("/resources", payload);
      closeAddModal();
      fetchResources();
    } catch (err) {
      console.error("Failed to save resource:", err.message);
    } finally {
      setSaving(false);
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setUrlInput("");
    setFormTitle("");
    setFormDesc("");
    setFormType("url");
    setFormFavicon("");
    setFormPreviewImage("");
    setFormDomain("");
    setFormCategory("other");
    setFormTags([]);
    setFormSuggestedTags([]);
    setFormCodeSnippet("");
    setFormAiPrompt("");
    setFormIsPrivate(false);
    setFormPublishToFeed(true);
    setFormSelectedProjectId("");
    setFormSelectedTaskId("");
  };

  // ─── Save Recommended/Discovery Resource ──────────────────────────────
  const handleQuickAdd = async (item) => {
    try {
      const payload = {
        title: item.title,
        description: item.description,
        url: item.url,
        type: item.type || "url",
        favicon: item.favicon || `https://www.google.com/s2/favicons?sz=64&domain=${item.domain}`,
        previewImage: item.previewImage || "",
        domain: item.domain,
        category: item.category || "other",
        tags: item.tags || [],
        workspaceId,
        publishToFeed: true,
      };
      await api.post("/resources", payload);
      fetchResources();
    } catch (err) {
      console.error("Failed quick add:", err.message);
    }
  };

  // ─── Toggle Like ───────────────────────────────────────────────────────
  const handleLike = async (id) => {
    // Optimistic UI Update
    setResources((prev) =>
      prev.map((r) => {
        if (r._id === id) {
          const liked = r.likes.includes(user.id);
          const nextLikes = liked
            ? r.likes.filter((uid) => uid !== user.id)
            : [...r.likes, user.id];
          return { ...r, likes: nextLikes };
        }
        return r;
      })
    );

    try {
      await api.post(`/resources/${id}/like`);
    } catch (_) {
      fetchResources(); // Rollback
    }
  };

  // ─── Add Comment ───────────────────────────────────────────────────────
  const handleCommentSubmit = async (e, id) => {
    e.preventDefault();
    if (!commentText.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/resources/${id}/comment`, {
        text: commentText.trim(),
        commentType,
        solvedIndicator,
      });
      setResources((prev) => prev.map((r) => (r._id === id ? res.data : r)));
      setCommentText("");
      setCommentType("note");
      setSolvedIndicator(false);
    } catch (err) {
      console.error("Comment submit failed:", err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // ─── Delete Resource ───────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this resource?")) return;
    try {
      await api.delete(`/resources/${id}`);
      setResources((prev) => prev.filter((r) => r._id !== id));
    } catch (_) {}
  };

  // ─── Curated Playbook Collections ──────────────────────────────────────
  const fetchAllWorkspaceResources = async () => {
    try {
      const res = await api.get(`/resources/workspace/${workspaceId}?limit=100`);
      setAllWorkspaceResources(res.data.resources || []);
    } catch (err) {
      console.error("Failed to load workspace resources:", err.message);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      setSaving(true);
      const payload = {
        name: newCollectionName.trim(),
        description: newCollectionDesc.trim(),
        workspaceId,
        resourceIds: newCollectionResources,
        sprintLink: "",
      };

      const res = await api.post("/collections", payload);
      setCollections((prev) => [res.data, ...prev]);

      // Reset fields
      setNewCollectionName("");
      setNewCollectionDesc("");
      setNewCollectionResources([]);
      setShowCollectionModal(false);
    } catch (err) {
      console.error("Failed to curate playbook:", err.message);
    } finally {
      setSaving(false);
    }
  };

  // Tag helper
  const addTag = (tag) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !formTags.includes(trimmed)) {
      setFormTags([...formTags, trimmed]);
    }
  };

  return (
    <div className="flex bg-black text-white min-h-screen">
      <Sidebar />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Resource Feed Grid */}
        <div className="flex-1 p-8 overflow-y-auto scrollbar-thin">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-zinc-900 pb-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Resource Hub
              </h1>
              <p className="text-zinc-500 text-sm mt-1.5">
                The shared engineering knowledge layer and team memory.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-black font-extrabold px-5 py-3 rounded-2xl text-xs hover:bg-zinc-200 transition active:scale-98 shadow-lg shadow-white/5 flex items-center justify-center gap-1.5"
            >
              <span className="text-base">+</span> Add Resource
            </button>
          </div>

          {/* Quick Search and Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-950/20 border border-zinc-900 rounded-2xl p-4 mb-6">
            <div className="flex flex-1 items-center gap-2 max-w-md bg-zinc-900/40 border border-zinc-850/80 rounded-xl px-3.5 py-2.5">
              <span className="text-zinc-650 text-xs select-none">🔍</span>
              <input
                type="text"
                placeholder="Search knowledge by title, tags, description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs text-zinc-300 outline-none w-full placeholder-zinc-700 font-sans"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Type Select */}
              <div className="flex items-center gap-1.5 border-r border-zinc-900 pr-4">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Type:</span>
                {["all", "github", "docs", "code-snippet", "ai-prompt", "bug-fix"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setActiveType(type);
                      setPage(1);
                    }}
                    className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded transition capitalize ${
                      activeType === type
                        ? "bg-white text-black font-extrabold"
                        : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    {type.replace("-", " ")}
                  </button>
                ))}
              </div>

              {/* Private Check */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-[10px] font-bold text-zinc-400 hover:text-white transition">
                <input
                  type="checkbox"
                  checked={showPrivateOnly}
                  onChange={(e) => {
                    setShowPrivateOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="w-3.5 h-3.5 rounded border-zinc-800 bg-zinc-950 text-white focus:ring-zinc-700 outline-none cursor-pointer accent-white"
                />
                🔒 Only Private
              </label>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 items-start">
            {/* Category & Playbooks Sidebar */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Category Filter Column */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-4 flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-650 uppercase font-black tracking-wider block px-3.5 mb-2 select-none">
                  Categories
                </span>
                <div className="flex flex-row overflow-x-auto lg:flex-col lg:overflow-x-visible gap-1 pb-2 lg:pb-0 scrollbar-none">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setSelectedCollectionId("all");
                        setPage(1);
                      }}
                      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold whitespace-nowrap transition w-full ${
                        activeCategory === cat.id && selectedCollectionId === "all"
                          ? "bg-zinc-900 text-white border border-zinc-800 shadow"
                          : "text-zinc-550 hover:bg-zinc-900/40 hover:text-zinc-300"
                      }`}
                    >
                      <span className="text-sm flex-shrink-0 select-none">{cat.icon}</span>
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Collections / Playbooks Ledger */}
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] text-zinc-655 uppercase font-black tracking-wider select-none font-mono">
                    Playbooks
                  </span>
                  <button
                    onClick={() => {
                      setShowCollectionModal(true);
                      fetchAllWorkspaceResources();
                    }}
                    className="text-[9px] font-mono text-zinc-400 hover:text-white transition uppercase"
                  >
                    [+ new]
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  {collections.length === 0 ? (
                    <p className="text-[9px] text-zinc-700 italic px-2 font-mono">No playbooks seeded. Organize your knowledge packs here.</p>
                  ) : (
                    collections.map((col) => (
                      <button
                        key={col._id}
                        onClick={() => {
                          setSelectedCollectionId(col._id);
                          setActiveCategory("all");
                          setResources(col.resources || []);
                        }}
                        className={`flex flex-col gap-0.5 px-3.5 py-2.5 rounded-xl text-left transition w-full ${
                          selectedCollectionId === col._id
                            ? "bg-zinc-900 text-white border border-zinc-800"
                            : "text-zinc-550 hover:bg-zinc-900/30 hover:text-zinc-300"
                        }`}
                      >
                        <span className="text-xs font-extrabold truncate">📔 {col.name}</span>
                        {col.description && (
                          <span className="text-[9px] text-zinc-600 font-mono truncate">{col.description}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Knowledge Cards Stream */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {selectedCollectionId !== "all" && (
                (() => {
                  const currentCollection = collections.find(c => c._id === selectedCollectionId);
                  if (!currentCollection) return null;
                  return (
                    <div className="bg-gradient-to-r from-zinc-950 to-zinc-900 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden flex flex-col gap-4 shadow-xl">
                      <div className="absolute top-0 right-0 p-4">
                        <button
                          onClick={() => {
                            setSelectedCollectionId("all");
                            fetchResources();
                          }}
                          className="text-zinc-500 hover:text-white text-xs font-mono transition"
                        >
                          ✕ Close Playbook
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-wider font-extrabold">Curation Playbook</span>
                        <h2 className="text-xl font-black text-white">📔 {currentCollection.name}</h2>
                        {currentCollection.description && (
                          <p className="text-xs text-zinc-400 font-mono mt-1">{currentCollection.description}</p>
                        )}
                      </div>

                      {currentCollection.aiSummary ? (
                        <div className="bg-violet-950/10 border border-violet-900/30 rounded-2xl p-4 mt-2">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-xs select-none">🧙</span>
                            <span className="text-[10px] text-violet-400 font-mono uppercase tracking-widest font-bold">Gemini Playbook Guide</span>
                          </div>
                          <p className="text-[11px] text-zinc-300 font-mono leading-relaxed select-text whitespace-pre-wrap">
                            {currentCollection.aiSummary}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-3.5 mt-2 flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 font-mono">No AI guidance generated yet for this playbook.</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[10px] text-zinc-550 font-mono mt-1 border-t border-zinc-900/80 pt-3">
                        <span>Created by <strong className="text-zinc-400">{currentCollection.createdBy?.name || "System"}</strong></span>
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.post(`/collections/${currentCollection._id}/follow`);
                              setCollections((prev) => prev.map(c => c._id === currentCollection._id ? { ...c, followers: res.data.followers } : c));
                            } catch (_) {}
                          }}
                          className={`px-3 py-1 rounded-md border text-[9px] font-bold transition ${
                            currentCollection.followers?.includes(user.id)
                              ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                              : "bg-white text-black border-transparent hover:bg-zinc-200"
                          }`}
                        >
                          {currentCollection.followers?.includes(user.id) ? "★ Following Playbook" : "☆ Follow Playbook"}
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}

              {loading ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-28 rounded" />
                      </div>
                      <Skeleton className="h-5 w-3/4 rounded" />
                      <Skeleton className="h-10 w-full rounded" />
                      <Skeleton className="h-28 w-full rounded-2xl" />
                      <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-4 w-12 rounded" />
                        <Skeleton className="h-5 w-5 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : resources.length === 0 ? (
                <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-16 text-center flex flex-col items-center gap-4 max-w-2xl mx-auto">
                  <span className="text-4xl select-none">📚</span>
                  <h3 className="text-lg font-bold text-zinc-300">The ecosystem is quiet</h3>
                  <p className="text-zinc-650 text-sm leading-relaxed max-w-sm">
                    No resources saved matching this category. Add a Github repo, standard documentation, or a deployment bug-fix to populate the hub.
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-white px-4 py-2 rounded-xl text-xs transition"
                  >
                    Save First Resource
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {resources.map((res) => {
                      const liked = res.likes.includes(user.id);
                      const isCreator = res.createdBy?._id === user.id || res.createdBy === user.id;

                      return (
                        <div
                          key={res._id}
                          className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 flex flex-col justify-between hover:border-zinc-800 transition duration-300 relative group overflow-hidden shadow-lg shadow-black/20"
                        >
                          <div>
                            {/* Card Top Details */}
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {res.favicon ? (
                                  <img
                                    src={res.favicon}
                                    alt="favicon"
                                    className="w-4 h-4 rounded-sm flex-shrink-0 bg-zinc-900"
                                    onError={(e) => { e.target.style.display = "none"; }}
                                  />
                                ) : (
                                  <span className="text-xs">🔗</span>
                                )}
                                <span className="text-[10px] text-zinc-500 font-mono truncate max-w-[120px] select-none">
                                  {res.domain || "Knowledge"}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {activeResourceViewers[res._id]?.length > 0 && (
                                  <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 select-none mr-2 bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 rounded">
                                    <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>{activeResourceViewers[res._id].join(", ")} reading</span>
                                  </div>
                                )}
                                {res.isPrivate && (
                                  <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/60 border border-zinc-850 px-1.5 py-0.5 rounded-full">
                                    🔒 Private
                                  </span>
                                )}
                                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
                                  {res.category}
                                </span>
                              </div>
                            </div>

                            {/* Resource Description */}
                            <a
                              href={res.url || "#"}
                              target={res.url ? "_blank" : "_self"}
                              rel="noreferrer"
                              className="block focus:outline-none"
                              onClick={() => handleTrackView(res._id)}
                            >
                              <h3 className="text-sm font-extrabold text-zinc-200 group-hover:text-white leading-snug tracking-tight transition line-clamp-1">
                                {res.title}
                              </h3>
                              <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed line-clamp-2">
                                {res.description || "No engineering description provided."}
                              </p>
                            </a>

                            {/* Preview Image if URL */}
                            {res.previewImage && (
                              <div className="mt-3.5 rounded-2xl border border-zinc-900 overflow-hidden max-h-[140px] flex items-center select-none bg-zinc-900/30">
                                <img
                                  src={res.previewImage}
                                  alt="preview"
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.parentNode.style.display = "none"; }}
                                />
                              </div>
                            )}

                            {/* Code Snippet block if type */}
                            {res.type === "code-snippet" && res.codeSnippet && (
                              <div className="mt-3 bg-zinc-900 border border-zinc-850 rounded-2xl p-3.5 overflow-x-auto max-h-[160px] scrollbar-thin">
                                <pre className="text-[10px] text-zinc-300 font-mono leading-relaxed">{res.codeSnippet}</pre>
                              </div>
                            )}

                            {/* AI Prompt block if type */}
                            {res.type === "ai-prompt" && res.aiPrompt && (
                              <div className="mt-3 bg-violet-950/10 border border-violet-950/40 rounded-2xl p-3.5 select-all">
                                <p className="text-[10px] text-violet-400 font-mono leading-relaxed italic">🤖 "{res.aiPrompt}"</p>
                              </div>
                            )}

                            {/* Tags list */}
                            {res.tags?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {res.tags.map((t, ti) => (
                                  <span
                                    key={ti}
                                    className="text-[9px] bg-zinc-900 border border-zinc-850 text-zinc-450 px-2 py-0.5 rounded-md font-mono"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Connected Tasks Badges */}
                            {res.tasks?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-mono text-zinc-550 select-none">Connected Tasks:</span>
                                {res.tasks.map((task) => (
                                  <span
                                    key={task._id}
                                    className="text-[9px] bg-indigo-950/20 text-indigo-400 border border-indigo-900/30 px-2 py-0.5 rounded font-mono truncate max-w-[120px]"
                                    title={task.title}
                                  >
                                    📋 {task.title}
                                  </span>
                                ))}
                              </div>
                            )}

                            {res.usageMetadata?.length > 0 && (
                              <div className="mt-2.5 pt-2.5 border-t border-zinc-900/60 flex flex-col gap-1 select-none">
                                {res.usageMetadata.map((metaItem, mIdx) => {
                                  const colors = {
                                    sprint: "bg-indigo-950/20 text-indigo-400 border-indigo-900/30",
                                    task: "bg-teal-950/20 text-teal-400 border-teal-900/30",
                                    fix: "bg-emerald-950/20 text-emerald-400 border-emerald-900/30",
                                    deploy: "bg-amber-950/20 text-amber-400 border-amber-900/30",
                                    other: "bg-zinc-900 text-zinc-400 border-zinc-800",
                                  };
                                  const color = colors[metaItem.contextType] || colors.other;
                                  return (
                                    <div key={mIdx} className={`text-[8px] font-mono border px-2 py-0.5 rounded-lg flex items-center gap-1.5 w-fit ${color}`}>
                                      <span>⚡</span>
                                      <span>{metaItem.text}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Card bottom bar */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-900/80">
                            <div className="flex items-center gap-1">
                              <Avatar alt={res.createdBy?.name || "Team"} size="xs" />
                              <span className="text-[10px] text-zinc-550 font-medium truncate max-w-[80px]">
                                {res.createdBy?.name || "System"}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Views */}
                              <span className="text-[10px] text-zinc-500 font-mono select-none" title="Views">
                                👁️ {res.views || 0}
                              </span>

                              {/* Likes */}
                              <button
                                onClick={() => handleLike(res._id)}
                                className={`flex items-center gap-1 text-[10px] font-mono transition ${
                                  liked ? "text-red-400" : "text-zinc-500 hover:text-red-400"
                                }`}
                              >
                                <span>{liked ? "♥" : "♡"}</span>
                                <span>{res.likes?.length || 0}</span>
                              </button>

                              {/* Comments count / toggle */}
                              <button
                                onClick={() => setExpandedCommentsId(expandedCommentsId === res._id ? null : res._id)}
                                className="flex items-center gap-1 text-[10px] text-zinc-550 hover:text-white font-mono transition"
                              >
                                <span>💬</span>
                                <span>{res.comments?.length || 0}</span>
                              </button>

                              {/* Delete button if creator */}
                              {isCreator && (
                                <button
                                  onClick={() => handleDelete(res._id)}
                                  className="text-zinc-650 hover:text-red-400 transition text-xs p-0.5"
                                  title="Delete resource"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expanded Comments Panel */}
                          {expandedCommentsId === res._id && (
                            <div className="mt-4 pt-4 border-t border-zinc-900/60 flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                              <span className="text-[9px] uppercase font-bold text-zinc-550 tracking-wider font-mono">Comments</span>
                              <div className="flex flex-col gap-2">
                                {(res.comments || []).map((comm) => (
                                  <div key={comm._id} className="bg-zinc-900/40 border border-zinc-900 rounded-xl p-2.5">
                                    <div className="flex justify-between items-center mb-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-extrabold text-zinc-400">{comm.userName}</span>
                                        {comm.type && comm.type !== "note" && (
                                          <span className="text-[7px] font-mono uppercase bg-red-950/40 text-red-400 border border-red-900/30 px-1 rounded">
                                            {comm.type}
                                          </span>
                                        )}
                                        {comm.solvedIndicator && (
                                          <span className="text-[7px] font-mono uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 px-1 rounded">
                                            ✔ resolved blocker
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[8px] text-zinc-650 font-mono">{new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-300 leading-relaxed break-words">{comm.text}</p>
                                  </div>
                                ))}
                              </div>

                              <form onSubmit={(e) => handleCommentSubmit(e, res._id)} className="flex flex-col gap-2 mt-1 bg-zinc-900/30 p-2 rounded-2xl border border-zinc-900">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={commentType}
                                      onChange={(e) => setCommentType(e.target.value)}
                                      className="bg-zinc-950 text-zinc-400 border border-zinc-850 text-[9px] font-mono rounded px-1 py-0.5 outline-none cursor-pointer"
                                    >
                                      <option value="note">Note</option>
                                      <option value="caveat">Caveat</option>
                                      <option value="warning">Warning</option>
                                      <option value="solution">Solution</option>
                                    </select>

                                    <label className="flex items-center gap-1.5 text-[9px] text-zinc-500 hover:text-white cursor-pointer select-none font-mono">
                                      <input
                                        type="checkbox"
                                        checked={solvedIndicator}
                                        onChange={(e) => setSolvedIndicator(e.target.checked)}
                                        className="rounded border-zinc-800 bg-zinc-950 text-white cursor-pointer accent-white"
                                      />
                                      Helped solve blocker
                                    </label>
                                  </div>
                                </div>

                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    placeholder={solvedIndicator ? "Explain how this link solved the bug..." : "Reply or discuss..."}
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[10px] outline-none focus:border-zinc-700 transition"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!commentText.trim() || submittingComment}
                                    className="bg-white text-black px-3 py-1.5 rounded-lg text-[9px] font-extrabold hover:bg-zinc-200 transition disabled:opacity-40"
                                  >
                                    Post
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination row */}
                  {pages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8 pt-4 border-t border-zinc-900">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-30"
                      >
                        Previous
                      </button>
                      <span className="text-zinc-500 text-xs font-mono">
                        Page {page} of {pages}
                      </span>
                      <button
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        disabled={page === pages}
                        className="bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white px-3 py-1.5 rounded-lg text-xs transition disabled:opacity-30"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar (AI Copilot & Discovery packs) */}
        <div className="w-80 flex-shrink-0 border-l border-zinc-900 p-6 overflow-y-auto scrollbar-thin flex flex-col gap-6 bg-zinc-950/20">
          {/* AI recommendations widget */}
          <div className="bg-gradient-to-br from-zinc-950 to-zinc-900/40 border border-zinc-900 rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm select-none">🤖</span>
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">AI Knowledge Pulse</h3>
                <p className="text-[9px] text-zinc-650 font-mono mt-0.5">Learns from team sprint focus</p>
              </div>
            </div>

            {loadingRecs ? (
              <div className="flex flex-col gap-3 py-4 animate-pulse">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-zinc-600 text-[10px] leading-relaxed italic py-2">
                Explain your sprint themes in projects to generate intelligent co-pilot references.
              </p>
            ) : (
              <div className="flex flex-col gap-3.5 mt-4">
                {recommendations.map((rec, ri) => (
                  <div
                    key={ri}
                    className="border border-violet-950/30 hover:border-violet-850/50 bg-violet-950/5 rounded-2xl p-3 flex flex-col gap-2 transition duration-200"
                  >
                    <div>
                      <span className="text-[9px] font-mono text-violet-400 uppercase tracking-widest block font-extrabold mb-0.5">
                        {rec.category || "Suggested"}
                      </span>
                      <h4 className="text-xs font-extrabold text-zinc-200 line-clamp-1 leading-snug">
                        {rec.title}
                      </h4>
                      <p className="text-[10px] text-zinc-550 leading-snug line-clamp-2 mt-1">
                        {rec.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-violet-900/10">
                      <span className="text-[9px] text-zinc-500 font-mono">{rec.domain}</span>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => handleTrackFeedback(rec, "ignored")}
                          className="text-[9px] font-mono text-zinc-600 hover:text-zinc-400 transition"
                          title="Dismiss recommendation"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => handleTrackFeedback(rec, "saved")}
                          className="text-[9px] font-extrabold uppercase text-violet-400 hover:text-violet-300 transition"
                        >
                          + Save
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Discovery Starter Packs (Calm community Packs) */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5">
            <span className="text-[9px] font-extrabold uppercase text-zinc-600 tracking-wider block mb-3.5 select-none">
              🌐 Developer Starter Packs
            </span>
            <div className="flex flex-col gap-3.5">
              {DISCOVERY_STARTER_PACKS.map((pack, pi) => (
                <div key={pi} className="flex flex-col gap-1.5 border-b border-zinc-900/60 pb-3 last:border-0 last:pb-0">
                  <h4 className="text-xs font-extrabold text-zinc-300 leading-snug">{pack.title}</h4>
                  <p className="text-[10px] text-zinc-650 leading-relaxed line-clamp-2">{pack.description}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[8px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 font-mono border border-zinc-850">
                      {pack.type}
                    </span>
                    <button
                      onClick={() => handleQuickAdd(pack)}
                      className="text-[9px] font-extrabold uppercase text-zinc-400 hover:text-white transition"
                    >
                      + Save to Hub
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-Up Add Resource Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-overlay">
          <style>{`
            @keyframes overlayFade {
              from { opacity: 0; backdrop-filter: blur(0px); }
              to { opacity: 1; backdrop-filter: blur(4px); }
            }
            @keyframes modalScaleUp {
              from { opacity: 0; transform: scale(0.96) translateY(8px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            .animate-overlay {
              animation: overlayFade 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            .animate-modal {
              animation: modalScaleUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
          `}</style>
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-modal">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📚</span>
                <div>
                  <h2 className="text-sm font-extrabold text-white tracking-tight">Save Developer Resource</h2>
                  <p className="text-[10px] font-mono text-zinc-650 mt-0.5">AI suggests tags & categories automatically</p>
                </div>
              </div>
              <button
                onClick={closeAddModal}
                className="text-zinc-500 hover:text-white transition w-8 h-8 rounded-full border border-zinc-900 hover:border-zinc-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={saveResource} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 scrollbar-thin">
              {/* Type Switcher */}
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Resource Type</label>
                <div className="grid grid-cols-5 gap-1 bg-zinc-900 border border-zinc-850 p-1 rounded-xl">
                  {[
                    { id: "url", label: "URL Link" },
                    { id: "docs", label: "Documentation" },
                    { id: "code-snippet", label: "Code Snippet" },
                    { id: "ai-prompt", label: "AI Prompt" },
                    { id: "bug-fix", label: "Bug Fix" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setFormType(t.id);
                        if (t.id === "code-snippet" || t.id === "ai-prompt") setUrlInput("");
                      }}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition capitalize ${
                        formType === t.id ? "bg-zinc-950 text-white" : "text-zinc-550 hover:text-zinc-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Paste URL block */}
              {(formType === "url" || formType === "docs" || formType === "bug-fix") && (
                <div>
                  <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">
                    Reference URL Link
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Paste link (e.g. github.com/facebook/react or react.dev)"
                      value={urlInput}
                      onChange={(e) => handleUrlChange(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-10 py-3 text-xs outline-none focus:border-zinc-700 text-white placeholder-zinc-700"
                      required
                    />
                    {scraping && (
                      <span className="absolute right-3.5 top-3 flex h-4 w-4 items-center justify-center">
                        <span className="animate-spin rounded-full h-3.5 w-3.5 border border-zinc-700 border-t-zinc-400" />
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Title</label>
                <input
                  type="text"
                  placeholder={scraping ? "Extracting metadata instantly..." : "Resource title or reference topic"}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:border-zinc-700 text-white placeholder-zinc-700"
                  required
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Description</label>
                <textarea
                  placeholder="What does this resource cover? Useful details for your teammates."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 h-20 text-xs resize-none outline-none focus:border-zinc-700 text-white placeholder-zinc-700 leading-relaxed"
                />
              </div>

              {/* Code Snippet Box */}
              {formType === "code-snippet" && (
                <div>
                  <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Code Snippet</label>
                  <textarea
                    placeholder={`// Paste your helper code, deployment patches, or config scripts here...\nexport const decryptToken = (token) => { ... }`}
                    value={formCodeSnippet}
                    onChange={(e) => setFormCodeSnippet(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-32 text-xs font-mono resize-none outline-none focus:border-zinc-700 text-white placeholder-zinc-700 leading-relaxed"
                    required
                  />
                </div>
              )}

              {/* AI Prompt Box */}
              {formType === "ai-prompt" && (
                <div>
                  <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">AI Generative Prompt</label>
                  <textarea
                    placeholder={`Paste highly effective system prompts, code builders, or test generator prompts...\n"Act as a security auditor. Analyze this JWT middleware..."`}
                    value={formAiPrompt}
                    onChange={(e) => setFormAiPrompt(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 h-24 text-xs font-mono resize-none outline-none focus:border-zinc-700 text-white placeholder-zinc-700 leading-relaxed"
                    required
                  />
                </div>
              )}

              {/* Category selector */}
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-3 text-zinc-350 outline-none focus:border-zinc-700 cursor-pointer"
                >
                  {CATEGORIES.slice(1).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                  <option value="other">📦 General Reference</option>
                </select>
              </div>

              {/* Tags panel */}
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">Tags</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {formTags.map((t, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] px-2.5 py-1 rounded-lg font-mono"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => setFormTags(formTags.filter((tg) => tg !== t))}
                        className="text-zinc-500 hover:text-red-400 transition text-[9px] ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter custom tag & press Enter"
                    value={formTagInput}
                    onChange={(e) => setFormTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && formTagInput.trim()) {
                        e.preventDefault();
                        addTag(formTagInput);
                        setFormTagInput("");
                      }
                    }}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-zinc-700 text-white placeholder-zinc-700"
                  />
                </div>

                {/* AI Suggested Tags (WOW #2) */}
                {formSuggestedTags?.length > 0 && (
                  <div className="mt-3.5 bg-violet-950/5 border border-violet-900/10 rounded-2xl p-3.5">
                    <span className="text-[9px] font-mono text-violet-400 uppercase tracking-wider block font-extrabold mb-2">
                      💡 Suggested AI Tags (Click to Add):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {formSuggestedTags
                        .filter((t) => !formTags.includes(t))
                        .map((t, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => addTag(t)}
                            className="text-[9px] bg-zinc-950 hover:bg-violet-950/20 text-zinc-450 hover:text-violet-400 border border-zinc-850 hover:border-violet-900/30 px-2 py-1 rounded-lg font-mono transition"
                          >
                            + {t}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Task integration attachment dropdown (PHASE 3) */}
              <div>
                <label className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider block mb-2">
                  🔗 Link/Attach to a Project Task (Optional)
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <select
                    value={formSelectedProjectId}
                    onChange={(e) => {
                      setFormSelectedProjectId(e.target.value);
                      fetchProjectTasks(e.target.value);
                      setFormSelectedTaskId("");
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-3 text-zinc-350 outline-none focus:border-zinc-700 cursor-pointer"
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        📁 {p.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={formSelectedTaskId}
                    onChange={(e) => setFormSelectedTaskId(e.target.value)}
                    disabled={!formSelectedProjectId}
                    className="w-full bg-zinc-900 border border-zinc-800 text-xs rounded-xl px-3 py-3 text-zinc-350 outline-none focus:border-zinc-700 cursor-pointer disabled:opacity-40"
                  >
                    <option value="">Select Task...</option>
                    {tasks.map((t) => (
                      <option key={t._id} value={t._id}>
                        📋 {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visibility and Sharing Toggles */}
              <div className="border-t border-zinc-900 pt-5 mt-2 flex flex-col gap-3.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-zinc-350 block">Save Privately</span>
                    <span className="text-[10px] text-zinc-600 block mt-0.5">Private references are visible only to you.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsPrivate}
                    onChange={(e) => {
                      setFormIsPrivate(e.target.checked);
                      if (e.target.checked) setFormPublishToFeed(false);
                    }}
                    className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-white focus:ring-zinc-700 outline-none cursor-pointer accent-white"
                  />
                </label>

                {!formIsPrivate && (
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-zinc-350 block">Publish to Workspace Feed</span>
                      <span className="text-[10px] text-zinc-600 block mt-0.5">Announce this resource in the team chat and activity panel.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formPublishToFeed}
                      onChange={(e) => setFormPublishToFeed(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-white focus:ring-zinc-700 outline-none cursor-pointer accent-white"
                    />
                  </label>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-zinc-900 pt-5 flex gap-3 justify-end flex-shrink-0 bg-zinc-950/80">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-5 py-2.5 border border-zinc-850 hover:border-zinc-700 text-xs font-extrabold text-zinc-400 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formTitle.trim()}
                  className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-extrabold rounded-xl transition disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save Knowledge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide-Up Curate Playbook Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto animate-overlay">
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-modal">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-900 flex justify-between items-center bg-zinc-950/80">
              <div className="flex items-center gap-2.5">
                <span className="text-lg">📔</span>
                <div>
                  <h2 className="text-sm font-extrabold text-white tracking-tight">Curate Engineering Playbook</h2>
                  <p className="text-[10px] text-zinc-550 font-mono mt-0.5">Bundle resources into structured playbooks for your team</p>
                </div>
              </div>
              <button
                onClick={() => setShowCollectionModal(false)}
                className="text-zinc-600 hover:text-white text-xs font-mono transition"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateCollection} className="flex-1 flex flex-col min-h-0 bg-zinc-950/40 p-6 gap-5 overflow-y-auto scrollbar-thin">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Playbook Name</label>
                <input
                  type="text"
                  placeholder="e.g. Postgres DB Scaling Rules"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 focus:border-zinc-700 outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-750 transition"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Scope / Description</label>
                <textarea
                  placeholder="Summarize when and why developers should reference this playbook..."
                  value={newCollectionDesc}
                  onChange={(e) => setNewCollectionDesc(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 focus:border-zinc-700 outline-none rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-750 min-h-[70px] max-h-[140px] resize-y font-mono transition"
                />
              </div>

              {/* Resource Selection List */}
              <div className="flex flex-col gap-2 min-h-0 flex-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold">Select References to Bundle</label>
                  <span className="text-[9px] text-zinc-650 font-mono">
                    {newCollectionResources.length} items bundled
                  </span>
                </div>

                <div className="border border-zinc-900 bg-zinc-950 rounded-2xl flex-1 overflow-y-auto max-h-[180px] p-2 flex flex-col gap-1.5 scrollbar-thin">
                  {allWorkspaceResources.length === 0 ? (
                    <div className="text-center py-8 text-zinc-650 text-[10px] font-mono italic">
                      No saved resources found in workspace to curate.
                    </div>
                  ) : (
                    allWorkspaceResources.map((item) => {
                      const isSelected = newCollectionResources.includes(item._id);
                      return (
                        <label
                          key={item._id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                            isSelected
                              ? "bg-zinc-900/60 border-zinc-800 text-white"
                              : "bg-zinc-950 border-zinc-900 text-zinc-450 hover:bg-zinc-900/20 hover:text-zinc-200"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewCollectionResources((prev) => [...prev, item._id]);
                              } else {
                                setNewCollectionResources((prev) => prev.filter((id) => id !== item._id));
                              }
                            }}
                            className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-white focus:ring-zinc-700 outline-none cursor-pointer accent-white"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-bold block truncate">{item.title}</span>
                            <span className="text-[9px] text-zinc-600 font-mono block truncate mt-0.5">{item.url}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* AI Playbook notice */}
              <div className="bg-violet-950/15 border border-violet-900/20 rounded-2xl p-4 flex gap-3 items-center">
                <span className="text-lg">🧙</span>
                <div>
                  <h4 className="text-[10px] font-bold text-violet-400 font-mono uppercase tracking-wider">Gemini Playbook Orchestrator</h4>
                  <p className="text-[9px] text-zinc-550 leading-relaxed font-mono mt-0.5">
                    Bundling 2 or more resources will automatically invoke the AI Architect to synthesize a custom integration guide for your team.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-zinc-900 pt-5 flex gap-3 justify-end flex-shrink-0 bg-zinc-950/80">
                <button
                  type="button"
                  onClick={() => setShowCollectionModal(false)}
                  className="px-5 py-2.5 border border-zinc-850 hover:border-zinc-700 text-xs font-extrabold text-zinc-400 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newCollectionName.trim()}
                  className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 text-xs font-extrabold rounded-xl transition disabled:opacity-40"
                >
                  {saving ? "Synthesizing Playbook..." : "Seed Playbook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

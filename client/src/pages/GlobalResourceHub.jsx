import { useState } from "react";
import { Link } from "react-router-dom";
import GlobalLayout from "../components/layouts/GlobalLayout";

const COLLECTIONS = [
  {
    id: "auth",
    name: "Authentication",
    description: "JWT, OAuth, Sessions, and secure auth patterns",
    category: "Authentication",
    resources: 5,
    icon: "🔐",
  },
  {
    id: "redis",
    name: "Redis & Caching",
    description: "Redis architecture, scaling, and optimization",
    category: "Database",
    resources: 4,
    icon: "⚡",
  },
  {
    id: "realtime",
    name: "Realtime Systems",
    description: "WebSockets, Socket.IO, and event-driven architecture",
    category: "Realtime",
    resources: 3,
    icon: "🔄",
  },
  {
    id: "devops",
    name: "DevOps & Deployment",
    description: "Docker, Kubernetes, CI/CD pipelines",
    category: "DevOps",
    resources: 4,
    icon: "🚀",
  },
  {
    id: "ai",
    name: "AI & LLMs",
    description: "LLM integration, prompt engineering, RAG",
    category: "AI",
    resources: 5,
    icon: "🤖",
  },
  {
    id: "backend",
    name: "Backend Patterns",
    description: "Node.js, Express, database design, APIs",
    category: "Backend",
    resources: 6,
    icon: "⚙️",
  },
];

const RESOURCES = [
  {
    id: 1,
    title: "JWT Refresh Token Rotation",
    description: "Industry-standard JWT refresh token architecture with secure rotation",
    url: "https://auth0.com/docs/tokens/refresh-tokens",
    category: "Authentication",
    resourceType: "Documentation",
    tags: ["jwt", "auth", "security"],
    collection: "auth",
    upvotes: 234,
    saves: 156,
    views: 1203,
    sharedBy: "Alex Chen",
  },
  {
    id: 2,
    title: "OAuth 2.0 Implementation Guide",
    description: "Complete guide to implementing OAuth 2.0 with popular providers",
    url: "https://oauth.net/2/",
    category: "Authentication",
    resourceType: "Article",
    tags: ["oauth", "auth", "security"],
    collection: "auth",
    upvotes: 189,
    saves: 124,
    views: 892,
    sharedBy: "Jordan Park",
  },
  {
    id: 3,
    title: "Redis Cluster Scaling",
    description: "Production guide to scaling Redis across multiple nodes",
    url: "https://redis.io/docs/management/scaling/",
    category: "Database",
    resourceType: "Documentation",
    tags: ["redis", "scaling", "performance"],
    collection: "redis",
    upvotes: 267,
    saves: 198,
    views: 1556,
    sharedBy: "Morgan Lee",
  },
  {
    id: 4,
    title: "Socket.IO Horizontal Scaling with Redis",
    description: "Setup Socket.IO for multiple servers using Redis adapter",
    url: "https://socket.io/docs/v4/redis-adapter/",
    category: "Realtime",
    resourceType: "Tutorial",
    tags: ["socket.io", "redis", "realtime", "scaling"],
    collection: "realtime",
    upvotes: 312,
    saves: 287,
    views: 2103,
    sharedBy: "Casey Williams",
  },
  {
    id: 5,
    title: "Docker Multi-Stage Builds",
    description: "Optimize Docker builds with multi-stage approach for production",
    url: "https://docs.docker.com/build/building/multi-stage/",
    category: "DevOps",
    resourceType: "Documentation",
    tags: ["docker", "devops", "optimization"],
    collection: "devops",
    upvotes: 198,
    saves: 156,
    views: 1289,
    sharedBy: "Sam Rodriguez",
  },
  {
    id: 6,
    title: "LangChain Integration Patterns",
    description: "Best practices for integrating LangChain with your backend",
    url: "https://python.langchain.com/",
    category: "AI",
    resourceType: "Tutorial",
    tags: ["llm", "langchain", "ai", "python"],
    collection: "ai",
    upvotes: 445,
    saves: 389,
    views: 2876,
    sharedBy: "Riley Martinez",
  },
  {
    id: 7,
    title: "Node.js Best Practices",
    description: "Comprehensive guide to Node.js production best practices",
    url: "https://github.com/goldbergyoni/nodebestpractices",
    category: "Backend",
    resourceType: "GitHub Repo",
    tags: ["node.js", "best-practices", "backend"],
    collection: "backend",
    upvotes: 523,
    saves: 467,
    views: 3421,
    sharedBy: "Quinn Thompson",
  },
  {
    id: 8,
    title: "API Rate Limiting Strategies",
    description: "Token bucket, sliding window, and other rate limiting algorithms",
    url: "https://stripe.com/blog/rate-limiting",
    category: "Backend",
    resourceType: "Article",
    tags: ["rate-limiting", "api", "performance"],
    collection: "backend",
    upvotes: 289,
    saves: 234,
    views: 1876,
    sharedBy: "Alex Chen",
  },
];

export default function GlobalResourceHub() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("trending");
  const [savedResources, setSavedResources] = useState(new Set());

  const filteredResources = RESOURCES.filter((resource) => {
    if (activeFilter !== "all" && resource.collection !== activeFilter) return false;
    if (
      searchQuery &&
      !resource.title.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "trending") return b.upvotes - a.upvotes;
    if (sortBy === "newest") return b.id - a.id;
    if (sortBy === "popular") return b.views - a.views;
    return 0;
  });

  const handleSaveResource = (id) => {
    setSavedResources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <GlobalLayout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Resource Hub</h1>
          <p className="text-slate-400 mb-6">
            Curated engineering knowledge shared by the community
          </p>

          {/* Search and Sort */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="popular">Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Collections */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {COLLECTIONS.map((collection) => (
              <button
                key={collection.id}
                onClick={() =>
                  setActiveFilter(
                    activeFilter === collection.id ? "all" : collection.id
                  )
                }
                className={`rounded-lg p-6 text-left transition ${
                  activeFilter === collection.id
                    ? "bg-blue-600 border border-blue-500 shadow-lg shadow-blue-500/30"
                    : "bg-slate-800 border border-slate-700 hover:border-slate-600"
                }`}
              >
                <div className="text-4xl mb-3">{collection.icon}</div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {collection.name}
                </h3>
                <p
                  className={`text-sm mb-3 ${
                    activeFilter === collection.id
                      ? "text-blue-100"
                      : "text-slate-400"
                  }`}
                >
                  {collection.description}
                </p>
                <span
                  className={`text-xs font-semibold ${
                    activeFilter === collection.id
                      ? "text-blue-100"
                      : "text-slate-400"
                  }`}
                >
                  {collection.resources} resources
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Resources List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {activeFilter === "all"
                ? "All Resources"
                : `${
                    COLLECTIONS.find((c) => c.id === activeFilter)?.name
                  }`}
            </h2>
            <span className="text-slate-400 text-sm">
              {filteredResources.length} resources
            </span>
          </div>

          <div className="space-y-4">
            {filteredResources.map((resource) => (
              <div
                key={resource.id}
                className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xl font-bold text-blue-400 hover:text-blue-300 transition"
                    >
                      {resource.title}
                    </a>
                    <p className="text-slate-400 text-sm mt-2">
                      {resource.description}
                    </p>
                    <p className="text-slate-500 text-xs mt-2">
                      Shared by {resource.sharedBy}
                    </p>
                  </div>
                  <span className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded ml-4 whitespace-nowrap">
                    {resource.resourceType}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-slate-700/50 text-slate-300 px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats and Actions */}
                <div className="flex justify-between items-center text-slate-400 text-sm">
                  <div className="flex gap-6">
                    <span className="flex items-center gap-1">👍 {resource.upvotes}</span>
                    <span className="flex items-center gap-1">👁️ {resource.views}</span>
                  </div>
                  <button
                    onClick={() => handleSaveResource(resource.id)}
                    className={`font-semibold transition ${
                      savedResources.has(resource.id)
                        ? "text-yellow-400 hover:text-yellow-300"
                        : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    {savedResources.has(resource.id) ? "★ Saved" : "☆ Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
}

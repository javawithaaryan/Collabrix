import { useState } from "react";
import GlobalLayout from "../components/layouts/GlobalLayout";

const DISCUSSIONS = [
  {
    id: 1,
    title: "Best practices for Redis caching in production",
    type: "Question",
    category: "Backend",
    content: "Looking for recommendations on how to structure Redis caching for maximum efficiency...",
    author: "Alex Chen",
    authorLevel: "Architect",
    replies: 5,
    upvotes: 156,
    views: 1203,
    acceptedReply: {
      author: "Morgan Lee",
      content: "Use a tiered caching approach with Redis layers for hot/warm/cold data...",
    },
    tags: ["redis", "caching", "performance"],
    createdAt: "2 hours ago",
  },
  {
    id: 2,
    title: "WebSocket connection pooling across multiple servers",
    type: "Discussion",
    category: "Realtime",
    content: "Discussion about the best ways to manage WebSocket connections in a distributed system...",
    author: "Jordan Park",
    authorLevel: "Builder",
    replies: 8,
    upvotes: 234,
    views: 1876,
    acceptedReply: null,
    tags: ["websockets", "scaling", "architecture"],
    createdAt: "4 hours ago",
  },
  {
    id: 3,
    title: "How to implement OAuth2 with custom user attributes?",
    type: "Question",
    category: "Security",
    content: "We need to extend OAuth2 to include custom user attributes. What's the recommended approach?",
    author: "Casey Williams",
    authorLevel: "Builder",
    replies: 3,
    upvotes: 89,
    views: 567,
    acceptedReply: {
      author: "Riley Martinez",
      content: "You can store custom attributes in your user database and fetch them after OAuth callback...",
    },
    tags: ["oauth", "authentication", "security"],
    createdAt: "1 day ago",
  },
  {
    id: 4,
    title: "Architecture review: E-commerce platform with high concurrency",
    type: "Architecture Review",
    category: "System Design",
    content: "Looking for feedback on the architecture we're building for a high-traffic e-commerce platform...",
    author: "Quinn Thompson",
    authorLevel: "Legend",
    replies: 12,
    upvotes: 467,
    views: 3421,
    acceptedReply: null,
    tags: ["architecture", "scalability", "ecommerce"],
    createdAt: "3 days ago",
  },
  {
    id: 5,
    title: "We just shipped our first AI-powered feature!",
    type: "Weekly Win",
    category: "AI",
    content: "Built an AI-powered recommendation engine that improved conversions by 23%...",
    author: "Sam Rodriguez",
    authorLevel: "Architect",
    replies: 18,
    upvotes: 890,
    views: 5234,
    acceptedReply: null,
    tags: ["ai", "launch", "success"],
    createdAt: "1 week ago",
  },
];

const DISCUSSION_TYPE_COLORS = {
  Question: "bg-blue-500/20 text-blue-400",
  Discussion: "bg-purple-500/20 text-purple-400",
  "Architecture Review": "bg-amber-500/20 text-amber-400",
  Showcase: "bg-green-500/20 text-green-400",
  Learning: "bg-cyan-500/20 text-cyan-400",
  Poll: "bg-pink-500/20 text-pink-400",
  "Weekly Win": "bg-red-500/20 text-red-400",
};

const AUTHOR_LEVEL_COLORS = {
  Starter: "bg-slate-500/20 text-slate-300",
  Builder: "bg-blue-500/20 text-blue-400",
  Architect: "bg-indigo-500/20 text-indigo-400",
  Legend: "bg-yellow-500/20 text-yellow-400",
};

export default function EngineersSpace() {
  const [discussions, setDiscussions] = useState(DISCUSSIONS);
  const [sortBy, setSortBy] = useState("trending");
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false);

  const filteredDiscussions = discussions
    .filter((d) => {
      if (filterType !== "all" && d.type !== filterType) return false;
      if (
        searchQuery &&
        !d.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "trending") return b.upvotes - a.upvotes;
      if (sortBy === "newest") return b.id - a.id;
      if (sortBy === "popular") return b.views - a.views;
      return 0;
    });

  return (
    <GlobalLayout>
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Engineer's Space</h1>
          <p className="text-slate-400 mb-6">
            Community discussions, architecture reviews, and knowledge sharing
          </p>

          {/* Search and Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <button
              onClick={() => setShowNewDiscussionModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition whitespace-nowrap"
            >
              New Discussion
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterType === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              All
            </button>
            {["Question", "Discussion", "Architecture Review", "Weekly Win"].map(
              (type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterType === type
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {type}
                </button>
              )
            )}
          </div>
        </div>

        {/* Sort */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-slate-400 text-sm">
            {filteredDiscussions.length} discussions
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
          >
            <option value="trending">Trending</option>
            <option value="newest">Newest</option>
            <option value="popular">Most Viewed</option>
          </select>
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          {filteredDiscussions.map((discussion) => (
            <div
              key={discussion.id}
              className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:border-slate-600 transition cursor-pointer"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded ${
                        DISCUSSION_TYPE_COLORS[discussion.type]
                      }`}
                    >
                      {discussion.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      {discussion.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {discussion.title}
                  </h3>
                </div>
              </div>

              {/* Content Preview */}
              <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                {discussion.content}
              </p>

              {/* Accepted Solution Badge */}
              {discussion.acceptedReply && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-green-400 font-bold">✓</span>
                    <span className="text-green-400 text-sm font-semibold">
                      Accepted Solution by {discussion.acceptedReply.author}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm line-clamp-1">
                    {discussion.acceptedReply.content}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1">
                    👤 {discussion.author}
                    <span
                      className={`text-xs px-2 py-0.5 rounded ml-1 ${
                        AUTHOR_LEVEL_COLORS[discussion.authorLevel]
                      }`}
                    >
                      {discussion.authorLevel}
                    </span>
                  </span>
                  <span>{discussion.createdAt}</span>
                </div>

                <div className="flex items-center gap-6 text-slate-400">
                  <span className="flex items-center gap-1">
                    💬 {discussion.replies}
                  </span>
                  <span className="flex items-center gap-1">
                    👍 {discussion.upvotes}
                  </span>
                  <span className="flex items-center gap-1">
                    👁️ {discussion.views}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* New Discussion Modal */}
        {showNewDiscussionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-8 max-w-2xl w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-6">
                Start a Discussion
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-sm block mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="What's your question or topic?"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-sm block mb-2">
                    Type
                  </label>
                  <select className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition">
                    <option>Question</option>
                    <option>Discussion</option>
                    <option>Architecture Review</option>
                    <option>Showcase</option>
                    <option>Weekly Win</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-sm block mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Share your question or topic details..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowNewDiscussionModal(false)}
                    className="px-6 py-2 text-slate-300 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition">
                    Post Discussion
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlobalLayout>
  );
}

import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Resource from "../models/Resource.js";
import Task from "../models/Task.js";
import Message from "../models/Message.js";
import { logPulseEvent } from "../services/pulseService.js";
import AiFeedback from "../models/AiFeedback.js";

// Light keyword-based fallback for tag suggestion
function suggestOfflineMetadata(title, description, content = "") {
  const p = (title + " " + description + " " + content).toLowerCase();
  
  let category = "other";
  const tags = [];
  
  if (p.includes("api") || p.includes("express") || p.includes("node") || p.includes("controller") || p.includes("endpoint") || p.includes("backend")) {
    category = "backend";
    tags.push("api", "backend", "node");
  } else if (p.includes("jwt") || p.includes("auth") || p.includes("token") || p.includes("login") || p.includes("password") || p.includes("session")) {
    category = "auth";
    tags.push("auth", "security", "jwt");
  } else if (p.includes("deploy") || p.includes("aws") || p.includes("heroku") || p.includes("vercel") || p.includes("docker") || p.includes("nginx")) {
    category = "deployment";
    tags.push("deployment", "devops", "cloud");
  } else if (p.includes("security") || p.includes("cors") || p.includes("helmet") || p.includes("hash") || p.includes("encrypt")) {
    category = "security";
    tags.push("security", "protection");
  } else if (p.includes("socket") || p.includes("realtime") || p.includes("io") || p.includes("ws") || p.includes("presence") || p.includes("multiplayer")) {
    category = "realtime";
    tags.push("realtime", "websocket", "socket-io");
  } else if (p.includes("perf") || p.includes("scale") || p.includes("speed") || p.includes("optimize") || p.includes("memory") || p.includes("cache")) {
    category = "performance";
    tags.push("performance", "scaling", "cache");
  } else if (p.includes("css") || p.includes("tailwind") || p.includes("motion") || p.includes("framer") || p.includes("animation") || p.includes("design") || p.includes("ui")) {
    category = "ui-inspiration";
    tags.push("ui", "frontend", "design");
  } else if (p.includes("gemini") || p.includes("ai") || p.includes("gpt") || p.includes("llm") || p.includes("prompt") || p.includes("model")) {
    category = "ai";
    tags.push("ai", "generative-ai", "prompts");
  } else if (p.includes("bug") || p.includes("fix") || p.includes("resolve") || p.includes("error") || p.includes("crash") || p.includes("exception")) {
    category = "bug-fix";
    tags.push("bug-fix", "debugging", "patch");
  } else if (p.includes("architect") || p.includes("design pattern") || p.includes("structure") || p.includes("clean code")) {
    category = "architecture";
    tags.push("architecture", "patterns", "structure");
  } else if (p.includes("mongo") || p.includes("redis") || p.includes("sql") || p.includes("postgres") || p.includes("database") || p.includes("mongoose")) {
    category = "database";
    tags.push("database", "mongodb", "cache");
  } else if (p.includes("ci/cd") || p.includes("github actions") || p.includes("workflow") || p.includes("devops")) {
    category = "devops";
    tags.push("devops", "pipeline");
  }

  if (tags.length === 0) {
    tags.push("reference", "docs");
  }

  return { category, suggestedTags: [...new Set(tags)] };
}

// AI categorization and tag suggestions
async function suggestAiMetadata(title, description, extraText = "") {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    return suggestOfflineMetadata(title, description, extraText);
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const promptText = `
Analyze this developer resource:
Title: ${title}
Description: ${description}
Extra Context: ${extraText}

Classify it into EXACTLY ONE of the following engineering categories:
"backend", "auth", "deployment", "security", "realtime", "performance", "ui-inspiration", "ai", "bug-fix", "architecture", "database", "devops", "other"

Also suggest 3-5 highly relevant tech tags (e.g. "jwt", "react", "mongodb", "socket-io", "docker", "tailwindcss").

Return ONLY a raw JSON object with the following fields (no backticks, no markdown):
{
  "category": "...",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}
`;

    const response = await model.generateContent(promptText);
    const rawText = await response.response.text();
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    if (parsed.category && Array.isArray(parsed.suggestedTags)) {
      return {
        category: parsed.category.toLowerCase(),
        suggestedTags: parsed.suggestedTags.map((t) => t.toLowerCase()),
      };
    }
    return suggestOfflineMetadata(title, description, extraText);
  } catch (err) {
    console.error("[AiResourceTagging] Gemini failed:", err.message);
    return suggestOfflineMetadata(title, description, extraText);
  }
}

// Instant metadata extraction endpoint
export const extractUrlMetadata = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    const domain = new URL(targetUrl).hostname.replace("www.", "");
    let meta = {
      title: domain,
      description: `Resource references for ${domain}`,
      previewImage: "",
      favicon: `https://www.google.com/s2/favicons?sz=64&domain=${domain}`,
      domain,
      type: "url",
    };

    try {
      const response = await axios.get(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        },
        timeout: 3000,
      });

      const html = response.data;
      const getMeta = (property) => {
        const regex = new RegExp(`<meta[^>]*property=["'](?:og:${property}|${property})["'][^>]*content=["']([^"']*)["']`, "i");
        const match = html.match(regex);
        if (match) return match[1];

        const nameRegex = new RegExp(`<meta[^>]*name=["'](?:og:${property}|${property})["'][^>]*content=["']([^"']*)["']`, "i");
        const nameMatch = html.match(nameRegex);
        return nameMatch ? nameMatch[1] : "";
      };

      let title = getMeta("title");
      if (!title) {
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        title = titleMatch ? titleMatch[1] : "";
      }

      let description = getMeta("description");
      let image = getMeta("image");

      let favicon = "";
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i);
      if (faviconMatch) {
        favicon = faviconMatch[1];
        if (favicon && !favicon.startsWith("http")) {
          const urlObj = new URL(targetUrl);
          favicon = `${urlObj.protocol}//${urlObj.host}${favicon.startsWith("/") ? "" : "/"}${favicon}`;
        }
      } else {
        favicon = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
      }

      let type = "url";
      if (domain.includes("github.com")) type = "github";
      else if (domain.includes("youtube.com") || domain.includes("youtu.be")) type = "youtube";
      else if (domain.includes("twitter.com") || domain.includes("x.com")) type = "tweet";
      else if (domain.includes("stackoverflow.com")) type = "bug-fix";

      meta = {
        title: title.trim() || domain,
        description: description.trim() || `Reference link to ${domain}`,
        previewImage: image || "",
        favicon: favicon,
        domain,
        type,
      };
    } catch (_) {
      // Soft ignore, fall back to default meta
    }

    // Call AI tag/category suggestion based on parsed metadata
    const aiTags = await suggestAiMetadata(meta.title, meta.description, meta.domain);

    res.status(200).json({
      success: true,
      metadata: {
        ...meta,
        ...aiTags,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Create a new Resource
export const createResource = async (req, res, next) => {
  try {
    const {
      title,
      description,
      url,
      type,
      favicon,
      previewImage,
      domain,
      codeSnippet,
      aiPrompt,
      category,
      tags,
      suggestedTags,
      workspaceId,
      projectId,
      taskId,
      isPrivate,
      publishToFeed,
    } = req.body;

    if (!title || !workspaceId) {
      return res.status(400).json({ success: false, message: "Title and Workspace ID are required" });
    }

    // AI suggestions if category/tags are not supplied
    let finalCategory = category || "other";
    let finalSuggested = suggestedTags || [];
    if (!category || !tags?.length) {
      const aiMeta = await suggestAiMetadata(title, description || "", `${domain} ${type} ${codeSnippet || ""} ${aiPrompt || ""}`);
      if (!category) finalCategory = aiMeta.category;
      if (!suggestedTags?.length) finalSuggested = aiMeta.suggestedTags;
    }

    const resource = await Resource.create({
      title,
      description: description || "",
      url: url || "",
      type: type || "url",
      favicon: favicon || "",
      previewImage: previewImage || "",
      domain: domain || "",
      codeSnippet: codeSnippet || "",
      aiPrompt: aiPrompt || "",
      category: finalCategory,
      tags: tags || [],
      suggestedTags: finalSuggested,
      workspace: workspaceId,
      project: projectId || null,
      tasks: taskId ? [taskId] : [],
      createdBy: req.user._id,
      isPrivate: !!isPrivate,
    });

    const populated = await Resource.findById(resource._id)
      .populate("createdBy", "name email avatar")
      .populate("tasks", "title status")
      .lean();

    // Link resource directly to task if taskId is provided
    if (taskId) {
      await Task.findByIdAndUpdate(taskId, { $addToSet: { resources: resource._id } });
    }

    // Realtime Socket broadcast
    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("resource:created", populated);
    }

    try {
      await logPulseEvent({
        workspaceId,
        actorId: req.user?._id,
        actorName: req.user?.name,
        type: "resource_shared",
        content: `${req.user?.name} shared a resource: "${populated.title}"`,
        importance: "medium",
        metadata: {
          resourceId: populated._id,
          resourceTitle: populated.title,
          projectId: populated.project,
        },
        io,
      });
    } catch (pulseErr) {
      console.error("[ResourcePulse] Event logging failed:", pulseErr.message);
    }

    // If published to workspace feed, create a structured persistent chat message announcement
    if (publishToFeed && !isPrivate) {
      let icon = "🔗";
      if (type === "github") icon = "💻";
      else if (type === "docs") icon = "📚";
      else if (type === "code-snippet") icon = "💻 Code Snippet";
      else if (type === "ai-prompt") icon = "🤖 AI Prompt";
      else if (type === "bug-fix") icon = "🐛 Fix";

      const textMessage = `${icon} ${req.user.name} shared a resource in the Hub: **"${title}"** [${finalCategory}]${url ? ` - ${url}` : ""}`;

      try {
        const msg = await Message.create({
          project: projectId || null,
          workspace: workspaceId,
          text: textMessage,
          isSystem: true,
        });

        if (io) {
          if (projectId) io.to(projectId).emit("receive-message", msg);
          io.to(`workspace:${workspaceId}`).emit("workspace:feed-item", {
            type: "resource",
            resource: populated,
            message: msg,
            actorName: req.user.name,
          });
        }
      } catch (_) {}
    }

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// Fetch workspace resources
export const getResources = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { category, tag, type, query, projectId, taskId, isPrivate, page = 1, limit = 20 } = req.query;

    const filter = { workspace: workspaceId };

    // Private vs public toggle
    if (isPrivate === "true") {
      filter.createdBy = req.user._id;
      filter.isPrivate = true;
    } else {
      filter.$or = [
        { isPrivate: false },
        { isPrivate: true, createdBy: req.user._id }
      ];
    }

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (projectId) filter.project = projectId;
    if (taskId) filter.tasks = taskId;

    if (tag) {
      filter.tags = tag;
    }

    // Fuzzy search
    if (query?.trim()) {
      filter.$text = { $search: query };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate("createdBy", "name email avatar")
        .populate("tasks", "title status")
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Resource.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      resources,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (err) {
    next(err);
  }
};

// Update Resource Details
export const updateResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });

    // Authorization check
    if (resource.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updated = await Resource.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email avatar")
      .populate("tasks", "title status");

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${resource.workspace}`).emit("resource:updated", updated);
    }

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// Delete Resource
export const deleteResource = async (req, res, next) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });

    if (resource.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Pull from task collections
    if (resource.tasks?.length > 0) {
      await Task.updateMany({ _id: { $in: resource.tasks } }, { $pull: { resources: id } });
    }

    await Resource.findByIdAndDelete(id);

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${resource.workspace}`).emit("resource:deleted", id);
    }

    res.status(200).json({ success: true, message: "Resource deleted" });
  } catch (err) {
    next(err);
  }
};

// Toggle Resource Like
export const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });

    const liked = resource.likes.includes(userId);
    if (liked) {
      resource.likes = resource.likes.filter((uid) => uid.toString() !== userId.toString());
    } else {
      resource.likes.push(userId);
    }

    await resource.save();

    const populated = await Resource.findById(id)
      .populate("createdBy", "name email avatar")
      .populate("tasks", "title status")
      .lean();

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${resource.workspace}`).emit("resource:updated", populated);
    }

    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

// Add Comment to Resource
export const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text, commentType = "note", solvedIndicator = false } = req.body;

    if (!text?.trim()) return res.status(400).json({ success: false, message: "Comment text is required" });

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });

    resource.comments.push({
      user: req.user._id,
      userName: req.user.name,
      text: text.trim(),
      type: commentType,
      solvedIndicator: !!solvedIndicator,
    });

    // Populate Persistent Engineering Context Memory
    if (solvedIndicator) {
      resource.usageMetadata.push({
        text: `Helped resolve blocker: "${text.trim().slice(0, 40)}${text.trim().length > 40 ? "..." : ""}"`,
        contextType: "fix",
      });
    } else if (commentType === "caveat" || commentType === "warning") {
      resource.usageMetadata.push({
        text: `Technical caveat flagged by ${req.user.name}`,
        contextType: "other",
      });
    }

    await resource.save();

    const populated = await Resource.findById(id)
      .populate("createdBy", "name email avatar")
      .populate("tasks", "title status")
      .lean();

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${resource.workspace}`).emit("resource:updated", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

// Link resource to a Task
export const attachToTask = async (req, res, next) => {
  try {
    const { id } = req.params; // resourceId
    const { taskId, action } = req.body; // 'attach' or 'detach'

    if (!taskId) return res.status(400).json({ success: false, message: "Task ID is required" });

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });

    if (action === "detach") {
      resource.tasks = (resource.tasks || []).filter((tid) => tid.toString() !== taskId.toString());
      await Task.findByIdAndUpdate(taskId, { $pull: { resources: id } });
    } else {
      if (!resource.tasks.includes(taskId)) {
        resource.tasks.push(taskId);
        await Task.findByIdAndUpdate(taskId, { $addToSet: { resources: id } });
      }
    }

    await resource.save();

    const populated = await Resource.findById(id)
      .populate("createdBy", "name email avatar")
      .populate("tasks", "title status")
      .lean();

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${resource.workspace}`).emit("resource:updated", populated);
      io.to(`task:${taskId}`).emit("task:resources-updated");
    }

    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

// AI Recommendation Engine
export const getAiRecommendations = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { taskTitle, milestone, techStack } = req.query;

    const recentFeedback = await AiFeedback.find({ workspace: workspaceId })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      // Offline fallback recommendation list
      return res.status(200).json({
        success: true,
        isFallback: true,
        recommendations: [
          {
            title: "JWT Authentication Best Practices & Scaling",
            description: "A complete developer's guide to security tokens, refresh flows, and scaling user authentication robustly.",
            url: "https://jwt.io/introduction",
            category: "auth",
            tags: ["jwt", "auth", "security"],
            domain: "jwt.io",
            type: "docs",
          },
          {
            title: "Socket.IO Scaleout with Redis Adapters",
            description: "Practical guide to scaling realtime WebSockets horizontally using Redis pub/sub streams.",
            url: "https://socket.io/docs/v4/redis-adapter/",
            category: "realtime",
            tags: ["socket-io", "realtime", "redis"],
            domain: "socket.io",
            type: "docs",
          },
          {
            title: "Vite + React Production Bundle Optimization",
            description: "Step-by-step documentation on minimizing asset payloads, code-splitting chunks, and reducing bundle footprint.",
            url: "https://vitejs.dev/guide/build.html",
            category: "performance",
            tags: ["react", "vite", "performance"],
            domain: "vitejs.dev",
            type: "docs",
          }
        ],
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Fetch some saved resources as training knowledge
    const saved = await Resource.find({ workspace: workspaceId, isPrivate: false })
      .select("title description category tags url type")
      .limit(10)
      .lean();

    const promptText = `
You are the Collabrix AI Senior Engineering Lead. Recommend 3 highly useful technical reference resources (tutorials, articles, repos, docs) specifically relevant to the current engineering context:
Task/Sprint Context: "${taskTitle || "General collaborative coding"}"
Milestone Context: "${milestone || "General dev cycle"}"
Tech Stack: "${techStack || "React, Node, Express, MongoDB, Socket.io"}"

Reference of already saved team resources:
${JSON.stringify(saved)}

Learning loops feedback logs (user actions on past recommendations):
${JSON.stringify(recentFeedback)}

IMPORTANT AI REASONING RULE:
- Avoid recommending things that were marked as "ignored" in the feedback logs.
- Prioritize and suggest similar items to those that were "saved" or "attached" to tasks.
- If they "resolved" an issue, suggest advanced follow-ups or deployment checklists.

Generate exactly 3 resources that would help this team solve problems faster. Be realistic and practical. Return ONLY a raw JSON array of objects (no markdown, no backticks):
[
  {
    "title": "...",
    "description": "...",
    "url": "...",
    "category": "backend|auth|deployment|security|realtime|performance|ui-inspiration|ai|bug-fix|architecture|database|devops",
    "tags": ["...", "..."],
    "domain": "...",
    "type": "docs|github|youtube|article"
  }
]
`;

    const response = await model.generateContent(promptText);
    const rawText = await response.response.text();
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json({
      success: true,
      isFallback: false,
      recommendations: parsed,
    });
  } catch (err) {
    console.error("[AiRecommendations] failed:", err.message);
    res.status(200).json({
      success: true,
      isFallback: true,
      recommendations: [
        {
          title: "JWT Refresh Tokens System Design",
          description: "Understanding refresh token rotation and token blacklist management in high-throughput node applications.",
          url: "https://auth0.com/blog/refresh-tokens-what-are-they-and-how-to-use-them/",
          category: "auth",
          tags: ["jwt", "auth", "security"],
          domain: "auth0.com",
          type: "article",
        }
      ],
    });
  }
};

// Track AI Recommendation Feedback Loop
export const trackFeedback = async (req, res, next) => {
  try {
    const { workspaceId, resourceTitle, resourceDomain, action, context } = req.body;
    if (!workspaceId || !resourceTitle || !action) {
      return res.status(400).json({ success: false, message: "Missing required tracking attributes" });
    }

    const feedback = await AiFeedback.create({
      user: req.user._id,
      workspace: workspaceId,
      resourceTitle,
      resourceDomain,
      action,
      context: context || {},
    });

    res.status(200).json({ success: true, feedback });
  } catch (err) {
    next(err);
  }
};

// Track resource views and emit presence to workspace
export const trackView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ success: false, message: "Resource not found" });

    // Track viewed list
    if (!resource.viewedBy.includes(userId)) {
      resource.viewedBy.push(userId);
    }
    resource.views = (resource.views || 0) + 1;
    await resource.save();

    const populated = await Resource.findById(id)
      .populate("createdBy", "name email avatar")
      .populate("tasks", "title status")
      .lean();

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${resource.workspace}`).emit("resource:viewed", {
        resourceId: id,
        userId,
        userName: req.user.name,
        views: populated.views,
      });
    }

    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

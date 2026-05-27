import { GoogleGenerativeAI } from "@google/generative-ai";
import Collection from "../models/Collection.js";
import Resource from "../models/Resource.js";

/**
 * Scaffolds an engineering playbook collection. Optionally invokes Gemini to generate
 * a structured playbook overview based on resources inside it.
 */
export const createCollection = async (req, res, next) => {
  try {
    const { name, description, workspaceId, resourceIds, sprintLink } = req.body;

    if (!name?.trim() || !workspaceId) {
      return res.status(400).json({ success: false, message: "Name and Workspace ID are required" });
    }

    let aiSummary = "";
    
    // Auto-generate Playbook Guide if resources are included
    if (resourceIds?.length > 0 && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      try {
        const resourcesText = await Resource.find({ _id: { $in: resourceIds } })
          .select("title description url")
          .lean();

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const promptText = `
You are the Collabrix AI Senior System Architect. Review this set of team-saved developer references for a curated engineering pack named "${name}":
${JSON.stringify(resourcesText)}

Generate a highly useful, technical "Playbook Guide" (2-3 paragraphs) that explains:
- How this stack/pattern fits together.
- Important implementation gotchas, scaling caveats, or deploy guidelines for these tools.
- A recommended sequence of reading/using these links.

Keep the tone developer-first, clear, serious, and practical. Return ONLY the playbook text.
`;
        const response = await model.generateContent(promptText);
        aiSummary = await response.response.text();
      } catch (gemErr) {
        console.warn("[CollectionPlaybook] AI Generation failed:", gemErr.message);
      }
    }

    const collection = await Collection.create({
      name: name.trim(),
      description: description?.trim() || "",
      workspace: workspaceId,
      resources: resourceIds || [],
      createdBy: req.user._id,
      aiSummary,
      sprintLink: sprintLink || "",
    });

    const populated = await Collection.findById(collection._id)
      .populate("resources")
      .populate("createdBy", "name email")
      .lean();

    // Broadcast to workspace
    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("collection:created", populated);
    }

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const getCollections = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const collections = await Collection.find({ workspace: workspaceId })
      .populate("resources")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(collections);
  } catch (err) {
    next(err);
  }
};

export const toggleFollowCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const col = await Collection.findById(id);
    if (!col) return res.status(404).json({ success: false, message: "Collection not found" });

    const following = col.followers.includes(userId);
    if (following) {
      col.followers = col.followers.filter((uid) => uid.toString() !== userId.toString());
    } else {
      col.followers.push(userId);
    }

    await col.save();

    const populated = await Collection.findById(id).populate("resources").lean();
    res.status(200).json(populated);
  } catch (err) {
    next(err);
  }
};

export const updateCollectionOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resources } = req.body; // array of ObjectIds

    const col = await Collection.findByIdAndUpdate(
      id,
      { $set: { resources } },
      { new: true }
    ).populate("resources");

    if (!col) return res.status(404).json({ success: false, message: "Collection not found" });

    res.status(200).json(col);
  } catch (err) {
    next(err);
  }
};

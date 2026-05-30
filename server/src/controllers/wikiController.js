import Wiki from "../models/Wiki.js";
import WikiVersion from "../models/WikiVersion.js";
import PulseEvent from "../models/PulseEvent.js";

// Helper for Pulse Event
const createPulseEvent = async (type, title, description, workspaceId, userId, metadata = {}) => {
  try {
    await PulseEvent.create({
      type,
      title,
      description,
      workspace: workspaceId,
      user: userId,
      metadata,
    });
  } catch (err) {
    console.error("Error creating pulse event:", err);
  }
};

const generateSlug = (title) => {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
};

export const createWiki = async (req, res) => {
  try {
    const { workspaceId, title, content, summary, category, tags, status, linkedProjects, linkedTasks, linkedResources, linkedDiscussions, linkedSnippets } = req.body;

    const wiki = new Wiki({
      title,
      slug: generateSlug(title),
      content,
      summary,
      category,
      tags,
      status: status || "Published",
      workspace: workspaceId,
      author: req.user._id,
      lastEditedBy: req.user._id,
      linkedProjects: linkedProjects || [],
      linkedTasks: linkedTasks || [],
      linkedResources: linkedResources || [],
      linkedDiscussions: linkedDiscussions || [],
      linkedSnippets: linkedSnippets || [],
    });

    await wiki.save();

    await WikiVersion.create({
      wikiId: wiki._id,
      versionNumber: wiki.version,
      contentSnapshot: wiki.content,
      editedBy: req.user._id,
      changeSummary: "Initial creation",
    });

    await createPulseEvent("wiki_created", "Wiki Document Created", `Created "${wiki.title}"`, workspaceId, req.user._id, { wikiId: wiki._id });

    res.status(201).json({ success: true, wiki });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWorkspaceWikis = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const wikis = await Wiki.find({ workspace: workspaceId })
      .populate("author", "name avatar")
      .populate("lastEditedBy", "name avatar")
      .sort("-updatedAt");
    res.status(200).json({ success: true, wikis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWikiById = async (req, res) => {
  try {
    const wiki = await Wiki.findById(req.params.wikiId)
      .populate("author", "name avatar")
      .populate("lastEditedBy", "name avatar")
      .populate("contributors", "name avatar")
      .populate("linkedProjects", "name status")
      .populate("linkedTasks", "title status")
      .populate("linkedResources", "title type url")
      .populate("linkedDiscussions", "title status")
      .populate("linkedSnippets", "title language");

    if (!wiki) return res.status(404).json({ success: false, message: "Wiki not found" });

    // Increment views
    wiki.views += 1;
    await wiki.save();

    await createPulseEvent("wiki_viewed", "Wiki Document Viewed", `Viewed "${wiki.title}"`, wiki.workspace, req.user._id, { wikiId: wiki._id });

    res.status(200).json({ success: true, wiki });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateWiki = async (req, res) => {
  try {
    const { title, content, summary, category, tags, status, linkedProjects, linkedTasks, linkedResources, linkedDiscussions, linkedSnippets, changeSummary } = req.body;
    
    const wiki = await Wiki.findById(req.params.wikiId);
    if (!wiki) return res.status(404).json({ success: false, message: "Wiki not found" });

    let contentChanged = wiki.content !== content;

    wiki.title = title || wiki.title;
    if (content !== undefined) wiki.content = content;
    if (summary !== undefined) wiki.summary = summary;
    if (category !== undefined) wiki.category = category;
    if (tags !== undefined) wiki.tags = tags;
    if (status !== undefined) wiki.status = status;
    
    if (linkedProjects) wiki.linkedProjects = linkedProjects;
    if (linkedTasks) wiki.linkedTasks = linkedTasks;
    if (linkedResources) wiki.linkedResources = linkedResources;
    if (linkedDiscussions) wiki.linkedDiscussions = linkedDiscussions;
    if (linkedSnippets) wiki.linkedSnippets = linkedSnippets;

    wiki.lastEditedBy = req.user._id;

    if (!wiki.contributors.includes(req.user._id) && req.user._id.toString() !== wiki.author.toString()) {
      wiki.contributors.push(req.user._id);
    }

    if (contentChanged) {
      wiki.version += 1;
      await WikiVersion.create({
        wikiId: wiki._id,
        versionNumber: wiki.version,
        contentSnapshot: wiki.content,
        editedBy: req.user._id,
        changeSummary: changeSummary || "Updated content",
      });
    }

    await wiki.save();

    await createPulseEvent("wiki_updated", "Wiki Document Updated", `Updated "${wiki.title}"`, wiki.workspace, req.user._id, { wikiId: wiki._id });

    const updatedWiki = await Wiki.findById(wiki._id)
      .populate("author", "name avatar")
      .populate("lastEditedBy", "name avatar")
      .populate("contributors", "name avatar")
      .populate("linkedProjects", "name status")
      .populate("linkedTasks", "title status")
      .populate("linkedResources", "title type url")
      .populate("linkedDiscussions", "title status")
      .populate("linkedSnippets", "title language");

    res.status(200).json({ success: true, wiki: updatedWiki });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteWiki = async (req, res) => {
  try {
    const wiki = await Wiki.findByIdAndDelete(req.params.wikiId);
    if (!wiki) return res.status(404).json({ success: false, message: "Wiki not found" });
    
    await WikiVersion.deleteMany({ wikiId: wiki._id });
    
    res.status(200).json({ success: true, message: "Wiki deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const archiveWiki = async (req, res) => {
  try {
    const wiki = await Wiki.findById(req.params.wikiId);
    if (!wiki) return res.status(404).json({ success: false, message: "Wiki not found" });
    
    wiki.isArchived = true;
    wiki.status = "Archived";
    await wiki.save();

    await createPulseEvent("wiki_archived", "Wiki Document Archived", `Archived "${wiki.title}"`, wiki.workspace, req.user._id, { wikiId: wiki._id });
    
    res.status(200).json({ success: true, wiki });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const restoreWiki = async (req, res) => {
  try {
    const wiki = await Wiki.findById(req.params.wikiId);
    if (!wiki) return res.status(404).json({ success: false, message: "Wiki not found" });
    
    wiki.isArchived = false;
    wiki.status = "Published";
    await wiki.save();

    await createPulseEvent("wiki_restored", "Wiki Document Restored", `Restored "${wiki.title}"`, wiki.workspace, req.user._id, { wikiId: wiki._id });
    
    res.status(200).json({ success: true, wiki });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWikiVersions = async (req, res) => {
  try {
    const versions = await WikiVersion.find({ wikiId: req.params.wikiId })
      .populate("editedBy", "name avatar")
      .sort("-versionNumber");
    res.status(200).json({ success: true, versions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const restoreWikiVersion = async (req, res) => {
  try {
    const { versionNumber } = req.body;
    const wiki = await Wiki.findById(req.params.wikiId);
    if (!wiki) return res.status(404).json({ success: false, message: "Wiki not found" });

    const targetVersion = await WikiVersion.findOne({ wikiId: wiki._id, versionNumber });
    if (!targetVersion) return res.status(404).json({ success: false, message: "Version not found" });

    wiki.content = targetVersion.contentSnapshot;
    wiki.version += 1;
    wiki.lastEditedBy = req.user._id;
    
    if (!wiki.contributors.includes(req.user._id) && req.user._id.toString() !== wiki.author.toString()) {
      wiki.contributors.push(req.user._id);
    }

    await WikiVersion.create({
      wikiId: wiki._id,
      versionNumber: wiki.version,
      contentSnapshot: wiki.content,
      editedBy: req.user._id,
      changeSummary: `Restored to version ${versionNumber}`,
    });

    await wiki.save();

    res.status(200).json({ success: true, wiki });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const duplicateWiki = async (req, res) => {
  try {
    const originalWiki = await Wiki.findById(req.params.wikiId);
    if (!originalWiki) return res.status(404).json({ success: false, message: "Wiki not found" });

    const newTitle = `${originalWiki.title} (Copy)`;
    
    const wiki = new Wiki({
      title: newTitle,
      slug: generateSlug(newTitle),
      content: originalWiki.content,
      summary: originalWiki.summary,
      category: originalWiki.category,
      tags: originalWiki.tags,
      status: "Draft",
      workspace: originalWiki.workspace,
      author: req.user._id,
      lastEditedBy: req.user._id,
    });

    await wiki.save();

    await WikiVersion.create({
      wikiId: wiki._id,
      versionNumber: wiki.version,
      contentSnapshot: wiki.content,
      editedBy: req.user._id,
      changeSummary: "Duplicated document",
    });

    await createPulseEvent("wiki_created", "Wiki Document Duplicated", `Duplicated "${originalWiki.title}"`, wiki.workspace, req.user._id, { wikiId: wiki._id });

    res.status(201).json({ success: true, wiki });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

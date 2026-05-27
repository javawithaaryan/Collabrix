import Message from "../models/Message.js";

export const sendMessage = async (req, res, next) => {
  try {
    const { project, text, isSystem } = req.body;

    if (!project || !text?.trim()) {
      return res.status(400).json({ success: false, message: "Project and text are required" });
    }

    const message = await Message.create({
      project,
      sender: isSystem ? null : req.user._id,
      text: text.trim(),
      isSystem: !!isSystem,
      reactions: [],
    });

    const populated = await Message.findById(message._id)
      .populate("sender", "name email")
      .populate("reactions.users", "name email");

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const messages = await Message.find({ project: projectId })
      .populate("sender", "name email")
      .populate("reactions.users", "name email")
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (err) {
    next(err);
  }
};

export const toggleReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ success: false, message: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (!message.reactions) {
      message.reactions = [];
    }

    const reactionIndex = message.reactions.findIndex((r) => r.emoji === emoji);

    if (reactionIndex > -1) {
      const usersList = message.reactions[reactionIndex].users;
      const userIndex = usersList.indexOf(userId);

      if (userIndex > -1) {
        // Remove reaction
        usersList.splice(userIndex, 1);
        if (usersList.length === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        // Add user to reaction
        usersList.push(userId);
      }
    } else {
      // Create new reaction emoji group
      message.reactions.push({
        emoji,
        users: [userId],
      });
    }

    await message.save();

    const updated = await Message.findById(messageId)
      .populate("sender", "name email")
      .populate("reactions.users", "name email");

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};
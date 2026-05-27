import PulseEvent from "../models/PulseEvent.js";
import Message from "../models/Message.js";
import Task from "../models/Task.js";

/**
 * Log a high-fidelity Pulse event to the timeline
 */
export const logPulseEvent = async ({
  workspaceId,
  actorId,
  actorName,
  type,
  content,
  importance = "medium",
  metadata = {},
  io,
}) => {
  try {
    const actorNameVal = actorName || "System";
    
    // Naming translation into rich human engineering narrative
    let translatedContent = content;
    if (type === "task_moved" && metadata.taskTitle && metadata.columnName) {
      const actorStr = actorNameVal;
      const statusMap = {
        todo: "slated for implementation",
        "in progress": "started implementation on",
        review: "submitted code review for",
        done: "completed and verified",
      };
      const statusText = statusMap[metadata.columnName.toLowerCase()] || "updated";
      translatedContent = `${actorStr} ${statusText} "${metadata.taskTitle}"`;
    } else if (type === "resource_shared" && metadata.resourceTitle) {
      translatedContent = `${actorNameVal} shared engineering reference: "${metadata.resourceTitle}"`;
    } else if (type === "sprint_generated" && metadata.projectType) {
      translatedContent = `${actorNameVal} generated AI Sprint roadmap for "${metadata.projectType}"`;
    }

    // 10 minute grouping window for similar minor updates
    const groupingWindowMs = 10 * 60 * 1000;
    const groupingKey = actorId ? `${workspaceId}:${actorId}:${type}` : "";

    if (groupingKey && type === "task_moved") {
      const recentEvent = await PulseEvent.findOne({
        workspace: workspaceId,
        groupingKey,
        createdAt: { $gte: new Date(Date.now() - groupingWindowMs) },
      });

      if (recentEvent) {
        recentEvent.metadata.count = (recentEvent.metadata.count || 1) + 1;
        if (metadata.taskTitle && !recentEvent.metadata.updates.includes(metadata.taskTitle)) {
          recentEvent.metadata.updates.push(metadata.taskTitle);
        }
        
        recentEvent.content = `${actorNameVal} reorganized project boards (${recentEvent.metadata.count} task updates)`;
        await recentEvent.save();

        if (io) {
          io.to(`workspace:${workspaceId}`).emit("pulse:updated", recentEvent);
        }
        return recentEvent;
      }
    }

    // Create new event
    const newEvent = await PulseEvent.create({
      workspace: workspaceId,
      actor: actorId || null,
      actorName: actorNameVal,
      type,
      content: translatedContent,
      importance,
      groupingKey,
      metadata: {
        ...metadata,
        count: 1,
        updates: metadata.taskTitle ? [metadata.taskTitle] : [],
      },
    });

    if (io) {
      io.to(`workspace:${workspaceId}`).emit("pulse:new", newEvent);
    }

    // Dynamic Milestone moments tracker
    await checkWorkspaceMilestones(workspaceId, io);

    return newEvent;
  } catch (err) {
    console.error("[pulseService] failed to log event:", err.message);
    return null;
  }
};

/**
 * Scan workspace records to detect "Milestone Moments" and publish them to Pulse
 */
async function checkWorkspaceMilestones(workspaceId, io) {
  try {
    const pulseCount = await PulseEvent.countDocuments({ workspace: workspaceId });
    
    // 1st deploy completed or first milestone moments
    const hasMilestone = await PulseEvent.findOne({
      workspace: workspaceId,
      type: "milestone_reached",
    });

    if (!hasMilestone && pulseCount > 5) {
      // Create first workspace milestone
      const milestone = await PulseEvent.create({
        workspace: workspaceId,
        type: "milestone_reached",
        content: "🎉 Workspace Genesis: The engineering timeline is officially active!",
        importance: "high",
      });

      if (io) io.to(`workspace:${workspaceId}`).emit("pulse:new", milestone);
    }
  } catch (err) {
    console.error("[pulseService] milestone check failure:", err.message);
  }
}

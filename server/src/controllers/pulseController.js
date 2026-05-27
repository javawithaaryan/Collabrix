import { GoogleGenerativeAI } from "@google/generative-ai";
import PulseEvent from "../models/PulseEvent.js";

/**
 * Fetch workspace timeline events
 */
export const getWorkspacePulse = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      PulseEvent.find({ workspace: workspaceId })
        .populate("actor", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      PulseEvent.countDocuments({ workspace: workspaceId }),
    ]);

    // Construct lightweight Temporal Intelligence layers
    const activityToday = await PulseEvent.countDocuments({
      workspace: workspaceId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const activeSprintEvents = await PulseEvent.countDocuments({
      workspace: workspaceId,
      type: "sprint_generated",
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    let temporalInsight = "Standard workspace activities logged.";
    if (activityToday > 10) {
      temporalInsight = `Heavy engineering activity today (${activityToday} updates in the last 24h).`;
    } else if (activeSprintEvents > 0) {
      temporalInsight = "Active sprint roadmap initialized and structured recently.";
    }

    res.status(200).json({
      success: true,
      events,
      total,
      temporalInsight,
      activityToday,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate AI-powered workspace atmosphere metrics & collaboration summaries
 */
export const getPulseSummary = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
      return res.status(200).json({
        success: true,
        isFallback: true,
        summary: {
          focus: "Core backend architecture and API routes",
          blockers: "No critical blockers currently reported in comments",
          trends: "Increased workspace resource shares and task updates",
          atmosphere: "Steady progress. Teammates are highly aligned on milestone tasks.",
        },
      });
    }

    const events = await PulseEvent.find({ workspace: workspaceId })
      .select("content type createdAt actorName")
      .limit(30)
      .lean();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const promptText = `
You are the Collabrix AI Engineering Lead analyzing workspace timeline logs. Analyze these recent workspace event logs:
${JSON.stringify(events)}

Provide a structured, highly intelligent summary of:
1. Active sprint focus (What are developers working on right now?)
2. Workspace blockers (Any mentions of bugs, scaling issues, socket reconnect issues?)
3. Collaboration trends (Who is working together on what?)
4. Overall workspace atmosphere

Return ONLY a raw JSON object (no markdown, no backticks, no code block formatting) in this format:
{
  "focus": "...",
  "blockers": "...",
  "trends": "...",
  "atmosphere": "..."
}
`;

    const response = await model.generateContent(promptText);
    const rawText = await response.response.text();
    const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.status(200).json({
      success: true,
      isFallback: false,
      summary: parsed,
    });
  } catch (err) {
    console.error("[pulseSummary] Gemini failed:", err.message);
    res.status(200).json({
      success: true,
      isFallback: true,
      summary: {
        focus: "Engineering milestones in progress",
        blockers: "Review of recent socket communication bugs requested",
        trends: "Multiplayer activity is steadily climbing",
        atmosphere: "A focused development cycle with steady feature progress.",
      },
    });
  }
};

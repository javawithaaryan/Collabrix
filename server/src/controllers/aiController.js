import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_RETRIES = 2;
const TIMEOUT_MS = 10000;

// Light keyword-based fallback so the app still feels useful when AI is down.
// Not generic — uses the prompt to customize task titles.
function buildFallbackTasks(prompt) {
  const p = prompt.toLowerCase();

  const tasks = [];

  if (p.includes("frontend") || p.includes("ui") || p.includes("dashboard")) {
    tasks.push(
      { title: "Set up frontend project structure", description: "Initialize component folders, routing, and global styles." },
      { title: "Build core UI components", description: "Create reusable buttons, inputs, modals, and layout components." },
      { title: "Integrate API calls into UI", description: "Connect frontend views to backend endpoints with proper loading/error states." }
    );
  }

  if (p.includes("backend") || p.includes("api") || p.includes("server")) {
    tasks.push(
      { title: "Design REST API routes", description: "Define endpoint structure and HTTP methods for core resources." },
      { title: "Implement controller logic", description: "Write request handlers with input validation and error handling." },
      { title: "Add database models", description: "Define schemas and relationships for the application data." }
    );
  }

  if (p.includes("auth") || p.includes("login") || p.includes("register")) {
    tasks.push(
      { title: "Implement user registration", description: "Handle email/password signup with hashing and validation." },
      { title: "Implement login with JWT", description: "Issue signed tokens on successful authentication." },
      { title: "Add protected route middleware", description: "Verify tokens on all routes that require authentication." }
    );
  }

  if (p.includes("realtime") || p.includes("socket") || p.includes("chat") || p.includes("live")) {
    tasks.push(
      { title: "Set up Socket.IO server", description: "Initialize socket server with CORS and connection handling." },
      { title: "Create room-based event system", description: "Allow users to join rooms and broadcast events to room members." },
      { title: "Build realtime chat UI", description: "Display live messages with sender info and timestamps." }
    );
  }

  if (p.includes("database") || p.includes("mongo") || p.includes("db")) {
    tasks.push(
      { title: "Configure database connection", description: "Set up connection pooling and handle reconnect failures." },
      { title: "Define data schemas", description: "Create Mongoose models with proper validation and indexes." }
    );
  }

  // If nothing matched, fall back to generic but reference the prompt
  if (tasks.length === 0) {
    tasks.push(
      { title: `Plan project scope for: ${prompt.slice(0, 60)}`, description: "Break down requirements into actionable development tasks." },
      { title: "Set up development environment", description: "Configure local tooling, environment variables, and dependencies." },
      { title: "Define core data models", description: "Identify entities and relationships needed for the project." },
      { title: "Build initial API structure", description: "Scaffold route and controller files for core features." },
      { title: "Write basic tests", description: "Add unit tests for critical business logic paths." }
    );
  }

  return tasks;
}

// Strips markdown fences and extra whitespace that Gemini sometimes wraps around JSON.
function sanitizeResponse(text) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

// Returns true if the error is a transient failure worth retrying.
function isRetryable(error) {
  const msg = error.message || "";
  // Don't retry quota errors — they won't resolve on retry.
  if (msg.includes("429") || msg.includes("quota") || msg.includes("Quota")) return false;
  return true;
}

// Wraps the Gemini API call in a timeout race.
async function callGeminiWithTimeout(model, promptText) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Gemini request timed out")), TIMEOUT_MS)
  );

  const request = model.generateContent(promptText);

  return Promise.race([request, timeout]);
}

export const generateTasks = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      message: "Prompt is required",
    });
  }

  // Gracefully handle missing or unconfigured API keys (startup MVP safety)
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.warn("AI task generation called but GEMINI_API_KEY is not configured. Using fallback engine.");
    return res.status(200).json({
      success: true,
      isFallback: true,
      fallbackReason: "AI API key not configured",
      result: buildFallbackTasks(prompt),
    });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const promptText = `
Generate software development tasks for the following project description:

${prompt}

Return ONLY a raw JSON array. No markdown. No backticks. No extra text.

Each item must have exactly these fields:
- "title": short task name (string)
- "description": one sentence explaining the task (string)

Example format:
[
  { "title": "Set up project", "description": "Initialize the repository and install dependencies." },
  { "title": "Build login page", "description": "Create the login form with email and password fields." }
]
`;

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callGeminiWithTimeout(model, promptText);
      const rawText = await result.response.text();

      const cleaned = sanitizeResponse(rawText);
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed)) {
        throw new Error("Response is not an array");
      }

      // Validate each task has title and description strings
      const valid = parsed.every(
        (t) => t && typeof t.title === "string" && typeof t.description === "string"
      );

      if (!valid) {
        throw new Error("One or more tasks are missing title or description");
      }

      return res.status(200).json({
        success: true,
        isFallback: false,
        result: parsed,
      });
    } catch (err) {
      lastError = err;

      const isQuota = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("Quota");

      if (isQuota) {
        // No point retrying quota errors
        console.error(`AI quota error on attempt ${attempt}:`, err.message);
        break;
      }

      console.error(`AI generation attempt ${attempt} failed:`, err.message);

      if (attempt < MAX_RETRIES && isRetryable(err)) {
        // Backoff before retry: 1s, then 2s
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  // All retries exhausted — return keyword-based fallback tasks.
  // Still 200 so the frontend doesn't break, but isFallback: true signals degraded state.
  console.error("AI generation failed after all retries, using fallback. Last error:", lastError?.message);

  return res.status(200).json({
    success: true,
    isFallback: true,
    fallbackReason: lastError?.message || "AI provider unavailable",
    result: buildFallbackTasks(prompt),
  });
};
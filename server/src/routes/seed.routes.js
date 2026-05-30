import express from "express";
import authMiddleware from "../middleware/auth.js";
import Wiki from "../models/Wiki.js";
import WikiVersion from "../models/WikiVersion.js";

const router = express.Router();

// POST /api/seed/wiki/:workspaceId — seeds engineering wiki docs for the workspace
router.post("/wiki/:workspaceId", authMiddleware, async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user._id;

    const wikiDocs = [
      {
        title: "Authentication Flow — JWT + Refresh Tokens",
        summary: "Complete authentication lifecycle: login, token refresh, logout, and session invalidation.",
        content: `# Authentication Flow

## Login Flow

The login process follows OAuth2 password grant:

\`\`\`js
POST /api/auth/login
{ email, password }
→ { accessToken (15min), refreshToken (7d) }
\`\`\`

## Token Refresh

Silent refresh happens 1 minute before access token expiry:

\`\`\`js
POST /api/auth/refresh
{ refreshToken }
→ { newAccessToken, newRefreshToken } // Token rotation
\`\`\`

## Security Notes

- Access tokens stored in memory only
- Refresh tokens in httpOnly cookies
- Redis blacklist for invalidated tokens
- Automatic logout after 7 days of inactivity`,
        category: "Authentication",
        tags: ["auth", "jwt", "security", "refresh"],
      },
      {
        title: "CI/CD Pipeline Architecture",
        summary: "GitHub Actions workflow: test, build, security scan, and Kubernetes deployment.",
        content: `# CI/CD Pipeline Architecture

## Pipeline Stages

### 1. Test Stage
\`\`\`yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: npm ci && npm test
    - run: npm run lint
\`\`\`

### 2. Security Scan
\`\`\`yaml
security:
  needs: test
  steps:
    - uses: snyk/actions/node@master
    - run: docker scan \${{ env.IMAGE }}
\`\`\`

### 3. Deploy to Staging
\`\`\`yaml
deploy-staging:
  needs: security
  environment: staging
  steps:
    - run: kubectl set image deployment/api api=$IMAGE
\`\`\`

## Branch Strategy

- PRs → staging
- Staging merges → production (manual approval required)`,
        category: "DevOps",
        tags: ["ci-cd", "github-actions", "kubernetes", "deployment"],
      },
      {
        title: "WebSocket Event Reference",
        summary: "Complete reference for all Socket.IO events: client emissions, server broadcasts, and room management.",
        content: `# WebSocket Event Reference

## Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| join-workspace | { workspaceId } | Join workspace room |
| join-project | { projectId } | Join project room |
| send-message | { projectId, message } | Send chat message |
| typing-start | { projectId, userName } | User started typing |
| typing-stop | { projectId, userName } | User stopped typing |
| task-drag | { taskId, fromStatus, toStatus } | Task moved on board |

## Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| receive-message | message | New chat message |
| receive-message-reaction | { messageId, message } | Reaction updated |
| task-updated | task | Task status changed |
| typing-start | { userName } | Someone is typing |
| typing-stop | { userName } | Stopped typing |

## Room Naming Convention

\`\`\`
workspace:{workspaceId}
project:{projectId}
wiki:{wikiId}
\`\`\``,
        category: "Backend",
        tags: ["websocket", "socket.io", "events", "reference"],
      },
      {
        title: "Error Handling Standards",
        summary: "Standardized error handling patterns for API, async operations, and client-side errors.",
        content: `# Error Handling Standards

## API Error Format

\`\`\`json
{
  "success": false,
  "message": "Human readable message",
  "code": "ERROR_CODE",
  "statusCode": 400,
  "details": {}
}
\`\`\`

## Standard Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 400 | Invalid request data |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Unexpected server error |

## Express Error Middleware

\`\`\`js
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message,
    code: err.code || 'INTERNAL_ERROR',
  });
});
\`\`\``,
        category: "Backend",
        tags: ["errors", "api", "standards", "patterns"],
      },
      {
        title: "Microservices Communication Patterns",
        summary: "Service-to-service communication: REST, gRPC, and event-driven patterns.",
        content: `# Microservices Communication Patterns

## Synchronous: REST

For request-response patterns where immediate acknowledgment is needed:

\`\`\`
User Service → Auth Service: validateToken()
Task Service → Notification Service: sendAlert()
\`\`\`

## Asynchronous: Redis Pub/Sub

For fire-and-forget events:

\`\`\`js
// Publisher
await redis.publish('task:completed', JSON.stringify({ taskId, userId, workspace }));

// Subscriber
redis.subscribe('task:completed', (message) => {
  const event = JSON.parse(message);
  notificationService.notify(event);
});
\`\`\`

## Event Schema

All events must follow this structure:

\`\`\`json
{
  "eventType": "task:completed",
  "timestamp": "2024-01-15T10:30:00Z",
  "workspaceId": "...",
  "userId": "...",
  "payload": {}
}
\`\`\``,
        category: "Architecture",
        tags: ["microservices", "redis", "events", "patterns"],
      },
      {
        title: "Deployment SOP — Zero-Downtime Release",
        summary: "Standard operating procedure for zero-downtime production deployments with rollback.",
        content: `# Deployment SOP — Zero-Downtime Release

## Prerequisites

Before initiating a deployment:

- [ ] All CI checks green
- [ ] Staging deployment tested
- [ ] Rollback plan documented
- [ ] On-call engineer notified

## Kubernetes Rolling Deploy

\`\`\`bash
# 1. Tag the release
git tag v$(date +%Y.%m.%d)-rc1
git push origin --tags

# 2. Build and push image
docker build -t registry.collabrix.io/api:$TAG .
docker push registry.collabrix.io/api:$TAG

# 3. Update deployment
kubectl set image deployment/collabrix-api api=registry.collabrix.io/api:$TAG

# 4. Monitor rollout
kubectl rollout status deployment/collabrix-api --timeout=5m
\`\`\`

## Smoke Tests (Run within 3 min)

\`\`\`bash
# API health
curl -sf https://api.collabrix.io/api/health | jq .status

# Socket.IO connectivity
wscat -c wss://api.collabrix.io/socket.io/?transport=websocket
\`\`\`

## Rollback

\`\`\`bash
kubectl rollout undo deployment/collabrix-api
\`\`\``,
        category: "Runbooks",
        tags: ["deployment", "sop", "kubernetes", "rollback"],
      },
      {
        title: "API Rate Limiting Strategy",
        summary: "Token bucket, sliding window, and per-route rate limiting configuration.",
        content: `# API Rate Limiting Strategy

## Limits by Route Category

| Category | Limit | Window |
|----------|-------|--------|
| Public (unauthenticated) | 100 req | 1 min |
| Authenticated API | 500 req | 1 min |
| AI endpoints (Gemini) | 20 req | 1 min |
| Auth endpoints (login/register) | 10 req | 15 min |
| File upload | 5 req | 1 min |

## Implementation (Express + Redis)

\`\`\`js
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
  }),
  keyGenerator: (req) => req.user?._id || req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Slow down.",
      code: "RATE_LIMITED",
    });
  },
});
\`\`\``,
        category: "Backend",
        tags: ["rate-limiting", "redis", "security", "api"],
      },
      {
        title: "MongoDB Index Optimization Guide",
        summary: "Practical guide to MongoDB index planning, compound indexes, and query optimization.",
        content: `# MongoDB Index Optimization Guide

## Indexing Principles

1. **Index fields in query predicates first**
2. **Index sort fields second**
3. **Index projection fields last (covered queries)**

## Essential Indexes

\`\`\`js
// Task board — critical for Kanban rendering
db.tasks.createIndex({ project: 1, status: 1, priority: -1 });
db.tasks.createIndex({ workspace: 1, assignee: 1 });

// Messages — pagination (most recent first)
db.messages.createIndex({ project: 1, createdAt: -1 });

// Wiki search — full-text + category filter
db.wikis.createIndex({ workspace: 1, category: 1 });
db.wikis.createIndex({ title: "text", content: "text", tags: "text" });

// Resources — discovery feed
db.resources.createIndex({ workspace: 1, category: 1, views: -1 });
db.resources.createIndex({ workspace: 1, isPinned: -1, createdAt: -1 });
\`\`\`

## Detecting Missing Indexes

\`\`\`js
// Queries doing collection scans (COLLSCAN) need indexes
db.setProfilingLevel(1, { slowms: 50 });
db.system.profile.find({ op: "query", planSummary: /COLLSCAN/ });
\`\`\``,
        category: "Database",
        tags: ["mongodb", "indexes", "performance", "optimization"],
      },
    ];

    const created = [];
    for (const doc of wikiDocs) {
      const existing = await Wiki.findOne({ workspace: workspaceId, title: doc.title });
      if (existing) continue;

      const wiki = await Wiki.create({
        ...doc,
        slug: doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
        status: 'Published',
        workspace: workspaceId,
        author: userId,
        lastEditedBy: userId,
        views: Math.floor(Math.random() * 120) + 20,
        version: 1,
      });

      await WikiVersion.create({
        wikiId: wiki._id,
        versionNumber: 1,
        contentSnapshot: wiki.content,
        editedBy: userId,
        changeSummary: 'Initial creation via seed',
      });

      created.push(wiki.title);
    }

    res.json({ success: true, created, message: `Created ${created.length} wiki documents` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

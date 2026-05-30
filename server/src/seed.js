import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Workspace from "./models/Workspace.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import PulseEvent from "./models/PulseEvent.js";
import Message from "./models/Message.js";
import Resource from "./models/Resource.js";
import Collection from "./models/Collection.js";
import Comment from "./models/Comment.js";
import Wiki from "./models/Wiki.js";
import WikiVersion from "./models/WikiVersion.js";
import Discussion from "./models/Discussion.js";
import DiscussionReply from "./models/DiscussionReply.js";
import Snippet from "./models/Snippet.js";
import bcrypt from "bcryptjs";

dotenv.config();

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
}

const seed = async () => {
  try {
    console.log("Connecting to database for seeding...");
    await connectDB();

    console.log("Cleaning database...");
    await Promise.all([
      User.deleteMany({}),
      Workspace.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      PulseEvent.deleteMany({}),
      Message.deleteMany({}),
      Resource.deleteMany({}),
      Collection.deleteMany({}),
      Comment.deleteMany({}),
      Wiki.deleteMany({}),
      WikiVersion.deleteMany({}),
    ]);

    // Try to clean discussion models if they exist
    try { await Discussion.deleteMany({}); } catch (_) {}
    try { await DiscussionReply.deleteMany({}); } catch (_) {}
    try { await Snippet.deleteMany({}); } catch (_) {}

    console.log("Seeding Users (10 members)...");
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("collabrix123", salt);

    const userAryan = await User.create({ name: "Aryan Shah", email: "aryan@collabrix.io", password: passwordHash, avatar: "A" });
    const userBhoomi = await User.create({ name: "Bhoomi Patel", email: "bhoomi@collabrix.io", password: passwordHash, avatar: "B" });
    const userViewer = await User.create({ name: "Viewer Guest", email: "viewer@collabrix.io", password: passwordHash, avatar: "V" });
    const userRahul = await User.create({ name: "Rahul Verma", email: "rahul@collabrix.io", password: passwordHash, avatar: "R" });
    const userPriya = await User.create({ name: "Priya Nair", email: "priya@collabrix.io", password: passwordHash, avatar: "P" });
    const userKarthik = await User.create({ name: "Karthik Raj", email: "karthik@collabrix.io", password: passwordHash, avatar: "K" });
    const userSneha = await User.create({ name: "Sneha Iyer", email: "sneha@collabrix.io", password: passwordHash, avatar: "S" });
    const userDev = await User.create({ name: "Dev Sharma", email: "dev@collabrix.io", password: passwordHash, avatar: "D" });
    const userNisha = await User.create({ name: "Nisha Kapoor", email: "nisha@collabrix.io", password: passwordHash, avatar: "N" });
    const userZaid = await User.create({ name: "Zaid Khan", email: "zaid@collabrix.io", password: passwordHash, avatar: "Z" });

    const allUsers = [userAryan, userBhoomi, userRahul, userPriya, userKarthik, userSneha, userDev, userNisha, userZaid];

    console.log("Seeding Workspace...");
    const workspace = await Workspace.create({
      name: "Collabrix Platform Hub",
      description: "Central workspace for scaling realtime collaboration engines, security pipelines, and AI sprint execution.",
      owner: userAryan._id,
      members: [
        { user: userAryan._id, role: "owner" },
        { user: userBhoomi._id, role: "admin" },
        { user: userRahul._id, role: "member" },
        { user: userPriya._id, role: "member" },
        { user: userKarthik._id, role: "member" },
        { user: userSneha._id, role: "member" },
        { user: userDev._id, role: "member" },
        { user: userNisha._id, role: "member" },
        { user: userZaid._id, role: "member" },
        { user: userViewer._id, role: "viewer" },
      ],
      invites: [{
        token: "seeded_invite_token_pending",
        email: "external_consultant@collabrix.io",
        invitedBy: userAryan._id,
        role: "member",
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }]
    });

    console.log("Seeding Projects...");
    const projectBoard = await Project.create({
      name: "Realtime Engine & Synchronization Service",
      description: "Scaling WebSockets, drag presence, multiplayer state synchronization, and secure invite validation.",
      workspace: workspace._id,
      createdBy: userAryan._id,
    });

    const projectAuth = await Project.create({
      name: "Auth & Security Platform",
      description: "JWT rotation, RBAC enforcement, OAuth2 integration, and security audit pipeline.",
      workspace: workspace._id,
      createdBy: userBhoomi._id,
    });

    const projectFrontend = await Project.create({
      name: "Frontend Design System",
      description: "Component library, design tokens, accessibility compliance, and Storybook integration.",
      workspace: workspace._id,
      createdBy: userPriya._id,
    });

    const projectInfra = await Project.create({
      name: "Infrastructure & DevOps",
      description: "Docker, Kubernetes, CI/CD pipelines, monitoring, and auto-scaling configuration.",
      workspace: workspace._id,
      createdBy: userKarthik._id,
    });

    console.log("Seeding Resources (20+)...");
    const resource1 = await Resource.create({
      title: "JWT Architecture Guide for WebSockets",
      description: "Securing persistent socket connections with token rotation and custom handshakes.",
      url: "https://socket.io/docs/v4/middlewares/",
      resourceType: "Documentation",
      domain: "socket.io",
      category: "Authentication",
      tags: ["security", "auth", "sockets"],
      workspace: workspace._id,
      project: projectBoard._id,
      createdBy: userAryan._id,
      isPinned: true, views: 142,
      viewedBy: [userAryan._id, userBhoomi._id, userRahul._id],
      likes: [userBhoomi._id, userPriya._id],
    });

    const resource2 = await Resource.create({
      title: "Socket.IO Scaling in Production Clusters",
      description: "Using Redis adapter to sync socket events across multiple autoscaling node containers.",
      url: "https://socket.io/docs/v4/redis-adapter/",
      resourceType: "Article",
      domain: "socket.io",
      category: "Realtime",
      tags: ["realtime", "scaling", "devops"],
      workspace: workspace._id,
      project: projectBoard._id,
      createdBy: userBhoomi._id,
      isPinned: true, views: 98,
      viewedBy: [userAryan._id, userBhoomi._id],
      likes: [userAryan._id, userKarthik._id],
    });

    const resource3 = await Resource.create({
      title: "React 19 Concurrent Features Deep Dive",
      description: "Understanding useTransition, useDeferredValue, and Suspense in React 19 for optimal UX.",
      url: "https://react.dev/blog/2024/04/25/react-19",
      resourceType: "Article",
      domain: "react.dev",
      category: "Frontend",
      tags: ["react", "frontend", "performance"],
      workspace: workspace._id,
      project: projectFrontend._id,
      createdBy: userPriya._id,
      views: 76, likes: [userAryan._id, userSneha._id],
    });

    const resource4 = await Resource.create({
      title: "Kubernetes HPA Auto-scaling Configuration",
      description: "Horizontal Pod Autoscaler configuration with custom metrics for production workloads.",
      url: "https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/",
      resourceType: "Documentation",
      domain: "kubernetes.io",
      category: "DevOps",
      tags: ["kubernetes", "scaling", "infrastructure"],
      workspace: workspace._id,
      project: projectInfra._id,
      createdBy: userKarthik._id,
      views: 61,
      codeSnippet: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: collabrix-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: collabrix-api
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70`,
    });

    const resource5 = await Resource.create({
      title: "PostgreSQL Query Optimization Handbook",
      description: "Index strategies, EXPLAIN ANALYZE, query planning, and connection pooling best practices.",
      url: "https://www.postgresql.org/docs/current/performance-tips.html",
      resourceType: "Documentation",
      domain: "postgresql.org",
      category: "Database",
      tags: ["database", "performance", "sql"],
      workspace: workspace._id,
      createdBy: userDev._id,
      views: 84,
    });

    const resource6 = await Resource.create({
      title: "GitHub Actions CI/CD Pipeline Template",
      description: "Production-ready CI/CD pipeline with test, build, and deploy stages for Node.js services.",
      url: "https://docs.github.com/en/actions",
      resourceType: "Documentation",
      domain: "docs.github.com",
      category: "DevOps",
      tags: ["ci-cd", "github", "devops", "automation"],
      workspace: workspace._id,
      project: projectInfra._id,
      createdBy: userKarthik._id,
      views: 55,
      codeSnippet: `name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci && npm test
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t collabrix-api .
      - run: kubectl apply -f k8s/`,
    });

    const resource7 = await Resource.create({
      title: "WebAssembly Performance Patterns",
      description: "Using WASM for CPU-intensive operations in the browser — image processing, encryption, simulation.",
      url: "https://developer.mozilla.org/en-US/docs/WebAssembly",
      resourceType: "Article",
      domain: "developer.mozilla.org",
      category: "Frontend",
      tags: ["wasm", "performance", "browser"],
      workspace: workspace._id,
      createdBy: userSneha._id,
      views: 43,
    });

    const resource8 = await Resource.create({
      title: "OpenTelemetry Distributed Tracing Setup",
      description: "End-to-end request tracing across microservices with Jaeger and Prometheus integration.",
      url: "https://opentelemetry.io/docs/",
      resourceType: "Documentation",
      domain: "opentelemetry.io",
      category: "Infrastructure",
      tags: ["observability", "tracing", "monitoring"],
      workspace: workspace._id,
      project: projectInfra._id,
      createdBy: userNisha._id,
      views: 37,
    });

    console.log("Seeding Collections...");
    await Collection.create({
      name: "Auth & Security Pack",
      description: "Essential JWT, RBAC, and WebSocket security resources.",
      workspace: workspace._id,
      resources: [resource1._id, resource5._id],
      createdBy: userAryan._id,
      sprintLink: "Sprint 2",
    });

    await Collection.create({
      name: "DevOps & Infrastructure Pack",
      description: "Kubernetes, CI/CD, and monitoring resources for production deployments.",
      workspace: workspace._id,
      resources: [resource4._id, resource6._id, resource8._id],
      createdBy: userKarthik._id,
      sprintLink: "Sprint 3",
    });

    console.log("Seeding Tasks (30+)...");
    const task1 = await Task.create({
      title: "Design Secure WebSocket Authentication Handshake",
      description: "Implement initial handshake verification with JWT validation before creating persistent connections.",
      project: projectBoard._id, workspace: workspace._id,
      priority: "high", status: "done",
      assignee: userAryan._id, labels: ["auth", "security"],
      milestone: "Security Hardening", reviewStage: "Approved", deployOrder: 1,
      resources: [resource1._id], createdBy: userAryan._id,
      subtasks: [
        { title: "Define custom handshake headers", isCompleted: true },
        { title: "Verify token expiration on connect", isCompleted: true },
        { title: "Write connection timeout script (2s limit)", isCompleted: true },
      ],
    });

    const task2 = await Task.create({
      title: "Implement Multi-node Socket Sync with Redis Adapter",
      description: "Scale state synchronization across multiple Kubernetes nodes using Redis pub/sub adapter.",
      project: projectBoard._id, workspace: workspace._id,
      priority: "high", status: "in-progress",
      assignee: userBhoomi._id, labels: ["realtime", "scaling"],
      milestone: "Realtime Scaling MVP", reviewStage: "Under Review", deployOrder: 2,
      resources: [resource2._id], createdBy: userAryan._id,
      subtasks: [
        { title: "Deploy Redis instance in cluster", isCompleted: true },
        { title: "Configure adapter inside socket.js engine", isCompleted: false },
        { title: "Perform cluster load test with 5k sockets", isCompleted: false },
      ],
    });

    const task3 = await Task.create({
      title: "Build RBAC Middleware for Workspace Permissions",
      description: "Enforce role-based access: owner, admin, member, viewer with fine-grained permission checks.",
      project: projectAuth._id, workspace: workspace._id,
      priority: "high", status: "in-progress",
      assignee: userRahul._id, labels: ["rbac", "middleware", "security"],
      milestone: "Security Hardening", createdBy: userBhoomi._id,
      subtasks: [
        { title: "Define permission matrix per role", isCompleted: true },
        { title: "Write requireWorkspaceWrite middleware", isCompleted: true },
        { title: "Write requireWorkspaceRead middleware", isCompleted: false },
        { title: "Write requireWikiWrite middleware", isCompleted: false },
      ],
    });

    const task4 = await Task.create({
      title: "Fix WebSocket Reconnection Loop on Auto-scale",
      description: "Client sockets enter thundering herd reconnect loop when pods scale. Add exponential backoff with jitter.",
      project: projectBoard._id, workspace: workspace._id,
      priority: "high", status: "done",
      assignee: userAryan._id, labels: ["bug-fix", "realtime"],
      milestone: "Realtime Scaling MVP", deployOrder: 4,
      resources: [resource2._id], createdBy: userBhoomi._id,
    });

    const task5 = await Task.create({
      title: "Implement Design System Component Library",
      description: "Build reusable Button, Input, Modal, Card, and Badge components with dark mode variants.",
      project: projectFrontend._id, workspace: workspace._id,
      priority: "medium", status: "in-progress",
      assignee: userPriya._id, labels: ["frontend", "ui"],
      milestone: "Design System v1", createdBy: userPriya._id,
      subtasks: [
        { title: "Build Button component variants", isCompleted: true },
        { title: "Build Input and Form components", isCompleted: true },
        { title: "Build Modal and Drawer components", isCompleted: false },
        { title: "Build DataTable component", isCompleted: false },
        { title: "Document in Storybook", isCompleted: false },
      ],
    });

    const task6 = await Task.create({
      title: "Setup Kubernetes Cluster with Auto-scaling",
      description: "Configure HPA, resource limits, rolling deployments and health check probes for production.",
      project: projectInfra._id, workspace: workspace._id,
      priority: "high", status: "todo",
      assignee: userKarthik._id, labels: ["kubernetes", "devops"],
      milestone: "Infrastructure v2", createdBy: userKarthik._id,
      resources: [resource4._id],
    });

    const task7 = await Task.create({
      title: "Integrate OpenTelemetry Distributed Tracing",
      description: "Add request tracing across all services with Jaeger backend for performance diagnostics.",
      project: projectInfra._id, workspace: workspace._id,
      priority: "medium", status: "todo",
      assignee: userNisha._id, labels: ["observability", "monitoring"],
      milestone: "Infrastructure v2", createdBy: userKarthik._id,
    });

    const task8 = await Task.create({
      title: "Database Query Performance Optimization",
      description: "Profile slow queries, add missing indexes, and implement connection pooling with PgBouncer.",
      project: projectAuth._id, workspace: workspace._id,
      priority: "medium", status: "todo",
      assignee: userDev._id, labels: ["database", "performance"],
      milestone: "Performance Q4", createdBy: userBhoomi._id,
    });

    const task9 = await Task.create({
      title: "OAuth2 Integration with Google & GitHub",
      description: "Allow users to sign in with Google and GitHub OAuth2 with account linking support.",
      project: projectAuth._id, workspace: workspace._id,
      priority: "medium", status: "todo",
      assignee: userZaid._id, labels: ["auth", "oauth"],
      milestone: "Auth v2", createdBy: userBhoomi._id,
    });

    const task10 = await Task.create({
      title: "Accessibility Audit & WCAG 2.2 Compliance",
      description: "Run axe-core audit, fix color contrast issues, add keyboard navigation, and ARIA attributes.",
      project: projectFrontend._id, workspace: workspace._id,
      priority: "medium", status: "todo",
      assignee: userSneha._id, labels: ["accessibility", "frontend"],
      milestone: "Design System v1", createdBy: userPriya._id,
    });

    console.log("Seeding Task Comments...");
    await Comment.create({ task: task2._id, sender: userAryan._id, text: "Redis ElastiCache instance is ready on AWS. Proceed with adapter configuration." });
    await Comment.create({ task: task2._id, sender: userBhoomi._id, text: "Testing the adapter now. Sticky sessions must be enabled on ALB for this to work." });
    await Comment.create({ task: task3._id, sender: userRahul._id, text: "Permission matrix is defined. Working on the middleware implementation now." });
    await Comment.create({ task: task5._id, sender: userPriya._id, text: "Button and Input components are done. Starting on Modal next." });

    console.log("Seeding Chat Messages...");
    const msgData = { project: projectBoard._id, workspace: workspace._id };

    await Message.create({ ...msgData, sender: userAryan._id, text: "Team, I've set up the Redis adapter config. Testing in staging now.", createdAt: new Date(Date.now() - 7200000), reactions: [{ emoji: "👍", users: [userBhoomi._id, userRahul._id] }] });
    await Message.create({ ...msgData, sender: userBhoomi._id, text: "Perfect! Make sure sticky sessions are ON on the load balancer. I learned the hard way on our previous deploy.", createdAt: new Date(Date.now() - 6900000) });
    await Message.create({ ...msgData, sender: userAryan._id, text: "System Event: Aryan moved task 'Design Secure WebSocket Authentication Handshake' to Done", isSystem: true, createdAt: new Date(Date.now() - 6600000) });
    await Message.create({ ...msgData, sender: userRahul._id, text: "JWT middleware is looking good. Should we also add rate limiting per-socket to prevent abuse?", createdAt: new Date(Date.now() - 6000000), reactions: [{ emoji: "🔥", users: [userAryan._id] }] });
    await Message.create({ ...msgData, sender: userAryan._id, text: "Yes! Let's add socket rate limiting in Sprint 3. For now, the connection timeout should be enough.", createdAt: new Date(Date.now() - 5700000) });
    await Message.create({ ...msgData, sender: userBhoomi._id, text: "@Aryan The exponential backoff fix is working beautifully. No more thundering herd reconnects in staging.", createdAt: new Date(Date.now() - 4800000), reactions: [{ emoji: "🚀", users: [userAryan._id, userKarthik._id] }] });
    await Message.create({ ...msgData, sender: userKarthik._id, text: "DevOps update: K8s cluster is provisioned. HPA config is ready for review. Tagging @Aryan to approve the resource limits.", createdAt: new Date(Date.now() - 3600000) });
    await Message.create({ ...msgData, sender: userAryan._id, text: "System Event: AI Sprint Planner generated Sprint 3 - Infrastructure & Security Hardening", isSystem: true, type: "ai_generated", createdAt: new Date(Date.now() - 2400000) });
    await Message.create({ ...msgData, sender: userPriya._id, text: "Design system components are coming along nicely. Anyone have feedback on the dark mode color palette?", createdAt: new Date(Date.now() - 1800000) });
    await Message.create({ ...msgData, sender: userSneha._id, text: "Loved the violet accent colors! 💜 Accessibility audit starting next sprint.", createdAt: new Date(Date.now() - 900000), reactions: [{ emoji: "❤️", users: [userPriya._id, userBhoomi._id] }] });

    console.log("Seeding Wiki Documents (25)...");
    const wikiDocs = [
      {
        title: "Multiplayer State Synchronization Architecture",
        summary: "Core architecture for real-time WebSocket presence and drag engine across multi-node clusters.",
        content: `# Multiplayer State Synchronization Architecture

## Overview

This document describes how state is shared across autoscaling server pods in the Collabrix realtime engine. It covers the WebSocket handshake pipeline, presence synchronization, and Redis pub/sub adapter configuration.

## Realtime Handshake Pipeline

The handshake process ensures only authenticated users establish persistent socket connections.

\`\`\`js
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch (err) {
    // Disconnect unauthenticated sockets within 2 seconds
    setTimeout(() => socket.disconnect(true), 2000);
    next(new Error('Authentication failed'));
  }
});
\`\`\`

## Presence Synchronization

- Drag position notifications are debounced 50ms client-side to reduce bandwidth
- Sockets broadcast cursor locations in high-fidelity room structures
- User presence state is stored in Redis with 30s TTL

## Redis Pub/Sub Adapter

For horizontal scaling across multiple pods, we use the official \`@socket.io/redis-adapter\`:

\`\`\`js
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();
await Promise.all([pubClient.connect(), subClient.connect()]);
io.adapter(createAdapter(pubClient, subClient));
\`\`\`

## Known Gotchas

- **Sticky sessions MUST be enabled** on the load balancer. Without this, HTTP upgrade requests for WebSocket connections will randomly fail.
- Redis client must be properly configured with reconnection logic to handle ElastiCache failovers.`,
        category: "Architecture",
        tags: ["websocket", "redis", "realtime", "scaling"],
        author: userAryan,
      },
      {
        title: "Production Deployment Runbook",
        summary: "Step-by-step production deployment checklist with rollback procedures.",
        content: `# Production Deployment Runbook

## Pre-Deployment Checklist

Before any production deployment, complete the following:

- [ ] All tests passing in CI/CD pipeline
- [ ] Database migrations reviewed and tested on staging
- [ ] Redis cluster connection verified
- [ ] Nginx configuration validated
- [ ] Load balancer sticky sessions confirmed enabled
- [ ] Monitoring alerts configured for the new deployment
- [ ] Rollback plan documented

## Deployment Steps

### 1. Build Docker Image

\`\`\`bash
docker build -t collabrix-api:$(git rev-parse --short HEAD) .
docker push registry.collabrix.io/api:$(git rev-parse --short HEAD)
\`\`\`

### 2. Apply Kubernetes Manifests

\`\`\`bash
kubectl set image deployment/collabrix-api \\
  api=registry.collabrix.io/api:$VERSION \\
  --record

# Monitor rollout
kubectl rollout status deployment/collabrix-api
\`\`\`

### 3. Post-Deployment Verification

Run smoke tests within 5 minutes of deployment:

\`\`\`bash
curl -f https://api.collabrix.io/api/health
# Expected: {"status":"healthy","uptime":N}
\`\`\`

## Rollback Procedure

\`\`\`bash
kubectl rollout undo deployment/collabrix-api
kubectl rollout status deployment/collabrix-api
\`\`\`

## Nginx WebSocket Configuration

\`\`\`nginx
location /socket.io/ {
    proxy_pass http://collabrix-nodes;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 86400s;
}
\`\`\``,
        category: "DevOps",
        tags: ["deployment", "kubernetes", "nginx", "runbook"],
        author: userKarthik,
      },
      {
        title: "REST API Design Standards",
        summary: "Standardized route definitions, HTTP method contracts, and error response formats.",
        content: `# REST API Design Standards

## URL Conventions

All API routes follow RESTful resource naming:

\`\`\`
GET    /api/resources          → list all
GET    /api/resources/:id      → get one
POST   /api/resources          → create
PUT    /api/resources/:id      → full update
PATCH  /api/resources/:id      → partial update
DELETE /api/resources/:id      → delete
\`\`\`

## HTTP Methods

| Method | Usage | Idempotent |
|--------|-------|------------|
| GET | Read data | Yes |
| POST | Create / trigger | No |
| PUT | Full replacement | Yes |
| PATCH | Partial update | No |
| DELETE | Remove resource | Yes |

## Response Format

All responses must follow this envelope structure:

\`\`\`json
{
  "success": true,
  "data": {},
  "message": "Optional human-readable message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
\`\`\`

## Error Responses

\`\`\`json
{
  "success": false,
  "message": "Resource not found",
  "code": "RESOURCE_NOT_FOUND",
  "statusCode": 404
}
\`\`\`

## Authentication

All protected routes require a Bearer token:

\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

## Rate Limiting

- **Public routes**: 100 req/min
- **Authenticated routes**: 500 req/min
- **AI routes**: 20 req/min (Gemini API upstream limits)`,
        category: "Backend",
        tags: ["api", "rest", "standards", "design"],
        author: userBhoomi,
      },
      {
        title: "Engineering Team Onboarding Guide",
        summary: "Environment setup, git workflow, and first-week checklist for new engineers.",
        content: `# Engineering Team Onboarding Guide

Welcome to the Collabrix Engineering Team! 🚀

## Week 1 Checklist

- [ ] Clone the monorepo and run the dev environment
- [ ] Read this document and the Architecture Overview
- [ ] Join #general and #backend Slack channels
- [ ] Schedule 1:1 with your team lead (Aryan or Bhoomi)
- [ ] Complete your first "starter" task from the onboarding project board

## System Dependencies

\`\`\`bash
# Required versions
node >= 20.0.0
npm >= 10.0.0
mongodb >= 7.0
redis >= 7.0 (optional for local dev)
\`\`\`

## Quick Start

\`\`\`bash
# 1. Clone and install
git clone git@github.com:collabrix/platform.git
cd platform && npm install

# 2. Setup environment
cp server/.env.example server/.env
# Edit server/.env with your MongoDB URI and Gemini API key

# 3. Seed the database
cd server && npm run seed

# 4. Start development
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:5000
\`\`\`

## Git Workflow

\`\`\`
main          ← production-ready
└── staging   ← pre-production testing
    └── feat/ticket-id-description  ← feature branches
    └── fix/ticket-id-description   ← bug fixes
\`\`\`

### Commit Convention

\`\`\`
feat: add wiki version history modal
fix: resolve socket reconnection loop on scaling
docs: update API design standards
chore: upgrade socket.io to 4.7
\`\`\`

## Code Review Process

1. Open a PR from your feature branch to \`staging\`
2. Request review from at least 1 team member
3. Pass all CI checks (tests + lint)
4. Address all review comments
5. Squash and merge

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Owner | aryan@collabrix.io | collabrix123 |
| Admin | bhoomi@collabrix.io | collabrix123 |
| Viewer | viewer@collabrix.io | collabrix123 |`,
        category: "Onboarding",
        tags: ["onboarding", "setup", "git", "process"],
        author: userAryan,
      },
      {
        title: "Database Schema Design & Indexing Strategy",
        summary: "MongoDB schema design decisions, index strategies, and query optimization patterns.",
        content: `# Database Schema Design & Indexing Strategy

## Core Design Principles

1. **Embed vs. Reference**: Embed when data is always read together. Reference when data is large or independently queried.
2. **Denormalize for reads**: Store computed data (counts, summaries) to avoid expensive aggregations.
3. **Index every query field**: Add indexes for all fields used in \`find()\`, \`sort()\`, and \`aggregate()\` operations.

## Index Strategy

\`\`\`js
// User lookups
db.users.createIndex({ email: 1 }, { unique: true });

// Workspace member queries
db.workspaces.createIndex({ "members.user": 1 });

// Task board queries
db.tasks.createIndex({ project: 1, status: 1, priority: -1 });
db.tasks.createIndex({ workspace: 1, assignee: 1 });

// Message pagination (most recent first)
db.messages.createIndex({ project: 1, createdAt: -1 });

// Wiki search
db.wikis.createIndex({ workspace: 1, category: 1, status: 1 });
db.wikis.createIndex({ title: "text", content: "text" }); // Full-text search

// Resource discovery
db.resources.createIndex({ workspace: 1, category: 1, views: -1 });
\`\`\`

## Schema Patterns

### Embedded Arrays (small, bounded)
\`\`\`js
// Task subtasks (max ~20 items)
subtasks: [{ title: String, isCompleted: Boolean, _id: false }]

// Message reactions (max ~10 emoji types)
reactions: [{ emoji: String, users: [ObjectId] }]
\`\`\`

### Separate Collections (large, unbounded)
\`\`\`
Comments → separate collection with task/resource references
WikiVersions → separate collection with wikiId reference
PulseEvents → separate collection with workspace reference
\`\`\`

## Migration Strategy

All schema changes must:
1. Be backward-compatible (add fields, don't remove)
2. Include a migration script in \`/server/migrations/\`
3. Be tested on a staging database snapshot first`,
        category: "Database",
        tags: ["mongodb", "indexing", "schema", "performance"],
        author: userDev,
      },
      {
        title: "Frontend Component Architecture",
        summary: "Component hierarchy, state management patterns, and styling conventions for the Collabrix client.",
        content: `# Frontend Component Architecture

## Directory Structure

\`\`\`
client/src/
├── components/       # Shared, reusable components
│   ├── ui/          # Base UI primitives (Button, Input, Modal...)
│   ├── layouts/     # AppShell, PageLayout...
│   └── [feature]/   # Feature-specific components
├── pages/           # Route-level page components
├── context/         # React Context providers
├── services/        # API service layer
├── hooks/           # Custom React hooks
└── utils/           # Pure utility functions
\`\`\`

## Component Guidelines

### Naming Convention
- **Pages**: PascalCase, one per route (e.g., \`Wiki.jsx\`, \`Projects.jsx\`)
- **Components**: PascalCase, focused on a single responsibility
- **Hooks**: camelCase prefixed with \`use\` (e.g., \`useWikiSearch\`)

### State Management Hierarchy

\`\`\`
Server State (API) → React Query / SWR
Auth State         → AuthContext (persisted to localStorage)
Workspace State    → WorkspaceContext
Real-time State    → SocketContext
Local UI State     → useState (within component)
\`\`\`

### Service Layer Pattern

\`\`\`js
// All API calls go through service files
// Never call api.get() directly from a component

export const wikiService = {
  getWorkspaceWikis: async (workspaceId) => {
    const res = await api.get(\`/wiki/workspace/\${workspaceId}\`);
    return res.data;
  },
};
\`\`\`

## Performance Patterns

1. **Lazy load routes** — All pages use \`React.lazy()\` in routes.jsx
2. **Memoize expensive computations** — Use \`useMemo\` and \`useCallback\`
3. **Virtualize long lists** — Use \`react-window\` for lists > 100 items
4. **Code split by feature** — Each major feature should be a separate chunk`,
        category: "Frontend",
        tags: ["react", "architecture", "components", "patterns"],
        author: userPriya,
      },
      {
        title: "Security & Authentication Architecture",
        summary: "JWT rotation strategy, RBAC implementation, and security audit checklist.",
        content: `# Security & Authentication Architecture

## JWT Token Strategy

We use short-lived access tokens (15min) with longer-lived refresh tokens (7 days).

\`\`\`
Access Token:  15 minutes  → stored in memory (not localStorage)
Refresh Token: 7 days      → stored in httpOnly cookie
\`\`\`

### Token Rotation

\`\`\`js
export async function rotateRefreshToken(oldToken) {
  const record = await TokenBlacklist.findOne({ token: oldToken });
  
  if (record) {
    // 10-second grace period for concurrent requests
    if (Date.now() - record.revokedAt > 10000) {
      throw new Error("Token reuse detected — potential attack");
    }
    return record.replacementToken;
  }
  
  const newToken = generateRefreshToken();
  await TokenBlacklist.create({
    token: oldToken,
    revokedAt: new Date(),
    replacementToken: newToken
  });
  
  return newToken;
}
\`\`\`

## RBAC Permission Matrix

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| Read workspace | ✓ | ✓ | ✓ | ✓ |
| Create tasks | ✓ | ✓ | ✓ | ✗ |
| Edit wiki | ✓ | ✓ | ✓ | ✗ |
| Invite members | ✓ | ✓ | ✗ | ✗ |
| Delete workspace | ✓ | ✗ | ✗ | ✗ |
| Manage billing | ✓ | ✗ | ✗ | ✗ |

## Security Checklist

- [x] Helmet.js headers on all routes
- [x] CORS restricted to known origins
- [x] JWT verified on every protected route
- [x] Password hashed with bcrypt (salt rounds: 10)
- [x] SQL injection prevented (MongoDB parameterized queries)
- [ ] Rate limiting on auth routes (TODO: Sprint 3)
- [ ] CSRF tokens for state-changing POST requests (TODO)
- [ ] Security audit with OWASP ZAP (scheduled Q4)`,
        category: "Security",
        tags: ["jwt", "rbac", "security", "auth"],
        author: userBhoomi,
      },
      {
        title: "Observability & Monitoring Setup",
        summary: "Logging, metrics, tracing, and alerting configuration for the Collabrix platform.",
        content: `# Observability & Monitoring Setup

## The Three Pillars

### 1. Logging (Pino + Elasticsearch)

\`\`\`js
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: ["req.headers.authorization", "*.password"],
  transport: {
    target: "pino-elasticsearch",
    options: {
      index: "collabrix-logs",
      node: process.env.ELASTICSEARCH_URL,
    }
  }
});
\`\`\`

### 2. Metrics (Prometheus + Grafana)

Key metrics we track:
- **API latency**: p50, p95, p99 per route
- **WebSocket connections**: active, new/sec, errors
- **Database queries**: slow query count, connection pool usage
- **Cache hit rate**: Redis cache effectiveness

### 3. Tracing (OpenTelemetry + Jaeger)

\`\`\`js
import { NodeSDK } from "@opentelemetry/sdk-node";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
\`\`\`

## Alert Rules

| Alert | Threshold | Severity |
|-------|-----------|----------|
| API p99 > 1000ms | 5 min sustained | WARNING |
| Error rate > 1% | 2 min sustained | CRITICAL |
| Socket connections drop > 20% | 1 min | CRITICAL |
| Memory > 85% | 10 min | WARNING |
| Redis connection failed | Immediate | CRITICAL |`,
        category: "Infrastructure",
        tags: ["monitoring", "logging", "tracing", "prometheus"],
        author: userNisha,
      },
      {
        title: "Testing Strategy & Quality Standards",
        summary: "Unit testing, integration testing, and E2E testing standards with coverage requirements.",
        content: `# Testing Strategy & Quality Standards

## Testing Pyramid

\`\`\`
         /\\
        /  \\
       / E2E \\        ← 10% (Playwright)
      /--------\\
     / Integration \\  ← 30% (Supertest + Jest)
    /--------------\\
   /   Unit Tests   \\ ← 60% (Jest + Testing Library)
  /------------------\\
\`\`\`

## Coverage Requirements

| Module | Minimum Coverage |
|--------|-----------------|
| Controllers | 80% |
| Services | 85% |
| Middleware | 90% |
| Utils | 95% |
| React components | 70% |

## Unit Test Example

\`\`\`js
describe("generateSlug", () => {
  it("converts title to lowercase kebab-case", () => {
    expect(generateSlug("Hello World")).toMatch(/^hello-world-\\d+$/);
  });
  
  it("replaces special characters with hyphens", () => {
    expect(generateSlug("Auth & Security API")).toMatch(/^auth-security-api-\\d+$/);
  });
});
\`\`\`

## Integration Test Example

\`\`\`js
describe("POST /api/wiki", () => {
  it("creates a wiki document with version snapshot", async () => {
    const res = await request(app)
      .post("/api/wiki")
      .set("Authorization", \`Bearer \${token}\`)
      .send({ workspaceId, title: "Test Doc", content: "# Hello" });
    
    expect(res.status).toBe(201);
    expect(res.body.wiki.version).toBe(1);
    
    // Verify version was created
    const versions = await WikiVersion.find({ wikiId: res.body.wiki._id });
    expect(versions).toHaveLength(1);
  });
});
\`\`\`

## Pre-commit Hooks

\`\`\`json
{
  "husky": {
    "pre-commit": "npm run lint && npm run test:unit",
    "pre-push": "npm run test:integration"
  }
}
\`\`\``,
        category: "Testing",
        tags: ["testing", "jest", "playwright", "coverage"],
        author: userSneha,
      },
      {
        title: "Git Workflow & Code Review Standards",
        summary: "Branch naming, commit conventions, PR templates, and review process documentation.",
        content: `# Git Workflow & Code Review Standards

## Branch Strategy

We follow a modified GitFlow:

\`\`\`
main        ← always deployable, protected
├── staging ← integration testing
├── feat/JIRA-123-user-wiki-editor
├── fix/JIRA-456-socket-reconnect
└── chore/upgrade-dependencies
\`\`\`

## Commit Message Format

Follow the Conventional Commits specification:

\`\`\`
<type>(<scope>): <short description>

[optional body]

[optional footer]
\`\`\`

### Types
- \`feat\`: New feature
- \`fix\`: Bug fix
- \`docs\`: Documentation only
- \`style\`: Formatting, no logic change
- \`refactor\`: Code restructure, no feature change
- \`test\`: Adding or updating tests
- \`chore\`: Dependency updates, build changes

### Examples
\`\`\`
feat(wiki): add version history modal with restore functionality
fix(socket): resolve thundering herd reconnection loop
docs(api): add REST standards documentation
chore: upgrade socket.io to 4.7.2
\`\`\`

## PR Template

\`\`\`markdown
## Summary
Brief description of changes.

## Changes Made
- List specific changes

## How to Test
Steps to manually verify the changes.

## Screenshots (if UI change)
Before/after screenshots.

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Reviewed for security implications
\`\`\`

## Review Checklist

Reviewers must check:
1. **Correctness**: Does it do what the PR says?
2. **Security**: Any injection risks, missing auth checks?
3. **Performance**: N+1 queries, missing indexes?
4. **Tests**: Adequate test coverage?
5. **Style**: Follows our conventions?`,
        category: "Processes",
        tags: ["git", "workflow", "code-review", "standards"],
        author: userAryan,
      },
    ];

    const createdWikis = [];
    for (const docData of wikiDocs) {
      const wiki = await Wiki.create({
        title: docData.title,
        slug: generateSlug(docData.title),
        content: docData.content,
        summary: docData.summary,
        category: docData.category,
        tags: docData.tags,
        status: "Published",
        workspace: workspace._id,
        author: docData.author._id,
        lastEditedBy: docData.author._id,
        contributors: allUsers.slice(0, 3).map(u => u._id),
        views: Math.floor(Math.random() * 200) + 20,
        version: Math.floor(Math.random() * 5) + 1,
      });

      await WikiVersion.create({
        wikiId: wiki._id,
        versionNumber: 1,
        contentSnapshot: docData.content,
        editedBy: docData.author._id,
        changeSummary: "Initial creation",
      });

      if (wiki.version > 1) {
        for (let v = 2; v <= wiki.version; v++) {
          await WikiVersion.create({
            wikiId: wiki._id,
            versionNumber: v,
            contentSnapshot: docData.content + `\n\n<!-- Updated in version ${v} -->`,
            editedBy: allUsers[v % allUsers.length]._id,
            changeSummary: `Version ${v} — ${["Fixed typo", "Added code examples", "Updated links", "Expanded section"][v % 4]}`,
            createdAt: new Date(Date.now() - (wiki.version - v) * 86400000),
          });
        }
      }

      createdWikis.push(wiki);
    }

    console.log("Seeding Pulse Events...");
    const pulseBase = { workspace: workspace._id };

    await PulseEvent.create({ ...pulseBase, user: userAryan._id, type: "workspace_created", title: "Workspace Created", description: "Aryan initialized workspace 'Collabrix Platform Hub'", createdAt: new Date(Date.now() - 7 * 86400000) });
    await PulseEvent.create({ ...pulseBase, user: userBhoomi._id, type: "workspace_created", title: "Member Joined", description: "Bhoomi joined as Admin", createdAt: new Date(Date.now() - 7 * 86400000 + 3600000) });
    await PulseEvent.create({ ...pulseBase, user: userAryan._id, type: "sprint_generated", title: "Sprint Generated", description: "AI Sprint Planner generated Sprint 1 — Realtime Engine", createdAt: new Date(Date.now() - 6 * 86400000) });
    await PulseEvent.create({ ...pulseBase, user: userAryan._id, type: "task_moved", title: "Task Completed", description: "Aryan completed: Design Secure WebSocket Authentication Handshake", metadata: { taskId: task1._id }, createdAt: new Date(Date.now() - 5 * 86400000) });
    await PulseEvent.create({ ...pulseBase, user: userBhoomi._id, type: "resource_shared", title: "Resource Shared", description: "Bhoomi shared: Socket.IO Scaling in Production Clusters", metadata: { resourceId: resource2._id }, createdAt: new Date(Date.now() - 4 * 86400000) });
    await PulseEvent.create({ ...pulseBase, user: userKarthik._id, type: "task_moved", title: "Task Created", description: "Karthik created: Setup Kubernetes Cluster with Auto-scaling", metadata: { taskId: task6._id }, createdAt: new Date(Date.now() - 3 * 86400000) });
    await PulseEvent.create({ ...pulseBase, user: userAryan._id, type: "wiki_created", title: "Wiki Published", description: `Aryan published: Multiplayer State Synchronization Architecture`, metadata: { wikiId: createdWikis[0]._id }, createdAt: new Date(Date.now() - 2 * 86400000) });
    await PulseEvent.create({ ...pulseBase, user: userPriya._id, type: "wiki_created", title: "Wiki Published", description: "Priya published: Frontend Component Architecture", metadata: { wikiId: createdWikis[5]._id }, createdAt: new Date(Date.now() - 86400000) });
    await PulseEvent.create({ ...pulseBase, user: userBhoomi._id, type: "wiki_created", title: "Wiki Published", description: "Bhoomi published: Security & Authentication Architecture", metadata: { wikiId: createdWikis[6]._id }, createdAt: new Date(Date.now() - 43200000) });
    await PulseEvent.create({ ...pulseBase, user: userAryan._id, type: "sprint_generated", title: "Sprint Generated", description: "AI Sprint Planner generated Sprint 2 — Auth & Security Hardening", createdAt: new Date(Date.now() - 7200000) });

    console.log("✅ Seeding Complete!");
    console.log(`   👥 Users: 10`);
    console.log(`   🏢 Workspaces: 1`);
    console.log(`   🗂 Projects: 4`);
    console.log(`   ✓ Tasks: 10`);
    console.log(`   📎 Resources: 8`);
    console.log(`   📖 Wiki Docs: ${createdWikis.length} (with version history)`);
    console.log(`   💬 Messages: 10`);
    console.log(`   ⚡ Pulse Events: 10`);
    console.log(`\n   Login: aryan@collabrix.io / collabrix123`);
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

seed();

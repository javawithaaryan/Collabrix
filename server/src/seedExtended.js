import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Workspace from "./models/Workspace.js";
import Project from "./models/Project.js";
import Task from "./models/Task.js";
import Message from "./models/Message.js";
import Resource from "./models/Resource.js";
import Wiki from "./models/Wiki.js";
import WikiVersion from "./models/WikiVersion.js";

dotenv.config();

const seedExtended = async () => {
  try {
    console.log("Connecting for extended seeding...");
    await connectDB();

    // Get existing data
    const users = await User.find({});
    const workspace = await Workspace.findOne({});
    const projects = await Project.find({ workspace: workspace._id });

    if (!users.length || !workspace || !projects.length) {
      console.error("Base seed data not found. Run npm run seed first.");
      process.exit(1);
    }

    const userMap = {};
    users.forEach((u) => {
      userMap[u.name] = u;
    });
    const allUsers = users;
    const projectBoard =
      projects.find((p) => p.name.includes("Realtime")) || projects[0];
    const projectAuth =
      projects.find((p) => p.name.includes("Auth")) || projects[1];
    const projectFrontend =
      projects.find((p) => p.name.includes("Frontend")) || projects[2];
    const projectInfra =
      projects.find((p) => p.name.includes("Infrastructure")) || projects[3];

    console.log("Seeding additional resources...");
    await Resource.insertMany([
      {
        title: "TanStack Query v5 — Server State Management",
        description:
          "Async state management for React: caching, background refetching, optimistic updates, and infinite scroll.",
        url: "https://tanstack.com/query/latest",
        resourceType: "Documentation",
        domain: "tanstack.com",
        category: "Frontend",
        tags: ["react-query", "state", "caching", "frontend"],
        workspace: workspace._id,
        project: projectFrontend._id,
        createdBy: allUsers[0]._id,
        views: 89,
        isPinned: true,
      },
      {
        title: "Vite 5 Build Optimization Guide",
        description:
          "Code splitting, tree shaking, rollup configuration, and production build performance tuning.",
        url: "https://vitejs.dev/guide/features",
        resourceType: "Documentation",
        domain: "vitejs.dev",
        category: "Frontend",
        tags: ["vite", "bundler", "performance", "build"],
        workspace: workspace._id,
        project: projectFrontend._id,
        createdBy: allUsers[2]._id,
        views: 67,
      },
      {
        title: "MongoDB Atlas Search — Full Text Indexing",
        description:
          "Lucene-powered search with fuzzy matching, autocomplete, and faceted search for MongoDB.",
        url: "https://www.mongodb.com/docs/atlas/atlas-search/",
        resourceType: "Documentation",
        domain: "mongodb.com",
        category: "Database",
        tags: ["mongodb", "search", "atlas", "full-text"],
        workspace: workspace._id,
        createdBy: allUsers[1]._id,
        views: 54,
      },
      {
        title: "Stripe Payment Integration Handbook",
        description:
          "PaymentIntent, webhooks, subscription billing, and PCI compliance for production payments.",
        url: "https://stripe.com/docs",
        resourceType: "Documentation",
        domain: "stripe.com",
        category: "Backend",
        tags: ["stripe", "payments", "billing", "webhook"],
        workspace: workspace._id,
        createdBy: allUsers[3]._id,
        views: 102,
        isPinned: true,
      },
      {
        title: "Sentry Error Monitoring & Performance",
        description:
          "Error tracking, performance monitoring, session replays, and alerting for production apps.",
        url: "https://docs.sentry.io",
        resourceType: "Documentation",
        domain: "docs.sentry.io",
        category: "Infrastructure",
        tags: ["monitoring", "errors", "observability", "sentry"],
        workspace: workspace._id,
        project: projectInfra._id,
        createdBy: allUsers[4]._id,
        views: 71,
      },
      {
        title: "AWS S3 — Presigned URLs & Direct Uploads",
        description:
          "Secure file uploads directly from browser to S3 using presigned URLs with size and type restrictions.",
        url: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html",
        resourceType: "Documentation",
        domain: "docs.aws.amazon.com",
        category: "Infrastructure",
        tags: ["aws", "s3", "storage", "uploads"],
        workspace: workspace._id,
        createdBy: allUsers[5]._id,
        views: 83,
      },
      {
        title: "Redis Caching Patterns — LRU, TTL, Write-Through",
        description:
          "Production Redis caching strategies: LRU eviction, TTL-based invalidation, write-through patterns.",
        url: "https://redis.io/docs/manual/patterns/",
        resourceType: "Article",
        domain: "redis.io",
        category: "Backend",
        tags: ["redis", "caching", "performance", "patterns"],
        workspace: workspace._id,
        project: projectBoard._id,
        createdBy: allUsers[6]._id,
        views: 48,
      },
      {
        title: "Apollo GraphQL — Schema Design & Resolvers",
        description:
          "Federation, schema stitching, DataLoader, and resolver optimization for production GraphQL APIs.",
        url: "https://www.apollographql.com/docs/",
        resourceType: "Documentation",
        domain: "apollographql.com",
        category: "Backend",
        tags: ["graphql", "apollo", "api", "schema"],
        workspace: workspace._id,
        createdBy: allUsers[7]._id,
        views: 39,
      },
      {
        title: "Docker Security Best Practices",
        description:
          "Non-root containers, image scanning, secrets management, and network isolation for production.",
        url: "https://docs.docker.com/develop/security-best-practices/",
        resourceType: "Documentation",
        domain: "docs.docker.com",
        category: "DevOps",
        tags: ["docker", "security", "containers", "devops"],
        workspace: workspace._id,
        project: projectInfra._id,
        createdBy: allUsers[4]._id,
        views: 61,
      },
      {
        title: "Web Vitals Optimization — LCP, FID, CLS",
        description:
          "Core Web Vitals measurement, optimization techniques, and tooling for Google Search ranking.",
        url: "https://web.dev/vitals/",
        resourceType: "Article",
        domain: "web.dev",
        category: "Frontend",
        tags: ["performance", "seo", "web-vitals", "lighthouse"],
        workspace: workspace._id,
        project: projectFrontend._id,
        createdBy: allUsers[2]._id,
        views: 94,
      },
      {
        title: "JWT Security — Best Practices & Common Pitfalls",
        description:
          "Token storage, expiration strategies, refresh token rotation, and XSS/CSRF protection.",
        url: "https://auth0.com/docs/secure/tokens/json-web-tokens",
        resourceType: "Article",
        domain: "auth0.com",
        category: "Authentication",
        tags: ["jwt", "security", "auth", "tokens"],
        workspace: workspace._id,
        project: projectAuth._id,
        createdBy: allUsers[0]._id,
        views: 127,
        isPinned: true,
      },
      {
        title: "React Testing Library — Integration Testing",
        description:
          "Component testing philosophy, user-centric queries, mocking, and async testing patterns.",
        url: "https://testing-library.com/docs/react-testing-library/intro/",
        resourceType: "Documentation",
        domain: "testing-library.com",
        category: "Frontend",
        tags: ["testing", "react", "integration", "jest"],
        workspace: workspace._id,
        project: projectFrontend._id,
        createdBy: allUsers[2]._id,
        views: 56,
      },
      {
        title: "Nginx Load Balancing Configuration",
        description:
          "Upstream configuration, health checks, SSL termination, and WebSocket proxying.",
        url: "https://nginx.org/en/docs/http/load_balancing.html",
        resourceType: "Documentation",
        domain: "nginx.org",
        category: "Infrastructure",
        tags: ["nginx", "load-balancing", "infrastructure", "devops"],
        workspace: workspace._id,
        project: projectInfra._id,
        createdBy: allUsers[4]._id,
        views: 45,
      },
      {
        title: "Zod Schema Validation — TypeScript-First",
        description:
          "Runtime type validation with TypeScript inference, nested schemas, and custom error messages.",
        url: "https://zod.dev/",
        resourceType: "Documentation",
        domain: "zod.dev",
        category: "Backend",
        tags: ["validation", "typescript", "zod", "schema"],
        workspace: workspace._id,
        project: projectAuth._id,
        createdBy: allUsers[1]._id,
        views: 73,
      },
      {
        title: "Prometheus + Grafana Monitoring Stack",
        description:
          "Metrics collection, alerting rules, dashboards, and SLO tracking for production services.",
        url: "https://prometheus.io/docs/",
        resourceType: "Documentation",
        domain: "prometheus.io",
        category: "Infrastructure",
        tags: ["prometheus", "grafana", "monitoring", "metrics"],
        workspace: workspace._id,
        project: projectInfra._id,
        createdBy: allUsers[6]._id,
        views: 68,
      },
    ]);

    console.log("Seeding additional tasks...");
    await Task.insertMany([
      {
        title: "Implement Real-time Cursor Presence",
        description:
          "Show team member cursors in shared views with color-coded avatars and smooth interpolation.",
        project: projectBoard._id,
        workspace: workspace._id,
        priority: "high",
        status: "todo",
        assignee: allUsers[0]._id,
        labels: ["realtime", "ux"],
        milestone: "Realtime MVP v2",
        createdBy: allUsers[0]._id,
      },
      {
        title: "Build Notification Preference Center",
        description:
          "Per-channel notification settings: email, push, in-app, slack integration.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[1]._id,
        labels: ["notifications", "settings"],
        createdBy: allUsers[1]._id,
      },
      {
        title: "Optimize Initial Page Load — LCP < 2.5s",
        description:
          "Route-based code splitting, lazy loading images, preloading critical fonts.",
        project: projectFrontend._id,
        workspace: workspace._id,
        priority: "high",
        status: "in-progress",
        assignee: allUsers[2]._id,
        labels: ["performance", "web-vitals"],
        milestone: "Performance Sprint",
        createdBy: allUsers[2]._id,
      },
      {
        title: "Setup Prometheus Metrics Collection",
        description:
          "Instrument API endpoints with response time histograms, error rate counters, and custom business metrics.",
        project: projectInfra._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[4]._id,
        labels: ["monitoring", "devops"],
        createdBy: allUsers[4]._id,
      },
      {
        title: "Implement File Upload to AWS S3",
        description:
          "Presigned URL generation, client-side direct upload with progress tracking, and CDN distribution.",
        project: projectBoard._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[5]._id,
        labels: ["aws", "storage", "files"],
        createdBy: allUsers[0]._id,
      },
      {
        title: "JWT Refresh Token Rotation",
        description:
          "Implement silent refresh with sliding window, blacklist invalidated tokens in Redis.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "high",
        status: "in-progress",
        assignee: allUsers[3]._id,
        labels: ["auth", "security", "jwt"],
        milestone: "Security Sprint",
        createdBy: allUsers[1]._id,
      },
      {
        title: "Build Email Notification Templates",
        description:
          "Transactional email templates for workspace invites, sprint summaries, and @mentions.",
        project: projectBoard._id,
        workspace: workspace._id,
        priority: "low",
        status: "todo",
        assignee: allUsers[6]._id,
        labels: ["email", "notifications"],
        createdBy: allUsers[0]._id,
      },
      {
        title: "Add Rate Limiting to API Routes",
        description:
          "Express rate limiter with Redis backend, per-route and per-user limits.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "high",
        status: "done",
        assignee: allUsers[1]._id,
        labels: ["security", "api", "redis"],
        createdBy: allUsers[1]._id,
      },
      {
        title: "Create Storybook Component Catalog",
        description:
          "Document all UI components with live examples, prop tables, and accessibility notes.",
        project: projectFrontend._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[2]._id,
        labels: ["storybook", "documentation", "design-system"],
        createdBy: allUsers[2]._id,
      },
      {
        title: "Configure SSL Certificate Auto-renewal",
        description:
          "Let's Encrypt with certbot, automatic renewal cron, and Nginx integration.",
        project: projectInfra._id,
        workspace: workspace._id,
        priority: "high",
        status: "done",
        assignee: allUsers[4]._id,
        labels: ["ssl", "security", "nginx"],
        createdBy: allUsers[4]._id,
      },
      {
        title: "Add Full-Text Search to Wiki",
        description:
          "MongoDB Atlas Search index on wiki title, content, tags with fuzzy matching and highlighting.",
        project: projectBoard._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[7]._id,
        labels: ["search", "wiki", "mongodb"],
        createdBy: allUsers[0]._id,
      },
      {
        title: "Implement Payment Plans & Billing",
        description:
          "Stripe subscription billing, plan tiers, usage-based pricing, and invoice generation.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[3]._id,
        labels: ["billing", "stripe", "payments"],
        createdBy: allUsers[1]._id,
      },
      {
        title: "Build Admin Analytics Dashboard",
        description:
          "Workspace-level analytics: active users, task velocity, resource usage, AI calls.",
        project: projectFrontend._id,
        workspace: workspace._id,
        priority: "low",
        status: "todo",
        assignee: allUsers[2]._id,
        labels: ["analytics", "dashboard", "admin"],
        createdBy: allUsers[0]._id,
      },
      {
        title: "Database Backup Automation",
        description:
          "Daily MongoDB dumps to S3 with 30-day retention, integrity verification, and restore testing.",
        project: projectInfra._id,
        workspace: workspace._id,
        priority: "high",
        status: "todo",
        assignee: allUsers[4]._id,
        labels: ["backup", "database", "automation"],
        milestone: "Infrastructure v2",
        createdBy: allUsers[4]._id,
      },
      {
        title: "Add Socket.IO Connection Pooling",
        description:
          "Connection pool management to prevent memory leaks and zombie connections in production.",
        project: projectBoard._id,
        workspace: workspace._id,
        priority: "medium",
        status: "in-progress",
        assignee: allUsers[0]._id,
        labels: ["sockets", "performance", "memory"],
        createdBy: allUsers[0]._id,
      },
      {
        title: "Build Code Snippet Sharing Feature",
        description:
          "Language-aware snippet editor with syntax highlighting, tags, and team visibility controls.",
        project: projectFrontend._id,
        workspace: workspace._id,
        priority: "medium",
        status: "in-progress",
        assignee: allUsers[5]._id,
        labels: ["snippets", "code", "collaboration"],
        createdBy: allUsers[2]._id,
      },
      {
        title: "Implement 2FA — TOTP & SMS",
        description:
          "Time-based OTP with Google Authenticator compatibility and SMS fallback via Twilio.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "high",
        status: "todo",
        assignee: allUsers[3]._id,
        labels: ["2fa", "security", "auth"],
        milestone: "Security Sprint",
        createdBy: allUsers[1]._id,
      },
      {
        title: "Setup Log Aggregation with ELK Stack",
        description:
          "Elasticsearch, Logstash, Kibana for structured log analysis, search, and alerting.",
        project: projectInfra._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[6]._id,
        labels: ["logging", "elk", "observability"],
        createdBy: allUsers[4]._id,
      },
      {
        title: "Build Mobile Responsive Layout",
        description:
          "Responsive breakpoints for tablet and mobile with touch-optimized interactions.",
        project: projectFrontend._id,
        workspace: workspace._id,
        priority: "high",
        status: "todo",
        assignee: allUsers[2]._id,
        labels: ["responsive", "mobile", "ux"],
        milestone: "v2 Release",
        createdBy: allUsers[2]._id,
      },
      {
        title: "API Endpoint Integration Testing",
        description:
          "Comprehensive test suite with Supertest, database fixtures, and CI integration.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[7]._id,
        labels: ["testing", "api", "ci"],
        createdBy: allUsers[1]._id,
      },
      {
        title: "Implement WebRTC Screen Sharing",
        description:
          "Peer-to-peer screen sharing via WebRTC with fallback to TURN server for NAT traversal.",
        project: projectBoard._id,
        workspace: workspace._id,
        priority: "low",
        status: "todo",
        assignee: allUsers[0]._id,
        labels: ["webrtc", "video", "realtime"],
        createdBy: allUsers[0]._id,
      },
      {
        title: "Migrate to TypeScript — Phase 1 (Models)",
        description:
          "Add TypeScript to backend models and service layer with strict mode enabled.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[1]._id,
        labels: ["typescript", "refactor", "backend"],
        milestone: "TS Migration",
        createdBy: allUsers[1]._id,
      },
      {
        title: "Build Gantt Chart View for Projects",
        description:
          "Interactive Gantt chart with drag-and-drop milestones, dependencies, and critical path.",
        project: projectFrontend._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[5]._id,
        labels: ["gantt", "visualization", "frontend"],
        createdBy: allUsers[2]._id,
      },
      {
        title: "Configure Kubernetes HPA",
        description:
          "Horizontal Pod Autoscaler for API service based on CPU and custom metrics.",
        project: projectInfra._id,
        workspace: workspace._id,
        priority: "high",
        status: "done",
        assignee: allUsers[4]._id,
        labels: ["kubernetes", "autoscaling", "devops"],
        createdBy: allUsers[4]._id,
      },
      {
        title: "Add Audit Log Trail",
        description:
          "Track all CRUD operations with user ID, timestamp, IP, and payload diff for compliance.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "high",
        status: "in-progress",
        assignee: allUsers[3]._id,
        labels: ["audit", "compliance", "logging"],
        milestone: "Security Sprint",
        createdBy: allUsers[1]._id,
      },
      {
        title: "Implement Dark/Light Theme Toggle",
        description:
          "System-preference detection with manual override and localStorage persistence.",
        project: projectFrontend._id,
        workspace: workspace._id,
        priority: "low",
        status: "done",
        assignee: allUsers[2]._id,
        labels: ["theme", "ui", "accessibility"],
        createdBy: allUsers[2]._id,
      },
      {
        title: "Build Workspace Onboarding Flow",
        description:
          "Multi-step onboarding wizard for new workspaces: team invite, first project, first task.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[8]._id,
        labels: ["onboarding", "ux", "product"],
        createdBy: allUsers[0]._id,
      },
      {
        title: "API Documentation with Swagger/OpenAPI",
        description:
          "Auto-generated OpenAPI 3.0 spec from route definitions with live Swagger UI.",
        project: projectAuth._id,
        workspace: workspace._id,
        priority: "low",
        status: "todo",
        assignee: allUsers[7]._id,
        labels: ["documentation", "api", "openapi"],
        createdBy: allUsers[1]._id,
      },
      {
        title: "Implement Webhook Delivery System",
        description:
          "Configurable outbound webhooks with retry logic, signature HMAC signing, and delivery logs.",
        project: projectBoard._id,
        workspace: workspace._id,
        priority: "medium",
        status: "todo",
        assignee: allUsers[6]._id,
        labels: ["webhooks", "integrations", "backend"],
        createdBy: allUsers[0]._id,
      },
      {
        title: "Profile Page & Avatar Upload",
        description:
          "User profile editing with S3 avatar uploads, bio, timezone, and notification prefs.",
        project: projectFrontend._id,
        workspace: workspace._id,
        priority: "low",
        status: "in-progress",
        assignee: allUsers[5]._id,
        labels: ["profile", "s3", "ux"],
        createdBy: allUsers[2]._id,
      },
      {
        title: "Multi-region Database Failover",
        description:
          "MongoDB Atlas cross-region replication with automatic failover under 30s RTO.",
        project: projectInfra._id,
        workspace: workspace._id,
        priority: "high",
        status: "todo",
        assignee: allUsers[4]._id,
        labels: ["database", "ha", "disaster-recovery"],
        milestone: "Infrastructure v2",
        createdBy: allUsers[4]._id,
      },
    ]);

    console.log("Seeding 150+ additional chat messages...");
    const now = Date.now();
    const hour = 3600000;
    const day = 86400000;

    const msgs = [];

    // General project board messages
    const boardMsgs = [
      {
        sender: allUsers[0]._id,
        text: "Good morning team! Sprint 4 planning starts today.",
        createdAt: new Date(now - 14 * day),
      },
      {
        sender: allUsers[1]._id,
        text: "I've finished the Redis adapter configuration. Cluster is syncing perfectly across 3 nodes.",
        createdAt: new Date(now - 14 * day + hour),
      },
      {
        sender: allUsers[0]._id,
        text: "Excellent! @Bhoomi can you write up the deployment notes in the wiki?",
        createdAt: new Date(now - 14 * day + 2 * hour),
      },
      {
        sender: allUsers[1]._id,
        text: "On it! Will have it done by EOD.",
        createdAt: new Date(now - 14 * day + 2.5 * hour),
      },
      {
        sender: allUsers[3]._id,
        text: "The RBAC middleware is taking shape. Permission matrix is documented.",
        createdAt: new Date(now - 13 * day),
      },
      {
        sender: allUsers[4]._id,
        text: "K8s cluster is getting expensive. I'm looking at spot instances for dev environment.",
        createdAt: new Date(now - 13 * day + hour),
      },
      {
        sender: allUsers[0]._id,
        text: "Good call @Karthik. Keep prod on reserved instances though.",
        createdAt: new Date(now - 13 * day + 2 * hour),
      },
      {
        sender: allUsers[2]._id,
        text: "Design system is at 70% coverage. Modal and Drawer done, working on DataTable.",
        createdAt: new Date(now - 12 * day),
      },
      {
        sender: allUsers[5]._id,
        text: "The dark mode colors look incredible on the new design system btw 💜",
        createdAt: new Date(now - 12 * day + hour),
        reactions: [
          { emoji: "❤️", users: [allUsers[2]._id, allUsers[0]._id] },
        ],
      },
      {
        sender: allUsers[6]._id,
        text: "Quick update: Email notification templates are 50% done. Invite email looks great.",
        createdAt: new Date(now - 11 * day),
      },
      {
        sender: allUsers[0]._id,
        text: "System event: Sprint 4 goals updated — targeting 85% task completion rate.",
        isSystem: true,
        createdAt: new Date(now - 11 * day + hour),
      },
      {
        sender: allUsers[7]._id,
        text: "Heads up: MongoDB Atlas Search index is ready in staging. Wiki search is 3x faster.",
        createdAt: new Date(now - 11 * day + 2 * hour),
        reactions: [
          { emoji: "🚀", users: [allUsers[0]._id, allUsers[1]._id] },
        ],
      },
      {
        sender: allUsers[8]._id,
        text: "Just finished the SSL auto-renewal script. Certs will never expire again!",
        createdAt: new Date(now - 10 * day),
      },
      {
        sender: allUsers[0]._id,
        text: "🎉 Milestone reached: 0 production incidents in 30 days!",
        createdAt: new Date(now - 10 * day + hour),
        reactions: [
          {
            emoji: "🎉",
            users: [
              allUsers[1]._id,
              allUsers[2]._id,
              allUsers[3]._id,
              allUsers[4]._id,
            ],
          },
        ],
      },
      {
        sender: allUsers[1]._id,
        text: "Rate limiting is now live on all API routes. 500 req/min per user.",
        createdAt: new Date(now - 9 * day),
      },
      {
        sender: allUsers[3]._id,
        text: "JWT refresh rotation implementation starting. This is the most security-critical feature this sprint.",
        createdAt: new Date(now - 9 * day + hour),
      },
      {
        sender: allUsers[0]._id,
        text: "@Rahul make sure to test with concurrent refresh requests — race conditions are brutal here.",
        createdAt: new Date(now - 9 * day + 2 * hour),
      },
      {
        sender: allUsers[3]._id,
        text: "Already on it. Using Redis atomic operations for token invalidation.",
        createdAt: new Date(now - 9 * day + 2.5 * hour),
      },
      {
        sender: allUsers[2]._id,
        text: "Anyone have thoughts on our color system? Thinking about adding amber for warning states.",
        createdAt: new Date(now - 8 * day),
      },
      {
        sender: allUsers[5]._id,
        text: "Amber works perfectly with the dark theme. The zinc-based neutrals are chef's kiss 🤌",
        createdAt: new Date(now - 8 * day + hour),
      },
      {
        sender: allUsers[4]._id,
        text: "Prometheus metrics are live! Grafana dashboard shows P99 API latency at 42ms. 💪",
        createdAt: new Date(now - 8 * day + 2 * hour),
        reactions: [
          { emoji: "💯", users: [allUsers[0]._id, allUsers[1]._id] },
        ],
      },
      {
        sender: allUsers[6]._id,
        text: "Socket connection pooling PR is up for review. Fixed 3 memory leak scenarios.",
        createdAt: new Date(now - 7 * day),
      },
      {
        sender: allUsers[0]._id,
        text: "Will review tonight. Memory leaks in production sockets are nightmare fuel.",
        createdAt: new Date(now - 7 * day + hour),
      },
      {
        sender: allUsers[7]._id,
        text: "GraphQL schema design doc is in the wiki. Please review before we implement.",
        createdAt: new Date(now - 7 * day + 2 * hour),
      },
      {
        sender: allUsers[1]._id,
        text: "I'll review it. We need to agree on mutation naming conventions first.",
        createdAt: new Date(now - 7 * day + 2.5 * hour),
      },
      {
        sender: allUsers[8]._id,
        text: "Docker security scan complete. Found 2 medium severity issues in node:18-slim. Upgrading to node:20-slim.",
        createdAt: new Date(now - 6 * day),
      },
      {
        sender: allUsers[0]._id,
        text: "Critical security update — upgrade all containers ASAP. Thanks @Zaid!",
        createdAt: new Date(now - 6 * day + hour),
      },
      {
        sender: allUsers[2]._id,
        text: "Mobile responsive layouts are now done for all core pages! 📱",
        createdAt: new Date(now - 6 * day + 2 * hour),
        reactions: [
          { emoji: "🔥", users: [allUsers[0]._id, allUsers[5]._id] },
        ],
      },
      {
        sender: allUsers[3]._id,
        text: "2FA implementation is blocked on Twilio account approval. ETA 48 hours.",
        createdAt: new Date(now - 5 * day),
      },
      {
        sender: allUsers[0]._id,
        text: "Start with TOTP only — launch SMS 2FA in v2.1",
        createdAt: new Date(now - 5 * day + hour),
      },
      {
        sender: allUsers[4]._id,
        text: "Database backup automation is running. First backup to S3 completed at 3AM. 26GB compressed.",
        createdAt: new Date(now - 5 * day + 2 * hour),
      },
      {
        sender: allUsers[1]._id,
        text: "Sprint retrospective: What went well? What needs improvement?",
        createdAt: new Date(now - 4 * day),
      },
      {
        sender: allUsers[2]._id,
        text: "Went well: Design system velocity improved 2x. Needs improvement: More design reviews before implementation.",
        createdAt: new Date(now - 4 * day + hour),
      },
      {
        sender: allUsers[3]._id,
        text: "Went well: Zero security incidents. Needs improvement: Better handoffs between backend and infra.",
        createdAt: new Date(now - 4 * day + 1.5 * hour),
      },
      {
        sender: allUsers[4]._id,
        text: "Went well: K8s auto-scaling working flawlessly. Needs: More load testing before next major release.",
        createdAt: new Date(now - 4 * day + 2 * hour),
      },
      {
        sender: allUsers[0]._id,
        text: "Great retrospective everyone. Action items documented in Notion. Sprint 5 planning tomorrow 10AM.",
        createdAt: new Date(now - 4 * day + 3 * hour),
      },
      {
        sender: allUsers[5]._id,
        text: "Accessibility audit complete! 23 WCAG violations fixed. The app is now AA compliant! ♿",
        createdAt: new Date(now - 3 * day),
        reactions: [
          { emoji: "🙌", users: [allUsers[0]._id, allUsers[2]._id] },
        ],
      },
      {
        sender: allUsers[6]._id,
        text: "ELK stack deployment started. Kibana dashboard looking promising.",
        createdAt: new Date(now - 3 * day + hour),
      },
      {
        sender: allUsers[7]._id,
        text: "API integration tests are at 94% coverage! Last 6% is the payment flow.",
        createdAt: new Date(now - 3 * day + 2 * hour),
      },
      {
        sender: allUsers[0]._id,
        text: "@Dev excellent! Let's get to 100% before the release.",
        createdAt: new Date(now - 3 * day + 2.5 * hour),
      },
      {
        sender: allUsers[1]._id,
        text: "AI-generated sprint summary: Team velocity at 32 story points. On track for Q4 delivery. 🤖",
        isSystem: true,
        createdAt: new Date(now - 2 * day),
      },
      {
        sender: allUsers[8]._id,
        text: "Log aggregation is live. We caught 3 recurring 500 errors that were silently failing before!",
        createdAt: new Date(now - 2 * day + hour),
        reactions: [{ emoji: "👀", users: [allUsers[0]._id] }],
      },
      {
        sender: allUsers[0]._id,
        text: "Silent errors are the worst. Fix those before release. Tag them as P0.",
        createdAt: new Date(now - 2 * day + 2 * hour),
      },
      {
        sender: allUsers[2]._id,
        text: "Storybook catalog is live at docs.collabrix.io/components 🎨",
        createdAt: new Date(now - day),
      },
      {
        sender: allUsers[3]._id,
        text: "2FA with TOTP is working! QR code scanning tested with 3 different authenticator apps.",
        createdAt: new Date(now - day + hour),
        reactions: [
          { emoji: "🔥", users: [allUsers[0]._id, allUsers[1]._id] },
        ],
      },
      {
        sender: allUsers[4]._id,
        text: "Nginx load balancing config optimized. WebSocket sticky sessions verified. Zero dropped connections.",
        createdAt: new Date(now - day + 2 * hour),
      },
      {
        sender: allUsers[5]._id,
        text: "File upload to S3 feature is nearly done. Presigned URLs working, need to add progress UI.",
        createdAt: new Date(now - 12 * hour),
      },
      {
        sender: allUsers[0]._id,
        text: "Good morning! Today's focus: Release candidate build and final QA pass.",
        createdAt: new Date(now - 8 * hour),
      },
      {
        sender: allUsers[1]._id,
        text: "On it! API health check passing on all endpoints. Load test running now.",
        createdAt: new Date(now - 7 * hour),
      },
      {
        sender: allUsers[4]._id,
        text: "Load test results: 10,000 concurrent users, P95 latency 89ms. 🎯",
        createdAt: new Date(now - 6 * hour),
        reactions: [
          {
            emoji: "🚀",
            users: [allUsers[0]._id, allUsers[1]._id, allUsers[2]._id],
          },
        ],
      },
      {
        sender: allUsers[0]._id,
        text: "That's production-ready! Green light for release candidate build.",
        createdAt: new Date(now - 5 * hour),
      },
      {
        sender: allUsers[2]._id,
        text: "UI regression testing done. All pixel-perfect. Shipping it! 🚢",
        createdAt: new Date(now - 4 * hour),
        reactions: [
          {
            emoji: "🎉",
            users: [
              allUsers[0]._id,
              allUsers[1]._id,
              allUsers[3]._id,
              allUsers[4]._id,
              allUsers[5]._id,
            ],
          },
        ],
      },
      {
        sender: allUsers[0]._id,
        text: "Release notes are up. Collabrix v1.0 is LIVE! 🎊 Thanks to everyone on the team — incredible work!",
        createdAt: new Date(now - 2 * hour),
        reactions: [
          {
            emoji: "🎉",
            users: [
              allUsers[1]._id,
              allUsers[2]._id,
              allUsers[3]._id,
              allUsers[4]._id,
              allUsers[5]._id,
              allUsers[6]._id,
              allUsers[7]._id,
              allUsers[8]._id,
            ],
          },
        ],
      },
      // Extra board messages padding to 100+
      {
        sender: allUsers[6]._id,
        text: "Just checked: Sentry error rate is down to 0.02% after the latest deploy. Incredible improvement.",
        createdAt: new Date(now - 18 * day),
      },
      {
        sender: allUsers[0]._id,
        text: "That's a 95% reduction from last sprint. The error boundary refactor paid off big time.",
        createdAt: new Date(now - 18 * day + hour),
      },
      {
        sender: allUsers[7]._id,
        text: "Wiki has 40+ articles now. Team is actually using it! Knowledge retention is real.",
        createdAt: new Date(now - 17 * day),
        reactions: [{ emoji: "📖", users: [allUsers[0]._id] }],
      },
      {
        sender: allUsers[2]._id,
        text: "The new component library saved us 3 days on the dashboard UI. Reusability FTW.",
        createdAt: new Date(now - 17 * day + hour),
      },
      {
        sender: allUsers[5]._id,
        text: "TanStack Query invalidation hooks are so clean. No more useEffect spaghetti!",
        createdAt: new Date(now - 16 * day),
        reactions: [{ emoji: "💯", users: [allUsers[2]._id] }],
      },
      {
        sender: allUsers[1]._id,
        text: "PR review checklist updated with security items. All PRs must now include threat model notes.",
        createdAt: new Date(now - 16 * day + hour),
      },
      {
        sender: allUsers[3]._id,
        text: "Session fixation attack vector patched. Rotating session IDs on privilege escalation now.",
        createdAt: new Date(now - 15 * day),
      },
      {
        sender: allUsers[4]._id,
        text: "Terraform state is now stored in S3 with DynamoDB locking. No more state conflicts.",
        createdAt: new Date(now - 15 * day + hour),
      },
      {
        sender: allUsers[8]._id,
        text: "Network policies applied to all K8s pods. Zero-trust networking is now enforced.",
        createdAt: new Date(now - 15 * day + 2 * hour),
        reactions: [{ emoji: "🔒", users: [allUsers[0]._id, allUsers[4]._id] }],
      },
      {
        sender: allUsers[0]._id,
        text: "Engineering all-hands tomorrow at 2PM. Agenda: v1.0 retrospective and v2.0 roadmap reveal.",
        createdAt: new Date(now - 20 * day),
      },
      {
        sender: allUsers[2]._id,
        text: "v2.0 wishlist: dark mode + light mode toggle, Gantt chart, and better mobile UX.",
        createdAt: new Date(now - 20 * day + hour),
      },
      {
        sender: allUsers[1]._id,
        text: "v2.0 backend wishlist: GraphQL API, WebSockets v2 with protocol upgrade, TypeScript migration.",
        createdAt: new Date(now - 20 * day + 2 * hour),
      },
      {
        sender: allUsers[4]._id,
        text: "v2.0 infra: Multi-region, GitOps with ArgoCD, and chaos engineering drills.",
        createdAt: new Date(now - 20 * day + 3 * hour),
      },
      {
        sender: allUsers[0]._id,
        text: "Love the energy. Let's prioritize by user impact and engineering effort matrix.",
        createdAt: new Date(now - 20 * day + 4 * hour),
      },
      {
        sender: allUsers[6]._id,
        text: "Feature flags are now integrated. We can ship dark/light toggle without a release!",
        createdAt: new Date(now - 19 * day),
        reactions: [{ emoji: "🚀", users: [allUsers[0]._id, allUsers[2]._id] }],
      },
      {
        sender: allUsers[7]._id,
        text: "DataLoader pattern implemented for GraphQL. N+1 queries eliminated. Response time -60%.",
        createdAt: new Date(now - 19 * day + hour),
      },
    ];

    for (const msg of boardMsgs) {
      msgs.push({ ...msg, project: projectBoard._id, workspace: workspace._id });
    }

    // Auth project messages
    const authMsgs = [
      {
        sender: allUsers[1]._id,
        text: "Auth sprint kicked off. JWT rotation is the highest priority this week.",
        createdAt: new Date(now - 10 * day),
      },
      {
        sender: allUsers[3]._id,
        text: "RBAC permission matrix finalized. I'll start on the middleware tomorrow.",
        createdAt: new Date(now - 10 * day + hour),
      },
      {
        sender: allUsers[1]._id,
        text: "Remember: viewers should never hit write endpoints. Validate at middleware level.",
        createdAt: new Date(now - 10 * day + 2 * hour),
      },
      {
        sender: allUsers[8]._id,
        text: "Zod validation schemas are done for all auth routes. 100% type-safe inputs.",
        createdAt: new Date(now - 9 * day),
      },
      {
        sender: allUsers[1]._id,
        text: "Excellent! Zod + TypeScript is game-changing for API contracts.",
        createdAt: new Date(now - 9 * day + hour),
      },
      {
        sender: allUsers[3]._id,
        text: "Stripe integration PR ready. Tested with all card types including declined cards.",
        createdAt: new Date(now - 5 * day),
      },
      {
        sender: allUsers[1]._id,
        text: "Make sure webhook signature verification is bulletproof. PCI compliance depends on it.",
        createdAt: new Date(now - 5 * day + hour),
      },
      {
        sender: allUsers[0]._id,
        text: "New workspace members must go through onboarding wizard before accessing projects.",
        createdAt: new Date(now - 22 * day),
      },
      {
        sender: allUsers[3]._id,
        text: "Password strength validator now uses zxcvbn. Entropy-based scoring instead of naive rules.",
        createdAt: new Date(now - 21 * day),
        reactions: [{ emoji: "💪", users: [allUsers[1]._id] }],
      },
      {
        sender: allUsers[1]._id,
        text: "OAuth2 PKCE flow is live for GitHub and Google. Removed implicit flow entirely.",
        createdAt: new Date(now - 20 * day),
      },
      {
        sender: allUsers[8]._id,
        text: "CSP headers configured. Sentry reports zero XSS violations in the last week.",
        createdAt: new Date(now - 18 * day),
        reactions: [{ emoji: "🛡️", users: [allUsers[1]._id, allUsers[3]._id] }],
      },
      {
        sender: allUsers[3]._id,
        text: "MFA recovery codes generated on 2FA setup. Users must store them in their password manager.",
        createdAt: new Date(now - 15 * day),
      },
      {
        sender: allUsers[1]._id,
        text: "Audit log is capturing all auth events: login, logout, password change, token revocation.",
        createdAt: new Date(now - 12 * day),
      },
      {
        sender: allUsers[0]._id,
        text: "Compliance report generated. We're SOC 2 Type I ready. External audit next quarter.",
        createdAt: new Date(now - 10 * day + 3 * hour),
        reactions: [
          {
            emoji: "🎯",
            users: [allUsers[1]._id, allUsers[3]._id, allUsers[4]._id],
          },
        ],
      },
    ];
    for (const msg of authMsgs) {
      msgs.push({ ...msg, project: projectAuth._id, workspace: workspace._id });
    }

    // Frontend project messages
    const frontendMsgs = [
      {
        sender: allUsers[2]._id,
        text: "Design system kickoff! Starting with the color tokens and typography scale.",
        createdAt: new Date(now - 12 * day),
      },
      {
        sender: allUsers[5]._id,
        text: "Can we use CSS variables for color tokens? Makes theming much easier.",
        createdAt: new Date(now - 12 * day + hour),
      },
      {
        sender: allUsers[2]._id,
        text: "Absolutely! Tailwind + CSS variables combo is what we're going with.",
        createdAt: new Date(now - 12 * day + 2 * hour),
      },
      {
        sender: allUsers[2]._id,
        text: "TanStack Query integration is saving us SO much code. No more manual loading states!",
        createdAt: new Date(now - 8 * day),
        reactions: [{ emoji: "💯", users: [allUsers[5]._id] }],
      },
      {
        sender: allUsers[5]._id,
        text: "Web Vitals optimization pushed LCP from 4.2s to 1.8s. Under the 2.5s threshold! 🎯",
        createdAt: new Date(now - 6 * day),
        reactions: [
          { emoji: "🚀", users: [allUsers[2]._id, allUsers[0]._id] },
        ],
      },
      {
        sender: allUsers[2]._id,
        text: "RTL (React Testing Library) tests written for all 24 components. Coverage at 87%.",
        createdAt: new Date(now - 3 * day),
      },
      {
        sender: allUsers[5]._id,
        text: "Virtual scrolling added to the task list. Renders 10k tasks at 60fps now. 🎮",
        createdAt: new Date(now - 25 * day),
        reactions: [{ emoji: "⚡", users: [allUsers[2]._id] }],
      },
      {
        sender: allUsers[2]._id,
        text: "Code splitting by route is live. Initial JS bundle down from 1.2MB to 340KB. 🎉",
        createdAt: new Date(now - 23 * day),
        reactions: [
          { emoji: "🔥", users: [allUsers[0]._id, allUsers[5]._id] },
        ],
      },
      {
        sender: allUsers[5]._id,
        text: "Font subsetting applied. WOFF2 fonts are 60% smaller. TTI improved by 400ms.",
        createdAt: new Date(now - 21 * day),
      },
      {
        sender: allUsers[2]._id,
        text: "Playwright E2E tests cover the critical path: login → create task → assign → complete. ✅",
        createdAt: new Date(now - 18 * day),
      },
      {
        sender: allUsers[5]._id,
        text: "Drag-and-drop in Kanban is buttery smooth with @dnd-kit. No more jank on Firefox.",
        createdAt: new Date(now - 16 * day),
        reactions: [{ emoji: "✨", users: [allUsers[2]._id, allUsers[0]._id] }],
      },
      {
        sender: allUsers[2]._id,
        text: "All modals are now focus-trapped and keyboard-navigable. Screen reader tested. ♿",
        createdAt: new Date(now - 14 * day + 3 * hour),
      },
      {
        sender: allUsers[5]._id,
        text: "Vite HMR with React Fast Refresh is incredible. Sub-100ms hot reload every time.",
        createdAt: new Date(now - 13 * day),
      },
      {
        sender: allUsers[2]._id,
        text: "The AI Sprint Planner UI is complete. Streaming response with typewriter effect looks amazing!",
        createdAt: new Date(now - 11 * day),
        reactions: [
          {
            emoji: "🤖",
            users: [allUsers[0]._id, allUsers[1]._id, allUsers[5]._id],
          },
        ],
      },
    ];
    for (const msg of frontendMsgs) {
      msgs.push({
        ...msg,
        project: projectFrontend._id,
        workspace: workspace._id,
      });
    }

    // Infrastructure project messages
    const infraMsgs = [
      {
        sender: allUsers[4]._id,
        text: "Infra sprint: CI/CD pipelines, K8s scaling, and monitoring stack. Let's go.",
        createdAt: new Date(now - 25 * day),
      },
      {
        sender: allUsers[8]._id,
        text: "GitHub Actions pipelines now run in under 4 minutes. Parallel test execution FTW.",
        createdAt: new Date(now - 24 * day),
        reactions: [{ emoji: "⚡", users: [allUsers[4]._id] }],
      },
      {
        sender: allUsers[4]._id,
        text: "K8s HPA is live. Pod count scales from 2→16 based on CPU. Tested under synthetic load.",
        createdAt: new Date(now - 23 * day),
      },
      {
        sender: allUsers[6]._id,
        text: "Grafana dashboard is live! CPU, Memory, Network, API latency — all tracked.",
        createdAt: new Date(now - 22 * day),
        reactions: [{ emoji: "📊", users: [allUsers[4]._id, allUsers[0]._id] }],
      },
      {
        sender: allUsers[4]._id,
        text: "Container images reduced from 1.2GB to 180MB using multi-stage builds. Cold starts are fast now.",
        createdAt: new Date(now - 21 * day + hour),
      },
      {
        sender: allUsers[8]._id,
        text: "Vulnerability scanner added to CI. It will block deploys with CRITICAL CVEs automatically.",
        createdAt: new Date(now - 19 * day),
        reactions: [{ emoji: "🔒", users: [allUsers[4]._id] }],
      },
      {
        sender: allUsers[4]._id,
        text: "WAF rules configured on CloudFront. SQL injection and XSS attempts now auto-blocked.",
        createdAt: new Date(now - 17 * day),
      },
      {
        sender: allUsers[6]._id,
        text: "Alerting rules set: PagerDuty fires if P99 > 500ms for > 5 min. On-call rotation updated.",
        createdAt: new Date(now - 15 * day + 2 * hour),
      },
      {
        sender: allUsers[4]._id,
        text: "Blue/green deployments are configured. Zero-downtime releases are now standard.",
        createdAt: new Date(now - 13 * day + hour),
        reactions: [
          { emoji: "🎯", users: [allUsers[0]._id, allUsers[8]._id] },
        ],
      },
      {
        sender: allUsers[8]._id,
        text: "Chaos engineering test #1 complete: killed 2 API pods randomly. Traffic rerouted in 8 seconds.",
        createdAt: new Date(now - 11 * day + 3 * hour),
        reactions: [
          { emoji: "💪", users: [allUsers[4]._id, allUsers[0]._id] },
        ],
      },
      {
        sender: allUsers[4]._id,
        text: "Redis Cluster is now 3-node with auto-failover. Tested failover: 2s downtime. Acceptable.",
        createdAt: new Date(now - 9 * day + 3 * hour),
      },
      {
        sender: allUsers[6]._id,
        text: "Incident runbooks added to the wiki. Every on-call scenario now has a documented playbook.",
        createdAt: new Date(now - 7 * day + 3 * hour),
      },
    ];
    for (const msg of infraMsgs) {
      msgs.push({
        ...msg,
        project: projectInfra._id,
        workspace: workspace._id,
      });
    }

    await Message.insertMany(msgs);
    console.log(`✅ Inserted ${msgs.length} additional messages.`);

    console.log("✅ Extended seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Extended seed error:", err);
    process.exit(1);
  }
};

seedExtended();

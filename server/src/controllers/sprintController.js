import { GoogleGenerativeAI } from "@google/generative-ai";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { logPulseEvent } from "../services/pulseService.js";
import { notifyWorkspaceMembers } from "./notificationController.js";

const MAX_RETRIES = 2;
const TIMEOUT_MS = 12000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sanitizeResponse(text) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function isRetryable(error) {
  const msg = error.message || "";
  if (msg.includes("429") || msg.includes("quota") || msg.includes("Quota")) return false;
  return true;
}

async function callGeminiWithTimeout(model, promptText) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Gemini request timed out")), TIMEOUT_MS)
  );
  return Promise.race([model.generateContent(promptText), timeout]);
}

// ─── Fallback Sprint Builder ──────────────────────────────────────────────────

function buildFallbackSprint(prompt) {
  const p = prompt.toLowerCase();

  // ── Food Delivery ────────────────────────────────────────────────────────
  if (p.includes("food") || p.includes("delivery") || p.includes("restaurant") || p.includes("zomato") || p.includes("swiggy")) {
    return {
      projectType: "food delivery app",
      milestones: [
        { name: "Foundation", description: "Auth, DB schema, and server setup", order: 1 },
        { name: "Core Features", description: "Restaurants, menus, cart, and order flow", order: 2 },
        { name: "Polish & Launch", description: "Payments, tracking, admin, and deployment", order: 3 },
      ],
      tasks: [
        {
          title: "Set up Express server with MongoDB",
          description: "Initialize Node.js project, install Express and Mongoose, configure dotenv, connect to MongoDB Atlas, and add CORS + Morgan middleware.",
          priority: "high", milestone: "Foundation", labels: ["backend", "infrastructure"],
          subtasks: ["Install dependencies", "Configure dotenv", "Connect MongoDB Atlas", "Add CORS middleware"],
          timeline: "Day 1", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Design MongoDB schemas",
          description: "Create Mongoose models for User, Restaurant, MenuItem, Order, and Cart with proper field validation, indexes, and relationships.",
          priority: "high", milestone: "Foundation", labels: ["backend", "database"],
          subtasks: ["User model", "Restaurant model", "MenuItem model", "Order model", "Cart model"],
          timeline: "Day 1-2", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Implement user authentication",
          description: "Build register and login endpoints with bcrypt password hashing, JWT token issuance, and auth middleware for protected routes. Support both customer and restaurant-owner roles.",
          priority: "high", milestone: "Foundation", labels: ["backend", "auth"],
          subtasks: ["Register endpoint", "Login endpoint", "JWT middleware", "Role-based access"],
          timeline: "Day 2-3", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Build authentication UI screens",
          description: "Create login, register, and forgot-password screens with form validation, error toasts, and redirect logic. Store JWT in localStorage and attach to all API calls.",
          priority: "high", milestone: "Foundation", labels: ["frontend", "auth"],
          subtasks: ["Login form", "Register form", "JWT storage", "Axios interceptor for token"],
          timeline: "Day 3-4", suggestedOwner: "Frontend Dev", status: "todo",
        },
        {
          title: "Restaurant CRUD API",
          description: "Build endpoints for restaurant owners to create, update, and delete their restaurant profile including name, cuisine type, address, opening hours, and cover image upload.",
          priority: "high", milestone: "Core Features", labels: ["backend", "restaurants"],
          subtasks: ["Create restaurant", "Update restaurant", "Delete restaurant", "Get restaurant by ID", "Image upload"],
          timeline: "Day 5-6", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Menu management system",
          description: "Allow restaurant owners to add, edit, and categorize menu items with name, description, price, image, and availability toggle. Support categories like Starters, Mains, Desserts.",
          priority: "high", milestone: "Core Features", labels: ["backend", "menu"],
          subtasks: ["Add menu item", "Edit menu item", "Toggle availability", "Organize by category"],
          timeline: "Day 6-7", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Restaurant listing and search UI",
          description: "Build the home screen with restaurant cards showing rating, delivery time, and cuisine. Add search by name/cuisine and filter by rating, price range, and delivery time.",
          priority: "high", milestone: "Core Features", labels: ["frontend", "restaurants"],
          subtasks: ["Restaurant card component", "Search bar", "Filter panel", "Fetch from API"],
          timeline: "Day 7-8", suggestedOwner: "Frontend Dev", status: "todo",
        },
        {
          title: "Cart system",
          description: "Implement add-to-cart, remove item, update quantity, and clear cart functionality. Enforce single-restaurant rule (warn user if they add from a different restaurant). Persist cart in Redux or Context.",
          priority: "high", milestone: "Core Features", labels: ["frontend", "cart"],
          subtasks: ["Add/remove items", "Quantity controls", "Single restaurant guard", "Cart persistence"],
          timeline: "Day 9-10", suggestedOwner: "Frontend Dev", status: "todo",
        },
        {
          title: "Order placement and management API",
          description: "Create order endpoint that validates cart, calculates totals, deducts stock if applicable, saves order with status 'pending', and notifies the restaurant. Support order status transitions: pending → confirmed → preparing → out_for_delivery → delivered.",
          priority: "high", milestone: "Core Features", labels: ["backend", "orders"],
          subtasks: ["Place order endpoint", "Status update endpoint", "Order history endpoint", "Restaurant notification"],
          timeline: "Day 10-11", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Payment integration",
          description: "Integrate Razorpay or Stripe for checkout. Handle payment order creation, webhook verification, and update order status to 'paid' on success. Add failed-payment rollback logic.",
          priority: "high", milestone: "Polish & Launch", labels: ["backend", "payments"],
          subtasks: ["Payment gateway setup", "Checkout endpoint", "Webhook handler", "Failure rollback"],
          timeline: "Day 12-13", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Real-time order tracking",
          description: "Use Socket.IO to emit order status updates to the customer's room as the restaurant changes status. Show a live progress stepper on the order detail screen.",
          priority: "medium", milestone: "Polish & Launch", labels: ["backend", "frontend", "realtime"],
          subtasks: ["Socket room per order", "Status change emit", "Progress stepper UI", "ETA display"],
          timeline: "Day 14", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Admin dashboard",
          description: "Build a simple admin panel showing total orders, revenue, active restaurants, and user counts. Add ability to suspend restaurants and view dispute orders.",
          priority: "low", milestone: "Polish & Launch", labels: ["frontend", "admin"],
          subtasks: ["Analytics overview", "Restaurant management table", "Order dispute view"],
          timeline: "Day 15", suggestedOwner: "Frontend Dev", status: "todo",
        },
        {
          title: "Deployment and CI setup",
          description: "Deploy backend to Railway or Render with environment variables configured. Deploy frontend to Vercel. Set up MongoDB Atlas production cluster, configure CORS for prod domain, and add a GitHub Actions CI pipeline.",
          priority: "high", milestone: "Polish & Launch", labels: ["devops", "deployment"],
          subtasks: ["Backend deploy (Railway/Render)", "Frontend deploy (Vercel)", "Env vars config", "CI pipeline"],
          timeline: "Day 16", suggestedOwner: "DevOps", status: "todo",
        },
      ],
    };
  }

  // ── E-commerce ───────────────────────────────────────────────────────────
  if (p.includes("ecommerce") || p.includes("e-commerce") || p.includes("shop") || p.includes("store") || p.includes("marketplace") || p.includes("product")) {
    return {
      projectType: "e-commerce platform",
      milestones: [
        { name: "Foundation", description: "Auth, product catalog, and DB setup", order: 1 },
        { name: "Shopping Experience", description: "Cart, checkout, and payment", order: 2 },
        { name: "Launch Ready", description: "Orders, admin, and deployment", order: 3 },
      ],
      tasks: [
        {
          title: "Backend scaffolding and auth",
          description: "Set up Express server, Mongoose connection, and implement JWT-based auth with register/login. Add role middleware to distinguish shoppers from sellers.",
          priority: "high", milestone: "Foundation", labels: ["backend", "auth"],
          subtasks: ["Express setup", "MongoDB connect", "Register/Login API", "Role middleware"],
          timeline: "Day 1-2", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Product catalog API",
          description: "Build CRUD endpoints for products with fields: name, description, price, stock, category, images, and seller. Add pagination, sorting, and category filtering.",
          priority: "high", milestone: "Foundation", labels: ["backend", "products"],
          subtasks: ["Product model", "CRUD endpoints", "Pagination", "Category filter"],
          timeline: "Day 2-3", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Product listing UI",
          description: "Build product grid with search, filter by category/price, and sort by newest/price. Each card shows image, name, price, and rating. Implement infinite scroll or pagination.",
          priority: "high", milestone: "Foundation", labels: ["frontend", "products"],
          subtasks: ["Product grid", "Search + filter", "Sort options", "Pagination UI"],
          timeline: "Day 3-5", suggestedOwner: "Frontend Dev", status: "todo",
        },
        {
          title: "Cart and wishlist",
          description: "Persistent cart stored in backend per user. Support add, remove, update quantity. Wishlist with toggle. Show cart item count in navbar badge.",
          priority: "high", milestone: "Shopping Experience", labels: ["frontend", "backend", "cart"],
          subtasks: ["Cart API", "Wishlist API", "Cart UI", "Navbar badge"],
          timeline: "Day 6-7", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Checkout and payment",
          description: "Multi-step checkout: address → review → payment. Integrate Stripe or Razorpay. On success, create order and clear cart. Send confirmation email via Nodemailer.",
          priority: "high", milestone: "Shopping Experience", labels: ["backend", "payments"],
          subtasks: ["Checkout flow UI", "Payment gateway", "Order creation", "Email confirmation"],
          timeline: "Day 8-10", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Order management",
          description: "Customer order history with status tracking. Seller dashboard showing incoming orders. Admin can update order status (processing, shipped, delivered, refunded).",
          priority: "medium", milestone: "Launch Ready", labels: ["backend", "orders"],
          subtasks: ["Order history API", "Seller order view", "Status update", "Admin override"],
          timeline: "Day 11-12", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Product reviews and ratings",
          description: "Allow verified buyers to post 1-5 star reviews with text. Calculate aggregate rating per product. Display reviews sorted by helpful votes.",
          priority: "medium", milestone: "Launch Ready", labels: ["backend", "frontend"],
          subtasks: ["Review model", "Post review API", "Rating calculation", "Review display UI"],
          timeline: "Day 13", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Admin panel and deployment",
          description: "Admin dashboard with sales metrics, user management, and product moderation. Deploy to Vercel + Railway, configure CDN for images, and set up error monitoring with Sentry.",
          priority: "high", milestone: "Launch Ready", labels: ["admin", "devops"],
          subtasks: ["Sales metrics UI", "User management", "Deployment", "Error monitoring"],
          timeline: "Day 14-15", suggestedOwner: "Full Stack Dev", status: "todo",
        },
      ],
    };
  }

  // ── Chat App ─────────────────────────────────────────────────────────────
  if (p.includes("chat") || p.includes("messaging") || p.includes("realtime") || p.includes("socket") || p.includes("slack") || p.includes("discord")) {
    return {
      projectType: "real-time chat application",
      milestones: [
        { name: "Foundation", description: "Auth, user profiles, and socket setup", order: 1 },
        { name: "Messaging Core", description: "DMs, channels, and real-time delivery", order: 2 },
        { name: "Rich Features", description: "Media, reactions, notifications, deploy", order: 3 },
      ],
      tasks: [
        {
          title: "Server and Socket.IO initialization",
          description: "Set up Express + Socket.IO server with CORS configured for the client origin. Implement connection/disconnect logging and room-based architecture for channels.",
          priority: "high", milestone: "Foundation", labels: ["backend", "sockets"],
          subtasks: ["Express + Socket.IO setup", "CORS config", "Connection logging", "Room architecture"],
          timeline: "Day 1", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Auth with JWT and socket auth middleware",
          description: "Register/login API with bcrypt + JWT. Validate JWT on socket handshake using Socket.IO middleware so only authenticated users can connect.",
          priority: "high", milestone: "Foundation", labels: ["backend", "auth"],
          subtasks: ["Auth API", "JWT issuance", "Socket auth middleware"],
          timeline: "Day 1-2", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "User presence and online status",
          description: "Track connected sockets per user. Broadcast online/offline status changes to contacts. Show green dot on avatars for online users.",
          priority: "high", milestone: "Foundation", labels: ["backend", "frontend", "presence"],
          subtasks: ["Presence map", "Status broadcast", "Online indicator UI"],
          timeline: "Day 2-3", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Direct messaging",
          description: "Implement one-on-one DM rooms. Messages stored in MongoDB with sender, receiver, text, timestamp. Deliver real-time via Socket.IO room. Show read receipts.",
          priority: "high", milestone: "Messaging Core", labels: ["backend", "frontend", "dms"],
          subtasks: ["Message model", "DM room logic", "Send/receive events", "Read receipt"],
          timeline: "Day 4-5", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Channels / group rooms",
          description: "Create named channels that users can join. Channel messages broadcast to all members. Support channel creation, renaming, member management, and message history pagination.",
          priority: "high", milestone: "Messaging Core", labels: ["backend", "frontend", "channels"],
          subtasks: ["Channel model", "Join/leave events", "Message broadcast", "History API"],
          timeline: "Day 6-7", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Typing indicators",
          description: "Emit typing-start / typing-stop events per conversation. Debounce on frontend (stop after 2s of inactivity). Display '...' animation under conversation.",
          priority: "medium", milestone: "Messaging Core", labels: ["frontend", "sockets"],
          subtasks: ["Typing events", "Debounce logic", "Typing animation UI"],
          timeline: "Day 8", suggestedOwner: "Frontend Dev", status: "todo",
        },
        {
          title: "Message reactions and emoji",
          description: "Allow users to react to messages with emoji. Store reactions as {emoji, userId} array on message. Update in real-time via socket. Show aggregated reaction counts.",
          priority: "medium", milestone: "Rich Features", labels: ["frontend", "backend"],
          subtasks: ["Reaction model", "React API", "Real-time sync", "Reaction display UI"],
          timeline: "Day 9-10", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "File and image sharing",
          description: "Allow users to send images and files in chat. Upload to Cloudinary or S3. Show image preview inline, file downloads as attachments. Enforce 10MB size limit.",
          priority: "medium", milestone: "Rich Features", labels: ["backend", "frontend", "media"],
          subtasks: ["Cloudinary/S3 setup", "Upload endpoint", "Inline image preview", "File attachment UI"],
          timeline: "Day 11-12", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Push notifications and deployment",
          description: "Add browser push notifications for new messages when tab is not focused. Deploy backend to Railway, frontend to Vercel. Configure production env vars and SSL.",
          priority: "low", milestone: "Rich Features", labels: ["frontend", "devops"],
          subtasks: ["Push notification API", "Notification permission UI", "Deploy backend", "Deploy frontend"],
          timeline: "Day 13-14", suggestedOwner: "DevOps", status: "todo",
        },
      ],
    };
  }

  // ── SaaS / Dashboard ─────────────────────────────────────────────────────
  if (p.includes("saas") || p.includes("dashboard") || p.includes("analytics") || p.includes("subscription") || p.includes("billing") || p.includes("b2b")) {
    return {
      projectType: "SaaS platform",
      milestones: [
        { name: "Foundation", description: "Auth, multi-tenancy, and billing setup", order: 1 },
        { name: "Core Product", description: "Main features and dashboard", order: 2 },
        { name: "Growth Ready", description: "Analytics, integrations, and scaling", order: 3 },
      ],
      tasks: [
        {
          title: "Multi-tenant auth with organizations",
          description: "Build auth supporting organizations (tenants). Each user belongs to an org. JWT encodes orgId. Middleware scopes all DB queries to the user's org to ensure data isolation.",
          priority: "high", milestone: "Foundation", labels: ["backend", "auth", "multi-tenancy"],
          subtasks: ["Org model", "User-org relationship", "Org-scoped middleware", "Invite system"],
          timeline: "Day 1-3", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Subscription and billing with Stripe",
          description: "Integrate Stripe Billing with Free, Pro, and Enterprise plans. Handle subscription creation, upgrades/downgrades, cancellations, and webhook events for payment_succeeded and invoice_failed.",
          priority: "high", milestone: "Foundation", labels: ["backend", "billing"],
          subtasks: ["Stripe setup", "Plan management", "Webhook handler", "Usage limits enforcement"],
          timeline: "Day 3-5", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Analytics dashboard",
          description: "Build main dashboard showing key metrics: active users, revenue MRR, feature usage graphs, and churn rate. Use Chart.js or Recharts. Data fetched from aggregated MongoDB pipelines.",
          priority: "high", milestone: "Core Product", labels: ["frontend", "analytics"],
          subtasks: ["Metrics API", "Chart components", "Date range filter", "Export to CSV"],
          timeline: "Day 6-8", suggestedOwner: "Frontend Dev", status: "todo",
        },
        {
          title: "Team management and RBAC",
          description: "Allow org admins to invite members via email, assign roles (Admin, Member, Viewer), and revoke access. Enforce role-based permissions on all API endpoints.",
          priority: "high", milestone: "Core Product", labels: ["backend", "frontend", "rbac"],
          subtasks: ["Invite via email", "Role assignment", "Permission middleware", "Team settings UI"],
          timeline: "Day 9-10", suggestedOwner: "Full Stack Dev", status: "todo",
        },
        {
          title: "Audit log",
          description: "Record all significant actions (login, data export, settings change, member invite) with actor, action, and timestamp. Display searchable audit log in settings for admins.",
          priority: "medium", milestone: "Core Product", labels: ["backend", "compliance"],
          subtasks: ["Audit log model", "Action logging middleware", "Audit log UI"],
          timeline: "Day 11", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Third-party integrations",
          description: "Build integration framework to connect with Slack, GitHub, or Zapier. OAuth2 connection flow, webhook delivery, and integration health monitoring.",
          priority: "medium", milestone: "Growth Ready", labels: ["backend", "integrations"],
          subtasks: ["OAuth flow", "Webhook delivery", "Integration settings UI"],
          timeline: "Day 12-13", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Performance and deployment",
          description: "Add Redis caching for frequent dashboard queries. Deploy to AWS ECS or Railway with auto-scaling. Set up Datadog or New Relic for APM. Configure CloudFront CDN for frontend.",
          priority: "high", milestone: "Growth Ready", labels: ["devops", "performance"],
          subtasks: ["Redis caching", "ECS/Railway deploy", "APM setup", "CDN config"],
          timeline: "Day 14-15", suggestedOwner: "DevOps", status: "todo",
        },
      ],
    };
  }

  // ── Mobile App ───────────────────────────────────────────────────────────
  if (p.includes("mobile") || p.includes("react native") || p.includes("flutter") || p.includes("ios") || p.includes("android") || p.includes("app")) {
    return {
      projectType: "mobile application",
      milestones: [
        { name: "Setup & Auth", description: "Project scaffolding, navigation, and auth screens", order: 1 },
        { name: "Core Features", description: "Main app screens and API integration", order: 2 },
        { name: "Polish & Store Release", description: "Performance, testing, and app store submission", order: 3 },
      ],
      tasks: [
        {
          title: "Project setup and navigation structure",
          description: "Initialize React Native / Flutter project. Set up tab and stack navigation. Configure theme (fonts, colors, spacing). Add splash screen and app icon assets.",
          priority: "high", milestone: "Setup & Auth", labels: ["mobile", "setup"],
          subtasks: ["Project init", "Navigation setup", "Theme config", "Splash screen"],
          timeline: "Day 1", suggestedOwner: "Mobile Dev", status: "todo",
        },
        {
          title: "Auth screens and token management",
          description: "Build login, register, and onboarding screens. Store JWT securely using SecureStore / Keychain. Handle token refresh and auto-logout on expiry.",
          priority: "high", milestone: "Setup & Auth", labels: ["mobile", "auth"],
          subtasks: ["Login screen", "Register screen", "Secure token storage", "Auto-refresh logic"],
          timeline: "Day 2-3", suggestedOwner: "Mobile Dev", status: "todo",
        },
        {
          title: "Backend API setup",
          description: "Set up Node.js + Express backend with MongoDB. Create user auth endpoints. Configure CORS for mobile clients. Add rate limiting to prevent abuse.",
          priority: "high", milestone: "Setup & Auth", labels: ["backend"],
          subtasks: ["Express setup", "Auth endpoints", "CORS config", "Rate limiting"],
          timeline: "Day 2-3", suggestedOwner: "Backend Dev", status: "todo",
        },
        {
          title: "Core feature screens",
          description: "Build the primary app screens based on product requirements. Connect to API with loading states, error handling, and pull-to-refresh. Use FlatList for performant list rendering.",
          priority: "high", milestone: "Core Features", labels: ["mobile", "features"],
          subtasks: ["Main screen", "Detail screen", "API integration", "Pull-to-refresh"],
          timeline: "Day 4-7", suggestedOwner: "Mobile Dev", status: "todo",
        },
        {
          title: "Push notifications",
          description: "Integrate Firebase Cloud Messaging (FCM) for push notifications. Store device tokens in backend. Send targeted notifications from server. Handle foreground and background notification states.",
          priority: "medium", milestone: "Core Features", labels: ["mobile", "notifications"],
          subtasks: ["FCM setup", "Token registration", "Server-side send", "Notification handlers"],
          timeline: "Day 8-9", suggestedOwner: "Mobile Dev", status: "todo",
        },
        {
          title: "Offline support and caching",
          description: "Cache API responses with AsyncStorage or MMKV. Show stale data with 'offline' badge when network is unavailable. Sync pending changes when connectivity is restored.",
          priority: "medium", milestone: "Core Features", labels: ["mobile", "offline"],
          subtasks: ["Response caching", "Offline detection", "Sync-on-reconnect"],
          timeline: "Day 10-11", suggestedOwner: "Mobile Dev", status: "todo",
        },
        {
          title: "Performance optimization and testing",
          description: "Profile with Flipper, fix re-render issues with memo/useCallback, reduce bundle size. Write unit tests with Jest and E2E tests with Detox for critical flows.",
          priority: "high", milestone: "Polish & Store Release", labels: ["mobile", "testing"],
          subtasks: ["Flipper profiling", "Memoization fixes", "Jest unit tests", "Detox E2E tests"],
          timeline: "Day 12-13", suggestedOwner: "Mobile Dev", status: "todo",
        },
        {
          title: "App store submission",
          description: "Generate signed APK/AAB for Android and IPA for iOS. Write store descriptions, screenshots, and privacy policy. Submit to Google Play and App Store for review.",
          priority: "high", milestone: "Polish & Store Release", labels: ["mobile", "release"],
          subtasks: ["Android build signing", "iOS build signing", "Store listing assets", "Submit for review"],
          timeline: "Day 14-15", suggestedOwner: "Mobile Dev", status: "todo",
        },
      ],
    };
  }

  // ── Generic fallback — still believable for any project ──────────────────
  const projectHint = prompt.slice(0, 50).trim();
  return {
    projectType: projectHint || "software project",
    milestones: [
      { name: "Setup", description: "Project scaffolding, tooling, and data modeling", order: 1 },
      { name: "Features", description: "Core feature implementation and API integration", order: 2 },
      { name: "Deploy", description: "Testing, bug fixing, and production deployment", order: 3 },
    ],
    tasks: [
      {
        title: `Plan architecture for: ${projectHint}`,
        description: "Define system components, data flow, API contracts, and technology choices. Document decisions in a short architecture README.",
        priority: "high", milestone: "Setup", labels: ["planning"],
        subtasks: ["Component diagram", "API contract draft", "Tech stack decision", "README"],
        timeline: "Day 1", suggestedOwner: "Tech Lead", status: "todo",
      },
      {
        title: "Development environment and CI setup",
        description: "Initialize repository, configure ESLint + Prettier, set up .env template, and add a basic GitHub Actions CI pipeline that runs lint and tests on every PR.",
        priority: "high", milestone: "Setup", labels: ["devops", "tooling"],
        subtasks: ["Repo init", "ESLint/Prettier", ".env template", "CI pipeline"],
        timeline: "Day 1", suggestedOwner: "DevOps", status: "todo",
      },
      {
        title: "Database schema design",
        description: "Design MongoDB/PostgreSQL schema for all core entities. Define relationships, indexes, and validation rules. Seed development database with realistic test data.",
        priority: "high", milestone: "Setup", labels: ["backend", "database"],
        subtasks: ["Entity diagram", "Schema definitions", "Index planning", "Seed data"],
        timeline: "Day 2", suggestedOwner: "Backend Dev", status: "todo",
      },
      {
        title: "Authentication and authorization",
        description: "Implement secure user registration, login, and session management with JWT. Add password hashing with bcrypt and role-based access control middleware.",
        priority: "high", milestone: "Setup", labels: ["backend", "auth"],
        subtasks: ["Register/Login API", "JWT middleware", "RBAC middleware"],
        timeline: "Day 2-3", suggestedOwner: "Backend Dev", status: "todo",
      },
      {
        title: "Core API endpoints",
        description: "Build the primary REST API endpoints covering main resource CRUD operations. Include input validation with Zod/Joi, error handling middleware, and standardized response format.",
        priority: "high", milestone: "Features", labels: ["backend", "api"],
        subtasks: ["CRUD endpoints", "Input validation", "Error middleware", "Response format"],
        timeline: "Day 4-6", suggestedOwner: "Backend Dev", status: "todo",
      },
      {
        title: "Frontend scaffolding and routing",
        description: "Set up React/Next.js project with routing, global state management (Redux or Zustand), API client (Axios with interceptors), and CSS framework configuration.",
        priority: "high", milestone: "Features", labels: ["frontend"],
        subtasks: ["Project init", "Routing setup", "State management", "API client"],
        timeline: "Day 4-5", suggestedOwner: "Frontend Dev", status: "todo",
      },
      {
        title: "Main feature UI implementation",
        description: "Build the core user-facing screens connecting to the API. Implement loading, empty, and error states for all data-fetching components. Ensure responsive design across breakpoints.",
        priority: "high", milestone: "Features", labels: ["frontend"],
        subtasks: ["Primary screens", "Loading/error states", "Responsive layout", "API integration"],
        timeline: "Day 6-9", suggestedOwner: "Frontend Dev", status: "todo",
      },
      {
        title: "Testing suite",
        description: "Write unit tests for critical business logic, integration tests for API endpoints, and basic E2E tests for primary user flows. Target 60%+ code coverage for backend.",
        priority: "medium", milestone: "Deploy", labels: ["testing", "quality"],
        subtasks: ["Unit tests", "API integration tests", "E2E tests", "Coverage report"],
        timeline: "Day 10-11", suggestedOwner: "QA Engineer", status: "todo",
      },
      {
        title: "Production deployment",
        description: "Deploy backend to Railway or Render, frontend to Vercel or Netlify. Configure production environment variables, SSL certificates, custom domain, and set up error monitoring with Sentry.",
        priority: "high", milestone: "Deploy", labels: ["devops", "deployment"],
        subtasks: ["Backend deploy", "Frontend deploy", "Env vars", "Error monitoring", "Domain + SSL"],
        timeline: "Day 12-13", suggestedOwner: "DevOps", status: "todo",
      },
    ],
  };
}

function decorateSprintWithDependencies(sprint) {
  if (!sprint || !Array.isArray(sprint.tasks)) return sprint;

  sprint.tasks = sprint.tasks.map((task, index) => {
    const deployOrder = task.deployOrder || (index + 1);
    let reviewStage = task.reviewStage || "";
    if (!reviewStage) {
      const lowerTitle = task.title.toLowerCase();
      if (lowerTitle.includes("auth") || lowerTitle.includes("payment") || lowerTitle.includes("api") || lowerTitle.includes("server") || lowerTitle.includes("database") || lowerTitle.includes("db")) {
        reviewStage = "PR Review & CI Validation";
      } else if (lowerTitle.includes("ui") || lowerTitle.includes("screen") || lowerTitle.includes("design") || lowerTitle.includes("frontend")) {
        reviewStage = "Local QA & Cross-Browser Check";
      } else if (lowerTitle.includes("deploy") || lowerTitle.includes("ci") || lowerTitle.includes("cd")) {
        reviewStage = "Staging Verify & Release Review";
      } else {
        reviewStage = "PR Review";
      }
    }

    let dependencies = Array.isArray(task.dependencies) ? [...task.dependencies] : [];
    let blockers = Array.isArray(task.blockers) ? [...task.blockers] : [];

    if (dependencies.length === 0 && index > 0) {
      const lowerTitle = task.title.toLowerCase();
      if (lowerTitle.includes("ui") || lowerTitle.includes("screen") || lowerTitle.includes("frontend") || lowerTitle.includes("client")) {
        for (let i = index - 1; i >= 0; i--) {
          const prevTitle = sprint.tasks[i].title.toLowerCase();
          if (prevTitle.includes("backend") || prevTitle.includes("server") || prevTitle.includes("api") || prevTitle.includes("auth") || prevTitle.includes("database")) {
            dependencies.push(sprint.tasks[i].title);
            blockers.push(sprint.tasks[i].title);
            break;
          }
        }
      }

      if (dependencies.length === 0) {
        for (let i = index - 1; i >= 0; i--) {
          if (sprint.tasks[i].milestone === task.milestone) {
            dependencies.push(sprint.tasks[i].title);
            if (sprint.tasks[i].priority === "high") {
              blockers.push(sprint.tasks[i].title);
            }
            break;
          }
        }
      }

      if (dependencies.length === 0 && index > 0) {
        dependencies.push(sprint.tasks[0].title);
      }
    }

    return {
      ...task,
      deployOrder,
      reviewStage,
      dependencies,
      blockers,
    };
  });

  return sprint;
}

// ─── Main Controller ──────────────────────────────────────────────────────────

export const generateSprint = async (req, res) => {
  const { prompt, projectId } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ success: false, message: "Prompt is required" });
  }
  if (!projectId) {
    return res.status(400).json({ success: false, message: "projectId is required" });
  }

  // No API key — skip directly to fallback
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "your_gemini_api_key_here") {
    console.warn("[Sprint] GEMINI_API_KEY not configured — using keyword fallback.");
    const fallback = buildFallbackSprint(prompt);
    const decorated = decorateSprintWithDependencies(fallback);
    return res.status(200).json({ success: true, isFallback: true, fallbackReason: "AI API key not configured", ...decorated });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const promptText = `
You are a senior engineering project manager. Generate a detailed, realistic sprint blueprint for the following project:

"${prompt}"

Return ONLY raw JSON — no markdown, no backticks, no extra text. The JSON must match this exact shape:

{
  "projectType": "short project type label",
  "epics": [
    { "name": "Authentication Epic", "description": "Implement robust user identity and access management" }
  ],
  "milestones": [
    { "name": "Foundation", "description": "Core infrastructure and auth", "order": 1 }
  ],
  "tasks": [
    {
      "title": "Set up Express server with MongoDB",
      "description": "Initialize Node.js project, configure Express middleware, connect to MongoDB Atlas, set up environment variables",
      "type": "Story",
      "epic": "Authentication Epic",
      "priority": "high",
      "complexity": "Medium",
      "estimates": "3 days",
      "milestone": "Foundation",
      "labels": ["backend", "infrastructure"],
      "subtasks": ["Install dependencies", "Configure dotenv", "Connect MongoDB", "Add CORS middleware"],
      "acceptanceCriteria": ["Server starts without errors", "Connects to MongoDB successfully"],
      "timeline": "Day 1",
      "suggestedOwner": "Backend Dev",
      "dependencies": [],
      "blockers": [],
      "reviewStage": "PR Review & CI Validation",
      "deployOrder": 1,
      "status": "todo"
    }
  ]
}

Rules:
- priority must be one of: "low", "medium", "high"
- status must always be "todo"
- type must be "Epic", "Story", or "Task"
- milestone must exactly match one of the milestone names you defined
- subtasks must be an array of short strings (not objects)
- acceptanceCriteria must be an array of strings
- labels must be an array of strings
- dependencies must be an array of strings representing task titles that this task depends on (from the list of tasks you generate).
- blockers must be an array of strings representing task titles that block this task (from the list of tasks you generate). If no task blocks this one, return an empty array.
- reviewStage must be a string representing the code review or QA stage (e.g. "PR Review & CI Validation", "QA Team Approval", "Local Verification").
- deployOrder must be an integer (1 to 10) representing the chronological execution and deploy sequence.
- Generate 10-15 realistic, specific tasks — not vague placeholders.
- Task descriptions must be detailed and actionable (2-3 sentences minimum).
- Tasks must cover the full lifecycle: setup → core features → polish → deployment.
`;

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callGeminiWithTimeout(model, promptText);
      const rawText = await result.response.text();
      const cleaned = sanitizeResponse(rawText);
      const parsed = JSON.parse(cleaned);

      // Validate shape
      if (!parsed || typeof parsed !== "object") throw new Error("Response is not an object");
      if (!Array.isArray(parsed.milestones) || parsed.milestones.length === 0) throw new Error("milestones array is missing or empty");
      if (!Array.isArray(parsed.tasks) || parsed.tasks.length === 0) throw new Error("tasks array is missing or empty");

      const validTasks = parsed.tasks.every(
        (t) =>
          t &&
          typeof t.title === "string" &&
          typeof t.description === "string" &&
          ["low", "medium", "high"].includes(t.priority) &&
          typeof t.milestone === "string" &&
          Array.isArray(t.subtasks) &&
          Array.isArray(t.labels)
      );

      if (!validTasks) throw new Error("One or more tasks are missing required fields or have invalid values");

      // Ensure status is always "todo" and defaults for dependencies/blockers are safe
      parsed.tasks = parsed.tasks.map((t) => ({
        ...t,
        status: "todo",
        dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
        blockers: Array.isArray(t.blockers) ? t.blockers : [],
        reviewStage: typeof t.reviewStage === "string" ? t.reviewStage : "PR Review",
        deployOrder: typeof t.deployOrder === "number" ? t.deployOrder : 1,
      }));

      const decorated = decorateSprintWithDependencies({
        projectType: parsed.projectType || "software project",
        epics: parsed.epics || [],
        milestones: parsed.milestones,
        tasks: parsed.tasks,
      });

      let createdTasks = [];
      try {
        const project = await Project.findById(projectId);
        if (project) {
          // Auto-create tasks in the database! "No manual transfer"
          const dbTasks = [];
          for (const t of decorated.tasks) {
            const newTask = new Task({
              title: t.title,
              description: t.description || "",
              type: t.type || "Task",
              epic: t.epic || "",
              complexity: t.complexity || "",
              estimates: t.estimates || "",
              acceptanceCriteria: Array.isArray(t.acceptanceCriteria) ? t.acceptanceCriteria : [],
              project: projectId,
              priority: t.priority || "medium",
              labels: t.labels || [],
              milestone: t.milestone || "",
              suggestedOwner: t.suggestedOwner || "",
              dependencies: t.dependencies || [],
              blockers: t.blockers || [],
              reviewStage: t.reviewStage || "",
              deployOrder: t.deployOrder || 0,
              subtasks: (t.subtasks || []).map((s) => (typeof s === "string" ? { title: s, isCompleted: false } : s)),
              status: "todo",
              createdBy: req.user?._id
            });
            const saved = await newTask.save();
            dbTasks.push(saved);
          }
          createdTasks = dbTasks;
          
          // Emit socket event for board updates
          if (req.app.get("io")) {
             req.app.get("io").to(projectId.toString()).emit("tasks-ai-generated", {
               projectId,
               count: createdTasks.length,
               actorName: req.user?.name || "AI Planner"
             });
          }

          await logPulseEvent({
            workspaceId: project.workspace,
            actorId: req.user?._id,
            actorName: req.user?.name,
            type: "sprint_generated",
            content: `${req.user?.name || "AI"} generated a new sprint roadmap for "${decorated.projectType}"`,
            importance: "high",
            metadata: { projectId, projectType: decorated.projectType },
            io: req.app.get("io"),
          });

          // Trigger Workspace Notification
          notifyWorkspaceMembers({
            workspaceId: project.workspace,
            type: "sprint_generated",
            title: "AI Sprint Roadmap Generated ✨",
            message: `${req.user?.name || "AI"} generated a new sprint roadmap for "${decorated.projectType}"`,
            priority: "high",
            projectId,
            actorId: req.user?._id,
            actorName: req.user?.name,
            app: req.app,
          });
        }
      } catch (pulseErr) {
        console.error("[SprintPulse] Event logging failed:", pulseErr.message);
      }

      return res.status(200).json({
        success: true,
        isFallback: false,
        createdTasks: createdTasks.length,
        ...decorated,
      });
    } catch (err) {
      lastError = err;
      const isQuota = err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("Quota");

      if (isQuota) {
        console.error(`[Sprint] Quota error on attempt ${attempt}:`, err.message);
        break;
      }

      console.error(`[Sprint] Generation attempt ${attempt} failed:`, err.message);

      if (attempt < MAX_RETRIES && isRetryable(err)) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  // All retries exhausted — return rich keyword fallback
  console.error("[Sprint] All retries failed, using keyword fallback. Last error:", lastError?.message);
  const fallback = buildFallbackSprint(prompt);
  const decorated = decorateSprintWithDependencies(fallback);

  try {
    const project = await Project.findById(projectId);
    if (project) {
      await logPulseEvent({
        workspaceId: project.workspace,
        actorId: req.user?._id,
        actorName: req.user?.name,
        type: "sprint_generated",
        content: `${req.user?.name || "AI"} generated a fallback sprint roadmap for "${decorated.projectType}"`,
        importance: "high",
        metadata: { projectId, projectType: decorated.projectType },
        io: req.app.get("io"),
      });

      // Trigger Workspace Notification
      notifyWorkspaceMembers({
        workspaceId: project.workspace,
        type: "sprint_generated",
        title: "AI Sprint Roadmap Generated ✨",
        message: `${req.user?.name || "AI"} generated a fallback sprint roadmap for "${decorated.projectType}"`,
        priority: "high",
        projectId,
        actorId: req.user?._id,
        actorName: req.user?.name,
        app: req.app,
      });
    }
  } catch (pulseErr) {
    console.error("[SprintPulse] Fallback event logging failed:", pulseErr.message);
  }

  return res.status(200).json({
    success: true,
    isFallback: true,
    fallbackReason: lastError?.message || "AI provider unavailable",
    ...decorated,
  });
};

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Workspace from './src/models/Workspace.js';
import Project from './src/models/Project.js';
import Task from './src/models/Task.js';
import Wiki from './src/models/Wiki.js';
import Resource from './src/models/Resource.js';
import Message from './src/models/Message.js';
import Discussion from './src/models/Discussion.js';
import PulseEvent from './src/models/PulseEvent.js';

const DOMAINS = ["Payment Gateway", "User Identity Service", "Analytics Engine", "Notification Service", "Core API", "Frontend Dashboard", "Mobile App Core", "Data Pipeline", "Inventory System", "Billing Service"];
const ADJECTIVES = ["Real-time", "Scalable", "Secure", "High-performance", "Distributed", "Serverless", "Event-driven", "Fault-tolerant"];
const TECHNOLOGIES = ["React", "Node.js", "MongoDB", "PostgreSQL", "Redis", "Kafka", "Docker", "Kubernetes", "AWS", "GraphQL", "Next.js", "TypeScript", "Go", "Rust"];
const WIKI_CATEGORIES = ["Architecture", "Backend", "Frontend", "Database", "DevOps", "Security", "Infrastructure", "Testing", "Onboarding", "Processes", "Runbooks"];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateProjectName() {
  return `${randomElement(ADJECTIVES)} ${randomElement(DOMAINS)}`;
}

function generateWikiContent(title) {
  return `# ${title}\n\n## Overview\nThis document outlines the architecture and implementation details for ${title}.\n\n## Technical Stack\n- **Frontend**: ${randomElement(TECHNOLOGIES)}\n- **Backend**: ${randomElement(TECHNOLOGIES)}\n- **Database**: ${randomElement(TECHNOLOGIES)}\n\n## Implementation Details\nEnsure that all code follows our strict coding guidelines. Use caching where necessary to improve performance.\n\n\`\`\`js\n// Sample configuration\nconst config = {\n  timeout: 5000,\n  retries: 3\n};\n\`\`\`\n\n## Deployment\nDeployed via standard CI/CD pipeline using GitHub Actions to ${randomElement(TECHNOLOGIES)}.`;
}

function generateTaskTitle() {
  const actions = ["Implement", "Refactor", "Optimize", "Debug", "Design", "Test", "Document", "Deploy"];
  const components = ["Auth Flow", "Data Sync", "Caching Layer", "UI Components", "API Endpoints", "Database Indexes", "Unit Tests", "Error Handling", "WebHooks", "Rate Limiting"];
  return `${randomElement(actions)} ${randomElement(components)} using ${randomElement(TECHNOLOGIES)}`;
}

function generateMessageText() {
  const messages = [
    "I just pushed the latest changes for the auth module. Can someone review PR #42?",
    "We're seeing some latency spikes in the database. Anyone looking into this?",
    "The new UI looks great, but we need to fix the alignment on mobile.",
    "Has anyone updated the runbook for the new deployment process?",
    "I'll take a look at the caching issue after lunch.",
    "Can we schedule a quick sync to discuss the API schema changes?",
    "Just merged the fixes. The pipeline is green.",
    "Make sure to add unit tests for the edge cases.",
    "The Redis instance is running out of memory. We need to scale it.",
    "Great work on the sprint demo everyone!"
  ];
  return randomElement(messages);
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB.");

    let user = await User.findOne();
    if (!user) {
      user = await User.create({ name: "Demo User", email: "demo@example.com", password: "password123" });
    }

    let workspace = await Workspace.findOne();
    if (!workspace) {
      workspace = await Workspace.create({ name: "Engineering OS Demo", owner: user._id });
    }

    console.log(`Seeding data for Workspace: ${workspace.name}`);

    // Clean old data for this workspace to avoid duplicates if run multiple times
    await Project.deleteMany({ workspace: workspace._id });
    await Task.deleteMany({ workspace: workspace._id });
    await Wiki.deleteMany({ workspace: workspace._id });
    await Resource.deleteMany({ workspace: workspace._id });
    
    // Create 10+ Projects
    const projects = [];
    for (let i = 0; i < 12; i++) {
      projects.push({
        name: generateProjectName(),
        description: `Project aiming to build a ${randomElement(ADJECTIVES).toLowerCase()} solution using ${randomElement(TECHNOLOGIES)}.`,
        workspace: workspace._id,
        createdBy: user._id,
        status: randomElement(["Active", "Planning", "In Review"]),
        progress: Math.floor(Math.random() * 100),
      });
    }
    const createdProjects = await Project.insertMany(projects);
    console.log(`✅ Created ${createdProjects.length} Projects`);

    // Create 200+ Tasks
    const tasks = [];
    for (let i = 0; i < 220; i++) {
      const project = randomElement(createdProjects);
      tasks.push({
        title: generateTaskTitle(),
        description: `Detailed description for ${generateTaskTitle()}. Acceptance criteria: Must pass all tests and maintain high performance.`,
        project: project._id,
        workspace: workspace._id,
        priority: randomElement(["low", "medium", "high"]),
        status: randomElement(["todo", "in-progress", "done"]),
        assignee: user._id,
        createdBy: user._id,
      });
    }
    await Task.insertMany(tasks);
    console.log(`✅ Created ${tasks.length} Tasks`);

    // Create 25+ Wiki Docs
    const wikis = [];
    for (let i = 0; i < 30; i++) {
      const title = `${randomElement(TECHNOLOGIES)} ${randomElement(["Standards", "Architecture", "SOP", "Guidelines", "Overview"])}`;
      wikis.push({
        title,
        slug: title.toLowerCase().replace(/ /g, '-') + '-' + i,
        content: generateWikiContent(title),
        summary: `Essential documentation for ${title}.`,
        workspace: workspace._id,
        author: user._id,
        lastEditedBy: user._id,
        category: randomElement(WIKI_CATEGORIES),
        tags: [randomElement(TECHNOLOGIES).toLowerCase(), "engineering"],
        status: "Published",
        views: Math.floor(Math.random() * 500),
      });
    }
    await Wiki.insertMany(wikis);
    console.log(`✅ Created ${wikis.length} Wiki Docs`);

    // Create 100+ Resources
    const resources = [];
    const resourceTypes = ["Documentation", "Article", "Video", "Tutorial", "Tool", "Library"];
    const resourceCategories = ["Backend", "Frontend", "DevOps", "Security", "Authentication", "Database", "AI", "Cloud"];
    for (let i = 0; i < 110; i++) {
      resources.push({
        title: `${randomElement(TECHNOLOGIES)} Best Practices ${i}`,
        url: `https://example.com/resource/${i}`,
        resourceType: randomElement(resourceTypes),
        category: randomElement(resourceCategories),
        workspace: workspace._id,
        createdBy: user._id,
      });
    }
    await Resource.insertMany(resources);
    console.log(`✅ Created ${resources.length} Resources`);

    // Create 50+ Discussions (PulseEvents)
    const discussions = [];
    for (let i = 0; i < 60; i++) {
      discussions.push({
        workspace: workspace._id,
        type: "comment_added",
        content: `discussed the latest changes on ${randomElement(DOMAINS)} integration.`,
        actorName: user.name,
      });
    }
    await PulseEvent.insertMany(discussions);
    console.log(`✅ Created ${discussions.length} Discussions`);

    // Create 500+ Chat Messages
    // Delete old messages first for the projects
    await Message.deleteMany({ project: { $in: createdProjects.map(p => p._id) } });
    const messages = [];
    for (let i = 0; i < 550; i++) {
      const project = randomElement(createdProjects);
      messages.push({
        project: project._id,
        sender: user._id,
        text: generateMessageText() + (Math.random() > 0.8 ? ` #${randomElement(["frontend", "backend", "task-123"])}` : ""),
      });
    }
    await Message.insertMany(messages);
    console.log(`✅ Created ${messages.length} Chat Messages`);

    console.log("🎉 Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();

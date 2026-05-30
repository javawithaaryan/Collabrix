import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from './src/models/User.js';
import Workspace from './src/models/Workspace.js';
import Project from './src/models/Project.js';
import Message from './src/models/Message.js';
import PulseEvent from './src/models/PulseEvent.js';

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
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
    console.log("Connected to MongoDB for Pulse & Messages.");

    const user = await User.findOne();
    const workspace = await Workspace.findOne();
    const projects = await Project.find({ workspace: workspace._id });

    // Clean old
    await PulseEvent.deleteMany({ workspace: workspace._id });
    await Message.deleteMany({ project: { $in: projects.map(p => p._id) } });

    // Create 50+ PulseEvents
    const discussions = [];
    for (let i = 0; i < 60; i++) {
      discussions.push({
        workspace: workspace._id,
        type: randomElement(["task_moved", "resource_shared", "milestone_reached"]),
        content: `A significant update occurred regarding ${randomElement(["integration", "performance", "deployment"])}.`,
        actorName: user.name,
      });
    }
    await PulseEvent.insertMany(discussions);
    console.log(`✅ Created ${discussions.length} PulseEvents`);

    // Create 500+ Chat Messages
    const messages = [];
    for (let i = 0; i < 550; i++) {
      const project = randomElement(projects);
      messages.push({
        project: project._id,
        sender: user._id,
        text: generateMessageText() + (Math.random() > 0.8 ? ` #${randomElement(["frontend", "backend", "task-123"])}` : ""),
      });
    }
    await Message.insertMany(messages);
    console.log(`✅ Created ${messages.length} Chat Messages`);

    console.log("🎉 Pulse and Messages Seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding error:", err);
    process.exit(1);
  }
}

seed();

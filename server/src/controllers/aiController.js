import { OpenAI } from 'openai';
import Task from '../models/Task.js';
import Project from '../models/Project.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getWorkspaceHealthAI = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const projects = await Project.find({ workspace: workspaceId });
    const projectIds = projects.map(p => p._id);
    
    const tasks = await Task.find({ project: { $in: projectIds } }).populate('assignee', 'name');
    
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Done');
    const pendingTasks = tasks.filter(t => t.status !== 'Done');

    const analyticsContext = {
      totalProjects: projects.length,
      totalPendingTasks: pendingTasks.length,
      overdueCount: overdueTasks.length,
      breakdown: pendingTasks.map(t => ({
        title: t.title,
        status: t.status,
        assignee: t.assignee ? t.assignee.name : 'Unassigned',
        priority: t.priority
      }))
    };

    const prompt = `You are Collabrix AI, the built-in intelligent engine. Analyze this project management telemetry data:
    ${JSON.stringify(analyticsContext)}
    
    Provide an operational breakdown structure for the dashboard in strict JSON format containing:
    1. "healthScore": number from 0-100
    2. "insights": array of strings listing structural risks, deadline delays, or team balance overloads.
    3. "recommendations": array of actionable task re-assignments or priority shifts.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });

    return res.status(200).json({ success: true, data: JSON.parse(response.choices[0].message.content) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'AI Parsing Error', error: error.message });
  }
};

export const generateAISprint = async (req, res) => {
  try {
    const { goal, teamSize, deadline } = req.body;

    const prompt = `Act as an expert technical project lead. Generate a comprehensive agile sprint structure based on:
    Goal: ${goal}
    Team Size: ${teamSize} Developers
    Timeline Horizon: ${deadline}
    
    Respond with a JSON object parsing containing:
    1. "sprintName": String
    2. "suggestedPoints": Number
    3. "tasks": Array of objects containing "title", "description", "priority" (Low/Medium/High/Critical), "storyPoints"`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });

    return res.status(200).json({ success: true, data: JSON.parse(response.choices[0].message.content) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Sprint Generation Failed', error: error.message });
  }
};
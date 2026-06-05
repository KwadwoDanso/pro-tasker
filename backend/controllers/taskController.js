const Task = require('../models/Task');
const Project = require('../models/Project');

// Fire-and-forget Slack ping. Only runs if SLACK_WEBHOOK_URL is set.
// Never blocks or fails the request — errors are logged and swallowed.
const notifySlack = async (text) => {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch (e) {
    console.error('slack notify failed:', e.message);
  }
};

// Confirm the parent project exists AND belongs to the user.
const getOwnedProject = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 404 };
  if (project.user.toString() !== userId.toString()) return { error: 403 };
  return { project };
};

const ownershipMessage = (code) => (code === 404 ? 'Project not found' : 'Not authorized');

// POST /api/projects/:projectId/tasks
const createTask = async (req, res) => {
  try {
    const { project, error } = await getOwnedProject(req.params.projectId, req.user._id);
    if (error) return res.status(error).json({ message: ownershipMessage(error) });

    const { title, description, status, dueDate, estimateMinutes } = req.body;
    if (!title) return res.status(400).json({ message: 'Task title is required' });

    const task = await Task.create({
      title,
      description,
      status,
      project: project._id,
      ...(dueDate ? { dueDate } : {}),
      ...(estimateMinutes ? { estimateMinutes } : {}),
    });

    notifySlack('🆕 Task created: ' + task.title);  // fire-and-forget (not awaited)
    res.status(201).json(task);
  } catch (err) {
    console.error('createTask error:', err);
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid task data' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/projects/:projectId/tasks
const getTasks = async (req, res) => {
  try {
    const { error } = await getOwnedProject(req.params.projectId, req.user._id);
    if (error) return res.status(error).json({ message: ownershipMessage(error) });

    const tasks = await Task.find({ project: req.params.projectId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    console.error('getTasks error:', err);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Project not found' });
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/tasks/:taskId  (must own the parent project)
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { error } = await getOwnedProject(task.project, req.user._id);
    if (error) return res.status(error).json({ message: ownershipMessage(error) });

    const wasDone = task.status === 'Done';

    if (req.body.title !== undefined && req.body.title !== '') task.title = req.body.title;
    if (req.body.description !== undefined) task.description = req.body.description;
    if (req.body.status !== undefined) task.status = req.body.status;
    if (req.body.dueDate !== undefined) task.dueDate = req.body.dueDate || undefined;
    if (req.body.estimateMinutes !== undefined) task.estimateMinutes = Number(req.body.estimateMinutes) || 0;

    const updated = await task.save();

    if (!wasDone && updated.status === 'Done') {
      notifySlack('✅ Task completed: ' + updated.title);  // fire-and-forget
    }
    res.json(updated);
  } catch (err) {
    console.error('updateTask error:', err);
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid task data' });
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/tasks/:taskId  (must own the parent project)
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { error } = await getOwnedProject(task.project, req.user._id);
    if (error) return res.status(error).json({ message: ownershipMessage(error) });

    await Task.deleteOne({ _id: task._id });
    res.json({ message: 'Task removed' });
  } catch (err) {
    console.error('deleteTask error:', err);
    if (err.name === 'CastError') return res.status(404).json({ message: 'Task not found' });
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createTask, getTasks, updateTask, deleteTask };

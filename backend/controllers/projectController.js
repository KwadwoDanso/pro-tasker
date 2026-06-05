const Project = require('../models/Project');
const Task = require('../models/Task');

// POST /api/projects
const createProject = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ message: 'Project name is required' });
        const project = await Project.create({ name, description, user: req.user._id });
        res.status(201).json(project);
    } catch (err) {
        console.error('createProject error:', err);
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/projects  (only the logged-in user's projects)
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error('getProjects error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET /api/projects/:id  (only if owned)
const getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        res.json(project);
    } catch (err) {
        console.error('getProject error:', err);
        if (err.name === 'CastError') return res.status(404).json({ message: 'Project not found' });
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/projects/:id  (only if owned)
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (req.body.name !== undefined && req.body.name !== '') project.name = req.body.name;
        if (req.body.description !== undefined) project.description = req.body.description;
        const updated = await project.save();
        res.json(updated);
    } catch (err) {
        console.error('updateProject error:', err);
        if (err.name === 'CastError') return res.status(404).json({ message: 'Project not found' });
        if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE /api/projects/:id  (only if owned, also removes its tasks)
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        await Task.deleteMany({ project: project._id });
        await Project.deleteOne({ _id: project._id });   // model-level delete: works on every Mongoose version
        res.json({ message: 'Project removed' });
    } catch (err) {
        console.error('deleteProject error:', err);
        if (err.name === 'CastError') return res.status(404).json({ message: 'Project not found' });
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject };

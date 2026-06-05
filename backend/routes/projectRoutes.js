const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createProject,
    getProjects,
    getProject,
    updateProject,
    deleteProject,
} = require('../controllers/projectController');
// Nested task routes (create + list) are wired here because they live under a project
const { createTask, getTasks } = require('../controllers/taskController');

// Every project route requires a logged-in user
router.use(protect);

router.route('/').post(createProject).get(getProjects);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);

// /api/projects/:projectId/tasks
router.route('/:projectId/tasks').post(createTask).get(getTasks);

module.exports = router;
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { updateTask, deleteTask } = require('../controllers/taskController');

// Every task route requires a logged-in user
router.use(protect);

// /api/tasks/:taskId
router.route('/:taskId').put(updateTask).delete(deleteTask);

module.exports = router;
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/auth');
const { validateTask } = require('../middleware/validation');

// Step 6 from Practical: Apply auth middleware to all task routes
router.use(authMiddleware);

// GET all tasks (Protected by Auth Middleware)
router.get('/', taskController.getTasks);

// POST create task (Protected by Auth Middleware + Input Validation Middleware)
router.post('/', validateTask, taskController.createTask);

// PUT update task (Protected by Auth Middleware)
router.put('/:id', taskController.updateTask);

// DELETE task (Protected by Auth Middleware)
router.delete('/:id', taskController.deleteTask);

module.exports = router;

const Task = require('../models/Task');

// Get all tasks for the logged-in user
exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// Create a new task (Protected & Validated)
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority } = req.body;

    const task = await Task.create({
      title,
      description: description || '',
      status: status || 'pending',
      priority: priority || 'medium',
      user: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully in database.',
      task
    });
  } catch (error) {
    next(error);
  }
};

// Update an existing task
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority } = req.body;

    const task = await Task.findOne({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized.'
      });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      task
    });
  } catch (error) {
    next(error);
  }
};

// Delete a task
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findOneAndDelete({ _id: id, user: req.user.id });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found or unauthorized.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

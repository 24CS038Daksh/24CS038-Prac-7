/**
 * Validation Middleware for Task and Auth Requests
 * Enforces server-side validation and sanitization
 */

// Email regex pattern
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validate Task Input
const validateTask = (req, res, next) => {
  const { title, status, priority } = req.body;

  // Check title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: Task title is required and cannot be empty.'
    });
  }

  // Validate status if provided
  const validStatuses = ['pending', 'in-progress', 'completed'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Validation Error: Status must be one of [${validStatuses.join(', ')}].`
    });
  }

  // Validate priority if provided
  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Validation Error: Priority must be one of [${validPriorities.join(', ')}].`
    });
  }

  // Sanitize fields
  req.body.title = title.trim();
  if (req.body.description && typeof req.body.description === 'string') {
    req.body.description = req.body.description.trim();
  }

  next();
};

// Validate User Registration Input
const validateRegister = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: Please provide a valid email address.'
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: Password must be at least 6 characters long.'
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

// Validate User Login Input
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: Email and password are both required.'
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

module.exports = {
  validateTask,
  validateRegister,
  validateLogin
};

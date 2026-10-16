const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validation');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected route (Supplementary Problem: /me endpoint)
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

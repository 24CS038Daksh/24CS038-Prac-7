const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register a new user
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, studentId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Step 3 from Practical: Hash the password using bcrypt with salt rounds 10
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save User document to MongoDB
    const user = await User.create({
      name: name || 'Daksh Karangiya',
      studentId: studentId || '24CS038',
      email,
      password: hashedPassword
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully with hashed password.',
      user: {
        id: user._id,
        name: user.name,
        studentId: user.studentId,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login user and return JWT
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. No account found with this email.'
      });
    }

    // Step 4 from Practical: Compare password using bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.'
      });
    }

    // Step 4 from Practical: Sign JWT with reasonable expiry (1 hour)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        name: user.name,
        studentId: user.studentId
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful. JWT token issued.',
      token,
      expiresIn: '1h',
      user: {
        id: user._id,
        name: user.name,
        studentId: user.studentId,
        email: user.email
      }
    });
  } catch (error) {
    next(error);
  }
};

// Supplementary Problem: /me endpoint that returns current user details using decoded JWT
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully from decoded JWT.',
      user,
      tokenPayload: req.user
    });
  } catch (error) {
    next(error);
  }
};

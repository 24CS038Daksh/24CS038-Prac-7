require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_manager_p7';

// Middleware Pipeline: Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health / Diagnostics endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Practical 7: Authentication & Middleware Pipeline Server is Active',
    student: {
      name: 'Daksh Karangiya',
      rollNumber: '24CS038',
      subject: 'ITUE301: Advance Web Development Framework',
      practical: 'Practical - 7'
    },
    databaseStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Centralized Error Handling Middleware (must be after routes)
app.use(errorHandler);

// Connect to MongoDB and start server
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('----------------------------------------------------');
    console.log('MongoDB Connected Successfully to:', MONGO_URI);
    console.log('Practical 7: Authentication & Middleware Pipeline');
    console.log('Student: Daksh Karangiya | Roll: 24CS038');
    console.log('----------------------------------------------------');
    app.listen(PORT, () => {
      console.log(`Server is running at: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

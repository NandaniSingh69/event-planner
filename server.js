require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware first
app.use(cors());
app.use(express.json()); // parse JSON request bodies

// MongoDB connection (only once)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Import routes after middleware
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('Collaborative Event Planner API is running');
});

// Start the server last
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const cookieParser = require('cookie-parser');  // Import cookie-parser

// Load environment variables from .env file
dotenv.config();

// Connect to the database
connectDB();

// Initialize express app
const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());

// Middleware for parsing URL-encoded form data (application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// Middleware for parsing cookies
app.use(cookieParser());

// Enable CORS (Cross-Origin Resource Sharing)
// Allow Vite frontend to send requests with credentials (cookies)
app.use(
  cors({
    origin: 'http://localhost:5173', // Vite frontend
    credentials: true,               // Allow cookies
  })
);

// Define routes
app.use('/api/auth', require('./routes/authRoutes'));         // Auth (login/register)
app.use('/api/jobs', require('./routes/jobRoutes'));           // Job operations
app.use('/api/interviews', require('./routes/interviewRoutes')); // Interview scheduling
app.use('/api/interview-responses', require('./routes/interviewResponseRoutes')); // User answers

// 404 handler for unknown routes
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global error handler
app.use((error, req, res, next) => {
  const statusCode = error.status || 500;
  const message = error.message || 'Internal Server Error';
  res.status(statusCode).json({ message });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import mongoose from 'mongoose';

import authRouter from './routes/auth.routes.js';
import interviewRouter from './routes/interview.routes.js';

const app = express();

// Allowed origins for credentialed CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Database connection check middleware
app.use((req, res, next) => {
  // Allow health check without DB
  if (req.path === '/api/health' || req.path === '/') {
    return next();
  }
  
  if (mongoose.connection.readyState !== 1) {
    // 1 = connected
    return res.status(503).json({
      message: 'Database service is currently unavailable. Please verify MONGODB_URI configuration.',
      status: 'error'
    });
  }
  next();
});

// Root API information
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'Prepify API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: states[dbState] || 'Unknown',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err);

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File is too large. Maximum size allowed is 5MB.' });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid resource identifier: ${err.value}` });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error occurred.';

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

export default app;
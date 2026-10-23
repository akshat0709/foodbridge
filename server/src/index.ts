import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config.js';
import { connectDB } from './db.js';
import { errorHandler } from './middleware/errorHandler.js';

import { authRouter } from './routes/auth.routes.js';
import { listingRouter } from './routes/listing.routes.js';
import { messRouter } from './routes/mess.routes.js';
import { ngoRouter } from './routes/ngo.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';
import { benchmarkRouter } from './routes/benchmark.routes.js';
import { forecastRouter } from './routes/forecast.routes.js';
import { qualityRouter } from './routes/quality.routes.js';
import { reportsRouter } from './routes/reports.routes.js';

export const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Database auto-connection middleware for serverless/Vercel environments
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState < 1) {
    try {
      await connectDB();
    } catch (err) {
      console.error('[Database Middleware] Connection error:', err);
    }
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'FoodBridge Backend API',
    uptime: process.uptime(),
    dbConnected: mongoose.connection.readyState === 1,
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/listings', listingRouter);
app.use('/api/messes', messRouter);
app.use('/api/ngos', ngoRouter);
app.use('/api/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/benchmarks', benchmarkRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/quality', qualityRouter);
app.use('/api/reports', reportsRouter);

// Centralized error handler
app.use(errorHandler);

// Server bootstrap for local development
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  connectDB()
    .then(() => {
      app.listen(config.port, () => {
        console.log(`[FoodBridge Server] Running on http://localhost:${config.port}`);
      });
    })
    .catch(err => {
      console.error('[Server Bootstrap] Failed to start:', err);
    });
}

export default app;

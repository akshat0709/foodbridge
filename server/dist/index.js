import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
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
// Health check endpoint (placed first so it responds instantly in serverless environments)
const healthHandler = (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'FoodBridge Backend API',
        uptime: process.uptime(),
        dbConnected: mongoose.connection.readyState === 1,
    });
};
app.get('/api/health', healthHandler);
app.get('/health', healthHandler);
// Database auto-connection middleware for serverless/Vercel environments
app.use(async (req, res, next) => {
    if (req.path === '/api/health' || req.path === '/health') {
        return next();
    }
    if (mongoose.connection.readyState < 1) {
        try {
            await connectDB();
        }
        catch (err) {
            console.error('[Database Middleware] Connection error:', err);
        }
    }
    if (mongoose.connection.readyState < 1) {
        return res.status(503).json({
            success: false,
            error: {
                code: 'DATABASE_DISCONNECTED',
                message: 'Could not connect to MongoDB database. Please ensure MONGODB_URI is set in Vercel Environment Variables and MongoDB Atlas allows 0.0.0.0/0 in Network Access.',
            },
        });
    }
    next();
});
// Mount Routes (support both with and without /api prefix for serverless compatibility)
app.use('/api/auth', authRouter);
app.use('/auth', authRouter);
app.use('/api/listings', listingRouter);
app.use('/listings', listingRouter);
app.use('/api/messes', messRouter);
app.use('/messes', messRouter);
app.use('/api/ngos', ngoRouter);
app.use('/ngos', ngoRouter);
app.use('/api/admin', adminRouter);
app.use('/admin', adminRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/analytics', analyticsRouter);
app.use('/api/benchmarks', benchmarkRouter);
app.use('/benchmarks', benchmarkRouter);
app.use('/api/forecast', forecastRouter);
app.use('/forecast', forecastRouter);
app.use('/api/quality', qualityRouter);
app.use('/quality', qualityRouter);
app.use('/api/reports', reportsRouter);
app.use('/reports', reportsRouter);
// Centralized error handler
app.use(errorHandler);
// Fallback for unmatched routes to prevent serverless hanging
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'ROUTE_NOT_FOUND',
        url: req.url,
        originalUrl: req.originalUrl,
        method: req.method,
    });
});
export default app;

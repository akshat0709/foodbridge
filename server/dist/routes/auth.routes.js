import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';
import { User } from '../models/User.js';
import { Mess } from '../models/Mess.js';
import { Ngo } from '../models/Ngo.js';
import { config, getJwtSecret } from '../config.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
export const authRouter = Router();
// Rate limiter for login/auth routes: max 30 requests per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many login attempts. Please try again after 15 minutes.',
        },
    },
});
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});
authRouter.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return next(new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS'));
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return next(new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS'));
        }
        // Fetch organization details if linked
        let orgDetails = null;
        if (user.role === 'MESS_ADMIN' && user.organizationId) {
            orgDetails = await Mess.findById(user.organizationId).lean();
        }
        else if (user.role === 'NGO_REP' && user.organizationId) {
            orgDetails = await Ngo.findById(user.organizationId).lean();
        }
        const tokenPayload = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            organizationId: user.organizationId?.toString(),
        };
        const token = jwt.sign(tokenPayload, getJwtSecret(), {
            algorithm: 'HS256',
            expiresIn: (config.jwtExpiresIn || '7d'),
        });
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    phone: user.phone,
                    organizationId: user.organizationId,
                    organization: orgDetails,
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});
authRouter.get('/me', authenticate, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).lean();
        if (!user) {
            return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
        }
        let orgDetails = null;
        if (user.role === 'MESS_ADMIN' && user.organizationId) {
            orgDetails = await Mess.findById(user.organizationId).lean();
        }
        else if (user.role === 'NGO_REP' && user.organizationId) {
            orgDetails = await Ngo.findById(user.organizationId).lean();
        }
        res.json({
            success: true,
            data: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                organizationId: user.organizationId,
                organization: orgDetails,
            },
        });
    }
    catch (err) {
        next(err);
    }
});

import { Router } from 'express';
import { z } from 'zod';
import { Mess } from '../models/Mess.js';
import { MealLog } from '../models/MealLog.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
export const messRouter = Router();
const createMealLogSchema = z.object({
    date: z.string().datetime(),
    mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
    foodCategory: z.enum(['RICE_GRAINS', 'CURRY_DAL', 'ROTI_BREAD', 'VEGETABLES', 'DESSERT_SNACK']),
    plannedAttendance: z.number().int().min(0),
    actualAttendance: z.number().int().min(0),
    preparedKg: z.number().positive(),
    servedKg: z.number().min(0),
    leftoverKg: z.number().min(0),
    donatedKg: z.number().min(0).optional(),
    isHoliday: z.boolean().optional(),
    isExamWeek: z.boolean().optional(),
    festivalName: z.string().nullable().optional(),
});
messRouter.get('/', authenticate, async (req, res, next) => {
    try {
        const messes = await Mess.find({ isActive: true }).sort({ name: 1 }).lean();
        res.json({ success: true, data: messes });
    }
    catch (err) {
        next(err);
    }
});
messRouter.get('/:id', authenticate, async (req, res, next) => {
    try {
        const mess = await Mess.findById(req.params.id).lean();
        if (!mess)
            return next(new AppError('Mess not found', 404, 'NOT_FOUND'));
        res.json({ success: true, data: mess });
    }
    catch (err) {
        next(err);
    }
});
messRouter.post('/:id/meal-logs', authenticate, validate(createMealLogSchema), async (req, res, next) => {
    try {
        const messId = req.params.id;
        const mess = await Mess.findById(messId);
        if (!mess)
            return next(new AppError('Mess not found', 404, 'NOT_FOUND'));
        const d = new Date(req.body.date);
        const dayOfWeek = d.getDay();
        const costOfLeftoverRs = Math.round(req.body.leftoverKg * 60);
        // Check baseline rolling leftover for anomaly detection
        const recentLogs = await MealLog.find({
            messId,
            mealType: req.body.mealType,
            foodCategory: req.body.foodCategory,
        })
            .sort({ date: -1 })
            .limit(14)
            .lean();
        let isAnomaly = false;
        let anomalyScore = 0;
        if (recentLogs.length >= 5) {
            const leftovers = recentLogs.map(l => l.leftoverKg);
            const mean = leftovers.reduce((a, b) => a + b, 0) / leftovers.length;
            const variance = leftovers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / leftovers.length;
            const std = Math.sqrt(variance) || 1;
            const zScore = Math.abs((req.body.leftoverKg - mean) / std);
            anomalyScore = parseFloat(zScore.toFixed(2));
            if (zScore > 2.2) {
                isAnomaly = true;
            }
        }
        const mealLog = new MealLog({
            messId,
            date: d,
            mealType: req.body.mealType,
            foodCategory: req.body.foodCategory,
            plannedAttendance: req.body.plannedAttendance,
            actualAttendance: req.body.actualAttendance,
            preparedKg: req.body.preparedKg,
            servedKg: req.body.servedKg,
            leftoverKg: req.body.leftoverKg,
            donatedKg: req.body.donatedKg || 0,
            costOfLeftoverRs,
            isHoliday: req.body.isHoliday || false,
            isExamWeek: req.body.isExamWeek || false,
            festivalName: req.body.festivalName || null,
            dayOfWeek,
            anomalyScore,
            isAnomaly,
            loggedAt: new Date(),
        });
        await mealLog.save();
        res.status(201).json({ success: true, data: mealLog });
    }
    catch (err) {
        next(err);
    }
});
messRouter.get('/:id/meal-logs', authenticate, async (req, res, next) => {
    try {
        const { limit = '30', page = '1', mealType, foodCategory, startDate, endDate } = req.query;
        const filter = { messId: req.params.id };
        if (mealType && mealType !== 'ALL')
            filter.mealType = mealType;
        if (foodCategory && foodCategory !== 'ALL')
            filter.foodCategory = foodCategory;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate)
                filter.date.$gte = new Date(startDate);
            if (endDate)
                filter.date.$lte = new Date(endDate);
        }
        const pageNum = Math.max(1, parseInt(page, 10));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            MealLog.find(filter).sort({ date: -1, mealType: 1 }).skip(skip).limit(limitNum).lean(),
            MealLog.countDocuments(filter),
        ]);
        res.json({
            success: true,
            data: {
                items,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    totalPages: Math.ceil(total / limitNum),
                },
            },
        });
    }
    catch (err) {
        next(err);
    }
});

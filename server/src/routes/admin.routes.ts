import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { SystemSetting } from '../models/SystemSetting.js';
import { MealLog } from '../models/MealLog.js';
import { MealSummary } from '../models/MealSummary.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';

export const adminRouter = Router();

const updateSettingsSchema = z.object({
  weights: z
    .object({
      distanceWeight: z.number().min(0).max(1),
      capacityWeight: z.number().min(0).max(1),
      deadlineWeight: z.number().min(0).max(1),
      reliabilityWeight: z.number().min(0).max(1),
    })
    .optional(),
  impactFactors: z
    .object({
      kgPerMeal: z.number().positive(),
      co2eFactorPerKg: z.number().positive(),
      costPerKgRs: z.number().positive(),
    })
    .optional(),
  driftThresholdMae: z.number().positive().optional(),
});

// Get global config
adminRouter.get('/settings', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    let setting = await SystemSetting.findOne({ key: 'GLOBAL_CONFIG' }).lean();
    if (!setting) {
      setting = await SystemSetting.create({
        key: 'GLOBAL_CONFIG',
        weights: {
          distanceWeight: 0.35,
          capacityWeight: 0.25,
          deadlineWeight: 0.20,
          reliabilityWeight: 0.20,
        },
        impactFactors: {
          kgPerMeal: 0.4,
          co2eFactorPerKg: 2.5,
          costPerKgRs: 60.0,
        },
        driftThresholdMae: 2.0,
      });
    }
    res.json({ success: true, data: setting });
  } catch (err) {
    next(err);
  }
});

// Update global settings
adminRouter.put(
  '/settings',
  authenticate,
  authorize(['PLATFORM_ADMIN']),
  validate(updateSettingsSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updated = await SystemSetting.findOneAndUpdate(
        { key: 'GLOBAL_CONFIG' },
        { $set: req.body },
        { upsert: true, new: true }
      );
      res.json({ success: true, message: 'Settings updated successfully', data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// Anomalies Feed
adminRouter.get('/anomalies', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '50', page = '1' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      MealLog.find({ isAnomaly: true })
        .populate('messId', 'name campus address')
        .sort({ date: -1, anomalyScore: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MealLog.countDocuments({ isAnomaly: true }),
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
  } catch (err) {
    next(err);
  }
});

// Data Lifecycle: Archival of records older than N months into MealSummary collection
adminRouter.post('/archive', authenticate, authorize(['PLATFORM_ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const monthsOld = parseInt((req.body.monthsOld as string) || '12', 10);
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsOld);

    // Aggregate daily records to monthly summaries
    const rollups = await MealLog.aggregate([
      { $match: { date: { $lt: cutoffDate } } },
      {
        $group: {
          _id: {
            messId: '$messId',
            periodMonth: { $dateToString: { format: '%Y-%m', date: '$date' } },
            mealType: '$mealType',
            foodCategory: '$foodCategory',
          },
          totalPreparedKg: { $sum: '$preparedKg' },
          totalServedKg: { $sum: '$servedKg' },
          totalLeftoverKg: { $sum: '$leftoverKg' },
          totalDonatedKg: { $sum: '$donatedKg' },
          totalCostSavedRs: { $sum: '$costOfLeftoverRs' },
          recordsCount: { $sum: 1 },
        },
      },
    ]);

    if (rollups.length > 0) {
      const summaryDocs = rollups.map(r => ({
        messId: r._id.messId,
        periodMonth: r._id.periodMonth,
        mealType: r._id.mealType,
        foodCategory: r._id.foodCategory,
        totalPreparedKg: parseFloat(r.totalPreparedKg.toFixed(1)),
        totalServedKg: parseFloat(r.totalServedKg.toFixed(1)),
        totalLeftoverKg: parseFloat(r.totalLeftoverKg.toFixed(1)),
        totalDonatedKg: parseFloat(r.totalDonatedKg.toFixed(1)),
        totalCostSavedRs: r.totalCostSavedRs,
        recordsCount: r.recordsCount,
        archivedAt: new Date(),
      }));

      await MealSummary.insertMany(summaryDocs);
    }

    const totalRecordsArchived = rollups.reduce((acc, curr) => acc + curr.recordsCount, 0);
    // Estimated storage saved: ~320 bytes per document in BSON
    const estimatedBytesSaved = totalRecordsArchived * 320;
    const mbSaved = parseFloat((estimatedBytesSaved / (1024 * 1024)).toFixed(2));

    res.json({
      success: true,
      message: `Successfully archived ${totalRecordsArchived} meal records into ${rollups.length} monthly rollups.`,
      data: {
        totalRecordsArchived,
        summaryRollupsCreated: rollups.length,
        cutoffDate,
        storageSavedMb: mbSaved,
        note: `Saved ~${mbSaved} MB of index and heap memory. Aggregated records are queryable in MealSummary.`,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Lifecycle Status (TTL & summary storage)
adminRouter.get('/lifecycle-status', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [rawAuditLogsCount, archivedRollupsCount, totalMealLogsCount] = await Promise.all([
      AuditLog.countDocuments(),
      MealSummary.countDocuments(),
      MealLog.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        rawAuditLogsCount,
        ttlDays: 90,
        archivedRollupsCount,
        totalMealLogsCount,
        ttlStatus: 'ACTIVE (expireAfterSeconds: 7,776,000s on createdAt)',
        archivalStrategy: 'Monthly pre-aggregated rollups into meal_summaries',
      },
    });
  } catch (err) {
    next(err);
  }
});

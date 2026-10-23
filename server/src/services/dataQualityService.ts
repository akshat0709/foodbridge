import mongoose from 'mongoose';
import { MealLog } from '../models/MealLog.js';
import { Mess } from '../models/Mess.js';

export interface QualityScanResult {
  totalRecords: number;
  completenessPct: number;
  duplicateCount: number;
  duplicateRatePct: number;
  outOfRangeCount: number;
  negativeLeftoverCount: number;
  futureTimestampCount: number;
  lateLoggedCount: number;
  schemaViolationsCount: number;
  overallHygieneScorePct: number;
  qualityBreakdown: {
    category: string;
    passed: number;
    failed: number;
    failureReason: string;
  }[];
}

export async function runDataQualityScan(): Promise<QualityScanResult> {
  const totalRecords = await MealLog.countDocuments();
  if (totalRecords === 0) {
    return {
      totalRecords: 0,
      completenessPct: 100,
      duplicateCount: 0,
      duplicateRatePct: 0,
      outOfRangeCount: 0,
      negativeLeftoverCount: 0,
      futureTimestampCount: 0,
      lateLoggedCount: 0,
      schemaViolationsCount: 0,
      overallHygieneScorePct: 100,
      qualityBreakdown: [],
    };
  }

  // 1. Negative Leftovers
  const negativeLeftoverCount = await MealLog.countDocuments({ leftoverKg: { $lt: 0 } });

  // 2. Future Timestamps (> current date + 1 day)
  const tomorrow = new Date(Date.now() + 86400000);
  const futureTimestampCount = await MealLog.countDocuments({ date: { $gt: tomorrow } });

  // 3. Out-of-range quantities (prepared > 2000 or negative)
  const outOfRangeCount = await MealLog.countDocuments({
    $or: [{ preparedKg: { $gt: 2000 } }, { preparedKg: { $lt: 0 } }],
  });

  // 4. Late Logged Records (logged > 12 hours after prep time)
  // Check sample or query
  const lateLoggedCount = await MealLog.countDocuments({
    $expr: {
      $gt: [{ $subtract: ['$loggedAt', '$date'] }, 12 * 3600000],
    },
  });

  // 5. Duplicates detection via aggregation pipeline
  const duplicatePipeline = [
    {
      $group: {
        _id: { messId: '$messId', date: '$date', mealType: '$mealType', foodCategory: '$foodCategory' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $count: 'duplicateGroups' },
  ];
  const dupResult = await MealLog.aggregate(duplicatePipeline);
  const duplicateCount = dupResult[0]?.duplicateGroups || 0;
  const duplicateRatePct = parseFloat(((duplicateCount / totalRecords) * 100).toFixed(2));

  // 6. Schema Violations (servedKg > preparedKg)
  const schemaViolationsCount = await MealLog.countDocuments({
    $expr: { $gt: ['$servedKg', '$preparedKg'] },
  });

  const totalFlaws =
    negativeLeftoverCount +
    futureTimestampCount +
    outOfRangeCount +
    schemaViolationsCount +
    duplicateCount;

  const completenessPct = parseFloat(
    (Math.max(0, 100 - (totalFlaws / totalRecords) * 100)).toFixed(2)
  );

  const overallHygieneScorePct = parseFloat(
    Math.max(0, 100 - duplicateRatePct - (totalFlaws / totalRecords) * 100).toFixed(1)
  );

  return {
    totalRecords,
    completenessPct,
    duplicateCount,
    duplicateRatePct,
    outOfRangeCount,
    negativeLeftoverCount,
    futureTimestampCount,
    lateLoggedCount,
    schemaViolationsCount,
    overallHygieneScorePct,
    qualityBreakdown: [
      {
        category: 'Range Consistency (leftoverKg >= 0)',
        passed: totalRecords - negativeLeftoverCount,
        failed: negativeLeftoverCount,
        failureReason: 'Found records with negative leftover quantities (sensor or operator entry error)',
      },
      {
        category: 'Temporal Validity (date <= today)',
        passed: totalRecords - futureTimestampCount,
        failed: futureTimestampCount,
        failureReason: 'Detected timestamps pointing to future calendar dates (year 2099)',
      },
      {
        category: 'Physical Feasibility (servedKg <= preparedKg)',
        passed: totalRecords - schemaViolationsCount,
        failed: schemaViolationsCount,
        failureReason: 'Reported consumed meals exceeded prepared batch size',
      },
      {
        category: 'Uniqueness (mess, date, meal, category)',
        passed: totalRecords - duplicateCount,
        failed: duplicateCount,
        failureReason: 'Duplicate meal entries logged for the same time slot',
      },
      {
        category: 'Punctuality (logging latency < 12h)',
        passed: totalRecords - lateLoggedCount,
        failed: lateLoggedCount,
        failureReason: 'Entries recorded more than 12 hours after scheduled meal completion',
      },
    ],
  };
}

export interface BulkImportRow {
  messId: string;
  date: string;
  mealType: string;
  foodCategory: string;
  plannedAttendance: number;
  actualAttendance: number;
  preparedKg: number;
  servedKg: number;
  leftoverKg: number;
  donatedKg?: number;
}

export interface ImportValidationReport {
  totalProcessed: number;
  acceptedCount: number;
  rejectedCount: number;
  rejectionDetails: {
    rowNumber: number;
    field: string;
    reason: string;
    rawSnippet: string;
  }[];
}

export async function processBulkImport(rows: BulkImportRow[]): Promise<ImportValidationReport> {
  const messes = await Mess.find({ isActive: true }).select('_id').lean();
  const validMessIds = new Set(messes.map(m => m._id.toString()));

  const validMealTypes = new Set(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']);
  const validCategories = new Set([
    'RICE_GRAINS',
    'CURRY_DAL',
    'ROTI_BREAD',
    'VEGETABLES',
    'DESSERT_SNACK',
  ]);

  const acceptedDocs: any[] = [];
  const rejectionDetails: any[] = [];

  const now = new Date();
  const maxDate = new Date(now.getTime() + 86400000);

  rows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const errors: string[] = [];

    if (!row.messId || !validMessIds.has(row.messId)) {
      errors.push(`Invalid messId: ${row.messId}`);
    }

    const rowDate = new Date(row.date);
    if (isNaN(rowDate.getTime())) {
      errors.push('Invalid ISO date format');
    } else if (rowDate > maxDate) {
      errors.push(`Date cannot be in the future (${row.date})`);
    }

    if (!validMealTypes.has(row.mealType)) {
      errors.push(`Invalid mealType: ${row.mealType}`);
    }

    if (!validCategories.has(row.foodCategory)) {
      errors.push(`Invalid foodCategory: ${row.foodCategory}`);
    }

    if (typeof row.preparedKg !== 'number' || row.preparedKg <= 0 || row.preparedKg > 2000) {
      errors.push(`Invalid preparedKg: ${row.preparedKg} (must be between 0.1 and 2000 kg)`);
    }

    if (typeof row.servedKg !== 'number' || row.servedKg < 0 || row.servedKg > row.preparedKg) {
      errors.push(`Invalid servedKg: ${row.servedKg} (cannot exceed preparedKg ${row.preparedKg})`);
    }

    if (typeof row.leftoverKg !== 'number' || row.leftoverKg < 0) {
      errors.push(`Invalid leftoverKg: ${row.leftoverKg} (cannot be negative)`);
    }

    if (errors.length > 0) {
      rejectionDetails.push({
        rowNumber: rowNum,
        field: errors[0].split(':')[0],
        reason: errors.join('; '),
        rawSnippet: JSON.stringify(row).slice(0, 100),
      });
    } else {
      acceptedDocs.push({
        messId: new mongoose.Types.ObjectId(row.messId),
        date: rowDate,
        mealType: row.mealType,
        foodCategory: row.foodCategory,
        plannedAttendance: row.plannedAttendance || 500,
        actualAttendance: row.actualAttendance || 480,
        preparedKg: row.preparedKg,
        servedKg: row.servedKg,
        leftoverKg: row.leftoverKg,
        donatedKg: row.donatedKg || 0,
        costOfLeftoverRs: Math.round(row.leftoverKg * 60),
        dayOfWeek: rowDate.getDay(),
        loggedAt: new Date(),
        isAnomaly: false,
        anomalyScore: 0.1,
      });
    }
  });

  // Batch insert valid records
  if (acceptedDocs.length > 0) {
    const batchSize = 1000;
    for (let i = 0; i < acceptedDocs.length; i += batchSize) {
      const chunk = acceptedDocs.slice(i, i + batchSize);
      await MealLog.insertMany(chunk, { ordered: false });
    }
  }

  return {
    totalProcessed: rows.length,
    acceptedCount: acceptedDocs.length,
    rejectedCount: rejectionDetails.length,
    rejectionDetails,
  };
}

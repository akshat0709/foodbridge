import { Router } from 'express';
import { generateMonthlyPDFReport } from '../services/reportGenerator.js';
import { MealLog } from '../models/MealLog.js';
import { Listing } from '../models/Listing.js';
import { authenticate, authorize } from '../middleware/auth.js';
export const reportsRouter = Router();
// Monthly PDF download
reportsRouter.get('/monthly-pdf', authenticate, authorize(['PLATFORM_ADMIN']), async (req, res, next) => {
    try {
        const monthYear = req.query.monthYear;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="FoodBridge_Operations_Report_${monthYear || 'Monthly'}.pdf"`);
        await generateMonthlyPDFReport(res, monthYear);
    }
    catch (err) {
        next(err);
    }
});
// CSV Export for Meal Logs
reportsRouter.get('/export-meals-csv', authenticate, authorize(['MESS_ADMIN', 'PLATFORM_ADMIN']), async (req, res, next) => {
    try {
        const { messId, startDate, endDate } = req.query;
        const filter = {};
        if (messId && messId !== 'ALL')
            filter.messId = messId;
        // Mess admins can only export their own mess's records.
        if (req.user.role === 'MESS_ADMIN')
            filter.messId = req.user.organizationId || '000000000000000000000000';
        if (startDate || endDate) {
            filter.date = {};
            if (startDate)
                filter.date.$gte = new Date(startDate);
            if (endDate)
                filter.date.$lte = new Date(endDate);
        }
        const records = await MealLog.find(filter)
            .populate('messId', 'name campus')
            .sort({ date: -1 })
            .limit(5000)
            .lean();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="foodbridge_meal_logs.csv"');
        const headers = [
            'Date',
            'Mess Name',
            'Campus',
            'Meal Type',
            'Food Category',
            'Planned Attendance',
            'Actual Attendance',
            'Prepared (kg)',
            'Served (kg)',
            'Leftover (kg)',
            'Donated (kg)',
            'Cost Leftover (Rs)',
            'Is Holiday',
            'Is Anomaly',
        ];
        res.write(headers.join(',') + '\n');
        records.forEach((r) => {
            const line = [
                new Date(r.date).toISOString().split('T')[0],
                `"${r.messId?.name || 'Mess'}"`,
                `"${r.messId?.campus || 'Campus'}"`,
                r.mealType,
                r.foodCategory,
                r.plannedAttendance,
                r.actualAttendance,
                r.preparedKg,
                r.servedKg,
                r.leftoverKg,
                r.donatedKg,
                r.costOfLeftoverRs,
                r.isHoliday ? 'YES' : 'NO',
                r.isAnomaly ? 'YES' : 'NO',
            ].join(',');
            res.write(line + '\n');
        });
        res.end();
    }
    catch (err) {
        next(err);
    }
});
// CSV Export for Listings / Reductions
reportsRouter.get('/export-listings-csv', authenticate, authorize(['MESS_ADMIN', 'PLATFORM_ADMIN']), async (req, res, next) => {
    try {
        const listingFilter = req.user.role === 'MESS_ADMIN' ? { messId: req.user.organizationId || '000000000000000000000000' } : {};
        const listings = await Listing.find(listingFilter)
            .populate('messId', 'name')
            .populate('claimedByNgoId', 'name')
            .sort({ createdAt: -1 })
            .limit(5000)
            .lean();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="foodbridge_listings.csv"');
        const headers = [
            'Listing ID',
            'Created At',
            'Mess Name',
            'Claimed By NGO',
            'Category',
            'Meal Type',
            'Quantity (kg)',
            'Portions Estimate',
            'Status',
            'Collect By',
        ];
        res.write(headers.join(',') + '\n');
        listings.forEach((l) => {
            const line = [
                l._id,
                new Date(l.createdAt).toISOString(),
                `"${l.messId?.name || ''}"`,
                `"${l.claimedByNgoId?.name || 'UNCLAIMED'}"`,
                l.foodCategory,
                l.mealType,
                l.quantityKg,
                l.portionsEstimate,
                l.status,
                new Date(l.collectBy).toISOString(),
            ].join(',');
            res.write(line + '\n');
        });
        res.end();
    }
    catch (err) {
        next(err);
    }
});

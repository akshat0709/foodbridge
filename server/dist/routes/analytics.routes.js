import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getOverviewImpactKPIs, getDonatedVsRedistributedTrends, getWastePerMess, getWeekdayMealTypeHeatmap, getCategoryParetoChart, getNgoPerformanceMetrics, getGrowthMetrics, getGeospatialAnalytics, } from '../services/analyticsPipelines.js';
import { MealLog } from '../models/MealLog.js';
export const analyticsRouter = Router();
function extractFilters(req) {
    const filters = {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        messId: req.query.messId,
        ngoId: req.query.ngoId,
        mealType: req.query.mealType,
        foodCategory: req.query.foodCategory,
    };
    // Mess admins only ever see their own mess's numbers, whatever the query says.
    if (req.user?.role === 'MESS_ADMIN') {
        filters.messId = req.user.organizationId || '000000000000000000000000';
    }
    return filters;
}
const adminOnly = authorize(['PLATFORM_ADMIN']);
const messOrAdmin = authorize(['MESS_ADMIN', 'PLATFORM_ADMIN']);
// 1. Overview KPIs
analyticsRouter.get('/kpis', authenticate, adminOnly, async (req, res, next) => {
    try {
        const filters = extractFilters(req);
        const result = await getOverviewImpactKPIs(filters);
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// 2. Trends (Donated vs Redistributed)
analyticsRouter.get('/trends', authenticate, adminOnly, async (req, res, next) => {
    try {
        const filters = extractFilters(req);
        const result = await getDonatedVsRedistributedTrends(filters);
        res.json({ success: true, data: result.data, inspector: result.inspector });
    }
    catch (err) {
        next(err);
    }
});
// 3. Waste by Mess
analyticsRouter.get('/waste-by-mess', authenticate, adminOnly, async (req, res, next) => {
    try {
        const filters = extractFilters(req);
        const result = await getWastePerMess(filters);
        res.json({ success: true, data: result.data, inspector: result.inspector });
    }
    catch (err) {
        next(err);
    }
});
// 4. Heatmap
analyticsRouter.get('/heatmap', authenticate, messOrAdmin, async (req, res, next) => {
    try {
        const filters = extractFilters(req);
        const result = await getWeekdayMealTypeHeatmap(filters);
        res.json({ success: true, data: result.data, inspector: result.inspector });
    }
    catch (err) {
        next(err);
    }
});
// 5. Pareto Chart
analyticsRouter.get('/pareto', authenticate, messOrAdmin, async (req, res, next) => {
    try {
        const filters = extractFilters(req);
        const result = await getCategoryParetoChart(filters);
        res.json({ success: true, data: result.data, inspector: result.inspector });
    }
    catch (err) {
        next(err);
    }
});
// 6. NGO Performance
analyticsRouter.get('/ngo-performance', authenticate, adminOnly, async (req, res, next) => {
    try {
        const filters = extractFilters(req);
        const result = await getNgoPerformanceMetrics(filters);
        res.json({ success: true, data: result.data, inspector: result.inspector });
    }
    catch (err) {
        next(err);
    }
});
// 7. Growth / MoM
analyticsRouter.get('/growth', authenticate, adminOnly, async (req, res, next) => {
    try {
        const filters = extractFilters(req);
        const result = await getGrowthMetrics(filters);
        res.json({ success: true, data: result.data, inspector: result.inspector });
    }
    catch (err) {
        next(err);
    }
});
// 8. Geospatial Hotspots & Unserved Zones
analyticsRouter.get('/geospatial', authenticate, adminOnly, async (req, res, next) => {
    try {
        const result = await getGeospatialAnalytics();
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// 9. Pipeline Inspector On-Demand Explain
analyticsRouter.post('/explain', authenticate, adminOnly, async (req, res, next) => {
    try {
        const { pipeline } = req.body;
        if (!pipeline || !Array.isArray(pipeline)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid pipeline array' } });
        }
        // Explain is read-only inspection; refuse stages that write or read other collections.
        const forbidden = ['$out', '$merge', '$lookup', '$unionWith', '$graphLookup'];
        const used = pipeline.flatMap((stage) => (stage && typeof stage === 'object' ? Object.keys(stage) : []));
        const bad = used.find((k) => forbidden.includes(k));
        if (bad) {
            return next(new AppError(`Stage ${bad} is not allowed in explain`, 400, 'STAGE_NOT_ALLOWED'));
        }
        const startTime = Date.now();
        const explainPlan = await MealLog.collection.aggregate(pipeline).explain('executionStats');
        const executionTimeMs = Date.now() - startTime;
        res.json({
            success: true,
            data: {
                executionStats: explainPlan.executionStats,
                serverInfo: explainPlan.serverInfo,
                executionTimeMs,
            },
        });
    }
    catch (err) {
        next(err);
    }
});

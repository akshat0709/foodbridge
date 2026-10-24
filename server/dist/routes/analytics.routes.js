import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getOverviewImpactKPIs, getDonatedVsRedistributedTrends, getWastePerMess, getWeekdayMealTypeHeatmap, getCategoryParetoChart, getNgoPerformanceMetrics, getGrowthMetrics, getGeospatialAnalytics, } from '../services/analyticsPipelines.js';
import { MealLog } from '../models/MealLog.js';
export const analyticsRouter = Router();
function extractFilters(req) {
    return {
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        messId: req.query.messId,
        ngoId: req.query.ngoId,
        mealType: req.query.mealType,
        foodCategory: req.query.foodCategory,
    };
}
// 1. Overview KPIs
analyticsRouter.get('/kpis', authenticate, async (req, res, next) => {
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
analyticsRouter.get('/trends', authenticate, async (req, res, next) => {
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
analyticsRouter.get('/waste-by-mess', authenticate, async (req, res, next) => {
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
analyticsRouter.get('/heatmap', authenticate, async (req, res, next) => {
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
analyticsRouter.get('/pareto', authenticate, async (req, res, next) => {
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
analyticsRouter.get('/ngo-performance', authenticate, async (req, res, next) => {
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
analyticsRouter.get('/growth', authenticate, async (req, res, next) => {
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
analyticsRouter.get('/geospatial', authenticate, async (req, res, next) => {
    try {
        const result = await getGeospatialAnalytics();
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// 9. Pipeline Inspector On-Demand Explain
analyticsRouter.post('/explain', authenticate, async (req, res, next) => {
    try {
        const { pipeline } = req.body;
        if (!pipeline || !Array.isArray(pipeline)) {
            return res.status(400).json({ success: false, error: { message: 'Invalid pipeline array' } });
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

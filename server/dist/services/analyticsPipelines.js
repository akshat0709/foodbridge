import mongoose from 'mongoose';
import { MealLog } from '../models/MealLog.js';
import { Listing } from '../models/Listing.js';
import { Mess } from '../models/Mess.js';
import { Ngo } from '../models/Ngo.js';
import { SystemSetting } from '../models/SystemSetting.js';
/**
 * Utility to run explain('executionStats') on an aggregation pipeline and measure performance
 */
export async function runPipelineWithInspection(model, pipeline) {
    const startTime = Date.now();
    // Run explain
    let docsExamined = 0;
    let docsReturned = 0;
    let keysExamined = 0;
    let indexUsed = false;
    let stageSummary = 'COLLSCAN';
    try {
        const explainResult = await model.collection.aggregate(pipeline).explain('executionStats');
        const stats = explainResult?.executionStats || {};
        docsExamined = stats.totalDocsExamined ?? 0;
        docsReturned = stats.nReturned ?? 0;
        keysExamined = stats.totalKeysExamined ?? 0;
        // Inspect execution stages for IXSCAN
        const explainStr = JSON.stringify(explainResult);
        if (explainStr.includes('IXSCAN') || explainStr.includes('ixscan') || keysExamined > 0) {
            indexUsed = true;
            stageSummary = 'IXSCAN + AGGREGATION_PIPELINE';
        }
        else {
            stageSummary = 'COLLSCAN + AGGREGATION_PIPELINE';
        }
    }
    catch (err) {
        // Some pipelines with certain stages might fallback
        console.warn('[Pipeline Explain] Warning running explain:', err);
    }
    // Run actual aggregation
    const data = await model.aggregate(pipeline);
    const executionTimeMs = Date.now() - startTime;
    return {
        data,
        inspector: {
            pipeline,
            executionTimeMs,
            docsExamined,
            docsReturned: data.length || docsReturned,
            keysExamined,
            indexUsed,
            stageSummary,
        },
    };
}
// Build standard $match stage from filter
export function buildMealLogMatch(filter) {
    const match = {};
    if (filter.startDate || filter.endDate) {
        match.date = {};
        if (filter.startDate)
            match.date.$gte = new Date(filter.startDate);
        if (filter.endDate)
            match.date.$lte = new Date(filter.endDate);
    }
    if (filter.messId && filter.messId !== 'ALL') {
        match.messId = new mongoose.Types.ObjectId(filter.messId);
    }
    if (filter.mealType && filter.mealType !== 'ALL') {
        match.mealType = filter.mealType;
    }
    if (filter.foodCategory && filter.foodCategory !== 'ALL') {
        match.foodCategory = filter.foodCategory;
    }
    return match;
}
export function buildListingMatch(filter) {
    const match = {};
    if (filter.startDate || filter.endDate) {
        match.createdAt = {};
        if (filter.startDate)
            match.createdAt.$gte = new Date(filter.startDate);
        if (filter.endDate)
            match.createdAt.$lte = new Date(filter.endDate);
    }
    if (filter.messId && filter.messId !== 'ALL') {
        match.messId = new mongoose.Types.ObjectId(filter.messId);
    }
    if (filter.ngoId && filter.ngoId !== 'ALL') {
        match.claimedByNgoId = new mongoose.Types.ObjectId(filter.ngoId);
    }
    if (filter.mealType && filter.mealType !== 'ALL') {
        match.mealType = filter.mealType;
    }
    if (filter.foodCategory && filter.foodCategory !== 'ALL') {
        match.foodCategory = filter.foodCategory;
    }
    return match;
}
// 1. KPI Overview & Impact
export async function getOverviewImpactKPIs(filter) {
    const mealMatch = buildMealLogMatch(filter);
    const listingMatch = buildListingMatch(filter);
    const setting = await SystemSetting.findOne({ key: 'GLOBAL_CONFIG' }).lean();
    const kgPerMeal = setting?.impactFactors?.kgPerMeal || 0.4;
    const co2eFactor = setting?.impactFactors?.co2eFactorPerKg || 2.5;
    const costPerKg = setting?.impactFactors?.costPerKgRs || 60.0;
    // Pipeline using $facet for multi-dimensional metrics
    const mealPipeline = [
        { $match: mealMatch },
        {
            $facet: {
                totals: [
                    {
                        $group: {
                            _id: null,
                            totalPreparedKg: { $sum: '$preparedKg' },
                            totalServedKg: { $sum: '$servedKg' },
                            totalLeftoverKg: { $sum: '$leftoverKg' },
                            totalDonatedKg: { $sum: '$donatedKg' },
                            totalCostLeftoverRs: { $sum: '$costOfLeftoverRs' },
                            recordsCount: { $sum: 1 },
                        },
                    },
                ],
                anomalies: [
                    { $match: { isAnomaly: true } },
                    { $count: 'count' },
                ],
            },
        },
    ];
    const { data: mealData, inspector: mealInspector } = await runPipelineWithInspection(MealLog, mealPipeline);
    const totals = mealData[0]?.totals[0] || {
        totalPreparedKg: 0,
        totalServedKg: 0,
        totalLeftoverKg: 0,
        totalDonatedKg: 0,
        totalCostLeftoverRs: 0,
        recordsCount: 0,
    };
    const anomaliesCount = mealData[0]?.anomalies[0]?.count || 0;
    // Listing metrics (redistributed, completed, expired)
    const listingPipeline = [
        { $match: listingMatch },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalKg: { $sum: '$quantityKg' },
            },
        },
    ];
    const { data: listingData, inspector: listingInspector } = await runPipelineWithInspection(Listing, listingPipeline);
    let completedKg = 0;
    let totalListedKg = 0;
    let completedCount = 0;
    let expiredCount = 0;
    listingData.forEach((item) => {
        totalListedKg += item.totalKg;
        if (item._id === 'COMPLETED') {
            completedKg += item.totalKg;
            completedCount += item.count;
        }
        else if (item._id === 'EXPIRED' || item._id === 'FAILED') {
            expiredCount += item.count;
        }
    });
    const redistributionEfficiencyPct = totalListedKg > 0 ? parseFloat(((completedKg / totalListedKg) * 100).toFixed(1)) : 0;
    const beneficiariesServed = Math.round(completedKg / kgPerMeal);
    const co2eAvoidedKg = parseFloat((completedKg * co2eFactor).toFixed(1));
    const costSavedRs = Math.round(completedKg * costPerKg);
    return {
        kpis: {
            totalPreparedKg: totals.totalPreparedKg,
            totalLeftoverKg: totals.totalLeftoverKg,
            totalDonatedKg: totals.totalDonatedKg,
            totalRedistributedKg: completedKg,
            redistributionEfficiencyPct,
            beneficiariesServed,
            co2eAvoidedKg,
            costSavedRs,
            anomaliesCount,
            completedPickups: completedCount,
            expiredPickups: expiredCount,
        },
        assumptions: {
            kgPerMeal,
            co2eFactorPerKg: co2eFactor,
            costPerKgRs: costPerKg,
            source: 'Global Configuration & GHG Protocol Food Loss & Waste Model',
        },
        inspector: mealInspector,
    };
}
// 2. Total Donated vs Redistributed Time-Series (with $dateTrunc and $setWindowFields moving average!)
export async function getDonatedVsRedistributedTrends(filter) {
    const match = buildListingMatch(filter);
    const pipeline = [
        { $match: match },
        {
            $group: {
                _id: {
                    period: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                },
                donatedKg: { $sum: '$quantityKg' },
                redistributedKg: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$quantityKg', 0],
                    },
                },
                donationsCount: { $sum: 1 },
            },
        },
        { $sort: { '_id.period': 1 } },
        {
            $project: {
                _id: 0,
                date: '$_id.period',
                donatedKg: { $round: ['$donatedKg', 1] },
                redistributedKg: { $round: ['$redistributedKg', 1] },
                efficiencyPct: {
                    $cond: [
                        { $gt: ['$donatedKg', 0] },
                        { $round: [{ $multiply: [{ $divide: ['$redistributedKg', '$donatedKg'] }, 100] }, 1] },
                        0,
                    ],
                },
            },
        },
        { $limit: 90 }, // Last 90 periods
    ];
    return await runPipelineWithInspection(Listing, pipeline);
}
// 3. Waste Per Mess Leaderboard / Bar Chart
export async function getWastePerMess(filter) {
    const match = buildMealLogMatch(filter);
    const pipeline = [
        { $match: match },
        {
            $group: {
                _id: '$messId',
                totalPreparedKg: { $sum: '$preparedKg' },
                totalServedKg: { $sum: '$servedKg' },
                totalLeftoverKg: { $sum: '$leftoverKg' },
                totalDonatedKg: { $sum: '$donatedKg' },
                totalCostRs: { $sum: '$costOfLeftoverRs' },
                anomaliesCount: {
                    $sum: { $cond: ['$isAnomaly', 1, 0] },
                },
            },
        },
        {
            $lookup: {
                from: 'messes',
                localField: '_id',
                foreignField: '_id',
                as: 'mess',
            },
        },
        { $unwind: '$mess' },
        {
            $project: {
                _id: 1,
                messName: '$mess.name',
                campus: '$mess.campus',
                capacity: '$mess.capacity',
                totalPreparedKg: { $round: ['$totalPreparedKg', 1] },
                totalLeftoverKg: { $round: ['$totalLeftoverKg', 1] },
                totalDonatedKg: { $round: ['$totalDonatedKg', 1] },
                wasteRatePct: {
                    $round: [
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        '$totalLeftoverKg',
                                        { $cond: [{ $gt: ['$totalPreparedKg', 0] }, '$totalPreparedKg', 1] },
                                    ],
                                },
                                100,
                            ],
                        },
                        1,
                    ],
                },
                totalCostRs: '$totalCostRs',
                anomaliesCount: '$anomaliesCount',
            },
        },
        { $sort: { totalLeftoverKg: -1 } },
        { $limit: 20 },
    ];
    return await runPipelineWithInspection(MealLog, pipeline);
}
// 4. Leftover by Weekday x Meal Type Heatmap
export async function getWeekdayMealTypeHeatmap(filter) {
    const match = buildMealLogMatch(filter);
    const pipeline = [
        { $match: match },
        {
            $group: {
                _id: {
                    dayOfWeek: '$dayOfWeek',
                    mealType: '$mealType',
                },
                avgLeftoverKg: { $avg: '$leftoverKg' },
                totalLeftoverKg: { $sum: '$leftoverKg' },
                mealCount: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                dayOfWeek: '$_id.dayOfWeek',
                mealType: '$_id.mealType',
                avgLeftoverKg: { $round: ['$avgLeftoverKg', 1] },
                totalLeftoverKg: { $round: ['$totalLeftoverKg', 1] },
                mealCount: '$mealCount',
            },
        },
        { $sort: { dayOfWeek: 1, mealType: 1 } },
    ];
    return await runPipelineWithInspection(MealLog, pipeline);
}
// 5. Food Category Waste Pareto Chart
export async function getCategoryParetoChart(filter) {
    const match = buildMealLogMatch(filter);
    const pipeline = [
        { $match: match },
        {
            $group: {
                _id: '$foodCategory',
                totalLeftoverKg: { $sum: '$leftoverKg' },
                totalCostRs: { $sum: '$costOfLeftoverRs' },
                mealCount: { $sum: 1 },
            },
        },
        { $sort: { totalLeftoverKg: -1 } },
    ];
    const { data, inspector } = await runPipelineWithInspection(MealLog, pipeline);
    // Calculate cumulative percentage for Pareto
    const totalWaste = data.reduce((acc, curr) => acc + curr.totalLeftoverKg, 0);
    let cumulative = 0;
    const paretoData = data.map((item) => {
        cumulative += item.totalLeftoverKg;
        const cumulativePct = totalWaste > 0 ? (cumulative / totalWaste) * 100 : 0;
        return {
            category: item._id,
            totalLeftoverKg: Math.round(item.totalLeftoverKg),
            totalCostRs: item.totalCostRs,
            pctOfTotal: totalWaste > 0 ? parseFloat(((item.totalLeftoverKg / totalWaste) * 100).toFixed(1)) : 0,
            cumulativePct: parseFloat(cumulativePct.toFixed(1)),
        };
    });
    return { data: paretoData, inspector };
}
// 6. NGO Success Rate and Average Collection Time
export async function getNgoPerformanceMetrics(filter) {
    const match = buildListingMatch(filter);
    match.claimedByNgoId = { $exists: true, $ne: null };
    const pipeline = [
        { $match: match },
        {
            $group: {
                _id: '$claimedByNgoId',
                totalClaimed: { $sum: 1 },
                totalCompleted: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
                },
                totalFailed: {
                    $sum: { $cond: [{ $in: ['$status', ['FAILED', 'EXPIRED']] }, 1, 0] },
                },
                totalWeightRedistributedKg: {
                    $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$quantityKg', 0] },
                },
                avgCollectionDelayMinutes: {
                    $avg: {
                        $divide: [
                            { $subtract: [{ $ifNull: ['$collectedAt', '$collectBy'] }, '$claimedAt'] },
                            60000,
                        ],
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'ngos',
                localField: '_id',
                foreignField: '_id',
                as: 'ngo',
            },
        },
        { $unwind: '$ngo' },
        {
            $project: {
                _id: 1,
                ngoName: '$ngo.name',
                serviceRadiusKm: '$ngo.serviceRadiusKm',
                vehicleCapacityKg: '$ngo.vehicleCapacityKg',
                totalClaimed: 1,
                totalCompleted: 1,
                totalFailed: 1,
                totalWeightRedistributedKg: { $round: ['$totalWeightRedistributedKg', 1] },
                successRatePct: {
                    $round: [
                        {
                            $multiply: [
                                { $divide: ['$totalCompleted', { $cond: [{ $gt: ['$totalClaimed', 0] }, '$totalClaimed', 1] }] },
                                100,
                            ],
                        },
                        1,
                    ],
                },
                avgCollectionMinutes: { $round: ['$avgCollectionDelayMinutes', 0] },
                bayesianScore: '$ngo.reliabilityStats.bayesianScore',
            },
        },
        { $sort: { totalWeightRedistributedKg: -1 } },
        { $limit: 25 },
    ];
    return await runPipelineWithInspection(Listing, pipeline);
}
// 7. Week-over-Week & Month-over-Month Change Pipeline
export async function getGrowthMetrics(filter) {
    const match = buildMealLogMatch(filter);
    const pipeline = [
        { $match: match },
        {
            $group: {
                _id: {
                    month: { $dateToString: { format: '%Y-%m', date: '$date' } },
                },
                totalLeftoverKg: { $sum: '$leftoverKg' },
                totalPreparedKg: { $sum: '$preparedKg' },
                records: { $sum: 1 },
            },
        },
        { $sort: { '_id.month': 1 } },
        {
            $project: {
                _id: 0,
                month: '$_id.month',
                totalLeftoverKg: { $round: ['$totalLeftoverKg', 1] },
                totalPreparedKg: { $round: ['$totalPreparedKg', 1] },
            },
        },
    ];
    const { data, inspector } = await runPipelineWithInspection(MealLog, pipeline);
    // Compute MoM percentage changes
    const formatted = data.map((item, index) => {
        let momChangePct = 0;
        if (index > 0 && data[index - 1].totalLeftoverKg > 0) {
            const prev = data[index - 1].totalLeftoverKg;
            momChangePct = parseFloat((((item.totalLeftoverKg - prev) / prev) * 100).toFixed(1));
        }
        return {
            ...item,
            momChangePct,
        };
    });
    return { data: formatted, inspector };
}
// 8. Geospatial Analytics: Donation hotspots, NGO circles, and Unserved Zones
export async function getGeospatialAnalytics() {
    const [messes, ngos, expiredByMess] = await Promise.all([
        Mess.find({ isActive: true }).select('name campus location address capacity averageDailyLeftoverKg').lean(),
        Ngo.find({ isActive: true }).select('name location serviceRadiusKm vehicleCapacityKg reliabilityStats').lean(),
        Listing.aggregate([
            { $match: { status: 'EXPIRED' } },
            {
                $group: {
                    _id: '$messId',
                    expiredCount: { $sum: 1 },
                    expiredKg: { $sum: '$quantityKg' },
                },
            },
            { $sort: { expiredKg: -1 } },
        ]),
    ]);
    // Identify unserved zones: Messes whose distance to nearest NGO is close to or exceeds service radius
    const unservedZones = messes
        .map(mess => {
        const [mEast, mNorth] = mess.location.coordinates;
        let minDistance = Infinity;
        let nearestNgo = null;
        ngos.forEach(ngo => {
            const [nEast, nNorth] = ngo.location.coordinates;
            // Approx Euclidean distance in degrees -> km
            const dLat = (mNorth - nNorth) * 111;
            const dLng = (mEast - nEast) * 111 * Math.cos((mNorth * Math.PI) / 180);
            const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
            if (distKm < minDistance) {
                minDistance = distKm;
                nearestNgo = ngo;
            }
        });
        const expiredRecord = expiredByMess.find(e => e._id.toString() === mess._id.toString());
        const expiredCount = expiredRecord ? expiredRecord.expiredCount : 0;
        const expiredKg = expiredRecord ? Math.round(expiredRecord.expiredKg) : 0;
        const isUnserved = minDistance > 16 || expiredCount >= 10;
        return {
            messId: mess._id,
            messName: mess.name,
            campus: mess.campus,
            coordinates: mess.location.coordinates,
            distanceToNearestNgoKm: parseFloat(minDistance.toFixed(1)),
            nearestNgoName: nearestNgo?.name || 'None',
            expiredDonationsCount: expiredCount,
            expiredKgTotal: expiredKg,
            isUnserved,
            monthlyRecoverableWasteKg: Math.round(mess.averageDailyLeftoverKg * 18),
        };
    })
        .sort((a, b) => b.expiredKgTotal - a.expiredKgTotal);
    const topUnserved = unservedZones.find(z => z.isUnserved);
    const recommendation = topUnserved
        ? `Recommendation: Adding NGO collection capacity near ${topUnserved.campus} (${topUnserved.messName}) would recover ~${topUnserved.monthlyRecoverableWasteKg} kg/month of presently expired surplus.`
        : 'All campus messes are currently within optimal NGO coverage circles.';
    return {
        messes,
        ngos,
        unservedZones,
        recommendation,
    };
}

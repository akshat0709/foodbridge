import { Ngo } from '../models/Ngo.js';
import { SystemSetting } from '../models/SystemSetting.js';
export function calculateScoreBreakdown(distanceKm, serviceRadiusKm, vehicleCapacityKg, quantityKg, collectBy, ngoReliability, referenceTime = new Date()) {
    // 1. Distance score (0-100)
    const distanceScore = Math.max(0, Math.min(100, Math.round(100 * (1 - distanceKm / Math.max(serviceRadiusKm, distanceKm, 1)))));
    // 2. Capacity fit score (0-100)
    let capacityScore = 100;
    if (vehicleCapacityKg >= quantityKg) {
        // Fits with room to spare
        const ratio = vehicleCapacityKg / Math.max(quantityKg * 2, 1);
        capacityScore = Math.min(100, Math.round(75 + 25 * Math.min(1, ratio)));
    }
    else {
        // Under-capacity penalty
        capacityScore = Math.max(10, Math.round(70 * (vehicleCapacityKg / Math.max(quantityKg, 1))));
    }
    // 3. Deadline Feasibility score (0-100)
    const remainingMinutes = (collectBy.getTime() - referenceTime.getTime()) / (1000 * 60);
    const transitMinutes = 15 + distanceKm * 2.5 + 15; // 15m prep/dispatch + transit + 15m load
    const marginMinutes = remainingMinutes - transitMinutes;
    let deadlineScore = 100;
    if (marginMinutes >= 60) {
        deadlineScore = 100;
    }
    else if (marginMinutes > 0) {
        deadlineScore = Math.round(50 + 50 * (marginMinutes / 60));
    }
    else {
        deadlineScore = Math.max(0, Math.round(50 + marginMinutes));
    }
    // 4. Historical Reliability score (0-100)
    // Check time of day for profiling
    const hour = referenceTime.getHours();
    let todMultiplier = 1.0;
    if (ngoReliability.timeOfDayProfile) {
        if (hour >= 6 && hour < 12)
            todMultiplier = ngoReliability.timeOfDayProfile.morningRate;
        else if (hour >= 12 && hour < 17)
            todMultiplier = ngoReliability.timeOfDayProfile.afternoonRate;
        else if (hour >= 17 && hour < 22)
            todMultiplier = ngoReliability.timeOfDayProfile.eveningRate;
        else
            todMultiplier = ngoReliability.timeOfDayProfile.nightRate;
    }
    const delayPenalty = Math.max(0, Math.min(25, (ngoReliability.averageDelayMinutes - 15) * 0.5));
    const rawReliability = ngoReliability.bayesianScore * todMultiplier * 100 - delayPenalty;
    const reliabilityScore = Math.max(0, Math.min(100, Math.round(rawReliability)));
    const explanation = `${distanceKm.toFixed(1)} km away (score ${distanceScore}/100); ${vehicleCapacityKg}kg capacity for ${quantityKg}kg surplus (score ${capacityScore}/100); ${Math.round(remainingMinutes)}m window vs ${Math.round(transitMinutes)}m transit (score ${deadlineScore}/100); ${(ngoReliability.bayesianScore * 100).toFixed(0)}% Bayesian reliability with ${ngoReliability.averageDelayMinutes}m avg delay (score ${reliabilityScore}/100).`;
    return {
        breakdown: {
            distanceScore,
            capacityScore,
            deadlineScore,
            reliabilityScore,
        },
        explanation,
    };
}
export async function matchListingToNgos(input, limit = 5) {
    const { pickupCoordinates, quantityKg, collectBy, customWeights } = input;
    // Retrieve global weights if not provided
    let weights = customWeights;
    if (!weights) {
        const setting = await SystemSetting.findOne({ key: 'GLOBAL_CONFIG' }).lean();
        weights = setting?.weights || {
            distanceWeight: 0.35,
            capacityWeight: 0.25,
            deadlineWeight: 0.20,
            reliabilityWeight: 0.20,
        };
    }
    // Use MongoDB $geoNear aggregation pipeline to find nearby active NGOs
    const maxDistanceMeters = 35000; // 35 km max search
    const candidates = await Ngo.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: pickupCoordinates,
                },
                distanceField: 'distanceMeters',
                spherical: true,
                maxDistance: maxDistanceMeters,
                query: { isActive: true },
            },
        },
        { $limit: 25 },
    ]);
    if (!candidates || candidates.length === 0) {
        return [];
    }
    const scoredMatches = candidates.map(candidate => {
        const distanceKm = candidate.distanceMeters / 1000;
        const { breakdown, explanation } = calculateScoreBreakdown(distanceKm, candidate.serviceRadiusKm, candidate.vehicleCapacityKg, quantityKg, collectBy, candidate.reliabilityStats);
        const totalScore = parseFloat((breakdown.distanceScore * weights.distanceWeight +
            breakdown.capacityScore * weights.capacityWeight +
            breakdown.deadlineScore * weights.deadlineWeight +
            breakdown.reliabilityScore * weights.reliabilityWeight).toFixed(1));
        return {
            ngoId: candidate._id,
            ngoName: candidate.name,
            totalScore,
            distanceKm: parseFloat(distanceKm.toFixed(2)),
            breakdown,
            explanation: `Match Score ${totalScore}: ` + explanation,
        };
    });
    // Sort descending by totalScore and assign ranks
    scoredMatches.sort((a, b) => b.totalScore - a.totalScore);
    return scoredMatches.slice(0, limit).map((match, index) => ({
        ngoId: match.ngoId,
        rank: index + 1,
        totalScore: match.totalScore,
        distanceKm: match.distanceKm,
        breakdown: match.breakdown,
        explanation: match.explanation,
    }));
}

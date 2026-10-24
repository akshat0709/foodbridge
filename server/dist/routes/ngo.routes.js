import { Router } from 'express';
import { z } from 'zod';
import { Ngo } from '../models/Ngo.js';
import { Listing } from '../models/Listing.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { AppError } from '../middleware/errorHandler.js';
export const ngoRouter = Router();
const updateSettingsSchema = z.object({
    serviceRadiusKm: z.number().min(1).max(100).optional(),
    vehicleCapacityKg: z.number().min(10).max(5000).optional(),
    operatingHours: z
        .object({
        start: z.string(),
        end: z.string(),
    })
        .optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
});
ngoRouter.get('/', authenticate, async (req, res, next) => {
    try {
        const ngos = await Ngo.find({ isActive: true }).sort({ name: 1 }).lean();
        res.json({ success: true, data: ngos });
    }
    catch (err) {
        next(err);
    }
});
ngoRouter.get('/leaderboard', authenticate, async (req, res, next) => {
    try {
        // Smoothed Bayesian average leaderboard with time of day profile
        const ngos = await Ngo.find({ isActive: true })
            .sort({ 'reliabilityStats.bayesianScore': -1 })
            .lean();
        res.json({ success: true, data: ngos });
    }
    catch (err) {
        next(err);
    }
});
ngoRouter.get('/:id', authenticate, async (req, res, next) => {
    try {
        const ngo = await Ngo.findById(req.params.id).lean();
        if (!ngo)
            return next(new AppError('NGO not found', 404, 'NOT_FOUND'));
        res.json({ success: true, data: ngo });
    }
    catch (err) {
        next(err);
    }
});
ngoRouter.put('/:id/settings', authenticate, validate(updateSettingsSchema), async (req, res, next) => {
    try {
        const ngo = await Ngo.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!ngo)
            return next(new AppError('NGO not found', 404, 'NOT_FOUND'));
        res.json({ success: true, data: ngo });
    }
    catch (err) {
        next(err);
    }
});
ngoRouter.get('/:id/nearby-donations', authenticate, async (req, res, next) => {
    try {
        const ngo = await Ngo.findById(req.params.id).lean();
        if (!ngo)
            return next(new AppError('NGO not found', 404, 'NOT_FOUND'));
        const maxMeters = ngo.serviceRadiusKm * 1000;
        const [lng, lat] = ngo.location.coordinates;
        // Geospatial search for AVAILABLE listings within NGO's service radius
        const nearbyListings = await Listing.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [lng, lat] },
                    distanceField: 'distanceMeters',
                    maxDistance: maxMeters,
                    spherical: true,
                    query: { status: 'AVAILABLE' },
                },
            },
            {
                $lookup: {
                    from: 'messes',
                    localField: 'messId',
                    foreignField: '_id',
                    as: 'mess',
                },
            },
            { $unwind: '$mess' },
            { $sort: { distanceMeters: 1 } },
            { $limit: 50 },
        ]);
        const formatted = nearbyListings.map(item => ({
            ...item,
            distanceKm: parseFloat((item.distanceMeters / 1000).toFixed(2)),
        }));
        res.json({ success: true, data: formatted });
    }
    catch (err) {
        next(err);
    }
});

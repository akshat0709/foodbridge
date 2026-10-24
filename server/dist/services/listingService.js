import { Types } from 'mongoose';
import { Listing } from '../models/Listing.js';
import { Ngo } from '../models/Ngo.js';
import { Mess } from '../models/Mess.js';
import { AppError } from '../middleware/errorHandler.js';
import { matchListingToNgos } from './matchingEngine.js';
export async function createListing(data) {
    const mess = await Mess.findById(data.messId);
    if (!mess) {
        throw new AppError('Mess not found', 404, 'MESS_NOT_FOUND');
    }
    // Run matching engine to rank NGOs
    const matchingScores = await matchListingToNgos({
        pickupCoordinates: mess.location.coordinates,
        quantityKg: data.quantityKg,
        collectBy: data.collectBy,
        preparedAt: data.preparedAt,
    });
    const now = new Date();
    const listing = new Listing({
        messId: mess._id,
        title: data.title,
        foodCategory: data.foodCategory,
        mealType: data.mealType,
        quantityKg: data.quantityKg,
        portionsEstimate: data.portionsEstimate,
        preparedAt: data.preparedAt,
        collectBy: data.collectBy,
        dietaryTags: data.dietaryTags || ['VEG'],
        pickupLocation: mess.location,
        pickupAddress: data.pickupAddress || mess.address,
        status: 'AVAILABLE',
        matchingScores,
        notes: data.notes,
        statusHistory: [
            {
                status: 'AVAILABLE',
                timestamp: now,
                updatedBy: data.userId ? new Types.ObjectId(data.userId) : undefined,
                note: 'Listing created and available for claims',
            },
        ],
    });
    return await listing.save();
}
/**
 * ATOMIC CLAIM FUNCTION
 * Uses findOneAndUpdate with precondition `{ _id: listingId, status: 'AVAILABLE' }`.
 * MongoDB guarantees document-level write atomicity. If concurrent requests arrive,
 * only the first request matches status 'AVAILABLE' and transitions the document.
 * All subsequent concurrent calls return null and receive a 409 Conflict.
 */
export async function claimListingAtomic(listingId, ngoId, userId, note) {
    const ngo = await Ngo.findById(ngoId);
    if (!ngo) {
        throw new AppError('NGO not found', 404, 'NGO_NOT_FOUND');
    }
    const now = new Date();
    const claimedListing = await Listing.findOneAndUpdate({
        _id: listingId,
        status: 'AVAILABLE', // PRECONDITION FOR RACE-CONDITION PREVENTION
    }, {
        $set: {
            status: 'RESERVED',
            claimedByNgoId: ngo._id,
            claimedAt: now,
            pickupAssignedAt: now,
        },
        $push: {
            statusHistory: {
                status: 'RESERVED',
                timestamp: now,
                updatedBy: userId ? new Types.ObjectId(userId) : undefined,
                note: note || `Claimed by ${ngo.name}`,
            },
        },
    }, {
        new: true, // Return modified document
    });
    if (!claimedListing) {
        // Check if it exists with another status
        const current = await Listing.findById(listingId).lean();
        if (!current) {
            throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
        }
        throw new AppError(`Listing cannot be claimed. Current status is '${current.status}' (already claimed or expired).`, 409, 'CLAIM_CONFLICT');
    }
    return claimedListing;
}
export async function transitionListingStatus(listingId, targetStatus, userId, note) {
    const listing = await Listing.findById(listingId);
    if (!listing) {
        throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
    }
    // Validate valid state transitions
    const validTransitions = {
        AVAILABLE: ['RESERVED', 'EXPIRED'],
        RESERVED: ['COLLECTED', 'EXPIRED', 'FAILED'],
        COLLECTED: ['COMPLETED', 'FAILED'],
        COMPLETED: [],
        EXPIRED: [],
        FAILED: [],
    };
    const allowed = validTransitions[listing.status] || [];
    if (!allowed.includes(targetStatus)) {
        throw new AppError(`Invalid transition from '${listing.status}' to '${targetStatus}'.`, 400, 'INVALID_TRANSITION');
    }
    const now = new Date();
    listing.status = targetStatus;
    if (targetStatus === 'COLLECTED') {
        listing.collectedAt = now;
    }
    else if (targetStatus === 'COMPLETED') {
        listing.completedAt = now;
    }
    listing.statusHistory.push({
        status: targetStatus,
        timestamp: now,
        updatedBy: userId ? new Types.ObjectId(userId) : undefined,
        note: note || `Transitioned to ${targetStatus}`,
    });
    return await listing.save();
}

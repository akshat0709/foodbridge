import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { Listing } from '../src/models/Listing.js';
import { Mess } from '../src/models/Mess.js';
import { Ngo } from '../src/models/Ngo.js';
import { claimListingAtomic } from '../src/services/listingService.js';
import { connectDB, disconnectDB } from '../src/db.js';

describe('Atomic Claiming Concurrency Race Condition Test', () => {
  let testListingId: string;
  let ngo1Id: string;
  let ngo2Id: string;
  let ngo3Id: string;

  beforeAll(async () => {
    await connectDB();

    const mess = await Mess.findOne();
    const ngos = await Ngo.find().limit(3);

    if (!mess || ngos.length < 3) {
      throw new Error('Database must have seeded messes and ngos before running test.');
    }

    ngo1Id = ngos[0]._id.toString();
    ngo2Id = ngos[1]._id.toString();
    ngo3Id = ngos[2]._id.toString();

    // Create an AVAILABLE listing for test
    const listing = await Listing.create({
      messId: mess._id,
      title: 'Race Condition Test Surplus',
      foodCategory: 'COOKED_MEALS',
      mealType: 'DINNER',
      quantityKg: 35,
      portionsEstimate: 90,
      preparedAt: new Date(),
      collectBy: new Date(Date.now() + 3600000),
      pickupLocation: mess.location,
      pickupAddress: mess.address,
      status: 'AVAILABLE',
      statusHistory: [{ status: 'AVAILABLE', timestamp: new Date() }],
    });

    testListingId = listing._id.toString();
  });

  afterAll(async () => {
    if (testListingId) {
      await Listing.findByIdAndDelete(testListingId);
    }
    await disconnectDB();
  });

  it('proves only ONE of multiple concurrent claims wins, while all other callers receive 409 conflict', async () => {
    // Fire 5 concurrent claim requests simultaneously via Promise.allSettled
    const concurrentRequests = [
      claimListingAtomic(testListingId, ngo1Id, undefined, 'Claim candidate 1'),
      claimListingAtomic(testListingId, ngo2Id, undefined, 'Claim candidate 2'),
      claimListingAtomic(testListingId, ngo3Id, undefined, 'Claim candidate 3'),
      claimListingAtomic(testListingId, ngo1Id, undefined, 'Claim candidate 4'),
      claimListingAtomic(testListingId, ngo2Id, undefined, 'Claim candidate 5'),
    ];

    const results = await Promise.allSettled(concurrentRequests);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // EXACTLY 1 claim must win!
    expect(fulfilled.length).toBe(1);
    // All remaining 4 concurrent attempts must fail
    expect(rejected.length).toBe(4);

    // Verify rejection reason is CLAIM_CONFLICT
    rejected.forEach(rej => {
      const reason = (rej as PromiseRejectedResult).reason;
      expect(reason.code).toBe('CLAIM_CONFLICT');
      expect(reason.statusCode).toBe(409);
    });

    // Verify document in database has status RESERVED and 1 entry in statusHistory
    const updated = await Listing.findById(testListingId);
    expect(updated?.status).toBe('RESERVED');
    expect(updated?.statusHistory.some(s => s.status === 'RESERVED')).toBe(true);
  });
});

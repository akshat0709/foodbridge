import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Listing } from '../models/Listing.js';
import { Mess } from '../models/Mess.js';
import { Ngo } from '../models/Ngo.js';
import { authenticate, authorize, assertOrgAccess } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createListing, claimListingAtomic, transitionListingStatus } from '../services/listingService.js';
import { matchListingToNgos } from '../services/matchingEngine.js';
import { AppError } from '../middleware/errorHandler.js';

export const listingRouter = Router();

const createListingSchema = z.object({
  messId: z.string().min(1, 'Mess ID is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  foodCategory: z.enum(['COOKED_MEALS', 'RAW_VEGETABLES', 'GRAINS_STAPLES', 'BAKERY_SNACKS', 'PACKAGED']),
  mealType: z.enum(['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER']),
  quantityKg: z.number().positive('Quantity must be greater than 0'),
  portionsEstimate: z.number().int().positive('Portions must be greater than 0'),
  preparedAt: z.string().datetime(),
  collectBy: z.string().datetime(),
  dietaryTags: z.array(z.string()).optional(),
  pickupAddress: z.string().optional(),
  notes: z.string().optional(),
});

// Mess Admin creates listing
listingRouter.post(
  '/',
  authenticate,
  authorize(['MESS_ADMIN', 'PLATFORM_ADMIN']),
  validate(createListingSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Mess admins can only post surplus for their own mess.
      assertOrgAccess(req.user, req.body.messId);
      const listing = await createListing({
        ...req.body,
        preparedAt: new Date(req.body.preparedAt),
        collectBy: new Date(req.body.collectBy),
        userId: req.user!.userId,
      });

      res.status(201).json({
        success: true,
        data: listing,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Get listings with filters & cursor/page pagination
listingRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      messId,
      claimedByNgoId,
      foodCategory,
      mealType,
      limit = '25',
      page = '1',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter: any = {};
    if (status && status !== 'ALL') filter.status = status;
    const user = req.user!;
    if (messId) filter.messId = messId;
    if (claimedByNgoId) filter.claimedByNgoId = claimedByNgoId;
    if (foodCategory && foodCategory !== 'ALL') filter.foodCategory = foodCategory;
    if (mealType && mealType !== 'ALL') filter.mealType = mealType;

    // Scope by role: mess admins see only their mess's listings; NGO reps see
    // open (AVAILABLE) listings plus the ones they have claimed.
    if (user.role === 'MESS_ADMIN') {
      filter.messId = user.organizationId || '000000000000000000000000';
    } else if (user.role === 'NGO_REP') {
      const ownNgo = user.organizationId || '000000000000000000000000';
      if (claimedByNgoId && String(claimedByNgoId) !== String(ownNgo)) {
        return next(new AppError('Forbidden: you can only view your own pickups.', 403, 'FORBIDDEN'));
      }
      if (!claimedByNgoId) {
        filter.$or = [{ status: 'AVAILABLE' }, { claimedByNgoId: ownNgo }];
      }
    }

    // Only allow sorting on known fields (sortBy comes straight from the query string).
    const sortable = ['createdAt', 'updatedAt', 'collectBy', 'preparedAt', 'quantityKg', 'status'];
    const sortField = sortable.includes(sortBy as string) ? (sortBy as string) : 'createdAt';

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = { [sortField]: sortDir };

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .populate('messId', 'name campus address location phone')
        .populate('claimedByNgoId', 'name phone location serviceRadiusKm')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Listing.countDocuments(filter),
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

// Single listing details
listingRouter.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('messId', 'name campus address location phone contactPerson capacity')
      .populate('claimedByNgoId', 'name phone location serviceRadiusKm vehicleCapacityKg contactPerson')
      .populate('matchingScores.ngoId', 'name location serviceRadiusKm vehicleCapacityKg reliabilityStats')
      .lean();

    if (!listing) {
      return next(new AppError('Listing not found', 404, 'NOT_FOUND'));
    }

    const user = req.user!;
    const messRef: any = listing.messId;
    const ngoRef: any = listing.claimedByNgoId;
    if (user.role === 'MESS_ADMIN') {
      assertOrgAccess(user, messRef?._id ?? messRef);
    } else if (user.role === 'NGO_REP' && listing.status !== 'AVAILABLE') {
      assertOrgAccess(user, ngoRef?._id ?? ngoRef);
    }

    res.json({
      success: true,
      data: listing,
    });
  } catch (err) {
    next(err);
  }
});

// ATOMIC CLAIM ENDPOINT
listingRouter.post(
  '/:id/claim',
  authenticate,
  authorize(['NGO_REP', 'PLATFORM_ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // NGO reps always claim for their own NGO; only platform admins may claim on behalf of another.
      const ngoId =
        req.user!.role === 'PLATFORM_ADMIN' ? req.body.ngoId || req.user!.organizationId : req.user!.organizationId;
      if (!ngoId) {
        return next(new AppError('NGO identification missing', 400, 'NGO_ID_REQUIRED'));
      }

      const listing = await claimListingAtomic(
        req.params.id,
        ngoId,
        req.user!.userId,
        req.body.note
      );

      res.json({
        success: true,
        message: 'Listing successfully claimed and reserved',
        data: listing,
      });
    } catch (err) {
      next(err);
    }
  }
);

// STATUS TRANSITION (COLLECTED, COMPLETED, FAILED)
listingRouter.post(
  '/:id/transition',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, note } = req.body;
      if (!status) {
        return next(new AppError('Target status is required', 400, 'STATUS_REQUIRED'));
      }

      // Only the NGO that claimed the listing, the mess that posted it, or a platform admin may move it along.
      const existing = await Listing.findById(req.params.id).select('messId claimedByNgoId').lean();
      if (!existing) {
        return next(new AppError('Listing not found', 404, 'NOT_FOUND'));
      }
      const user = req.user!;
      if (user.role === 'NGO_REP') {
        assertOrgAccess(user, existing.claimedByNgoId?.toString());
      } else if (user.role === 'MESS_ADMIN') {
        assertOrgAccess(user, existing.messId?.toString());
      }

      const listing = await transitionListingStatus(
        req.params.id,
        status,
        req.user!.userId,
        note
      );

      res.json({
        success: true,
        message: `Listing transitioned to ${status}`,
        data: listing,
      });
    } catch (err) {
      next(err);
    }
  }
);

// MATCHING LAB SIMULATION REPLAY
listingRouter.post(
  '/:id/match-candidates',
  authenticate,
  authorize(['PLATFORM_ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const listing = await Listing.findById(req.params.id).lean();
      if (!listing) {
        return next(new AppError('Listing not found', 404, 'NOT_FOUND'));
      }

      const customWeights = req.body.weights ? {
        distanceWeight: parseFloat(req.body.weights.distanceWeight),
        capacityWeight: parseFloat(req.body.weights.capacityWeight),
        deadlineWeight: parseFloat(req.body.weights.deadlineWeight),
        reliabilityWeight: parseFloat(req.body.weights.reliabilityWeight),
      } : undefined;

      const scoredMatches = await matchListingToNgos({
        pickupCoordinates: listing.pickupLocation.coordinates,
        quantityKg: listing.quantityKg,
        collectBy: listing.collectBy,
        preparedAt: listing.preparedAt,
        customWeights,
      }, 10);

      // Populate names for candidates
      const populatedMatches = await Promise.all(
        scoredMatches.map(async m => {
          const ngo = await Ngo.findById(m.ngoId).select('name location serviceRadiusKm vehicleCapacityKg reliabilityStats').lean();
          return {
            ...m,
            ngo,
          };
        })
      );

      res.json({
        success: true,
        data: populatedMatches,
      });
    } catch (err) {
      next(err);
    }
  }
);

import mongoose, { Schema, Document, Types } from 'mongoose';

export type ListingStatus = 'AVAILABLE' | 'RESERVED' | 'COLLECTED' | 'COMPLETED' | 'EXPIRED' | 'FAILED';
export type FoodCategory = 'COOKED_MEALS' | 'RAW_VEGETABLES' | 'GRAINS_STAPLES' | 'BAKERY_SNACKS' | 'PACKAGED';
export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';

export interface IScoreBreakdown {
  distanceScore: number;     // 0 - 100
  capacityScore: number;     // 0 - 100
  deadlineScore: number;     // 0 - 100
  reliabilityScore: number;  // 0 - 100
}

export interface IMatchingScore {
  ngoId: Types.ObjectId;
  rank: number;
  totalScore: number;        // Weighted 0 - 100
  distanceKm: number;
  breakdown: IScoreBreakdown;
  explanation: string;
}

export interface IStatusTransition {
  status: ListingStatus;
  timestamp: Date;
  updatedBy?: Types.ObjectId;
  note?: string;
}

export interface IListing extends Document {
  _id: Types.ObjectId;
  messId: Types.ObjectId;
  title: string;
  foodCategory: FoodCategory;
  mealType: MealType;
  quantityKg: number;
  portionsEstimate: number;
  preparedAt: Date;
  collectBy: Date;
  dietaryTags: string[];
  pickupLocation: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  pickupAddress: string;
  status: ListingStatus;
  claimedByNgoId?: Types.ObjectId;
  claimedAt?: Date;
  pickupAssignedAt?: Date;
  collectedAt?: Date;
  completedAt?: Date;
  matchingScores: IMatchingScore[];
  statusHistory: IStatusTransition[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const statusTransitionSchema = new Schema<IStatusTransition>(
  {
    status: {
      type: String,
      required: true,
      enum: ['AVAILABLE', 'RESERVED', 'COLLECTED', 'COMPLETED', 'EXPIRED', 'FAILED'],
    },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    note: { type: String },
  },
  { _id: false }
);

const matchingScoreSchema = new Schema<IMatchingScore>(
  {
    ngoId: { type: Schema.Types.ObjectId, ref: 'Ngo', required: true },
    rank: { type: Number, required: true },
    totalScore: { type: Number, required: true },
    distanceKm: { type: Number, required: true },
    breakdown: {
      distanceScore: { type: Number, required: true },
      capacityScore: { type: Number, required: true },
      deadlineScore: { type: Number, required: true },
      reliabilityScore: { type: Number, required: true },
    },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const listingSchema = new Schema<IListing>(
  {
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true, index: true },
    title: { type: String, required: true, trim: true },
    foodCategory: {
      type: String,
      required: true,
      enum: ['COOKED_MEALS', 'RAW_VEGETABLES', 'GRAINS_STAPLES', 'BAKERY_SNACKS', 'PACKAGED'],
      index: true,
    },
    mealType: {
      type: String,
      required: true,
      enum: ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'],
      index: true,
    },
    quantityKg: { type: Number, required: true, min: 0.1 },
    portionsEstimate: { type: Number, required: true, min: 1 },
    preparedAt: { type: Date, required: true },
    collectBy: { type: Date, required: true, index: true },
    dietaryTags: [{ type: String, trim: true }],
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    pickupAddress: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['AVAILABLE', 'RESERVED', 'COLLECTED', 'COMPLETED', 'EXPIRED', 'FAILED'],
      default: 'AVAILABLE',
      index: true,
    },
    claimedByNgoId: { type: Schema.Types.ObjectId, ref: 'Ngo', index: true },
    claimedAt: { type: Date },
    pickupAssignedAt: { type: Date },
    collectedAt: { type: Date },
    completedAt: { type: Date },
    matchingScores: [matchingScoreSchema],
    statusHistory: [statusTransitionSchema],
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

// Required indexes
listingSchema.index({ pickupLocation: '2dsphere' });
listingSchema.index({ status: 1, collectBy: 1 });
listingSchema.index({ messId: 1, createdAt: -1 });
listingSchema.index({ claimedByNgoId: 1, status: 1, completedAt: -1 });
listingSchema.index({ foodCategory: 1, mealType: 1, createdAt: -1 });
listingSchema.index({ createdAt: -1 });

export const Listing = mongoose.model<IListing>('Listing', listingSchema);

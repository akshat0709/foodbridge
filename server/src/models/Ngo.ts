import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INgo extends Document {
  _id: Types.ObjectId;
  name: string;
  registrationNumber: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  address: string;
  serviceRadiusKm: number;
  vehicleCapacityKg: number;
  operatingHours: {
    start: string; // "07:00"
    end: string;   // "23:00"
  };
  contactPerson: string;
  phone: string;
  reliabilityStats: {
    totalAssigned: number;
    totalCompleted: number;
    totalExpiredOrFailed: number;
    averageDelayMinutes: number;
    bayesianScore: number; // Smoothed Bayesian average: (C * prior + completed) / (C + assigned)
    timeOfDayProfile: {
      morningRate: number;   // 0.0 - 1.0
      afternoonRate: number;
      eveningRate: number;
      nightRate: number;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ngoSchema = new Schema<INgo>(
  {
    name: { type: String, required: true, trim: true, index: true },
    registrationNumber: { type: String, required: true, unique: true },
    location: {
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
    address: { type: String, required: true },
    serviceRadiusKm: { type: Number, required: true, default: 15 },
    vehicleCapacityKg: { type: Number, required: true, default: 150 },
    operatingHours: {
      start: { type: String, default: '07:00' },
      end: { type: String, default: '23:00' },
    },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    reliabilityStats: {
      totalAssigned: { type: Number, default: 0 },
      totalCompleted: { type: Number, default: 0 },
      totalExpiredOrFailed: { type: Number, default: 0 },
      averageDelayMinutes: { type: Number, default: 15 },
      bayesianScore: { type: Number, default: 0.85 },
      timeOfDayProfile: {
        morningRate: { type: Number, default: 0.88 },
        afternoonRate: { type: Number, default: 0.82 },
        eveningRate: { type: Number, default: 0.91 },
        nightRate: { type: Number, default: 0.75 },
      },
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for $geoNear queries
ngoSchema.index({ location: '2dsphere' });
ngoSchema.index({ 'reliabilityStats.bayesianScore': -1 });

export const Ngo = mongoose.model<INgo>('Ngo', ngoSchema);

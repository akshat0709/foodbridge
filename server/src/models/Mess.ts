import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMess extends Document {
  _id: Types.ObjectId;
  name: string;
  campus: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  address: string;
  capacity: number;
  contactPerson: string;
  phone: string;
  averageDailyLeftoverKg: number;
  overprepareTendency: number; // multiplier e.g. 1.0 = normal, 1.25 = chronic over-preparer
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const messSchema = new Schema<IMess>(
  {
    name: { type: String, required: true, trim: true, index: true },
    campus: { type: String, required: true, trim: true, index: true },
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
    capacity: { type: Number, required: true, min: 50 },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    averageDailyLeftoverKg: { type: Number, default: 0 },
    overprepareTendency: { type: Number, default: 1.0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
  }
);

// 2dsphere index for geospatial proximity search
messSchema.index({ location: '2dsphere' });
messSchema.index({ campus: 1, isActive: 1 });

export const Mess = mongoose.model<IMess>('Mess', messSchema);

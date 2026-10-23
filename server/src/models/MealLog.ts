import mongoose, { Schema, Document, Types } from 'mongoose';

export type MealFoodCategory = 'RICE_GRAINS' | 'CURRY_DAL' | 'ROTI_BREAD' | 'VEGETABLES' | 'DESSERT_SNACK';
export type MealSessionType = 'BREAKFAST' | 'LUNCH' | 'SNACKS' | 'DINNER';

export interface IMealLog extends Document {
  _id: Types.ObjectId;
  messId: Types.ObjectId;
  date: Date;
  mealType: MealSessionType;
  foodCategory: MealFoodCategory;
  plannedAttendance: number;
  actualAttendance: number;
  preparedKg: number;
  servedKg: number;
  leftoverKg: number;
  donatedKg: number;
  costOfLeftoverRs: number;
  isHoliday: boolean;
  isExamWeek: boolean;
  festivalName?: string | null;
  dayOfWeek: number; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  anomalyScore: number; // Rolling z-score or IQR distance
  isAnomaly: boolean;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mealLogSchema = new Schema<IMealLog>(
  {
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true, index: true },
    date: { type: Date, required: true, index: true },
    mealType: {
      type: String,
      required: true,
      enum: ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'],
      index: true,
    },
    foodCategory: {
      type: String,
      required: true,
      enum: ['RICE_GRAINS', 'CURRY_DAL', 'ROTI_BREAD', 'VEGETABLES', 'DESSERT_SNACK'],
      index: true,
    },
    plannedAttendance: { type: Number, required: true, min: 0 },
    actualAttendance: { type: Number, required: true, min: 0 },
    preparedKg: { type: Number, required: true, min: 0 },
    servedKg: { type: Number, required: true, min: 0 },
    leftoverKg: { type: Number, required: true, min: 0 },
    donatedKg: { type: Number, default: 0, min: 0 },
    costOfLeftoverRs: { type: Number, default: 0, min: 0 },
    isHoliday: { type: Boolean, default: false },
    isExamWeek: { type: Boolean, default: false },
    festivalName: { type: String, default: null },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    anomalyScore: { type: Number, default: 0.0 },
    isAnomaly: { type: Boolean, default: false, index: true },
    loggedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes
mealLogSchema.index({ messId: 1, date: -1, mealType: 1 });
mealLogSchema.index({ date: -1, mealType: 1 });
mealLogSchema.index({ leftoverKg: -1 });
mealLogSchema.index({ isAnomaly: 1, date: -1 });
mealLogSchema.index({ foodCategory: 1, mealType: 1 });
mealLogSchema.index({ messId: 1, foodCategory: 1, date: -1 });

export const MealLog = mongoose.model<IMealLog>('MealLog', mealLogSchema);

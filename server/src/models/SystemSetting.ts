import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
  key: string;
  weights: {
    distanceWeight: number;    // default 0.35
    capacityWeight: number;    // default 0.25
    deadlineWeight: number;    // default 0.20
    reliabilityWeight: number; // default 0.20
  };
  impactFactors: {
    kgPerMeal: number;         // default 0.4
    co2eFactorPerKg: number;   // default 2.5
    costPerKgRs: number;       // default 60.0
  };
  driftThresholdMae: number;   // default 2.0 kg increase
  updatedAt: Date;
}

const systemSettingSchema = new Schema<ISystemSetting>(
  {
    key: { type: String, required: true, unique: true, default: 'GLOBAL_CONFIG' },
    weights: {
      distanceWeight: { type: Number, default: 0.35, min: 0, max: 1 },
      capacityWeight: { type: Number, default: 0.25, min: 0, max: 1 },
      deadlineWeight: { type: Number, default: 0.20, min: 0, max: 1 },
      reliabilityWeight: { type: Number, default: 0.20, min: 0, max: 1 },
    },
    impactFactors: {
      kgPerMeal: { type: Number, default: 0.4, min: 0.1 },
      co2eFactorPerKg: { type: Number, default: 2.5, min: 0.1 },
      costPerKgRs: { type: Number, default: 60.0, min: 1 },
    },
    driftThresholdMae: { type: Number, default: 2.0 },
  },
  {
    timestamps: true,
  }
);

export const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', systemSettingSchema);

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IModelRegistry extends Document {
  _id: Types.ObjectId;
  version: string; // e.g. "v1.2.0"
  algorithm: 'RandomForestRegressor' | 'GradientBoostingRegressor' | 'LinearRegression';
  trainingWindow: {
    startDate: Date;
    endDate: Date;
    samplesCount: number;
  };
  metrics: {
    mae: number;
    rmse: number;
    r2: number;
    baselineMae: number;
    driftPercentage: number;
    driftFlag: boolean;
  };
  featureImportance: Record<string, number>;
  hyperparameters: Record<string, any>;
  status: 'ACTIVE' | 'CANDIDATE' | 'ARCHIVED';
  trainedAt: Date;
  trainedBy?: string;
}

const modelRegistrySchema = new Schema<IModelRegistry>(
  {
    version: { type: String, required: true, unique: true },
    algorithm: {
      type: String,
      required: true,
      enum: ['RandomForestRegressor', 'GradientBoostingRegressor', 'LinearRegression'],
    },
    trainingWindow: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      samplesCount: { type: Number, required: true },
    },
    metrics: {
      mae: { type: Number, required: true },
      rmse: { type: Number, required: true },
      r2: { type: Number, required: true },
      baselineMae: { type: Number, default: 0 },
      driftPercentage: { type: Number, default: 0 },
      driftFlag: { type: Boolean, default: false },
    },
    featureImportance: { type: Schema.Types.Mixed, default: {} },
    hyperparameters: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'CANDIDATE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    trainedAt: { type: Date, default: Date.now },
    trainedBy: { type: String, default: 'SYSTEM' },
  },
  {
    timestamps: true,
  }
);

modelRegistrySchema.index({ status: 1, trainedAt: -1 });

export const ModelRegistry = mongoose.model<IModelRegistry>('ModelRegistry', modelRegistrySchema);

import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBenchmarkResult extends Document {
  _id: Types.ObjectId;
  queryId: string;
  queryName: string;
  description: string;
  datasetScale: string; // '10k' | '100k' | '1M'
  recordCount: number;
  useIndex: boolean;
  executionTimeMs: number;
  docsExamined: number;
  docsReturned: number;
  collectionScanned: boolean; // COLLSCAN vs IXSCAN
  indexesUsed: string[];
  throughputRps?: number;
  memoryUsageMb?: number;
  runAt: Date;
}

const benchmarkResultSchema = new Schema<IBenchmarkResult>(
  {
    queryId: { type: String, required: true, index: true },
    queryName: { type: String, required: true },
    description: { type: String, required: true },
    datasetScale: { type: String, required: true, enum: ['10k', '100k', '1M', '5M'], index: true },
    recordCount: { type: Number, required: true },
    useIndex: { type: Boolean, required: true, index: true },
    executionTimeMs: { type: Number, required: true },
    docsExamined: { type: Number, required: true },
    docsReturned: { type: Number, required: true },
    collectionScanned: { type: Boolean, required: true },
    indexesUsed: [{ type: String }],
    throughputRps: { type: Number },
    memoryUsageMb: { type: Number },
    runAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

benchmarkResultSchema.index({ queryId: 1, datasetScale: 1, useIndex: 1 });

export const BenchmarkResult = mongoose.model<IBenchmarkResult>('BenchmarkResult', benchmarkResultSchema);

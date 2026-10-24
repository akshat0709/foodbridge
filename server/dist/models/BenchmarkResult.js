import mongoose, { Schema } from 'mongoose';
const benchmarkResultSchema = new Schema({
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
}, {
    timestamps: true,
});
benchmarkResultSchema.index({ queryId: 1, datasetScale: 1, useIndex: 1 });
export const BenchmarkResult = mongoose.model('BenchmarkResult', benchmarkResultSchema);

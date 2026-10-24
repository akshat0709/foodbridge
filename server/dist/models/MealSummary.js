import mongoose, { Schema } from 'mongoose';
const mealSummarySchema = new Schema({
    messId: { type: Schema.Types.ObjectId, ref: 'Mess', required: true, index: true },
    periodMonth: { type: String, required: true, index: true },
    mealType: { type: String, required: true },
    foodCategory: { type: String, required: true },
    totalPreparedKg: { type: Number, required: true },
    totalServedKg: { type: Number, required: true },
    totalLeftoverKg: { type: Number, required: true },
    totalDonatedKg: { type: Number, required: true },
    totalCostSavedRs: { type: Number, required: true },
    recordsCount: { type: Number, required: true },
    archivedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
});
mealSummarySchema.index({ periodMonth: 1, messId: 1 });
mealSummarySchema.index({ messId: 1, periodMonth: -1 });
export const MealSummary = mongoose.model('MealSummary', mealSummarySchema);

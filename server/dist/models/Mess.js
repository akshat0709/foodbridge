import mongoose, { Schema } from 'mongoose';
const messSchema = new Schema({
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
}, {
    timestamps: true,
});
// 2dsphere index for geospatial proximity search
messSchema.index({ location: '2dsphere' });
messSchema.index({ campus: 1, isActive: 1 });
export const Mess = mongoose.model('Mess', messSchema);

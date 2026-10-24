import mongoose, { Schema } from 'mongoose';
const ngoSchema = new Schema({
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
}, {
    timestamps: true,
});
// 2dsphere index for $geoNear queries
ngoSchema.index({ location: '2dsphere' });
ngoSchema.index({ 'reliabilityStats.bayesianScore': -1 });
export const Ngo = mongoose.model('Ngo', ngoSchema);

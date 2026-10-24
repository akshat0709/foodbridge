import mongoose, { Schema } from 'mongoose';
const userSchema = new Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: ['MESS_ADMIN', 'NGO_REP', 'PLATFORM_ADMIN'], index: true },
    phone: { type: String, trim: true },
    organizationId: { type: Schema.Types.ObjectId, refPath: 'roleRef', index: true },
}, {
    timestamps: true,
});
userSchema.virtual('roleRef').get(function () {
    if (this.role === 'MESS_ADMIN')
        return 'Mess';
    if (this.role === 'NGO_REP')
        return 'Ngo';
    return undefined;
});
export const User = mongoose.model('User', userSchema);

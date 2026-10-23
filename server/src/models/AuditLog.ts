import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  action: string;
  entityType: string;
  entityId: string;
  userId?: Types.ObjectId;
  ipAddress?: string;
  details: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    ipAddress: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now, required: true },
  },
  {
    timestamps: false,
  }
);

// TTL index: MongoDB automatically expires documents after 90 days (7,776,000 seconds)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 86400 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

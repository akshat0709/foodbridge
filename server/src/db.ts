import mongoose from 'mongoose';
import { config } from './config.js';
import { autoBootstrapIfEmpty } from './services/bootstrapService.js';

export async function connectDB(uri?: string) {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  const targetUri = uri || config.mongodbUri;
  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: false,
    });
    console.log(`[Database] MongoDB connected successfully to ${targetUri}`);
    // Auto-initialize base data if database is brand new
    await autoBootstrapIfEmpty();
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

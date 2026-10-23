import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDB(uri?: string) {
  const targetUri = uri || config.mongodbUri;
  try {
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`[Database] MongoDB connected successfully to ${targetUri}`);
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

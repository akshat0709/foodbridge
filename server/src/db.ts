import mongoose from 'mongoose';
import { config } from './config.js';
import { autoBootstrapIfEmpty } from './services/bootstrapService.js';
import './models/index.js';

// Shared in-flight connection promise, so concurrent requests (e.g. several API
// calls arriving together on a serverless cold start) all wait for the same
// connection instead of the later ones returning early and receiving a 503.
let connectionPromise: Promise<void> | null = null;

/**
 * autoIndex is disabled for faster serverless cold starts, so Mongoose never
 * builds the schema indexes on its own. $geoNear (listing creation, nearby
 * donations, matching lab) fails outright without the 2dsphere indexes.
 * createIndexes() is additive and idempotent: it only creates missing indexes
 * and never drops existing ones.
 */
async function ensureIndexes() {
  const models = Object.values(mongoose.models);
  const results = await Promise.allSettled(models.map(model => model.createIndexes()));
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(
        `[Database] Index creation failed for ${models[i].modelName}:`,
        result.reason?.message || result.reason
      );
    }
  });
}

export async function connectDB(uri?: string) {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  const targetUri = uri || config.mongodbUri;
  connectionPromise = (async () => {
    try {
      if (mongoose.connection.readyState === 2) {
        await mongoose.connection.asPromise();
      } else {
        await mongoose.connect(targetUri, {
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
          socketTimeoutMS: 8000,
          maxPoolSize: 5,
          autoIndex: false,
          bufferCommands: false,
        });
      }
      console.log(`[Database] MongoDB connected successfully to ${targetUri.replace(/:[^:]*@/, ':****@')}`);
      await ensureIndexes();
      // Non-blocking background auto-seed
      autoBootstrapIfEmpty().catch(err => console.error('[Bootstrap Background Error]:', err));
    } catch (error: any) {
      console.error('[Database] Connection failed:', error?.message || error);
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

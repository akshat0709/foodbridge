import mongoose from 'mongoose';
import { config } from './config.js';
import { autoBootstrapIfEmpty } from './services/bootstrapService.js';
let isConnecting = false;
export async function connectDB(uri) {
    if (mongoose.connection.readyState >= 1) {
        return;
    }
    if (isConnecting) {
        return;
    }
    isConnecting = true;
    const targetUri = uri || config.mongodbUri;
    try {
        await mongoose.connect(targetUri, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 8000,
            maxPoolSize: 5,
            autoIndex: false,
            bufferCommands: false,
        });
        console.log(`[Database] MongoDB connected successfully to ${targetUri.replace(/:[^:]*@/, ':****@')}`);
        // Non-blocking background auto-seed
        autoBootstrapIfEmpty().catch(err => console.error('[Bootstrap Background Error]:', err));
    }
    catch (error) {
        console.error('[Database] Connection failed:', error);
    }
    finally {
        isConnecting = false;
    }
}
export async function disconnectDB() {
    await mongoose.disconnect();
}

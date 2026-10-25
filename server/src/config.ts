import dotenv from 'dotenv';
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

// Local-development-only signing key. Never used when NODE_ENV=production:
// a publicly known key would let anyone forge tokens for any role.
const DEV_ONLY_JWT_SECRET = 'foodbridge-local-dev-only-secret';
let warnedDevSecret = false;

/**
 * Returns the JWT signing secret. In production JWT_SECRET must be set; if it
 * is missing this throws, so auth fails closed (no tokens issued or accepted)
 * instead of silently using a guessable key.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isPlaceholder = !secret || secret === 'replace-with-a-long-random-secret';
  if (!isPlaceholder && secret!.length >= 16) return secret!;
  if (isProduction) {
    throw Object.assign(
      new Error('Server misconfigured: JWT_SECRET must be set (at least 16 characters).'),
      { statusCode: 500, code: 'AUTH_NOT_CONFIGURED' }
    );
  }
  if (!warnedDevSecret) {
    console.warn('[Config] JWT_SECRET not set; using a local development key. Set JWT_SECRET before deploying.');
    warnedDevSecret = true;
  }
  return DEV_ONLY_JWT_SECRET;
}

export const config = {
  env,
  isProduction,
  port: parseInt(process.env.PORT || '5050', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodbridge',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  // Comma-separated list of allowed browser origins for cross-origin API calls.
  // Same-origin requests (the Vite proxy locally, the Vercel rewrite in production)
  // don't need to be listed.
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim().replace(/\/+$/, ''))
    .filter(Boolean),
  impact: {
    kgPerMeal: parseFloat(process.env.KG_PER_MEAL || '0.4'),
    co2eFactorPerKg: parseFloat(process.env.CO2E_FACTOR_PER_KG || '2.5'),
    costPerKgRs: parseFloat(process.env.COST_PER_KG_RS || '60.0'),
  },
};

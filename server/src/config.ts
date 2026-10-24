import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5050', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodbridge',
  jwtSecret: process.env.JWT_SECRET || 'foodbridge_super_secure_jwt_secret_key_change_in_production_2026',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  impact: {
    kgPerMeal: parseFloat(process.env.KG_PER_MEAL || '0.4'),
    co2eFactorPerKg: parseFloat(process.env.CO2E_FACTOR_PER_KG || '2.5'),
    costPerKgRs: parseFloat(process.env.COST_PER_KG_RS || '60.0'),
  },
};

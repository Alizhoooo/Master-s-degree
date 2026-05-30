import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim());

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    jwtSecret: process.env.JWT_SECRET || 'supplyflow-super-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    betaCoefficient: parseFloat(process.env.BETA_COEFFICIENT || '0.05'),
    corsOrigin,
    rateLimit: parseInt(process.env.RATE_LIMIT || '100', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  };
});

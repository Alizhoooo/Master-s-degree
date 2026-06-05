import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .concat([
      'https://master-s-degree.vercel.app',
      'https://master-s-degree.onrender.com',
    ]);

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'supplyflow-dev-secret'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    betaCoefficient: parseFloat(process.env.BETA_COEFFICIENT || '0.05'),
    corsOrigin,
    rateLimit: parseInt(process.env.RATE_LIMIT || '100', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || 'noreply@supplyflow.kz',
  };
});

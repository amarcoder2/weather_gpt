// ==============================================================================
// WEATHERGPT CLOUD FUNCTIONS ENTRY POINT (SIH 2026 #26068)
// ==============================================================================

import express, { Request, Response } from 'express';
import cors from 'cors';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Middlewares
import { requestIdMiddleware } from './middleware/requestId';
import { requestLoggerMiddleware } from './middleware/requestLogger';
import { authenticateUser } from './middleware/auth';
import { errorHandlerMiddleware } from './middleware/errorHandler';
import { NotFoundError } from './errors';

// API Routers (Section 5: /api/v1/...)
import { healthRouter } from './api/health';
import { usersRouter } from './api/users';
import { locationsRouter } from './api/locations';
import { weatherRouter } from './api/weather';
import { disastersRouter } from './api/disasters';
import { alertsRouter } from './api/alerts';
import { riskRouter } from './api/risk';
import { chatRouter } from './api/chat';
import { adminRouter } from './api/admin';

// Scheduled tasks
import { executeAlertExpirySweep, executeRiskRecalculationSweep } from './scheduled';
import { config } from './config';
import { logger } from './logging/logger';

// ------------------------------------------------------------------------------
// EXPRESS APPLICATION INITIALIZATION
// ------------------------------------------------------------------------------
const app = express();

// Security & Parsing Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Observability & Security Gating
app.use(requestIdMiddleware);
app.use(requestLoggerMiddleware);
app.use(authenticateUser);

// ------------------------------------------------------------------------------
// VERSIONED API ROUTING (/api/v1/...)
// ------------------------------------------------------------------------------
const v1Router = express.Router();

v1Router.use('/health', healthRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/locations', locationsRouter);
v1Router.use('/weather', weatherRouter);
v1Router.use('/disasters', disastersRouter);
v1Router.use('/alerts', alertsRouter);
v1Router.use('/risk', riskRouter);
v1Router.use('/chat', chatRouter);
v1Router.use('/admin', adminRouter);

app.use('/api/v1', v1Router);
app.use('/weather-gpt-sih/asia-south1/api/v1', v1Router);

// Fallback for root path
app.get('/', (req: Request, res: Response) => {
  res.json({
    project: 'WeatherGPT Backend API',
    sihProblemStatement: '26068',
    department: 'India Meteorological Department (IMD) / MoES',
    version: '1.0.0-sih2026',
    documentation: '/api/v1/health',
    endpoints: [
      '/api/v1/health',
      '/api/v1/weather/current',
      '/api/v1/weather/forecast',
      '/api/v1/alerts',
      '/api/v1/disasters',
      '/api/v1/risk',
      '/api/v1/locations',
      '/api/v1/chat',
      '/api/v1/admin/*',
    ],
  });
});

// 404 Route Handler
app.use((req: Request) => {
  throw new NotFoundError(`Route '${req.method} ${req.originalUrl}' does not exist on WeatherGPT API`);
});

// Centralized Error Handling Middleware
app.use(errorHandlerMiddleware);

// ------------------------------------------------------------------------------
// FIREBASE CLOUD FUNCTION EXPORTS
// ------------------------------------------------------------------------------
export const api = onRequest(
  {
    region: 'asia-south1', // IMD Indian region deployment
    memory: '512MiB',
    timeoutSeconds: 60,
    cors: true,
  },
  app
);

// Scheduled Cloud Functions (Firebase v2 Scheduler)
export const scheduledAlertExpiryJob = onSchedule(
  {
    schedule: 'every 15 minutes',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
  },
  async () => {
    logger.info('Running scheduled alert expiry sweep...');
    await executeAlertExpirySweep();
  }
);

export const scheduledRiskRecalculationJob = onSchedule(
  {
    schedule: 'every 3 hours',
    timeZone: 'Asia/Kolkata',
    region: 'asia-south1',
  },
  async () => {
    logger.info('Running scheduled risk assessment sweep...');
    await executeRiskRecalculationSweep();
  }
);

// Standalone execution support for local Node hosting & development
if (process.env.STANDALONE === 'true' || require.main === module) {
  const port = config.port || 5001;
  app.listen(port, () => {
    logger.info(`⚡ WeatherGPT Backend Server listening on http://localhost:${port}/api/v1`);
  });
}

export default app;

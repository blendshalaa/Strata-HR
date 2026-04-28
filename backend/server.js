const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Fail fast if required env vars are missing
const validateEnv = require('./config/validateEnv');
validateEnv();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const leaveRoutes = require('./routes/leave');
const knowledgeRoutes = require('./routes/knowledge');
const analyticsRoutes = require('./routes/analytics');
const userRoutes = require('./routes/users');
const departmentRoutes = require('./routes/departments');
const recruitmentRoutes = require('./routes/recruitment');
const payrollRoutes = require('./routes/payroll');
const performanceRoutes = require('./routes/performance');
const eventRoutes = require('./routes/events');
const careersRoutes = require('./routes/careers');
const onboardingRoutes = require('./routes/onboarding');
const attendanceRoutes = require('./routes/attendance');
const notificationRoutes = require('./routes/notifications');
const exportRoutes = require('./routes/exports');
const orgRoutes = require('./routes/organizations');
const documentRoutes = require('./routes/documents');
const shiftRoutes = require('./routes/shifts');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet());

// CORS — restrict to frontend origin
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL]
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter — 200 requests per 15 minutes per IP
app.use('/api', generalLimiter);

// Serve uploaded files — require authentication
const { authenticateToken } = require('./middleware/auth');
app.use('/uploads', authenticateToken, express.static(path.join(__dirname, 'uploads')));

// Structured request logger (skips /health)
app.use(logger.requestLogger);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'HR Assistant API'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/knowledge', knowledgeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/documents', documentRoutes);

const goalRoutes = require('./routes/goals');
app.use('/api/goals', goalRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`HR Assistant API running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  logger.warn('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});
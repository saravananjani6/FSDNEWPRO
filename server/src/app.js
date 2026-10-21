const cors = require('cors');
const express = require('express');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

function optional(name, fallback) {
  try {
    return require(name);
  } catch {
    return fallback;
  }
}

const compression = optional('compression', () => (req, res, next) => next());
const helmet = optional('helmet', () => (req, res, next) => next());
const morgan = optional('morgan', () => (req, res, next) => next());
const rateLimit = optional('express-rate-limit', () => (req, res, next) => next());

const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors({ origin: allowedOrigins.includes('*') ? '*' : allowedOrigins, allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'] }));
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

// Keep this lightweight: the web client uses it to distinguish a reachable API
// from an offline device, including while a serverless database connection warms up.
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'RuralCare API', at: new Date().toISOString() }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clinics', require('./routes/clinicRoutes'));
app.use('/api/rules', require('./routes/ruleRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/triage', require('./routes/triageRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;

const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

dotenv.config();
connectDB();

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

const app = express();
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'] }));
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'RuralCare API', at: new Date().toISOString() }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/rules', require('./routes/ruleRoutes'));
app.use('/api/sync', require('./routes/syncRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`RuralCare API running on http://localhost:${PORT}`));

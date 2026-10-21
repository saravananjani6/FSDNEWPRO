const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Authentication required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_access_secret');
    const user = await User.findById(decoded.id).select('-passwordHash -refreshTokenHash');
    if (!user || !user.isActive) return res.status(401).json({ message: 'User inactive or missing' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

async function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_access_secret');
    const user = await User.findById(decoded.id).select('-passwordHash -refreshTokenHash');
    if (user && user.isActive) req.user = user;
  } catch {
    // Triage is available without an account; ignore an invalid optional token.
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}

module.exports = { protect, optionalAuth, requireAdmin };

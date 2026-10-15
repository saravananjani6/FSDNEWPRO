const crypto = require('crypto');
const jwt = require('jsonwebtoken');

function accessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET || 'dev_access_secret', { expiresIn: '15m' });
}

function refreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

module.exports = { accessToken, refreshToken };

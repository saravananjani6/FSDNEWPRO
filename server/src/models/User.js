const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  passwordHash: { type: String, required: true },
  refreshTokenHash: { type: String, default: '' },
  role: { type: String, enum: ['patient', 'health_worker', 'admin', 'doctor'], default: 'patient', index: true },
  village: { type: String, default: '' },
  assignedVillage: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 10);
userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};
userSchema.methods.matchPassword = function matchPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};
userSchema.methods.checkRefreshToken = function checkRefreshToken(token) {
  return this.refreshTokenHash ? bcrypt.compare(token, this.refreshTokenHash) : false;
};

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

const clinicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  village: { type: String, required: true, index: true },
  phone: { type: String, required: true },
  address: { type: String, default: '' },
  services: [{ type: String }],
  lat: Number,
  lng: Number,
  isActive: { type: Boolean, default: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Clinic', clinicSchema);

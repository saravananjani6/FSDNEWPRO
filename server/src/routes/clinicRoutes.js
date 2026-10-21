const express = require('express');

const router = express.Router();
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function facilityType(tags = {}) {
  if (tags.amenity === 'hospital') return 'hospital';
  if (tags.healthcare === 'centre' || /primary|community health/i.test(tags.name || '')) return 'phc';
  return 'clinic';
}

function formatAddress(tags = {}) {
  return [tags['addr:housenumber'], tags['addr:street'], tags['addr:city']]
    .filter(Boolean)
    .join(', ') || tags['addr:full'] || tags['addr:place'] || 'Address not listed';
}

router.get('/nearby', async (req, res, next) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radius = Math.min(Math.max(Number(req.query.radius) || 10000, 1000), 25000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ message: 'A valid latitude and longitude are required.' });
  }

  const cacheKey = `${lat.toFixed(2)}:${lng.toFixed(2)}:${radius}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return res.json({ success: true, source: 'cache', facilities: cached.facilities });
  }

  try {
    const query = `[out:json][timeout:8];(nwr[amenity~"^(hospital|clinic|doctors)$"](around:${radius},${lat},${lng});nwr[healthcare~"^(hospital|clinic|centre)$"](around:${radius},${lat},${lng}););out center tags 80;`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8500);
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: query,
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`Nearby facility service returned ${response.status}`);
    const data = await response.json();
    const seen = new Set();
    const facilities = (data.elements || []).map((element) => {
      const tags = element.tags || {};
      const facilityLat = element.lat ?? element.center?.lat;
      const facilityLng = element.lon ?? element.center?.lon;
      const id = `${element.type}-${element.id}`;
      return {
        id,
        name: tags.name || 'Unnamed healthcare facility',
        type: facilityType(tags),
        typeLabel: tags.amenity === 'hospital' || tags.healthcare === 'hospital' ? 'Hospital' : tags.healthcare === 'centre' ? 'Health Centre' : 'Clinic',
        village: tags['addr:city'] || tags['addr:place'] || '',
        lat: facilityLat,
        lng: facilityLng,
        phone: tags.phone || tags['contact:phone'] || '',
        timing: tags.opening_hours || 'Hours not listed',
        address: formatAddress(tags),
        isEmergency24x7: /24\/?7|emergency/i.test(`${tags.opening_hours || ''} ${tags.emergency || ''}`),
        source: 'openstreetmap'
      };
    }).filter((facility) => {
      if (!Number.isFinite(facility.lat) || !Number.isFinite(facility.lng) || seen.has(facility.id)) return false;
      seen.add(facility.id);
      return true;
    });

    cache.set(cacheKey, { createdAt: Date.now(), facilities });
    res.json({ success: true, source: 'openstreetmap', facilities });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

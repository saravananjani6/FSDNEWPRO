import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { useLanguage } from '../context/LanguageContext';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  RURAL_HEALTH_FACILITIES,
  VILLAGE_PRESETS,
  DEFAULT_PATIENT_LOCATION,
  calculateDistanceKm,
  estimateTravelMinutes
} from '../data/clinicsData';
import {
  MapPin,
  Navigation,
  PhoneCall,
  ShieldAlert,
  Clock,
  Compass,
  Building2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Layers,
  HeartPulse,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';

export function NearbyClinicsMapPage() {
  const { lang, t } = useLanguage();

  // User location state
  const [userLocation, setUserLocation] = useState(DEFAULT_PATIENT_LOCATION);
  const [gpsStatus, setGpsStatus] = useState('prompt'); // 'prompt', 'locating', 'active', 'denied', 'error'
  const [selectedVillageId, setSelectedVillageId] = useState('v1');
  const [filterType, setFilterType] = useState('all'); // 'all', 'hospital', 'phc', 'clinic'
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);

  // Map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);

  // 1. Calculate distances from current user location to each facility
  const sortedFacilities = useMemo(() => {
    const list = RURAL_HEALTH_FACILITIES.map((facility) => {
      const distance = calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        facility.lat,
        facility.lng
      );
      const travelMins = estimateTravelMinutes(distance);
      return {
        ...facility,
        distance,
        travelMins
      };
    });

    list.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    return list;
  }, [userLocation]);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    if (filterType === 'all') return sortedFacilities;
    if (filterType === 'emergency') return sortedFacilities.filter((f) => f.isEmergency24x7);
    return sortedFacilities.filter((f) => f.type === filterType);
  }, [sortedFacilities, filterType]);

  const nearestFacility = sortedFacilities[0];

  // 2. Request GPS Geolocation
  const requestGPSLocation = () => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      return;
    }

    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setUserLocation({
          lat: latitude,
          lng: longitude,
          name: lang === 'ta' ? 'உங்கள் நேரடி ஜிபிஎஸ் இடம்' : 'Your Live GPS Location',
          village: lang === 'ta' ? 'தற்போதைய இடம்' : 'Current Location',
          accuracy: Math.round(accuracy)
        });
        setGpsStatus('active');
      },
      (err) => {
        console.warn('[GPS] Geolocation permission or lookup error:', err);
        setGpsStatus(err.code === 1 ? 'denied' : 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  // Try GPS on first load
  useEffect(() => {
    requestGPSLocation();
  }, []);

  // Handle village preset change
  const handleVillagePresetChange = (villageId) => {
    const found = VILLAGE_PRESETS.find((v) => v.id === villageId);
    if (found) {
      setSelectedVillageId(villageId);
      setUserLocation({
        lat: found.lat,
        lng: found.lng,
        name: found.name,
        village: found.name
      });
      setGpsStatus('manual');
    }
  };

  // 3. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create map
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 12,
        zoomControl: true
      });

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing markers
    Object.values(markersRef.current).forEach((m) => m.remove());
    markersRef.current = {};
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Custom Icon for Patient's Location
    const userHtml = `
      <div style="
        width: 24px;
        height: 24px;
        background: #0284c7;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 0 0 4px rgba(2, 132, 199, 0.4), 0 4px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background: #ffffff; border-radius: 50%;"></div>
      </div>
    `;
    const userIcon = L.divIcon({
      html: userHtml,
      className: 'user-pin-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: inherit; font-size: 13px; text-align: center; padding: 4px;">
          <strong style="color: #0284c7;">📍 ${lang === 'ta' ? 'உங்கள் இடம்' : 'You Are Here'}</strong>
          <div style="margin-top: 4px; color: #475569;">${userLocation.name}</div>
        </div>
      `);

    // Add Facility Markers
    filteredFacilities.forEach((facility) => {
      const isHospital = facility.type === 'hospital';
      const isPHC = facility.type === 'phc';
      const bg = isHospital ? '#dc2626' : isPHC ? '#16a34a' : '#0284c7';
      const symbol = isHospital ? '🏥' : isPHC ? '✚' : '🩺';

      const facilityHtml = `
        <div style="
          width: 32px;
          height: 32px;
          background: ${bg};
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: bold;
          font-size: 14px;
          cursor: pointer;
        ">
          ${symbol}
        </div>
      `;

      const facilityIcon = L.divIcon({
        html: facilityHtml,
        className: 'facility-pin-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; min-width: 210px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 800; background: ${bg}; color: #fff; padding: 2px 6px; border-radius: 4px;">
              ${lang === 'ta' ? facility.typeLabelTa : facility.typeLabel}
            </span>
            <span style="font-size: 11px; font-weight: 700; color: #166534; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">
              ${facility.distance} km
            </span>
          </div>
          <strong style="color: #0f172a; font-size: 14px; display: block; margin-bottom: 4px;">
            ${lang === 'ta' ? facility.nameTa : facility.name}
          </strong>
          <div style="color: #64748b; font-size: 12px; margin-bottom: 6px;">
            📍 ${lang === 'ta' ? facility.addressTa : facility.address}
          </div>
          <div style="color: #0369a1; font-size: 11px; font-weight: 600; margin-bottom: 8px;">
            🕒 ${lang === 'ta' ? facility.timingTa : facility.timing}
          </div>
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <a href="tel:${facility.phone}" style="flex: 1; background: #0284c7; color: #fff; text-align: center; padding: 6px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 12px; display: inline-block;">
              📞 ${lang === 'ta' ? 'அழைக்க' : 'Call'}
            </a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lng}" target="_blank" rel="noopener noreferrer" style="flex: 1; background: #16a34a; color: #fff; text-align: center; padding: 6px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 12px; display: inline-block;">
              🧭 ${lang === 'ta' ? 'வழித்தடம்' : 'Directions'}
            </a>
          </div>
        </div>
      `;

      const marker = L.marker([facility.lat, facility.lng], { icon: facilityIcon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedFacilityId(facility.id);
      });

      markersRef.current[facility.id] = marker;
    });

    // Fit map bounds to show patient and facilities
    const group = L.featureGroup([
      userMarkerRef.current,
      ...Object.values(markersRef.current)
    ]);
    map.fitBounds(group.getBounds().pad(0.15));
  }, [userLocation, filteredFacilities, lang]);

  // Fly to facility when selected
  const handleSelectFacility = (fac) => {
    setSelectedFacilityId(fac.id);
    if (mapInstanceRef.current && markersRef.current[fac.id]) {
      mapInstanceRef.current.flyTo([fac.lat, fac.lng], 14, { duration: 1 });
      markersRef.current[fac.id].openPopup();
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '1560px', margin: '0 auto', padding: '16px 8px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
            <Compass size={14} />
            <span>{lang === 'ta' ? 'ஜிபிஎஸ் வழிகாட்டி & மருத்துவமனை தேடல்' : 'GPS Healthcare Navigation'}</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            {lang === 'ta' ? 'அருகிலுள்ள மருத்துவமனைகள் வரைபடம்' : 'Nearest Clinics & Hospitals Map'}
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#64748b', margin: 0 }}>
            {lang === 'ta'
              ? 'உங்கள் கிராமத்தின் தூரத்திற்கு ஏற்ப அருகிலுள்ள அரசு மருத்துவமனைகள், ஆரம்ப சுகாதார நிலையங்கள் (PHC) & அவசர தொடர்பு எண்கள்.'
              : 'Real-time distance detection to Government Hospitals, Primary Health Centres (PHC), and 24/7 emergency dispatch.'}
          </p>
        </div>

        {/* Back Link */}
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            padding: '8px 16px',
            borderRadius: '10px',
            color: '#334155',
            fontSize: '0.88rem',
            fontWeight: 700,
            textDecoration: 'none'
          }}
        >
          <span>{lang === 'ta' ? '← முகப்புக்குத் திரும்பு' : '← Back to Home'}</span>
        </Link>
      </div>

      {/* 24/7 National Emergency 108 Ambulance Call Strip */}
      <div
        style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          borderRadius: '16px',
          padding: '16px 20px',
          color: '#ffffff',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 8px 20px rgba(220, 38, 38, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={28} />
          </div>
          <div>
            <strong style={{ fontSize: '1.15rem', display: 'block' }}>
              {lang === 'ta' ? 'தேசிய அவசர 108 ஆம்புலன்ஸ் சேவை' : 'National Emergency 108 Ambulance Service'}
            </strong>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
              {lang === 'ta' ? 'கட்டணமில்லா 24/7 அவசர மருத்துவ ஊர்தி' : 'Toll-free 24/7 medical dispatch for severe symptoms & trauma'}
            </span>
          </div>
        </div>

        <a
          href="tel:108"
          style={{
            backgroundColor: '#ffffff',
            color: '#dc2626',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: 900,
            fontSize: '1rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}
        >
          <PhoneCall size={18} />
          <span>{lang === 'ta' ? '108 அழைக்கவும்' : 'Call 108 Ambulance'}</span>
        </a>
      </div>

      {/* Location Bar & Village Selector */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '14px 18px',
          border: '1.5px solid #e2e8f0',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
            <MapPin size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
              {lang === 'ta' ? 'தற்போதைய நோயாளி இருப்பிடம்:' : 'CURRENT PATIENT LOCATION:'}
            </span>
            <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
              {userLocation.name}
            </strong>
          </div>
        </div>

        {/* GPS Status & Refresh Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {gpsStatus === 'active' && (
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#16a34a', backgroundColor: '#dcfce7', padding: '4px 10px', borderRadius: '8px' }}>
              ● {lang === 'ta' ? 'நேரடி ஜிபிஎஸ் இயங்குகிறது' : 'Live GPS Active'}
            </span>
          )}

          <button
            type="button"
            onClick={requestGPSLocation}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer'
            }}
            title="Recenter with live GPS"
          >
            <Navigation size={14} color="#0284c7" />
            <span>{lang === 'ta' ? 'ஜிபிஎஸ் புதுப்பி' : 'Detect GPS'}</span>
          </button>

          {/* Fallback Village Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <label htmlFor="village-select" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748b' }}>
              {lang === 'ta' ? 'அல்லது கிராமம்:' : 'Or Village:'}
            </label>
            <select
              id="village-select"
              value={selectedVillageId}
              onChange={(e) => handleVillagePresetChange(e.target.value)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1e293b',
                backgroundColor: '#ffffff',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {VILLAGE_PRESETS.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FILTER PILLS */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: filterType === 'all' ? '#0284c7' : '#e2e8f0',
            color: filterType === 'all' ? '#ffffff' : '#475569',
            transition: 'all 0.15s'
          }}
        >
          {lang === 'ta' ? `அனைத்து மையங்கள் (${sortedFacilities.length})` : `All Facilities (${sortedFacilities.length})`}
        </button>

        <button
          type="button"
          onClick={() => setFilterType('emergency')}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: filterType === 'emergency' ? '#dc2626' : '#fee2e2',
            color: filterType === 'emergency' ? '#ffffff' : '#991b1b',
            transition: 'all 0.15s'
          }}
        >
          🚨 {lang === 'ta' ? '24/7 அவசர மருத்துவமனைகள்' : '24/7 Emergency & ICU'}
        </button>

        <button
          type="button"
          onClick={() => setFilterType('phc')}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: filterType === 'phc' ? '#16a34a' : '#dcfce7',
            color: filterType === 'phc' ? '#ffffff' : '#166534',
            transition: 'all 0.15s'
          }}
        >
          ✚ {lang === 'ta' ? 'ஆரம்ப சுகாதார நிலையங்கள் (PHC)' : 'Primary Health Centres (PHC)'}
        </button>

        <button
          type="button"
          onClick={() => setFilterType('clinic')}
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: filterType === 'clinic' ? '#0891b2' : '#e0f2fe',
            color: filterType === 'clinic' ? '#ffffff' : '#0369a1',
            transition: 'all 0.15s'
          }}
        >
          🩺 {lang === 'ta' ? 'கிராம துணை நிலையங்கள்' : 'Rural Sub-Centres'}
        </button>
      </div>

      {/* TWO COLUMN WORKSPACE: MAP (Left) & FACILITY LIST (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* LEAFLET MAP CONTAINER */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1.5px solid #cbd5e1',
            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
            position: 'relative',
            height: '520px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ padding: '10px 16px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="#0284c7" />
              <span>{lang === 'ta' ? 'ஊடாடும் வரைபடம் (OpenStreetMap)' : 'Interactive Health Map'}</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              {lang === 'ta' ? 'மையத்தை தொடவும்' : 'Tap pin to inspect'}
            </span>
          </div>

          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%', zIndex: 1 }}
          />

          {/* Map Legend Footer */}
          <div style={{ padding: '8px 14px', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.75rem', color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
              <span>{lang === 'ta' ? 'உங்கள் இடம்' : 'Your Location'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
              <span>{lang === 'ta' ? 'அரசு தலைமை மருத்துவமனை' : 'District Hospital'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
              <span>{lang === 'ta' ? 'ஆரம்ப சுகாதார நிலையம் (PHC)' : 'PHC / CHC'}</span>
            </div>
          </div>
        </div>

        {/* FACILITY CARDS LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '4px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
              {lang === 'ta' ? 'தூரம் வாரியாக வரிசைப்படுத்தப்பட்டது' : 'Sorted by Closest Distance'}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              {filteredFacilities.length} {lang === 'ta' ? 'மையங்கள்' : 'Facilities'}
            </span>
          </div>

          {filteredFacilities.map((fac, idx) => {
            const isSelected = selectedFacilityId === fac.id;
            const isTopNearest = idx === 0;

            return (
              <div
                key={fac.id}
                onClick={() => handleSelectFacility(fac)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px',
                  border: isSelected ? '2px solid #0284c7' : isTopNearest ? '2px solid #86efac' : '1.5px solid #e2e8f0',
                  boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.18)' : '0 2px 6px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Nearest Ribbon */}
                {isTopNearest && (
                  <div style={{ position: 'absolute', top: '-10px', right: '14px', backgroundColor: '#16a34a', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>
                    ★ {lang === 'ta' ? 'மிகவும் அருகில்' : 'NEAREST FACILITY'}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: fac.type === 'hospital' ? '#fee2e2' : fac.type === 'phc' ? '#dcfce7' : '#e0f2fe',
                          color: fac.type === 'hospital' ? '#991b1b' : fac.type === 'phc' ? '#166534' : '#0369a1'
                        }}
                      >
                        {lang === 'ta' ? fac.typeLabelTa : fac.typeLabel}
                      </span>

                      {fac.isEmergency24x7 && (
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef2f2', color: '#dc2626' }}>
                          24x7 Emergency
                        </span>
                      )}
                    </div>

                    <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block', lineHeight: 1.3 }}>
                      {lang === 'ta' ? fac.nameTa : fac.name}
                    </strong>
                  </div>

                  {/* Distance Pill */}
                  <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0284c7' }}>
                      {fac.distance} km
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      ~{fac.travelMins} {lang === 'ta' ? 'நிமிடம்' : 'mins'}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
                  📍 {lang === 'ta' ? fac.addressTa : fac.address}
                </div>

                <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: 600, marginBottom: '10px' }}>
                  🕒 {lang === 'ta' ? fac.timingTa : fac.timing}
                </div>

                {/* Key services chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '12px' }}>
                  {(lang === 'ta' ? fac.servicesTa : fac.services).slice(0, 3).map((svc, i) => (
                    <span key={i} style={{ fontSize: '0.72rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                      ✓ {svc}
                    </span>
                  ))}
                  {(fac.services.length > 3) && (
                    <span style={{ fontSize: '0.72rem', color: '#64748b', padding: '2px 4px' }}>
                      +{fac.services.length - 3} more
                    </span>
                  )}
                </div>

                {/* Direct Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                  <a
                    href={`tel:${fac.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      textDecoration: 'none'
                    }}
                  >
                    <PhoneCall size={14} />
                    <span>{lang === 'ta' ? 'அழைக்க' : 'Call'}</span>
                  </a>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${fac.lat},${fac.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      textDecoration: 'none'
                    }}
                  >
                    <Navigation size={14} />
                    <span>{lang === 'ta' ? 'வழித்தடம்' : 'Directions'}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
export default NearbyClinicsMapPage;

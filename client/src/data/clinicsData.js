/**
 * Comprehensive offline-first dataset of Rural Clinics, Primary Health Centres (PHCs),
 * Community Health Centres (CHCs), and District Hospitals.
 * Centered around rural Tamil Nadu cluster (Tiruvallur / Thiruvalangadu / Kaveri / Mullai region).
 */

export const DEFAULT_PATIENT_LOCATION = {
  lat: 13.1348,
  lng: 79.7712,
  name: 'Thiruvalangadu Village (Default)',
  village: 'Thiruvalangadu'
};

export const VILLAGE_PRESETS = [
  { id: 'v1', name: 'Thiruvalangadu (திருவாலங்காடு)', lat: 13.1348, lng: 79.7712 },
  { id: 'v2', name: 'Kaveri Nagar (காவேரி நகர்)', lat: 13.1420, lng: 79.7905 },
  { id: 'v3', name: 'Mullai Village (முல்லை கிராமம்)', lat: 13.1180, lng: 79.7520 },
  { id: 'v4', name: 'Melur Hamlet (மேலூர்)', lat: 13.1550, lng: 79.8110 },
  { id: 'v5', name: 'Keeladi Rural (கீழடி)', lat: 13.0980, lng: 79.7340 },
  { id: 'v6', name: 'District Town Center (நகர மையம்)', lat: 13.1432, lng: 79.9079 }
];

export const RURAL_HEALTH_FACILITIES = [
  {
    id: 'fac-01',
    name: 'Kaveri 24/7 Government Primary Health Centre (PHC)',
    nameTa: 'காவேரி 24/7 அரசு ஆரம்ப சுகாதார நிலையம் (PHC)',
    type: 'phc', // 'hospital', 'phc', 'clinic'
    typeLabel: 'Primary Health Centre',
    typeLabelTa: 'ஆரம்ப சுகாதார நிலையம்',
    village: 'Kaveri Nagar',
    villageTa: 'காவேரி நகர்',
    lat: 13.1415,
    lng: 79.7892,
    phone: '+919876543210',
    emergencyPhone: '108',
    isEmergency24x7: true,
    hasAmbulance: true,
    beds: 12,
    doctorInCharge: 'Dr. S. Ramanathan, MBBS (Medical Officer)',
    timing: '24 Hours Emergency & Delivery',
    timingTa: '24 மணி நேர அவசர சிகிச்சை & பிரசவம்',
    address: 'Main PHC Road, Near Bus Stop, Kaveri Nagar',
    addressTa: 'முக்கிய PHC சாலை, பேருந்து நிறுத்தம் அருகில், காவேரி நகர்',
    services: [
      '24/7 Normal Delivery & Maternity Ward',
      'Emergency Triage & Stabilization',
      'Free Generic Pharmacy',
      'Diagnostic Lab (CBC, Malaria, Dengue, Blood Sugar)',
      '108 Ambulance Stationed On-Site',
      'Routine Immunization & Child Health'
    ],
    servicesTa: [
      '24/7 சுகப்பிரசவ வார்டு',
      'அவசர சிகிச்சை & முதலுதவி',
      'இலவச மருந்தகம்',
      'இரத்த பரிசோதனை கூடம்',
      '108 ஆம்புலன்ஸ் வசதி',
      'குழந்தை தடுப்பூசிகள்'
    ]
  },
  {
    id: 'fac-02',
    name: 'Thiruvalangadu Health & Wellness Sub-Centre',
    nameTa: 'திருவாலங்காடு துணை சுகாதார நிலையம்',
    type: 'clinic',
    typeLabel: 'Rural Sub-Centre',
    typeLabelTa: 'துணை சுகாதார நிலையம்',
    village: 'Thiruvalangadu',
    villageTa: 'திருவாலங்காடு',
    lat: 13.1362,
    lng: 79.7735,
    phone: '+919840123456',
    emergencyPhone: '108',
    isEmergency24x7: false,
    hasAmbulance: false,
    beds: 4,
    doctorInCharge: 'Health Worker Anitha (VHN) & Visiting Doctor',
    timing: '8:00 AM - 4:00 PM (Mon-Sat)',
    timingTa: 'காலை 8:00 - மாலை 4:00 (திங்கள்-சனி)',
    address: 'Post Office Street, Thiruvalangadu',
    addressTa: 'தபால் நிலைய தெரு, திருவாலங்காடு',
    services: [
      'Vital Signs & BP/Sugar Screening',
      'First Aid & Wound Dressing',
      'Maternal Care & Antenatal Registration',
      'ORS & Diarrhea Management Packets',
      'Fever & Symptom Basic Treatment'
    ],
    servicesTa: [
      'இரத்த அழுத்தம் & சர்க்கரை பரிசோதனை',
      'முதலுதவி & காயம் கட்டுதல்',
      'கர்ப்பிணி தாய்மார்கள் பதிவு',
      'ORS & வயிற்றுப்போக்கு மருந்துகள்',
      'காய்ச்சல் அடிப்படை சிகிச்சை'
    ]
  },
  {
    id: 'fac-03',
    name: 'Mullai Community Health Centre (CHC)',
    nameTa: 'முல்லை சமுதாய நல மருத்துவமனை (CHC)',
    type: 'phc',
    typeLabel: 'Community Health Centre',
    typeLabelTa: 'சமுதாய நல மருத்துவமனை',
    village: 'Mullai',
    villageTa: 'முல்லை',
    lat: 13.1195,
    lng: 79.7540,
    phone: '+919812345670',
    emergencyPhone: '108',
    isEmergency24x7: true,
    hasAmbulance: true,
    beds: 30,
    doctorInCharge: 'Dr. M. Kousalya, MD (Chief Civil Surgeon)',
    timing: '24 Hours Emergency & Inpatient',
    timingTa: '24 மணி நேர அவசர & உள்நோயாளி பிரிவு',
    address: 'State Highway Junction, Mullai',
    addressTa: 'மாநில நெடுஞ்சாலை சந்திப்பு, முல்லை',
    services: [
      '24/7 Emergency Casual Ward',
      'Surgical & Maternity Ward',
      'X-Ray, Ultrasound & ECG',
      'Oxygen Concentrators & Stabilization Beds',
      'Pediatric Care Specialist',
      'Dedicated Rural Ambulance'
    ],
    servicesTa: [
      '24/7 அவசர தீவிர சிகிச்சை பிரிவு',
      'அறுவை சிகிச்சை & மகப்பேறு பிரிவு',
      'எக்ஸ்-ரே & இசிஜி (ECG)',
      'ஆக்சிஜன் சிலிண்டர் வசதி',
      'குழந்தைகள் சிறப்பு மருத்துவர்',
      'ஆம்புலன்ஸ் வசதி'
    ]
  },
  {
    id: 'fac-04',
    name: 'Government District Headquarters Hospital',
    nameTa: 'அரசு தலைமை மாவட்ட தலைமை மருத்துவமனை',
    type: 'hospital',
    typeLabel: 'District Headquarters Hospital',
    typeLabelTa: 'அரசு தலைமை மருத்துவமனை',
    village: 'District Town Center',
    villageTa: 'மாவட்ட தலைநகரம்',
    lat: 13.1450,
    lng: 79.9120,
    phone: '044-27660234',
    emergencyPhone: '108',
    isEmergency24x7: true,
    hasAmbulance: true,
    beds: 350,
    doctorInCharge: 'Dr. V. Rajendran, MS (Medical Superintendent)',
    timing: '24 Hours Full Trauma, ICU & Super-Specialty',
    timingTa: '24 மணி நேர தீவிர சிகிச்சை & அதிநவீன பிரிவு',
    address: 'Hospital Road, Near Collectorate, District Headquarters',
    addressTa: 'மருத்துவமனை சாலை, ஆட்சியர் அலுவலகம் அருகில், மாவட்ட தலைநகர்',
    services: [
      '24x7 Trauma & Comprehensive Critical Care ICU',
      'Multi-Specialty Surgery & Orthopedics',
      'Full Blood Bank with Platelets',
      'Dialysis Unit & Cardiac Emergency',
      'NICU / Newborn Care Intensive Care',
      'Fleet of 108 Advanced Life Support Ambulances'
    ],
    servicesTa: [
      '24/7 அவசர அதிதீவிர சிகிச்சை பிரிவு (ICU)',
      'அறுவை சிகிச்சை & எலும்பு முறிவு பிரிவு',
      'இரத்த வங்கி வசதி',
      'டயாலிசிஸ் & இருதய அவசர சிகிச்சை',
      'பச்சிளம் குழந்தைகள் பராமரிப்பு (NICU)',
      '108 உயர் உயிர் காக்கும் ஆம்புலன்ஸ்கள்'
    ]
  },
  {
    id: 'fac-05',
    name: 'Melur Health Sub-Centre & Outreach Clinic',
    nameTa: 'மேலூர் துணை சுகாதார நிலையம்',
    type: 'clinic',
    typeLabel: 'Rural Sub-Centre',
    typeLabelTa: 'துணை சுகாதார நிலையம்',
    village: 'Melur Hamlet',
    villageTa: 'மேலூர்',
    lat: 13.1565,
    lng: 79.8130,
    phone: '+919789012345',
    emergencyPhone: '108',
    isEmergency24x7: false,
    hasAmbulance: false,
    beds: 2,
    doctorInCharge: 'Staff Nurse Geetha & Field Worker Team',
    timing: '9:00 AM - 2:00 PM',
    timingTa: 'காலை 9:00 - மதியம் 2:00',
    address: 'North Street, Near Water Tank, Melur',
    addressTa: 'வடக்கு தெரு, மேல்நிலை நீர்த்தேக்க தொட்டி அருகில், மேலூர்',
    services: [
      'Emergency First Aid & Trauma Bandaging',
      'Blood Pressure & Fever Check',
      'Antenatal Iron & Calcium Distribution',
      'Referral Transport Link to Kaveri PHC'
    ],
    servicesTa: [
      'அவசர முதலுதவி சிகிச்சை',
      'இரத்த அழுத்தம் & காய்ச்சல் பரிசோதனை',
      'கர்ப்பிணிகளுக்கு சத்து மாத்திரைகள்',
      'காவேரி ஆரம்ப சுகாதார நிலையத்திற்கு பரிந்துரை'
    ]
  },
  {
    id: 'fac-06',
    name: 'Keeladi Ayush & Primary Care Sub-Centre',
    nameTa: 'கீழடி ஆயுஷ் & ஆரம்ப சுகாதார துணை மையம்',
    type: 'clinic',
    typeLabel: 'Primary Care Sub-Centre',
    typeLabelTa: 'துணை சுகாதார மையம்',
    village: 'Keeladi',
    villageTa: 'கீழடி',
    lat: 13.0990,
    lng: 79.7360,
    phone: '+919443210987',
    emergencyPhone: '108',
    isEmergency24x7: false,
    hasAmbulance: false,
    beds: 2,
    doctorInCharge: 'Community Health Officer',
    timing: '8:30 AM - 3:30 PM',
    timingTa: 'காலை 8:30 - பிற்பகல் 3:30',
    address: 'Temple Car Street, Keeladi Village',
    addressTa: 'தேரடி தெரு, கீழடி கிராமம்',
    services: [
      'General Outpatient Care',
      'Non-Communicable Disease (NCD) Screening',
      'Fever Monitoring & COVID/Flu Screening',
      'Ayush Holistic Healthcare'
    ],
    servicesTa: [
      'பொது வெளிநோயாளி சிகிச்சை',
      'நீரிழிவு & இரத்த அழுத்த பரிசோதனை',
      'காய்ச்சல் கண்காணிப்பு',
      'ஆயுஷ் மருத்துவ ஆலோசனை'
    ]
  }
];

/**
 * Calculate Great-Circle distance using Haversine formula (in km)
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) {
    return null;
  }
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 decimal place e.g. 2.4 km
}

/**
 * Estimate travel time based on rural road conditions
 * ~35 km/h average speed on rural roads
 */
export function estimateTravelMinutes(distanceKm) {
  if (!distanceKm && distanceKm !== 0) return null;
  const minutes = Math.round((distanceKm / 35) * 60) + 3; // +3 min buffer
  return Math.max(minutes, 2);
}

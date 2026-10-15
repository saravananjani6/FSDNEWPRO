/**
 * Client-Side Deterministic Rule-Based Triage Engine
 * Runs 100% offline in browser IndexedDB runtime.
 */

export function evaluateClientTriage(symptoms = {}, vitals = {}, patientAge = 30) {
  const redFlags = [];
  const urgentFlags = [];

  const {
    fever = false,
    cough = false,
    breathingDifficulty = false,
    chestPain = false,
    headache = false,
    vomiting = false,
    diarrhea = false,
    abdominalPain = false,
    dizziness = false,
    injury = false,
    severeBleeding = false,
    unconscious = false
  } = symptoms;

  const temp = vitals.temperature !== undefined && vitals.temperature !== null && vitals.temperature !== '' ? Number(vitals.temperature) : null;
  const hr = vitals.heartRate !== undefined && vitals.heartRate !== null && vitals.heartRate !== '' ? Number(vitals.heartRate) : null;
  const spo2 = vitals.spO2 !== undefined && vitals.spO2 !== null && vitals.spO2 !== '' ? Number(vitals.spO2) : null;
  const rr = vitals.respiratoryRate !== undefined && vitals.respiratoryRate !== null && vitals.respiratoryRate !== '' ? Number(vitals.respiratoryRate) : null;
  const sbp = vitals.systolicBP !== undefined && vitals.systolicBP !== null && vitals.systolicBP !== '' ? Number(vitals.systolicBP) : null;
  const dbp = vitals.diastolicBP !== undefined && vitals.diastolicBP !== null && vitals.diastolicBP !== '' ? Number(vitals.diastolicBP) : null;

  // --- RED FLAGS (EMERGENCY) ---
  if (unconscious) {
    redFlags.push({
      en: 'Loss of consciousness / unresponsive',
      ta: 'நினைவிழந்த நிலை அல்லது சுயநினைவின்மை'
    });
  }
  if (severeBleeding) {
    redFlags.push({
      en: 'Severe or uncontrolled bleeding',
      ta: 'கட்டுப்படுத்த முடியாத கடுமையான இரத்தப்போக்கு'
    });
  }
  if (chestPain && (breathingDifficulty || dizziness)) {
    redFlags.push({
      en: 'Chest pain with respiratory distress or dizziness',
      ta: 'மார்பு வலியுடன் கூடிய மூச்சுத்திணறல் அல்லது மயக்கம்'
    });
  }
  if (spo2 !== null && spo2 > 0 && spo2 < 90) {
    redFlags.push({
      en: `Critically low oxygen saturation: ${spo2}%`,
      ta: `ஆபத்தான குறைவான ஆக்சிஜன் அளவு: ${spo2}%`
    });
  }
  if (rr !== null && (rr > 30 || (rr > 0 && rr < 8))) {
    redFlags.push({
      en: `Abnormal respiratory rate: ${rr} breaths/min`,
      ta: `ஆபத்தான சுவாச வீதம்: நிமிடத்திற்கு ${rr}`
    });
  }
  if (hr !== null && (hr > 130 || (hr > 0 && hr < 40))) {
    redFlags.push({
      en: `Critical heart rate: ${hr} bpm`,
      ta: `ஆபத்தான இதய துடிப்பு: நிமிடத்திற்கு ${hr}`
    });
  }
  if (sbp !== null && ((sbp > 0 && sbp < 80) || sbp > 200)) {
    redFlags.push({
      en: `Critical blood pressure: ${sbp} mmHg Systolic`,
      ta: `ஆபத்தான இரத்த அழுத்தம்: ${sbp} mmHg`
    });
  }

  // --- URGENT FLAGS ---
  if (breathingDifficulty && !chestPain) {
    urgentFlags.push({
      en: 'Difficulty breathing reported',
      ta: 'மூச்சு விடுவதில் சிரமம்'
    });
  }
  if (chestPain && !breathingDifficulty && !dizziness) {
    urgentFlags.push({
      en: 'Isolated chest pain reported',
      ta: 'மார்பு வலி'
    });
  }
  if (temp !== null && temp >= 102.0) {
    urgentFlags.push({
      en: `High fever: ${temp}°F`,
      ta: `அதிக காய்ச்சல்: ${temp}°F`
    });
  }
  if (spo2 !== null && spo2 >= 90 && spo2 <= 94) {
    urgentFlags.push({
      en: `Low oxygen saturation: ${spo2}%`,
      ta: `குறைவான ஆக்சிஜன் அளவு: ${spo2}%`
    });
  }
  if (hr !== null && hr > 100 && hr <= 130) {
    urgentFlags.push({
      en: `Elevated heart rate: ${hr} bpm`,
      ta: `அதிகரித்த இதய துடிப்பு: ${hr} bpm`
    });
  }
  if (rr !== null && rr >= 24 && rr <= 30) {
    urgentFlags.push({
      en: `Elevated respiratory rate: ${rr} breaths/min`,
      ta: `வேகமான சுவாசம்: நிமிடத்திற்கு ${rr}`
    });
  }
  if ((sbp !== null && sbp >= 160 && sbp <= 200) || (dbp !== null && dbp >= 100)) {
    urgentFlags.push({
      en: `High blood pressure: ${sbp || '-'} / ${dbp || '-'} mmHg`,
      ta: `அதிக இரத்த அழுத்தம்: ${sbp || '-'} / ${dbp || '-'} mmHg`
    });
  }
  if (vomiting && diarrhea) {
    urgentFlags.push({
      en: 'Vomiting and diarrhea: Dehydration risk',
      ta: 'வாந்தி மற்றும் வயிற்றுப்போக்கு: நீர்ச்சத்து இழப்பு அபாயம்'
    });
  }
  if (abdominalPain && vomiting) {
    urgentFlags.push({
      en: 'Acute abdominal pain with vomiting',
      ta: 'வயிற்று வலியுடன் வாந்தி'
    });
  }
  if (injury && !severeBleeding) {
    urgentFlags.push({
      en: 'Physical injury requiring doctor evaluation',
      ta: 'மருத்துவர் பரிசோதிக்க வேண்டிய காயம்'
    });
  }
  if (patientAge < 2 && temp !== null && temp >= 100.4) {
    urgentFlags.push({
      en: 'Infant (<2 years) with fever',
      ta: 'இரண்டு வயதுக்குட்பட்ட குழந்தைக்கு காய்ச்சல்'
    });
  }

  let triageLevel = 'NON-URGENT';
  let recommendationEn = '';
  let recommendationTa = '';

  if (redFlags.length > 0) {
    triageLevel = 'EMERGENCY';
    recommendationEn = 'EMERGENCY: Immediate medical attention required! Call ambulance (108) or transport immediately to the nearest Emergency Hospital.';
    recommendationTa = 'அவசரம்: உடனடியாக மருத்துவ சிகிச்சை தேவை! 108 அவசர ஊர்தியை அழைக்கவும் அல்லது உடனடியாக அருகிலுள்ள மருத்துவமனைக்கு அழைத்துச் செல்லவும்.';
  } else if (urgentFlags.length > 0) {
    triageLevel = 'URGENT';
    recommendationEn = 'URGENT: Same-day medical doctor evaluation recommended. Escort or direct patient to Primary Health Centre (PHC).';
    recommendationTa = 'அவசரக் கவனிப்பு: இன்றே அரசு மருத்துவரால் பரிசோதிக்கப்பட வேண்டும். ஆரம்ப சுகாதார நிலையத்திற்கு (PHC) அனுப்பி வைக்கவும்.';
  } else {
    triageLevel = 'NON-URGENT';
    recommendationEn = 'NON-URGENT: Routine healthcare follow-up recommended. Ensure hydration, rest, and symptomatic care. Re-evaluate if condition deteriorates.';
    recommendationTa = 'வழக்கமானது: பொதுவான கவனிப்பு போதுமானது. ஓய்வு எடுத்து, போதுமான நீர் அருந்தவும். அறிகுறிகள் அதிகமானால் உடனடியாக மீண்டும் வரவும்.';
  }

  return {
    triageLevel,
    redFlags: [...redFlags, ...urgentFlags].map((f) => f.en),
    redFlagsDetailed: [...redFlags, ...urgentFlags],
    recommendationEn,
    recommendationTa
  };
}

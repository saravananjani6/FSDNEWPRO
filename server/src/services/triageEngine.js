/**
 * Rule-Based Healthcare Triage Engine
 * Decision-support prototype for rural community health workers (ASHA/ANM).
 * NOTE: This is a decision-support prototype and does not replace professional medical diagnosis.
 */

function evaluateTriage(symptoms = {}, vitals = {}, age = 0) {
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
    redFlags.push('Loss of consciousness / unresponsive (நினைவிழந்த நிலை)');
  }
  if (severeBleeding) {
    redFlags.push('Severe or uncontrolled bleeding (கடுமையான இரத்தப்போக்கு)');
  }
  if (chestPain && (breathingDifficulty || dizziness)) {
    redFlags.push('Chest pain with respiratory distress or fainting (மார்பு வலியுடன் மூச்சுத்திணறல்/மயக்கம்)');
  }
  if (spo2 !== null && spo2 > 0 && spo2 < 90) {
    redFlags.push(`Critically low oxygen saturation: ${spo2}% (ஆக்சிஜன் அளவு மிகக் குறைவு)`);
  }
  if (rr !== null && (rr > 30 || (rr > 0 && rr < 8))) {
    redFlags.push(`Abnormal respiratory rate: ${rr} breaths/min (ஆபத்தான சுவாச வீதம்)`);
  }
  if (hr !== null && (hr > 130 || (hr > 0 && hr < 40))) {
    redFlags.push(`Critical heart rate: ${hr} bpm (ஆபத்தான இதய துடிப்பு)`);
  }
  if (sbp !== null && ((sbp > 0 && sbp < 80) || sbp > 200)) {
    redFlags.push(`Critical blood pressure: ${sbp} mmHg Systolic (ஆபத்தான இரத்த அழுத்தம்)`);
  }

  // --- URGENT FLAGS ---
  if (breathingDifficulty && !chestPain) {
    urgentFlags.push('Difficulty breathing reported (மூச்சு விடுவதில் சிரமம்)');
  }
  if (chestPain && !breathingDifficulty && !dizziness) {
    urgentFlags.push('Isolated chest pain reported (மார்பு வலி)');
  }
  if (temp !== null && temp >= 102.0) {
    urgentFlags.push(`High fever: ${temp}°F (அதிக காய்ச்சல்)`);
  }
  if (spo2 !== null && spo2 >= 90 && spo2 <= 94) {
    urgentFlags.push(`Sub-optimal oxygen level: ${spo2}% (குறைவான ஆக்சிஜன் அளவு)`);
  }
  if (hr !== null && hr > 100 && hr <= 130) {
    urgentFlags.push(`Tachycardia (Elevated heart rate): ${hr} bpm (அதிகரித்த இதய துடிப்பு)`);
  }
  if (rr !== null && rr >= 24 && rr <= 30) {
    urgentFlags.push(`Elevated respiratory rate: ${rr} breaths/min (வேகமான சுவாசம்)`);
  }
  if ((sbp !== null && sbp >= 160 && sbp <= 200) || (dbp !== null && dbp >= 100)) {
    urgentFlags.push(`High blood pressure: ${sbp || '-'} / ${dbp || '-'} mmHg (அதிக இரத்த அழுத்தம்)`);
  }
  if (vomiting && diarrhea) {
    urgentFlags.push('Vomiting and diarrhea: Dehydration risk (வாந்தி மற்றும் வயிற்றுப்போக்கு - நீர்ச்சத்து இழப்பு அபாயம்)');
  }
  if (abdominalPain && vomiting) {
    urgentFlags.push('Acute abdominal pain with vomiting (வயிற்று வலியுடன் வாந்தி)');
  }
  if (injury && !severeBleeding) {
    urgentFlags.push('Physical injury requiring evaluation (காயம் ஏற்பட்டுள்ளது)');
  }
  if (age < 2 && temp !== null && temp >= 100.4) {
    urgentFlags.push('Infant (<2 years) with fever (இரண்டு வயதுக்குட்பட்ட குழந்தைக்கு காய்ச்சல்)');
  }

  // Determine Level
  let triageLevel = 'NON-URGENT';
  let recommendationEn = '';
  let recommendationTa = '';

  if (redFlags.length > 0) {
    triageLevel = 'EMERGENCY';
    recommendationEn = 'EMERGENCY: Seek immediate in-person care at the nearest Community Health Centre or Emergency Hospital.';
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
    redFlags: [...redFlags, ...urgentFlags],
    recommendationEn,
    recommendationTa
  };
}

function conditionMatches(condition, answers) {
  const value = answers[condition.field];
  if ('equals' in condition) return value === condition.equals;
  if ('includes' in condition) return Array.isArray(value) && value.includes(condition.includes);
  if ('in' in condition) return Array.isArray(condition.in) && condition.in.includes(value);
  return false;
}

function ruleMatches(rule, answers) {
  const all = rule.all ? rule.all.every((c) => conditionMatches(c, answers)) : true;
  const any = rule.any ? rule.any.some((c) => conditionMatches(c, answers)) : true;
  return all && any;
}

function runTriage(ruleSet, answers, translate = (k) => k) {
  const redFlags = ['breathing_difficulty', 'chest_pain', 'severe_bleeding', 'unconscious'];
  if (redFlags.some((flag) => answers[flag] === true) || (answers.pregnant && answers.pregnancy_danger)) {
    const redRule = [...ruleSet.rules].sort((a, b) => b.priority - a.priority).find((rule) => rule.color === 'RED' && ruleMatches(rule, answers));
    return {
      color: 'RED',
      severity: 'severe',
      advice: translate(redRule?.adviceKey || 'advice_red'),
      reasons: [translate(redRule?.reasonKey || 'reason_severe')]
    };
  }
  const matched = [...ruleSet.rules].sort((a, b) => b.priority - a.priority).find((rule) => ruleMatches(rule, answers));
  if (!matched || !answers.symptoms?.length) {
    return { color: 'YELLOW', severity: 'medium', advice: translate('unsure'), reasons: [translate('unsure')] };
  }
  return {
    color: matched.color,
    severity: matched.color === 'GREEN' ? 'mild' : 'medium',
    advice: translate(matched.adviceKey),
    reasons: [translate(matched.reasonKey)]
  };
}

module.exports = {
  evaluateTriage,
  runTriage
};

const https = require('https');
const fs = require('fs');
const path = require('path');

const clientPublic = path.join(__dirname, 'client', 'public', 'audio');

function downloadTTS(text, lang, filepath) {
  return new Promise((resolve, reject) => {
    const url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=' + lang + '&client=tw-ob&q=' + encodeURIComponent(text);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Status ${res.statusCode} for ${text}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(filepath, buffer);
        resolve(buffer.length);
      });
    }).on('error', reject);
  });
}

const audioTracks = [
  // Symptoms
  {
    key: 'fever',
    ta: 'உங்களுக்கு காய்ச்சல் அல்லது உடல் சூடாக இருக்கிறதா?',
    en: 'Do you have a fever or feeling hot?'
  },
  {
    key: 'cough',
    ta: 'உங்களுக்கு இருமல் அல்லது தொண்டை வலி இருக்கிறதா?',
    en: 'Do you have cough or throat pain?'
  },
  {
    key: 'breathing',
    ta: 'உங்களுக்கு மூச்சு வாங்குவதில் அதிக சிரமம் உள்ளதா?',
    en: 'Do you have difficulty breathing or shortness of breath?'
  },
  {
    key: 'chest_pain',
    ta: 'உங்களுக்கு நெஞ்சில் பாரமாக வலி அல்லது அழுத்தம் உள்ளதா?',
    en: 'Do you feel heavy chest pain or pressure?'
  },
  {
    key: 'severe_bleeding',
    ta: 'நிறுத்த முடியாத அளவுக்கு அதிக இரத்தம் வடிகிறதா?',
    en: 'Is there continuous or heavy bleeding from a wound?'
  },
  {
    key: 'unconscious',
    ta: 'நோயாளி பேசாமல் நினைவிழந்து கிடக்கிறாரா?',
    en: 'Is the patient unresponsive or unconscious?'
  },
  {
    key: 'headache',
    ta: 'உங்களுக்கு தலையில் கடுமையான வலி உள்ளதா?',
    en: 'Do you have a severe headache?'
  },
  {
    key: 'vomiting',
    ta: 'தொடர்ந்து வாந்தி வருகிறதா?',
    en: 'Are you vomiting repeatedly?'
  },
  {
    key: 'diarrhea',
    ta: 'அடிக்கடி பேதி அல்லது வயிற்றுப்போக்கு உள்ளதா?',
    en: 'Do you have diarrhea or frequent loose stools?'
  },
  {
    key: 'abdominal_pain',
    ta: 'வயிற்றில் கடுமையான வலி உள்ளதா?',
    en: 'Do you feel sharp pain in the stomach?'
  },
  {
    key: 'dizziness',
    ta: 'தலைசுற்றல், தள்ளாட்டம் அல்லது மயக்கம் வருகிறதா?',
    en: 'Are you feeling dizzy, unsteady, or faint?'
  },
  {
    key: 'injury',
    ta: 'கீழே விழுந்தது போன்ற ஏதேனும் காயம் ஏற்பட்டுள்ளதா?',
    en: 'Has there been an accident, fall, or injury?'
  },

  // Triage Alerts
  {
    key: 'emergency_alert',
    ta: 'அவசரம்! உடனடியாக மருத்துவ சிகிச்சை தேவை! 108 ஆம்புலன்ஸை உடனடியாக அழைக்கவும்!',
    en: 'EMERGENCY! Immediate medical attention required. Calling 108 ambulance now.'
  },
  {
    key: 'urgent_alert',
    ta: 'அவசரக் கவனிப்பு! இன்றே ஆரம்ப சுகாதார நிலைய மருத்துவரிடம் சென்று காட்டி பரிசோதிக்கவும்.',
    en: 'URGENT! Doctor evaluation recommended today at Primary Health Centre.'
  },
  {
    key: 'non_urgent_alert',
    ta: 'தாத்தா, பாட்டி! பயப்பட வேண்டாம். இது வழக்கமான பிரச்சனை தான். வீட்டில் வெந்நீர் குடித்து ஓய்வெடுக்கவும்.',
    en: 'Non-urgent. Routine care. Please rest well at home and drink plenty of warm water.'
  },

  // Senior Wizard Specific
  {
    key: 'senior_welcome',
    ta: 'வணக்கம் தாத்தா பாட்டி! உங்கள் உடல் நலனை பரிசோதிக்க நான் உதவுகிறேன். கேள்விகளை கவனியுங்கள்.',
    en: 'Welcome! I will guide you through simple questions to check your health.'
  },
  {
    key: 'senior_yes_registered',
    ta: 'ஆம் என்று பதிவு செய்யப்பட்டது.',
    en: 'Registered: YES.'
  },
  {
    key: 'senior_no_registered',
    ta: 'இல்லை என்று பதிவு செய்யப்பட்டது.',
    en: 'Registered: NO.'
  },
  {
    key: 'senior_bodymap_intro',
    ta: 'தாத்தா பாட்டி, உடலில் வலி உள்ள இடத்தை தொடுங்கள்.',
    en: 'Touch the part of the body where you feel pain.'
  },
  {
    key: 'senior_emergency_sos',
    ta: 'அவசரம்! உடனடியாக 108 ஆம்புலன்ஸை அழைக்கவும். உதவி அருகில் உள்ளது.',
    en: 'Emergency! Calling 108 ambulance now.'
  }
];

async function generateAll() {
  console.log('--- Generating High-Quality Real Spoken Audio for Tamil & English ---');
  
  const taDir = path.join(clientPublic, 'ta');
  const enDir = path.join(clientPublic, 'en');
  if (!fs.existsSync(taDir)) fs.mkdirSync(taDir, { recursive: true });
  if (!fs.existsSync(enDir)) fs.mkdirSync(enDir, { recursive: true });

  for (const track of audioTracks) {
    // Tamil
    const taMp3 = path.join(taDir, `${track.key}.mp3`);
    const taWav = path.join(taDir, `${track.key}.wav`);
    try {
      const bytes = await downloadTTS(track.ta, 'ta', taMp3);
      // Also copy to .wav so either extension works seamlessly
      fs.copyFileSync(taMp3, taWav);
      console.log(`[Tamil] Generated ${track.key}: ${bytes} bytes`);
    } catch (err) {
      console.error(`[Tamil Error] ${track.key}:`, err.message);
    }

    // Short delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));

    // English
    const enMp3 = path.join(enDir, `${track.key}.mp3`);
    const enWav = path.join(enDir, `${track.key}.wav`);
    try {
      const bytes = await downloadTTS(track.en, 'en', enMp3);
      fs.copyFileSync(enMp3, enWav);
      console.log(`[English] Generated ${track.key}: ${bytes} bytes`);
    } catch (err) {
      console.error(`[English Error] ${track.key}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log('--- Audio Generation Successfully Completed! ---');
}

generateAll();

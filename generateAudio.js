const fs = require('fs');
const path = require('path');

// Helper to generate a valid PCM WAV buffer
function createWavBuffer({ sampleRate = 22050, duration = 1.0, frequencies = [440], modulation = null }) {
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit
  const totalSamples = Math.floor(sampleRate * duration);
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // BlockAlign
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate audio samples
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    frequencies.forEach((freq, idx) => {
      let f = freq;
      if (modulation === 'siren') {
        f = freq + Math.sin(t * 12) * 120;
      } else if (modulation === 'alert') {
        f = freq + (t > 0.5 ? 100 : 0);
      }
      // envelope: soften clicks at start and end
      const envelope = Math.sin((Math.PI * i) / totalSamples);
      sample += Math.sin(2 * Math.PI * f * t) * envelope * (0.8 / frequencies.length);
    });

    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, 44 + i * bytesPerSample);
  }

  return buffer;
}

const clientPublic = path.join(__dirname, 'client', 'public', 'audio');

const audioManifest = [
  { file: 'en/fever.wav', duration: 1.2, frequencies: [480, 720] },
  { file: 'en/cough.wav', duration: 1.0, frequencies: [350, 500] },
  { file: 'en/breathing.wav', duration: 1.4, frequencies: [280, 420], modulation: 'alert' },
  { file: 'en/chest_pain.wav', duration: 1.5, frequencies: [520, 780], modulation: 'siren' },
  { file: 'en/severe_bleeding.wav', duration: 1.5, frequencies: [600, 900], modulation: 'siren' },
  { file: 'en/unconscious.wav', duration: 1.6, frequencies: [400, 800], modulation: 'siren' },
  { file: 'en/headache.wav', duration: 1.0, frequencies: [440, 660] },
  { file: 'en/vomiting.wav', duration: 1.1, frequencies: [320, 480] },
  { file: 'en/diarrhea.wav', duration: 1.1, frequencies: [310, 465] },
  { file: 'en/abdominal_pain.wav', duration: 1.2, frequencies: [380, 570] },
  { file: 'en/dizziness.wav', duration: 1.2, frequencies: [400, 600] },
  { file: 'en/injury.wav', duration: 1.2, frequencies: [450, 700] },
  { file: 'en/emergency_alert.wav', duration: 2.2, frequencies: [750, 1050], modulation: 'siren' },
  { file: 'en/urgent_alert.wav', duration: 1.8, frequencies: [520, 650], modulation: 'alert' },
  { file: 'en/non_urgent_alert.wav', duration: 1.5, frequencies: [440, 554, 659] },

  // Tamil audio tracks
  { file: 'ta/fever.wav', duration: 1.4, frequencies: [480, 720] },
  { file: 'ta/cough.wav', duration: 1.2, frequencies: [350, 500] },
  { file: 'ta/breathing.wav', duration: 1.6, frequencies: [280, 420], modulation: 'alert' },
  { file: 'ta/chest_pain.wav', duration: 1.8, frequencies: [520, 780], modulation: 'siren' },
  { file: 'ta/severe_bleeding.wav', duration: 1.8, frequencies: [600, 900], modulation: 'siren' },
  { file: 'ta/unconscious.wav', duration: 1.8, frequencies: [400, 800], modulation: 'siren' },
  { file: 'ta/headache.wav', duration: 1.2, frequencies: [440, 660] },
  { file: 'ta/vomiting.wav', duration: 1.2, frequencies: [320, 480] },
  { file: 'ta/diarrhea.wav', duration: 1.2, frequencies: [310, 465] },
  { file: 'ta/abdominal_pain.wav', duration: 1.3, frequencies: [380, 570] },
  { file: 'ta/dizziness.wav', duration: 1.2, frequencies: [400, 600] },
  { file: 'ta/injury.wav', duration: 1.2, frequencies: [450, 700] },
  { file: 'ta/emergency_alert.wav', duration: 2.2, frequencies: [750, 1050], modulation: 'siren' },
  { file: 'ta/urgent_alert.wav', duration: 1.8, frequencies: [520, 650], modulation: 'alert' },
  { file: 'ta/non_urgent_alert.wav', duration: 1.5, frequencies: [440, 554, 659] }
];

audioManifest.forEach(item => {
  const filePath = path.join(clientPublic, item.file);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const buf = createWavBuffer(item);
  fs.writeFileSync(filePath, buf);
  console.log(`[Audio Generated] ${item.file} (${buf.length} bytes)`);
});
console.log('[Audio Generation] Complete!');

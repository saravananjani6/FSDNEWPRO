/**
 * Offline Audio Engine
 * Plays bundled local WAV files, generates Web Audio synthetic tones,
 * and provides speech synthesis voice playback when supported offline.
 */

let activeAudio = null;

// Synthesize tone fallback using Web Audio API (100% offline, zero network)
function playWebAudioTone(type = 'chime') {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'emergency') {
      // Siren pulse
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.6);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.9);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      osc.start(now);
      osc.stop(now + 1.2);
    } else if (type === 'urgent') {
      // Dual beep warning
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.2); // A5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'success') {
      // Affirmative soft chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'click') {
      // Soft tactile click
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else {
      // Friendly non-urgent chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch (err) {
    console.warn('[Web Audio Tone Error]', err);
  }
}

export const soundManager = {
  playTone(type = 'chime') {
    playWebAudioTone(type);
  },

  // Play pre-recorded spoken clip (fever, cough, senior_welcome, etc.)
  playClip(key, lang = 'ta', onEnd = null) {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }

    // Try MP3 first, then WAV
    const mp3Path = `/audio/${lang}/${key}.mp3`;
    const wavPath = `/audio/${lang}/${key}.wav`;
    const audio = new Audio(mp3Path);
    activeAudio = audio;

    audio.onended = () => {
      activeAudio = null;
      if (onEnd) onEnd();
    };

    audio.onerror = () => {
      // Fallback to .wav if .mp3 failed
      const fallbackAudio = new Audio(wavPath);
      activeAudio = fallbackAudio;
      fallbackAudio.onended = () => {
        activeAudio = null;
        if (onEnd) onEnd();
      };
      fallbackAudio.onerror = () => {
        activeAudio = null;
        if (onEnd) onEnd();
      };
      fallbackAudio.play().catch(() => {
        if (onEnd) onEnd();
      });
    };

    audio.play().catch((err) => {
      console.log(`[Audio Play Note] ${key}:`, err.message);
      // Auto-unlock retry or onEnd
      if (onEnd) setTimeout(onEnd, 1000);
    });
  },

  // Play bundled question audio file (real spoken Tamil/English voice)
  playQuestionAudio(key, lang = 'ta', spokenText = '', onEnd = null) {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }

    const mp3Path = `/audio/${lang}/${key}.mp3`;
    const wavPath = `/audio/${lang}/${key}.wav`;
    const audio = new Audio(mp3Path);
    activeAudio = audio;

    let hasEnded = false;
    const triggerEnd = () => {
      if (!hasEnded) {
        hasEnded = true;
        activeAudio = null;
        if (onEnd) onEnd();
      }
    };

    audio.onended = triggerEnd;

    audio.onerror = () => {
      // Fallback to .wav
      const fallbackAudio = new Audio(wavPath);
      activeAudio = fallbackAudio;
      fallbackAudio.onended = triggerEnd;
      fallbackAudio.onerror = () => {
        // Fallback to speech synthesis if audio file not reachable
        if (spokenText) {
          this.speakText(spokenText, lang, onEnd);
        } else {
          triggerEnd();
        }
      };
      fallbackAudio.play().catch(() => {
        if (spokenText) {
          this.speakText(spokenText, lang, onEnd);
        } else {
          triggerEnd();
        }
      });
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.log('[Audio Play Notice] Autoplay restricted or missing, trying fallback:', err.message);
        if (spokenText) {
          this.speakText(spokenText, lang, onEnd);
        } else {
          triggerEnd();
        }
      });
    }
  },

  // Direct speech synthesis helper with senior-optimized cadence (when no pre-recorded audio exists)
  speakText(text, lang = 'ta', onEnd = null, rate = 0.85) {
    this.stopAll();
    if (!text || !('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 800);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ta' ? 'ta-IN' : 'en-US';
      utterance.rate = rate; // Gentle, clear speed for seniors
      utterance.pitch = 1.0;

      // Try finding regional Indian voice if available
      const voices = window.speechSynthesis.getVoices();
      const matchedVoice = voices.find((v) =>
        lang === 'ta'
          ? v.lang.toLowerCase().includes('ta')
          : v.lang.toLowerCase().includes('en-in') || v.lang.toLowerCase().includes('en-us')
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      if (onEnd) {
        utterance.onend = () => onEnd();
        utterance.onerror = () => onEnd();
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('[Speech Synthesis Warning]', e);
      if (onEnd) onEnd();
    }
  },

  // Play triage alert real spoken audio and alert tone
  playTriageAlert(level = 'NON-URGENT', lang = 'ta') {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }

    let alertKey = 'non_urgent_alert';
    let toneType = 'chime';

    if (level === 'EMERGENCY') {
      alertKey = 'emergency_alert';
      toneType = 'emergency';
    } else if (level === 'URGENT') {
      alertKey = 'urgent_alert';
      toneType = 'urgent';
    }

    // Play attention tone first
    playWebAudioTone(toneType);

    // After brief tone, play the genuine spoken Tamil/English medical announcement
    setTimeout(() => {
      this.playClip(alertKey, lang);
    }, 400);
  },

  stopAll() {
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.currentTime = 0;
      activeAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
};

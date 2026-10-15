import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { soundManager } from '../../audio/soundManager';
import {
  Volume2,
  Mic,
  MicOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Thermometer,
  Wind,
  HeartCrack,
  Activity,
  AlertCircle,
  Droplets,
  UserX,
  Stethoscope,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

const ICON_MAP = {
  fever: Thermometer,
  cough: Wind,
  breathingDifficulty: Wind,
  chestPain: HeartCrack,
  headache: Activity,
  vomiting: AlertCircle,
  diarrhea: AlertCircle,
  abdominalPain: Activity,
  dizziness: AlertTriangle,
  injury: AlertTriangle,
  severeBleeding: Droplets,
  unconscious: UserX
};

const SYMPTOM_QUESTIONS = [
  {
    key: 'chestPain',
    soundKey: 'chest_pain',
    titleTa: 'மார்பு வலி / அடைப்பு',
    titleEn: 'Chest Pain or Tightness',
    qTa: 'உங்களுக்கு நெஞ்சில் பாரமாக வலி அல்லது அழுத்தம் உள்ளதா?',
    qEn: 'Do you feel heavy chest pain or pressure?',
    isEmergency: true
  },
  {
    key: 'breathingDifficulty',
    soundKey: 'breathing',
    titleTa: 'மூச்சு விடுவதில் சிரமம்',
    titleEn: 'Difficulty Breathing',
    qTa: 'உங்களுக்கு மூச்சு வாங்குவதில் அதிக சிரமம் உள்ளதா?',
    qEn: 'Are you struggling to breathe or out of breath?',
    isEmergency: true
  },
  {
    key: 'fever',
    soundKey: 'fever',
    titleTa: 'காய்ச்சல் / உடல் சூடு',
    titleEn: 'Fever or Feeling Hot',
    qTa: 'உங்களுக்கு காய்ச்சல் அல்லது உடல் சூடாக இருக்கிறதா?',
    qEn: 'Do you have a fever or feeling hot?'
  },
  {
    key: 'headache',
    soundKey: 'headache',
    titleTa: 'கடுமையான தலைவலி',
    titleEn: 'Severe Headache',
    qTa: 'உங்களுக்கு தலையில் கடுமையான வலி உள்ளதா?',
    qEn: 'Do you have a severe headache?'
  },
  {
    key: 'dizziness',
    soundKey: 'dizziness',
    titleTa: 'தலைசுற்றல் அல்லது மயக்கம்',
    titleEn: 'Dizziness or Fainting',
    qTa: 'உங்களுக்கு தலைசுற்றல், தள்ளாட்டம் அல்லது மயக்கம் வருகிறதா?',
    qEn: 'Are you feeling dizzy, unsteady, or faint?'
  },
  {
    key: 'abdominalPain',
    soundKey: 'abdominal_pain',
    titleTa: 'வயிற்று வலி',
    titleEn: 'Stomach Pain',
    qTa: 'வயிற்றில் கடுமையான வலி உள்ளதா?',
    qEn: 'Do you feel sharp pain in your abdomen?'
  },
  {
    key: 'vomiting',
    soundKey: 'vomiting',
    titleTa: 'தொடர் வாந்தி',
    titleEn: 'Vomiting Repeatedly',
    qTa: 'தொடர்ந்து வாந்தி வருகிறதா?',
    qEn: 'Are you vomiting repeatedly?'
  },
  {
    key: 'diarrhea',
    soundKey: 'diarrhea',
    titleTa: 'வயிற்றுப்போக்கு / பேதி',
    titleEn: 'Diarrhea / Loose Motion',
    qTa: 'அடிக்கடி பேதி அல்லது வயிற்றுப்போக்கு உள்ளதா?',
    qEn: 'Do you have frequent loose stools or diarrhea?'
  },
  {
    key: 'severeBleeding',
    soundKey: 'severe_bleeding',
    titleTa: 'அதிக இரத்தப்போக்கு',
    titleEn: 'Heavy Bleeding',
    qTa: 'நிறுத்த முடியாத அளவுக்கு இரத்தம் வடிகிறதா?',
    qEn: 'Is there continuous or heavy bleeding from a wound?',
    isEmergency: true
  },
  {
    key: 'injury',
    soundKey: 'injury',
    titleTa: 'விபத்து அல்லது காயம்',
    titleEn: 'Accident / Fall Injury',
    qTa: 'கீழே விழுந்தது போன்ற ஏதேனும் காயம் ஏற்பட்டுள்ளதா?',
    qEn: 'Has there been an accident, fall, or injury?'
  }
];

export function SeniorVoiceWizard({
  symptoms = {},
  onSymptomChange,
  onFinishEvaluation,
  onEmergencySOS
}) {
  const { lang, t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [voiceHeardText, setVoiceHeardText] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(false);

  const recognitionRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const speechDelayTimerRef = useRef(null);
  const currentQ = SYMPTOM_QUESTIONS[currentIndex];
  const IconComponent = ICON_MAP[currentQ.key] || Stethoscope;
  const currentAnswer = symptoms[currentQ.key];

  // Initialize Speech Recognition once
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setRecognitionSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      recognitionRef.current = rec;
    }
  }, []);

  // Whenever the question changes, wait a comfortable 800ms gap, then speak aloud!
  useEffect(() => {
    setVoiceHeardText('');
    setIsTransitioning(false);

    if (speechDelayTimerRef.current) clearTimeout(speechDelayTimerRef.current);

    // 800ms respectful pause after card renders before audio starts
    speechDelayTimerRef.current = setTimeout(() => {
      speakCurrentQuestion();
    }, 800);

    return () => {
      if (speechDelayTimerRef.current) clearTimeout(speechDelayTimerRef.current);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      stopVoiceRecognition();
      soundManager.stopAll();
    };
  }, [currentIndex, lang]);

  const speakCurrentQuestion = () => {
    setIsSpeaking(true);
    stopVoiceRecognition();

    const spokenText = lang === 'ta' ? currentQ.qTa : currentQ.qEn;
    soundManager.playQuestionAudio(currentQ.soundKey, lang, spokenText, () => {
      setIsSpeaking(false);
      // Auto-start listening after audio finishes
      startVoiceRecognition();
    });
  };

  const startVoiceRecognition = () => {
    if (!recognitionRef.current || isListening) return;

    try {
      const rec = recognitionRef.current;
      rec.lang = lang === 'ta' ? 'ta-IN' : 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        setVoiceHeardText(transcript);
        handleVoiceInput(transcript);
        setIsListening(false);
      };

      rec.onerror = (err) => {
        console.log('[Voice Rec Log]:', err.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
    setIsListening(false);
  };

  // Recognize voice keywords in Tamil & English
  const handleVoiceInput = (text) => {
    const clean = text.toLowerCase();

    // YES keywords
    const yesWords = [
      'ஆம்',
      'ஆமா',
      'ஆமாம்',
      'ஆமாங்க',
      'வலிக்குது',
      'இருக்கு',
      'வலிக்கிறது',
      'காயிருக்கு',
      'yes',
      'yeah',
      'yep',
      'true',
      'hurts',
      'pain'
    ];

    // NO keywords
    const noWords = [
      'இல்லை',
      'இல்ல',
      'இல்லீங்க',
      'போச்சு',
      'இல்லவே இல்ல',
      'இல்ல இல்ல',
      'no',
      'nope',
      'nah',
      'false',
      'none'
    ];

    const isYesMatch = yesWords.some((w) => clean.includes(w));
    const isNoMatch = noWords.some((w) => clean.includes(w));

    if (isYesMatch) {
      selectAnswer(true, true);
    } else if (isNoMatch) {
      selectAnswer(false, true);
    }
  };

  const selectAnswer = (value, fromVoice = false) => {
    if (isTransitioning) return; // Prevent double-triggering during transition
    setIsTransitioning(true);
    stopVoiceRecognition();
    soundManager.playTone(value ? 'success' : 'click');
    onSymptomChange(currentQ.key, value);

    const clipKey = value ? 'senior_yes_registered' : 'senior_no_registered';

    // 1. Play confirmation audio ("ஆம் என்று பதிவு செய்யப்பட்டது" / "இல்லை என்று பதிவு செய்யப்பட்டது")
    // 2. WAIT for the audio to COMPLETELY finish playing via onEnd callback
    // 3. THEN add a comfortable 1.8-second gap so the senior has time to absorb the response
    soundManager.playClip(clipKey, lang, () => {
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        if (currentIndex < SYMPTOM_QUESTIONS.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Completed all questions
          onFinishEvaluation();
        }
      }, 1800); // 1.8-second comfortable gap AFTER audio is 100% finished!
    });
  };

  const handleNext = () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (speechDelayTimerRef.current) clearTimeout(speechDelayTimerRef.current);
    soundManager.stopAll();
    setIsTransitioning(false);
    soundManager.playTone('click');
    if (currentIndex < SYMPTOM_QUESTIONS.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onFinishEvaluation();
    }
  };

  const handlePrev = () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    if (speechDelayTimerRef.current) clearTimeout(speechDelayTimerRef.current);
    soundManager.stopAll();
    setIsTransitioning(false);
    soundManager.playTone('click');
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="senior-voice-wizard-card">
      {/* Top Question Progress & Speaker */}
      <div className="wizard-top-bar">
        <div className="step-badge">
          <span>{t('senior_step_indicator')}</span>
          <strong>{currentIndex + 1}</strong>
          <span>{t('senior_of')}</span>
          <strong>{SYMPTOM_QUESTIONS.length}</strong>
        </div>

        <button
          type="button"
          onClick={speakCurrentQuestion}
          className={`btn-wizard-speaker ${isSpeaking ? 'pulse-wave' : ''}`}
          title={t('senior_repeat_audio')}
          aria-label={t('senior_repeat_audio')}
        >
          <Volume2 size={28} />
          <span className="btn-speaker-label">{t('senior_repeat_audio')}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="wizard-progress-track">
        <div
          className="wizard-progress-fill"
          style={{ width: `${((currentIndex + 1) / SYMPTOM_QUESTIONS.length) * 100}%` }}
        />
      </div>

      {/* Central Visual Question Display */}
      <div className="wizard-main-body">
        <div
          className={`wizard-pictogram-bubble ${
            currentQ.isEmergency ? 'emergency-glow' : ''
          }`}
        >
          <IconComponent size={64} className="pictogram-svg" />
        </div>

        <h2 className="wizard-question-title">
          {lang === 'ta' ? currentQ.titleTa : currentQ.titleEn}
        </h2>

        <p className="wizard-spoken-text">
          "{lang === 'ta' ? currentQ.qTa : currentQ.qEn}"
        </p>

        {/* Live Voice Status & Transition Gap Indicator */}
        <div className="voice-listening-indicator">
          {isTransitioning ? (
            <div className="listening-active-box" style={{ background: '#ecfdf5', borderColor: '#10b981' }}>
              <CheckCircle size={22} className="text-emerald-600 animate-bounce" />
              <span className="listening-prompt-text" style={{ color: '#047857' }}>
                {t('senior_moving_next')}
              </span>
            </div>
          ) : isListening ? (
            <div className="listening-active-box">
              <span className="mic-pulse-ring">
                <Mic size={24} className="mic-icon animate-pulse text-red-500" />
              </span>
              <span className="listening-prompt-text">{t('senior_listening_active')}</span>
            </div>
          ) : isSpeaking ? (
            <div className="speaking-box">
              <Volume2 size={20} className="animate-bounce" />
              <span>{lang === 'ta' ? 'கேள்வி பேசப்படுகிறது...' : 'Speaking question...'}</span>
            </div>
          ) : (
            <div className="tap-hint-box">
              <span>{t('senior_listening_hint')}</span>
            </div>
          )}

          {voiceHeardText && (
            <div className="voice-heard-tag">
              <span>{lang === 'ta' ? 'நீங்கள் கூறியது:' : 'Heard:'} "{voiceHeardText}"</span>
            </div>
          )}
        </div>
      </div>

      {/* GIANT DUAL YES / NO TOUCH CARDS */}
      <div className="wizard-giant-choice-grid">
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => selectAnswer(true)}
          className={`giant-choice-card card-yes ${
            currentAnswer === true ? 'is-selected' : ''
          } ${isTransitioning && currentAnswer !== true ? 'opacity-50' : ''}`}
        >
          <div className="giant-emoji-wrapper">👍</div>
          <div className="giant-card-text">
            <span className="giant-title">{t('btn_yes')}</span>
            <span className="giant-sub">{lang === 'ta' ? 'ஆம், வலி/பிரச்சனை உள்ளது' : 'Yes, I have this'}</span>
          </div>
          {currentAnswer === true && <CheckCircle size={36} className="selection-checkmark" />}
        </button>

        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => selectAnswer(false)}
          className={`giant-choice-card card-no ${
            currentAnswer === false ? 'is-selected' : ''
          } ${isTransitioning && currentAnswer !== false ? 'opacity-50' : ''}`}
        >
          <div className="giant-emoji-wrapper">👎</div>
          <div className="giant-card-text">
            <span className="giant-title">{t('btn_no')}</span>
            <span className="giant-sub">{lang === 'ta' ? 'இல்லை, இந்த பிரச்சனை இல்லை' : 'No, I do not have this'}</span>
          </div>
          {currentAnswer === false && <CheckCircle size={36} className="selection-checkmark" />}
        </button>
      </div>

      {/* Bottom Navigation & Done Shortcut */}
      <div className="wizard-bottom-controls">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="btn-wizard-nav prev"
        >
          <ChevronLeft size={24} />
          <span>{t('senior_btn_prev')}</span>
        </button>

        <button
          type="button"
          onClick={onFinishEvaluation}
          className="btn-wizard-finish"
        >
          <Sparkles size={20} />
          <span>{t('senior_btn_finish')}</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="btn-wizard-nav next"
        >
          <span>{t('senior_btn_next')}</span>
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

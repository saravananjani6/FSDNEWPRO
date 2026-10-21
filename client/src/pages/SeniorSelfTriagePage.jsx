import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { soundManager } from '../audio/soundManager';
import { evaluateClientTriage } from '../services/triageRules';
import { triageRepository } from '../database/triageRepository';
import { SeniorVoiceWizard } from '../components/senior/SeniorVoiceWizard';
import { SeniorBodyMap } from '../components/senior/SeniorBodyMap';
import {
  PhoneCall,
  Volume2,
  Globe,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Phone,
  Home,
  Activity
} from 'lucide-react';

export function SeniorSelfTriagePage() {
  const { lang, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();

  // Mode: 'voice' | 'bodymap'
  const [activeMode, setActiveMode] = useState('voice');
  const [estimatedAge] = useState(68);

  // Symptoms state
  const [symptoms, setSymptoms] = useState({
    fever: false,
    cough: false,
    breathingDifficulty: false,
    chestPain: false,
    headache: false,
    vomiting: false,
    diarrhea: false,
    abdominalPain: false,
    dizziness: false,
    injury: false,
    severeBleeding: false,
    unconscious: false
  });

  const [triageResult, setTriageResult] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Speak initial welcoming instruction using pre-recorded human Tamil/English voice
  useEffect(() => {
    soundManager.playClip('senior_welcome', lang);

    return () => {
      soundManager.stopAll();
    };
  }, [lang]);

  const handleSymptomChange = (key, value) => {
    setSymptoms((prev) => ({ ...prev, [key]: value }));
  };

  const handleLanguageToggle = () => {
    const nextLang = lang === 'ta' ? 'en' : 'ta';
    changeLanguage(nextLang);
  };

  // Perform triage evaluation and save record locally
  const handleFinishEvaluation = async () => {
    setIsEvaluating(true);
    soundManager.stopAll();

    const evaluation = evaluateClientTriage(symptoms, {}, estimatedAge);
    setTriageResult(evaluation);

    // Save anonymously / self-service into IndexedDB
    try {
      const patientName =
        lang === 'ta' ? 'கிராம முதியவர் (சுய பரிசோதனை)' : 'Elderly Self-Service Patient';

      await triageRepository.create({
        patientId: 'SENIOR-SELF',
        patientName,
        patientAge: estimatedAge,
        patientGender: 'unknown',
        symptoms,
        vitals: {},
        triageLevel: evaluation.triageLevel,
        redFlags: evaluation.redFlags,
        recommendationEn: evaluation.recommendationEn,
        recommendationTa: evaluation.recommendationTa,
        notes: 'Assessed independently via Senior Voice & Visual Self-Service Mode.'
      });
    } catch (err) {
      console.warn('[Senior Record Save Note]', err);
    } finally {
      setIsEvaluating(false);
    }

    // Play audible triage alert tone and spoken result announcement
    soundManager.playTriageAlert(evaluation.triageLevel, lang);
  };

  const handleEmergencySOS = () => {
    soundManager.playTone('emergency');
    setShowEmergencyModal(true);
    soundManager.playClip('senior_emergency_sos', lang);
  };

  const handleRestart = () => {
    soundManager.stopAll();
    setSymptoms({
      fever: false,
      cough: false,
      breathingDifficulty: false,
      chestPain: false,
      headache: false,
      vomiting: false,
      diarrhea: false,
      abdominalPain: false,
      dizziness: false,
      injury: false,
      severeBleeding: false,
      unconscious: false
    });
    setTriageResult(null);
  };

  return (
    <div className="senior-page-wrapper">
      {/* Top Banner: Emergency 108 SOS + Brand + Utility Actions */}
      <div className="senior-sos-bar">
        {false && <button
          type="button"
          onClick={handleEmergencySOS}
          className="btn-senior-sos-pulse"
          aria-label="Call 108 Ambulance Emergency"
        >
          <PhoneCall size={26} className="sos-phone-bounce" />
          <span className="sos-big-label">{t('senior_btn_emergency_sos')}</span>
        </button>}

        <div className="senior-top-brand">
          <span className="senior-top-emoji">👴👵</span>
          <span className="senior-top-title">{t('senior_mode_title')}</span>
        </div>

        <div className="senior-lang-and-home">
          {/* Direct Mode Switcher: Voice Flow vs Touch Map */}
          {!triageResult && (
            <button
              type="button"
              onClick={() => {
                const nextMode = activeMode === 'voice' ? 'bodymap' : 'voice';
                setActiveMode(nextMode);
                soundManager.playTone('click');
              }}
              className="btn-senior-mode-toggle"
              title="Switch Mode"
            >
              {activeMode === 'voice' ? <Activity size={18} /> : <Volume2 size={18} />}
              <span>
                {activeMode === 'voice'
                  ? (lang === 'ta' ? 'தொடுதல் வரைபடம்' : 'Touch Map')
                  : (lang === 'ta' ? 'குரல் முறை' : 'Voice Flow')}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleLanguageToggle}
            className="btn-senior-lang"
            title="Switch Language / மொழி மாற்றுக"
          >
            <Globe size={18} />
            <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-senior-home"
            title="Go to main dashboard"
          >
            <Home size={18} />
          </button>
        </div>
      </div>

      <div className="senior-main-container">
        {/* --- TRIAGE RESULT ANNOUNCEMENT CARD --- */}
        {triageResult ? (
          <div className={`senior-result-billboard level-${triageResult.triageLevel.toLowerCase()}`}>
            <div className="billboard-top-icon">
              {triageResult.triageLevel === 'EMERGENCY' ? (
                <AlertTriangle size={72} className="alert-bounce text-red-600" />
              ) : triageResult.triageLevel === 'URGENT' ? (
                <AlertTriangle size={72} className="text-amber-500" />
              ) : (
                <CheckCircle size={72} className="text-emerald-500" />
              )}
            </div>

            <div className="billboard-badge">
              {triageResult.triageLevel === 'EMERGENCY'
                ? t('level_emergency')
                : triageResult.triageLevel === 'URGENT'
                ? t('level_urgent')
                : t('level_non_urgent')}
            </div>

            <h2 className="billboard-heading">{t('senior_result_title')}</h2>

            <p className="billboard-advice-text">
              {lang === 'ta'
                ? triageResult.recommendationTa
                : triageResult.recommendationEn}
            </p>

            {/* Action buttons */}
            <div className="billboard-action-row">
              {false && triageResult.triageLevel === 'EMERGENCY' && (
                <a
                  href="tel:108"
                  className="btn-billboard-call-108"
                >
                  <Phone size={32} />
                  <span>{t('senior_call_108')}</span>
                </a>
              )}

              <button
                type="button"
                onClick={() =>
                  soundManager.playTriageAlert(triageResult.triageLevel, lang)
                }
                className="btn-billboard-repeat"
              >
                <Volume2 size={28} />
                <span>{t('senior_repeat_audio')}</span>
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="btn-billboard-restart"
              >
                <RotateCcw size={24} />
                <span>{t('senior_restart')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* --- ACTIVE TRIAGE WORKFLOW --- */
          <div className="senior-workflow-container">
            {activeMode === 'voice' ? (
              <SeniorVoiceWizard
                symptoms={symptoms}
                onSymptomChange={handleSymptomChange}
                onFinishEvaluation={handleFinishEvaluation}
                onEmergencySOS={handleEmergencySOS}
              />
            ) : (
              <div>
                <SeniorBodyMap
                  selectedSymptoms={symptoms}
                  onSelectSymptom={handleSymptomChange}
                />

                <div className="bodymap-finish-bar">
                  <button
                    type="button"
                    onClick={handleFinishEvaluation}
                    className="btn-bodymap-eval-now"
                  >
                    <Sparkles size={28} />
                    <span>{t('senior_btn_finish')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emergency SOS Modal */}
      {false && showEmergencyModal && (
        <div className="senior-emergency-takeover">
          <div className="sos-modal-card">
            <div className="sos-modal-icon">
              <PhoneCall size={64} className="animate-bounce" />
            </div>
            <h2 className="sos-modal-title">
              {lang === 'ta' ? 'அவசர சிகிச்சை 108' : 'Emergency 108 Ambulance'}
            </h2>
            <p className="sos-modal-desc">
              {lang === 'ta'
                ? 'உடனடியாக இலவச அவசர ஊர்தி (108) அழைக்க கீழே உள்ள பொத்தானை அழுத்தவும்.'
                : 'Tap below to immediately dial free emergency ambulance 108.'}
            </p>

            <a href="tel:108" className="btn-call-108-giant">
              <Phone size={36} />
              <span>108 CALL NOW</span>
            </a>

            <button
              type="button"
              onClick={() => setShowEmergencyModal(false)}
              className="btn-close-sos"
            >
              {lang === 'ta' ? 'மூடுக' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

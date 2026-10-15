import React, { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { soundManager } from '../../audio/soundManager';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  PhoneCall,
  Save,
  RotateCcw,
  Volume2
} from 'lucide-react';

export function TriageResultModal({ result, patient, onSave, onCancel, isSaving }) {
  const { lang, t } = useLanguage();
  const { triageLevel, redFlagsDetailed = [], recommendationEn, recommendationTa } = result;

  useEffect(() => {
    // Automatically play alert sound on result modal appearance
    soundManager.playTriageAlert(triageLevel, lang);

    return () => {
      soundManager.stopAll();
    };
  }, [triageLevel, lang]);

  const isEmergency = triageLevel === 'EMERGENCY';
  const isUrgent = triageLevel === 'URGENT';

  const themeClass = isEmergency
    ? 'result-modal-emergency'
    : isUrgent
    ? 'result-modal-urgent'
    : 'result-modal-non-urgent';

  const titleText = isEmergency
    ? (lang === 'ta' ? 'அவசரம் (EMERGENCY)' : 'EMERGENCY')
    : isUrgent
    ? (lang === 'ta' ? 'அவசரக் கவனிப்பு (URGENT)' : 'URGENT')
    : (lang === 'ta' ? 'வழக்கமானது (NON-URGENT)' : 'NON-URGENT');

  const recommendation = lang === 'ta' ? recommendationTa : recommendationEn;

  return (
    <div className={`triage-modal-backdrop ${isEmergency ? 'emergency-takeover' : ''}`}>
      <div className={`triage-result-card ${themeClass}`}>
        {/* Top Header Badge */}
        <div className="result-header">
          <div className="result-icon-container">
            {isEmergency ? (
              <AlertOctagon size={64} className="pulse-danger" />
            ) : isUrgent ? (
              <AlertTriangle size={64} className="pulse-warning" />
            ) : (
              <CheckCircle size={64} className="pulse-success" />
            )}
          </div>

          <h2 className="result-level-title">{titleText}</h2>

          <p className="result-patient-ref">
            {lang === 'ta' ? 'நோயாளி' : 'Patient'}: <strong>{patient?.name}</strong> ({patient?.patientId})
          </p>

          <button
            type="button"
            onClick={() => soundManager.playTriageAlert(triageLevel, lang)}
            className="btn-replay-audio"
            title="Replay Voice Guidance"
          >
            <Volume2 size={20} />
            <span>{lang === 'ta' ? 'வழிகாட்டலை மீண்டும் கேள்' : 'Replay Voice Guidance'}</span>
          </button>
        </div>

        {/* Action Callout (especially for Emergency 108) */}
        {isEmergency && (
          <div className="emergency-callout-banner">
            <div className="callout-icon">🚨</div>
            <div className="callout-body">
              <h3 className="callout-title">
                {lang === 'ta' ? 'உடனடியாக 108 ஆம்புலன்ஸை அழைக்கவும்!' : 'CALL 108 AMBULANCE IMMEDIATELY!'}
              </h3>
              <p className="callout-subtitle">
                {lang === 'ta'
                  ? 'நோயாளிக்கு உடனடியாக மருத்துவமனை அவசர சிகிச்சை தேவைப்படுகிறது.'
                  : 'Patient requires urgent medical hospital resuscitation.'}
              </p>
            </div>
            <a href="tel:108" className="btn-call-ambulance">
              <PhoneCall size={22} />
              <span>{lang === 'ta' ? '108 அழைக்க' : 'CALL 108'}</span>
            </a>
          </div>
        )}

        {/* Main Recommendation */}
        <div className="result-section recommendation-box">
          <h4 className="section-label">{t('result_recommendations')}</h4>
          <p className="recommendation-text">{recommendation}</p>
        </div>

        {/* Red Flags / Clinical Triggers */}
        {redFlagsDetailed && redFlagsDetailed.length > 0 && (
          <div className="result-section flags-box">
            <h4 className="section-label">{t('result_red_flags')}</h4>
            <ul className="flags-list">
              {redFlagsDetailed.map((flag, idx) => (
                <li key={idx} className="flag-item">
                  <span className="flag-bullet">⚠️</span>
                  <span className="flag-text">{lang === 'ta' ? (flag.ta || flag.en) : flag.en}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Medical disclaimer note */}
        <p className="modal-disclaimer-text">
          {t('medical_disclaimer')}
        </p>

        {/* Action Controls */}
        <div className="modal-actions-row">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="btn-modal-back"
          >
            <RotateCcw size={18} />
            <span>{lang === 'ta' ? 'மீண்டும் திருத்துக' : 'Edit Assessment'}</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className={`btn-modal-save ${themeClass}`}
          >
            <Save size={18} />
            <span>{isSaving ? t('btn_saving') : t('btn_save')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

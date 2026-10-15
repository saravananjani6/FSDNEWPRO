import React from 'react';
import { AudioSpeakerButton } from '../common/AudioSpeakerButton';
import { useLanguage } from '../../context/LanguageContext';
import {
  Thermometer,
  Wind,
  HeartCrack,
  Activity,
  AlertCircle,
  Skull,
  UserX,
  Stethoscope,
  Droplets,
  AlertTriangle
} from 'lucide-react';

// Map symptom keys to visual pictograms
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

export function SymptomCard({
  symptomKey,
  soundKey,
  title,
  question,
  value,
  onChange,
  isEmergencyTrigger = false
}) {
  const { lang, t } = useLanguage();
  const IconComponent = ICON_MAP[symptomKey] || Stethoscope;

  return (
    <div
      className={`symptom-card ${value ? 'is-selected' : ''} ${
        isEmergencyTrigger && value ? 'emergency-highlight' : ''
      }`}
    >
      <div className="symptom-card-header">
        <div className={`pictogram-bubble ${value ? 'active' : ''} ${isEmergencyTrigger ? 'danger' : ''}`}>
          <IconComponent size={32} />
        </div>

        <div className="symptom-text-block">
          <h3 className="symptom-title">{title}</h3>
          <p className="symptom-question">{question}</p>
        </div>

        {/* Audio speaker for voice assistance without internet */}
        <AudioSpeakerButton
          soundKey={soundKey || symptomKey}
          spokenText={question}
          size="large"
        />
      </div>

      {/* Low-Literacy Giant YES / NO buttons */}
      <div className="symptom-choice-buttons">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`choice-btn yes ${value === true ? 'active' : ''}`}
          aria-pressed={value === true}
        >
          <span className="choice-icon">👍</span>
          <span className="choice-label">{t('btn_yes')}</span>
        </button>

        <button
          type="button"
          onClick={() => onChange(false)}
          className={`choice-btn no ${value === false ? 'active' : ''}`}
          aria-pressed={value === false}
        >
          <span className="choice-icon">👎</span>
          <span className="choice-label">{t('btn_no')}</span>
        </button>
      </div>
    </div>
  );
}

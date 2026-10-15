import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { soundManager } from '../../audio/soundManager';
import {
  Activity,
  HeartCrack,
  Wind,
  AlertCircle,
  Droplets,
  AlertTriangle,
  UserX,
  Volume2,
  CheckCircle2
} from 'lucide-react';

export function SeniorBodyMap({ onSelectSymptom, selectedSymptoms = {} }) {
  const { lang, t } = useLanguage();
  const [activeZone, setActiveZone] = useState('chest');

  const ZONES = [
    {
      id: 'head',
      labelTa: 'தலை & கண்',
      labelEn: 'Head & Eyes',
      icon: Activity,
      symptoms: [
        {
          key: 'headache',
          soundKey: 'headache',
          titleTa: 'கடுமையான தலைவலி',
          titleEn: 'Severe Headache',
          qTa: 'உங்களுக்கு தலை வலிக்கிறதா?',
          qEn: 'Do you have a severe headache?'
        },
        {
          key: 'dizziness',
          soundKey: 'dizziness',
          titleTa: 'மயக்கம் / தலைசுற்றல்',
          titleEn: 'Dizziness / Fainting',
          qTa: 'தலைசுற்றல் அல்லது மயக்கம் வருகிறதா?',
          qEn: 'Are you feeling dizzy or faint?'
        },
        {
          key: 'unconscious',
          soundKey: 'unconscious',
          titleTa: 'நினைவிழந்த நிலை',
          titleEn: 'Fainting / Unconscious',
          qTa: 'நோயாளி பேசாமல் மயங்கி விட்டாரா?',
          qEn: 'Has the person become unconscious?'
        }
      ]
    },
    {
      id: 'chest',
      labelTa: 'மார்பு & மூச்சு',
      labelEn: 'Chest & Breathing',
      icon: HeartCrack,
      symptoms: [
        {
          key: 'chestPain',
          soundKey: 'chest_pain',
          titleTa: 'மார்பு வலி / அடைப்பு',
          titleEn: 'Chest Pain or Pressure',
          qTa: 'நெஞ்சில் பாரமாக வலி அல்லது அழுத்தம் உள்ளதா?',
          qEn: 'Do you feel heavy chest pain or pressure?'
        },
        {
          key: 'breathingDifficulty',
          soundKey: 'breathing',
          titleTa: 'மூச்சு விடுவதில் சிரமம்',
          titleEn: 'Difficulty Breathing',
          qTa: 'மூச்சு வாங்குவதில் அதிக சிரமம் உள்ளதா?',
          qEn: 'Are you struggling to breathe?'
        },
        {
          key: 'cough',
          soundKey: 'cough',
          titleTa: 'இருமல் / சளி',
          titleEn: 'Cough / Phlegm',
          qTa: 'தொடர்ந்து இருமல் அல்லது தொண்டை வலி உள்ளதா?',
          qEn: 'Do you have persistent cough?'
        }
      ]
    },
    {
      id: 'stomach',
      labelTa: 'வயிறு & வாந்தி',
      labelEn: 'Stomach & Digestion',
      icon: AlertCircle,
      symptoms: [
        {
          key: 'abdominalPain',
          soundKey: 'abdominal_pain',
          titleTa: 'கடுமையான வயிற்று வலி',
          titleEn: 'Severe Stomach Ache',
          qTa: 'வயிற்றில் கடுமையான வலி உள்ளதா?',
          qEn: 'Do you feel sharp stomach pain?'
        },
        {
          key: 'vomiting',
          soundKey: 'vomiting',
          titleTa: 'தொடர் வாந்தி',
          titleEn: 'Frequent Vomiting',
          qTa: 'தண்ணீர் குடித்தாலும் வாந்தி வருகிறதா?',
          qEn: 'Are you vomiting repeatedly?'
        },
        {
          key: 'diarrhea',
          soundKey: 'diarrhea',
          titleTa: 'வயிற்றுப்போக்கு / பேதி',
          titleEn: 'Diarrhea / Loose Stools',
          qTa: 'அடிக்கடி பேதி அல்லது வயிற்றுப்போக்கு உள்ளதா?',
          qEn: 'Do you have loose motion or diarrhea?'
        }
      ]
    },
    {
      id: 'limbs',
      labelTa: 'காயம் & இரத்தப்போக்கு',
      labelEn: 'Injuries & Limbs',
      icon: Droplets,
      symptoms: [
        {
          key: 'injury',
          soundKey: 'injury',
          titleTa: 'விபத்து அல்லது அடிபட்ட காயம்',
          titleEn: 'Physical Injury / Fall',
          qTa: 'கீழே விழுந்ததாலோ விபத்தாலோ காயம் ஏற்பட்டுள்ளதா?',
          qEn: 'Has there been a fall or physical injury?'
        },
        {
          key: 'severeBleeding',
          soundKey: 'severe_bleeding',
          titleTa: 'அதிக இரத்தப்போக்கு',
          titleEn: 'Heavy Bleeding',
          qTa: 'காயத்தில் இருந்து அதிக இரத்தம் கொட்டுகிறதா?',
          qEn: 'Is there heavy bleeding that will not stop?'
        },
        {
          key: 'fever',
          soundKey: 'fever',
          titleTa: 'உடல் சூடு / காய்ச்சல்',
          titleEn: 'Body Heat / Fever',
          qTa: 'உடல் கொதிக்கிறதா அல்லது காய்ச்சல் அடிக்கிறதா?',
          qEn: 'Does the body feel very hot with fever?'
        }
      ]
    }
  ];

  const currentZoneData = ZONES.find((z) => z.id === activeZone) || ZONES[1];

  const handleZoneClick = (zoneId) => {
    setActiveZone(zoneId);
    soundManager.playTone('click');
    const z = ZONES.find((item) => item.id === zoneId);
    if (z) {
      const voiceText =
        lang === 'ta'
          ? `${z.labelTa} பகுதியை தொட்டுள்ளீர்கள். கீழ் உள்ள கேள்விகளை கவனியுங்கள்.`
          : `You selected ${z.labelEn}. Please check the questions below.`;
      soundManager.speakText(voiceText, lang);
    }
  };

  const handleToggleSymptom = (symptom, value) => {
    soundManager.playTone(value ? 'success' : 'click');
    onSelectSymptom(symptom.key, value);
    soundManager.playClip(value ? 'senior_yes_registered' : 'senior_no_registered', lang);
  };

  return (
    <div className="senior-bodymap-container">
      <div
        className="bodymap-instruction-banner"
        onClick={() => soundManager.playClip('senior_bodymap_intro', lang)}
        style={{ cursor: 'pointer' }}
        title={t('senior_repeat_audio')}
      >
        <Volume2 size={24} className="banner-speaker-icon" />
        <p className="bodymap-instruction-text">
          {lang === 'ta'
            ? 'தாத்தா/பாட்டி: உடலில் வலி உள்ள இடத்தை தொடுங்கள்! (கேட்க இங்கே தொடவும்)'
            : 'Touch where you feel pain! (Tap to hear instructions)'}
        </p>
      </div>

      <div className="bodymap-interactive-layout">
        {/* Visual Anatomical Silhouette with Hotspots */}
        <div className="bodymap-figure-card">
          <div className="bodymap-figure-wrapper">
            <svg
              viewBox="0 0 200 380"
              className="bodymap-svg"
              aria-label="Human body map for selecting pain areas"
            >
              {/* Silhouette Outline */}
              <defs>
                <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(239, 68, 68, 0.8)" />
                  <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
                </radialGradient>
              </defs>

              {/* Head */}
              <circle
                cx="100"
                cy="42"
                r="30"
                className={`body-part head ${activeZone === 'head' ? 'is-active' : ''}`}
                onClick={() => handleZoneClick('head')}
              />

              {/* Neck & Shoulders */}
              <path
                d="M 85 70 Q 100 75 115 70 L 140 85 L 155 130 L 142 135 L 130 98 L 130 150 L 70 150 L 70 98 L 58 135 L 45 130 L 60 85 Z"
                className={`body-part chest ${activeZone === 'chest' ? 'is-active' : ''}`}
                onClick={() => handleZoneClick('chest')}
              />

              {/* Torso / Abdomen */}
              <path
                d="M 70 150 L 130 150 L 126 215 L 74 215 Z"
                className={`body-part stomach ${activeZone === 'stomach' ? 'is-active' : ''}`}
                onClick={() => handleZoneClick('stomach')}
              />

              {/* Legs / Limbs */}
              <path
                d="M 74 215 L 96 215 L 94 330 L 80 365 L 68 365 L 74 320 L 70 215 Z"
                className={`body-part limbs ${activeZone === 'limbs' ? 'is-active' : ''}`}
                onClick={() => handleZoneClick('limbs')}
              />
              <path
                d="M 104 215 L 126 215 L 130 215 L 126 320 L 132 365 L 120 365 L 106 330 Z"
                className={`body-part limbs ${activeZone === 'limbs' ? 'is-active' : ''}`}
                onClick={() => handleZoneClick('limbs')}
              />

              {/* Interactive Target Circles */}
              {/* Head Target */}
              <g
                className="target-group"
                onClick={() => handleZoneClick('head')}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="100" cy="42" r="18" className="target-pulse" />
                <circle
                  cx="100"
                  cy="42"
                  r="12"
                  className={`target-center ${activeZone === 'head' ? 'selected' : ''}`}
                />
                <text x="100" y="46" textAnchor="middle" className="target-text">
                  1
                </text>
              </g>

              {/* Chest Target */}
              <g
                className="target-group"
                onClick={() => handleZoneClick('chest')}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="100" cy="115" r="22" className="target-pulse" />
                <circle
                  cx="100"
                  cy="115"
                  r="15"
                  className={`target-center ${activeZone === 'chest' ? 'selected' : ''}`}
                />
                <text x="100" y="120" textAnchor="middle" className="target-text">
                  2
                </text>
              </g>

              {/* Stomach Target */}
              <g
                className="target-group"
                onClick={() => handleZoneClick('stomach')}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="100" cy="180" r="20" className="target-pulse" />
                <circle
                  cx="100"
                  cy="180"
                  r="14"
                  className={`target-center ${activeZone === 'stomach' ? 'selected' : ''}`}
                />
                <text x="100" y="185" textAnchor="middle" className="target-text">
                  3
                </text>
              </g>

              {/* Limbs / Legs Target */}
              <g
                className="target-group"
                onClick={() => handleZoneClick('limbs')}
                style={{ cursor: 'pointer' }}
              >
                <circle cx="100" cy="275" r="22" className="target-pulse" />
                <circle
                  cx="100"
                  cy="275"
                  r="15"
                  className={`target-center ${activeZone === 'limbs' ? 'selected' : ''}`}
                />
                <text x="100" y="280" textAnchor="middle" className="target-text">
                  4
                </text>
              </g>
            </svg>
          </div>

          {/* Quick Zone Selector Buttons for easier touch */}
          <div className="zone-selector-pills">
            {ZONES.map((zone) => {
              const ZoneIcon = zone.icon;
              const isSelected = activeZone === zone.id;
              return (
                <button
                  key={zone.id}
                  type="button"
                  onClick={() => handleZoneClick(zone.id)}
                  className={`zone-pill-btn ${isSelected ? 'active' : ''}`}
                >
                  <ZoneIcon size={20} />
                  <span>{lang === 'ta' ? zone.labelTa : zone.labelEn}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Zone's Questions & Giant YES / NO buttons */}
        <div className="bodymap-questions-column">
          <div className="zone-active-heading">
            <currentZoneData.icon size={28} className="zone-heading-icon" />
            <div>
              <h2 className="zone-heading-title">
                {lang === 'ta' ? currentZoneData.labelTa : currentZoneData.labelEn}
              </h2>
              <p className="zone-heading-sub">
                {lang === 'ta' ? 'கீழே உள்ள கேள்விகளுக்கு பதிலளிக்கவும்' : 'Answer the questions below'}
              </p>
            </div>
          </div>

          <div className="zone-symptoms-list">
            {currentZoneData.symptoms.map((symptom) => {
              const isYes = selectedSymptoms[symptom.key] === true;
              const isNo = selectedSymptoms[symptom.key] === false;

              return (
                <div
                  key={symptom.key}
                  className={`senior-question-card ${isYes ? 'answered-yes' : ''} ${
                    isNo ? 'answered-no' : ''
                  }`}
                >
                  <div className="senior-question-top">
                    <div className="question-title-group">
                      <h3 className="senior-symptom-title">
                        {lang === 'ta' ? symptom.titleTa : symptom.titleEn}
                      </h3>
                      <p className="senior-spoken-q">
                        {lang === 'ta' ? symptom.qTa : symptom.qEn}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        soundManager.playQuestionAudio(
                          symptom.soundKey,
                          lang,
                          lang === 'ta' ? symptom.qTa : symptom.qEn
                        )
                      }
                      className="btn-senior-speak-single"
                      title={t('senior_repeat_audio')}
                    >
                      <Volume2 size={24} />
                    </button>
                  </div>

                  {/* Giant YES / NO Buttons */}
                  <div className="senior-giant-dual-buttons">
                    <button
                      type="button"
                      onClick={() => handleToggleSymptom(symptom, true)}
                      className={`btn-giant-yes ${isYes ? 'active' : ''}`}
                    >
                      <span className="giant-emoji">👍</span>
                      <span className="giant-text">{t('btn_yes')}</span>
                      {isYes && <CheckCircle2 size={24} className="giant-check" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSymptom(symptom, false)}
                      className={`btn-giant-no ${isNo ? 'active' : ''}`}
                    >
                      <span className="giant-emoji">👎</span>
                      <span className="giant-text">{t('btn_no')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

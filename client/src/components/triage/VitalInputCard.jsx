import React from 'react';
import { Thermometer, Heart, Activity, Wind, Gauge } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export function VitalInputCard({
  vitalKey,
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  normalRangeText,
  onChange,
  warningCheck = null
}) {
  const { lang } = useLanguage();

  const getIcon = () => {
    switch (vitalKey) {
      case 'temperature':
        return <Thermometer size={24} />;
      case 'heartRate':
        return <Heart size={24} />;
      case 'spO2':
        return <Activity size={24} />;
      case 'respiratoryRate':
        return <Wind size={24} />;
      default:
        return <Gauge size={24} />;
    }
  };

  const status = warningCheck ? warningCheck(value) : 'normal';

  const handleIncrement = () => {
    const current = Number(value) || min || 0;
    const next = Math.min(max || 999, Math.round((current + step) * 10) / 10);
    onChange(next);
  };

  const handleDecrement = () => {
    const current = Number(value) || min || 0;
    const prev = Math.max(min || 0, Math.round((current - step) * 10) / 10);
    onChange(prev);
  };

  return (
    <div className={`vital-card status-${status}`}>
      <div className="vital-card-header">
        <div className={`vital-icon-wrap ${status}`}>{getIcon()}</div>
        <div className="vital-title-wrap">
          <h4 className="vital-title">{label}</h4>
          <span className="vital-range-hint">
            {lang === 'ta' ? `சாதாரண அளவு: ${normalRangeText}` : `Normal: ${normalRangeText}`}
          </span>
        </div>
      </div>

      <div className="vital-input-control">
        <button
          type="button"
          onClick={handleDecrement}
          className="btn-stepper minus"
          aria-label="Decrease value"
        >
          -
        </button>

        <div className="vital-value-display">
          <input
            type="number"
            value={value !== null && value !== undefined ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder="--"
            min={min}
            max={max}
            step={step}
            className="vital-number-input"
          />
          <span className="vital-unit-label">{unit}</span>
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          className="btn-stepper plus"
          aria-label="Increase value"
        >
          +
        </button>
      </div>

      {status === 'emergency' && (
        <div className="vital-alert-pill danger">
          🔴 {lang === 'ta' ? 'ஆபத்தான அளவு!' : 'Critical Danger!'}
        </div>
      )}
      {status === 'urgent' && (
        <div className="vital-alert-pill warning">
          🟠 {lang === 'ta' ? 'கவனிக்கப்பட வேண்டிய அளவு' : 'Elevated / Abnormal'}
        </div>
      )}
    </div>
  );
}

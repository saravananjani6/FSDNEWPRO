import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldAlert } from 'lucide-react';

export function DisclaimerBanner() {
  const { t } = useLanguage();

  return (
    <div className="medical-disclaimer-card" role="note">
      <ShieldAlert size={20} className="disclaimer-icon" />
      <p className="disclaimer-text">{t('medical_disclaimer')}</p>
    </div>
  );
}

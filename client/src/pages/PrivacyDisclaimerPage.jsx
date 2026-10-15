import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, AlertTriangle, Lock, Award, HeartPulse } from 'lucide-react';

export function PrivacyDisclaimerPage() {
  const { lang, t } = useLanguage();

  return (
    <div className="privacy-page-container">
      <div className="privacy-card-shell">
        <div className="privacy-header">
          <HeartPulse size={36} className="text-primary" />
          <h1>{lang === 'ta' ? 'திட்ட அறிவிப்பு & தரவு பாதுகாப்பு கொள்கை' : 'Project Prototype & Privacy Notice'}</h1>
        </div>

        <div className="privacy-alert-callout">
          <AlertTriangle size={24} className="text-amber-500" />
          <div>
            <h3>
              {lang === 'ta'
                ? 'மருத்துவ முடிவு வழிகாட்டி மாதிரி அறிவிப்பு'
                : 'Healthcare Decision-Support Prototype Notice'}
            </h3>
            <p>{t('medical_disclaimer')}</p>
          </div>
        </div>

        <div className="privacy-section">
          <h3>
            <ShieldCheck size={20} className="text-emerald-500" />
            <span>{lang === 'ta' ? 'நோயாளி தரவு பாதுகாப்பு & தனியுரிமை' : 'Rural Patient Data Privacy'}</span>
          </h3>
          <p>
            {lang === 'ta'
              ? 'நோயாளிகளின் மருத்துவ தகவல்கள் இந்த உலாவியின் உள்ளூர் IndexedDB தரவுத்தளத்தில் மட்டுமே சேமிக்கப்படுகிறது. இணையம் இல்லாத போது வெளிப்புறத்திற்கு எந்த தகவலும் அனுப்பப்படுவதில்லை. இணையம் இருக்கும் போது குறியாக்கப்பட்ட REST API மூலம் மத்திய ஆரம்ப சுகாதார நிலைய சேவையகத்திற்கு மட்டுமே அனுப்பப்படுகிறது.'
              : 'All patient health metrics and identification tokens are stored strictly within the client device browser IndexedDB sandbox when in the field. When an authorized synchronization occurs, transmission takes place over encrypted REST channels.'}
          </p>
        </div>

        <div className="privacy-section">
          <h3>
            <Lock size={20} className="text-sky-500" />
            <span>{lang === 'ta' ? 'அணுகல் கட்டுப்பாடு' : 'Role-Based Authorization'}</span>
          </h3>
          <p>
            {lang === 'ta'
              ? 'ஆஷா பணியாளர்கள் மட்டுமே களத்தில் தகவல்களை உள்ளிடவும் மதிப்பிடவும் முடியும். மருத்துவர்கள் நோயாளிகளின் முந்தைய வரலாற்றை மேற்பார்வையிடலாம். நிர்வாகிகளுக்கு மட்டுமே அமைப்பு மேலாண்மை அனுமதி உள்ளது.'
              : 'Community healthcare workers register and perform triage. Physicians review clinical referrals and history timelines. Administrators audit logs and resolve sync conflicts.'}
          </p>
        </div>

        <div className="privacy-section">
          <h3>
            <Award size={20} className="text-indigo-500" />
            <span>{lang === 'ta' ? 'கல்வி மற்றும் ஆராய்ச்சி நோக்கம்' : 'Academic & Viva Demonstration Scope'}</span>
          </h3>
          <p>
            {lang === 'ta'
              ? 'இத்திட்டம் கிராமப்புற சமூகங்களின் குறைந்த இணைய வசதியிலும், படிக்க சிரமப்படும் மக்களுக்கும் குரல் வழிகாட்டல் மற்றும் படங்களுடன் மருத்துவ வழிகாட்டலை வழங்கும் MERN + PWA தொழில்நுட்ப மாதிரியாகும்.'
              : 'Built specifically for rural and low-connectivity environments: offline-first with IndexedDB, bilingual (English & Tamil), voice-assisted, low-literacy pictograms, incremental synchronization, and emergency 108 referral workflows.'}
          </p>
        </div>
      </div>
    </div>
  );
}

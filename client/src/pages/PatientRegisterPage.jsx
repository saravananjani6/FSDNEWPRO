import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientRepository } from '../database/patientRepository';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AudioSpeakerButton } from '../components/common/AudioSpeakerButton';
import { SpeechRecognitionButton } from '../components/common/SpeechRecognitionButton';
import {
  UserPlus,
  Save,
  RotateCcw,
  Stethoscope,
  CheckCircle,
  User,
  Calendar,
  MapPin,
  Phone,
  Shield
} from 'lucide-react';

export function PatientRegisterPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'female',
    village: 'Thiruvalangadu',
    phone: '',
    emergencyContact: '',
    address: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.age || !formData.village.trim()) {
      alert(lang === 'ta' ? 'பெயர், வயது மற்றும் ஊர் ஆகியவற்றை பூர்த்தி செய்யவும்.' : 'Please fill Name, Age and Village.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await patientRepository.create(formData, user);
      setSuccessResult(created);
    } catch (err) {
      console.error('[Registration Error]', err);
      alert('Error registering patient: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page-container">
      <div className="register-card-shell">
        <div className="register-header">
          <div className="register-header-icon">
            <UserPlus size={28} />
          </div>
          <div>
            <h1 className="register-title">{t('nav_register')}</h1>
            <p className="register-subtitle">
              {lang === 'ta'
                ? 'புதிய கிராம நோயாளி பதிவு (ஆஃப்லைனில் உடனடியாக சேமிக்கப்படும்)'
                : 'New rural patient registration (instant offline storage)'}
            </p>
          </div>
        </div>

        {/* Doctor Role Guidance Banner */}
        {user?.role === 'doctor' && (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              backgroundColor: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              borderRadius: '14px',
              color: '#0369a1',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <strong>{lang === 'ta' ? 'மருத்துவர் குறிப்பு:' : 'Medical Officer Notice:'}</strong>{' '}
              <span>
                {lang === 'ta'
                  ? 'புதிய நோயாளி பதிவு பொதுவாக சுகாதார பணியாளர்களால் செய்யப்படுகிறது. ஏற்கனவே உள்ள நோயாளிகளுக்கு மருத்துவ ஆலோசனை & உதவி வழங்க கோப்பகத்தை பார்வையிடவும்.'
                  : 'Patient registrations are typically handled by Health Workers and Admins. To review existing records and provide clinical assistance, visit the Patient Directory.'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/patients')}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {lang === 'ta' ? 'நோயாளிகள் பட்டியல் →' : 'Patient Directory →'}
            </button>
          </div>
        )}

        {successResult ? (
          <div className="registration-success-card">
            <div className="success-icon-wrap">
              <CheckCircle size={56} className="text-emerald-500" />
            </div>
            <h2 className="success-title">
              {lang === 'ta' ? 'நோயாளி வெற்றிகரமாக பதிவு செய்யப்பட்டார்!' : 'Patient Registered Successfully!'}
            </h2>
            <div className="success-details-pill">
              <span className="pill-id">{successResult.patientId}</span>
              <span className="pill-name">{successResult.name}</span>
            </div>
            <p className="success-offline-note">
              {lang === 'ta'
                ? 'இத்தகவல் உங்கள் சாதனத்தில் பத்திரமாக சேமிக்கப்பட்டுள்ளது. இணையம் வரும்போது தானாக இணைக்கப்படும்.'
                : 'Data is safely stored locally in IndexedDB and queued for sync.'}
            </p>

            <div className="success-action-buttons">
              <button
                type="button"
                onClick={() => navigate(`/triage?patientId=${successResult.patientId}`)}
                className="btn-success-action triage"
              >
                <Stethoscope size={20} />
                <span>{t('btn_start_triage')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSuccessResult(null);
                  setFormData({
                    name: '',
                    age: '',
                    gender: 'female',
                    village: 'Thiruvalangadu',
                    phone: '',
                    emergencyContact: '',
                    address: ''
                  });
                }}
                className="btn-success-action another"
              >
                <UserPlus size={20} />
                <span>{lang === 'ta' ? 'மற்றொரு நோயாளி பதிவு' : 'Register Another'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (user && user.role === 'admin') {
                    navigate('/patients');
                  } else {
                    navigate('/my-records');
                  }
                }}
                className="btn-success-action list"
              >
                <span>{user && user.role === 'admin' ? t('nav_patients') : (lang === 'ta' ? 'என் பதிவுகள்' : 'My Records')}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="register-form">
            {/* Patient Name */}
            <div className="form-field-card">
              <div className="field-label-row">
                <label className="field-label">
                  <User size={18} />
                  <span>{t('field_name')} *</span>
                </label>
                <div className="field-assist-tools">
                  <AudioSpeakerButton
                    soundKey="fever"
                    spokenText={lang === 'ta' ? 'நோயாளியின் பெயர் என்ன?' : 'What is the patient name?'}
                    size="small"
                  />
                  <SpeechRecognitionButton
                    onResult={(text) => setFormData((prev) => ({ ...prev, name: text }))}
                  />
                </div>
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'எ.கா: செல்வி மீனாட்சி' : 'e.g. Selvi Meenakshi'}
                required
                className="large-form-input"
              />
            </div>

            {/* Age & Gender Row */}
            <div className="form-fields-row">
              {/* Age */}
              <div className="form-field-card half">
                <div className="field-label-row">
                  <label className="field-label">
                    <Calendar size={18} />
                    <span>{t('field_age')} *</span>
                  </label>
                  <AudioSpeakerButton
                    soundKey="fever"
                    spokenText={lang === 'ta' ? 'நோயாளியின் வயது என்ன?' : 'What is the patient age in years?'}
                    size="small"
                  />
                </div>
                <input
                  type="number"
                  name="age"
                  min="0"
                  max="125"
                  value={formData.age}
                  onChange={handleChange}
                  placeholder="45"
                  required
                  className="large-form-input"
                />
              </div>

              {/* Gender */}
              <div className="form-field-card half">
                <label className="field-label">
                  <span>{t('field_gender')} *</span>
                </label>
                <div className="gender-selector-row">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, gender: 'female' }))}
                    className={`gender-btn ${formData.gender === 'female' ? 'active' : ''}`}
                  >
                    👩 {t('field_gender_female')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, gender: 'male' }))}
                    className={`gender-btn ${formData.gender === 'male' ? 'active' : ''}`}
                  >
                    👨 {t('field_gender_male')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, gender: 'other' }))}
                    className={`gender-btn ${formData.gender === 'other' ? 'active' : ''}`}
                  >
                    👤 {t('field_gender_other')}
                  </button>
                </div>
              </div>
            </div>

            {/* Village */}
            <div className="form-field-card">
              <div className="field-label-row">
                <label className="field-label">
                  <MapPin size={18} />
                  <span>{t('field_village')} *</span>
                </label>
                <SpeechRecognitionButton
                  onResult={(text) => setFormData((prev) => ({ ...prev, village: text }))}
                />
              </div>
              <input
                type="text"
                name="village"
                value={formData.village}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'எ.கா: திருவாலங்காடு' : 'e.g. Thiruvalangadu'}
                required
                className="large-form-input"
              />
            </div>

            {/* Phone Number */}
            <div className="form-field-card">
              <label className="field-label">
                <Phone size={18} />
                <span>{t('field_phone')}</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="9876543210"
                className="large-form-input"
              />
            </div>

            {/* Emergency Contact */}
            <div className="form-field-card">
              <label className="field-label">
                <Shield size={18} />
                <span>{t('field_emergency_contact')}</span>
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'எ.கா: ராமு (கணவர்) - 9876543211' : 'e.g. Ramu (Husband) - 9876543211'}
                className="large-form-input"
              />
            </div>

            {/* Address */}
            <div className="form-field-card">
              <label className="field-label">
                <span>{t('field_address')}</span>
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={lang === 'ta' ? 'தெரு பெயர், கதவு எண்' : 'Street name, door number'}
                className="large-form-input"
              />
            </div>

            {/* Submit and Cancel Buttons */}
            <div className="form-actions-row">
              <button
                type="button"
                onClick={() => navigate('/patients')}
                disabled={isSubmitting}
                className="btn-cancel-action"
              >
                <RotateCcw size={18} />
                <span>{t('btn_cancel')}</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary-action submit-patient"
              >
                <Save size={20} />
                <span>{isSubmitting ? t('btn_saving') : t('btn_save')}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

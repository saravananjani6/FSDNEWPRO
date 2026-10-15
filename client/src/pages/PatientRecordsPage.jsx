import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { patientRepository } from '../database/patientRepository';
import { triageRepository } from '../database/triageRepository';
import { apiRequest } from '../services/api';
import {
  Search,
  User,
  HeartPulse,
  Activity,
  AlertTriangle,
  FileText,
  Calendar,
  Phone,
  MapPin,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';

export function PatientRecordsPage() {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [triageHistory, setTriageHistory] = useState([]);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setErrorMsg('');
    setSearched(true);
    setPatient(null);
    setTriageHistory([]);

    try {
      // 1. First attempt local offline IndexedDB lookup
      let foundPatient = await patientRepository.lookup(query.trim());

      // 2. If not found locally, try server lookup
      if (!foundPatient) {
        try {
          const res = await apiRequest(`/patients/lookup/${encodeURIComponent(query.trim())}`);
          if (res.success && res.data) {
            foundPatient = res.data;
          }
        } catch (serverErr) {
          console.warn('[Lookup] Server lookup fallback:', serverErr.message);
        }
      }

      if (foundPatient) {
        setPatient(foundPatient);

        // Fetch triage history locally first
        let records = await triageRepository.getByPatientId(foundPatient.patientId || foundPatient.localId);

        // If local is empty, try server triage history
        if (!records || records.length === 0) {
          try {
            const histRes = await apiRequest(`/patients/${foundPatient.patientId || foundPatient._id}/triage`);
            if (histRes.success && histRes.data) {
              records = histRes.data;
            }
          } catch (hErr) {
            console.warn('[History] Server history fallback:', hErr.message);
          }
        }

        setTriageHistory(records || []);
      } else {
        setErrorMsg(
          lang === 'ta'
            ? 'இந்த எண் அல்லது அடையாள எண்ணில் நோயாளி விவரங்கள் எதுவும் இல்லை.'
            : 'No patient record found matching that Phone Number or Patient ID.'
        );
      }
    } catch (err) {
      console.error('[Search Error]', err);
      setErrorMsg(err.message || 'Error looking up patient record');
    } finally {
      setLoading(false);
    }
  };

  const getTriageBadge = (level) => {
    switch (level) {
      case 'EMERGENCY':
        return {
          bg: '#fee2e2',
          border: '#f87171',
          text: '#991b1b',
          icon: <ShieldAlert size={16} color="#dc2626" />,
          labelTa: 'அவசரம் (EMERGENCY)',
          labelEn: 'EMERGENCY'
        };
      case 'URGENT':
        return {
          bg: '#fef3c7',
          border: '#fcd34d',
          text: '#92400e',
          icon: <AlertTriangle size={16} color="#d97706" />,
          labelTa: 'அவசரக் கவனிப்பு (URGENT)',
          labelEn: 'URGENT'
        };
      default:
        return {
          bg: '#dcfce7',
          border: '#86efac',
          text: '#166534',
          icon: <CheckCircle2 size={16} color="#16a34a" />,
          labelTa: 'வழக்கமானது (NON-URGENT)',
          labelEn: 'NON-URGENT'
        };
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: '16px', color: '#fff', marginBottom: '12px', boxShadow: '0 8px 16px rgba(2, 132, 199, 0.2)' }}>
          <FileText size={32} />
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
          {lang === 'ta' ? 'நோயாளி மருத்துவ பதிவுகள்' : 'My Health & Triage Records'}
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
          {lang === 'ta'
            ? 'உங்கள் தொலைபேசி எண் அல்லது நோயாளி அடையாள எண் மூலம் முந்தைய பரிசோதனைகளைப் பார்க்கவும்'
            : 'Look up your past symptom assessments and vital signs using Phone or Patient ID'}
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', marginBottom: '28px', maxWidth: '600px', margin: '0 auto 28px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ta' ? 'தொலைபேசி எண் அல்லது ID (எ.கா: 9876543210 / P-10001)' : 'Phone or ID (e.g., 9876543210 or P-10001)'}
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              fontSize: '1rem',
              borderRadius: '12px',
              border: '2px solid #cbd5e1',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <Search size={20} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          style={{
            padding: '14px 24px',
            backgroundColor: '#0284c7',
            color: '#fff',
            fontWeight: 700,
            fontSize: '1rem',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{loading ? (lang === 'ta' ? 'தேடுகிறது...' : 'Searching...') : (lang === 'ta' ? 'தேடுக' : 'Search')}</span>
        </button>
      </form>

      {/* Error / Not found message */}
      {errorMsg && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#991b1b', textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ margin: '0 0 12px 0', fontWeight: 600 }}>{errorMsg}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link
              to="/register"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#0284c7',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              <span>{lang === 'ta' ? 'புதிய பதிவு செய்க' : 'Register as New Patient'}</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/triage"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                backgroundColor: '#10b981',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}
            >
              <span>{lang === 'ta' ? 'சுய பரிசோதனை செய்க' : 'Start Self-Triage'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Patient Profile Card */}
      {patient && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {patient.patientId}
                </span>
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  {patient.gender === 'male' ? (lang === 'ta' ? 'ஆண்' : 'Male') : (lang === 'ta' ? 'பெண்' : 'Female')}, {patient.age} {lang === 'ta' ? 'வயது' : 'Years'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                {patient.name}
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', color: '#64748b', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#0284c7" />
                  {patient.village}
                </span>
                {patient.phone && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={16} color="#0284c7" />
                    {patient.phone}
                  </span>
                )}
                {patient.emergencyContact && (
                  <span style={{ color: '#dc2626' }}>
                    <strong>{lang === 'ta' ? 'அவசர தொடர்பு:' : 'Emergency:'}</strong> {patient.emergencyContact}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Action Button for this patient */}
            <Link
              to={`/triage?patientId=${patient.patientId}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: '#0284c7',
                color: '#fff',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.9rem'
              }}
            >
              <Stethoscope size={18} />
              <span>{lang === 'ta' ? 'புதிய பரிசோதனை செய்க' : 'Start New Assessment'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* Triage Assessment History List */}
      {patient && (
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} color="#0284c7" />
            <span>{lang === 'ta' ? 'முந்தைய பரிசோதனை முடிவுகள்' : 'Previous Triage Assessments'} ({triageHistory.length})</span>
          </h3>

          {triageHistory.length === 0 ? (
            <div style={{ backgroundColor: '#f8fafc', padding: '32px', textAlign: 'center', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', margin: '0 0 12px 0' }}>
                {lang === 'ta' ? 'இன்னும் பரிசோதனைப் பதிவுகள் எதுவும் இல்லை.' : 'No triage assessments recorded yet for this patient.'}
              </p>
              <Link
                to={`/triage?patientId=${patient.patientId}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#0284c7',
                  color: '#fff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <Stethoscope size={18} />
                <span>{lang === 'ta' ? 'முதல் பரிசோதனை தொடங்க' : 'Start First Assessment'}</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {triageHistory.map((rec) => {
                const badge = getTriageBadge(rec.triageLevel);
                return (
                  <div
                    key={rec.recordId || rec.localId}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      padding: '20px',
                      border: `1.5px solid ${badge.border}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, padding: '4px 12px', borderRadius: '999px', fontWeight: 800, fontSize: '0.85rem' }}>
                          {badge.icon}
                          {lang === 'ta' ? badge.labelTa : badge.labelEn}
                        </span>
                        <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
                          {rec.recordId}
                        </span>
                      </div>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        {new Date(rec.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Recommendation Box */}
                    <div style={{ backgroundColor: badge.bg, padding: '12px 16px', borderRadius: '10px', marginBottom: '14px', color: badge.text, fontSize: '0.95rem', fontWeight: 600 }}>
                      {lang === 'ta' ? rec.recommendationTa : rec.recommendationEn}
                    </div>

                    {/* Vitals Summary */}
                    {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                        {rec.vitals.temperature && (
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <span style={{ color: '#64748b', display: 'block' }}>{lang === 'ta' ? 'வெப்பநிலை' : 'Temp'}</span>
                            <strong style={{ color: '#0f172a' }}>{rec.vitals.temperature}°F</strong>
                          </div>
                        )}
                        {rec.vitals.heartRate && (
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <span style={{ color: '#64748b', display: 'block' }}>{lang === 'ta' ? 'நாடித்துடிப்பு' : 'Pulse / HR'}</span>
                            <strong style={{ color: '#0f172a' }}>{rec.vitals.heartRate} bpm</strong>
                          </div>
                        )}
                        {rec.vitals.spO2 && (
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <span style={{ color: '#64748b', display: 'block' }}>{lang === 'ta' ? 'ஆக்சிஜன்' : 'SpO2'}</span>
                            <strong style={{ color: '#0f172a' }}>{rec.vitals.spO2}%</strong>
                          </div>
                        )}
                        {rec.vitals.systolicBP && rec.vitals.diastolicBP && (
                          <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <span style={{ color: '#64748b', display: 'block' }}>{lang === 'ta' ? 'இரத்த அழுத்தம்' : 'Blood Pressure'}</span>
                            <strong style={{ color: '#0f172a' }}>{rec.vitals.systolicBP}/{rec.vitals.diastolicBP}</strong>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Red flags */}
                    {rec.redFlags && rec.redFlags.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#dc2626' }}>{lang === 'ta' ? 'எச்சரிக்கை அறிகுறிகள்:' : 'Red Flag Alerts:'}</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px', color: '#b91c1c', fontSize: '0.85rem' }}>
                          {rec.redFlags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default PatientRecordsPage;

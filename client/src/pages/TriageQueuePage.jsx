import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { triageRepository } from '../database/triageRepository';
import { apiRequest } from '../services/api';
import {
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Search,
  Filter,
  Calendar,
  User,
  HeartPulse,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export function TriageQueuePage() {
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    try {
      // Try fetching from server first
      try {
        const res = await apiRequest('/triage');
        if (res.success && res.data) {
          setRecords(res.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[Queue] Falling back to local triage repository:', err.message);
      }

      // Local fallback
      const local = await triageRepository.getAll();
      setRecords(local || []);
    } catch (err) {
      console.error('[Queue Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (filterLevel !== 'ALL' && r.triageLevel !== filterLevel) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (r.patientName || '').toLowerCase();
      const pid = (r.patientId || '').toLowerCase();
      const rid = (r.recordId || '').toLowerCase();
      return name.includes(q) || pid.includes(q) || rid.includes(q);
    }
    return true;
  });

  const getBadge = (level) => {
    switch (level) {
      case 'EMERGENCY':
        return {
          bg: '#fee2e2',
          border: '#f87171',
          text: '#991b1b',
          icon: <ShieldAlert size={16} color="#dc2626" />,
          label: lang === 'ta' ? 'அவசரம் (EMERGENCY)' : 'EMERGENCY'
        };
      case 'URGENT':
        return {
          bg: '#fef3c7',
          border: '#fcd34d',
          text: '#92400e',
          icon: <AlertTriangle size={16} color="#d97706" />,
          label: lang === 'ta' ? 'அவசரக் கவனிப்பு (URGENT)' : 'URGENT'
        };
      default:
        return {
          bg: '#dcfce7',
          border: '#86efac',
          text: '#166534',
          icon: <CheckCircle2 size={16} color="#16a34a" />,
          label: lang === 'ta' ? 'வழக்கமானது (NON-URGENT)' : 'NON-URGENT'
        };
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={26} color="#0284c7" />
            <span>{lang === 'ta' ? 'நிர்வாகி பரிசோதனை வரிசை' : 'Admin Triage Assessment Queue'}</span>
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            {lang === 'ta' ? 'நோயாளிகளால் சமர்ப்பிக்கப்பட்ட அனைத்து பரிசோதனை பதிவுகளும்' : 'All incoming patient triage assessments and clinical evaluations'}
          </p>
        </div>

        <button
          onClick={loadRecords}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            color: '#334155',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={16} className={loading ? 'spin-icon' : ''} />
          <span>{lang === 'ta' ? 'புதுப்பி' : 'Refresh'}</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'ta' ? 'நோயாளி பெயர், ID அல்லது பதிவு ID தேடுக...' : 'Search by name, patient ID, or record ID...'}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        </div>

        {/* Severity Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['ALL', 'EMERGENCY', 'URGENT', 'NON-URGENT'].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFilterLevel(level)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: filterLevel === level ? '2px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: filterLevel === level ? '#0284c7' : '#ffffff',
                color: filterLevel === level ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              {level === 'ALL'
                ? (lang === 'ta' ? 'அனைத்தும்' : 'All')
                : level}
            </button>
          ))}
        </div>
      </div>

      {/* Record Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          {lang === 'ta' ? 'பதிவுகள் ஏற்றப்படுகின்றன...' : 'Loading triage assessments...'}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div style={{ backgroundColor: '#ffffff', padding: '40px', textAlign: 'center', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', margin: 0, fontWeight: 600 }}>
            {lang === 'ta' ? 'பொருந்தும் பதிவுகள் எதுவும் இல்லை.' : 'No triage records match your filter criteria.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredRecords.map((rec) => {
            const badge = getBadge(rec.triageLevel);
            return (
              <div
                key={rec.recordId || rec.localId}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  padding: '18px',
                  border: `1.5px solid ${badge.border}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: badge.bg, color: badge.text, padding: '3px 10px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem' }}>
                        {badge.icon}
                        {badge.label}
                      </span>
                      <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700 }}>
                        {rec.recordId}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                      {rec.patientName || 'Anonymous / Self-Assessment'}
                    </h3>
                    <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                      {rec.patientId} • {rec.patientGender}, {rec.patientAge} {lang === 'ta' ? 'வயது' : 'Years'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                      <Calendar size={13} />
                      {new Date(rec.createdAt).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                      {isDoctor ? (
                        <Link
                          to={`/patients/${rec.patientId}?action=assist`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.2)'
                          }}
                        >
                          <HeartPulse size={13} />
                          <span>{lang === 'ta' ? 'மருத்துவ உதவி' : 'Assist Patient'}</span>
                        </Link>
                      ) : (
                        <Link
                          to={`/patients/${rec.patientId}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#0284c7',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          <span>{lang === 'ta' ? 'நோயாளி விவரம்' : 'Patient File'}</span>
                          <ExternalLink size={13} />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendation */}
                <div style={{ backgroundColor: badge.bg, padding: '10px 14px', borderRadius: '8px', color: badge.text, fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>
                  {lang === 'ta' ? rec.recommendationTa : rec.recommendationEn}
                </div>

                {/* Vitals */}
                {rec.vitals && Object.keys(rec.vitals).length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#475569' }}>
                    {rec.vitals.temperature && <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>Temp: <strong>{rec.vitals.temperature}°F</strong></span>}
                    {rec.vitals.heartRate && <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>HR: <strong>{rec.vitals.heartRate} bpm</strong></span>}
                    {rec.vitals.spO2 && <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>SpO2: <strong>{rec.vitals.spO2}%</strong></span>}
                    {rec.vitals.systolicBP && <span style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '6px' }}>BP: <strong>{rec.vitals.systolicBP}/{rec.vitals.diastolicBP}</strong></span>}
                  </div>
                )}

                {/* Red Flags if any */}
                {rec.redFlags && rec.redFlags.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', borderLeft: '3px solid #dc2626' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626', display: 'block', marginBottom: '2px' }}>
                      {lang === 'ta' ? 'கண்டறியப்பட்ட அவசரக் குறிகள்:' : 'Identified Red Flags:'}
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.8rem', color: '#991b1b' }}>
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
  );
}
export default TriageQueuePage;

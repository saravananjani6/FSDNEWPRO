import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSync } from '../context/SyncContext';
import { triageRepository } from '../database/triageRepository';
import { patientRepository } from '../database/patientRepository';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import {
  Users,
  Calendar,
  AlertOctagon,
  PlusCircle,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Activity,
  FileText,
  PhoneCall,
  Wifi,
  Sparkles,
  Lock,
  HeartPulse,
  Clock,
  ShieldAlert,
  MapPin,
  Compass
} from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const { pendingCount } = useSync();

  const [metrics, setMetrics] = useState({
    totalPatients: 0,
    totalTriage: 0,
    todayTriage: 0,
    emergencyCount: 0,
    urgentCount: 0,
    nonUrgentCount: 0,
    recentRecords: []
  });

  const loadData = async () => {
    try {
      const local = await triageRepository.getLocalMetrics();
      const patientCount = await patientRepository.count();
      setMetrics({
        ...local,
        totalPatients: patientCount || local.totalPatients
      });
    } catch (err) {
      console.warn('[Dashboard Load Error]', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [pendingCount, user]);

  const isAdmin = user && user.role === 'admin';

  // ==========================================
  // 1. ADMIN DASHBOARD VIEW
  // ==========================================
  if (isAdmin) {
    return (
      <div className="dashboard-container">
        {/* Admin Header */}
        <div className="dashboard-header-row" style={{ alignItems: 'center' }}>
          <div className="welcome-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ backgroundColor: '#0284c7', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 8px', borderRadius: '6px' }}>
                ADMIN
              </span>
              <span style={{ color: '#64748b', fontSize: '0.85rem' }}>System Control Center</span>
            </div>
            <h1 className="dashboard-title">
              {lang === 'ta' ? `வணக்கம், நிர்வாகி (${user.name})` : `Welcome, Administrator (${user.name})`}
            </h1>
            <p className="dashboard-subtitle">
              <Clock size={15} />
              <span>
                {new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </p>
          </div>

          <div className="dashboard-quick-actions">
            <Link to="/queue" className="btn-action-primary start-triage">
              <Activity size={18} />
              <span>{lang === 'ta' ? 'பரிசோதனை வரிசை' : 'Triage Queue'}</span>
            </Link>
            <Link to="/patients" className="btn-action-primary new-patient">
              <Users size={18} />
              <span>{lang === 'ta' ? 'நோயாளி பட்டியல்' : 'All Patients'}</span>
            </Link>
            <Link to="/sync" className="btn-action-senior-pill">
              <ShieldCheck size={18} />
              <span>{lang === 'ta' ? 'இணைப்பு மையம்' : 'Sync Center'}</span>
            </Link>
          </div>
        </div>

        {/* Emergency Alert Banner for Admin if emergency cases present */}
        {metrics.emergencyCount > 0 && (
          <div style={{ backgroundColor: '#fef2f2', border: '1.5px solid #f87171', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={28} color="#dc2626" />
              <div>
                <strong style={{ color: '#991b1b', fontSize: '1rem', display: 'block' }}>
                  {metrics.emergencyCount} {lang === 'ta' ? 'அவசர சிகிச்சை தேவைப்படும் வழக்குகள் உள்ளன!' : 'Active Emergency Triage Cases!'}
                </strong>
                <span style={{ color: '#b91c1c', fontSize: '0.85rem' }}>
                  {lang === 'ta' ? 'உடனடி 108 ஆம்புலன்ஸ் பரிந்துரை மற்றும் மருத்துவக் கவனிப்பு தேவை.' : 'Immediate 108 ambulance transport & emergency doctor care required.'}
                </span>
              </div>
            </div>
            <Link
              to="/queue"
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none'
              }}
            >
              {lang === 'ta' ? 'வழக்குகளைப் பார்க்க' : 'Review Queue'} →
            </Link>
          </div>
        )}

        {/* KPI Metrics Grid */}
        <div className="metrics-grid">
          {/* Total Patients */}
          <div className="metric-card card-patients">
            <div className="metric-card-top">
              <span className="metric-label">{lang === 'ta' ? 'மொத்த நோயாளிகள்' : 'Total Patients'}</span>
              <Users size={20} className="metric-icon" />
            </div>
            <div className="metric-value">{metrics.totalPatients}</div>
            <Link to="/patients" className="metric-sublink">
              <span>{lang === 'ta' ? 'அனைத்து நோயாளிகள்' : 'Manage Directory'}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Total Assessments */}
          <div className="metric-card card-today">
            <div className="metric-card-top">
              <span className="metric-label">{lang === 'ta' ? 'மொத்த பரிசோதனைகள்' : 'Total Triage Records'}</span>
              <Activity size={20} className="metric-icon" />
            </div>
            <div className="metric-value">{metrics.totalTriage}</div>
            <Link to="/queue" className="metric-sublink">
              <span>{lang === 'ta' ? 'வரிசையைப் பார்க்க' : 'View All Assessments'}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Emergency Cases */}
          <div className="metric-card card-emergency">
            <div className="metric-card-top">
              <span className="metric-label">{lang === 'ta' ? 'அவசர நிலைகள் (108)' : 'Emergency Cases'}</span>
              <AlertOctagon size={20} className="metric-icon" />
            </div>
            <div className="metric-value text-emergency">{metrics.emergencyCount}</div>
            <span className="metric-subtext alert-red">
              {lang === 'ta' ? 'உடனடி கவனிப்பு தேவை' : '108 Ambulance referrals'}
            </span>
          </div>
        </div>

        {/* Recent Triage Table for Admin */}
        <div className="dashboard-recent-section">
          <div className="section-header-row">
            <h2 className="section-title">
              {lang === 'ta' ? 'சமீபத்திய பரிசோதனை பதிவுகள்' : 'Recent Triage Assessments'}
            </h2>
            <Link to="/queue" className="view-all-link">
              <span>{lang === 'ta' ? 'முழு வரிசையைப் பார்க்க' : 'View Full Queue'}</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {metrics.recentRecords.length === 0 ? (
            <div className="empty-state-box">
              <p>{lang === 'ta' ? 'மதிப்பீடுகள் எதுவும் பதிவு செய்யப்படவில்லை.' : 'No triage records logged yet.'}</p>
            </div>
          ) : (
            <div className="recent-table-wrapper">
              <table className="recent-records-table">
                <thead>
                  <tr>
                    <th>{lang === 'ta' ? 'மதிப்பீடு எண்' : 'Record ID'}</th>
                    <th>{lang === 'ta' ? 'நோயாளி' : 'Patient'}</th>
                    <th>{lang === 'ta' ? 'முடிவு' : 'Level'}</th>
                    <th>{lang === 'ta' ? 'அளவீடுகள்' : 'Key Vitals'}</th>
                    <th>{lang === 'ta' ? 'நேரம்' : 'Time'}</th>
                    <th>{lang === 'ta' ? 'இணைப்பு' : 'Sync'}</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.recentRecords.map((rec) => (
                    <tr key={rec.localId || rec.recordId}>
                      <td>
                        <span className="record-code">{rec.recordId || 'Draft'}</span>
                      </td>
                      <td>
                        <div className="patient-cell-info">
                          <strong>{rec.patientName}</strong>
                          <span className="cell-sub">{rec.patientId}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`triage-badge ${rec.triageLevel.toLowerCase()}`}>
                          {rec.triageLevel}
                        </span>
                      </td>
                      <td>
                        <div className="vitals-summary-chips">
                          {rec.vitals?.temperature && (
                            <span className="vital-chip">{rec.vitals.temperature}°F</span>
                          )}
                          {rec.vitals?.spO2 && (
                            <span className={`vital-chip ${rec.vitals.spO2 < 90 ? 'danger' : ''}`}>
                              SpO2: {rec.vitals.spO2}%
                            </span>
                          )}
                          {rec.vitals?.heartRate && (
                            <span className="vital-chip">{rec.vitals.heartRate} bpm</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="date-time-label">
                          {new Date(rec.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                          {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td>
                        <span className={`sync-pill ${rec.syncStatus}`}>
                          {rec.syncStatus === 'synced' ? '🟢 Synced' : '🟡 Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <DisclaimerBanner />
      </div>
    );
  }

  // ==========================================
  // 2. PATIENT APP HOME PORTAL
  // ==========================================
  return (
    <div style={{ width: '100%', maxWidth: '1560px', margin: '0 auto' }}>
      {/* Hero Welcome Banner - Expansive & Responsive */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0f766e 100%)',
          borderRadius: '24px',
          padding: 'clamp(24px, 3.5vw, 40px)',
          color: '#ffffff',
          marginBottom: '28px',
          boxShadow: '0 12px 30px -8px rgba(2, 132, 199, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px', alignItems: 'center' }}>
          {/* Left Column: Welcome & Quick Launch Actions */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '14px' }}>
              <HeartPulse size={16} />
              <span>{lang === 'ta' ? 'கிராமப்புற நலவாழ்வு செயலி' : 'Rural Health Decision Support'}</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>100% Offline Ready</span>
            </div>
            <h1 style={{ fontSize: 'clamp(1.9rem, 3.2vw, 2.7rem)', fontWeight: 900, lineHeight: 1.15, margin: '0 0 12px 0', letterSpacing: '-0.02em' }}>
              {lang === 'ta' ? 'விஎம்கேர் நோயாளி பராமரிப்பு' : 'VMcare Health Portal'}
            </h1>
            <p style={{ fontSize: '1.05rem', opacity: 0.95, margin: '0 0 24px 0', lineHeight: 1.5, maxWidth: '640px' }}>
              {lang === 'ta'
                ? 'அறிகுறிகளைச் சரிபார்க்கவும், அவசர நிலைகளை உடனுக்குடன் கண்டறியவும், மற்றும் அருகிலுள்ள ஆரம்ப சுகாதார நிலையங்களுக்கு உடனடி வழிகாட்டல் பெறவும்.'
                : 'Assess symptoms, check vitals, identify emergency red-flags, and receive immediate turn-by-turn guidance to Primary Health Centres.'}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link
                to="/triage"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#0284c7',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                }}
              >
                <Stethoscope size={20} />
                <span>{lang === 'ta' ? 'பரிசோதனை தொடங்குக' : 'Start Symptom Check'}</span>
              </Link>

              <Link
                to="/senior-triage"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  border: '1.5px solid rgba(255,255,255,0.45)',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span style={{ fontSize: '18px' }}>👴👵</span>
                <span>{lang === 'ta' ? 'முதியோர் குரல் முறை' : 'Elderly Voice Mode'}</span>
              </Link>

              <Link
                to="/clinics"
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  padding: '12px 22px',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                <MapPin size={18} />
                <span>{lang === 'ta' ? 'மருத்துவமனை வரைபடம்' : 'Nearest Clinics Map'}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Quick Telehealth & Emergency Overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '18px 22px', border: '1px solid rgba(255,255,255,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {lang === 'ta' ? 'அருகிலுள்ள மருத்துவ மையம்' : 'NEAREST FACILITY'}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: '999px' }}>
                  🟢 1.2 km
                </span>
              </div>
              <strong style={{ fontSize: '1.1rem', display: 'block', lineHeight: 1.3 }}>
                {lang === 'ta' ? 'காவேரி அரசு ஆரம்ப சுகாதார நிலையம் (PHC)' : 'Kaveri Government Primary Health Centre'}
              </strong>
              <span style={{ fontSize: '0.82rem', opacity: 0.9, display: 'block', marginTop: '4px' }}>
                {lang === 'ta' ? '24 மணி நேர அவசர சிகிச்சை & ஆம்புலன்ஸ் தயார்' : '24x7 Emergency, Normal Delivery & Ambulance Stationed'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '14px 18px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <span style={{ fontSize: '0.78rem', opacity: 0.85, display: 'block' }}>
                  {lang === 'ta' ? 'அவசர ஆம்புலன்ஸ்' : 'National Ambulance'}
                </span>
                <strong style={{ fontSize: '1.35rem', display: 'block', color: '#ffffff' }}>
                  108 Toll-free
                </strong>
              </div>

              <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '14px 18px', border: '1px solid rgba(255,255,255,0.2)' }}>
                <span style={{ fontSize: '0.78rem', opacity: 0.85, display: 'block' }}>
                  {lang === 'ta' ? 'சாதன ஆஃப்லைன் சேமிப்பு' : 'Device Offline DB'}
                </span>
                <strong style={{ fontSize: '1.2rem', display: 'block', color: '#ffffff' }}>
                  100% Synced
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 PRIMARY APP ACTIONS GRID — Wide fluid responsive layout */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
          {lang === 'ta' ? 'முக்கிய சுகாதார சேவைகள்' : 'Primary Healthcare Services'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
          {lang === 'ta' ? 'கிராமப்புற மக்களுக்கான உடனடி ஆஃப்லைன் பரிசோதனை & மருத்துவ உதவி' : 'Instant offline clinical triage, maps, and village health directory'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Card 1: Self-Triage */}
        <Link
          to="/triage"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '22px',
            border: '1.5px solid #e2e8f0',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            transition: 'transform 0.15s ease, border-color 0.15s ease'
          }}
        >
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', marginBottom: '14px' }}>
              <Stethoscope size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              {lang === 'ta' ? 'சுய பரிசோதனை' : 'Symptom Triage'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.4, margin: '0 0 16px 0' }}>
              {lang === 'ta'
                ? 'காய்ச்சல், இருமல், நெஞ்சு வலி, மூச்சுத்திணறல் போன்ற அறிகுறிகளைப் பதிவு செய்து அவசர நிலையை அறியவும்.'
                : 'Check symptoms & vital signs to determine triage category: Emergency, Urgent, or Non-Urgent.'}
            </p>
          </div>
          <span style={{ color: '#0284c7', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>{lang === 'ta' ? 'தொடங்குக' : 'Check Now'}</span>
            <ArrowRight size={16} />
          </span>
        </Link>

        {/* Card 2: Senior Voice & Visual Mode */}
        <Link
          to="/senior-triage"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '22px',
            border: '1.5px solid #fde68a',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            background: 'linear-gradient(180deg, #ffffff 0%, #fffbeb 100%)'
          }}
        >
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '14px' }}>
              👴👵
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#92400e', margin: '0 0 6px 0' }}>
              {lang === 'ta' ? 'முதியோர் குரல் முறை' : 'Elderly Voice Mode'}
            </h3>
            <p style={{ color: '#78350f', fontSize: '0.9rem', lineHeight: 1.4, margin: '0 0 16px 0' }}>
              {lang === 'ta'
                ? 'எழுத்தறிவு தேவையில்லை — பெரிய தொடுதல் பொத்தான்கள் மற்றும் தமிழ் குரல் வழிகாட்டல்.'
                : 'Zero-literacy voice questions and high-contrast visual touch cards for seniors.'}
            </p>
          </div>
          <span style={{ color: '#b45309', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>{lang === 'ta' ? 'குரல் முறை திறக்க' : 'Launch Voice Mode'}</span>
            <ArrowRight size={16} />
          </span>
        </Link>

        {/* Card 3: My Health Records */}
        <Link
          to="/my-records"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '22px',
            border: '1.5px solid #e2e8f0',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', marginBottom: '14px' }}>
              <FileText size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              {lang === 'ta' ? 'என் மருத்துவ பதிவுகள்' : 'My Health Records'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.4, margin: '0 0 16px 0' }}>
              {lang === 'ta'
                ? 'உங்கள் தொலைபேசி எண் அல்லது ID கொண்டு முந்தைய பரிசோதனை அறிக்கைகளைப் பார்க்கவும்.'
                : 'Look up previous symptom records, vital signs history, and emergency advice.'}
            </p>
          </div>
          <span style={{ color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>{lang === 'ta' ? 'பதிவுகளைக் காண்க' : 'View Records'}</span>
            <ArrowRight size={16} />
          </span>
        </Link>

        {/* Card 4: Register Patient */}
        <Link
          to="/register"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '22px',
            border: '1.5px solid #e2e8f0',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', marginBottom: '14px' }}>
              <PlusCircle size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              {lang === 'ta' ? 'புதிய நோயாளி பதிவு' : 'Patient Registration'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.4, margin: '0 0 16px 0' }}>
              {lang === 'ta'
                ? 'உங்கள் கிராமம், வயது மற்றும் அவசர தொடர்பு தகவல்களை எதிர்கால பயன்பாட்டிற்குப் பதிவு செய்யவும்.'
                : 'Create a permanent patient profile with contact info and emergency numbers.'}
            </p>
          </div>
          <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>{lang === 'ta' ? 'பதிவு செய்க' : 'Register Profile'}</span>
            <ArrowRight size={16} />
          </span>
        </Link>

        {/* Card 5: Nearest Clinics & Hospitals Map */}
        <Link
          to="/clinics"
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '22px',
            border: '1.5px solid #6ee7b7',
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            background: 'linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%)'
          }}
        >
          <div>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', marginBottom: '14px' }}>
              <MapPin size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46', margin: '0 0 6px 0' }}>
              {lang === 'ta' ? 'அருகிலுள்ள மருத்துவமனைகள் வரைபடம்' : 'Nearest Clinics & Hospitals Map'}
            </h3>
            <p style={{ color: '#047857', fontSize: '0.9rem', lineHeight: 1.4, margin: '0 0 16px 0' }}>
              {lang === 'ta'
                ? 'நேரடி ஜிபிஎஸ் தூரம், ஆரம்ப சுகாதார நிலையங்கள் (PHC), அரசு மருத்துவமனைகள் மற்றும் அவசர வழித்தடம்.'
                : 'Live GPS distance detection to Kaveri PHC, Mullai CHC, and District Hospital with 108 emergency dispatch.'}
            </p>
          </div>
          <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span>{lang === 'ta' ? 'வரைபடத்தில் தேட' : 'Open Hospital Map'}</span>
            <ArrowRight size={16} />
          </span>
        </Link>
      </div>

      {/* Emergency Hotline 108 Card */}
      <div
        style={{
          backgroundColor: '#fef2f2',
          border: '2px solid #f87171',
          borderRadius: '16px',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
            <PhoneCall size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#991b1b', margin: '0 0 4px 0' }}>
              {lang === 'ta' ? 'அவசர சிகிச்சை உதவிக்கு 108 அழைக்கவும்' : 'Dial 108 Emergency Ambulance'}
            </h3>
            <p style={{ color: '#b91c1c', margin: 0, fontSize: '0.9rem' }}>
              {lang === 'ta'
                ? 'தீவிர நெஞ்சு வலி, மூச்சுத் திணறல் அல்லது சுயநினைவற்ற நிலையில் உடனடியாக ஆம்புலன்ஸை அழைக்கவும்.'
                : 'For sudden chest pain, unconsciousness, severe injury, or choking, call 108 immediately.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            to="/clinics"
            style={{
              backgroundColor: '#ffffff',
              color: '#dc2626',
              border: '1.5px solid #dc2626',
              padding: '10px 18px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.9rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <MapPin size={16} />
            <span>{lang === 'ta' ? 'வரைபடம்' : 'Hospitals Map'}</span>
          </Link>
          <a
            href="tel:108"
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              padding: '10px 20px',
              borderRadius: '10px',
              fontWeight: 800,
              fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
            }}
          >
            <PhoneCall size={18} />
            <span>{lang === 'ta' ? '108 அழைக்க' : 'Call 108 Now'}</span>
          </a>
        </div>
      </div>

      {/* Footer Admin Link Card */}
      <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.9rem' }}>
          <Lock size={16} />
          <span>{lang === 'ta' ? 'மருத்துவமனை நிர்வாகிகளுக்கான கட்டுப்பாட்டு மையம்' : 'Authorized healthcare management portal'}</span>
        </div>
        <Link
          to="/login"
          style={{
            color: '#0284c7',
            fontWeight: 700,
            fontSize: '0.9rem',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>{lang === 'ta' ? 'நிர்வாகி உள்நுழைவு' : 'Admin Login'}</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      <DisclaimerBanner />
    </div>
  );
}
export default DashboardPage;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { patientRepository } from '../database/patientRepository';
import { triageRepository } from '../database/triageRepository';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Shield,
  Stethoscope,
  ArrowLeft,
  Clock,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Activity,
  Thermometer,
  Wind,
  HeartPulse,
  Pill,
  FileCheck,
  Trash2,
  Send,
  UserCheck,
  Building
} from 'lucide-react';

export function PatientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isWorker = user?.role === 'health_worker';

  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Doctor Assistance Form State
  const [showAssistForm, setShowAssistForm] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [clinicalAction, setClinicalAction] = useState('Prescribed Medications at PHC');
  const [assistSaving, setAssistSaving] = useState(false);
  const [assistSuccess, setAssistSuccess] = useState(false);

  useEffect(() => {
    // If URL has ?action=assist or ?assist=open, open doctor assist form directly
    if (location.search.includes('assist')) {
      setShowAssistForm(true);
    }
  }, [location.search]);

  async function loadPatientAndHistory() {
    setLoading(true);
    try {
      const p = await patientRepository.getById(id);
      if (p) {
        setPatient(p);
        const recs = await triageRepository.getByPatientId(p.patientId);
        setHistory(recs);
      }
    } catch (err) {
      console.warn('[Patient Detail Load Error]', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatientAndHistory();
  }, [id]);

  // Doctor Assistance Submit Handler
  const handleSaveAssistance = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim() && !doctorNotes.trim() && !prescription.trim()) {
      alert(lang === 'ta' ? 'தயவுசெய்து பரிசோதனை குறிப்பு அல்லது மருந்துகளை உள்ளிடவும்.' : 'Please enter clinical notes, diagnosis, or prescription.');
      return;
    }

    setAssistSaving(true);
    try {
      await patientRepository.assistPatient(
        patient.patientId,
        {
          diagnosis: diagnosis.trim(),
          notes: doctorNotes.trim(),
          prescription: prescription.trim(),
          action: clinicalAction,
          referral: clinicalAction.includes('Referral') ? 'Urgent District Hospital' : ''
        },
        user
      );

      setAssistSuccess(true);
      setDiagnosis('');
      setDoctorNotes('');
      setPrescription('');
      await loadPatientAndHistory();
      setTimeout(() => setAssistSuccess(false), 4000);
    } catch (err) {
      alert(err.message || 'Failed to save doctor assistance');
    } finally {
      setAssistSaving(false);
    }
  };

  // Admin-only Delete Handler
  const handleDeletePatient = async () => {
    if (!isAdmin) {
      alert(lang === 'ta' ? 'அனுமதி மறுக்கப்பட்டது: கணினி நிர்வாகிகளுக்கு மட்டுமே நீக்க அனுமதி உண்டு.' : 'Access Denied: Only administrators are authorized to delete patient records.');
      return;
    }

    const confirmed = window.confirm(
      lang === 'ta'
        ? `நோயாளி "${patient.name}" (${patient.patientId}) அவர்களின் அனைத்து மருத்துவ பதிவுகளையும் நிச்சயமாக நீக்க விரும்புகிறீர்களா?`
        : `Are you sure you want to permanently delete patient "${patient.name}" (${patient.patientId})? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await patientRepository.delete(patient.localId, user);
        alert(lang === 'ta' ? 'நோயாளி பதிவு வெற்றிகரமாக நீக்கப்பட்டது.' : 'Patient record deleted successfully by administrator.');
        navigate('/patients');
      } catch (err) {
        alert(err.message || 'Failed to delete patient');
      }
    }
  };

  if (loading) {
    return (
      <div className="patient-detail-loading" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p>{lang === 'ta' ? 'நோயாளி விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading patient records...'}</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="patient-not-found-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>{lang === 'ta' ? 'நோயாளி கிடைக்கவில்லை' : 'Patient Not Found'}</h2>
        <button onClick={() => navigate('/patients')} className="btn-back" style={{ marginTop: '16px' }}>
          <ArrowLeft size={18} />
          <span>{lang === 'ta' ? 'பட்டியலுக்கு திரும்பு' : 'Back to Patient List'}</span>
        </button>
      </div>
    );
  }

  const doctorConsultations = Array.isArray(patient.doctorAssistance) ? patient.doctorAssistance : [];

  return (
    <div className="patient-detail-container">
      {/* Top Navigation Row */}
      <div className="detail-top-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <button onClick={() => navigate('/patients')} className="btn-back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ArrowLeft size={18} />
          <span>{lang === 'ta' ? 'அனைத்து நோயாளிகள்' : 'Back to Patients'}</span>
        </button>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Doctors can assist; Workers & Admin can enter triage */}
          {(isDoctor || isAdmin) && (
            <button
              onClick={() => setShowAssistForm(!showAssistForm)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              <HeartPulse size={18} />
              <span>{lang === 'ta' ? 'மருத்துவ உதவி வழங்குக' : 'Provide Doctor Assistance'}</span>
            </button>
          )}

          {!isDoctor && (
            <button
              onClick={() => navigate(`/triage?patientId=${patient.patientId}`)}
              className="btn-action-primary start-triage-highlight"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <Stethoscope size={18} />
              <span>{t('btn_start_triage')}</span>
            </button>
          )}

          {/* Admin-only Delete Button (STRICTLY HIDDEN from Doctor and Worker) */}
          {isAdmin && (
            <button
              onClick={handleDeletePatient}
              title={lang === 'ta' ? 'நோயாளி பதிவை நீக்குக' : 'Delete Patient Record'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 14px',
                backgroundColor: '#fee2e2',
                border: '1.5px solid #fecaca',
                borderRadius: '12px',
                color: '#dc2626',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={16} />
              <span>{lang === 'ta' ? 'நீக்குக' : 'Delete Patient'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Profile Card */}
      <div className="patient-profile-card">
        <div className="profile-header-strip">
          <div className="profile-avatar">
            {patient.gender === 'female' ? '👩' : patient.gender === 'male' ? '👨' : '👤'}
          </div>
          <div className="profile-titles">
            <h1 className="profile-name">{patient.name}</h1>
            <div className="profile-badges-row" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="profile-id-badge">{patient.patientId}</span>
              <span className={`sync-pill ${patient.syncStatus}`}>
                {patient.syncStatus === 'synced' ? '🟢 Synced' : '🟡 Offline Pending'}
              </span>
              {doctorConsultations.length > 0 && (
                <span
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Activity size={13} />
                  {lang === 'ta'
                    ? `மருத்துவர் உதவி: ${doctorConsultations.length} முறை`
                    : `Doctor Consultations: ${doctorConsultations.length}`}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-data-grid">
          <div className="data-box">
            <Calendar size={18} />
            <div className="data-content">
              <span className="data-label">{t('field_age')}</span>
              <strong>{patient.age} {lang === 'ta' ? 'வயது' : 'Years'} ({patient.gender})</strong>
            </div>
          </div>

          <div className="data-box">
            <MapPin size={18} />
            <div className="data-content">
              <span className="data-label">{t('field_village')}</span>
              <strong>{patient.village}</strong>
            </div>
          </div>

          <div className="data-box">
            <Phone size={18} />
            <div className="data-content">
              <span className="data-label">{t('field_phone')}</span>
              <strong>{patient.phone || (lang === 'ta' ? 'இல்லை' : 'N/A')}</strong>
            </div>
          </div>

          <div className="data-box">
            <Shield size={18} />
            <div className="data-content">
              <span className="data-label">{t('field_emergency_contact')}</span>
              <strong>{patient.emergencyContact || (lang === 'ta' ? 'இல்லை' : 'N/A')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* DOCTOR CLINICAL ASSISTANCE SECTION */}
      {(isDoctor || isAdmin || showAssistForm) && (
        <div
          style={{
            marginTop: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '2px solid #bae6fd',
            boxShadow: '0 8px 24px rgba(2, 132, 199, 0.08)',
            padding: '24px',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HeartPulse size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                  {lang === 'ta' ? 'மருத்துவர் மருத்துவ ஆலோசனை & உதவி' : 'Doctor Clinical Consultation & Patient Assistance'}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {lang === 'ta' ? 'மருத்துவரின் குறிப்புகள், மருந்து பரிந்துரை மற்றும் மருத்துவ வழிகாட்டல்' : 'Review triage observations, prescribe medicines and advise referral.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAssistForm(!showAssistForm)}
              style={{
                backgroundColor: showAssistForm ? '#f1f5f9' : '#0284c7',
                color: showAssistForm ? '#475569' : '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {showAssistForm ? (lang === 'ta' ? 'படிவத்தை மறைக்க' : 'Hide Form') : (lang === 'ta' ? '+ புதிய உதவி பதிவு' : '+ New Clinical Note')}
            </button>
          </div>

          {assistSuccess && (
            <div style={{ backgroundColor: '#ecfdf5', border: '1.5px solid #a7f3d0', color: '#065f46', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={18} />
              <span>{lang === 'ta' ? 'மருத்துவர் ஆலோசனை வெற்றிகரமாக பதிவு செய்யப்பட்டது!' : 'Doctor assistance & prescription saved successfully!'}</span>
            </div>
          )}

          {showAssistForm && (
            <form onSubmit={handleSaveAssistance} style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc', padding: '18px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {lang === 'ta' ? 'மருத்துவ பரிசோதனை முடிவு / நோயறிதல் (Diagnosis)' : 'Clinical Diagnosis / Findings'}
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder={lang === 'ta' ? 'எ.கா: தீவிர மூச்சுக்குழாய் அழற்சி / Bronchitis' : 'e.g. Acute Viral Bronchitis / Dehydration'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {lang === 'ta' ? 'மருத்துவர் குறிப்புகள் & மருத்துவ ஆலோசனை (Doctor Notes)' : 'Doctor Assessment & Clinical Advice'}
                </label>
                <textarea
                  rows={3}
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder={lang === 'ta' ? 'நோயாளி நிலைமை, அவசர எச்சரிக்கை மற்றும் பராமரிப்பு குறிப்புகள்...' : 'Detailed clinical evaluation notes and instructions for field worker / patient...'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {lang === 'ta' ? 'மருந்து பரிந்துரை & அளவு (Prescriptions & Dosage)' : 'Prescriptions & Dosage Instructions'}
                </label>
                <textarea
                  rows={2}
                  value={prescription}
                  onChange={(e) => setPrescription(e.target.value)}
                  placeholder={lang === 'ta' ? 'எ.கா: Tab Paracetamol 500mg TDS x 3 நாட்கள், ORS கரைசல்' : 'e.g. Tab Paracetamol 500mg 1 tab TDS after food x 3 days, ORS 1 packet in 1L water'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  {lang === 'ta' ? 'மருத்துவ நடவடிக்கை & பரிந்துரை (Referral Action)' : 'Clinical Action / Referral Advice'}
                </label>
                <select
                  value={clinicalAction}
                  onChange={(e) => setClinicalAction(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff' }}
                >
                  <option value="Prescribed Medications at PHC">{lang === 'ta' ? 'ஆரம்ப சுகாதார நிலையத்தில் சிகிச்சை & மருந்துகள் வழங்கப்பட்டது' : 'Prescribed Medications at PHC'}</option>
                  <option value="Urgent Referral to District Hospital (Call 108)">{lang === 'ta' ? 'அவசர மாவட்ட மருத்துவமனை பரிந்துரை (108 ஆம்புலன்ஸ்)' : 'Urgent Referral to District Hospital (Call 108)'}</option>
                  <option value="Observe at Health Sub-Centre (24 Hours)">{lang === 'ta' ? 'சுகாதார துணை மையத்தில் கண்காணிப்பு (24 மணிநேரம்)' : 'Observe at Health Sub-Centre (24 Hours)'}</option>
                  <option value="Advised Home Rest & Hydration">{lang === 'ta' ? 'வீட்டு ஓய்வு & போதுமான நீர்சத்து வழிகாட்டல்' : 'Advised Home Rest & Hydration'}</option>
                  <option value="Follow-up in 48 Hours">{lang === 'ta' ? '48 மணிநேரத்தில் மறுபரிசீலனை தேவை' : 'Follow-up in 48 Hours'}</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowAssistForm(false)}
                  style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', padding: '10px 16px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', color: '#475569' }}
                >
                  {lang === 'ta' ? 'ரத்து' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={assistSaving}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                >
                  <Send size={16} />
                  <span>{assistSaving ? (lang === 'ta' ? 'சேமிக்கிறது...' : 'Saving...') : (lang === 'ta' ? 'உதவி பதிவை சேமி' : 'Save Clinical Assistance')}</span>
                </button>
              </div>
            </form>
          )}

          {/* Past Doctor Consultations List */}
          {doctorConsultations.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: '#334155' }}>
                {lang === 'ta' ? 'முந்தைய மருத்துவர் ஆலோசனைகள்:' : 'Doctor Assistance & Prescription History:'}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {doctorConsultations.map((c, i) => (
                  <div
                    key={c.id || i}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>👨‍⚕️</span>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{c.doctorName || 'Medical Officer'}</strong>
                        <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '999px' }}>
                          Doctor
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {new Date(c.assistedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} • {new Date(c.assistedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {c.diagnosis && (
                      <div style={{ marginBottom: '6px', fontSize: '0.88rem' }}>
                        <strong style={{ color: '#0369a1' }}>{lang === 'ta' ? 'நோயறிதல்: ' : 'Diagnosis: '}</strong>
                        <span style={{ fontWeight: 600 }}>{c.diagnosis}</span>
                      </div>
                    )}

                    {c.notes && (
                      <div style={{ marginBottom: '6px', fontSize: '0.85rem', color: '#334155' }}>
                        <strong>{lang === 'ta' ? 'மருத்துவ குறிப்பு: ' : 'Doctor Notes: '}</strong>
                        <span>{c.notes}</span>
                      </div>
                    )}

                    {c.prescription && (
                      <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 12px', margin: '8px 0', fontSize: '0.85rem', color: '#166534' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '4px' }}>
                          <Pill size={15} />
                          <span>{lang === 'ta' ? 'பரிந்துரைக்கப்பட்ட மருந்துகள் (Prescription):' : 'Prescription:'}</span>
                        </div>
                        <div style={{ whiteSpace: 'pre-line' }}>{c.prescription}</div>
                      </div>
                    )}

                    {c.action && (
                      <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: c.action.includes('Referral') ? '#fef2f2' : '#f1f5f9', color: c.action.includes('Referral') ? '#dc2626' : '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}>
                        <Building size={14} />
                        <span>{c.action}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visit Timeline / History Section */}
      <div className="timeline-section" style={{ marginTop: '24px' }}>
        <div className="timeline-header-row">
          <h2 className="timeline-title">
            <Clock size={22} />
            <span>{lang === 'ta' ? 'கள பரிசோதனை வரலாறு' : 'Field Triage Assessment History'}</span>
          </h2>
          <span className="timeline-count-badge">
            {history.length} {lang === 'ta' ? 'பரிசோதனைகள்' : 'Visits'}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="timeline-empty-card">
            <p>
              {lang === 'ta'
                ? 'இந்த நோயாளிக்கு இன்னும் மதிப்பீடு செய்யப்படவில்லை.'
                : 'No triage assessments logged for this patient yet.'}
            </p>
            {!isDoctor && (
              <button
                onClick={() => navigate(`/triage?patientId=${patient.patientId}`)}
                className="btn-action-primary start-triage"
              >
                <Stethoscope size={18} />
                <span>{t('btn_start_triage')}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="timeline-cards-list">
            {history.map((record, index) => {
              const visitNum = history.length - index;

              return (
                <div key={record.localId} className={`timeline-entry-card level-${record.triageLevel.toLowerCase()}`}>
                  <div className="timeline-entry-top">
                    <div className="visit-counter-tag">
                      {lang === 'ta' ? `வருகை ${visitNum}` : `Visit #${visitNum}`} • {record.recordId || 'Draft'}
                    </div>
                    <span className={`triage-badge ${record.triageLevel.toLowerCase()}`}>
                      {record.triageLevel === 'EMERGENCY' && <AlertOctagon size={16} />}
                      {record.triageLevel === 'URGENT' && <AlertTriangle size={16} />}
                      {record.triageLevel === 'NON-URGENT' && <CheckCircle size={16} />}
                      <span>{record.triageLevel}</span>
                    </span>
                  </div>

                  <div className="timeline-timestamp">
                    {new Date(record.createdAt).toLocaleDateString([], {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}{' '}
                    • {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>

                  {/* Vitals Row */}
                  <div className="entry-vitals-row">
                    {record.vitals?.temperature && (
                      <span className="vital-tag">
                        <Thermometer size={14} />
                        <span>{record.vitals.temperature}°F</span>
                      </span>
                    )}
                    {record.vitals?.heartRate && (
                      <span className="vital-tag">
                        <Activity size={14} />
                        <span>{record.vitals.heartRate} bpm</span>
                      </span>
                    )}
                    {record.vitals?.spO2 && (
                      <span className={`vital-tag ${record.vitals.spO2 < 90 ? 'critical' : ''}`}>
                        <span>SpO2: {record.vitals.spO2}%</span>
                      </span>
                    )}
                    {record.vitals?.respiratoryRate && (
                      <span className="vital-tag">
                        <Wind size={14} />
                        <span>{record.vitals.respiratoryRate} /min</span>
                      </span>
                    )}
                    {record.vitals?.systolicBP && (
                      <span className="vital-tag">
                        <span>BP: {record.vitals.systolicBP}/{record.vitals.diastolicBP || '-'}</span>
                      </span>
                    )}
                  </div>

                  {/* Active Symptoms Tags */}
                  <div className="entry-symptoms-row">
                    <span className="symptoms-label">{lang === 'ta' ? 'அறிகுறிகள்:' : 'Symptoms:'}</span>
                    {record.symptoms &&
                      Object.entries(record.symptoms)
                        .filter(([_, val]) => val === true)
                        .map(([symKey]) => (
                          <span key={symKey} className="symptom-tag">
                            {symKey}
                          </span>
                        ))}
                  </div>

                  {/* Recommendation */}
                  <div className="entry-recommendation-box">
                    <strong>{lang === 'ta' ? 'வழிகாட்டல்:' : 'Protocol Recommendation:'}</strong>
                    <p>{lang === 'ta' ? record.recommendationTa : record.recommendationEn}</p>
                  </div>

                  {record.notes && (
                    <div className="entry-notes-box">
                      <strong>{lang === 'ta' ? 'குறிப்பு:' : 'Notes:'}</strong>
                      <p>{record.notes}</p>
                    </div>
                  )}

                  <div className="entry-footer">
                    <span>{lang === 'ta' ? 'மதிப்பீடு செய்தவர்:' : 'Assessed By:'} {record.healthcareWorkerName}</span>
                    <span className={`sync-pill ${record.syncStatus}`}>
                      {record.syncStatus === 'synced' ? '🟢 Synced' : '🟡 Offline'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDetailPage;

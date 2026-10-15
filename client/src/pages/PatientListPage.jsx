import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientRepository } from '../database/patientRepository';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSync } from '../context/SyncContext';
import {
  Search,
  UserPlus,
  Stethoscope,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldCheck,
  HeartPulse,
  Activity,
  UserCheck
} from 'lucide-react';

export function PatientListPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();
  const { pendingCount } = useSync();
  const navigate = useNavigate();

  const isAdmin = user?.role === 'admin';
  const isDoctor = user?.role === 'doctor';
  const isWorker = user?.role === 'health_worker';

  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await patientRepository.getAll(searchTerm, selectedVillage);
      setPatients(data);

      // Extract unique villages
      const allPatients = await patientRepository.getAll();
      const uniqueVillages = Array.from(new Set(allPatients.map((p) => p.village).filter(Boolean)));
      setVillages(uniqueVillages);
    } catch (err) {
      console.warn('[Fetch Patients Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, selectedVillage, pendingCount]);

  // Admin-only deletion handler
  const handleDeletePatient = async (patient) => {
    if (!isAdmin) {
      alert(lang === 'ta'
        ? 'அனுமதி மறுக்கப்பட்டது: கணினி நிர்வாகிகளுக்கு மட்டுமே நோயாளியின் பதிவை நீக்க அனுமதி உண்டு.'
        : 'Access Denied: Only administrators are authorized to delete patient records. Doctors and health workers cannot delete patient records.');
      return;
    }

    const confirmed = window.confirm(
      lang === 'ta'
        ? `நோயாளி "${patient.name}" (${patient.patientId}) மற்றும் அவர்களின் அனைத்து மருத்துவ பதிவுகளையும் நிச்சயமாக நீக்க விரும்புகிறீர்களா? இந்த செயல் மாற்ற முடியாதது.`
        : `Are you sure you want to permanently delete patient "${patient.name}" (${patient.patientId}) and all their triage records? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await patientRepository.delete(patient.localId, user);
        alert(lang === 'ta' ? 'நோயாளி பதிவு வெற்றிகரமாக நீக்கப்பட்டது.' : 'Patient record deleted successfully by administrator.');
        fetchPatients();
      } catch (err) {
        alert(err.message || 'Failed to delete patient');
      }
    }
  };

  return (
    <div className="patients-page-container">
      {/* Header bar */}
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-main-title">{t('nav_patients')}</h1>
          <p className="page-main-subtitle">
            {lang === 'ta'
              ? 'பதிவு செய்யப்பட்ட கிராம நோயாளிகளின் பட்டியல் (ஆஃப்லைன்)'
              : 'Registered community patients (offline-ready directory)'}
          </p>
        </div>

        {/* Action Button: Workers & Admin can register. Doctors do not register (they review & assist) */}
        {!isDoctor ? (
          <Link to="/register" className="btn-action-primary new-patient" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} />
            <span>{t('nav_register')}</span>
          </Link>
        ) : (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#f0f9ff',
              border: '1.5px solid #bae6fd',
              borderRadius: '12px',
              color: '#0284c7',
              fontWeight: 700,
              fontSize: '0.88rem'
            }}
          >
            <HeartPulse size={18} />
            <span>{lang === 'ta' ? 'மருத்துவர் பார்வை • மருத்துவ ஆலோசனை & உதவி முறை' : 'Doctor View • Clinical Review & Assist Mode'}</span>
          </div>
        )}
      </div>

      {/* Role Capabilities Banner */}
      <div
        style={{
          margin: '16px 0',
          padding: '12px 16px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.88rem',
          backgroundColor: isAdmin ? '#f5f3ff' : isDoctor ? '#f0f9ff' : '#f0fdf4',
          border: isAdmin ? '1.5px solid #ddd6fe' : isDoctor ? '1.5px solid #bae6fd' : '1.5px solid #bbf7d0',
          color: isAdmin ? '#6b21a8' : isDoctor ? '#0369a1' : '#15803d'
        }}
      >
        {isAdmin && <ShieldCheck size={20} />}
        {isDoctor && <HeartPulse size={20} />}
        {isWorker && <Stethoscope size={20} />}

        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '0.92rem' }}>
            {isAdmin && (lang === 'ta' ? 'நிர்வாகி அணுகல் (முழுமையான அதிகாரம்)' : 'Administrator Mode: Full Access')}
            {isDoctor && (lang === 'ta' ? 'மருத்துவர் அணுகல் (பார்வை & மருத்துவ உதவி மட்டும்)' : 'Doctor / PHC Mode: Clinical View & Patient Assistance')}
            {isWorker && (lang === 'ta' ? 'சுகாதார பணியாளர் அணுகல் (நோயாளி பதிவு & பரிசோதனை)' : 'Health Worker Mode: Field Intake & Triage Entry')}
          </strong>
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            {isAdmin && (lang === 'ta' ? 'அனைத்து நோயாளி விவரங்களையும் பார்க்க, திருத்த, நீக்க மற்றும் நிர்வகிக்கலாம்.' : 'Can view all particulars, enter triage assessments, manage and delete patient records.')}
            {isDoctor && (lang === 'ta' ? 'நோயாளி பதிவுகளை மட்டுமே பார்க்க முடியும், மருத்துவ ஆலோசனை, பரிந்துரை & உதவி வழங்கலாம். நீக்கும் அதிகாரம் இல்லை.' : 'Can review all patient records and provide clinical assistance & prescriptions. Deletion is not permitted.')}
            {isWorker && (lang === 'ta' ? 'புதிய நோயாளிகளை பதிவு செய்யலாம் மற்றும் கள பரிசோதனை பதிவுகளை உள்ளிடலாம்.' : 'Can create new patient info and enter triage assessment records in field.')}
          </span>
        </div>
      </div>

      {/* Search & Village Filter Row */}
      <div className="search-filter-card">
        <div className="search-input-wrap">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              lang === 'ta'
                ? 'பெயர், நோயாளி எண் அல்லது தொலைபேசி மூலம் தேடுக...'
                : 'Search by patient name, ID, or phone...'
            }
            className="search-input"
          />
        </div>

        <div className="filter-select-wrap">
          <Filter size={18} className="filter-icon" />
          <select
            value={selectedVillage}
            onChange={(e) => setSelectedVillage(e.target.value)}
            className="village-filter-select"
          >
            <option value="">{lang === 'ta' ? 'அனைத்து கிராமங்களும்' : 'All Villages'}</option>
            {villages.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patients List Grid */}
      {loading ? (
        <div className="loading-state-card">
          <p>{lang === 'ta' ? 'ஏற்றப்படுகிறது...' : 'Loading patient records...'}</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="empty-search-card">
          <p>
            {searchTerm
              ? (lang === 'ta' ? 'தேடலுக்குரிய நோயாளிகள் கிடைக்கவில்லை.' : 'No patients found matching your search.')
              : (lang === 'ta' ? 'நோயாளிகள் இன்னும் பதிவு செய்யப்படவில்லை.' : 'No patients registered yet.')}
          </p>
          {!isDoctor && (
            <Link to="/register" className="btn-action-primary new-patient">
              <UserPlus size={18} />
              <span>{t('nav_register')}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="patients-grid">
          {patients.map((patient) => {
            const hasDoctorAssistance = Array.isArray(patient.doctorAssistance) && patient.doctorAssistance.length > 0;

            return (
              <div key={patient.localId} className="patient-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="patient-card-header">
                    <div className="patient-avatar-badge">
                      {patient.gender === 'female' ? '👩' : patient.gender === 'male' ? '👨' : '👤'}
                    </div>
                    <div className="patient-main-info">
                      <h3 className="patient-name">{patient.name}</h3>
                      <span className="patient-id-tag">{patient.patientId}</span>
                    </div>
                    <div className="patient-sync-indicator">
                      {patient.syncStatus === 'synced' ? (
                        <span className="sync-icon synced" title="Synced with central server">
                          <CheckCircle2 size={16} />
                        </span>
                      ) : (
                        <span className="sync-icon pending" title="Pending sync">
                          <Clock size={16} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Doctor Assisted Badge if present */}
                  {hasDoctorAssistance && (
                    <div
                      style={{
                        margin: '6px 0 10px 0',
                        backgroundColor: '#e0f2fe',
                        border: '1px solid #bae6fd',
                        color: '#0369a1',
                        borderRadius: '8px',
                        padding: '4px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Activity size={14} />
                      <span>
                        {lang === 'ta'
                          ? `மருத்துவர் ஆலோசனை: ${patient.doctorAssistance[0].doctorName}`
                          : `Doctor Assisted: ${patient.doctorAssistance[0].doctorName}`}
                      </span>
                    </div>
                  )}

                  <div className="patient-meta-grid">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>
                        {patient.age} {lang === 'ta' ? 'வயது' : 'yrs'} • {patient.gender}
                      </span>
                    </div>
                    <div className="meta-item">
                      <MapPin size={14} />
                      <span>{patient.village}</span>
                    </div>
                    {patient.phone && (
                      <div className="meta-item">
                        <Phone size={14} />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Patient Card Actions — Dynamic per Role */}
                <div className="patient-card-actions" style={{ marginTop: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* DOCTOR ACTION: Assist Patient */}
                  {isDoctor ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/patients/${patient.patientId}?action=assist`)}
                      className="btn-card-action triage"
                      style={{ backgroundColor: '#0284c7', color: '#ffffff', flex: 1 }}
                    >
                      <HeartPulse size={16} />
                      <span>{lang === 'ta' ? 'மருத்துவ உதவி' : 'Assist Patient'}</span>
                    </button>
                  ) : (
                    /* WORKER & ADMIN ACTION: Start Triage Assessment */
                    <button
                      type="button"
                      onClick={() => navigate(`/triage?patientId=${patient.patientId}`)}
                      className="btn-card-action triage"
                      style={{ flex: 1 }}
                    >
                      <Stethoscope size={16} />
                      <span>{t('btn_start_triage')}</span>
                    </button>
                  )}

                  {/* Common: View History & Particulars */}
                  <button
                    type="button"
                    onClick={() => navigate(`/patients/${patient.patientId}`)}
                    className="btn-card-action history"
                    style={{ flex: 1 }}
                  >
                    <span>{t('btn_view_history')}</span>
                    <ChevronRight size={16} />
                  </button>

                  {/* STRICTLY ADMIN ONLY: Delete Patient Record */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleDeletePatient(patient)}
                      title={lang === 'ta' ? 'நிர்வாகி: நோயாளியை நீக்குக' : 'Admin: Delete Patient Record'}
                      style={{
                        backgroundColor: '#fee2e2',
                        border: '1.5px solid #fecaca',
                        color: '#dc2626',
                        borderRadius: '10px',
                        padding: '10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PatientListPage;

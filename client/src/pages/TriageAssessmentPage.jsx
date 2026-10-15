import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { patientRepository } from '../database/patientRepository';
import { triageRepository } from '../database/triageRepository';
import { evaluateClientTriage } from '../services/triageRules';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { SymptomCard } from '../components/triage/SymptomCard';
import { VitalInputCard } from '../components/triage/VitalInputCard';
import { TriageResultModal } from '../components/triage/TriageResultModal';
import { SpeechRecognitionButton } from '../components/common/SpeechRecognitionButton';
import {
  Stethoscope,
  User,
  Activity,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  FileText
} from 'lucide-react';

export function TriageAssessmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [patient, setPatient] = useState(null);

  // Symptoms state
  const [symptoms, setSymptoms] = useState({
    fever: false,
    cough: false,
    breathingDifficulty: false,
    chestPain: false,
    headache: false,
    vomiting: false,
    diarrhea: false,
    abdominalPain: false,
    dizziness: false,
    injury: false,
    severeBleeding: false,
    unconscious: false
  });

  // Vitals state
  const [vitals, setVitals] = useState({
    temperature: 98.6,
    heartRate: 75,
    spO2: 98,
    respiratoryRate: 16,
    systolicBP: 120,
    diastolicBP: 80
  });

  const [notes, setNotes] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load local patients list for dropdown
  useEffect(() => {
    async function loadPatients() {
      const all = await patientRepository.getAll();
      setPatients(all);

      const targetId = searchParams.get('patientId');
      if (targetId) {
        setSelectedPatientId(targetId);
        const p = all.find((item) => item.patientId === targetId || item.localId === targetId);
        if (p) setPatient(p);
      } else if (all.length > 0 && !selectedPatientId) {
        setSelectedPatientId(all[0].patientId);
        setPatient(all[0]);
      }
    }
    loadPatients();
  }, [searchParams]);

  const handlePatientChange = (e) => {
    const id = e.target.value;
    setSelectedPatientId(id);
    const p = patients.find((item) => item.patientId === id || item.localId === id);
    setPatient(p || null);
  };

  const handleSymptomChange = (key, value) => {
    setSymptoms((prev) => ({ ...prev, [key]: value }));
  };

  const handleVitalChange = (key, value) => {
    setVitals((prev) => ({ ...prev, [key]: value }));
  };

  // Evaluate assessment and trigger results
  const handleEvaluateClick = (e) => {
    e.preventDefault();
    if (!patient) {
      alert(lang === 'ta' ? 'தயவுசெய்து ஒரு நோயாளியை தேர்ந்தெடுக்கவும்.' : 'Please select a patient first.');
      return;
    }

    const result = evaluateClientTriage(symptoms, vitals, patient.age);
    setCurrentResult(result);
    setShowModal(true);
  };

  // Save to IndexedDB and queue
  const handleSaveAssessment = async () => {
    if (!patient || !currentResult) return;
    setIsSaving(true);
    try {
      await triageRepository.create(
        {
          patientId: patient.patientId,
          patientName: patient.name,
          patientAge: patient.age,
          patientGender: patient.gender,
          symptoms,
          vitals,
          triageLevel: currentResult.triageLevel,
          redFlags: currentResult.redFlags,
          recommendationEn: currentResult.recommendationEn,
          recommendationTa: currentResult.recommendationTa,
          notes
        },
        user
      );

      setShowModal(false);
      if (user && user.role === 'admin') {
        navigate(`/patients/${patient.patientId}`);
      } else {
        navigate('/my-records');
      }
    } catch (err) {
      console.error('[Save Triage Error]', err);
      alert('Error saving triage assessment: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSymptoms({
      fever: false,
      cough: false,
      breathingDifficulty: false,
      chestPain: false,
      headache: false,
      vomiting: false,
      diarrhea: false,
      abdominalPain: false,
      dizziness: false,
      injury: false,
      severeBleeding: false,
      unconscious: false
    });
    setVitals({
      temperature: 98.6,
      heartRate: 75,
      spO2: 98,
      respiratoryRate: 16,
      systolicBP: 120,
      diastolicBP: 80
    });
    setNotes('');
  };

  return (
    <div className="triage-page-container">
      {/* Page Header */}
      <div className="triage-page-header">
        <div className="triage-icon-wrap">
          <Stethoscope size={32} />
        </div>
        <div>
          <h1 className="triage-main-title">{t('nav_triage')}</h1>
          <p className="triage-main-subtitle">
            {lang === 'ta'
              ? 'விதிகள் அடிப்படையிலான சுகாதார மதிப்பீட்டு கருவி (ஆஃப்லைன்)'
              : 'Rule-based rural clinical decision support (100% offline-ready)'}
          </p>
        </div>
      </div>

      {/* Patient Selection Strip */}
      <div className="patient-selector-card">
        <div className="selector-label-wrap">
          <User size={20} />
          <span>{lang === 'ta' ? 'நோயாளி தேர்வு' : 'Select Patient'}:</span>
        </div>

        <select
          value={selectedPatientId}
          onChange={handlePatientChange}
          className="patient-select-dropdown"
        >
          <option value="">{lang === 'ta' ? '-- நோயாளியை தேர்வு செய்க --' : '-- Choose a patient --'}</option>
          {patients.map((p) => (
            <option key={p.localId} value={p.patientId}>
              {p.name} ({p.patientId}) - {p.village} ({p.age}y, {p.gender})
            </option>
          ))}
        </select>

        {patient && (
          <div className="selected-patient-pill">
            <span>
              {patient.name} ({patient.age}y, {patient.village})
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleEvaluateClick}>
        {/* Section 1: Emergency & Danger Symptoms */}
        <div className="triage-section-box">
          <div className="section-title-strip danger">
            <AlertTriangle size={22} />
            <h2>
              {lang === 'ta'
                ? 'அவசர மற்றும் தீவிர அறிகுறிகள் (Red Flags)'
                : 'Emergency & Red Flag Symptoms'}
            </h2>
          </div>

          <div className="symptoms-grid">
            <SymptomCard
              symptomKey="unconscious"
              soundKey="unconscious"
              title={t('symptom_unconscious')}
              question={t('symptom_unconscious_q')}
              value={symptoms.unconscious}
              onChange={(v) => handleSymptomChange('unconscious', v)}
              isEmergencyTrigger={true}
            />

            <SymptomCard
              symptomKey="severeBleeding"
              soundKey="severe_bleeding"
              title={t('symptom_severe_bleeding')}
              question={t('symptom_severe_bleeding_q')}
              value={symptoms.severeBleeding}
              onChange={(v) => handleSymptomChange('severeBleeding', v)}
              isEmergencyTrigger={true}
            />

            <SymptomCard
              symptomKey="chestPain"
              soundKey="chest_pain"
              title={t('symptom_chest_pain')}
              question={t('symptom_chest_pain_q')}
              value={symptoms.chestPain}
              onChange={(v) => handleSymptomChange('chestPain', v)}
              isEmergencyTrigger={true}
            />

            <SymptomCard
              symptomKey="breathingDifficulty"
              soundKey="breathing"
              title={t('symptom_breathing')}
              question={t('symptom_breathing_q')}
              value={symptoms.breathingDifficulty}
              onChange={(v) => handleSymptomChange('breathingDifficulty', v)}
              isEmergencyTrigger={true}
            />
          </div>
        </div>

        {/* Section 2: General & Urgent Symptoms */}
        <div className="triage-section-box">
          <div className="section-title-strip">
            <Activity size={22} />
            <h2>{t('symptoms_section_title')}</h2>
          </div>

          <div className="symptoms-grid">
            <SymptomCard
              symptomKey="fever"
              soundKey="fever"
              title={t('symptom_fever')}
              question={t('symptom_fever_q')}
              value={symptoms.fever}
              onChange={(v) => handleSymptomChange('fever', v)}
            />

            <SymptomCard
              symptomKey="cough"
              soundKey="cough"
              title={t('symptom_cough')}
              question={t('symptom_cough_q')}
              value={symptoms.cough}
              onChange={(v) => handleSymptomChange('cough', v)}
            />

            <SymptomCard
              symptomKey="vomiting"
              soundKey="vomiting"
              title={t('symptom_vomiting')}
              question={t('symptom_vomiting_q')}
              value={symptoms.vomiting}
              onChange={(v) => handleSymptomChange('vomiting', v)}
            />

            <SymptomCard
              symptomKey="diarrhea"
              soundKey="diarrhea"
              title={t('symptom_diarrhea')}
              question={t('symptom_diarrhea_q')}
              value={symptoms.diarrhea}
              onChange={(v) => handleSymptomChange('diarrhea', v)}
            />

            <SymptomCard
              symptomKey="abdominalPain"
              soundKey="abdominal_pain"
              title={t('symptom_abdominal_pain')}
              question={t('symptom_abdominal_pain_q')}
              value={symptoms.abdominalPain}
              onChange={(v) => handleSymptomChange('abdominalPain', v)}
            />

            <SymptomCard
              symptomKey="headache"
              soundKey="headache"
              title={t('symptom_headache')}
              question={t('symptom_headache_q')}
              value={symptoms.headache}
              onChange={(v) => handleSymptomChange('headache', v)}
            />

            <SymptomCard
              symptomKey="dizziness"
              soundKey="dizziness"
              title={t('symptom_dizziness')}
              question={t('symptom_dizziness_q')}
              value={symptoms.dizziness}
              onChange={(v) => handleSymptomChange('dizziness', v)}
            />

            <SymptomCard
              symptomKey="injury"
              soundKey="injury"
              title={t('symptom_injury')}
              question={t('symptom_injury_q')}
              value={symptoms.injury}
              onChange={(v) => handleSymptomChange('injury', v)}
            />
          </div>
        </div>

        {/* Section 3: Vitals */}
        <div className="triage-section-box">
          <div className="section-title-strip">
            <Activity size={22} />
            <h2>{t('vitals_section_title')}</h2>
          </div>

          <div className="vitals-inputs-grid">
            <VitalInputCard
              vitalKey="temperature"
              label={t('vital_temperature')}
              value={vitals.temperature}
              unit="°F"
              min={92}
              max={108}
              step={0.2}
              normalRangeText="97.0 - 99.0 °F"
              onChange={(v) => handleVitalChange('temperature', v)}
              warningCheck={(val) => {
                if (!val) return 'normal';
                if (val >= 104) return 'emergency';
                if (val >= 102) return 'urgent';
                return 'normal';
              }}
            />

            <VitalInputCard
              vitalKey="heartRate"
              label={t('vital_heart_rate')}
              value={vitals.heartRate}
              unit="BPM"
              min={30}
              max={220}
              step={1}
              normalRangeText="60 - 100 BPM"
              onChange={(v) => handleVitalChange('heartRate', v)}
              warningCheck={(val) => {
                if (!val) return 'normal';
                if (val > 130 || val < 40) return 'emergency';
                if (val > 100) return 'urgent';
                return 'normal';
              }}
            />

            <VitalInputCard
              vitalKey="spO2"
              label={t('vital_spo2')}
              value={vitals.spO2}
              unit="%"
              min={50}
              max={100}
              step={1}
              normalRangeText="95 - 100 %"
              onChange={(v) => handleVitalChange('spO2', v)}
              warningCheck={(val) => {
                if (!val) return 'normal';
                if (val < 90) return 'emergency';
                if (val <= 94) return 'urgent';
                return 'normal';
              }}
            />

            <VitalInputCard
              vitalKey="respiratoryRate"
              label={t('vital_respiratory_rate')}
              value={vitals.respiratoryRate}
              unit="/min"
              min={4}
              max={60}
              step={1}
              normalRangeText="12 - 20 /min"
              onChange={(v) => handleVitalChange('respiratoryRate', v)}
              warningCheck={(val) => {
                if (!val) return 'normal';
                if (val > 30 || val < 8) return 'emergency';
                if (val > 22) return 'urgent';
                return 'normal';
              }}
            />

            <VitalInputCard
              vitalKey="systolicBP"
              label={t('vital_bp_systolic')}
              value={vitals.systolicBP}
              unit="mmHg"
              min={60}
              max={250}
              step={2}
              normalRangeText="90 - 120 mmHg"
              onChange={(v) => handleVitalChange('systolicBP', v)}
              warningCheck={(val) => {
                if (!val) return 'normal';
                if (val > 200 || val < 80) return 'emergency';
                if (val >= 160) return 'urgent';
                return 'normal';
              }}
            />

            <VitalInputCard
              vitalKey="diastolicBP"
              label={t('vital_bp_diastolic')}
              value={vitals.diastolicBP}
              unit="mmHg"
              min={40}
              max={150}
              step={2}
              normalRangeText="60 - 80 mmHg"
              onChange={(v) => handleVitalChange('diastolicBP', v)}
              warningCheck={(val) => {
                if (!val) return 'normal';
                if (val >= 110) return 'emergency';
                if (val >= 95) return 'urgent';
                return 'normal';
              }}
            />
          </div>
        </div>

        {/* Section 4: Worker Observation Notes */}
        <div className="triage-section-box">
          <div className="section-title-strip">
            <FileText size={22} />
            <h2>{lang === 'ta' ? 'கூடுதல் குறிப்புகள் & அவதானிப்புகள்' : 'Additional Notes & Symptoms Details'}</h2>
            <SpeechRecognitionButton
              onResult={(text) => setNotes((prev) => (prev ? prev + ' ' + text : text))}
            />
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('notes_placeholder')}
            rows={3}
            className="notes-textarea"
          />
        </div>

        {/* Action Button Bar */}
        <div className="triage-submit-bar">
          <button type="button" onClick={resetForm} className="btn-cancel-action">
            <RotateCcw size={18} />
            <span>{lang === 'ta' ? 'அழித்து மீண்டும் தொடங்கு' : 'Reset Form'}</span>
          </button>

          <button type="submit" className="btn-primary-action submit-triage">
            <CheckCircle size={24} />
            <span>{lang === 'ta' ? 'முடிவை காண்க & சேமிக்க' : 'Calculate Triage & Save'}</span>
          </button>
        </div>
      </form>

      {/* Result Modal / Screen Takeover */}
      {showModal && currentResult && (
        <TriageResultModal
          result={currentResult}
          patient={patient}
          onSave={handleSaveAssessment}
          onCancel={() => setShowModal(false)}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}

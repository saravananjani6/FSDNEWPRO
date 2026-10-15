import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import * as Linking from 'expo-linking';
import DisclaimerBanner from '../components/DisclaimerBanner';
import SeverityFace from '../components/SeverityFace';
import BodyMap from '../components/BodyMap';
import { t } from '../services/i18n';
import { runTriage } from '../services/triageEngine';
import { listPatients, saveRecord } from '../storage/db';

const labels = {
  infant: 'Infant (< 1 yr)',
  child: 'Child (1-12 yrs)',
  adult: 'Adult (13-59 yrs)',
  older_adult: 'Older adult (60+ yrs)',
  today: 'Today / Just started',
  '1_2_days': '1 - 2 days',
  '3_plus_days': '3+ days (Prolonged)',
  mild: 'Mild',
  medium: 'Medium',
  severe: 'Severe',
  fever: 'Fever / Chills',
  cough: 'Cough / Cold',
  diarrhea: 'Loose stools / Diarrhea',
  vomiting: 'Vomiting / Nausea',
  headache: 'Headache',
  abdominal_pain: 'Stomach / Abdominal pain',
  rash: 'Skin rash / Itching',
  pregnancy_danger: 'Pregnancy danger signs',
  head: 'Head & Face',
  chest: 'Chest & Heart',
  belly: 'Abdomen / Belly',
  arm: 'Arms & Hands',
  leg: 'Legs & Feet',
  skin: 'Skin / Body'
};

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export default function TriageScreen({ tr, language, rules, setScreen }) {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isPatientStep, setIsPatientStep] = useState(true);

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [symptomSearch, setSymptomSearch] = useState('');
  const [triageResult, setTriageResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const translate = (key) => t(language, key);

  // Load patients on mount
  useEffect(() => {
    listPatients().then((list) => {
      setPatients(list || []);
      // If no patients registered yet, skip patient selection directly to triage
      if (!list || list.length === 0) {
        setIsPatientStep(false);
      }
    });
  }, []);

  const questions = rules?.questions || [];
  const currentQuestion = questions[stepIndex];

  // Speech read-aloud function
  function speakText(text) {
    Speech.stop();
    setIsSpeaking(true);
    const langCode = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-IN';
    Speech.speak(text, {
      language: langCode,
      rate: 0.9,
      onDone: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  }

  // Speak whenever the current question changes (after patient selection)
  useEffect(() => {
    if (!isPatientStep && currentQuestion && !triageResult) {
      speakText(translate(currentQuestion.textKey));
    }
    return () => {
      Speech.stop();
    };
  }, [stepIndex, isPatientStep, triageResult]);

  function handleSelectPatient(patient) {
    setSelectedPatient(patient);
    const initial = {};
    if (patient) {
      initial.patientLocalId = patient.localId;
      initial.village = patient.village;
      if (patient.ageGroup) initial.ageGroup = patient.ageGroup;
      if (typeof patient.isPregnant !== 'undefined') initial.pregnant = Boolean(patient.isPregnant);
    }
    setAnswers(initial);
    setIsPatientStep(false);
  }

  function handleAnswer(value) {
    const updated = { ...answers, [currentQuestion.id]: value };
    setAnswers(updated);

    if (stepIndex < questions.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      finishTriage(updated);
    }
  }

  async function finishTriage(finalAnswers) {
    Speech.stop();
    const result = runTriage(rules, finalAnswers, translate);
    setTriageResult(result);

    const record = {
      localId: uid('triage'),
      patientLocalId: finalAnswers.patientLocalId || selectedPatient?.localId || '',
      village: finalAnswers.village || selectedPatient?.village || '',
      ageGroup: finalAnswers.ageGroup || selectedPatient?.ageGroup || 'adult',
      isPregnant: Boolean(finalAnswers.pregnant || selectedPatient?.isPregnant),
      symptoms: finalAnswers.symptoms || [],
      answers: finalAnswers,
      result,
      ruleVersion: rules.version,
      updatedAt: new Date().toISOString()
    };

    await saveRecord(record);
    // Announce result via speech
    const speechResult = `${result.color === 'RED' ? 'Emergency.' : result.color === 'YELLOW' ? 'Visit clinic soon.' : 'Self-care at home.'} ${result.advice}`;
    speakText(speechResult);
  }

  // --- Patient Selection Step ---
  if (isPatientStep) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <BackHeader title="Patient Selection" onBack={() => setScreen('home')} />
        <DisclaimerBanner text={tr('disclaimer')} />

        <Text style={styles.stepTitle}>Who is this triage for?</Text>
        <Text style={styles.stepSubtitle}>
          Select a registered patient to link records, or proceed with a walk-in evaluation.
        </Text>

        <Pressable
          style={[styles.patientOption, styles.walkInOption]}
          onPress={() => handleSelectPatient(null)}
        >
          <View style={styles.patientIconCircle}>
            <Ionicons name="person-outline" size={24} color="#116149" />
          </View>
          <View style={styles.patientTextWrap}>
            <Text style={styles.patientName}>Walk-in / Anonymous Patient</Text>
            <Text style={styles.patientSub}>Proceed without pre-registered record</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#116149" />
        </Pressable>

        {patients.length > 0 && (
          <>
            <Text style={styles.listHeader}>Registered Patients ({patients.length})</Text>
            {patients.map((p) => (
              <Pressable
                key={p.localId}
                style={styles.patientOption}
                onPress={() => handleSelectPatient(p)}
              >
                <View style={[styles.patientIconCircle, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="person" size={24} color="#0284c7" />
                </View>
                <View style={styles.patientTextWrap}>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientSub}>
                    {p.village ? `${p.village} · ` : ''}{labels[p.ageGroup] || p.ageGroup}
                    {p.isPregnant ? ' · Pregnant' : ''}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#64748b" />
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    );
  }

  // --- Triage Result Screen ---
  if (triageResult) {
    const isRed = triageResult.color === 'RED';
    const isYellow = triageResult.color === 'YELLOW';
    const isGreen = triageResult.color === 'GREEN';

    const theme = isRed
      ? { bg: '#fef2f2', border: '#f87171', text: '#991b1b', badgeBg: '#fee2e2', icon: 'alert-circle' }
      : isYellow
      ? { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', badgeBg: '#fef3c7', icon: 'warning' }
      : { bg: '#f0fdf4', border: '#86efac', text: '#166534', badgeBg: '#dcfce7', icon: 'checkmark-circle' };

    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={[styles.resultCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <View style={[styles.resultIconCircle, { backgroundColor: theme.badgeBg }]}>
            <Ionicons name={theme.icon} size={48} color={theme.text} />
          </View>

          <View style={[styles.resultBadge, { backgroundColor: theme.badgeBg, borderColor: theme.border }]}>
            <Text style={[styles.resultBadgeText, { color: theme.text }]}>
              {isRed ? 'RED · URGENT HOSPITAL CARE' : isYellow ? 'YELLOW · VISIT CLINIC SOON' : 'GREEN · SELF-CARE AT HOME'}
            </Text>
          </View>

          <Text style={[styles.resultAdvice, { color: theme.text }]}>
            {triageResult.advice}
          </Text>

          {triageResult.reasons && triageResult.reasons.length > 0 && (
            <View style={styles.reasonsBox}>
              <Text style={styles.reasonsTitle}>Why this guidance was given:</Text>
              {triageResult.reasons.map((r, i) => (
                <View key={i} style={styles.reasonBullet}>
                  <Ionicons name="ellipse" size={8} color={theme.text} style={{ marginTop: 6 }} />
                  <Text style={styles.reasonText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {isRed && (
            <Pressable
              style={styles.emergencyCallBtn}
              onPress={() => Linking.openURL('tel:108')}
            >
              <Ionicons name="call" size={24} color="#ffffff" />
              <Text style={styles.emergencyCallText}>Call Ambulance / 108</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.findClinicBtn}
            onPress={() => setScreen('clinics')}
          >
            <Ionicons name="business" size={20} color="#116149" />
            <Text style={styles.findClinicText}>View Nearest Clinics & Doctors</Text>
          </Pressable>
        </View>

        <DisclaimerBanner text={tr('disclaimer')} />

        <Pressable style={styles.homeBtn} onPress={() => setScreen('home')}>
          <Text style={styles.homeBtnText}>Return to Home Dashboard</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // --- Question Flow ---
  const currentText = translate(currentQuestion.textKey);
  const filteredSymptoms = (rules.symptomList || []).filter((s) =>
    (labels[s] || s).toLowerCase().includes(symptomSearch.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {/* Top Header with Progress */}
      <View style={styles.flowHeader}>
        <Pressable
          onPress={() => {
            if (stepIndex > 0) setStepIndex(stepIndex - 1);
            else setScreen('home');
          }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color="#116149" />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>

        <Text style={styles.progressCounter}>
          {stepIndex + 1} / {questions.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarTrack}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${((stepIndex + 1) / questions.length) * 100}%` }
          ]}
        />
      </View>

      {/* Patient Name Tag if selected */}
      {selectedPatient && (
        <View style={styles.patientTag}>
          <Ionicons name="person" size={14} color="#0f766e" />
          <Text style={styles.patientTagText}>Patient: {selectedPatient.name}</Text>
        </View>
      )}

      {/* Question Card with Audio Replay */}
      <View style={styles.questionCard}>
        <View style={styles.questionCardTop}>
          <Text style={styles.questionText}>{currentText}</Text>
          <Pressable
            style={[styles.ttsSpeaker, isSpeaking && styles.ttsSpeakerActive]}
            onPress={() => speakText(currentText)}
          >
            <Ionicons
              name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
              size={26}
              color="#116149"
            />
          </Pressable>
        </View>
      </View>

      {/* Input Types */}
      {/* 1. Big Yes / No Buttons */}
      {currentQuestion.type === 'yesno' && (
        <View style={styles.yesNoContainer}>
          <Pressable
            style={[styles.bigChoiceButton, styles.yesButton]}
            onPress={() => handleAnswer(true)}
          >
            <Ionicons name="checkmark-circle" size={36} color="#ffffff" />
            <Text style={styles.yesButtonText}>{tr('yes')}</Text>
          </Pressable>

          <Pressable
            style={[styles.bigChoiceButton, styles.noButton]}
            onPress={() => handleAnswer(false)}
          >
            <Ionicons name="close-circle" size={36} color="#334155" />
            <Text style={styles.noButtonText}>{tr('no')}</Text>
          </Pressable>
        </View>
      )}

      {/* 2. Severity Faces (mild / medium / severe) */}
      {currentQuestion.type === 'choice' && currentQuestion.id === 'severity' && (
        <View style={styles.choicesWrap}>
          {currentQuestion.options.map((opt) => (
            <SeverityFace
              key={opt}
              option={opt}
              isSelected={answers.severity === opt}
              label={labels[opt] || opt}
              onPress={() => handleAnswer(opt)}
            />
          ))}
        </View>
      )}

      {/* 3. Duration Buttons & Standard Choices */}
      {currentQuestion.type === 'choice' && currentQuestion.id !== 'severity' && (
        <View style={styles.choicesWrap}>
          {currentQuestion.options.map((opt) => (
            <Pressable
              key={opt}
              style={[
                styles.choiceRow,
                answers[currentQuestion.id] === opt && styles.choiceRowSelected
              ]}
              onPress={() => handleAnswer(opt)}
            >
              <Text style={styles.choiceRowText}>{labels[opt] || opt}</Text>
              <Ionicons name="chevron-forward" size={22} color="#116149" />
            </Pressable>
          ))}
        </View>
      )}

      {/* 4. Interactive Body Map */}
      {currentQuestion.type === 'body' && (
        <BodyMap
          options={currentQuestion.options}
          selected={answers.bodyPart}
          onSelect={handleAnswer}
        />
      )}

      {/* 5. Searchable Offline Symptom List */}
      {currentQuestion.type === 'multi' && (
        <View style={styles.multiWrap}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder={tr('search')}
              value={symptomSearch}
              onChangeText={setSymptomSearch}
              placeholderTextColor="#94a3b8"
            />
            {symptomSearch ? (
              <Pressable onPress={() => setSymptomSearch('')}>
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.chipGrid}>
            {filteredSymptoms.map((s) => {
              const currentList = answers.symptoms || [];
              const isSelected = currentList.includes(s);
              return (
                <Pressable
                  key={s}
                  style={[styles.symptomChip, isSelected && styles.symptomChipOn]}
                  onPress={() => {
                    const next = isSelected
                      ? currentList.filter((x) => x !== s)
                      : [...currentList, s];
                    setAnswers({ ...answers, symptoms: next });
                  }}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                    size={18}
                    color={isSelected ? '#116149' : '#64748b'}
                  />
                  <Text style={[styles.chipText, isSelected && styles.chipTextOn]}>
                    {labels[s] || s}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.nextStepBtn}
            onPress={() => handleAnswer(answers.symptoms || [])}
          >
            <Text style={styles.nextStepText}>{tr('next')}</Text>
            <Ionicons name="arrow-forward" size={22} color="#ffffff" />
          </Pressable>
        </View>
      )}

      <DisclaimerBanner text={tr('disclaimer')} />
    </ScrollView>
  );
}

function BackHeader({ title, onBack }) {
  return (
    <View style={styles.backHeader}>
      <Pressable onPress={onBack} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#116149" />
        <Text style={styles.backBtnText}>Back</Text>
      </Pressable>
      <Text style={styles.backHeaderTitle}>{title}</Text>
      <View style={{ width: 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
    backgroundColor: '#edf4f1'
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingRight: 12
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#116149'
  },
  progressCounter: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b'
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#116149',
    borderRadius: 4
  },
  patientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start'
  },
  patientTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f766e'
  },
  questionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2
  },
  questionCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    justifyContent: 'space-between'
  },
  questionText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 32
  },
  ttsSpeaker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#e6f4ee',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0'
  },
  ttsSpeakerActive: {
    backgroundColor: '#bbf7d0'
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 14,
    marginVertical: 10
  },
  bigChoiceButton: {
    flex: 1,
    minHeight: 110,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },
  yesButton: {
    backgroundColor: '#15803d',
    borderWidth: 2,
    borderColor: '#166534'
  },
  yesButtonText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900'
  },
  noButton: {
    backgroundColor: '#f1f5f9',
    borderWidth: 2,
    borderColor: '#cbd5e1'
  },
  noButtonText: {
    color: '#1e293b',
    fontSize: 26,
    fontWeight: '900'
  },
  choicesWrap: {
    gap: 10,
    marginVertical: 8
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 18
  },
  choiceRowSelected: {
    borderColor: '#116149',
    backgroundColor: '#f0fdf4'
  },
  choiceRowText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b'
  },
  multiWrap: {
    gap: 12,
    marginVertical: 8
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a'
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  symptomChipOn: {
    backgroundColor: '#dcfce7',
    borderColor: '#116149'
  },
  chipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155'
  },
  chipTextOn: {
    color: '#116149',
    fontWeight: '800'
  },
  nextStepBtn: {
    backgroundColor: '#116149',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6
  },
  nextStepText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  // Patient Selection Styles
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  backHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 6
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20
  },
  patientOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginVertical: 4
  },
  walkInOption: {
    borderColor: '#116149',
    backgroundColor: '#f0fdfa'
  },
  patientIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  patientTextWrap: {
    flex: 1,
    gap: 2
  },
  patientName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  patientSub: {
    fontSize: 13,
    color: '#64748b'
  },
  listHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748b',
    marginTop: 10
  },
  // Result Screen Styles
  resultCard: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 22,
    alignItems: 'center',
    gap: 14,
    marginTop: 8
  },
  resultIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5
  },
  resultBadgeText: {
    fontSize: 13,
    fontWeight: '900'
  },
  resultAdvice: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30
  },
  reasonsBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginTop: 6
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155'
  },
  reasonBullet: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start'
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20
  },
  emergencyCallBtn: {
    width: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 6
  },
  emergencyCallText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900'
  },
  findClinicBtn: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#116149',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  findClinicText: {
    color: '#116149',
    fontSize: 15,
    fontWeight: '800'
  },
  homeBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  homeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  }
});

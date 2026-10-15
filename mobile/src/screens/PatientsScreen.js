import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { listPatients, savePatient } from '../storage/db';

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export default function PatientsScreen({ tr, setScreen }) {
  const [patients, setPatients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    ageGroup: 'adult',
    sex: 'female',
    village: '',
    phone: '',
    isPregnant: false
  });

  async function load() {
    const list = await listPatients();
    setPatients(list || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit() {
    if (!form.name.trim()) {
      Alert.alert('Required', 'Please enter patient name');
      return;
    }
    const record = {
      ...form,
      localId: uid('patient'),
      updatedAt: new Date().toISOString()
    };
    await savePatient(record);
    setForm({ name: '', ageGroup: 'adult', sex: 'female', village: '', phone: '', isPregnant: false });
    setShowForm(false);
    load();
    Alert.alert('Saved', 'Patient registered successfully on device.');
  }

  const filtered = patients.filter((p) =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.village || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => setScreen('home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#116149" />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{tr('patients')}</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name={showForm ? 'close' : 'person-add'} size={18} color="#ffffff" />
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : 'New'}</Text>
        </Pressable>
      </View>

      <DisclaimerBanner text={tr('disclaimer')} />

      {/* Registration Form Accordion */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Register Patient</Text>

          <Text style={styles.label}>Patient Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Anitha Devi"
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Village / Settlement</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Kaveri Nagar"
            value={form.village}
            onChangeText={(v) => setForm({ ...form, village: v })}
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Contact Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. +91 9876543210"
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Age Group</Text>
          <View style={styles.chipRow}>
            {[
              { id: 'infant', label: 'Infant (<1 yr)' },
              { id: 'child', label: 'Child (1-12 yrs)' },
              { id: 'adult', label: 'Adult (13-59 yrs)' },
              { id: 'older_adult', label: 'Senior (60+ yrs)' }
            ].map((item) => (
              <Pressable
                key={item.id}
                style={[styles.chip, form.ageGroup === item.id && styles.chipActive]}
                onPress={() => setForm({ ...form, ageGroup: item.id })}
              >
                <Text style={[styles.chipText, form.ageGroup === item.id && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Sex</Text>
          <View style={styles.chipRow}>
            {['female', 'male', 'other'].map((item) => (
              <Pressable
                key={item}
                style={[styles.chip, form.sex === item && styles.chipActive]}
                onPress={() => setForm({ ...form, sex: item })}
              >
                <Text style={[styles.chipText, form.sex === item && styles.chipTextActive]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {form.sex === 'female' && form.ageGroup === 'adult' && (
            <Pressable
              style={[styles.checkboxRow, form.isPregnant && styles.checkboxRowActive]}
              onPress={() => setForm({ ...form, isPregnant: !form.isPregnant })}
            >
              <Ionicons
                name={form.isPregnant ? 'checkbox' : 'square-outline'}
                size={24}
                color={form.isPregnant ? '#116149' : '#64748b'}
              />
              <Text style={styles.checkboxLabel}>Currently Pregnant</Text>
            </Pressable>
          )}

          <Pressable style={styles.submitBtn} onPress={handleSubmit}>
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            <Text style={styles.submitBtnText}>{tr('save')} Patient</Text>
          </Pressable>
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search registered patients..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>

      {/* Patients List */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          Registered Patients ({filtered.length})
        </Text>

        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyText}>No patients registered yet</Text>
            <Text style={styles.emptySub}>Tap '+ New' above to register members of your village</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <View key={item.localId} style={styles.patientCard}>
              <View style={styles.patientCardLeft}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={22} color="#116149" />
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientCardName}>{item.name}</Text>
                  <Text style={styles.patientCardMeta}>
                    {item.village ? `${item.village} · ` : ''}{item.ageGroup} · {item.sex}
                    {item.isPregnant ? ' · Pregnant' : ''}
                  </Text>
                  {item.phone ? <Text style={styles.patientCardPhone}>{item.phone}</Text> : null}
                </View>
              </View>

              <Pressable
                style={styles.triageThisBtn}
                onPress={() => setScreen('triage')}
              >
                <Ionicons name="pulse" size={16} color="#116149" />
                <Text style={styles.triageThisText}>Triage</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
    backgroundColor: '#edf4f1'
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#116149'
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#12362b'
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#116149',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 16,
    gap: 10
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: '#0f172a'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1'
  },
  chipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#116149'
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569'
  },
  chipTextActive: {
    color: '#116149',
    fontWeight: '800'
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8
  },
  checkboxRowActive: {},
  checkboxLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  submitBtn: {
    backgroundColor: '#116149',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
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
  listSection: {
    gap: 10
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569'
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    gap: 6
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569'
  },
  emptySub: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center'
  },
  patientCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  patientCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  patientInfo: {
    flex: 1,
    gap: 2
  },
  patientCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  patientCardMeta: {
    fontSize: 12,
    color: '#64748b'
  },
  patientCardPhone: {
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '600'
  },
  triageThisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: '#116149',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  triageThisText: {
    color: '#116149',
    fontSize: 13,
    fontWeight: '800'
  }
});

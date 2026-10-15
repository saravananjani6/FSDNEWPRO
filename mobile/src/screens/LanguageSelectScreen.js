import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { languages } from '../services/i18n';

export default function LanguageSelectScreen({ setLanguage }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="medical" size={44} color="#116149" />
        </View>
        <Text style={styles.title}>RuralCare</Text>
        <Text style={styles.subtitle}>Offline-First AI Symptom Triage</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>100% Offline Capable</Text>
        </View>
      </View>

      <View style={styles.pickerBox}>
        <Text style={styles.pickerTitle}>Select Your Language / மொழியை தேர்ந்தெடுக்கவும் / भाषा चुनें</Text>
        <View style={styles.list}>
          {languages.map((item) => (
            <Pressable
              key={item.code}
              style={({ pressed }) => [styles.langButton, pressed && styles.langButtonPressed]}
              onPress={() => setLanguage(item.code)}
            >
              <View style={styles.langLeft}>
                <Ionicons name="language" size={26} color="#116149" />
                <View>
                  <Text style={styles.langName}>{item.label}</Text>
                  <Text style={styles.langCode}>{item.code === 'en' ? 'English' : item.code === 'ta' ? 'Tamil' : 'Hindi'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.disclaimerText}>
          Guidance only. This is not a formal diagnosis.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    backgroundColor: '#edf4f1'
  },
  header: {
    alignItems: 'center',
    marginTop: 20
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#d8f0e5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#12362b'
  },
  subtitle: {
    fontSize: 16,
    color: '#475569',
    marginTop: 4
  },
  badge: {
    marginTop: 10,
    backgroundColor: '#bbf7d0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16
  },
  badgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700'
  },
  pickerBox: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d5e1dc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16
  },
  list: {
    gap: 12
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1'
  },
  langButtonPressed: {
    backgroundColor: '#e2e8f0',
    borderColor: '#116149'
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  langName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#12362b'
  },
  langCode: {
    fontSize: 12,
    color: '#64748b'
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 10
  },
  disclaimerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center'
  }
});

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { t } from './src/services/i18n';
import { pullLatestRules } from './src/services/sync';
import { getLatestRules, getSetting, initDb, setSetting } from './src/storage/db';

import HomeScreen from './src/screens/HomeScreen';
import TriageScreen from './src/screens/TriageScreen';
import PatientsScreen from './src/screens/PatientsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ClinicsScreen from './src/screens/ClinicsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SyncScreen from './src/screens/SyncScreen';
import LanguageSelectScreen from './src/screens/LanguageSelectScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [language, setLanguage] = useState(null);
  const [screen, setScreen] = useState('home');
  const [rules, setRules] = useState(null);

  const tr = (key) => t(language || 'en', key);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        const savedLang = await getSetting('language');
        if (savedLang) setLanguage(savedLang);

        const currentRules = await getLatestRules();
        setRules(currentRules);

        // Attempt non-blocking rule update check if online
        pullLatestRules()
          .then((res) => {
            if (res.updated) getLatestRules().then(setRules);
          })
          .catch(() => {});
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  async function handleSelectLanguage(code) {
    await setSetting('language', code);
    setLanguage(code);
    setScreen('home');
  }

  if (!ready || !rules) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#edf4f1" />
        <ActivityIndicator size="large" color="#116149" />
        <Text style={styles.loadingText}>Initializing RuralCare...</Text>
        <Text style={styles.loadingSub}>Loading offline medical engine & local database</Text>
      </SafeAreaView>
    );
  }

  // First launch or explicit language switch
  if (!language || screen === 'language') {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#edf4f1" />
        <LanguageSelectScreen setLanguage={handleSelectLanguage} />
      </SafeAreaView>
    );
  }

  const screenProps = {
    tr,
    language,
    rules,
    setScreen,
    openLanguageSelect: () => setScreen('language')
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#edf4f1" />
      {screen === 'home' && <HomeScreen {...screenProps} />}
      {screen === 'triage' && <TriageScreen {...screenProps} />}
      {screen === 'patients' && <PatientsScreen {...screenProps} />}
      {screen === 'history' && <HistoryScreen {...screenProps} />}
      {screen === 'clinics' && <ClinicsScreen {...screenProps} />}
      {screen === 'login' && <LoginScreen {...screenProps} />}
      {screen === 'sync' && <SyncScreen {...screenProps} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#edf4f1'
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#edf4f1',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10
  },
  loadingText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#12362b'
  },
  loadingSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center'
  }
});

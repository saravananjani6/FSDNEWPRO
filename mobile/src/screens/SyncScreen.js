import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { getCurrentUser, getToken } from '../services/auth';
import { getApiUrl, getSyncStatus, pullLatestRules, syncNow } from '../services/sync';
import { getLatestRules, setSetting } from '../storage/db';

export default function SyncScreen({ tr, setScreen }) {
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ online: false, pendingRecords: 0, pendingPatients: 0 });
  const [currentRuleVersion, setCurrentRuleVersion] = useState(1);
  const [apiUrl, setApiUrl] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSyncMessage, setLastSyncMessage] = useState('');

  async function refresh() {
    setUser(await getCurrentUser());
    setSyncStatus(await getSyncStatus());
    const rules = await getLatestRules();
    setCurrentRuleVersion(rules?.version || 1);
    setApiUrl(await getApiUrl());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSync() {
    setSyncing(true);
    setLastSyncMessage('');
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Worker Login Required', 'Please log in as a Health Worker to sync records to the central server.', [
          { text: 'Go to Login', onPress: () => setScreen('login') },
          { text: 'Cancel' }
        ]);
        setSyncing(false);
        return;
      }
      const res = await syncNow(token);
      setLastSyncMessage(res.message);
      await refresh();
      Alert.alert(res.ok ? 'Sync Complete' : 'Sync Notice', res.message);
    } catch (err) {
      setLastSyncMessage(`Error: ${err.message}`);
      Alert.alert('Sync Failed', err.message || 'Network error');
    } finally {
      setSyncing(false);
    }
  }

  async function handleCheckRules() {
    try {
      const res = await pullLatestRules();
      if (res.updated) {
        Alert.alert('Rules Updated', `New rule set version ${res.version} downloaded and installed locally.`);
        refresh();
      } else {
        Alert.alert('Rules Up to Date', `Device already has latest rule version (v${res.version || currentRuleVersion}).`);
      }
    } catch (err) {
      Alert.alert('Check Failed', err.message);
    }
  }

  async function handleSaveApiUrl() {
    if (!apiUrl.trim()) return;
    await setSetting('customApiUrl', apiUrl.trim());
    Alert.alert('Saved', `Server API URL set to: ${apiUrl.trim()}`);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => setScreen('home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#116149" />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{tr('sync')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <DisclaimerBanner text={tr('disclaimer')} />

      {/* Network Connectivity Card */}
      <View style={[styles.statusCard, syncStatus.online ? styles.statusCardOnline : styles.statusCardOffline]}>
        <View style={styles.statusLeft}>
          <Ionicons
            name={syncStatus.online ? 'wifi' : 'cloud-offline'}
            size={32}
            color={syncStatus.online ? '#15803d' : '#b91c1c'}
          />
          <View>
            <Text style={[styles.statusTitle, { color: syncStatus.online ? '#166534' : '#991b1b' }]}>
              {syncStatus.online ? 'Device is Online' : 'Device is Offline'}
            </Text>
            <Text style={styles.statusSub}>
              {syncStatus.online ? 'Can reach central API and upload logs' : 'Records are stored safely in local SQLite'}
            </Text>
          </View>
        </View>
      </View>

      {/* Unsynced Queue Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Local SQLite Data Queue</Text>
        <View style={styles.queueGrid}>
          <View style={styles.queueItem}>
            <Text style={styles.queueCount}>{syncStatus.pendingRecords}</Text>
            <Text style={styles.queueLabel}>Pending Triage Records</Text>
          </View>
          <View style={styles.queueItem}>
            <Text style={styles.queueCount}>{syncStatus.pendingPatients}</Text>
            <Text style={styles.queueLabel}>Pending Patient Profiles</Text>
          </View>
        </View>

        {lastSyncMessage ? (
          <View style={styles.syncNotice}>
            <Text style={styles.syncNoticeText}>{lastSyncMessage}</Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.syncNowBtn, syncing && styles.syncNowBtnDisabled]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Ionicons name="cloud-upload" size={22} color="#ffffff" />
          <Text style={styles.syncNowText}>
            {syncing ? 'Syncing...' : 'Sync Pending Data Now'}
          </Text>
        </Pressable>
      </View>

      {/* Local Clinical Rules Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="git-branch-outline" size={24} color="#116149" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>WHO IMCI Clinical Rule Set</Text>
            <Text style={styles.cardSub}>Local Engine Version: v{currentRuleVersion}</Text>
          </View>
        </View>
        <Text style={styles.bodyText}>
          Triage runs 100% offline using this local JSON ruleset. Whenever an internet connection is available, the app checks if the administration portal has published a newer version.
        </Text>
        <Pressable style={styles.secondaryBtn} onPress={handleCheckRules}>
          <Ionicons name="refresh" size={18} color="#116149" />
          <Text style={styles.secondaryBtnText}>Check for Rule Updates</Text>
        </Pressable>
      </View>

      {/* Server Endpoint Configuration */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backend Server Configuration</Text>
        <Text style={styles.cardSub}>
          Android Emulator: http://10.0.2.2:5000/api{'\n'}
          Physical Device on Wi-Fi: http://&lt;PC-LAN-IP&gt;:5000/api
        </Text>
        <TextInput
          style={styles.input}
          value={apiUrl}
          onChangeText={setApiUrl}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://10.0.2.2:5000/api"
          placeholderTextColor="#94a3b8"
        />
        <Pressable style={styles.saveBtn} onPress={handleSaveApiUrl}>
          <Text style={styles.saveBtnText}>Update Server URL</Text>
        </Pressable>
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
  statusCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16
  },
  statusCardOnline: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac'
  },
  statusCardOffline: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5'
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: '800'
  },
  statusSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 18,
    gap: 12
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  cardSub: {
    fontSize: 12,
    color: '#64748b'
  },
  queueGrid: {
    flexDirection: 'row',
    gap: 12
  },
  queueItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    alignItems: 'center',
    gap: 4
  },
  queueCount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#116149'
  },
  queueLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center'
  },
  syncNotice: {
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#99f6e4'
  },
  syncNoticeText: {
    fontSize: 13,
    color: '#0f766e',
    fontWeight: '600'
  },
  syncNowBtn: {
    backgroundColor: '#116149',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  syncNowBtnDisabled: {
    opacity: 0.6
  },
  syncNowText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  bodyText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18
  },
  secondaryBtn: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: '#116149',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  secondaryBtnText: {
    color: '#116149',
    fontSize: 14,
    fontWeight: '800'
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#0f172a'
  },
  saveBtn: {
    backgroundColor: '#334155',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});

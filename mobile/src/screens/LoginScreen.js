import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { getCurrentUser, login, logout } from '../services/auth';

export default function LoginScreen({ tr, setScreen }) {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('worker@ruralcare.local');
  const [password, setPassword] = useState('WorkerPass123');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password);
      setUser(loggedUser);
      Alert.alert('Success', `Welcome back, ${loggedUser.name}! Background sync is now enabled.`);
      setScreen('home');
    } catch (err) {
      Alert.alert('Login failed', err.message || 'Please check network and credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    setUser(null);
    Alert.alert('Logged out', 'You are now browsing in patient offline mode.');
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => setScreen('home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#116149" />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Health Worker</Text>
        <View style={{ width: 60 }} />
      </View>

      <DisclaimerBanner text={tr('disclaimer')} />

      {user ? (
        <View style={styles.profileCard}>
          <View style={styles.profileIconCircle}>
            <Ionicons name="shield-checkmark" size={36} color="#116149" />
          </View>
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileRole}>Field Health Worker ({user.role})</Text>
          <Text style={styles.profileVillage}>Village: {user.village || 'Field Assigned'}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>

          <View style={styles.syncReadyBadge}>
            <Ionicons name="checkmark-done-circle" size={20} color="#166534" />
            <Text style={styles.syncReadyText}>Authenticated for Cloud Sync</Text>
          </View>

          <Pressable style={styles.syncNavBtn} onPress={() => setScreen('sync')}>
            <Ionicons name="cloud-upload" size={18} color="#ffffff" />
            <Text style={styles.syncNavText}>Go to Sync Dashboard</Text>
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#b91c1c" />
            <Text style={styles.logoutText}>Log Out from this Device</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.loginForm}>
          <View style={styles.loginIntro}>
            <View style={styles.loginIconCircle}>
              <Ionicons name="person" size={28} color="#116149" />
            </View>
            <Text style={styles.loginTitle}>Worker Authentication</Text>
            <Text style={styles.loginSub}>
              Allows community health workers to register multiple patients and sync triage logs with the central primary health centre.
            </Text>
          </View>

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="worker@ruralcare.local"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="WorkerPass123"
            placeholderTextColor="#94a3b8"
          />

          <Pressable
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Ionicons name="log-in" size={20} color="#ffffff" />
            <Text style={styles.loginBtnText}>{loading ? 'Verifying...' : 'Login & Enable Sync'}</Text>
          </Pressable>

          <View style={styles.seedHint}>
            <Text style={styles.seedHintTitle}>Default Health Worker Demo:</Text>
            <Text style={styles.seedHintText}>worker@ruralcare.local / WorkerPass123</Text>
          </View>
        </View>
      )}
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
  loginForm: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 20,
    gap: 12
  },
  loginIntro: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  loginIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a'
  },
  loginSub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18
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
    padding: 14,
    fontSize: 16,
    color: '#0f172a'
  },
  loginBtn: {
    backgroundColor: '#116149',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8
  },
  loginBtnDisabled: {
    opacity: 0.6
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  seedHint: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 6
  },
  seedHintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  seedHintText: {
    fontSize: 12,
    color: '#0f766e',
    fontWeight: '600',
    marginTop: 2
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: 24,
    alignItems: 'center',
    gap: 8
  },
  profileIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a'
  },
  profileRole: {
    fontSize: 14,
    fontWeight: '700',
    color: '#116149'
  },
  profileVillage: {
    fontSize: 14,
    color: '#475569'
  },
  profileEmail: {
    fontSize: 13,
    color: '#94a3b8'
  },
  syncReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8
  },
  syncReadyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534'
  },
  syncNavBtn: {
    width: '100%',
    backgroundColor: '#116149',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12
  },
  syncNavText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4
  },
  logoutText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '800'
  }
});

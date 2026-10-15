import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { getCurrentUser } from '../services/auth';
import { getSyncStatus } from '../services/sync';

export default function HomeScreen({ tr, language, setScreen, openLanguageSelect }) {
  const [user, setUser] = useState(null);
  const [syncInfo, setSyncInfo] = useState({ online: false, pendingRecords: 0, pendingPatients: 0 });

  useEffect(() => {
    getCurrentUser().then(setUser);
    getSyncStatus().then(setSyncInfo);
  }, []);

  const totalPending = syncInfo.pendingRecords + syncInfo.pendingPatients;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoCircle}>
            <Ionicons name="medical" size={24} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.appName}>{tr('app')}</Text>
            <Text style={styles.appTagline}>Offline AI Triage</Text>
          </View>
        </View>

        <Pressable style={styles.langBadge} onPress={openLanguageSelect}>
          <Ionicons name="language" size={16} color="#116149" />
          <Text style={styles.langBadgeText}>
            {language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिन्दी' : 'English'}
          </Text>
        </Pressable>
      </View>

      {/* Online / Offline status ribbon */}
      <View style={[styles.statusRibbon, syncInfo.online ? styles.statusOnline : styles.statusOffline]}>
        <Ionicons
          name={syncInfo.online ? 'wifi' : 'cloud-offline'}
          size={16}
          color={syncInfo.online ? '#166534' : '#991b1b'}
        />
        <Text style={[styles.statusText, syncInfo.online ? styles.textOnline : styles.textOffline]}>
          {syncInfo.online ? 'Online · Connected' : 'Offline Mode · All features work locally'}
        </Text>
        {totalPending > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{totalPending} unsynced</Text>
          </View>
        )}
      </View>

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner text={tr('disclaimer')} />

      {/* Worker Banner if logged in */}
      {user && (
        <View style={styles.workerBanner}>
          <Ionicons name="shield-checkmark" size={20} color="#15803d" />
          <Text style={styles.workerText}>Logged in: {user.name} ({user.village || 'Field'})</Text>
        </View>
      )}

      {/* Primary Hero Action */}
      <Pressable style={styles.heroButton} onPress={() => setScreen('triage')}>
        <View style={styles.heroContent}>
          <View style={styles.heroIconBox}>
            <Ionicons name="pulse" size={36} color="#ffffff" />
          </View>
          <View style={styles.heroTextBox}>
            <Text style={styles.heroTitle}>{tr('start')}</Text>
            <Text style={styles.heroSubtitle}>Guided step-by-step symptom assessment</Text>
          </View>
        </View>
        <Ionicons name="arrow-forward-circle" size={32} color="#ffffff" />
      </Pressable>

      {/* Action Grid */}
      <Text style={styles.sectionTitle}>Healthcare Tools</Text>
      <View style={styles.grid}>
        <ActionCard
          icon="people"
          title={tr('patients')}
          subtitle="Register village members"
          badge={null}
          onPress={() => setScreen('patients')}
        />
        <ActionCard
          icon="time"
          title={tr('history')}
          subtitle="Past evaluations"
          badge={totalPending > 0 ? `${totalPending}` : null}
          onPress={() => setScreen('history')}
        />
        <ActionCard
          icon="business"
          title={tr('clinics')}
          subtitle="Offline directory & call"
          badge={null}
          onPress={() => setScreen('clinics')}
        />
        <ActionCard
          icon="cloud-upload"
          title={tr('sync')}
          subtitle={totalPending > 0 ? `${totalPending} records pending` : 'All records synced'}
          badge={totalPending > 0 ? 'SYNC' : null}
          onPress={() => setScreen('sync')}
        />
      </View>

      {/* Health worker login card */}
      <Pressable style={styles.loginCard} onPress={() => setScreen('login')}>
        <View style={styles.loginCardLeft}>
          <Ionicons name="person-circle-outline" size={28} color="#116149" />
          <View>
            <Text style={styles.loginCardTitle}>
              {user ? 'Health Worker Account' : 'Health Worker Login'}
            </Text>
            <Text style={styles.loginCardSub}>
              {user ? 'Manage your sync credentials & profile' : 'Login to enable multi-patient cloud sync'}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </Pressable>
    </ScrollView>
  );
}

function ActionCard({ icon, title, subtitle, badge, onPress }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={styles.cardIconBox}>
          <Ionicons name={icon} size={24} color="#116149" />
        </View>
        {badge && (
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    gap: 14,
    backgroundColor: '#edf4f1'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#116149',
    alignItems: 'center',
    justifyContent: 'center'
  },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#12362b'
  },
  appTagline: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  langBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#116149',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  langBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#116149'
  },
  statusRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1
  },
  statusOnline: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0'
  },
  statusOffline: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1
  },
  textOnline: {
    color: '#166534'
  },
  textOffline: {
    color: '#991b1b'
  },
  pendingBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12
  },
  pendingBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  workerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86efac'
  },
  workerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534'
  },
  heroButton: {
    backgroundColor: '#116149',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#116149',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  heroTextBox: {
    flex: 1,
    gap: 4
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff'
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#d1fae5',
    lineHeight: 18
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 6
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 8
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  cardBadgeText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '800'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b'
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 16
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4
  },
  loginCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  loginCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1e293b'
  },
  loginCardSub: {
    fontSize: 12,
    color: '#64748b'
  }
});

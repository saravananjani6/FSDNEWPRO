import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { listHistory } from '../storage/db';

export default function HistoryScreen({ tr, setScreen }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    listHistory().then((res) => setItems(res || []));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => setScreen('home')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#116149" />
          <Text style={styles.backBtnText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{tr('history')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <DisclaimerBanner text={tr('disclaimer')} />

      <Text style={styles.sectionTitle}>Past Triage Evaluations ({items.length})</Text>

      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="time-outline" size={44} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No triage evaluations yet</Text>
          <Text style={styles.emptySub}>Perform a symptom triage from the home screen to see records here.</Text>
        </View>
      ) : (
        items.map((r) => {
          const isRed = r.result.color === 'RED';
          const isYellow = r.result.color === 'YELLOW';
          const isGreen = r.result.color === 'GREEN';

          const colorTheme = isRed
            ? { text: '#b91c1c', bg: '#fee2e2', border: '#fca5a5' }
            : isYellow
            ? { text: '#b45309', bg: '#fef3c7', border: '#fde68a' }
            : { text: '#15803d', bg: '#dcfce7', border: '#86efac' };

          const dateStr = r.updatedAt ? new Date(r.updatedAt).toLocaleString() : 'Recent';

          return (
            <View key={r.localId} style={[styles.card, { borderLeftColor: colorTheme.text }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: colorTheme.bg, borderColor: colorTheme.border }]}>
                  <Text style={[styles.badgeText, { color: colorTheme.text }]}>
                    {r.result.color}
                  </Text>
                </View>

                <View style={styles.syncStatusWrap}>
                  <Ionicons
                    name={r.synced ? 'cloud-done' : 'cloud-offline'}
                    size={16}
                    color={r.synced ? '#16a34a' : '#d97706'}
                  />
                  <Text style={[styles.syncStatusText, { color: r.synced ? '#16a34a' : '#d97706' }]}>
                    {r.synced ? 'Synced' : 'Pending Sync'}
                  </Text>
                </View>
              </View>

              <Text style={styles.adviceText}>{r.result.advice}</Text>

              {r.result.reasons && r.result.reasons.length > 0 && (
                <Text style={styles.reasonsSummary}>
                  Reason: {r.result.reasons.join(', ')}
                </Text>
              )}

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {r.ageGroup ? `${r.ageGroup} · ` : ''}
                  {r.village ? `${r.village} · ` : ''}
                  v{r.ruleVersion || 1}
                </Text>
                <Text style={styles.dateText}>{dateStr}</Text>
              </View>
            </View>
          );
        })
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569'
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 32,
    alignItems: 'center',
    gap: 8
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155'
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderLeftWidth: 6,
    padding: 16,
    gap: 10
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '900'
  },
  syncStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  syncStatusText: {
    fontSize: 11,
    fontWeight: '700'
  },
  adviceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 22
  },
  reasonsSummary: {
    fontSize: 13,
    color: '#475569',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8'
  }
});

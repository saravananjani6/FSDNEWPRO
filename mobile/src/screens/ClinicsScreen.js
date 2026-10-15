import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { listClinics } from '../storage/db';

export default function ClinicsScreen({ tr, setScreen }) {
  const [clinics, setClinics] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    listClinics().then((res) => setClinics(res || []));
  }, []);

  function handleCall(phone) {
    if (!phone) {
      Alert.alert('No phone', 'No phone number available for this facility.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Cannot call', `Unable to initiate call to ${phone}`);
    });
  }

  const filtered = clinics.filter((c) =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.village || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.services || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <Pressable onPress={() => setScreen('home')} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#116149" />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
              <Text style={styles.headerTitle}>{tr('clinics')}</Text>
              <View style={{ width: 60 }} />
            </View>

            <DisclaimerBanner text={tr('disclaimer')} />

            {/* Emergency Hotline Banner */}
            <View style={styles.emergencyBanner}>
              <View style={styles.emergencyLeft}>
                <Ionicons name="alert-circle" size={28} color="#ffffff" />
                <View>
                  <Text style={styles.emergencyTitle}>National Emergency Ambulance</Text>
                  <Text style={styles.emergencySub}>Toll-free 24/7 medical dispatch</Text>
                </View>
              </View>
              <Pressable style={styles.emergencyCallBtn} onPress={() => handleCall('108')}>
                <Ionicons name="call" size={18} color="#dc2626" />
                <Text style={styles.emergencyCallText}>Call 108</Text>
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search clinics, villages, services..."
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

            <Text style={styles.sectionTitle}>
              Local Facilities Available Offline ({filtered.length})
            </Text>
          </>
        }
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Ionicons name="business" size={22} color="#116149" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.clinicName}>{item.name}</Text>
                <Text style={styles.clinicVillage}>{item.village}</Text>
              </View>
            </View>

            {item.address ? (
              <View style={styles.metaLine}>
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text style={styles.metaLineText}>{item.address}</Text>
              </View>
            ) : null}

            {item.services ? (
              <View style={styles.servicesWrap}>
                {item.services.split(',').map((s) => (
                  <View key={s.trim()} style={styles.serviceChip}>
                    <Text style={styles.serviceText}>{s.trim()}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable style={styles.callButton} onPress={() => handleCall(item.phone)}>
              <Ionicons name="call" size={18} color="#ffffff" />
              <Text style={styles.callButtonText}>{tr('call')} {item.phone}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="medkit-outline" size={40} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No facilities found</Text>
            <Text style={styles.emptySub}>Check your search or sync with server to fetch clinics</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#edf4f1'
  },
  listContent: {
    padding: 18,
    gap: 14
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
  emergencyBanner: {
    backgroundColor: '#dc2626',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff'
  },
  emergencySub: {
    fontSize: 11,
    color: '#fecaca'
  },
  emergencyCallBtn: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  emergencyCallText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '900'
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    marginTop: 4
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 16,
    gap: 10,
    marginBottom: 10
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardInfo: {
    flex: 1,
    gap: 2
  },
  clinicName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  clinicVillage: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600'
  },
  metaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  metaLineText: {
    fontSize: 13,
    color: '#475569'
  },
  servicesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  serviceChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569'
  },
  callButton: {
    backgroundColor: '#116149',
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
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
    fontSize: 16,
    fontWeight: '800',
    color: '#475569'
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center'
  }
});

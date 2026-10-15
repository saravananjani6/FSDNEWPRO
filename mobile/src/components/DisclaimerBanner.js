import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DisclaimerBanner({ text }) {
  return (
    <View style={styles.banner}>
      <Ionicons name="information-circle" size={20} color="#9a3412" style={styles.icon} />
      <Text style={styles.text}>{text || 'Guidance only. This is not a diagnosis. In emergencies, call your local ambulance or visit a hospital immediately.'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginVertical: 6
  },
  icon: {
    flexShrink: 0
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: '#9a3412',
    lineHeight: 18,
    fontWeight: '600'
  }
});

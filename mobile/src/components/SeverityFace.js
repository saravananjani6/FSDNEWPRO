import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const faceConfig = {
  mild: {
    icon: 'happy-outline',
    color: '#15803d',
    bgColor: '#dcfce7',
    borderColor: '#86efac',
    title: 'Mild',
    desc: 'Noticeable but can carry on routine'
  },
  medium: {
    icon: 'remove-circle-outline',
    color: '#b45309',
    bgColor: '#fef3c7',
    borderColor: '#fde68a',
    title: 'Medium',
    desc: 'Uncomfortable, affects daily tasks'
  },
  severe: {
    icon: 'alert-circle-outline',
    color: '#b91c1c',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    title: 'Severe',
    desc: 'Intense, incapacitating, cannot endure'
  }
};

export default function SeverityFace({ option, isSelected, onPress, label }) {
  const cfg = faceConfig[option] || {
    icon: 'help-circle-outline',
    color: '#1e293b',
    bgColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    title: option,
    desc: ''
  };

  return (
    <Pressable
      style={[
        styles.card,
        { backgroundColor: isSelected ? cfg.bgColor : '#ffffff', borderColor: isSelected ? cfg.color : '#e2e8f0' },
        isSelected && styles.cardSelected
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: cfg.bgColor }]}>
        <Ionicons name={cfg.icon} size={36} color={cfg.color} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: cfg.color }]}>{label || cfg.title}</Text>
        <Text style={styles.desc}>{cfg.desc}</Text>
      </View>
      <Ionicons
        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
        size={24}
        color={isSelected ? cfg.color : '#cbd5e1'}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    marginVertical: 6,
    gap: 14
  },
  cardSelected: {
    borderWidth: 2.5
  },
  iconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textWrap: {
    flex: 1,
    gap: 2
  },
  title: {
    fontSize: 20,
    fontWeight: '800'
  },
  desc: {
    fontSize: 13,
    color: '#64748b'
  }
});

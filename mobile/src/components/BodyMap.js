import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const partIcons = {
  head: { icon: 'person-outline', label: 'Head & Face', color: '#6366f1' },
  chest: { icon: 'heart-outline', label: 'Chest & Breathing', color: '#ef4444' },
  belly: { icon: 'medkit-outline', label: 'Abdomen / Belly', color: '#f59e0b' },
  arm: { icon: 'fitness-outline', label: 'Arms & Hands', color: '#06b6d4' },
  leg: { icon: 'walk-outline', label: 'Legs & Feet', color: '#10b981' },
  skin: { icon: 'color-wand-outline', label: 'Skin & Rash', color: '#ec4899' }
};

export default function BodyMap({ options, selected, onSelect }) {
  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Tap the affected body region:</Text>
      <View style={styles.grid}>
        {options.map((part) => {
          const info = partIcons[part] || { icon: 'body-outline', label: part, color: '#0f766e' };
          const isSelected = selected === part;
          return (
            <Pressable
              key={part}
              style={[
                styles.tile,
                isSelected && { borderColor: info.color, backgroundColor: '#f0fdfa' }
              ]}
              onPress={() => onSelect(part)}
            >
              <View style={[styles.iconWrap, { backgroundColor: isSelected ? info.color : '#f1f5f9' }]}>
                <Ionicons name={info.icon} size={28} color={isSelected ? '#ffffff' : info.color} />
              </View>
              <Text style={[styles.label, isSelected && { color: info.color, fontWeight: '800' }]}>
                {info.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10
  },
  prompt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between'
  },
  tile: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    gap: 10
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center'
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center'
  }
});

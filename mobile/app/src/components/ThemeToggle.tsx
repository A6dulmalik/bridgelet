import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { useThemeColors } from '../hooks/useThemeColors';

type ThemeMode = 'light' | 'dark' | 'system';

const OPTIONS: { label: string; value: ThemeMode }[] = [
  { label: '☀️', value: 'light' },
  { label: '🌙', value: 'dark' },
  { label: '⚙️', value: 'system' },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      {OPTIONS.map(({ label, value }) => (
        <TouchableOpacity
          key={value}
          style={[styles.option, mode === value && { backgroundColor: colors.primary }]}
          onPress={() => setMode(value)}
          accessibilityLabel={`Set theme to ${value}`}
        >
          <Text style={styles.label}>{label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  option: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  label: { fontSize: 16 },
});

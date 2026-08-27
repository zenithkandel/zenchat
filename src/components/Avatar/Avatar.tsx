/**
 * ZenChat Component — Avatar
 *
 * Initial-based avatar with consistent color generation.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

interface AvatarProps {
  name: string;
  size?: number;
  userId?: string;
}

const AVATAR_COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
];

function getColorForName(name: string, userId?: string): string {
  const str = userId ?? name;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.trim().slice(0, 1).toUpperCase();
}

export function Avatar({ name, size = 44, userId }: AvatarProps) {
  const { colors } = useTheme();
  const bgColor = useMemo(() => getColorForName(name, userId), [name, userId]);
  const initials = useMemo(() => getInitials(name), [name]);
  const fontSize = size * 0.38;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bgColor,
        },
      ]}
      accessibilityLabel={`Avatar for ${name}`}
    >
      <Text style={[styles.text, { fontSize, lineHeight: fontSize * 1.2 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

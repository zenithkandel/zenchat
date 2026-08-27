/**
 * ZenChat Component — Empty State
 *
 * Thoughtful empty states with contextual actions.
 * Never "No data found."
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  primary?: boolean;
}

interface EmptyStateProps {
  title: string;
  subtitle: string;
  actions?: EmptyStateAction[];
}

export function EmptyState({ title, subtitle, actions }: EmptyStateProps) {
  const { colors, typography: typo, spacing: sp } = useTheme();

  return (
    <View style={[styles.container, { paddingHorizontal: sp.xxxl }]}>
      <Text style={[typo.title3, { color: colors.textPrimary, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text
        style={[
          typo.subheadline,
          {
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: sp.sm,
            lineHeight: 22,
          },
        ]}
      >
        {subtitle}
      </Text>

      {actions && actions.length > 0 && (
        <View style={[styles.actions, { marginTop: sp.xxl }]}>
          {actions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.button,
                {
                  backgroundColor: action.primary ? colors.accent : 'transparent',
                  borderColor: action.primary ? colors.accent : colors.border,
                  borderWidth: action.primary ? 0 : 1,
                  paddingHorizontal: sp.xxl,
                  paddingVertical: sp.md,
                  borderRadius: 12,
                },
              ]}
              onPress={action.onPress}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <Text
                style={[
                  typo.callout,
                  {
                    color: action.primary ? colors.accentText : colors.accent,
                    fontWeight: '600',
                  },
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    gap: 12,
    alignItems: 'center',
  },
  button: {
    minWidth: 180,
    alignItems: 'center',
  },
});

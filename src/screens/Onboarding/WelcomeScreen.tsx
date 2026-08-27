/**
 * ZenChat Screen — Welcome (Onboarding)
 *
 * First screen on fresh install. Explains the concept.
 * No permission prompts yet — just context.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import type { OnboardingStackParamList } from '../../app/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<OnboardingStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.background === '#FAFAFA' || colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentLight }]}>
            <Text style={styles.iconEmoji}>📡</Text>
          </View>

          <Text style={[typo.largeTitle, { color: colors.textPrimary, textAlign: 'center', marginTop: sp.xxl }]}>
            Connect nearby
          </Text>

          <Text
            style={[
              typo.body,
              {
                color: colors.textSecondary,
                textAlign: 'center',
                marginTop: sp.md,
                lineHeight: 24,
                paddingHorizontal: sp.xl,
              },
            ]}
          >
            Chat with people nearby using Bluetooth.{'\n'}
            No internet connection required.
          </Text>
        </View>

        <View style={[styles.features, { paddingHorizontal: sp.xxl }]}>
          <FeatureRow
            icon="🔒"
            title="Private"
            subtitle="No account, no phone number, no email"
            colors={colors}
          />
          <FeatureRow
            icon="📶"
            title="Offline"
            subtitle="Works without internet or Wi-Fi"
            colors={colors}
          />
          <FeatureRow
            icon="⚡"
            title="Direct"
            subtitle="Device-to-device communication"
            colors={colors}
          />
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + sp.xl, paddingHorizontal: sp.xxl }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accent, borderRadius: 14 }]}
          onPress={() => navigation.navigate('NameSetup')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue to set up your name"
        >
          <Text style={[typo.headline, { color: colors.accentText }]}>
            Get started
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function FeatureRow({
  icon,
  title,
  subtitle,
  colors,
}: {
  icon: string;
  title: string;
  subtitle: string;
  colors: any;
}) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.featureSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 36,
  },
  features: {
    marginTop: 48,
    gap: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureIcon: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  featureSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  bottom: {
    paddingHorizontal: 24,
  },
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

/**
 * ZenChat Screen — Name Setup (Onboarding)
 *
 * "Choose the name people nearby will see."
 * Only mandatory input. Generates local identity on continue.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useIdentityStore } from '../../state/stores/useIdentityStore';

export function NameSetupScreen() {
  const { colors, typography: typo, spacing: sp, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { createIdentity } = useIdentityStore();

  const isValid = name.trim().length >= 1 && name.trim().length <= 50;

  const handleContinue = () => {
    if (!isValid) return;
    createIdentity(name.trim());
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={[styles.content, { paddingTop: insets.top + sp.massive }]}>
        <Text style={[typo.title1, { color: colors.textPrimary }]}>
          Welcome
        </Text>

        <Text
          style={[
            typo.body,
            {
              color: colors.textSecondary,
              marginTop: sp.sm,
              lineHeight: 24,
            },
          ]}
        >
          Choose the name people nearby will see.
        </Text>

        <View style={[styles.inputContainer, { marginTop: sp.xxxl }]}>
          <Text style={[typo.caption1, { color: colors.textMuted, marginBottom: sp.sm }]}>
            Your name
          </Text>
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: name.length > 0 ? colors.accent : colors.inputBorder,
                borderRadius: radii.sm,
                color: colors.textPrimary,
                fontSize: 17,
              },
            ]}
            placeholder="Enter your name"
            placeholderTextColor={colors.inputPlaceholder}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={50}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            autoCapitalize="words"
            autoCorrect={false}
            accessibilityLabel="Your display name"
          />
          {name.length > 0 && (
            <Text style={[typo.caption2, { color: colors.textMuted, marginTop: sp.xs, textAlign: 'right' }]}>
              {name.trim().length}/50
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + sp.xl, paddingHorizontal: sp.xxl }]}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: isValid ? colors.accent : colors.surfacePressed,
              borderRadius: 14,
            },
          ]}
          onPress={handleContinue}
          disabled={!isValid}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Continue with this name"
          accessibilityState={{ disabled: !isValid }}
        >
          <Text
            style={[
              typo.headline,
              {
                color: isValid ? colors.accentText : colors.textMuted,
              },
            ]}
          >
            Continue
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  inputContainer: {},
  input: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
  },
  bottom: {},
  button: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

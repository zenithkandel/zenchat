import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { BrutalistButton } from '../components/BrutalistButton';
import { BrutalistCard } from '../components/BrutalistCard';
import { useIdentity } from '../identity/IdentityContext';
import { Radio } from 'lucide-react-native';

export const SetupScreen: React.FC = () => {
  const { setIdentity } = useIdentity();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name');
      return;
    }
    if (trimmed.length > 24) {
      setError('Name must be 24 characters or less');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await setIdentity(trimmed);
    } catch {
      setError("Couldn't save name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Brand Banner */}
          <View style={styles.brandBox}>
            <View style={styles.iconBox}>
              <Radio size={32} color={colors.white} strokeWidth={2.5} />
            </View>
            <Text style={[typography.hero, styles.heroTitle]}>ZENCHAT</Text>
            <Text style={[typography.subtitle, styles.heroSubtitle]}>
              Messages for people nearby.
            </Text>
          </View>

          {/* Form Card */}
          <BrutalistCard style={styles.formCard} shadowOffset={6}>
            <Text style={[typography.label, styles.fieldLabel]}>WHAT'S YOUR NAME?</Text>

            <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
              <TextInput
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (error) setError(null);
                }}
                placeholder="e.g. Alex"
                placeholderTextColor={colors.mutedText}
                style={[typography.title, styles.input]}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={24}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Text style={[typography.caption, styles.privacyNotice]}>
              No email. No phone. No account. Your name is only shared directly with people nearby.
            </Text>

            <BrutalistButton
              title="CONTINUE →"
              onPress={handleContinue}
              loading={loading}
              disabled={!name.trim()}
              variant="primary"
              style={styles.continueButton}
            />
          </BrutalistCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.black,
    borderRadius: borders.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: borders.thin,
    borderColor: colors.black,
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    textAlign: 'center',
    color: colors.black,
  },
  formCard: {
    width: '100%',
  },
  fieldLabel: {
    marginBottom: 10,
  },
  inputWrapper: {
    backgroundColor: colors.offWhite,
    borderWidth: borders.regular,
    borderColor: colors.black,
    borderRadius: borders.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  inputError: {
    borderColor: colors.black,
    backgroundColor: colors.white,
  },
  input: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.black,
    padding: 0,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.black,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  privacyNotice: {
    lineHeight: 18,
    marginBottom: 20,
  },
  continueButton: {
    marginTop: 8,
  },
});

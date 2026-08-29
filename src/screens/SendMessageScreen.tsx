import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { Header } from '../components/Header';
import { MessageInput } from '../components/MessageInput';
import { BrutalistButton } from '../components/BrutalistButton';
import { BrutalistCard } from '../components/BrutalistCard';
import { Peer } from '../transport/MessageTransport';
import { useTransport } from '../transport/TransportContext';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react-native';

interface SendMessageScreenProps {
  recipient: Peer;
  onBack: () => void;
  onSentSuccess: () => void;
}

export const SendMessageScreen: React.FC<SendMessageScreenProps> = ({
  recipient,
  onBack,
  onSentSuccess,
}) => {
  const { sendMessage } = useTransport();
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const initialLetter = recipient.displayName ? recipient.displayName.charAt(0).toUpperCase() : '?';
  const shortId = recipient.userId.length > 4 ? recipient.userId.substring(0, 4) : recipient.userId;

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Message cannot be empty');
      return;
    }

    if (trimmed.length > 500) {
      setError('Message too long');
      return;
    }

    try {
      setIsSending(true);
      setError(null);
      await sendMessage(recipient.userId, trimmed);

      // Show instant SENT feedback
      setIsSuccess(true);
      setTimeout(() => {
        onSentSuccess();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Couldn't send. Recipient is no longer nearby.");
      setIsSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Header
          title="NEARBY"
          subtitle={`To: ${recipient.displayName}`}
          onBack={onBack}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recipient Brutalist Card */}
          <BrutalistCard style={styles.recipientCard} shadowOffset={4}>
            <View style={styles.recipientRow}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarText}>{initialLetter}</Text>
              </View>
              <View style={styles.recipientInfo}>
                <Text style={[typography.title, styles.recipientName]}>
                  {recipient.displayName.toUpperCase()}
                </Text>
                <View style={styles.tagRow}>
                  <View style={styles.idBadge}>
                    <Text style={styles.idText}>ID · {shortId}</Text>
                  </View>
                  <View style={styles.nearbyBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.nearbyText}>NEARBY</Text>
                  </View>
                </View>
              </View>
            </View>
          </BrutalistCard>

          {/* Message Form */}
          <View style={styles.formContainer}>
            <Text style={[typography.label, styles.sectionTitle]}>SEND A MESSAGE</Text>

            <MessageInput
              value={text}
              onChangeText={(newText) => {
                setText(newText);
                if (error) setError(null);
              }}
              placeholder={`Write something to ${recipient.displayName}...`}
              editable={!isSending && !isSuccess}
              error={error}
            />

            {isSuccess ? (
              /* Success confirmation state */
              <BrutalistCard style={styles.successCard} shadowOffset={4}>
                <View style={styles.successRow}>
                  <CheckCircle2 size={24} color={colors.black} strokeWidth={2.5} />
                  <Text style={[typography.title, styles.successText]}>SENT</Text>
                </View>
              </BrutalistCard>
            ) : (
              /* Send action button */
              <BrutalistButton
                title={isSending ? 'SENDING...' : 'SEND →'}
                onPress={handleSend}
                loading={isSending}
                disabled={!text.trim() || isSending}
                icon={!isSending ? <Send size={18} color={colors.white} strokeWidth={2.5} /> : undefined}
                iconPosition="right"
                variant="primary"
                style={styles.sendButton}
              />
            )}

            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color={colors.black} strokeWidth={2} />
                <Text style={styles.bottomErrorText}>
                  {error}
                </Text>
              </View>
            )}
          </View>
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
    paddingHorizontal: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  recipientCard: {
    marginBottom: 16,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 46,
    height: 46,
    backgroundColor: colors.black,
    borderRadius: borders.radius.sm,
    borderWidth: borders.thin,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idBadge: {
    backgroundColor: colors.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borders.radius.sm,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  idText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.black,
  },
  nearbyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borders.radius.sm,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.black,
    marginRight: 4,
  },
  nearbyText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.black,
  },
  formContainer: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sendButton: {
    marginTop: 12,
  },
  successCard: {
    backgroundColor: colors.white,
    paddingVertical: 16,
    marginTop: 12,
    alignItems: 'center',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  successText: {
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  bottomErrorText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.black,
  },
});

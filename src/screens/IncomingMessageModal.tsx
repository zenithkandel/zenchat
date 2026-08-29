import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { BrutalistButton } from '../components/BrutalistButton';
import { BrutalistCard } from '../components/BrutalistCard';
import { MessagePacket } from '../protocol/MessagePacket';
import { MessageSquare, X } from 'lucide-react-native';

interface IncomingMessageModalProps {
  message: MessagePacket | null;
  onClose: () => void;
}

export const IncomingMessageModal: React.FC<IncomingMessageModalProps> = ({
  message,
  onClose,
}) => {
  if (!message) return null;

  const initialLetter = message.senderName ? message.senderName.charAt(0).toUpperCase() : '?';
  const shortSenderId = message.senderId.length > 4 ? message.senderId.substring(0, 4) : message.senderId;

  return (
    <Modal
      visible={!!message}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            {/* Top Notification Badge */}
            <View style={styles.notificationTag}>
              <MessageSquare size={16} color={colors.white} strokeWidth={2.5} />
              <Text style={styles.tagText}>NEW MESSAGE</Text>
            </View>

            {/* Main Message Brutalist Card */}
            <BrutalistCard style={styles.card} shadowOffset={6}>
              {/* Sender Info Row */}
              <View style={styles.senderHeader}>
                <View style={styles.senderAvatar}>
                  <Text style={styles.avatarLetter}>{initialLetter}</Text>
                </View>
                <View style={styles.senderDetails}>
                  <Text style={styles.fromLabel}>FROM</Text>
                  <Text style={[typography.hero, styles.senderName]} numberOfLines={1}>
                    {message.senderName.toUpperCase()}
                  </Text>
                  <View style={styles.senderIdBadge}>
                    <Text style={styles.senderIdText}>ID · {shortSenderId}</Text>
                  </View>
                </View>
              </View>

              {/* Message Content Box */}
              <View style={styles.messageBox}>
                <ScrollView
                  style={styles.messageScroll}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={[typography.title, styles.messageBody]}>
                    {message.text}
                  </Text>
                </ScrollView>
              </View>

              {/* Action Button */}
              <BrutalistButton
                title="CLOSE"
                onPress={onClose}
                icon={<X size={18} color={colors.white} strokeWidth={2.5} />}
                iconPosition="left"
                variant="primary"
                style={styles.closeButton}
                shadowOffset={4}
              />
            </BrutalistCard>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
  },
  notificationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.black,
    borderWidth: borders.regular,
    borderColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borders.radius.md,
    gap: 8,
    marginBottom: -16,
    zIndex: 10,
  },
  tagText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.white,
    padding: 24,
    paddingTop: 32,
  },
  senderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: borders.regular,
    borderBottomColor: colors.black,
  },
  senderAvatar: {
    width: 56,
    height: 56,
    backgroundColor: colors.black,
    borderRadius: borders.radius.sm,
    borderWidth: borders.thin,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarLetter: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
  },
  senderDetails: {
    flex: 1,
  },
  fromLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.mutedText,
  },
  senderName: {
    fontSize: 24,
    lineHeight: 28,
    marginVertical: 2,
  },
  senderIdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borders.radius.sm,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  senderIdText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.black,
  },
  messageBox: {
    backgroundColor: colors.offWhite,
    borderWidth: borders.regular,
    borderColor: colors.black,
    borderRadius: borders.radius.md,
    padding: 16,
    minHeight: 140,
    maxHeight: 280,
    marginBottom: 20,
  },
  messageScroll: {
    flex: 1,
  },
  messageBody: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.black,
  },
  closeButton: {
    marginTop: 4,
  },
});

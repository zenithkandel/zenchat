/**
 * ZenChat Screen — Chat
 *
 * Individual conversation screen.
 * Clean bubbles, status indicators, composer.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useIdentityStore } from '../../state/stores/useIdentityStore';
import { useConversationStore, type ChatMessage } from '../../state/stores/useConversationStore';
import { MessageBubble } from '../../components/MessageBubble/MessageBubble';
import { ConnectionBadge } from '../../components/ConnectionBadge/ConnectionBadge';
import { Avatar } from '../../components/Avatar/Avatar';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';

import { chatService } from '../../chat/chatService';

type ChatRoute = RouteProp<RootStackParamList, 'Chat'>;

const MAX_MESSAGE_LENGTH = 4096;

export function ChatScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatRoute>();
  const { peerUserId, peerDisplayName } = route.params;
  const { colors, typography: typo, spacing: sp, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const identity = useIdentityStore(s => s.identity);
  const { getOrCreateConversation, getMessages, markConversationRead } = useConversationStore();

  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const conversation = getOrCreateConversation(peerUserId, peerDisplayName);
  const messages = getMessages(conversation.id);

  // Mark as read and ensure chat service is initialized
  useEffect(() => {
    chatService.initialize();
    markConversationRead(conversation.id);
  }, [conversation.id, markConversationRead]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || !identity) return;

    setText('');

    try {
      await chatService.sendMessage(peerUserId, peerDisplayName, trimmed);
    } catch {
      // Message queue handles retry
    }

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [text, identity, peerDisplayName, peerUserId]);

  const canSend = text.trim().length > 0 && text.length <= MAX_MESSAGE_LENGTH;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle={colors.background === '#FAFAFA' || colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.borderLight,
            paddingTop: insets.top + sp.sm,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backArrow, { color: colors.accent }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Avatar name={peerDisplayName} size={32} userId={peerUserId} />
          <View style={styles.headerInfo}>
            <Text style={[typo.headline, { color: colors.textPrimary }]} numberOfLines={1}>
              {peerDisplayName}
            </Text>
            <ConnectionBadge state="nearby" compact />
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          paddingTop: sp.lg,
          paddingBottom: sp.lg,
          flexGrow: 1,
          justifyContent: messages.length === 0 ? 'center' : 'flex-end',
        }}
        renderItem={({ item }) => (
          <MessageBubble
            text={item.text}
            timestamp={item.timestamp}
            isSent={item.senderId === identity?.userId}
            status={item.status}
            onRetry={() => chatService.retryMessage(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={[typo.subheadline, { color: colors.textMuted, textAlign: 'center' }]}>
              Send a message to start the conversation
            </Text>
          </View>
        }
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
      />

      {/* Composer */}
      <View
        style={[
          styles.composer,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderLight,
            paddingBottom: insets.bottom + sp.sm,
          },
        ]}
      >
        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: colors.inputBackground,
              borderRadius: radii.xl,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                maxHeight: 120,
              },
            ]}
            placeholder="Write a message…"
            placeholderTextColor={colors.inputPlaceholder}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            accessibilityLabel="Message input"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: canSend ? colors.accent : 'transparent',
                borderRadius: 18,
              },
            ]}
            onPress={handleSend}
            disabled={!canSend}
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
          >
            <Text
              style={[
                styles.sendIcon,
                { color: canSend ? colors.accentText : colors.textMuted },
              ]}
            >
              ↑
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: {},
  composer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 16,
    paddingRight: 4,
    paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyChat: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
});

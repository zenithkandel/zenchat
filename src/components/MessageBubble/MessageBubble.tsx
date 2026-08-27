/**
 * ZenChat Component — Message Bubble
 *
 * Clean chat bubble with status indicators.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme';
import type { MessageStatus } from '../../state/stores/useConversationStore';

interface MessageBubbleProps {
  text: string;
  timestamp: number;
  isSent: boolean;
  status: MessageStatus;
  onLongPress?: () => void;
  onRetry?: () => void;
}

const STATUS_ICONS: Record<MessageStatus, string> = {
  pending: '○',
  sending: '◔',
  sent: '✓',
  delivered: '✓✓',
  read: '✓✓',
  failed: '!',
};

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

export function MessageBubble({
  text,
  timestamp,
  isSent,
  status,
  onLongPress,
  onRetry,
}: MessageBubbleProps) {
  const { colors, spacing: sp, radii } = useTheme();

  const isFailed = status === 'failed';
  const isRead = status === 'read';

  return (
    <View
      style={[
        styles.wrapper,
        { alignItems: isSent ? 'flex-end' : 'flex-start' },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={onLongPress}
        style={[
          styles.bubble,
          {
            backgroundColor: isFailed
              ? colors.dangerLight
              : isSent
                ? colors.bubbleSent
                : colors.bubbleReceived,
            borderRadius: radii.xl,
            maxWidth: '80%',
            paddingHorizontal: sp.lg,
            paddingVertical: sp.md,
            ...(isSent
              ? { borderBottomRightRadius: radii.xs }
              : { borderBottomLeftRadius: radii.xs }),
          },
        ]}
      >
        <Text
          style={[
            styles.text,
            {
              color: isSent ? colors.bubbleSentText : colors.bubbleReceivedText,
            },
          ]}
        >
          {text}
        </Text>

        <View style={styles.meta}>
          <Text
            style={[
              styles.time,
              {
                color: isSent
                  ? `${colors.bubbleSentText}99`
                  : colors.textMuted,
              },
            ]}
          >
            {formatTime(timestamp)}
          </Text>

          {isSent && (
            <Text
              style={[
                styles.status,
                {
                  color: isFailed
                    ? colors.danger
                    : isRead
                      ? colors.accent
                      : isSent
                        ? `${colors.bubbleSentText}99`
                        : colors.textMuted,
                },
              ]}
            >
              {STATUS_ICONS[status]}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {isFailed && onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={[styles.retryButton, { marginTop: sp.xs }]}
          accessibilityRole="button"
          accessibilityLabel="Retry sending message"
        >
          <Text style={[styles.retryText, { color: colors.danger }]}>
            Tap to retry
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginVertical: 2,
  },
  bubble: {
    minWidth: 80,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  time: {
    fontSize: 11,
  },
  status: {
    fontSize: 11,
  },
  retryButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

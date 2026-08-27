/**
 * ZenChat Screen — Chats List
 *
 * Recent conversations with last message preview and timestamps.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useConversationStore, type Conversation } from '../../state/stores/useConversationStore';
import { Avatar } from '../../components/Avatar/Avatar';
import { EmptyState } from '../../components/EmptyState/EmptyState';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export function ChatsListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, typography: typo, spacing: sp } = useTheme();
  const insets = useSafeAreaInsets();
  const conversations = useConversationStore(s => s.conversations);

  const sorted = [...conversations].sort(
    (a, b) => (b.lastMessageAt ?? b.updatedAt) - (a.lastMessageAt ?? a.updatedAt),
  );

  const openChat = useCallback((conv: Conversation) => {
    navigation.navigate('Chat', {
      peerUserId: conv.peerUserId,
      peerDisplayName: conv.peerDisplayName,
    });
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#FAFAFA' || colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />

      <View style={[styles.header, { paddingTop: insets.top + sp.xxl, paddingHorizontal: sp.xxl }]}>
        <Text style={[typo.title1, { color: colors.textPrimary }]}>Chats</Text>
      </View>

      {sorted.length === 0 ? (
        <EmptyState
          title="Start a conversation"
          subtitle="Connect to someone nearby to begin chatting."
          actions={[
            { label: 'Find nearby people', onPress: () => {}, primary: true },
          ]}
        />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingTop: sp.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { paddingHorizontal: sp.xxl, borderBottomColor: colors.borderLight }]}
              onPress={() => openChat(item)}
              activeOpacity={0.6}
              accessibilityLabel={`Chat with ${item.peerDisplayName}`}
            >
              <Avatar
                name={item.peerDisplayName}
                size={48}
                userId={item.peerUserId}
              />
              <View style={styles.rowInfo}>
                <View style={styles.rowTop}>
                  <Text
                    style={[typo.headline, { color: colors.textPrimary, flex: 1 }]}
                    numberOfLines={1}
                  >
                    {item.peerDisplayName}
                  </Text>
                  {item.lastMessageAt && (
                    <Text style={[typo.caption1, { color: colors.textMuted }]}>
                      {formatRelativeTime(item.lastMessageAt)}
                    </Text>
                  )}
                </View>
                {item.lastMessage && (
                  <Text
                    style={[typo.subheadline, { color: colors.textSecondary, marginTop: 2 }]}
                    numberOfLines={1}
                  >
                    {item.lastMessage}
                  </Text>
                )}
              </View>
              {item.unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.badgeText, { color: colors.accentText }]}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowInfo: { flex: 1 },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
});

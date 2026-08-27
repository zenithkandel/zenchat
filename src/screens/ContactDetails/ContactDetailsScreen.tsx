/**
 * ZenChat Screen — Contact Details
 *
 * View and manage saved contact:
 * - Local nickname assignment
 * - Trust / Verified status
 * - Block / Unblock contact
 * - Open Chat
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useContactStore } from '../../state/stores/useContactStore';
import { Avatar } from '../../components/Avatar/Avatar';
import { shortId } from '../../utils/uuid';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ContactRoute = RouteProp<RootStackParamList, any>;

export function ContactDetailsScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ContactRoute>();
  const { userId } = (route.params as { userId: string }) || { userId: '' };
  const { colors, typography: typo, spacing: sp, radii, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const contact = useContactStore(s => s.getContact(userId));
  const { setLocalNickname, trustContact, blockContact, unblockContact, removeContact } = useContactStore();

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(contact?.localNickname || '');

  if (!contact) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[typo.title3, { color: colors.textPrimary, textAlign: 'center', marginTop: 40 }]}>
          Contact not found
        </Text>
      </View>
    );
  }

  const handleSaveNickname = () => {
    setLocalNickname(contact.userId, nicknameInput.trim());
    setIsEditingNickname(false);
  };

  const handleToggleBlock = () => {
    if (contact.blocked) {
      unblockContact(contact.userId);
    } else {
      Alert.alert(
        'Block Contact?',
        `Messages from ${contact.displayName} will be ignored.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: () => blockContact(contact.userId) },
        ],
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Contact?',
      `Are you sure you want to remove ${contact.displayName} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeContact(contact.userId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleStartChat = () => {
    navigation.navigate('Chat', {
      peerUserId: contact.userId,
      peerDisplayName: contact.localNickname || contact.displayName,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView contentContainerStyle={{ paddingBottom: sp.massive }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + sp.md }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: colors.accent }]}>←</Text>
          </TouchableOpacity>
          <Text style={[typo.headline, { color: colors.textPrimary }]}>Contact</Text>
          <View style={styles.backButton} />
        </View>

        {/* Profile Card */}
        <View style={[styles.profileSection, { marginTop: sp.xl }]}>
          <Avatar name={contact.displayName} size={72} userId={contact.userId} />
          <Text style={[typo.title2, { color: colors.textPrimary, marginTop: sp.md }]}>
            {contact.displayName}
          </Text>
          {contact.localNickname ? (
            <Text style={[typo.subheadline, { color: colors.accent, marginTop: 2 }]}>
              "{contact.localNickname}"
            </Text>
          ) : null}
          <Text style={[typo.footnote, { color: colors.textMuted, marginTop: 4 }]}>
            ID ···· {shortId(contact.userId)}
          </Text>

          {/* Status Badges */}
          <View style={[styles.badgeRow, { marginTop: sp.md }]}>
            {contact.verified && (
              <View style={[styles.badge, { backgroundColor: colors.successLight }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>✓ Verified via QR</Text>
              </View>
            )}
            {contact.trusted && (
              <View style={[styles.badge, { backgroundColor: colors.accentLight }]}>
                <Text style={[styles.badgeText, { color: colors.accent }]}>Trusted</Text>
              </View>
            )}
            {contact.blocked && (
              <View style={[styles.badge, { backgroundColor: colors.dangerLight }]}>
                <Text style={[styles.badgeText, { color: colors.danger }]}>Blocked</Text>
              </View>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: colors.accent, borderRadius: radii.md, marginTop: sp.xl }]}
            onPress={handleStartChat}
          >
            <Text style={[typo.headline, { color: colors.accentText }]}>Send Message</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Group */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>LOCAL SETTINGS</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            {/* Nickname */}
            <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Local Nickname</Text>
              {isEditingNickname ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.nicknameInput, { color: colors.textPrimary, borderColor: colors.border }]}
                    value={nicknameInput}
                    onChangeText={setNicknameInput}
                    placeholder="Add nickname"
                    placeholderTextColor={colors.inputPlaceholder}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveNickname} style={styles.saveBtn}>
                    <Text style={{ color: colors.accent, fontWeight: '600' }}>Save</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setIsEditingNickname(true)}>
                  <Text style={[styles.rowValue, { color: contact.localNickname ? colors.textPrimary : colors.textMuted }]}>
                    {contact.localNickname || 'Set nickname ›'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Trust toggle */}
            {!contact.trusted && (
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: colors.borderLight }]}
                onPress={() => trustContact(contact.userId)}
              >
                <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Mark as Trusted</Text>
                <Text style={[styles.rowValue, { color: colors.accent }]}>Trust ›</Text>
              </TouchableOpacity>
            )}

            {/* Block toggle */}
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.borderLight }]}
              onPress={handleToggleBlock}
            >
              <Text style={[styles.rowLabel, { color: contact.blocked ? colors.accent : colors.danger }]}>
                {contact.blocked ? 'Unblock Contact' : 'Block Contact'}
              </Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity style={styles.row} onPress={handleDelete}>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>Remove Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24, fontWeight: '300' },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chatButton: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  section: {},
  sectionLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  group: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: 16 },
  rowValue: { fontSize: 16 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nicknameInput: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 14 },
  saveBtn: { paddingHorizontal: 8, paddingVertical: 4 },
});

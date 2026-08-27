/**
 * ZenChat Screen — Settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useIdentityStore } from '../../state/stores/useIdentityStore';
import { useConversationStore } from '../../state/stores/useConversationStore';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { colors, typography: typo, spacing: sp, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const { identity, resetIdentity } = useIdentityStore();
  const { clearAllData } = useConversationStore();

  const handleClearChats = () => {
    Alert.alert(
      'Clear chat history?',
      'This will permanently delete all your messages. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearAllData,
        },
      ],
    );
  };

  const handleResetIdentity = () => {
    Alert.alert(
      'Reset identity?',
      'This creates a new local identity. People who know your old identity will not automatically recognize this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: resetIdentity,
        },
      ],
    );
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Delete all local data?',
      'This removes messages, contacts, identity, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => {
            clearAllData();
            resetIdentity();
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={{ paddingBottom: sp.massive }}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + sp.lg }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backArrow, { color: colors.accent }]}>←</Text>
          </TouchableOpacity>
          <Text style={[typo.title2, { color: colors.textPrimary }]}>Settings</Text>
        </View>

        {/* Profile */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PROFILE</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Name</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>{identity?.displayName ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>PRIVACY</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <View style={[styles.infoRow]}>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                No account required. No internet required. Your identity is stored on this device.
              </Text>
            </View>
          </View>
        </View>

        {/* Storage */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>STORAGE</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={handleClearChats}>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>Clear chat history</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.row, { borderBottomColor: colors.borderLight }]} onPress={handleResetIdentity}>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>Reset identity</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.row]} onPress={handleClearAllData}>
              <Text style={[styles.rowLabel, { color: colors.danger }]}>Delete all local data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={[styles.section, { paddingHorizontal: sp.xxl, marginTop: sp.xxl }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ABOUT</Text>
          <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>App version</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>0.1.0</Text>
            </View>
            <View style={[styles.row]}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>Protocol version</Text>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>v1</Text>
            </View>
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backArrow: { fontSize: 24, fontWeight: '300' },
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
  infoRow: { padding: 16 },
  infoText: { fontSize: 14, lineHeight: 20 },
});

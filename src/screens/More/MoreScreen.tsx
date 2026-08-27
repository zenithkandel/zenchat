/**
 * ZenChat Screen — More
 *
 * Hub for Settings, QR, Diagnostics, Packet Lab.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useIdentityStore } from '../../state/stores/useIdentityStore';
import { Avatar } from '../../components/Avatar/Avatar';
import { shortId } from '../../utils/uuid';
import type { RootStackParamList } from '../../app/navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MenuItemProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  colors: any;
}

function MenuItem({ icon, label, subtitle, onPress, danger, colors }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityLabel={label}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuLabel, { color: danger ? colors.danger : colors.textPrimary }]}>
          {label}
        </Text>
        {subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

export function MoreScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, typography: typo, spacing: sp, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const identity = useIdentityStore(s => s.identity);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.background === '#FAFAFA' || colors.background === '#FFFFFF' ? 'dark-content' : 'light-content'} />

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + sp.xxl, paddingBottom: sp.massive }}>
        <View style={{ paddingHorizontal: sp.xxl }}>
          <Text style={[typo.title1, { color: colors.textPrimary }]}>More</Text>
        </View>

        {/* Profile Card */}
        <TouchableOpacity
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.md,
              marginHorizontal: sp.xxl,
              marginTop: sp.xxl,
            },
          ]}
          onPress={() => navigation.navigate('MyQR')}
          activeOpacity={0.7}
          accessibilityLabel="View your profile and QR code"
        >
          <Avatar
            name={identity?.displayName ?? '?'}
            size={56}
            userId={identity?.userId}
          />
          <View style={styles.profileInfo}>
            <Text style={[typo.title3, { color: colors.textPrimary }]}>
              {identity?.displayName ?? 'Unknown'}
            </Text>
            <Text style={[typo.footnote, { color: colors.textMuted }]}>
              ID ···· {identity ? shortId(identity.userId) : '????'}
            </Text>
          </View>
          <Text style={[styles.menuArrow, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* Menu Sections */}
        <View style={[styles.section, { marginTop: sp.xxxl, paddingHorizontal: sp.xxl }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            IDENTITY
          </Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <MenuItem icon="📱" label="My QR Code" subtitle="Share your identity" onPress={() => navigation.navigate('MyQR')} colors={colors} />
            <MenuItem icon="📷" label="Scan QR Code" subtitle="Identify and verify nearby contacts" onPress={() => navigation.navigate('ScanQR')} colors={colors} />
          </View>
        </View>

        <View style={[styles.section, { marginTop: sp.xxl, paddingHorizontal: sp.xxl }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            DEVELOPER
          </Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <MenuItem icon="🧪" label="Packet Lab" subtitle="Send and inspect JSON packets" onPress={() => navigation.navigate('PacketLab')} colors={colors} />
            <MenuItem icon="🔧" label="Diagnostics" subtitle="BLE status, logs, and tests" onPress={() => navigation.navigate('Diagnostics')} colors={colors} />
          </View>
        </View>

        <View style={[styles.section, { marginTop: sp.xxl, paddingHorizontal: sp.xxl }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
            APP
          </Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radii.md }]}>
            <MenuItem icon="⚙️" label="Settings" subtitle="Theme, privacy, storage" onPress={() => navigation.navigate('Settings')} colors={colors} />
          </View>
        </View>

        {/* Version */}
        <View style={[styles.version, { marginTop: sp.xxxl }]}>
          <Text style={[typo.caption2, { color: colors.textMuted, textAlign: 'center' }]}>
            ZenChat v0.1.0 · Protocol v1
          </Text>
          <Text style={[typo.caption2, { color: colors.textMuted, textAlign: 'center', marginTop: 2 }]}>
            No internet required
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 14,
  },
  profileInfo: { flex: 1 },
  section: {},
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  menuGroup: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  menuIcon: { fontSize: 22, width: 30, textAlign: 'center' },
  menuTextContainer: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: '500' },
  menuSubtitle: { fontSize: 13, marginTop: 2 },
  menuArrow: { fontSize: 22, fontWeight: '300' },
  version: { paddingHorizontal: 24 },
});

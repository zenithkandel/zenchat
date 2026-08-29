import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onBack?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'ZENCHAT',
  subtitle = 'Messages nearby.',
  onBack,
  onRefresh,
  isRefreshing = false,
  rightAction,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.leftRow}>
        {onBack && (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.black} strokeWidth={2.5} />
          </Pressable>
        )}
        <View>
          <Text style={[typography.hero, styles.titleText]}>{title}</Text>
          {subtitle ? (
            <Text style={[typography.caption, styles.subtitleText]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightRow}>
        {onRefresh && (
          <Pressable
            onPress={onRefresh}
            disabled={isRefreshing}
            accessibilityRole="button"
            accessibilityLabel="Refresh nearby list"
            style={[styles.actionButton, isRefreshing && styles.refreshing]}
          >
            <RefreshCw size={18} color={colors.black} strokeWidth={2.5} />
          </Pressable>
        )}
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: borders.regular,
    borderBottomColor: colors.black,
    marginBottom: 12,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: borders.radius.sm,
    borderWidth: borders.regular,
    borderColor: colors.black,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleText: {
    lineHeight: 34,
  },
  subtitleText: {
    marginTop: 2,
    fontWeight: '700',
    color: colors.black,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: borders.radius.sm,
    borderWidth: borders.thin,
    borderColor: colors.black,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshing: {
    opacity: 0.5,
  },
});

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { Peer } from '../transport/MessageTransport';
import { ArrowRight } from 'lucide-react-native';

interface PeerCardProps {
  peer: Peer;
  onPress: (peer: Peer) => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const PeerCard: React.FC<PeerCardProps> = ({
  peer,
  onPress,
  disabled = false,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const shadowOffset = 5;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(animatedValue, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 0,
      speed: 24,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(animatedValue, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 20,
    }).start();
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shadowOffset - 1],
  });

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shadowOffset - 1],
  });

  const initialLetter = peer.displayName ? peer.displayName.charAt(0).toUpperCase() : '?';
  const shortId = peer.userId.length > 4 ? peer.userId.substring(0, 4) : peer.userId;

  return (
    <View style={[styles.wrapper, style]}>
      {/* Hard Offset Shadow */}
      <View
        style={[
          styles.shadow,
          {
            top: shadowOffset,
            left: shadowOffset,
          },
        ]}
      />

      {/* Tactile Animated Card */}
      <Animated.View
        style={[
          styles.card,
          {
            transform: [{ translateX }, { translateY }],
          },
        ]}
      >
        <Pressable
          onPress={() => onPress(peer)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${peer.displayName}, Nearby and available.`}
          style={styles.pressable}
        >
          {/* Avatar Box */}
          <View style={styles.avatarBox}>
            <Text style={styles.avatarText}>{initialLetter}</Text>
          </View>

          {/* Peer Info */}
          <View style={styles.infoContainer}>
            <View style={styles.nameRow}>
              <Text style={[typography.title, styles.nameText]} numberOfLines={1}>
                {peer.displayName.toUpperCase()}
              </Text>
              <View style={styles.idBadge}>
                <Text style={styles.idText}>ID · {shortId}</Text>
              </View>
            </View>

            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  peer.state === 'connecting' ? styles.connectingDot : styles.nearbyDot,
                ]}
              />
              <Text style={styles.statusText}>
                {peer.state === 'connecting' ? 'CONNECTING...' : 'NEARBY'}
              </Text>
            </View>
          </View>

          {/* Action Indicator */}
          <View style={styles.actionBox}>
            <ArrowRight size={20} color={colors.black} strokeWidth={2.5} />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginVertical: 7,
  },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.black,
    borderRadius: borders.radius.lg,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: borders.regular,
    borderColor: colors.black,
    borderRadius: borders.radius.lg,
    overflow: 'hidden',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.black,
    borderRadius: borders.radius.sm,
    borderWidth: borders.thin,
    borderColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    marginRight: 8,
    flexShrink: 1,
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  nearbyDot: {
    backgroundColor: colors.black,
  },
  connectingDot: {
    backgroundColor: colors.mutedText,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: colors.black,
  },
  actionBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

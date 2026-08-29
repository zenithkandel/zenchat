import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { borders } from '../theme/borders';
import { MAX_MESSAGE_LENGTH } from '../protocol/MessagePacket';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  editable?: boolean;
  style?: ViewStyle;
  error?: string | null;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Write a message...',
  maxLength = MAX_MESSAGE_LENGTH,
  editable = true,
  style,
  error,
}) => {
  const shadowOffset = 4;
  const charsRemaining = maxLength - value.length;
  const isNearLimit = charsRemaining <= 20;

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

      {/* Input Container */}
      <View style={[styles.inputBox, error ? styles.inputError : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedText}
          multiline
          maxLength={maxLength}
          editable={editable}
          style={[typography.body, styles.textInput]}
          textAlignVertical="top"
          autoFocus
          accessibilityLabel="Message input field"
        />

        {/* Footer with Counter and Optional Error */}
        <View style={styles.footerRow}>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : (
            <View style={styles.spacer} />
          )}
          <Text
            style={[
              styles.counterText,
              isNearLimit && styles.counterWarning,
            ]}
          >
            {value.length} / {maxLength}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    marginVertical: 12,
  },
  shadow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.black,
    borderRadius: borders.radius.md,
  },
  inputBox: {
    backgroundColor: colors.white,
    borderWidth: borders.regular,
    borderColor: colors.black,
    borderRadius: borders.radius.md,
    padding: 16,
    minHeight: 160,
  },
  inputError: {
    borderColor: colors.black,
  },
  textInput: {
    flex: 1,
    minHeight: 110,
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    padding: 0,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1.5,
    borderTopColor: colors.lightGray,
  },
  spacer: {
    flex: 1,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.black,
    textTransform: 'uppercase',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.mutedText,
  },
  counterWarning: {
    color: colors.black,
  },
});

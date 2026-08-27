/**
 * ZenChat Screen — Packet Lab
 *
 * Developer tool for sending/receiving JSON packets.
 * Preset selector, JSON editor, send, history.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { PACKET_PRESETS, type PacketPreset } from '../../protocol/packets/presets';

interface PacketHistoryEntry {
  id: string;
  type: string;
  direction: 'sent' | 'received';
  timestamp: number;
  status: 'success' | 'failed';
  json: string;
  size: number;
}

export function PacketLabScreen() {
  const navigation = useNavigation();
  const { colors, typography: typo, spacing: sp, radii } = useTheme();
  const insets = useSafeAreaInsets();

  const [selectedPreset, setSelectedPreset] = useState<PacketPreset>(PACKET_PRESETS[0]!);
  const [jsonText, setJsonText] = useState(JSON.stringify(PACKET_PRESETS[0]!.json, null, 2));
  const [isValid, setIsValid] = useState(true);
  const [history, setHistory] = useState<PacketHistoryEntry[]>([]);

  const handlePresetSelect = useCallback((preset: PacketPreset) => {
    setSelectedPreset(preset);
    const formatted = JSON.stringify(preset.json, null, 2);
    setJsonText(formatted);
    setIsValid(true);
  }, []);

  const handleJsonChange = useCallback((text: string) => {
    setJsonText(text);
    try {
      JSON.parse(text);
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  }, []);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setIsValid(true);
    } catch {
      Alert.alert('Invalid JSON', 'Cannot format invalid JSON');
    }
  }, [jsonText]);

  const handleValidate = useCallback(() => {
    try {
      JSON.parse(jsonText);
      Alert.alert('✓ Valid JSON', 'The JSON is syntactically valid.');
    } catch (e) {
      Alert.alert('✕ Invalid JSON', e instanceof Error ? e.message : 'Parse error');
    }
  }, [jsonText]);

  const handleSend = useCallback(() => {
    if (!isValid) {
      Alert.alert('Invalid JSON', 'Please fix the JSON before sending.');
      return;
    }

    // In a real implementation, this would send via the BLE transport
    const entry: PacketHistoryEntry = {
      id: Date.now().toString(),
      type: selectedPreset.type,
      direction: 'sent',
      timestamp: Date.now(),
      status: 'success',
      json: jsonText,
      size: jsonText.length,
    };

    setHistory(prev => [entry, ...prev]);
    Alert.alert('Packet Lab', 'Packet would be sent via BLE transport.\n\nREQUIRES PHYSICAL DEVICE VALIDATION');
  }, [isValid, jsonText, selectedPreset]);

  const handleReset = useCallback(() => {
    handlePresetSelect(PACKET_PRESETS[0]!);
  }, [handlePresetSelect]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
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
          <Text style={[typo.title2, { color: colors.textPrimary }]}>Packet Lab</Text>
        </View>

        {/* Preset Selector */}
        <View style={{ paddingHorizontal: sp.xxl, marginTop: sp.xxl }}>
          <Text style={[typo.caption1, { color: colors.textMuted, marginBottom: sp.sm }]}>PRESET</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
            {PACKET_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.type}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: preset.type === selectedPreset.type ? colors.accent : colors.surface,
                    borderColor: preset.type === selectedPreset.type ? colors.accent : colors.border,
                    borderRadius: radii.sm,
                  },
                ]}
                onPress={() => handlePresetSelect(preset)}
              >
                <Text
                  style={[
                    styles.presetLabel,
                    { color: preset.type === selectedPreset.type ? colors.accentText : colors.textPrimary },
                  ]}
                >
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* JSON Editor */}
        <View style={{ paddingHorizontal: sp.xxl, marginTop: sp.xxl }}>
          <View style={styles.editorHeader}>
            <Text style={[typo.caption1, { color: colors.textMuted }]}>JSON</Text>
            <Text style={[typo.caption2, { color: isValid ? colors.success : colors.danger }]}>
              {isValid ? '✓ Valid' : '✕ Invalid'}
            </Text>
          </View>
          <TextInput
            style={[
              styles.editor,
              {
                backgroundColor: colors.surface,
                borderColor: isValid ? colors.border : colors.danger,
                borderRadius: radii.md,
                color: colors.textPrimary,
                fontFamily: 'monospace',
              },
            ]}
            value={jsonText}
            onChangeText={handleJsonChange}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            accessibilityLabel="JSON editor"
          />

          {/* Editor Actions */}
          <View style={[styles.editorActions, { marginTop: sp.md }]}>
            <TouchableOpacity
              style={[styles.smallButton, { borderColor: colors.border, borderRadius: radii.sm }]}
              onPress={handleFormat}
            >
              <Text style={[styles.smallButtonText, { color: colors.textPrimary }]}>Format</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, { borderColor: colors.border, borderRadius: radii.sm }]}
              onPress={handleValidate}
            >
              <Text style={[styles.smallButtonText, { color: colors.textPrimary }]}>Validate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, { borderColor: colors.border, borderRadius: radii.sm }]}
              onPress={handleReset}
            >
              <Text style={[styles.smallButtonText, { color: colors.textMuted }]}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Send Button */}
        <View style={{ paddingHorizontal: sp.xxl, marginTop: sp.xxl }}>
          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: isValid ? colors.accent : colors.surfacePressed,
                borderRadius: radii.md,
              },
            ]}
            onPress={handleSend}
            disabled={!isValid}
            accessibilityLabel="Send packet"
          >
            <Text style={[typo.headline, { color: isValid ? colors.accentText : colors.textMuted }]}>
              Send packet
            </Text>
          </TouchableOpacity>
        </View>

        {/* Packet History */}
        {history.length > 0 && (
          <View style={{ paddingHorizontal: sp.xxl, marginTop: sp.xxxl }}>
            <Text style={[typo.caption1, { color: colors.textMuted, marginBottom: sp.md }]}>
              PACKET HISTORY
            </Text>
            {history.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={[
                  styles.historyItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radii.sm,
                    marginBottom: sp.sm,
                  },
                ]}
                onPress={() => Alert.alert(entry.type, entry.json)}
              >
                <View style={styles.historyHeader}>
                  <Text style={[styles.historyType, { color: colors.textPrimary }]}>
                    {entry.type}
                  </Text>
                  <Text style={[typo.caption2, { color: colors.textMuted }]}>
                    {formatTime(entry.timestamp)}
                  </Text>
                </View>
                <Text style={[typo.caption1, { color: colors.success }]}>
                  {entry.direction === 'sent' ? 'Sent ✓' : 'Received'} · {entry.size} B
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  presetScroll: { flexDirection: 'row' },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  presetLabel: { fontSize: 13, fontWeight: '600' },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editor: {
    borderWidth: 1,
    padding: 16,
    minHeight: 180,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  editorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  smallButtonText: { fontSize: 13, fontWeight: '500' },
  sendButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  historyItem: {
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyType: { fontSize: 14, fontWeight: '600' },
});

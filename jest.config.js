module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-gesture-handler|@react-navigation|react-native-reanimated|react-native-screens|react-native-safe-area-context|@shopify/react-native-skia|react-native-qrcode-skia|munim-bluetooth|@op-engineering/op-sqlite|react-native-mmkv)/)',
  ],
};

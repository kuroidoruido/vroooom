/**
 * Stub for `expo-constants` in tests.
 *
 * The real `expo-constants` imports `react-native`, which contains Flow syntax
 * that Node/rolldown cannot parse. This stub provides a minimal Constants object.
 */

const Constants = {
  expoConfig: {
    extra: {
      appVersion: "0.1.0",
      apiUrl: "http://localhost:8080",
    },
  },
  appOwnership: null,
  manifest: null,
  manifest2: null,
  expoGoConfig: null,
  easConfig: null,
  executionEnvironment: "standalone",
  isDetached: false,
  isHeadless: false,
  linkingUri: "exp://localhost:8081",
  nativeAppVersion: "0.1.0",
  nativeBuildVersion: "1",
  platform: {
    ios: {
      buildNumber: "1",
    },
    android: {
      versionCode: 1,
    },
  },
  sessionId: "test-session",
  systemFonts: [],
  statusBarHeight: 44,
  deviceName: "Test Device",
  deviceYearClass: 2024,
  isDevice: true,
  supportedAbis: ["arm64-v8a"],
  installationId: "test-installation-id",
  __unsafeNoWarnManifest: null,
  __unsafeNoWarnManifest2: null,
};

export default Constants;
export { Constants };

import { fileURLToPath } from 'node:url';
import { ngNative } from '@ng-native/testing/vitest';
import { defineConfig } from 'vitest/config';

// Compiles Angular for the tests the way Metro compiles it for the app. Tests run in Node against
// a fake of the native side: no simulator, no device.
export default defineConfig({
  plugins: [ngNative()],
  resolve: {
    alias: {
      // The real react-native contains Flow syntax that rolldown cannot parse.
      // The @ng-native/testing plugin provides a fake native layer, so we stub it out.
      'react-native': fileURLToPath(new URL('./src/test/react-native-stub.ts', import.meta.url)),
      // expo-constants imports react-native at the module level; stub it too.
      'expo-constants': fileURLToPath(new URL('./src/test/expo-constants-stub.ts', import.meta.url)),
    },
  },
});

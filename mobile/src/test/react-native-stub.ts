/**
 * Stub for `react-native` in tests.
 *
 * The real `react-native` package contains Flow syntax that Node/rolldown cannot parse.
 * The `@ng-native/testing` plugin provides a fake native layer, so the real `react-native`
 * module should never be loaded in tests. This stub satisfies imports from packages like
 * `expo-constants` that import `react-native` at the module level.
 */

export const Platform = {
  OS: "ios" as const,
  select: <T>(spec: { ios?: T; android?: T; default?: T }): T | undefined =>
    spec.ios ?? spec.default,
};

export const NativeModules = new Proxy(
  {},
  {
    get: () => undefined,
  },
);

export const TurboModuleRegistry = {
  get: () => undefined,
  getEnforcing: () => {
    throw new Error("TurboModule not available in tests");
  },
};

export const NativeEventEmitter = class {
  addListener() {
    return { remove: () => {} };
  }
  removeAllListeners() {}
};

export const DeviceEventEmitter = {
  addListener: () => ({ remove: () => {} }),
  removeAllListeners: () => {},
};

export const AppState = {
  currentState: "active",
  addEventListener: () => ({ remove: () => {} }),
};

export const Dimensions = {
  get: () => ({ width: 375, height: 812, scale: 2, fontScale: 1 }),
  addEventListener: () => ({ remove: () => {} }),
};

export const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
  roundToNearestPixel: (n: number) => n,
};

export const StyleSheet = {
  create: <T>(styles: T): T => styles,
  flatten: (style: unknown) => style,
  absoluteFill: {},
};

export const Animated = {
  Value: class {
    constructor(public value: number) {}
    setValue(v: number) {
      this.value = v;
    }
    interpolate() {
      return this;
    }
  },
  timing: () => ({ start: () => {} }),
  spring: () => ({ start: () => {} }),
  View: "Animated.View",
  Text: "Animated.Text",
};

export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  in: (easing: (t: number) => number) => easing,
  out: (easing: (t: number) => number) => easing,
  inOut: (easing: (t: number) => number) => easing,
  bezier: () => (t: number) => t,
};

// Default export for `import RN from 'react-native'`
export default {
  Platform,
  NativeModules,
  TurboModuleRegistry,
  NativeEventEmitter,
  DeviceEventEmitter,
  AppState,
  Dimensions,
  PixelRatio,
  StyleSheet,
  Animated,
  Easing,
};

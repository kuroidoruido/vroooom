/**
 * Version information for @vroooom/shared
 *
 * This version is embedded at build time and displayed in the "About" page
 * to verify that the correct shared library version is bundled.
 */

export const SHARED_VERSION = "0.1.0";

/**
 * Build information (optional, for debugging)
 */
export const BUILD_INFO = {
  version: SHARED_VERSION,
  name: "@vroooom/shared",
  // Build timestamp will be injected by the bundler if needed
} as const;

import { describe, expect, it } from "vitest";
import { BUILD_INFO, SHARED_VERSION } from "./version.js";

describe("version", () => {
  it("should export a version string", () => {
    expect(typeof SHARED_VERSION).toBe("string");
    expect(SHARED_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("should export build info with matching version", () => {
    expect(BUILD_INFO.version).toBe(SHARED_VERSION);
    expect(BUILD_INFO.name).toBe("@vroooom/shared");
  });
});

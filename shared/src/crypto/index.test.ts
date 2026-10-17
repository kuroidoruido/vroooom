import { describe, expect, it, vi } from "vitest";

// Mock libsodium-wrappers to avoid ESM import issues in test environment.
// We only test pure functions here; encrypt/decrypt are tested via integration tests.
vi.mock("libsodium-wrappers", () => ({
  default: {
    ready: Promise.resolve({}),
  },
}));

// Mock argon2-browser
vi.mock("argon2-browser", () => ({
  default: {
    ArgonType: { Argon2id: 2 },
    hash: async () => ({ hash: new Uint8Array(32) }),
  },
}));

import { bytesToHex, computeAuthHash, hexToBytes, randomBytes } from "./index.js";

describe("crypto", () => {
  describe("bytesToHex", () => {
    it("should convert empty array to empty string", () => {
      expect(bytesToHex(new Uint8Array([]))).toBe("");
    });

    it("should convert single byte to hex", () => {
      expect(bytesToHex(new Uint8Array([0]))).toBe("00");
      expect(bytesToHex(new Uint8Array([255]))).toBe("ff");
      expect(bytesToHex(new Uint8Array([171]))).toBe("ab");
    });

    it("should convert multiple bytes to hex", () => {
      expect(bytesToHex(new Uint8Array([222, 173, 190, 239]))).toBe("deadbeef");
    });

    it("should pad single-digit hex values with leading zero", () => {
      expect(bytesToHex(new Uint8Array([1, 2, 3]))).toBe("010203");
    });
  });

  describe("hexToBytes", () => {
    it("should convert empty string to empty array", () => {
      expect(hexToBytes("")).toEqual(new Uint8Array([]));
    });

    it("should convert hex string to bytes", () => {
      expect(hexToBytes("deadbeef")).toEqual(new Uint8Array([222, 173, 190, 239]));
    });

    it("should handle uppercase hex", () => {
      expect(hexToBytes("DEADBEEF")).toEqual(new Uint8Array([222, 173, 190, 239]));
    });

    it("should be inverse of bytesToHex", () => {
      const original = new Uint8Array([0, 1, 127, 128, 255]);
      const hex = bytesToHex(original);
      const bytes = hexToBytes(hex);

      expect(bytes).toEqual(original);
    });
  });

  describe("randomBytes", () => {
    it("should generate bytes of specified length", () => {
      expect(randomBytes(16)).toHaveLength(16);
      expect(randomBytes(32)).toHaveLength(32);
      expect(randomBytes(0)).toHaveLength(0);
    });

    it("should generate different random bytes each time", () => {
      const a = randomBytes(32);
      const b = randomBytes(32);

      expect(a).not.toEqual(b);
    });
  });

  describe("computeAuthHash", () => {
    it("should compute SHA-256 hash of master key as hex string", () => {
      const masterKey = new Uint8Array(32).fill(0);
      const authHash = computeAuthHash(masterKey);

      expect(typeof authHash).toBe("string");
      expect(authHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should produce deterministic hash for same input", () => {
      const masterKey = new Uint8Array([1, 2, 3, 4, 5]);
      const hash1 = computeAuthHash(masterKey);
      const hash2 = computeAuthHash(masterKey);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = computeAuthHash(new Uint8Array([1, 2, 3]));
      const hash2 = computeAuthHash(new Uint8Array([4, 5, 6]));

      expect(hash1).not.toBe(hash2);
    });

    it("should match known SHA-256 of all zeros", () => {
      // SHA-256 of 32 zero bytes
      const masterKey = new Uint8Array(32).fill(0);
      const authHash = computeAuthHash(masterKey);

      // Known SHA-256 hash of 32 zero bytes
      expect(authHash).toBe("66687aadf862bd776c8fc18b8e9f8e20089714856ee233b3902a591d0d5f2925");
    });
  });
});

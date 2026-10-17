import { describe, expect, it } from "vitest";
import { formatDate, generateId, now, parseDate } from "./index.js";

describe("utils", () => {
  describe("now", () => {
    it("should return current timestamp in milliseconds", () => {
      const before = Date.now();
      const result = now();
      const after = Date.now();

      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });

    it("should return a number", () => {
      expect(typeof now()).toBe("number");
    });
  });

  describe("generateId", () => {
    it("should return a non-empty string", () => {
      const id = generateId();
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });

    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it("should generate UUID v4 format when crypto.randomUUID is available", () => {
      const id = generateId();
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id).toMatch(uuidRegex);
    });
  });

  describe("formatDate", () => {
    it("should format date as ISO 8601 (YYYY-MM-DD)", () => {
      const date = new Date("2026-10-17T14:30:00.000Z");
      expect(formatDate(date)).toBe("2026-10-17");
    });

    it("should handle dates at start of year", () => {
      const date = new Date("2026-01-01T00:00:00.000Z");
      expect(formatDate(date)).toBe("2026-01-01");
    });

    it("should handle dates at end of year", () => {
      const date = new Date("2026-12-31T23:59:59.999Z");
      expect(formatDate(date)).toBe("2026-12-31");
    });
  });

  describe("parseDate", () => {
    it("should parse ISO date string to Date", () => {
      const date = parseDate("2026-10-17");
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2026);
      expect(date.getMonth()).toBe(9); // October (0-indexed)
      expect(date.getDate()).toBe(17);
    });

    it("should be inverse of formatDate", () => {
      const original = new Date("2026-10-17T14:30:00.000Z");
      const formatted = formatDate(original);
      const parsed = parseDate(formatted);

      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(9);
      expect(parsed.getDate()).toBe(17);
    });
  });
});

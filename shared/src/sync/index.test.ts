import { describe, expect, it } from "vitest";
import { computeHash, detectFork, resolveByTimestamp } from "./index.js";

describe("sync", () => {
  describe("computeHash", () => {
    it("should compute a SHA-256 hash as hex string", async () => {
      const hash = await computeHash(null, { test: "data" }, 1234567890);

      expect(typeof hash).toBe("string");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should produce deterministic hashes for same input", async () => {
      const hash1 = await computeHash("parent123", { amount: 100 }, 1000);
      const hash2 = await computeHash("parent123", { amount: 100 }, 1000);

      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", async () => {
      const hash1 = await computeHash(null, { data: "a" }, 1000);
      const hash2 = await computeHash(null, { data: "b" }, 1000);
      const hash3 = await computeHash(null, { data: "a" }, 2000);
      const hash4 = await computeHash("parent", { data: "a" }, 1000);

      expect(hash1).not.toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1).not.toBe(hash4);
    });

    it("should handle null parentId", async () => {
      const hash = await computeHash(null, { test: true }, 123);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should handle complex nested data", async () => {
      const hash = await computeHash("parent", { nested: { deep: [1, 2, 3] } }, 999);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("detectFork", () => {
    it("should return empty array when no forks exist", () => {
      const expenses = [
        { id: "a", parentId: null },
        { id: "b", parentId: "a" },
        { id: "c", parentId: "b" },
      ];

      expect(detectFork(expenses)).toEqual([]);
    });

    it("should detect a fork (two children with same parent)", () => {
      const expenses = [
        { id: "a", parentId: null },
        { id: "b", parentId: "a" },
        { id: "c", parentId: "a" },
      ];

      const conflicts = detectFork(expenses);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].parentId).toBe("a");
      expect(conflicts[0].children).toContain("b");
      expect(conflicts[0].children).toContain("c");
      expect(conflicts[0].children).toHaveLength(2);
    });

    it("should detect multiple forks", () => {
      const expenses = [
        { id: "root", parentId: null },
        { id: "a1", parentId: "root" },
        { id: "a2", parentId: "root" },
        { id: "b1", parentId: "a1" },
        { id: "b2", parentId: "a1" },
      ];

      const conflicts = detectFork(expenses);

      expect(conflicts).toHaveLength(2);
      const parentIds = conflicts.map((c) => c.parentId).sort();
      expect(parentIds).toEqual(["a1", "root"]);
    });

    it("should ignore expenses with null parentId", () => {
      const expenses = [
        { id: "a", parentId: null },
        { id: "b", parentId: null },
      ];

      expect(detectFork(expenses)).toEqual([]);
    });

    it("should handle empty array", () => {
      expect(detectFork([])).toEqual([]);
    });
  });

  describe("resolveByTimestamp", () => {
    it("should return branchA as winner when its timestamp is greater", () => {
      const branchA = { id: "a", timestamp: 2000 };
      const branchB = { id: "b", timestamp: 1000 };

      const result = resolveByTimestamp(branchA, branchB);

      expect(result.winner).toBe("a");
      expect(result.loser).toBe("b");
    });

    it("should return branchB as winner when its timestamp is greater", () => {
      const branchA = { id: "a", timestamp: 1000 };
      const branchB = { id: "b", timestamp: 2000 };

      const result = resolveByTimestamp(branchA, branchB);

      expect(result.winner).toBe("b");
      expect(result.loser).toBe("a");
    });

    it("should return branchA as winner when timestamps are equal (>=)", () => {
      const branchA = { id: "a", timestamp: 1000 };
      const branchB = { id: "b", timestamp: 1000 };

      const result = resolveByTimestamp(branchA, branchB);

      expect(result.winner).toBe("a");
      expect(result.loser).toBe("b");
    });
  });
});

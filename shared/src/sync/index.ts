/**
 * Sync module — Hash chain, conflict detection, sync engine
 */

/**
 * Compute hash chain ID: SHA256(parentId + JSON(data) + timestamp)
 */
export async function computeHash(
  parentId: string | null,
  data: unknown,
  timestamp: number,
): Promise<string> {
  const input = `${parentId ?? "null"}${JSON.stringify(data)}${timestamp}`;
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
  const hashArray = new Uint8Array(hashBuffer);
  return Array.from(hashArray)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface Conflict {
  parentId: string;
  children: string[];
}

/**
 * Detect forks in expense chain (two expenses with same parentId)
 */
export function detectFork<T extends { id: string; parentId: string | null }>(
  expenses: T[],
): Conflict[] {
  const parentMap = new Map<string, string[]>();

  for (const expense of expenses) {
    if (expense.parentId) {
      const children = parentMap.get(expense.parentId) ?? [];
      children.push(expense.id);
      parentMap.set(expense.parentId, children);
    }
  }

  const conflicts: Conflict[] = [];
  for (const [parentId, children] of parentMap) {
    if (children.length > 1) {
      conflicts.push({ parentId, children });
    }
  }

  return conflicts;
}

export interface ResolutionResult {
  winner: string;
  loser: string;
}

/**
 * Resolve conflict by timestamp (most recent wins)
 */
export function resolveByTimestamp<T extends { id: string; timestamp: number }>(
  branchA: T,
  branchB: T,
): ResolutionResult {
  if (branchA.timestamp >= branchB.timestamp) {
    return { winner: branchA.id, loser: branchB.id };
  }
  return { winner: branchB.id, loser: branchA.id };
}

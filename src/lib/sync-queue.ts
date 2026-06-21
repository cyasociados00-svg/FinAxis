// Minimal offline sync queue.
// Stores pending Supabase mutations to retry when connection returns.

export type QueueOp =
  | { id: string; type: "upsert"; table: string; row: Record<string, unknown> }
  | { id: string; type: "delete"; table: string; row_id: string };

type QueueInput =
  | { type: "upsert"; table: string; row: Record<string, unknown> }
  | { type: "delete"; table: string; id: string };

const STORAGE_KEY = "fy.sync-queue.v1";

function load(): QueueOp[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function save(ops: QueueOp[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const syncQueue = {
  size(): number {
    return load().length;
  },
  push(op: QueueInput) {
    const ops = load();
    if (op.type === "upsert") {
      ops.push({ id: newId(), type: "upsert", table: op.table, row: op.row });
    } else {
      ops.push({ id: newId(), type: "delete", table: op.table, row_id: op.id });
    }
    save(ops);
  },
  clear() {
    save([]);
  },
  async flush(client: any): Promise<{ flushed: number; failed: number }> {
    const ops = load();
    if (ops.length === 0) return { flushed: 0, failed: 0 };
    const remaining: QueueOp[] = [];
    let flushed = 0;
    for (const op of ops) {
      try {
        if (op.type === "upsert") {
          const { error } = await client.from(op.table).upsert(op.row);
          if (error) throw error;
        } else {
          const { error } = await client.from(op.table).delete().eq("id", op.row_id);
          if (error) throw error;
        }
        flushed++;
      } catch {
        remaining.push(op);
      }
    }
    save(remaining);
    return { flushed, failed: remaining.length };
  },
};

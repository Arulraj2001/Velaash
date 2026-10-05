/**
 * Deduplicates adjacent order status history records that were generated concurrently
 * by both database triggers (e.g. handle_order_status_audit) and application code.
 *
 * When both fire on a status change, two records are inserted within seconds of each other.
 * This helper collapses duplicates, preserving the detailed application audit note
 * over the generic trigger generated message.
 */
export function deduplicateOrderStatusHistory<
  T extends { status: string; note: string | null; createdAt: string }
>(history: T[]): T[] {
  if (!history || history.length <= 1) {
    return history || [];
  }

  const result: T[] = [];

  for (const record of history) {
    if (result.length === 0) {
      result.push(record);
      continue;
    }

    const prev = result[result.length - 1];
    const prevTime = new Date(prev.createdAt).getTime();
    const currTime = new Date(record.createdAt).getTime();
    const isCloseInTime = Math.abs(currTime - prevTime) <= 10000; // within 10 seconds

    if (prev.status === record.status && isCloseInTime) {
      // Determine which note is generic vs specific
      const prevIsGeneric =
        !prev.note ||
        prev.note.startsWith("Order status updated from") ||
        prev.note.startsWith("Order registered with");
      const currIsGeneric =
        !record.note ||
        record.note.startsWith("Order status updated from") ||
        record.note.startsWith("Order registered with");

      if (prevIsGeneric && !currIsGeneric) {
        // Replace the generic record with the specific application record
        result[result.length - 1] = record;
      } else if (!prevIsGeneric && currIsGeneric) {
        // Keep the existing specific record and discard the generic duplicate
        continue;
      } else {
        // If both are specific or both are generic, keep the one with the longer note
        if ((record.note?.length ?? 0) > (prev.note?.length ?? 0)) {
          result[result.length - 1] = record;
        }
      }
    } else {
      result.push(record);
    }
  }

  return result;
}

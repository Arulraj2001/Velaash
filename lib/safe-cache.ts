import { unstable_cache } from "next/cache";

/**
 * Safe wrapper around Next.js unstable_cache.
 * 
 * - In Next.js request/build context: uses full Next.js incrementalCache with tags and TTL.
 * - Outside Next.js context (scripts, unit tests, seeds): transparently executes the underlying
 *   async function directly instead of crashing on "Invariant: incrementalCache missing in unstable_cache".
 */
export function safeUnstableCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyParts?: string[],
  options?: { tags?: string[]; revalidate?: number | false }
): T {
  let cachedFn: T;
  try {
    cachedFn = unstable_cache(fn, keyParts, options);
  } catch {
    return fn;
  }

  return (async (...args: Parameters<T>) => {
    try {
      return await cachedFn(...args);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        (err.message.includes("incrementalCache") || err.message.includes("Invariant"))
      ) {
        return await fn(...args);
      }
      throw err;
    }
  }) as T;
}

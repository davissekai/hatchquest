/**
 * Per-session mutex — serializes concurrent requests targeting the same sessionId.
 *
 * Why: The choice endpoint performs getSession → validate → updateSession.
 * Without a lock, two concurrent requests with the same sessionId could both
 * pass the stale-nodeId guard before either writes, causing state corruption.
 *
 * Usage:
 *   const lock = new SessionLock();
 *   const release = await lock.acquire(sessionId);
 *   try {
 *     // ... getSession, validate, updateSession ...
 *   } finally {
 *     release();
 *   }
 */
export class SessionLock {
  // Maps sessionId → promise that resolves when the slot is free
  private readonly chains: Map<string, Promise<void>> = new Map();

  /**
   * Acquires the lock for a sessionId.
   * Returns a release function that MUST be called when done.
   * If another request holds the lock, this awaits its completion.
   */
  async acquire(sessionId: string): Promise<() => void> {
    // Get the current tail of the chain (or a resolved promise if no one holds the lock)
    const previous = this.chains.get(sessionId) ?? Promise.resolve();

    // Create a new promise that resolves when the caller calls release()
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });

    // Point the chain tail to OUR promise so subsequent waiters queue behind us,
    // not behind the whole previous chain. This is what makes the cleanup safe.
    this.chains.set(sessionId, next);

    // Wait for whoever held the lock before us
    await previous;

    // Return the release function — caller MUST call it in a finally block
    return () => {
      release();
      // Only remove the map entry if no one has queued after us.
      // If another request arrived while we held the lock, it replaced
      // chains[sessionId] with its own promise — don't delete that.
      if (this.chains.get(sessionId) === next) {
        this.chains.delete(sessionId);
      }
    };
  }
}

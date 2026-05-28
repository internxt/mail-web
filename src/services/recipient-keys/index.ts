const DEFAULT_TTL_MS = 5 * 60 * 1000;

type CachedKey = { publicKey: string | null; fetchedAt: number };

export class RecipientKeysService {
  public static readonly instance: RecipientKeysService = new RecipientKeysService();

  private constructor() {}

  private readonly cache = new Map<string, CachedKey>();

  private normalize(address: string): string {
    return address.trim().toLowerCase();
  }

  set(address: string, publicKey: string | null): void {
    this.cache.set(this.normalize(address), { publicKey, fetchedAt: Date.now() });
  }

  /**
   * Returns a defensive copy of the cached entry for `address`, or null when it was
   * never looked up or the entry is older than `ttlMs` (expired entries are evicted).
   */
  get(address: string, ttlMs: number = DEFAULT_TTL_MS): CachedKey | null {
    const entry = this.cache.get(this.normalize(address));
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > ttlMs) {
      this.cache.delete(this.normalize(address));
      return null;
    }
    return { ...entry };
  }

  has(address: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
    return this.get(address, ttlMs) !== null;
  }

  clear(): void {
    this.cache.clear();
  }
}

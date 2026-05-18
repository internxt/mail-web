const DEFAULT_TTL_MS = 5 * 60 * 1000;

type CachedKey = { publicKey: string; fetchedAt: number };

export class RecipientKeysService {
  public static readonly instance: RecipientKeysService = new RecipientKeysService();

  private constructor() {}

  private cache = new Map<string, CachedKey>();

  private normalize(address: string): string {
    return address.trim().toLowerCase();
  }

  set(address: string, publicKey: string): void {
    this.cache.set(this.normalize(address), { publicKey, fetchedAt: Date.now() });
  }

  get(address: string, ttlMs: number = DEFAULT_TTL_MS): CachedKey | null {
    const entry = this.cache.get(this.normalize(address));
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > ttlMs) {
      this.cache.delete(this.normalize(address));
      return null;
    }
    return entry;
  }

  has(address: string, ttlMs: number = DEFAULT_TTL_MS): boolean {
    return this.get(address, ttlMs) !== null;
  }

  clear(): void {
    this.cache.clear();
  }
}

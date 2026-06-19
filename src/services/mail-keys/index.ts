import type { HybridKeyPair } from 'internxt-crypto';

export class MailKeysService {
  public static readonly instance: MailKeysService = new MailKeysService();

  private constructor() {}

  private current: { address: string; keys: HybridKeyPair } | null = null;

  set(address: string, keys: HybridKeyPair): void {
    this.current = { address, keys };
  }

  get(address: string): HybridKeyPair | null {
    return this.current?.address === address ? this.current.keys : null;
  }

  getCurrentAddress(): string | null {
    return this.current?.address ?? null;
  }

  getCurrentKeys(): HybridKeyPair | null {
    const address = this.getCurrentAddress();
    if (!address) return null;
    return this.get(address);
  }

  clear(): void {
    this.current = null;
  }
}

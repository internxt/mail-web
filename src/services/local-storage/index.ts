import type { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import type { UserSubscription } from '@internxt/sdk/dist/drive/payments/types/types';
import type { UserSettings } from '@internxt/sdk/dist/shared/types/userSettings';

const LocalStorageKeys = {
  xUser: 'xUser',
  xMnemonic: 'xMnemonic',
  xNewToken: 'xNewToken',
  xSubscription: 'xSubscription',
  xTier: 'xTier',
};

export class LocalStorageService {
  public static readonly instance = new LocalStorageService();

  set(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  get(key: string): string | null {
    return localStorage.getItem(key);
  }

  remove(key: string) {
    localStorage.removeItem(key);
  }

  clear() {
    localStorage.clear();
  }

  setUser(user: UserSettings) {
    localStorage.setItem(LocalStorageKeys.xUser, JSON.stringify(user));
  }

  getUser(): UserSettings | null {
    const user = localStorage.getItem(LocalStorageKeys.xUser);
    return user ? JSON.parse(user) : null;
  }

  setToken(token: string) {
    localStorage.setItem(LocalStorageKeys.xNewToken, token);
  }

  getToken(): string | null {
    return localStorage.getItem(LocalStorageKeys.xNewToken);
  }

  setMnemonic(mnemonic: string) {
    localStorage.setItem(LocalStorageKeys.xMnemonic, mnemonic);
  }

  getMnemonic(): string | null {
    return localStorage.getItem(LocalStorageKeys.xMnemonic);
  }

  setSubscription(subscription: UserSubscription): void {
    localStorage.setItem(LocalStorageKeys.xSubscription, JSON.stringify(subscription));
  }

  getSubscription(): UserSubscription | null {
    const subscription = localStorage.getItem('xSubscription');
    return subscription ? JSON.parse(subscription) : null;
  }

  setTier(subscription: Tier): void {
    localStorage.setItem(LocalStorageKeys.xTier, JSON.stringify(subscription));
  }

  getTier(): Tier | null {
    const subscription = localStorage.getItem(LocalStorageKeys.xTier);
    return subscription ? JSON.parse(subscription) : null;
  }

  saveCredentials(user: UserSettings, mnemonic: string, token: string) {
    this.setUser(user);
    this.setMnemonic(mnemonic);
    this.setToken(token);
  }

  clearCredentials() {
    Object.values(LocalStorageKeys).forEach((key) => this.remove(key));
  }
}

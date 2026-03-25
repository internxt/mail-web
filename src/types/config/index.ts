export type OperatingSystem = 'Windows' | 'macOS' | 'Linux' | 'Android' | 'iOS' | 'UNIX' | 'Unknown';

export interface PlatformMatcher {
  pattern: string | RegExp;
  os: OperatingSystem;
}

export const PLATFORM_MATCHERS: PlatformMatcher[] = [
  { pattern: 'win', os: 'Windows' },
  { pattern: 'mac', os: 'macOS' },
  { pattern: 'linux', os: 'Linux' },
  { pattern: 'android', os: 'Android' },
  { pattern: 'ios', os: 'iOS' },
];

export const UA_MATCHERS: PlatformMatcher[] = [
  { pattern: /windows/i, os: 'Windows' },
  { pattern: /mac/i, os: 'macOS' },
  { pattern: /linux/i, os: 'Linux' },
  { pattern: /android/i, os: 'Android' },
  { pattern: /iphone|ipad|ipod/i, os: 'iOS' },
];

export const APP_VERSION_MATCHERS: PlatformMatcher[] = [
  { pattern: 'win', os: 'Windows' },
  { pattern: 'mac', os: 'macOS' },
  { pattern: 'linux', os: 'Linux' },
  { pattern: 'x11', os: 'UNIX' },
];

export interface ConfigKeys {
  DRIVE_API_URL: string;
  MAIL_API_URL: string;
  PAYMENTS_API_URL: string;
  CRYPTO_SECRET: string;
  MAGIC_IV: string;
  MAGIC_SALT: string;
  DRIVE_APP_URL: string;
  INTERCOM_PROVIDER_KEY: string;
}

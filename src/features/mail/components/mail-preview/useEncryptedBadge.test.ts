import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { EncryptionBlock } from '@internxt/sdk/dist/mail/types';
import { useEncryptedBadge } from './useEncryptedBadge';

const mocks = vi.hoisted(() => ({
  activeDomains: undefined as { domain: string }[] | undefined,
}));

vi.mock('@/store/api/mail', () => ({
  useGetActiveDomainsQuery: () => ({ data: mocks.activeDomains }),
}));

const internxtKey = {
  hybridCiphertext: 'h',
  encryptedKey: 'k',
  encryptedForEmail: 'bob@inxt.me',
};

const envelope = (emails: string[]): EncryptionBlock =>
  ({
    version: 'v3',
    encryptedText: 'et',
    encryptedPreview: 'ep',
    encryptedAttachmentsSessionKey: 'ek',
    wrappedKeys: emails.map((encryptedForEmail) => ({ ...internxtKey, encryptedForEmail })),
  }) as EncryptionBlock;

const params = (overrides: Partial<Parameters<typeof useEncryptedBadge>[0]> = {}) => ({
  isEncrypted: true,
  decryptError: false,
  envelope: envelope(['alice@inxt.me', 'bob@inxt.me']),
  collapsed: false,
  ...overrides,
});

describe('useEncryptedBadge', () => {
  beforeEach(() => {
    mocks.activeDomains = [{ domain: 'inxt.me' }];
  });

  test('When the message is end-to-end encrypted for Internxt recipients, then the badge should show', () => {
    const { result } = renderHook(() => useEncryptedBadge(params()));

    expect(result.current).toBe(true);
  });

  test('When the message was stored sealed for an external recipient, then the badge should not show', () => {
    const { result } = renderHook(() =>
      useEncryptedBadge(params({ envelope: envelope(['alice@inxt.me', 'bob@gmail.com']) })),
    );

    expect(result.current).toBe(false);
  });

  test('When the message is not marked as encrypted, then the badge should not show', () => {
    const { result } = renderHook(() => useEncryptedBadge(params({ isEncrypted: false })));

    expect(result.current).toBe(false);
  });

  test('When opening the message failed, then the badge should not show', () => {
    const { result } = renderHook(() => useEncryptedBadge(params({ decryptError: true })));

    expect(result.current).toBe(false);
  });

  test('When the message is collapsed, then the badge should not show', () => {
    const { result } = renderHook(() => useEncryptedBadge(params({ collapsed: true })));

    expect(result.current).toBe(false);
  });

  test('When the recipient domains have not loaded yet, then the badge should not show', () => {
    mocks.activeDomains = undefined;

    const { result } = renderHook(() => useEncryptedBadge(params()));

    expect(result.current).toBe(false);
  });
});

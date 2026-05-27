import { renderHook, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { HybridKeyPair } from 'internxt-crypto';
import type { EmailListResponse } from '@internxt/sdk/dist/mail/types';
import { useDecryptedPreviews } from './useDecryptedPreviews';
import { useMailKeys } from './useMailKeys';
import { decryptSummaryPreview } from '@/services/mail-encryption';

vi.mock('./useMailKeys', () => ({ useMailKeys: vi.fn() }));
vi.mock('@/services/mail-encryption', () => ({ decryptSummaryPreview: vi.fn() }));

const mockKeys = vi.mocked(useMailKeys);
const mockDecrypt = vi.mocked(decryptSummaryPreview);

type Summary = EmailListResponse['emails'][number];

const keypair = {} as HybridKeyPair;
const encryptedSummary = (id: string): Summary =>
  ({ id, encryption: { encryptedPreview: 'ep', wrappedKeys: [] } }) as unknown as Summary;
const plainSummary = (id: string): Summary => ({ id }) as unknown as Summary;

describe('useDecryptedPreviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockKeys.mockReturnValue(keypair);
  });

  test('When the caller has no keys, then no previews are decrypted', () => {
    mockKeys.mockReturnValue(null);

    const { result } = renderHook(() => useDecryptedPreviews([encryptedSummary('a')]));

    expect(result.current).toStrictEqual({});
    expect(mockDecrypt).not.toHaveBeenCalled();
  });

  test('When an encrypted summary is decryptable, then its decrypted preview is returned keyed by email id', async () => {
    mockDecrypt.mockResolvedValue('decrypted snippet');

    const { result } = renderHook(() => useDecryptedPreviews([encryptedSummary('a')]));

    await waitFor(() => expect(result.current).toStrictEqual({ a: 'decrypted snippet' }));
  });

  test('When a summary has no encryption block, then it is skipped', async () => {
    const { result } = renderHook(() => useDecryptedPreviews([plainSummary('a')]));

    await waitFor(() => expect(mockKeys).toHaveBeenCalled());
    expect(mockDecrypt).not.toHaveBeenCalled();
    expect(result.current).toStrictEqual({});
  });

  test('When a summary cannot be decrypted, then it is omitted from the result', async () => {
    mockDecrypt.mockRejectedValue(new Error('not a recipient'));

    const { result } = renderHook(() => useDecryptedPreviews([encryptedSummary('a')]));

    await waitFor(() => expect(mockDecrypt).toHaveBeenCalled());
    expect(result.current).toStrictEqual({});
  });

  test('When the same summaries are processed again, then decryption runs at most once per row', async () => {
    mockDecrypt.mockResolvedValue('snippet');
    const summaries = [encryptedSummary('a')];

    const { result, rerender } = renderHook(() => useDecryptedPreviews(summaries));
    await waitFor(() => expect(result.current).toStrictEqual({ a: 'snippet' }));

    rerender();

    expect(mockDecrypt).toHaveBeenCalledTimes(1);
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ predict: vi.fn() }));

vi.mock('@/services/spam-detector', () => ({
  SpamDetectorService: { instance: { predict: mocks.predict } },
}));

const loadHook = async (search: string) => {
  vi.resetModules();
  window.history.replaceState(null, '', `/inbox${search}`);
  const { useSpamSuggestion } = await import('./useSpamSuggestion');
  return useSpamSuggestion;
};

const params = (overrides = {}) => ({
  subject: 'You won a prize',
  htmlBody: '<p>Click <b>here</b></p>',
  collapsed: false,
  isDecrypting: false,
  decryptError: false,
  ...overrides,
});

describe('useSpamSuggestion', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mocks.predict.mockReset();
  });

  test('When the suggestion was not requested in the address, then it should not run the model', async () => {
    const useSpamSuggestion = await loadHook('');

    const { result } = renderHook(() => useSpamSuggestion(params()));

    expect(result.current).toBeNull();
    expect(mocks.predict).not.toHaveBeenCalled();
  });

  test('When the mail is likely spam, then it should suggest spam with its confidence', async () => {
    mocks.predict.mockResolvedValue({ isSpam: true, spamProbability: 0.934 });
    const useSpamSuggestion = await loadHook('?spam-suggestion');

    const { result } = renderHook(() => useSpamSuggestion(params()));

    await waitFor(() => expect(result.current).toEqual({ isSpam: true, confidencePercent: 93 }));
    expect(mocks.predict).toHaveBeenCalledWith('You won a prize Click here');
  });

  test('When the mail looks legitimate, then it should show the confidence that it is not spam', async () => {
    mocks.predict.mockResolvedValue({ isSpam: false, spamProbability: 0.02 });
    const useSpamSuggestion = await loadHook('?spam-suggestion');

    const { result } = renderHook(() => useSpamSuggestion(params()));

    await waitFor(() => expect(result.current).toEqual({ isSpam: false, confidencePercent: 98 }));
  });

  test('When the mail is collapsed, still decrypting or failed to decrypt, then it should not run the model', async () => {
    const useSpamSuggestion = await loadHook('?spam-suggestion');

    renderHook(() => useSpamSuggestion(params({ collapsed: true })));
    renderHook(() => useSpamSuggestion(params({ isDecrypting: true })));
    renderHook(() => useSpamSuggestion(params({ decryptError: true })));

    expect(mocks.predict).not.toHaveBeenCalled();
  });

  test('When the model cannot run, then it should show the mail without a suggestion', async () => {
    mocks.predict.mockRejectedValue(new Error('model unavailable'));
    const useSpamSuggestion = await loadHook('?spam-suggestion');

    const { result } = renderHook(() => useSpamSuggestion(params()));

    await waitFor(() => expect(mocks.predict).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  test('When another mail is opened before the result arrives, then it should ignore the outdated result', async () => {
    let resolveFirst: (value: { isSpam: boolean; spamProbability: number }) => void = () => {};
    mocks.predict
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce({ isSpam: false, spamProbability: 0.1 });
    const useSpamSuggestion = await loadHook('?spam-suggestion');

    const { result, rerender } = renderHook((props) => useSpamSuggestion(props), { initialProps: params() });
    rerender(params({ subject: 'Meeting notes', htmlBody: '<p>See you</p>' }));
    resolveFirst({ isSpam: true, spamProbability: 0.99 });

    await waitFor(() => expect(result.current).toEqual({ isSpam: false, confidencePercent: 90 }));
  });
});

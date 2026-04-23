import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useEmailSearch } from './useEmailSearch';
import { MailService } from '@/services/sdk/mail';
import type { EmailResponse } from '@internxt/sdk';

vi.mock('@/services/sdk/mail', () => ({
  MailService: {
    instance: {
      search: vi.fn(),
    },
  },
}));

vi.mock('../useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

const mockSearch = vi.mocked(MailService.instance.search);

const EMAILS = [{ id: '1' }, { id: '2' }] as EmailResponse[];

describe('Email Search - Custom hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('When no search term is provided, then the search is not performed', async () => {
    renderHook(() => useEmailSearch({ text: '' }));

    await waitFor(() => {
      expect(mockSearch).not.toHaveBeenCalled();
    });
  });

  test('When a search term is provided, then the search is performed', async () => {
    mockSearch.mockResolvedValue({ emails: EMAILS, hasMoreMails: false, total: 2 });

    renderHook(() => useEmailSearch({ text: 'hello' }));

    await waitFor(() => {
      expect(mockSearch).toHaveBeenCalledWith(expect.objectContaining({ text: 'hello', limit: 25, position: 0 }));
    });
  });

  test('When emails match the search, then they are returned', async () => {
    mockSearch.mockResolvedValue({ emails: EMAILS, hasMoreMails: false, total: 2 });

    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));

    await waitFor(() => {
      expect(result.current.searchEmails).toStrictEqual(EMAILS);
    });
  });

  test('When no emails match the search, then an empty list is returned', async () => {
    mockSearch.mockResolvedValue({ emails: [], hasMoreMails: false, total: 0 });

    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));

    await waitFor(() => {
      expect(result.current.searchEmails).toStrictEqual([]);
    });
  });

  test('When there are more results and none are loading, then loading more advances to the next page', async () => {
    mockSearch.mockResolvedValue({ emails: EMAILS, hasMoreMails: true, total: 50 });

    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));
    await waitFor(() => expect(result.current.hasMoreEmails).toBe(true));

    act(() => result.current.onLoadMore());

    expect(mockSearch).toHaveBeenLastCalledWith(expect.objectContaining({ position: 25 }));
  });

  test('When results are currently loading, then requesting more pages has no effect', async () => {
    mockSearch.mockImplementation(() => new Promise(() => {}));

    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));

    act(() => result.current.onLoadMore());

    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenLastCalledWith(expect.objectContaining({ position: 0 }));
  });

  test('When all results have been loaded, then requesting more pages has no effect', async () => {
    mockSearch.mockResolvedValue({ emails: EMAILS, hasMoreMails: false, total: 2 });

    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));
    await waitFor(() => expect(result.current.hasMoreEmails).toBe(false));

    act(() => result.current.onLoadMore());

    expect(mockSearch).toHaveBeenCalledTimes(1);
  });

  test('When the text changes, then results reset to the first page', async () => {
    mockSearch.mockResolvedValue({ emails: EMAILS, hasMoreMails: true, total: 50 });

    const { result, rerender } = renderHook(({ text }) => useEmailSearch({ text }), {
      initialProps: { text: 'hello' },
    });
    await waitFor(() => expect(result.current.hasMoreEmails).toBe(true));
    act(() => result.current.onLoadMore());
    expect(mockSearch).toHaveBeenLastCalledWith(expect.objectContaining({ position: 25 }));

    rerender({ text: 'world' });

    await waitFor(() => {
      expect(mockSearch).toHaveBeenLastCalledWith(expect.objectContaining({ text: 'world', position: 0 }));
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useEmailSearch } from './useEmailSearch';
import { useGetEmailSearchQuery } from '@/store/api/mail';
import type { EmailResponse } from '@internxt/sdk';

vi.mock('@/store/api/mail', () => ({
  useGetEmailSearchQuery: vi.fn(),
}));

const mockUseGetEmailSearchQuery = vi.mocked(useGetEmailSearchQuery);

const EMAILS = [{ id: '1' }, { id: '2' }] as EmailResponse[];

const makeQueryResult = (overrides = {}) =>
  ({
    data: undefined,
    isLoading: false,
    isFetching: false,
    ...overrides,
  }) as unknown as ReturnType<typeof useGetEmailSearchQuery>;

describe('Email Search - Custom hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('When no search term is provided, then the search is not performed', () => {
    mockUseGetEmailSearchQuery.mockReturnValue(makeQueryResult());

    renderHook(() => useEmailSearch({ text: '' }));

    expect(mockUseGetEmailSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ text: '', limit: 25, position: 0 }),
      { skip: true },
    );
  });

  test('When a search term is provided, then the search is performed', () => {
    mockUseGetEmailSearchQuery.mockReturnValue(makeQueryResult());

    renderHook(() => useEmailSearch({ text: 'hello' }));

    expect(mockUseGetEmailSearchQuery).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'hello', limit: 25, position: 0 }),
      { skip: false },
    );
  });

  test('When emails match the search, then they are returned', () => {
    mockUseGetEmailSearchQuery.mockReturnValue(makeQueryResult({ data: { emails: EMAILS, hasMoreMails: false } }));

    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));

    expect(result.current.searchEmails).toStrictEqual(EMAILS);
  });

  test('When no emails match the search, then an empty list is returned', () => {
    mockUseGetEmailSearchQuery.mockReturnValue(makeQueryResult());

    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));

    expect(result.current.searchEmails).toStrictEqual([]);
  });

  test('When there are more results and none are loading, then loading more advances to the next page', () => {
    mockUseGetEmailSearchQuery.mockReturnValue(
      makeQueryResult({ data: { emails: EMAILS, hasMoreMails: true }, isFetching: false }),
    );
    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));

    act(() => result.current.onLoadMore());

    expect(mockUseGetEmailSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ position: 25 }), {
      skip: false,
    });
  });

  test('When results are currently loading, then requesting more pages has no effect', () => {
    mockUseGetEmailSearchQuery.mockReturnValue(
      makeQueryResult({ data: { emails: EMAILS, hasMoreMails: true }, isFetching: true }),
    );
    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));

    act(() => result.current.onLoadMore());

    expect(mockUseGetEmailSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ position: 0 }), {
      skip: false,
    });
  });

  test('When all results have been loaded, then requesting more pages has no effect', () => {
    mockUseGetEmailSearchQuery.mockReturnValue(
      makeQueryResult({ data: { emails: EMAILS, hasMoreMails: false }, isFetching: false }),
    );
    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));

    act(() => result.current.onLoadMore());

    expect(mockUseGetEmailSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ position: 0 }), {
      skip: false,
    });
  });

  test('When the search is reset after paginating, then results start from the beginning', () => {
    mockUseGetEmailSearchQuery.mockReturnValue(
      makeQueryResult({ data: { emails: EMAILS, hasMoreMails: true }, isFetching: false }),
    );
    const { result } = renderHook(() => useEmailSearch({ text: 'hello' }));
    act(() => result.current.onLoadMore());

    act(() => result.current.onReset());

    expect(mockUseGetEmailSearchQuery).toHaveBeenLastCalledWith(expect.objectContaining({ position: 0 }), {
      skip: false,
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from './useDebounce';

describe('Debouncing text - Custom hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('When the hook is initialized, then it returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 500));

    expect(result.current).toStrictEqual('hello');
  });

  test('When the value changes, then it does not update before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'hello' },
    });

    rerender({ value: 'world' });
    act(() => vi.advanceTimersByTime(499));

    expect(result.current).toStrictEqual('hello');
  });

  test('When the value changes, then it updates after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'hello' },
    });

    rerender({ value: 'world' });
    act(() => vi.advanceTimersByTime(500));

    expect(result.current).toStrictEqual('world');
  });

  test('When the value changes multiple times rapidly, then only the last value is applied', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'c' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'd' });
    act(() => vi.advanceTimersByTime(500));

    expect(result.current).toStrictEqual('d');
  });

  test('When no delay is provided, then it defaults to 500ms', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'hello' },
    });

    rerender({ value: 'world' });
    act(() => vi.advanceTimersByTime(499));
    expect(result.current).toStrictEqual('hello');

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toStrictEqual('world');
  });

  test('When the hook unmounts before the delay, then it does not update the value', () => {
    const { result, rerender, unmount } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'hello' },
    });

    rerender({ value: 'world' });
    unmount();
    act(() => vi.advanceTimersByTime(500));

    expect(result.current).toStrictEqual('hello');
  });
});

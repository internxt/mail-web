import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useAppLoaderAnimation } from './useAppLoaderAnimation';

const STEP_INTERVAL_MS = 100;

const advanceSteps = async (steps: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(steps * STEP_INTERVAL_MS);
  });
};

describe('App Loader Animation - Custom Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('When it starts, then the envelope is closed and the files are inside', () => {
    const { result } = renderHook(() => useAppLoaderAnimation());

    expect(result.current).toEqual({ isFlapOpen: false, filesOut: false });
  });

  test('When it reaches the open range, then the flap opens before the files come out', async () => {
    const { result } = renderHook(() => useAppLoaderAnimation());

    await advanceSteps(2);
    expect(result.current).toEqual({ isFlapOpen: true, filesOut: false });

    await advanceSteps(3);
    expect(result.current).toEqual({ isFlapOpen: true, filesOut: true });
  });

  test('When it reaches the closing range, then the files go back in before the flap closes', async () => {
    const { result } = renderHook(() => useAppLoaderAnimation());

    await advanceSteps(16);
    expect(result.current).toEqual({ isFlapOpen: true, filesOut: false });

    await advanceSteps(2);
    expect(result.current).toEqual({ isFlapOpen: false, filesOut: false });
  });

  test('When it passes the total steps, then it wraps back to the closed start state', async () => {
    const { result } = renderHook(() => useAppLoaderAnimation());

    await advanceSteps(21);
    expect(result.current).toEqual({ isFlapOpen: false, filesOut: false });

    await advanceSteps(2);
    expect(result.current).toEqual({ isFlapOpen: true, filesOut: false });
  });

  test('When it unmounts, then the interval is cleared', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const { unmount } = renderHook(() => useAppLoaderAnimation());

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useEmailAddressValidation } from './useEmailAddressValidation';

describe('useEmailAddressValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('When the hook is initialized, then username is empty and the user has not interacted yet', () => {
    const { result } = renderHook(() => useEmailAddressValidation(300));

    expect(result.current.username).toBe('');
    expect(result.current.hasInteracted).toBe(false);
    expect(result.current.isValid).toBe(false);
  });

  test('When validateAddress is called, then username updates immediately without waiting for the debounce', () => {
    const { result } = renderHook(() => useEmailAddressValidation(300));

    act(() => result.current.validateAddress('jane.doe'));

    expect(result.current.username).toBe('jane.doe');
  });

  test('When validateAddress is called with uppercase characters, then the value is lowercased', () => {
    const { result } = renderHook(() => useEmailAddressValidation(300));

    act(() => result.current.validateAddress('Jane.Doe'));

    expect(result.current.username).toBe('jane.doe');
  });

  test('When validateAddress is called, then hasInteracted becomes true immediately', () => {
    const { result } = renderHook(() => useEmailAddressValidation(300));

    act(() => result.current.validateAddress('j'));

    expect(result.current.hasInteracted).toBe(true);
  });

  test('When validateAddress is called, then rules are not recomputed before the debounce delay elapses', () => {
    const { result } = renderHook(() => useEmailAddressValidation(300));

    act(() => result.current.validateAddress('jane.doe'));
    act(() => vi.advanceTimersByTime(299));

    expect(result.current.rules.find((rule) => rule.id === 'length')!.status).toBe('idle');
  });

  test('When the debounce delay elapses, then rules reflect the latest typed value', () => {
    const { result } = renderHook(() => useEmailAddressValidation(300));

    act(() => result.current.validateAddress('admin'));
    act(() => vi.advanceTimersByTime(300));

    expect(result.current.rules.find((rule) => rule.id === 'available')!.status).toBe('invalid');
  });

  test('When the typed value satisfies every rule and the debounce elapses, then isValid is true', () => {
    const { result } = renderHook(() => useEmailAddressValidation(300));

    act(() => result.current.validateAddress('jane.doe-99_x'));
    act(() => vi.advanceTimersByTime(300));

    expect(result.current.isValid).toBe(true);
  });

  test('When the value changes rapidly, then only the last value is validated after the delay', () => {
    const { result } = renderHook(() => useEmailAddressValidation(300));

    act(() => result.current.validateAddress('admin'));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.validateAddress('jane.doe'));
    act(() => vi.advanceTimersByTime(300));

    expect(result.current.isValid).toBe(true);
  });
});

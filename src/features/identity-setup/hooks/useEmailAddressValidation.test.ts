import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MailService } from '@/services/sdk/mail';
import { DEFAULT_DEBOUNCE_MS, useEmailAddressValidation } from './useEmailAddressValidation';

vi.mock('@/services/sdk/mail', () => ({
  MailService: {
    instance: {
      checkAddressAvailability: vi.fn(),
    },
  },
}));

const checkAddressAvailability = vi.mocked(MailService.instance.checkAddressAvailability);

const DOMAIN = 'inxt.me';

const renderValidationHook = () => renderHook(() => useEmailAddressValidation(DOMAIN, DEFAULT_DEBOUNCE_MS));

const typeAndSettle = async (
  result: ReturnType<typeof renderValidationHook>['result'],
  value: string,
): Promise<void> => {
  act(() => result.current.validateAddress(value));
  await act(async () => {
    vi.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
  });
};

describe('useEmailAddressValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    checkAddressAvailability.mockResolvedValue({ available: true, suggestion: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test('When the hook is initialized, then username is empty and the user has not interacted yet', () => {
    const { result } = renderValidationHook();

    expect(result.current.username).toBe('');
    expect(result.current.hasInteracted).toBe(false);
    expect(result.current.isValid).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });

  test('When validateAddress is called, then username updates immediately without waiting for the debounce', () => {
    const { result } = renderValidationHook();

    act(() => result.current.validateAddress('jane.doe'));

    expect(result.current.username).toBe('jane.doe');
  });

  test('When validateAddress is called with uppercase characters, then the value is lowercased', () => {
    const { result } = renderValidationHook();

    act(() => result.current.validateAddress('Jane.Doe'));

    expect(result.current.username).toBe('jane.doe');
  });

  test('When validateAddress is called, then hasInteracted becomes true immediately', () => {
    const { result } = renderValidationHook();

    act(() => result.current.validateAddress('j'));

    expect(result.current.hasInteracted).toBe(true);
  });

  test('When validateAddress is called, then rules are not recomputed before the debounce delay elapses', () => {
    const { result } = renderValidationHook();

    act(() => result.current.validateAddress('jane.doe'));
    act(() => vi.advanceTimersByTime(299));

    expect(result.current.rules.find((rule) => rule.id === 'length')!.status).toBe('idle');
  });

  test('When the typed value is a reserved username, then it is marked unavailable without calling the backend', async () => {
    const { result } = renderValidationHook();

    await typeAndSettle(result, 'admin');

    expect(result.current.rules.find((rule) => rule.id === 'available')!.status).toBe('invalid');
    expect(checkAddressAvailability).not.toHaveBeenCalled();
  });

  test('When the debounce elapses on a well-formatted username, then availability is checked against the backend', async () => {
    const { result } = renderValidationHook();

    await typeAndSettle(result, 'jane.doe');

    expect(checkAddressAvailability).toHaveBeenCalledWith('jane.doe', DOMAIN);
  });

  test('When the backend reports the address as available, then every rule passes and the address is valid', async () => {
    const { result } = renderValidationHook();

    await typeAndSettle(result, 'jane.doe-99_x');

    expect(result.current.rules.find((rule) => rule.id === 'available')!.status).toBe('valid');
    expect(result.current.isValid).toBe(true);
    expect(result.current.canSubmit).toBe(true);
  });

  test('When the backend reports the address as taken, then the available rule fails with the suggestion and submitting is blocked', async () => {
    checkAddressAvailability.mockResolvedValue({ available: false, suggestion: 'jane.doe1@inxt.me' });
    const { result } = renderValidationHook();

    await typeAndSettle(result, 'jane.doe');

    const availableRule = result.current.rules.find((rule) => rule.id === 'available')!;
    expect(availableRule.status).toBe('invalid');
    expect(availableRule.labelKey).toBe('identitySetup.updateEmail.rules.taken');
    expect(availableRule.labelParams).toEqual({ suggestion: 'jane.doe1@inxt.me' });
    expect(result.current.isValid).toBe(false);
    expect(result.current.canSubmit).toBe(false);
  });

  test('When the user types again after the address was reported taken, then the availability resets and submitting unblocks', async () => {
    checkAddressAvailability.mockResolvedValue({ available: false, suggestion: 'jane.doe1@inxt.me' });
    const { result } = renderValidationHook();
    await typeAndSettle(result, 'jane.doe');

    act(() => result.current.validateAddress('jane.doe2'));

    expect(result.current.availability.status).not.toBe('taken');
    expect(result.current.canSubmit).toBe(true);
  });

  test('When the availability request fails, then availability stays unknown and the rule is idle', async () => {
    checkAddressAvailability.mockRejectedValue(new Error('network down'));
    const { result } = renderValidationHook();

    await typeAndSettle(result, 'jane.doe');

    expect(result.current.availability).toEqual({ status: 'unknown' });
    expect(result.current.rules.find((rule) => rule.id === 'available')!.status).toBe('idle');
    expect(result.current.isValid).toBe(false);
  });

  test('When the value changes rapidly, then only the last value is checked after the delay', async () => {
    const { result } = renderValidationHook();

    act(() => result.current.validateAddress('jane'));
    act(() => vi.advanceTimersByTime(100));
    act(() => result.current.validateAddress('jane.doe'));
    await act(async () => {
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });

    expect(checkAddressAvailability).toHaveBeenCalledTimes(1);
    expect(checkAddressAvailability).toHaveBeenCalledWith('jane.doe', DOMAIN);
    expect(result.current.isValid).toBe(true);
  });

  test('When an address has already been resolved, then checking it again serves the cached result without re-querying', async () => {
    const { result } = renderValidationHook();
    await typeAndSettle(result, 'jane.doe');
    checkAddressAvailability.mockClear();

    let outcome;
    await act(async () => {
      outcome = await result.current.checkAvailability();
    });

    expect(checkAddressAvailability).not.toHaveBeenCalled();
    expect(outcome).toEqual({ status: 'available' });
    expect(result.current.canSubmit).toBe(true);
  });

  test('When an address has not been resolved yet, then checking it queries the backend once', async () => {
    checkAddressAvailability.mockResolvedValue({ available: false, suggestion: 'jane.doe1@inxt.me' });
    const { result } = renderValidationHook();
    act(() => result.current.validateAddress('jane.doe'));

    let outcome;
    await act(async () => {
      outcome = await result.current.checkAvailability();
    });

    expect(checkAddressAvailability).toHaveBeenCalledTimes(1);
    expect(checkAddressAvailability).toHaveBeenCalledWith('jane.doe', DOMAIN);
    expect(outcome).toEqual({ status: 'taken', suggestion: 'jane.doe1@inxt.me' });
    expect(result.current.canSubmit).toBe(false);
  });

  test('When checkAvailability is called with a badly formatted username, then the backend is not queried', async () => {
    const { result } = renderValidationHook();
    act(() => result.current.validateAddress('a'));

    let outcome;
    await act(async () => {
      outcome = await result.current.checkAvailability();
    });

    expect(checkAddressAvailability).not.toHaveBeenCalled();
    expect(outcome).toEqual({ status: 'unknown' });
  });

  test('When the user returns to a previously checked address, then it is served from cache without a new request', async () => {
    const { result } = renderValidationHook();
    await typeAndSettle(result, 'jane.doe');
    await typeAndSettle(result, 'jane.do');
    checkAddressAvailability.mockClear();

    await typeAndSettle(result, 'jane.doe');

    expect(checkAddressAvailability).not.toHaveBeenCalled();
    expect(result.current.rules.find((rule) => rule.id === 'available')!.status).toBe('valid');
  });

  test('When a check for the same address is already in flight, then it is reused instead of sending a second request', async () => {
    let resolvePendingCheck!: (response: { available: boolean; suggestion: string | null }) => void;
    checkAddressAvailability.mockReturnValue(
      new Promise((resolve) => {
        resolvePendingCheck = resolve;
      }),
    );
    const { result } = renderValidationHook();

    act(() => result.current.validateAddress('jane.doe'));
    act(() => vi.advanceTimersByTime(DEFAULT_DEBOUNCE_MS));

    let outcome;
    await act(async () => {
      const pendingOutcome = result.current.checkAvailability();
      resolvePendingCheck({ available: true, suggestion: null });
      outcome = await pendingOutcome;
    });

    expect(checkAddressAvailability).toHaveBeenCalledTimes(1);
    expect(outcome).toEqual({ status: 'available' });
    expect(result.current.canSubmit).toBe(true);
  });

  test('When the check is rate limited, then availability reports rateLimited without the hook retrying (the SDK owns backoff)', async () => {
    const rateLimitError = Object.assign(new Error('Too Many Requests'), { status: 429 });
    checkAddressAvailability.mockRejectedValue(rateLimitError);
    const { result } = renderValidationHook();

    await typeAndSettle(result, 'jane.doe');

    expect(result.current.availability.status).toBe('rateLimited');
    expect(result.current.rules.find((rule) => rule.id === 'available')!.status).toBe('idle');
    expect(result.current.canSubmit).toBe(true);
    expect(checkAddressAvailability).toHaveBeenCalledTimes(1);
  });
});

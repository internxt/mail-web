import { act, renderHook } from '@testing-library/react';
import type { EmailDomainsResponse } from '@internxt/sdk/dist/mail/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ErrorService } from '@/services/error';
import type { AddressAvailability } from './emailAddressRules';
import { useUpdateEmail } from './useUpdateEmail';

const mocks = vi.hoisted(() => ({
  username: 'jane.doe',
  canSubmit: true,
  checkAvailability: vi.fn(),
}));

vi.mock('./useEmailAddressValidation', () => ({
  useEmailAddressValidation: () => ({
    username: mocks.username,
    rules: [],
    isValid: true,
    canSubmit: mocks.canSubmit,
    availability: { status: 'checking' },
    hasInteracted: true,
    validateAddress: vi.fn(),
    checkAvailability: mocks.checkAvailability,
  }),
}));

vi.mock('@/i18n', () => ({ useTranslationContext: () => ({ translate: (key: string) => key }) }));

vi.mock('@/services/error', () => ({
  ErrorService: { instance: { notifyUser: vi.fn(), castError: vi.fn((error) => error) } },
}));

const notifyUser = vi.mocked(ErrorService.instance.notifyUser);

const DOMAIN = 'inxt.me';
const activeDomains = [{ domain: DOMAIN }] as unknown as EmailDomainsResponse;

const renderUpdateEmailHook = (onNext = vi.fn()) => {
  const { result } = renderHook(() => useUpdateEmail({ activeDomains, onNext }));
  return { result, onNext };
};

const submitWith = async (availability: AddressAvailability) => {
  mocks.checkAvailability.mockResolvedValue(availability);
  const { result, onNext } = renderUpdateEmailHook();

  await act(async () => {
    await result.current.submit();
  });

  return { result, onNext };
};

describe('useUpdateEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.username = 'jane.doe';
    mocks.canSubmit = true;
  });

  test('When the address is available, then the flow advances with the chosen address and domain', async () => {
    const { onNext } = await submitWith({ status: 'available' });

    expect(onNext).toHaveBeenCalledWith({ address: 'jane.doe', domain: DOMAIN });
    expect(notifyUser).not.toHaveBeenCalled();
  });

  test('When the address is already taken, then the flow does not advance and no error is shown', async () => {
    const { onNext } = await submitWith({ status: 'taken', suggestion: 'jane.doe1@inxt.me' });

    expect(onNext).not.toHaveBeenCalled();
    expect(notifyUser).not.toHaveBeenCalled();
  });

  test('When the availability check is rate limited, then the flow does not advance and stays silent', async () => {
    const { onNext } = await submitWith({ status: 'rateLimited' });

    expect(onNext).not.toHaveBeenCalled();
    expect(notifyUser).not.toHaveBeenCalled();
  });

  test('When the availability cannot be determined, then the flow does not advance and the user is notified', async () => {
    const { onNext } = await submitWith({ status: 'unknown' });

    expect(onNext).not.toHaveBeenCalled();
    expect(notifyUser).toHaveBeenCalledWith('errors.identitySetup.availabilityCheckFailed');
  });

  test('When the address is not submittable, then availability is never checked', async () => {
    mocks.canSubmit = false;
    const { result, onNext } = renderUpdateEmailHook();

    await act(async () => {
      await result.current.submit();
    });

    expect(mocks.checkAvailability).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  test('When a submission finishes, then the form stops reporting that it is submitting', async () => {
    const { result } = await submitWith({ status: 'available' });

    expect(result.current.isSubmitting).toBe(false);
  });

  test('When the hook is initialized, then the first active domain is preselected', () => {
    const { result } = renderUpdateEmailHook();

    expect(result.current.domain).toBe(DOMAIN);
  });

  test('When the user has not started typing and the field is unfocused, then the rules panel stays hidden', () => {
    const { result } = renderUpdateEmailHook();

    expect(result.current.isPanelVisible).toBe(false);
  });

  test('When the address field gains focus, then the rules panel becomes visible', () => {
    const { result } = renderUpdateEmailHook();

    act(() => result.current.setIsUsernameFocused(true));

    expect(result.current.isPanelVisible).toBe(true);
  });
});

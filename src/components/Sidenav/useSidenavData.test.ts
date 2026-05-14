import { renderHook } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSidenavData } from './useSidenavData';
import { useGetStorageLimitQuery, useGetStorageUsageQuery } from '@/store/api/storage';
import { useGetMailMeQuery } from '@/store/api/mail';
import type { MailAccountResponse } from '@internxt/sdk/dist/mail/types';

vi.mock('@/store/api/storage', () => ({
  useGetStorageLimitQuery: vi.fn(),
  useGetStorageUsageQuery: vi.fn(),
}));

vi.mock('@/store/api/mail', () => ({
  useGetMailMeQuery: vi.fn(),
}));

const mockUseGetStorageLimitQuery = vi.mocked(useGetStorageLimitQuery);
const mockUseGetStorageUsageQuery = vi.mocked(useGetStorageUsageQuery);
const mockUseGetMailMeQuery = vi.mocked(useGetMailMeQuery);

const setupMocks = ({
  planLimit = 100,
  planUsage = 50,
  isLoadingPlanLimit = false,
  isLoadingPlanUsage = false,
  mailMe = undefined as MailAccountResponse | undefined,
} = {}) => {
  mockUseGetStorageLimitQuery.mockReturnValue({
    data: planLimit,
    isLoading: isLoadingPlanLimit,
  } as unknown as ReturnType<typeof useGetStorageLimitQuery>);
  mockUseGetStorageUsageQuery.mockReturnValue({
    data: planUsage,
    isLoading: isLoadingPlanUsage,
  } as unknown as ReturnType<typeof useGetStorageUsageQuery>);
  mockUseGetMailMeQuery.mockReturnValue({ data: mailMe } as unknown as ReturnType<typeof useGetMailMeQuery>);
};

describe('useSidenavData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mail account status', () => {
    test('When the mail account is active, then the mail features are reported as available', () => {
      setupMocks({ mailMe: { id: '1', defaultAddress: 'user@inxt.me', status: 'active' } });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.isMailDisabled).toBe(false);
    });

    test('When the mail account is suspended, then the mail features are reported as disabled', () => {
      setupMocks({
        mailMe: {
          id: '1',
          defaultAddress: 'user@inxt.me',
          status: 'suspended',
          suspendedAt: '2026-05-01T00:00:00.000Z',
          deletionAt: '2026-06-01T00:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.isMailDisabled).toBe(true);
    });

    test('When no mail account information is available, then the mail features are not reported as disabled', () => {
      setupMocks({ mailMe: undefined });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.isMailDisabled).toBe(false);
    });
  });

  describe('Days until deletion', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-11T12:00:00.000Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('When the account has a scheduled deletion date in the future, then the remaining days until deletion are reported', () => {
      setupMocks({
        mailMe: {
          id: '1',
          defaultAddress: 'user@inxt.me',
          status: 'suspended',
          deletionAt: '2026-05-16T12:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.daysUntilDeletion).toBe(5);
    });

    test('When the account has no scheduled deletion date, then no remaining days are reported', () => {
      setupMocks({ mailMe: { id: '1', defaultAddress: 'user@inxt.me', status: 'active' } });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.daysUntilDeletion).toBeUndefined();
    });

    test('When the scheduled deletion date has already passed, then no days are reported as remaining', () => {
      setupMocks({
        mailMe: {
          id: '1',
          defaultAddress: 'user@inxt.me',
          status: 'suspended',
          deletionAt: '2026-05-01T00:00:00.000Z',
        },
      });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.daysUntilDeletion).toBe(0);
    });
  });

  describe('Storage percentage', () => {
    test('When the used storage is half of the available storage, then the reported usage is fifty percent', () => {
      setupMocks({ planUsage: 500, planLimit: 1000 });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.storagePercentage).toBe(50);
    });

    test('When the used storage exceeds the available storage, then the reported usage is capped at one hundred percent', () => {
      setupMocks({ planUsage: 1500, planLimit: 1000 });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.storagePercentage).toBe(100);
    });

    test('When the available storage is zero, then the reported usage is zero percent to avoid division by zero', () => {
      setupMocks({ planUsage: 100, planLimit: 0 });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.storagePercentage).toBe(0);
    });

    test('When the storage information is still being fetched, then the loading state is reported as in progress', () => {
      setupMocks({ isLoadingPlanLimit: true, isLoadingPlanUsage: true });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.isLoadingPlanLimit).toBe(true);
      expect(result.current.isLoadingPlanUsage).toBe(true);
    });

    test('When the storage information has finished loading, then the used and available storage values are returned', () => {
      setupMocks({ planUsage: 200, planLimit: 800 });

      const { result } = renderHook(() => useSidenavData());

      expect(result.current.planUsage).toBe(200);
      expect(result.current.planLimit).toBe(800);
    });
  });
});

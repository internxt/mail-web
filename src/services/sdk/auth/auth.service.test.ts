/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, vi } from 'vitest';
import { SdkManager } from '..';
import { AuthService } from '.';
import { LocalStorageService } from '@/services/local-storage';

describe('Auth Service', () => {
  test('When the user logs out, then the token should be cleared', async () => {
    const mockedToken = 'random-token';
    const mockedAuthClient = {
      logout: vi.fn().mockResolvedValue(undefined),
    } as any;

    vi.spyOn(LocalStorageService.instance, 'getToken').mockReturnValue(mockedToken);
    vi.spyOn(SdkManager.instance, 'getAuth').mockReturnValue(mockedAuthClient);

    await AuthService.instance.logOut();

    expect(mockedAuthClient.logout).toHaveBeenCalledWith(mockedToken);
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, vi } from 'vitest';
import { SdkManager } from '../sdk';
import { UserService } from './user.service';
import { getMockedRefreshUser } from '@/test-utils/fixtures';

describe('User Service', () => {
  describe('Get the current logged in user', () => {
    test('When a user is logged in, then it should be returned', async () => {
      const mockedUser = getMockedRefreshUser();

      const mockedUserClient = {
        refreshUser: vi.fn().mockResolvedValue(mockedUser),
      };
      vi.spyOn(SdkManager.instance, 'getUsers').mockReturnValue(mockedUserClient as any);

      const { user } = await UserService.instance.refreshUser();

      expect(user).toEqual(mockedUser.user);
    });
  });

  describe('Refresh user data and tokens', () => {
    test('When refreshing user data, then it should be returned', async () => {
      const mockedUser = getMockedRefreshUser();

      const mockedUserClient = {
        refreshUser: vi.fn().mockResolvedValue(mockedUser),
      };
      vi.spyOn(SdkManager.instance, 'getUsers').mockReturnValue(mockedUserClient as any);

      const result = await UserService.instance.refreshUser();

      expect(result).toEqual(mockedUser);
    });
  });
});

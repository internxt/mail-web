/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SdkManager } from '..';
import { AuthService } from '.';
import { LocalStorageService } from '@/services/local-storage';
import { CryptoService } from '@/services/crypto';

describe('Auth Service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  describe('Check if the credentials are correct', () => {
    const mockedSalt = 'abcdef1234567890';
    const mockedHash = 'hashed-pw';
    test('When the credentials are valid, then it should return true with the hashed password', async () => {
      const mockedAuthClient = {
        areCredentialsCorrect: vi.fn().mockResolvedValue(true),
      } as any;

      vi.spyOn(CryptoService.instance, 'getSalt').mockResolvedValue(mockedSalt);
      vi.spyOn(CryptoService.instance, 'passToHash').mockReturnValue({ salt: mockedSalt, hash: mockedHash });
      vi.spyOn(LocalStorageService.instance, 'get').mockReturnValue('mock-token');
      vi.spyOn(SdkManager.instance, 'getAuth').mockReturnValue(mockedAuthClient);

      const result = await AuthService.instance.areCredentialsCorrect('my-password');

      expect(result.areValidCredentials).toStrictEqual(true);
      expect(result.hashedPassword).toStrictEqual(mockedHash);
    });

    test('When the credentials are invalid, then it should return false', async () => {
      const mockedAuthClient = {
        areCredentialsCorrect: vi.fn().mockResolvedValue(false),
      } as any;

      vi.spyOn(CryptoService.instance, 'getSalt').mockResolvedValue(mockedSalt);
      vi.spyOn(CryptoService.instance, 'passToHash').mockReturnValue({ salt: mockedSalt, hash: mockedHash });
      vi.spyOn(LocalStorageService.instance, 'get').mockReturnValue('mock-token');
      vi.spyOn(SdkManager.instance, 'getAuth').mockReturnValue(mockedAuthClient);

      const result = await AuthService.instance.areCredentialsCorrect('wrong-password');

      expect(result.areValidCredentials).toBe(false);
    });

    test('When no token is stored, then it should still call the endpoint', async () => {
      const mockedAuthClient = {
        areCredentialsCorrect: vi.fn().mockResolvedValue(true),
      } as any;

      vi.spyOn(CryptoService.instance, 'getSalt').mockResolvedValue(mockedSalt);
      vi.spyOn(CryptoService.instance, 'passToHash').mockReturnValue({ salt: mockedSalt, hash: mockedHash });
      vi.spyOn(LocalStorageService.instance, 'get').mockReturnValue(null);
      vi.spyOn(SdkManager.instance, 'getAuth').mockReturnValue(mockedAuthClient);

      await AuthService.instance.areCredentialsCorrect('my-password');

      expect(mockedAuthClient.areCredentialsCorrect).toHaveBeenCalledWith(mockedHash, undefined);
    });
  });
});

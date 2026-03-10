/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { NavigationService } from './index';
import { NavigationNotInitializedError } from './navigation.errors';
import { AppView } from '@/routes/paths';
import type { NavigateFunction } from 'react-router-dom';

describe('Navigation Service', () => {
  let navigationService: NavigationService;
  let mockNavigate: ReturnType<typeof vi.fn<NavigateFunction>>;

  beforeEach(() => {
    navigationService = NavigationService.instance;
    mockNavigate = vi.fn<NavigateFunction>().mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    test('When init is called with a navigate function, then navigation should be initialized', () => {
      navigationService.init(mockNavigate as any);

      expect(() => navigationService.navigate(AppView.inbox)).not.toThrow();
    });
  });

  describe('Navigate', () => {
    test('When navigate is called without initialization, then an error indicating so is thrown', () => {
      const uninitializedService = new NavigationService();

      expect(() => uninitializedService.navigate(AppView.inbox)).toThrow(NavigationNotInitializedError);
    });

    test('When navigate is called with a path, then it should call the navigate function with that path', () => {
      navigationService.init(mockNavigate as any);

      navigationService.navigate(AppView.inbox);

      expect(mockNavigate).toHaveBeenCalledWith(AppView.inbox, undefined);
    });

    test('When navigate is called with a path and options, then it should call the navigate function with both', () => {
      navigationService.init(mockNavigate as any);
      const options = { state: { from: 'test' } };

      navigationService.navigate(AppView.inbox, options);

      expect(mockNavigate).toHaveBeenCalledWith(AppView.inbox, options);
    });
  });

  describe('Replace', () => {
    test('When replace is called without initialization, then an error indicating so is thrown', () => {
      const uninitializedService = new NavigationService();

      expect(() => uninitializedService.replace(AppView.inbox)).toThrow(NavigationNotInitializedError);
    });

    test('When replacing a path, then it should call navigate with replace option', () => {
      navigationService.init(mockNavigate as any);

      navigationService.replace(AppView.inbox);

      expect(mockNavigate).toHaveBeenCalledWith(AppView.inbox, { replace: true });
    });

    test('When replacing with additional options, then it should merge them with replace option', () => {
      navigationService.init(mockNavigate as any);
      const options = { state: { from: 'test' } };

      navigationService.replace(AppView.inbox, options);

      expect(mockNavigate).toHaveBeenCalledWith(AppView.inbox, { replace: true, state: { from: 'test' } });
    });
  });

  describe('Get Pathname', () => {
    test('When getting the pathname, then it should return the current pathname', () => {
      const pathname = navigationService.getPathname();

      expect(typeof pathname).toBe('string');
      expect(pathname).toBe(globalThis.location.pathname);
    });
  });
});

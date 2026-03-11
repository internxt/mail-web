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

      expect(() => navigationService.navigate({ id: AppView.Inbox })).not.toThrow();
    });
  });

  describe('Navigate', () => {
    test('When navigate is called without initialization, then an error indicating so is thrown', () => {
      const uninitializedService = new NavigationService();

      expect(() => uninitializedService.navigate({ id: AppView.Inbox })).toThrow(NavigationNotInitializedError);
    });

    test('When navigate is called with a path, then it should call the navigate function with that path', () => {
      navigationService.init(mockNavigate as any);

      navigationService.navigate({ id: AppView.Inbox });

      expect(mockNavigate).toHaveBeenCalledWith('/inbox', undefined);
    });

    test('When navigate is called with a path and options, then it should call the navigate function with both', () => {
      navigationService.init(mockNavigate as any);
      const options = { state: { from: 'test' } };

      navigationService.navigate({ id: AppView.Inbox, options });

      expect(mockNavigate).toHaveBeenCalledWith('/inbox', options);
    });
  });

  describe('Replace', () => {
    test('When replace is called without initialization, then an error indicating so is thrown', () => {
      const uninitializedService = new NavigationService();

      expect(() => uninitializedService.replace({ id: AppView.Inbox })).toThrow(NavigationNotInitializedError);
    });

    test('When replacing a path, then it should call navigate with replace option', () => {
      navigationService.init(mockNavigate as any);

      navigationService.replace({ id: AppView.Inbox });

      expect(mockNavigate).toHaveBeenCalledWith('/inbox', { replace: true });
    });

    test('When replacing with additional options, then it should merge them with replace option', () => {
      navigationService.init(mockNavigate as any);
      const options = { state: { from: 'test' } };

      navigationService.replace({ id: AppView.Inbox, options });

      expect(mockNavigate).toHaveBeenCalledWith('/inbox', { replace: true, state: { from: 'test' } });
    });
  });

  describe('Get View', () => {
    test('When getting the view for a configured route, then it should return the route config', () => {
      vi.spyOn(globalThis, 'location', 'get').mockReturnValue({ pathname: '/inbox' } as Location);

      const view = navigationService.getView();

      expect(view?.id).toBe(AppView.Inbox);
      expect(view?.path).toBe('/inbox');
    });

    test('When getting the view for an unknown route, then it should return undefined', () => {
      vi.spyOn(globalThis, 'location', 'get').mockReturnValue({ pathname: '/unknown' } as Location);

      const view = navigationService.getView();

      expect(view).toBeUndefined();
    });
  });
});

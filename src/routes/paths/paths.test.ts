import { describe, expect, test } from 'vitest';
import {
  AppLayout,
  AppView,
  getProtectedRoutes,
  getProtectedRoutesByLayout,
  getPublicRoutes,
  getRouteConfig,
  getViewByPath,
} from '.';

describe('Route Utilities', () => {
  describe('Get routes', () => {
    test('When getting config for Inbox, then it should return the inbox route config', () => {
      const config = getRouteConfig(AppView.Inbox);

      expect(config.id).toBe(AppView.Inbox);
      expect(config.path).toBe('/inbox');
      expect(config.isProtected).toBe(true);
      expect(config.layout).toBe(AppLayout.SidebarAndHeader);
    });

    test('When getting config for Welcome, then it should return the welcome route config', () => {
      const config = getRouteConfig(AppView.Welcome);

      expect(config.id).toBe(AppView.Welcome);
      expect(config.path).toBe('/welcome');
      expect(config.isProtected).toBeUndefined();
    });
  });

  describe('Getting protected routes', () => {
    test('When getting protected routes, then it should return only routes that are protected', () => {
      const protectedRoutes = getProtectedRoutes();

      expect(protectedRoutes.length).toBeGreaterThan(0);
      expect(protectedRoutes.every((route) => route.isProtected === true)).toBeTruthy();
    });

    test('When getting protected routes, then it should not include a public route', () => {
      const protectedRoutes = getProtectedRoutes();
      const routeIds = protectedRoutes.map((route) => route.id);

      expect(routeIds).not.toContain(AppView.Welcome);
    });
  });

  describe('Get protected routes with its layout', () => {
    test('When getting protected routes by layout, then the main layout (sidebar and header) layout should contain the correct routes', () => {
      const routesByLayout = getProtectedRoutesByLayout();
      const sidebarRouteIds = routesByLayout[AppLayout.SidebarAndHeader].map((route) => route.id);

      expect(sidebarRouteIds).toContain(AppView.Inbox);
      expect(sidebarRouteIds).toContain(AppView.Sent);
      expect(sidebarRouteIds).toContain(AppView.Drafts);
      expect(sidebarRouteIds).toContain(AppView.Trash);
    });

    test('When a route has no layout, then it should be grouped by non layout', () => {
      const routesByLayout = getProtectedRoutesByLayout();

      expect(routesByLayout[AppLayout.None]).toBeUndefined();
    });
  });

  describe('Getting public routes', () => {
    test('When getting public routes, then it should return only routes that are no need to be authenticated to visit them', () => {
      const publicRoutes = getPublicRoutes();

      expect(publicRoutes.length).toBeGreaterThan(0);
      expect(publicRoutes.every((route) => !route.isProtected)).toBeTruthy();
    });

    test('When getting public routes, then it should include the routes that are not protected', () => {
      const publicRoutes = getPublicRoutes();
      const routeIds = publicRoutes.map((route) => route.id);

      expect(routeIds).toContain(AppView.Welcome);
    });
  });

  describe('Get view by path', () => {
    test('When getting view by the Inbox path, then it should return the inbox route config', () => {
      const route = getViewByPath('/inbox');

      expect(route).toBeDefined();
      expect(route?.id).toBe(AppView.Inbox);
    });

    test('When getting view by the Welcome path, then it should return the welcome route config', () => {
      const route = getViewByPath('/welcome');

      expect(route).toBeDefined();
      expect(route?.id).toBe(AppView.Welcome);
    });

    test('When getting view by non-existent path, then it should return undefined', () => {
      const route = getViewByPath('/non-existent');

      expect(route).toBeUndefined();
    });
  });
});

import { type RouteObject, Navigate } from 'react-router-dom';
import { Suspense, createElement } from 'react';
import { getPublicRoutes, AppLayout, type RouteConfig, layoutComponents, getProtectedRoutesByLayout } from './paths';
import { PublicRoute } from './guards/PublicRoute';
import { ProtectedRoute } from './guards/ProtectedRoute';

const toRouteObject = (route: RouteConfig): RouteObject => {
  return {
    path: route.path,
    // !TODO: Add a loader here
    element: <Suspense fallback={<div>Loading...</div>}>{createElement(route.element, route.props ?? {})}</Suspense>,
  };
};

const buildProtectedRoutes = (): RouteObject[] => {
  const protectedRoutes = getProtectedRoutesByLayout();

  return Object.entries(protectedRoutes).flatMap(([layout, routes]) => {
    if (!routes) return [];
    const routeObjects = routes.map(toRouteObject);
    const LayoutComponent = layoutComponents[layout as AppLayout];

    return LayoutComponent ? [{ element: <LayoutComponent />, children: routeObjects }] : routeObjects;
  });
};

export const routes: RouteObject[] = [
  {
    element: <PublicRoute />,
    children: getPublicRoutes().map(toRouteObject),
  },

  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to="/inbox" replace /> },
      ...buildProtectedRoutes(),
      { path: '*', element: <Navigate to="/inbox" replace /> },
    ],
  },
];

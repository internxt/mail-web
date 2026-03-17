/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, type LazyExoticComponent, type ComponentType } from 'react';
import SidebarAndHeaderLayout from '../layouts/SidebarAndHeaderLayout';

export enum AppView {
  Welcome = 'welcome',
  IdentitySetup = 'identity-setup',
  Inbox = 'inbox',
  Sent = 'sent',
  Drafts = 'drafts',
  Spam = 'spam',
  Trash = 'trash',
}

export enum AppLayout {
  SidebarAndHeader = 'sidebar-and-header',
  None = 'none',
}

const WelcomePage = lazy(() => import('@/features/welcome'));
const IdentitySetup = lazy(() => import('@/features/identity-setup'));
const MailView = lazy(() => import('@/features/mail/MailView'));

export const layoutComponents: Record<AppLayout, React.ComponentType<any> | null> = {
  [AppLayout.SidebarAndHeader]: SidebarAndHeaderLayout,
  [AppLayout.None]: null,
};

export interface RouteConfig {
  id: AppView;
  path: string;
  isProtected?: boolean;
  layout?: AppLayout;
  element: LazyExoticComponent<ComponentType<any>>;
  props?: Record<string, unknown>;
}

const routeConfigs: RouteConfig[] = [
  {
    id: AppView.Welcome,
    path: '/welcome',
    element: WelcomePage,
  },
  {
    id: AppView.IdentitySetup,
    path: '/identity-setup',
    element: IdentitySetup,
    isProtected: true,
  },
  {
    id: AppView.Inbox,
    path: '/inbox',
    isProtected: true,
    layout: AppLayout.SidebarAndHeader,
    element: MailView,
    props: { folder: 'inbox' },
  },
  {
    id: AppView.Sent,
    path: '/sent',
    isProtected: true,
    layout: AppLayout.SidebarAndHeader,
    element: MailView,
    props: { folder: 'sent' },
  },
  {
    id: AppView.Drafts,
    path: '/drafts',
    isProtected: true,
    layout: AppLayout.SidebarAndHeader,
    element: MailView,
    props: { folder: 'drafts' },
  },
  {
    id: AppView.Spam,
    path: '/spam',
    isProtected: true,
    layout: AppLayout.SidebarAndHeader,
    element: MailView,
    props: { folder: 'spam' },
  },
  {
    id: AppView.Trash,
    path: '/trash',
    isProtected: true,
    layout: AppLayout.SidebarAndHeader,
    element: MailView,
    props: { folder: 'trash' },
  },
];

export const getRouteConfig = (route: AppView): RouteConfig =>
  routeConfigs.find((routeConfig) => routeConfig.id === route) as RouteConfig;

export const getProtectedRoutes = () => routeConfigs.filter((route) => route.isProtected);
export const getProtectedRoutesByLayout = (): Record<AppLayout, RouteConfig[]> => {
  return getProtectedRoutes().reduce(
    (acc, route) => {
      const key = route.layout ?? AppLayout.None;
      const routes = (acc[key] ??= []);
      routes.push(route);
      return acc;
    },
    {} as Record<AppLayout, RouteConfig[]>,
  );
};

export const getPublicRoutes = () => routeConfigs.filter((route) => !route.isProtected);
export const getViewByPath = (path: string) => routeConfigs.find((route) => route.path === path);

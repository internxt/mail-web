import { type RouteObject, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import RootLayout from '@/layouts/RootLayout';

const WelcomePage = lazy(() => import('@/features/welcome'));
const MailView = lazy(() => import('@/features/mail/MailView'));
const SpamDemo = lazy(() => import('@/features/spam-demo/SpamDemo'))

export const routes: RouteObject[] = [
  {
    index: true,
    path: '/welcome',
    element: <WelcomePage />,
  },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/welcome" replace />,
      },
      { path: 'inbox', element: <MailView folder="inbox" /> },
      { path: 'trash', element: <MailView folder="trash" /> },
      { path: 'spam-demo', element: <SpamDemo folder = "demo"/>},
      {
        path: '*',
        element: <Navigate to="/inbox" replace />,
      },
    ],
  },
];

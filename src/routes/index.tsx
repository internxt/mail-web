import { type RouteObject, Navigate } from 'react-router-dom'
import { lazy } from 'react'
import RootLayout from '@/layouts/RootLayout'

const MailView = lazy(() => import('@/features/mail/MailView'))

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/inbox" replace /> },
      { path: 'inbox', element: <MailView folder="inbox" /> },
      { path: 'trash', element: <MailView folder="trash" /> },
      {
        path: '*',
        element: <Navigate to="/inbox" replace />,
      },
    ],
  },
]

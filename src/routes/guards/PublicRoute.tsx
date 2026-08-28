import { useAppSelector } from '@/store/hooks';
import { AppView, getRouteConfig } from '../paths';
import { Navigate, Outlet } from 'react-router-dom';
import { useMailAccess } from '@/hooks/mail/useMailAccess';

export const PublicRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const { status } = useMailAccess();

  if (!isAuthenticated) {
    return <Outlet />;
  }

  if (status === 'loading') return null;

  // The welcome page doubles as the upgrade screen, so an authenticated user whose plan lacks
  // Mail stays here instead of being sent to a mailbox they cannot open.
  if (status === 'plan-required') {
    return <Outlet />;
  }

  const to = getRouteConfig(AppView.Inbox).path;
  return <Navigate to={to} replace />;
};

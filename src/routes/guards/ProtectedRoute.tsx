import { useAppSelector } from '@/store/hooks';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppView, getRouteConfig } from '../paths';
import { useMailAccountGuard } from '@/hooks/mail/useMailAccountGuard';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const location = useLocation();
  const { status } = useMailAccountGuard();

  if (!isAuthenticated) {
    const to = getRouteConfig(AppView.Welcome).path;
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  const identitySetupPath = getRouteConfig(AppView.IdentitySetup).path;
  const isOnIdentitySetup = location.pathname === identitySetupPath;

  if (status === 'loading') return null;

  if (status === 'not-setup' && !isOnIdentitySetup) {
    return <Navigate to={identitySetupPath} state={{ from: location }} replace />;
  }

  if (status === 'ready' && isOnIdentitySetup) {
    return <Navigate to={getRouteConfig(AppView.Inbox).path} replace />;
  }

  return <Outlet />;
};

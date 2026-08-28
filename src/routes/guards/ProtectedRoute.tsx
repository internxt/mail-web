import { useAppSelector } from '@/store/hooks';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppView, getRouteConfig } from '../paths';
import { useMailAccess } from '@/hooks/mail/useMailAccess';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const location = useLocation();
  const { status } = useMailAccess();

  const welcomePath = getRouteConfig(AppView.Welcome).path;

  if (!isAuthenticated) {
    return <Navigate to={welcomePath} state={{ from: location }} replace />;
  }

  const identitySetupPath = getRouteConfig(AppView.IdentitySetup).path;
  const isOnIdentitySetup = location.pathname === identitySetupPath;

  if (status === 'loading') return null;

  if (status === 'plan-required') {
    return <Navigate to={welcomePath} state={{ from: location }} replace />;
  }

  if (status === 'needs-setup' && !isOnIdentitySetup) {
    return <Navigate to={identitySetupPath} state={{ from: location }} replace />;
  }

  if (status === 'ready' && isOnIdentitySetup) {
    return <Navigate to={getRouteConfig(AppView.Inbox).path} replace />;
  }

  return <Outlet />;
};

import { useAppSelector } from '@/store/hooks';
import { AppView, getRouteConfig } from '../paths';
import { Navigate, Outlet } from 'react-router-dom';

export const PublicRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.user);

  if (isAuthenticated) {
    const to = getRouteConfig(AppView.Inbox).path;
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
};

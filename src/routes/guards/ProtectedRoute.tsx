import { useAppSelector } from '@/store/hooks';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppView, getRouteConfig } from '../paths';

export const ProtectedRoute = () => {
  const { isAuthenticated } = useAppSelector((state) => state.user);
  const location = useLocation();

  // !TODO: Check if the user already updated the mail to send him to the Inbox instead
  if (!isAuthenticated) {
    const to = getRouteConfig(AppView.Welcome).path;
    return <Navigate to={to} state={{ from: location }} replace />;
  }

  return <Outlet />;
};

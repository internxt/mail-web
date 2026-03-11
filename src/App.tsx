import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { NavigationService } from './services/navigation';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { initializeUserThunk } from './store/slices/user/thunks';
import { AppView } from './routes/paths';

const router = createBrowserRouter(routes);
const navigation = router.navigate;

NavigationService.instance.init(navigation);

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.user);

  const initializeUserState = async () => {
    await dispatch(initializeUserThunk());

    const isAuthenticatedAndWelcomePage =
      isAuthenticated && NavigationService.instance.getPathname() === AppView.welcome;
    if (!isAuthenticated) {
      return NavigationService.instance.replace(AppView.welcome);
    } else if (isAuthenticatedAndWelcomePage) {
      return NavigationService.instance.replace(AppView.inbox);
    }
  };

  useEffect(() => {
    initializeUserState();
  }, []);

  return <RouterProvider router={router} />;
}

export default App;

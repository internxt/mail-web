import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { NavigationService } from './services/navigation';
import { useEffect } from 'react';
import { useAppDispatch } from './store/hooks';
import { initializeUserThunk } from './store/slices/user/thunks';

const router = createBrowserRouter(routes);
const navigation = router.navigate;

NavigationService.instance.init(navigation);

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeUserThunk());
  }, []);

  return <RouterProvider router={router} />;
}

export default App;

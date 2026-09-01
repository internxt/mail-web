import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { NavigationService } from './services/navigation';
import { Suspense, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { initializeUserThunk } from './store/slices/user/thunks';
import { Toaster } from 'react-hot-toast';
import { AppLoader } from './components/AppLoader';
import { DialogsRoot } from './context/dialog-manager/DialogsRoot';

const router = createBrowserRouter(routes);
const navigation = router.navigate;

NavigationService.instance.init(navigation);

function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, isInitialized } = useAppSelector((state) => state.user);

  const initializeUser = async () => {
    await dispatch(initializeUserThunk()).unwrap();
  };

  useEffect(() => {
    void initializeUser();
  }, []);

  if (isAuthenticated && !isInitialized) {
    return <AppLoader className="h-screen w-screen" />;
  }

  return (
    <>
      <Toaster
        position="bottom-center"
        containerStyle={{
          filter: 'drop-shadow(0 32px 40px rgba(18, 22, 25, 0.08))',
        }}
      />
      <Suspense fallback={<AppLoader className="h-screen w-screen" />}>
        <RouterProvider router={router} />
      </Suspense>
      <DialogsRoot />
    </>
  );
}

export default App;

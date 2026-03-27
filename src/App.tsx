import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { NavigationService } from './services/navigation';
import { Activity, useEffect } from 'react';
import { useAppDispatch } from './store/hooks';
import { initializeUserThunk, refreshAvatarThunk } from './store/slices/user/thunks';
import { Toaster } from 'react-hot-toast';
import { ActionDialog, useActionDialog } from './context/dialog-manager';
import { ComposeMessageDialog } from './components/compose-message';

const router = createBrowserRouter(routes);
const navigation = router.navigate;

NavigationService.instance.init(navigation);

function App() {
  const dispatch = useAppDispatch();
  const { isDialogOpen } = useActionDialog();
  const isComposeMessageDialogOpen = isDialogOpen(ActionDialog.ComposeMessage);

  const initializeUser = async () => {
    await dispatch(initializeUserThunk()).unwrap();
    await dispatch(refreshAvatarThunk()).unwrap();
  };

  useEffect(() => {
    initializeUser();
  }, []);

  return (
    <>
      <Toaster
        position="bottom-center"
        containerStyle={{
          filter: 'drop-shadow(0 32px 40px rgba(18, 22, 25, 0.08))',
        }}
      />
      <RouterProvider router={router} />
      <Activity mode={isComposeMessageDialogOpen ? 'visible' : 'hidden'}>
        <ComposeMessageDialog />
      </Activity>
    </>
  );
}

export default App;

import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import { NavigationService } from './services/navigation';

const router = createBrowserRouter(routes);
const navigation = router.navigate;

NavigationService.instance.init(navigation);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

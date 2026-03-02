import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';
import './App.css';

/**
 * Configuración del router de la aplicación
 */
const router = createBrowserRouter(routes);

/**
 * Componente principal de la aplicación
 * Configura React Router para toda la app
 */
function App() {
  return <RouterProvider router={router} />;
}

export default App;

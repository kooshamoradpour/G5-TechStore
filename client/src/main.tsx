import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App.js';
import Home from './pages/Home.js';
import ErrorPage from './pages/Error.js';
import Cart from './pages/Cart.js';
import Contact from './pages/Contact.js';


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Home />
      }, 
      {
        path: '/home',
        element: <Home/>
      },
      {
        path: '/cart',
        element: <Cart />
      },
      {
        path: '/contact',
        element: <Contact />
      }
    ]
  },
]);

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<RouterProvider router={router} />);
}

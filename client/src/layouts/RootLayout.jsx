import { Outlet } from 'react-router';
import Header from '../components/Header';

/**
 * RootLayout Component
 * 
 * This layout wraps all authenticated routes with the persistent Header component.
 * The Outlet renders the matched child route content below the Header.
 */
export default function RootLayout() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

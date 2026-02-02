import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import { getAdminUser } from '../pages/admin/AdminLogin';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/admin/login';
  const admin = getAdminUser();
  const redirectTo = '/login?redirect=' + encodeURIComponent(location.pathname || '/admin/dashboard');

  // Единый вход: /admin/login и неавторизованные — на общий /login с возвратом в админку
  if (isLoginPage || !admin) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <>
      <AdminNavbar />
      <Outlet />
    </>
  );
};

export default AdminLayout;

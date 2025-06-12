import React from 'react';
import { Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { authService } from '../../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
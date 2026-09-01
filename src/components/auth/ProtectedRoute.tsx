import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import ThemedLoader from '../layout/ThemedLoader';

const ProtectedRoute: React.FC = () => {
  const { isLoading, isAuthenticated, isAllowed } = useAuthContext();

  if (isLoading) {
    return <ThemedLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (isAuthenticated && !isAllowed) {
    return <Navigate to="/denied" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

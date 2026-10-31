import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from './LoadingScreen';

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen message="Validating secure session..." />;
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

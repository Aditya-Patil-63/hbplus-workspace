import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';

export default function IndexScreen() {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen message="Checking workspace session..." />;
  }

  if (status === 'authenticated') {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}

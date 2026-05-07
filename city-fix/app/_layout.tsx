import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';

// Create a client
const queryClient = new QueryClient();

function RootLayoutNav() {
  const { token, isLoading, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  console.log('[RootLayoutNav] Rendering. Token:', !!token, 'Loading:', isLoading);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = segments[0] === 'welcome' || segments[0] === 'login' || segments[0] === 'create-account' || segments[0] === 'worker-registration' || segments[0] === 'forgot-password' || segments[0] === 'reset-password';

    console.log('[RootLayout] Auth State Check:', {
      token: !!token,
      segment: segments[0],
      isAuthRoute,
      path: segments.join('/')
    });

    if (!token && !isAuthRoute) {
      // Not logged in -> Redirect to welcome
      console.log('[RootLayout] Redirecting to /welcome');
      router.replace('/welcome');
    } else if (token && isAuthRoute) {
      // Logged in but trying to access auth screens -> Redirect to home
      console.log('[RootLayout] Redirecting to /');
      router.replace('/');
    }
  }, [token, isLoading, segments.join(',')]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#2065ff" />
      </View>
    );
  }

  return <Stack />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

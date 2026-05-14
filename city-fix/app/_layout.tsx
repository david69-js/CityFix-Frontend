import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { usePushNotifications } from '../src/hooks/usePushNotifications';

// Create a client
const queryClient = new QueryClient();

function RootLayoutNav() {
  const { token, isLoading, initializeAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize push notifications
  usePushNotifications();

  console.log('[RootLayoutNav] Rendering. Token:', !!token, 'Loading:', isLoading);

  useEffect(() => {
    initializeAuth();
    
    // Initialize Google Sign-In safely
    try {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
      const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
      
      console.log('[RootLayout] Configuring Google Sign-In');
      console.log('[RootLayout] Web Client ID:', webClientId);
      console.log('[RootLayout] iOS Client ID:', iosClientId);
      
      if (webClientId && iosClientId) {
        GoogleSignin.configure({
          webClientId,
          iosClientId,
          offlineAccess: true,
        });
      } else {
        console.error('[RootLayout] Google Client IDs are not defined in .env');
      }
    } catch (e) {
      console.warn('[RootLayout] Google Sign-In native module not found or failed to configure:', e);
    }
  }, []); // Only initialize once on mount

  useEffect(() => {
    // If we're still loading the initial auth state, don't redirect
    if (isLoading) return;

    const isAuthRoute = segments[0] === 'welcome' || segments[0] === 'login' || segments[0] === 'create-account' || segments[0] === 'worker-registration' || segments[0] === 'forgot-password' || segments[0] === 'reset-password';

    // Small delay to ensure state consistency during navigation transitions
    const timeout = setTimeout(() => {
      if (!token && !isAuthRoute) {
        // Not logged in and trying to access a protected route -> Welcome
        console.log('[RootLayout] Redirecting to /welcome (Not logged in)');
        router.replace('/welcome');
      } else if (token && isAuthRoute) {
        // Logged in but still on an auth screen -> Home
        console.log('[RootLayout] Redirecting to / (Logged in)');
        router.replace('/');
      }
    }, 10);

    return () => clearTimeout(timeout);
  }, [token, isLoading, segments[0]]);

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

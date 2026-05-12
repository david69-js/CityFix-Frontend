import { Platform } from 'react-native';

/**
 * Derives the backend's base URL (scheme + host + port) from the API URL env var.
 * e.g. "http://localhost:8888/api" → "http://localhost:8888"
 */
const getServerBase = (): string => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8888/api';
  // Strip the /api suffix to get the raw server origin
  let base = apiUrl.replace(/\/api\/?$/, '');

  // Android emulator: localhost → 10.0.2.2
  if (Platform.OS === 'android' && base.includes('localhost')) {
    base = base.replace('localhost', '10.0.2.2');
  }

  return base;
};

/**
 * Fixes image URLs that come from the backend.
 * Handles relative paths, localhost references, and 127.0.0.1.
 */
export const fixImageUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;

  const baseUrl = getServerBase();

  // If it's a relative path (doesn't start with http), prepend the base
  if (!url.startsWith('http')) {
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const storagePath = cleanUrl.startsWith('/storage') ? cleanUrl : `/storage${cleanUrl}`;
    return `${baseUrl}${storagePath}`;
  }

  // If it's already a full URL, fix localhost / 127.0.0.1 to match our server base
  // Extract just the host:port from our base URL
  try {
    const baseOrigin = new URL(baseUrl);
    return url
      .replace(/localhost(:\d+)?/, `${baseOrigin.hostname}${baseOrigin.port ? ':' + baseOrigin.port : ''}`)
      .replace(/127\.0\.0\.1(:\d+)?/, `${baseOrigin.hostname}${baseOrigin.port ? ':' + baseOrigin.port : ''}`);
  } catch {
    // Fallback: simple replacement
    return url.replace('localhost', 'localhost').replace('127.0.0.1', 'localhost');
  }
};

import axios, { InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { getItemAsync } from '../utils/storage';

// Retrieve the base URL from the environment variables
// Fix: Android Emulator's 'localhost' doesn't point to the Mac, it points to itself (the virtual device). 
// The special alias '10.0.2.2' routes back to the host Mac's localhost.
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8888/api';
const API_URL = Platform.OS === 'android' && ENV_API_URL.includes('localhost')
  ? ENV_API_URL.replace('localhost', '10.0.2.2')
  : ENV_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let authToken: string | null = null;

/**
 * Sets the authentication token in memory for immediate use by the interceptor.
 * This helps avoid race conditions between storage and subsequent API calls.
 */
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Interceptor to add the token to every request automatically
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Use in-memory token if available, otherwise fallback to storage
      const token = authToken || await getItemAsync('userToken');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token for request:', error);
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

export default apiClient;

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
  timeout: 10000,
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
      const token = authToken || await getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token for request:', error);
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Interceptor to catch and log response errors (DEBUG ONLY)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log(`[AxiosError] ${error.config?.method?.toUpperCase()} ${error.config?.url} -> Status: ${error.response?.status}`);
    if (error.response?.data) {
      console.log(`[AxiosError] Data:`, JSON.stringify(error.response.data));
    }
    if (error.response?.status === 401) {
      const { useAuthStore } = require('../store/authStore');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default apiClient;

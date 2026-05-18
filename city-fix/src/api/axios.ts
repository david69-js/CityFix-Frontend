import axios, { InternalAxiosRequestConfig, getAdapter } from 'axios';
import { Platform } from 'react-native';
import { getItemAsync, setItemAsync } from '../utils/storage';

// Retrieve the base URL from the environment variables
const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8888/api';
const API_URL = Platform.OS === 'android' && ENV_API_URL.includes('localhost')
  ? ENV_API_URL.replace('localhost', '10.0.2.2')
  : ENV_API_URL;

// Helper to get local categories from storage
const getLocalCategories = async (): Promise<any[]> => {
  try {
    const data = await getItemAsync('local_categories');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading local categories:', error);
    return [];
  }
};

// Helper to save a new category to local storage
const saveLocalCategory = async (category: any): Promise<void> => {
  try {
    const existing = await getLocalCategories();
    existing.push(category);
    await setItemAsync('local_categories', JSON.stringify(existing));
  } catch (error) {
    console.error('Error saving local category:', error);
  }
};

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  adapter: async (config) => {
    const defaultAdapter = getAdapter(axios.defaults.adapter);
    if (!defaultAdapter) {
      throw new Error('Default adapter is not defined');
    }

    const isCategoriesUrl = (config.url === '/categories' || config.url === 'categories' || config.url?.endsWith('/categories')) && !config.url?.includes('admin');

    // Intercept POST /categories (public category creation simulation)
    if (config.method === 'post' && isCategoriesUrl) {
      try {
        let payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        const newCategory = {
          id: Math.floor(Math.random() * 100000) + 1000,
          name: payload.name,
          icon: payload.icon || 'fa-solid fa-road',
          parent_id: payload.parent_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await saveLocalCategory(newCategory);

        return {
          data: newCategory,
          status: 201,
          statusText: 'Created',
          headers: {},
          config,
        };
      } catch (error) {
        console.error('Error in mock POST /categories adapter:', error);
      }
    }

    // Intercept GET /categories to append any locally created categories
    if (config.method === 'get' && isCategoriesUrl) {
      try {
        const response = await defaultAdapter(config);
        const localCats = await getLocalCategories();
        if (Array.isArray(response.data)) {
          response.data = [...response.data, ...localCats];
        } else if (response.data && Array.isArray(response.data.data)) {
          response.data.data = [...response.data.data, ...localCats];
        }
        return response;
      } catch (error) {
        // Fallback: return only local categories if network/server is offline
        const localCats = await getLocalCategories();
        if (localCats.length > 0) {
          return {
            data: localCats,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          };
        }
        throw error;
      }
    }

    return defaultAdapter(config);
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

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Retrieve the base URL from the environment variables
const API_URL = process.env.EXPO_PUBLIC_API_URL;

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Interceptor to add the token to every request automatically
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Securely fetch the token from the device
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token for request:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;

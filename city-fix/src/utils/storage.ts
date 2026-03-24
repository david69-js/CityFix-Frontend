import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Fallback temporal en memoria si SecureStore o localStorage fallan
const memoryStorage = new Map<string, string>();

export const getItemAsync = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key) || memoryStorage.get(key) || null;
    } catch (e) {
      return memoryStorage.get(key) || null;
    }
  }
  
  try {
    const value = await SecureStore.getItemAsync(key);
    return value || memoryStorage.get(key) || null;
  } catch (e) {
    console.warn('SecureStore unavailable. Using memory fallback.');
    return memoryStorage.get(key) || null;
  }
};

export const setItemAsync = async (key: string, value: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      memoryStorage.set(key, value);
    }
    return;
  }
  
  try {
    await SecureStore.setItemAsync(key, value);
    // Also set locally so if getItemAsync fails, we have it
    memoryStorage.set(key, value);
  } catch (e) {
    console.warn('SecureStore unavailable context. Using memory fallback.');
    memoryStorage.set(key, value);
  }
};

export const deleteItemAsync = async (key: string): Promise<void> => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      memoryStorage.delete(key);
    }
    return;
  }
  
  try {
    await SecureStore.deleteItemAsync(key);
    memoryStorage.delete(key);
  } catch (e) {
    memoryStorage.delete(key);
  }
};

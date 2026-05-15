import { Platform } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

/**
 * Returns a consistent color for issue categories.
 */
export const getCategoryColor = (name: string, colors: any) => {
  const n = (name || '').toLowerCase();
  if (n.includes('basura')) return colors.tagGarbageBg || '#F59E0B';
  if (n.includes('bache') || n.includes('vía')) return colors.tagRoadsBg || '#4B5563';
  if (n.includes('luz') || n.includes('iluminación')) return colors.tagLightingBg || '#EAB308';
  if (n.includes('agua')) return colors.tagWaterBg || '#3B82F6';
  return colors.tagDefaultBg || '#6B7280';
};

/**
 * Returns a consistent icon name for issue statuses.
 */
export const getStatusIcon = (name: string) => {
  const n = (name || '').toLowerCase();
  if (n.includes('pendiente') || n.includes('reportado')) return 'alert-circle-outline';
  if (n.includes('proceso') || n.includes('camino')) return 'time-outline';
  if (n.includes('resuelto') || n.includes('listo')) return 'checkmark-circle-outline';
  return 'help-circle-outline';
};

export const fixImageUrl = (url: string | null | undefined) => {
  if (!url) return null;

  let finalUrl = url;

  // Extract base URL from API URL (e.g., https://cityfix-backend-production.up.railway.app)
  const API_URL = process.env.EXPO_PUBLIC_API_URL || '';
  const BASE_URL = API_URL.replace(/\/api\/?$/, '');
  
  // 1. If it's a relative path, make it absolute
  if (!finalUrl.startsWith('http')) {
    const cleanUrl = finalUrl.startsWith('/') ? finalUrl : `/${finalUrl}`;
    finalUrl = cleanUrl.startsWith('/storage/')
      ? `${BASE_URL}${cleanUrl}`
      : `${BASE_URL}/storage${cleanUrl}`;
  }

  // 2. Fix Backend configuration errors (e.g., returning http://localhost instead of production URL)
  // If we have a production API URL but the image URL points to localhost, swap it.
  if (BASE_URL.includes('up.railway.app') && finalUrl.includes('localhost')) {
    finalUrl = finalUrl.replace(/http:\/\/localhost/g, BASE_URL);
  }

  // 3. Android-only patch for local development (only if we are NOT on production)
  if (Platform.OS === 'android' && !BASE_URL.includes('up.railway.app')) {
    finalUrl = finalUrl.replace(/localhost|127\.0\.0\.1/g, '10.0.2.2');
  }

  return finalUrl;
};

/**
 * Helper to map FontAwesome strings from backend to FontAwesome5 icon names
 */
export const getCategoryIcon = (iconName: string) => {
  if (!iconName) return 'question-circle';
  
  // Limpiar formatos comunes de FontAwesome (ej: "fa-solid fa-road", "fas fa-trash", "fa-road")
  let name = iconName.toLowerCase();
  
  // Eliminar prefijos comunes
  name = name.replace('fa-solid ', '')
             .replace('fa-regular ', '')
             .replace('fas ', '')
             .replace('far ', '')
             .replace('fa-', '')
             .replace('fa ', '');
             
  // Manejar nombres compuestos si quedan (ej: "trash-alt")
  const parts = name.split(' ');
  const finalName = parts[parts.length - 1];

  return finalName || 'question-circle';
};

export const STATUS_IDS = {
  PENDIENTE: 1,
  EN_PROCESO: 2,
  RESUELTO: 3,
} as const;

export const COLORS = {
  primary: '#2065ff',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#EF4444',
} as const;

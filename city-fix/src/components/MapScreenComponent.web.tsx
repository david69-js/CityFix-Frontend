import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useIssuesFeed } from '../hooks/useIssues';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../hooks/useThemeColors';
import { BottomTabBar } from './BottomTabBar';

// Default region: Cochabamba, Bolivia
const DEFAULT_REGION = {
  latitude: -17.3895,
  longitude: -66.1568,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// Pin color based on status
const getMarkerColor = (statusName?: string): string => {
  if (!statusName) return '#3B82F6'; // blue default
  const name = statusName.toLowerCase();
  if (name.includes('reportado') || name.includes('pendiente')) return '#F97316'; // orange
  if (name.includes('proceso')) return '#3B82F6'; // blue
  if (name.includes('resuelto') || name.includes('completado')) return '#10B981'; // green
  return '#9CA3AF'; // gray
};

export default function MapScreenComponent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { data: feedData, isLoading } = useIssuesFeed(100);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [isLeafletLoaded, setIsLeafletLoaded] = useState(false);

  const allReports = (feedData?.pages?.flatMap(p => p.data) || []).filter(r => !r.is_hidden);

  // Dynamic CSS injector for pulse animation
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const styleId = 'map-marker-pulse-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes marker-pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        .leaflet-container {
          font-family: inherit;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Request user location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        console.warn('[Map] Could not get user location:', e);
      }
    })();
  }, []);

  // Load Leaflet dynamically on Web
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if ((window as any).L) {
      setIsLeafletLoaded(true);
      return;
    }

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      setIsLeafletLoaded(true);
    };
    document.body.appendChild(script);
  }, []);

  // Filtering logic
  const filteredReports = allReports.filter(report => {
    if (activeFilter === 'Todos') return true;
    
    const statusName = report.status?.name?.toLowerCase() || '';
    
    if (activeFilter === 'Pendientes') {
      return statusName.includes('reportado') || statusName.includes('pendiente');
    }
    if (activeFilter === 'En Proceso') {
      return statusName.includes('proceso') || statusName.includes('atendiendo');
    }
    if (activeFilter === 'Resueltos') {
      return statusName.includes('resuelto') || statusName.includes('completado') || statusName.includes('finalizado');
    }
    return true;
  });

  const getCounts = () => ({
    all: allReports.length,
    reported: allReports.filter(r => { const s = r.status?.name?.toLowerCase() || ''; return s.includes('reportado') || s.includes('pendiente'); }).length,
    inProgress: allReports.filter(r => r.status?.name?.toLowerCase().includes('proceso')).length,
    resolved: allReports.filter(r => { const s = r.status?.name?.toLowerCase() || ''; return s.includes('resuelto') || s.includes('completado'); }).length,
  });

  const counts = getCounts();

  // Initialize and recreate map as needed
  useEffect(() => {
    if (!isLeafletLoaded || !mapContainerRef.current) return;

    const L = (window as any).L;
    const container = mapContainerRef.current;
    
    // Check if container already has an active Leaflet instance attached to it
    if ((container as any)._leaflet_id) {
      return;
    }

    const initialCenter = userLocation 
      ? [userLocation.latitude, userLocation.longitude] 
      : [DEFAULT_REGION.latitude, DEFAULT_REGION.longitude];

    const map = L.map(container, {
      zoomControl: false,
    }).setView(initialCenter, 13);
    
    mapRef.current = map;

    // Use sleeker Dark Matter tiles for Dark Mode, and Voyager tiles for Light Mode
    const tileUrl = colors.background === '#151C2C'
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({
      position: 'topright'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', () => {
      setSelectedReport(null);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, [isLeafletLoaded, colors.background]);

  // Update markers on the map
  useEffect(() => {
    if (!isLeafletLoaded || !mapRef.current || !markersLayerRef.current) return;

    const L = (window as any).L;
    const map = mapRef.current;
    const markersLayer = markersLayerRef.current;

    markersLayer.clearLayers();

    // Draw user location
    if (userLocation) {
      const userIcon = L.divIcon({
        html: `
          <div style="
            width: 14px;
            height: 14px;
            background-color: #3B82F6;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.4);
          "></div>
        `,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(markersLayer)
        .bindTooltip('Tu ubicación', { permanent: false, direction: 'top' });
    }

    // Draw reports
    filteredReports.forEach(report => {
      if (!report.latitude || !report.longitude) return;
      const lat = Number(report.latitude);
      const lng = Number(report.longitude);
      const color = report.status?.color || getMarkerColor(report.status?.name);
      const isSelected = selectedReport?.id === report.id;

      const markerIcon = L.divIcon({
        html: `
          <div style="position: relative;">
            ${isSelected ? `
              <div style="
                position: absolute;
                top: -6px;
                left: -6px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: ${color};
                opacity: 0.3;
                animation: marker-pulse 1.2s infinite ease-out;
              "></div>
            ` : ''}
            <div style="
              position: relative;
              width: 20px;
              height: 20px;
              background-color: ${color};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 6px rgba(0,0,0,0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: transform 0.2s ease-in-out;
              transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
              z-index: ${isSelected ? 9999 : 1};
            ">
              <div style="
                width: 6px;
                height: 6px;
                background-color: white;
                border-radius: 50%;
              "></div>
            </div>
          </div>
        `,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(markersLayer);

      marker.on('click', (e: any) => {
        if (e.originalEvent) {
          e.originalEvent.stopPropagation();
        }
        setSelectedReport(report);
        map.setView([lat, lng], map.getZoom() > 14 ? map.getZoom() : 14, { animate: true });
      });
    });
  }, [isLeafletLoaded, filteredReports, selectedReport, userLocation]);

  // Center map on user location
  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.latitude, userLocation.longitude], 15, { animate: true });
    } else {
      // Prompt standard location request
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(coords);
          if (mapRef.current) {
            mapRef.current.setView([coords.latitude, coords.longitude], 15, { animate: true });
          }
        },
        (e) => console.warn('[Map web] navigator geolocation failed:', e)
      );
    }
  };

  // Fit all markers
  const handleFitAll = () => {
    if (allReports.length > 0 && mapRef.current) {
      const L = (window as any).L;
      const coords = allReports
        .filter(r => r.latitude && r.longitude)
        .map(r => [Number(r.latitude), Number(r.longitude)]);
        
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        mapRef.current.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 15,
          animate: true,
        });
      }
    }
  };

  return (
    <View style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        
        {/* Header */}
        <SafeAreaView style={{ backgroundColor: colors.surface }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textTitle} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mapa de Problemas</Text>
            <TouchableOpacity style={styles.iconButton} onPress={handleFitAll}>
              <Ionicons name="expand-outline" size={22} color={colors.textTitle} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Filters */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
            {[
              { key: 'Todos', count: counts.all },
              { key: 'Pendientes', count: counts.reported },
              { key: 'En Proceso', count: counts.inProgress },
              { key: 'Resueltos', count: counts.resolved },
            ].map(f => (
              <TouchableOpacity 
                key={f.key}
                style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
                onPress={() => setActiveFilter(f.key)}
              >
                <Text style={styles.filterText}>
                  {f.key} ({f.count})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Map */}
        <View style={styles.mapArea}>
          {isLoading ? (
            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.textSub, fontSize: 14 }}>Cargando mapa...</Text>
            </View>
          ) : (
            <div 
              ref={mapContainerRef} 
              style={{ 
                width: '100%', 
                height: '100%', 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                backgroundColor: colors.background 
              }} 
            />
          )}

          {/* Dynamic detail card for selected report */}
          {selectedReport && (
            <TouchableOpacity 
              style={styles.detailCard}
              onPress={() => router.push({ pathname: '/issue-details', params: { id: selectedReport.id } })}
              activeOpacity={0.9}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{selectedReport.title}</Text>
                <TouchableOpacity onPress={() => setSelectedReport(null)} style={styles.closeCardBtn}>
                  <Ionicons name="close-circle" size={24} color={colors.textLight} />
                </TouchableOpacity>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="location-outline" size={16} color={colors.textLight} style={{ marginRight: 4 }} />
                <Text style={[styles.cardLocation, { marginBottom: 0, flex: 1 }]} numberOfLines={1}>
                  {selectedReport.location || 'Sin ubicación'}
                </Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: selectedReport.status?.color || getMarkerColor(selectedReport.status?.name) }]} />
                  <Text style={styles.statusText}>{selectedReport.status?.name || 'Sin estado'}</Text>
                </View>
                <Text style={styles.cardHint}>Ver detalles completos →</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Floating buttons */}
          <View style={styles.floatingButtons}>
            <TouchableOpacity style={styles.floatingBtn} onPress={handleCenterOnUser}>
              <Ionicons name="locate" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.floatingBtn} onPress={handleFitAll}>
              <Ionicons name="scan-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Issues counter badge */}
          {!selectedReport && (
            <View style={styles.counterBadge}>
              <Ionicons name="flag" size={14} color="#FFF" />
              <Text style={styles.counterText}>{filteredReports.length} reportes</Text>
            </View>
          )}
        </View>

        <BottomTabBar activeTab="map" />

      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 25 : 14,
    paddingBottom: 14,
    backgroundColor: colors.surface,
  },
  iconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textTitle,
  },
  filtersWrapper: {
    backgroundColor: colors.surface,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: colors.orangeHero,
  },
  filterText: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  detailCard: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: colors.border + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 1000,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textTitle,
    flex: 1,
    marginRight: 10,
  },
  closeCardBtn: {
    padding: 2,
  },
  cardLocation: {
    fontSize: 13,
    color: colors.textSub,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 13,
    color: colors.textTitle,
    fontWeight: '600',
  },
  cardHint: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
  },
  floatingButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 10,
    zIndex: 1000,
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  counterBadge: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  counterText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  }
});

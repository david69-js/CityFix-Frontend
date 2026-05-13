import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIssuesFeed } from '../src/hooks/useIssues';
import { useAuthStore } from '../src/store/authStore';
import { useThemeColors } from '../src/hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

const colors = {
  primary: '#2065ff',
  background: '#F9FAFB', 
  surface: '#FFFFFF', 
  textTitle: '#111827', 
  textSub: '#4B5563', 
  textLight: '#9CA3AF', 
  border: '#E5E7EB',
};

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

export default function MapScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { data: feedData, isLoading } = useIssuesFeed(100);
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const mapRef = useRef<MapView>(null);

  const allReports = feedData?.data || [];

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

  // Center map on user location
  const handleCenterOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 800);
    }
  };

  // Fit all markers
  const handleFitAll = () => {
    if (filteredReports.length > 0 && mapRef.current) {
      const coords = filteredReports
        .filter(r => r.latitude && r.longitude)
        .map(r => ({ latitude: r.latitude, longitude: r.longitude }));
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: true,
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
                <Text style={[styles.filterText, activeFilter === f.key && styles.filterTextActive]}>
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
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              provider={PROVIDER_GOOGLE}
              initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.03, longitudeDelta: 0.03 } : DEFAULT_REGION}
              showsUserLocation={true}
              showsMyLocationButton={false}
              showsCompass={true}
              showsScale={true}
              mapType="standard"
            >
              {filteredReports
                .filter(report => report.latitude && report.longitude)
                .map(report => (
                  <Marker
                    key={report.id}
                    coordinate={{
                      latitude: Number(report.latitude),
                      longitude: Number(report.longitude),
                    }}
                    pinColor={report.status?.color || getMarkerColor(report.status?.name)}
                    title={report.title}
                    description={report.location || `${report.latitude}, ${report.longitude}`}
                    onCalloutPress={() => router.push({ pathname: '/issue-details', params: { id: report.id } })}
                  >
                    <Callout 
                      tooltip={false} 
                      onPress={() => router.push({ pathname: '/issue-details', params: { id: report.id } })}
                    >
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle} numberOfLines={2}>{report.title}</Text>
                        <Text style={styles.calloutLocation} numberOfLines={1}>
                          📍 {report.location || 'Sin ubicación'}
                        </Text>
                        <View style={styles.calloutStatusRow}>
                          <View style={[styles.calloutDot, { backgroundColor: report.status?.color || getMarkerColor(report.status?.name) }]} />
                          <Text style={styles.calloutStatus}>{report.status?.name || 'Sin estado'}</Text>
                        </View>
                        <Text style={styles.calloutHint}>Tocar para ver detalles →</Text>
                      </View>
                    </Callout>
                  </Marker>
                ))
              }
            </MapView>
          )}

          {/* Floating buttons */}
          <View style={styles.floatingButtons}>
            {userLocation && (
              <TouchableOpacity style={styles.floatingBtn} onPress={handleCenterOnUser}>
                <Ionicons name="locate" size={22} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.floatingBtn} onPress={handleFitAll}>
              <Ionicons name="scan-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Issues counter badge */}
          <View style={styles.counterBadge}>
            <Ionicons name="flag" size={14} color="#FFF" />
            <Text style={styles.counterText}>{filteredReports.length} reportes</Text>
          </View>
        </View>

        {/* Bottom Tabs */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/')}>
            <Ionicons name="home-outline" size={24} color={colors.textLight} />
            <Text style={styles.tabLabel}>Inicio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="map" size={24} color={colors.primary} />
            <Text style={[styles.tabLabel, { color: colors.primary }]}>Mapa</Text>
          </TouchableOpacity>

          <View style={styles.tabItemCentral}>
            <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/report')}>
              <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
            <Text style={[styles.tabLabel, { marginTop: 4 }]}>Reportar</Text>
          </View>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/profile')}>
            <Ionicons name="person-outline" size={24} color={colors.textLight} />
            <Text style={styles.tabLabel}>Perfil</Text>
          </TouchableOpacity>

          {user?.role_id === 2 && (
            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/assignments')}>
              <Ionicons name="briefcase-outline" size={24} color={colors.textLight} />
              <Text style={styles.tabLabel}>Tareas</Text>
            </TouchableOpacity>
          )}

          {user?.role_id === 1 && (
            <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/admin')}>
              <Ionicons name="shield-checkmark" size={24} color={colors.textLight} />
              <Text style={styles.tabLabel}>Admin</Text>
            </TouchableOpacity>
          )}
        </View>

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
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textTitle,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  // Callout styles
  calloutContainer: {
    width: 220,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 4,
  },
  calloutLocation: {
    fontSize: 12,
    color: colors.textSub,
    marginBottom: 6,
  },
  calloutStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  calloutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calloutStatus: {
    fontSize: 12,
    color: colors.textSub,
    fontWeight: '500',
  },
  calloutHint: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
  // Floating controls
  floatingButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 10,
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
    elevation: 4,
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
    elevation: 6,
  },
  counterText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  // Bottom tabs
  bottomTabBar: {
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 25, 
    paddingTop: 10,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 100,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabItemCentral: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    marginTop: -25, 
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
    marginTop: 4,
  },
  fabButton: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF', 
  }
});

import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIssuesFeed } from '../src/hooks/useIssues';
import { useAuthStore } from '../src/store/authStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';

const { width, height } = Dimensions.get('window');

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
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const mapRef = useRef<MapView>(null);

  const allReports = (feedData?.pages?.flatMap(p => p.data) || []).filter(r => !r.is_hidden);

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
    if (allReports.length > 0 && mapRef.current) {
      // Use allReports to encompass everything regardless of the active filter
      const coords = allReports
        .filter(r => r.latitude && r.longitude)
        .map(r => ({ latitude: Number(r.latitude), longitude: Number(r.longitude) }));
        
      if (coords.length > 0) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 100, right: 70, bottom: 100, left: 70 },
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
              onPress={() => setSelectedReport(null)}
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
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedReport(report);
                      if (mapRef.current) {
                        mapRef.current.animateToRegion({
                          latitude: Number(report.latitude),
                          longitude: Number(report.longitude),
                          latitudeDelta: 0.012,
                          longitudeDelta: 0.012,
                        }, 500);
                      }
                    }}
                  />
                ))
              }
            </MapView>
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
  // Detail Card styles
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
    elevation: 8,
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
  }
});

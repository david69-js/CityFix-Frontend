import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIssuesFeed } from '../src/hooks/useIssues';
import { useAuthStore } from '../src/store/authStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';

const { width } = Dimensions.get('window');

const getMarkerColor = (statusName?: string): string => {
  if (!statusName) return '#3B82F6';
  const name = statusName.toLowerCase();
  if (name.includes('reportado') || name.includes('pendiente')) return '#F97316';
  if (name.includes('proceso')) return '#3B82F6';
  if (name.includes('resuelto') || name.includes('completado')) return '#10B981';
  return '#9CA3AF';
};

export default function MapScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { data: feedData, isLoading } = useIssuesFeed(100);
  const [activeFilter, setActiveFilter] = useState('Todos');

  const initialLat = params.latitude ? Number(params.latitude) : null;
  const initialLng = params.longitude ? Number(params.longitude) : null;

  const allReports = (feedData?.pages?.flatMap(p => p.data) || []).filter(r => !r.is_hidden);

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

  const baseLat = allReports.find(r => r.latitude)?.latitude || -17.3895;
  const baseLng = allReports.find(r => r.longitude)?.longitude || -66.1568;

  const embedSrc = useMemo(() => {
    if (initialLat && initialLng) {
      return `https://maps.google.com/maps?q=${initialLat},${initialLng}&z=16&output=embed`;
    }
    const markers = filteredReports
      .filter(r => r.latitude && r.longitude)
      .map(r => `${r.latitude},${r.longitude}`)
      .join('|');
    if (!markers) {
      return `https://maps.google.com/maps?q=${baseLat},${baseLng}&z=14&output=embed`;
    }
    return `https://maps.google.com/maps?q=${markers.split('|')[0]}&z=14&output=embed`;
  }, [filteredReports, initialLat, initialLng]);

  return (
    <View style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <SafeAreaView style={{ backgroundColor: colors.surface }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textTitle} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mapa de Problemas</Text>
            <View style={styles.iconButton} />
          </View>
        </SafeAreaView>

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

        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textSub, fontSize: 14 }}>Cargando mapa...</Text>
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={styles.mapContainer}>
              <iframe
                src={embedSrc}
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: 12 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mapa de problemas"
              />
            </View>

            <View style={styles.listContainer}>
              <Text style={styles.listTitle}>
                Reportes {activeFilter !== 'Todos' ? `(${activeFilter})` : ''} ({filteredReports.length})
              </Text>
              {filteredReports.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="map-outline" size={48} color={colors.textLight} />
                  <Text style={styles.emptyStateText}>No hay reportes para mostrar</Text>
                </View>
              ) : (
                filteredReports.map(report => (
                  <TouchableOpacity
                    key={report.id}
                    style={styles.reportCard}
                    onPress={() => router.push({ pathname: '/issue-details', params: { id: report.id } })}
                  >
                    <View style={styles.reportHeader}>
                      <Text style={styles.reportTitle} numberOfLines={2}>{report.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: (report.status?.color || '#3B82F6') + '20' }]}>
                        <Text style={[styles.statusBadgeText, { color: report.status?.color || '#3B82F6' }]}>
                          {report.status?.name || 'Pendiente'}
                        </Text>
                      </View>
                    </View>
                    {report.location && (
                      <Text style={styles.reportLocation} numberOfLines={1}>
                        <Ionicons name="location-outline" size={12} /> {report.location}
                      </Text>
                    )}
                    {report.latitude && report.longitude && (
                      <TouchableOpacity
                        style={styles.openMapBtn}
                        onPress={() => window.open(`https://www.google.com/maps?q=${report.latitude},${report.longitude}`, '_blank')}
                      >
                        <Ionicons name="navigate-outline" size={14} color="#FFF" />
                        <Text style={styles.openMapBtnText}>Abrir en Google Maps</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
        )}

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
  mapContainer: {
    height: 350,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    color: colors.textLight,
    fontSize: 14,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textTitle,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reportLocation: {
    fontSize: 13,
    color: colors.textSub,
    marginBottom: 8,
  },
  openMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 6,
    borderRadius: 8,
  },
  openMapBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
});

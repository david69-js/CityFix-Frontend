import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { useAuthStore } from '../src/store/authStore';
import { useReportSummary, useWorkerReport, useCategoryReport, useDateReport } from '../src/hooks/useReports';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { useDownloadPdf } from '../src/hooks/useDownloadPdf';

const { width } = Dimensions.get('window');

export default function AdminReportsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { downloadPdf, loading: downloadingPdf } = useDownloadPdf();

  const [selectedInterval, setSelectedInterval] = useState('30D');

  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const selectInterval = (interval: string) => {
    setSelectedInterval(interval);
    const to = new Date().toISOString().split('T')[0];
    let from = '';
    
    if (interval === '7D') {
      from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (interval === '30D') {
      from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (interval === '90D') {
      from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    } else if (interval === 'ALL') {
      from = '2020-01-01'; // Histórico completo
    }
    
    setDateRange({ from, to });
  };

  const { data: summary, isLoading: loadingSummary } = useReportSummary(dateRange.from, dateRange.to);
  const { data: workers, isLoading: loadingWorkers } = useWorkerReport({ from: dateRange.from, to: dateRange.to });
  const { data: categories, isLoading: loadingCategories } = useCategoryReport({ from: dateRange.from, to: dateRange.to });
  const { data: trends, isLoading: loadingTrends } = useDateReport({ from: dateRange.from, to: dateRange.to, group_by: 'day' });

  // Access check
  if (user?.role_id !== 1) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ color: colors.textTitle }}>No tienes acceso a esta sección.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.adminHighlight }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderStatCard = (title: string, value: string | number | null | undefined, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View>
        <Text style={styles.statValue}>{value ?? '0'}</Text>
        <Text style={styles.statLabel}>{title}</Text>
      </View>
    </View>
  );

  const renderProgressBar = (label: string, value: number, total: number, color: string) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <View key={label} style={styles.progressItem}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>{value} ({percentage.toFixed(0)}%)</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Reportes y Estadísticas',
        headerStyle: { backgroundColor: colors.adminHighlight },
        headerTintColor: '#FFF',
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => router.canGoBack() ? router.back() : router.replace('/admin')} 
            style={{ marginLeft: 10, padding: 5 }}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
        )
      }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Resumen General</Text>
          <Text style={styles.headerSubtitle}>Del {dateRange.from} al {dateRange.to}</Text>
          
          <View style={styles.dateSelectorContainer}>
            <TouchableOpacity 
              onPress={() => selectInterval('7D')} 
              style={[styles.datePill, selectedInterval === '7D' && styles.datePillActive]}
            >
              <Text style={[styles.datePillText, selectedInterval === '7D' && styles.datePillTextActive]}>7 Días</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => selectInterval('30D')} 
              style={[styles.datePill, selectedInterval === '30D' && styles.datePillActive]}
            >
              <Text style={[styles.datePillText, selectedInterval === '30D' && styles.datePillTextActive]}>30 Días</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => selectInterval('90D')} 
              style={[styles.datePill, selectedInterval === '90D' && styles.datePillActive]}
            >
              <Text style={[styles.datePillText, selectedInterval === '90D' && styles.datePillTextActive]}>90 Días</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => selectInterval('ALL')} 
              style={[styles.datePill, selectedInterval === 'ALL' && styles.datePillActive]}
            >
              <Text style={[styles.datePillText, selectedInterval === 'ALL' && styles.datePillTextActive]}>Todo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exportar Reportes PDF</Text>
          <View style={styles.exportCard}>
            <Text style={styles.exportCardSubtitle}>Descarga reportes listos en formato PDF:</Text>
            <View style={styles.exportGrid}>
              <TouchableOpacity
                onPress={() => downloadPdf('/admin/reports/pdf/summary', `resumen-${dateRange.from}-${dateRange.to}.pdf`, { from: dateRange.from, to: dateRange.to })}
                disabled={downloadingPdf}
                style={[styles.exportButton, downloadingPdf && { opacity: 0.6 }]}
              >
                <Ionicons name="document-text-outline" size={16} color={colors.adminHighlight} />
                <Text style={styles.exportButtonText}>Resumen</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => downloadPdf('/admin/reports/pdf/by-category', `categorias-${dateRange.from}-${dateRange.to}.pdf`, { from: dateRange.from, to: dateRange.to })}
                disabled={downloadingPdf}
                style={[styles.exportButton, downloadingPdf && { opacity: 0.6 }]}
              >
                <Ionicons name="grid-outline" size={16} color={colors.adminHighlight} />
                <Text style={styles.exportButtonText}>Categorías</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => downloadPdf('/admin/reports/pdf/by-worker', `trabajadores-${dateRange.from}-${dateRange.to}.pdf`, { from: dateRange.from, to: dateRange.to })}
                disabled={downloadingPdf}
                style={[styles.exportButton, downloadingPdf && { opacity: 0.6 }]}
              >
                <Ionicons name="people-outline" size={16} color={colors.adminHighlight} />
                <Text style={styles.exportButtonText}>Trabajadores</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => downloadPdf('/admin/reports/pdf/by-date', `fechas-${dateRange.from}-${dateRange.to}.pdf`, { from: dateRange.from, to: dateRange.to, group_by: 'day' })}
                disabled={downloadingPdf}
                style={[styles.exportButton, downloadingPdf && { opacity: 0.6 }]}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.adminHighlight} />
                <Text style={styles.exportButtonText}>Por Fecha</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => downloadPdf('/admin/reports/pdf/resolution-times', `tiempos-resolucion-${dateRange.from}-${dateRange.to}.pdf`, { from: dateRange.from, to: dateRange.to })}
                disabled={downloadingPdf}
                style={[styles.exportButton, downloadingPdf && { opacity: 0.6 }]}
              >
                <Ionicons name="time-outline" size={16} color={colors.adminHighlight} />
                <Text style={styles.exportButtonText}>Tiempos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => downloadPdf('/admin/reports/pdf/details', `detalles-${dateRange.from}-${dateRange.to}.pdf`, { from: dateRange.from, to: dateRange.to })}
                disabled={downloadingPdf}
                style={[styles.exportButton, downloadingPdf && { opacity: 0.6 }]}
              >
                <Ionicons name="list-outline" size={16} color={colors.adminHighlight} />
                <Text style={styles.exportButtonText}>Detalles</Text>
              </TouchableOpacity>
            </View>
            {downloadingPdf && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.adminHighlight} />
                <Text style={styles.loadingText}>Generando PDF...</Text>
              </View>
            )}
          </View>
        </View>

        {loadingSummary ? (
          <ActivityIndicator size="large" color={colors.adminHighlight} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.statsGrid}>
            {renderStatCard('Reportes Totales', summary?.total_issues, 'document-text', colors.primary)}
            {renderStatCard('Promedio Res.', `${summary?.avg_resolution_time_hours?.toFixed(1) || 0}h`, 'time', '#F59E0B')}
            {renderStatCard('Upvotes', summary?.total_upvotes, 'heart', '#EF4444')}
            {renderStatCard('Comentarios', summary?.total_comments, 'chatbubble', '#10B981')}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Reportes</Text>
          <View style={styles.card}>
            {summary?.by_status.map((item) => (
              renderProgressBar(
                item.status, 
                item.total, 
                summary.total_issues, 
                item.status === 'Resuelto' ? '#10B981' : item.status === 'En proceso' ? '#3B82F6' : '#F59E0B'
              )
            ))}
            {(!summary?.by_status || summary.by_status.length === 0) && (
              <Text style={styles.emptyText}>No hay datos disponibles</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tendencias (Reportes Creados)</Text>
          <View style={[styles.card, { height: 200, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: 30 }]}>
            {loadingTrends ? (
              <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
            ) : trends?.created.map((point, idx) => {
              const maxVal = Math.max(...trends.created.map(p => p.total), 1);
              const barHeight = (point.total / maxVal) * 120;
              return (
                <View key={idx} style={{ alignItems: 'center', flex: 1 }}>
                  <View style={[styles.trendBar, { height: Math.max(barHeight, 4), backgroundColor: colors.primary }]} />
                  <Text style={styles.trendLabel} numberOfLines={1}>{point.period.split('-').pop()}</Text>
                </View>
              );
            })}
            {(!trends?.created || trends.created.length === 0) && !loadingTrends && (
              <Text style={styles.emptyText}>No hay datos de tendencias</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Categorías</Text>
          <View style={styles.card}>
            {categories?.data.map((item, index) => (
              <View key={index} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{item.category}</Text>
                  <Text style={styles.categorySub}>{item.total} reportes</Text>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryResolved}>{item.resolved_count} resueltos</Text>
                  <Text style={styles.categoryTime}>{item.avg_resolution_time_hours?.toFixed(1) || 0}h prom.</Text>
                </View>
              </View>
            ))}
            {(!categories?.data || categories.data.length === 0) && (
              <Text style={styles.emptyText}>No hay datos por categoría</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rendimiento de Trabajadores</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workerScroll}>
            {workers?.data.map((item, index) => (
              <View key={index} style={styles.workerCard}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerInitials}>
                    {item.worker.first_name[0]}{item.worker.last_name[0]}
                  </Text>
                </View>
                <Text style={styles.workerName} numberOfLines={1}>
                  {item.worker.first_name} {item.worker.last_name}
                </Text>
                <View style={styles.workerStatRow}>
                  <View style={styles.workerStatItem}>
                    <Text style={styles.workerStatValue}>{item.total_assigned}</Text>
                    <Text style={styles.workerStatLabel}>Asign.</Text>
                  </View>
                  <View style={styles.workerStatItem}>
                    <Text style={[styles.workerStatValue, { color: '#10B981' }]}>{item.issues_resolved}</Text>
                    <Text style={styles.workerStatLabel}>Res.</Text>
                  </View>
                </View>
                <Text style={styles.workerTime}>
                  {item.avg_completion_time_hours?.toFixed(1) || 0}h prom.
                </Text>
              </View>
            ))}
          </ScrollView>
          {(!workers?.data || workers.data.length === 0) && (
            <View style={[styles.card, { marginTop: 10 }]}>
              <Text style={styles.emptyText}>No hay actividad de trabajadores</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomTabBar activeTab="admin" />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textTitle },
  headerSubtitle: { fontSize: 14, color: colors.textSub, marginTop: 4 },
  exportCard: { 
    backgroundColor: colors.surface, 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: colors.border,
    marginBottom: 10
  },
  exportCardSubtitle: {
    fontSize: 14,
    color: colors.textSub,
    marginBottom: 14
  },
  exportGrid: { 
    gap: 10,
  },
  exportButton: { 
    width: '100%', 
    backgroundColor: colors.surface, 
    borderWidth: 1.5,
    borderColor: colors.adminHighlight,
    borderRadius: 12, 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
    shadowColor: colors.adminHighlight,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  exportButtonText: { 
    color: colors.adminHighlight, 
    fontSize: 13, 
    fontWeight: '700' 
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 14,
    width: '100%'
  },
  datePill: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  datePillActive: {
    backgroundColor: colors.adminHighlight,
    borderColor: colors.adminHighlight
  },
  datePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSub
  },
  datePillTextActive: {
    color: '#FFF',
    fontWeight: '700'
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.adminHighlight + '15',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.adminHighlight + '30'
  },
  loadingText: {
    color: colors.textTitle,
    fontSize: 13,
    fontWeight: '500'
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { 
    width: (width - 50) / 2, 
    backgroundColor: colors.surface, 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12
  },
  statIconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.textTitle },
  statLabel: { fontSize: 12, color: colors.textSub },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textTitle, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  progressItem: { marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 14, color: colors.textTitle, fontWeight: '500' },
  progressValue: { fontSize: 12, color: colors.textSub },
  progressTrack: { height: 8, backgroundColor: colors.border + '40', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  categoryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border + '40' 
  },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '600', color: colors.textTitle },
  categorySub: { fontSize: 12, color: colors.textSub },
  categoryStats: { alignItems: 'flex-end' },
  categoryResolved: { fontSize: 13, color: '#10B981', fontWeight: '500' },
  categoryTime: { fontSize: 12, color: colors.textSub },
  workerScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  workerCard: { 
    width: 140, 
    backgroundColor: colors.surface, 
    borderRadius: 16, 
    padding: 16, 
    marginRight: 12, 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  workerAvatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    backgroundColor: colors.adminHighlight + '20', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 10
  },
  workerInitials: { fontSize: 18, fontWeight: 'bold', color: colors.adminHighlight },
  workerName: { fontSize: 14, fontWeight: 'bold', color: colors.textTitle, marginBottom: 8 },
  workerStatRow: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  workerStatItem: { alignItems: 'center' },
  workerStatValue: { fontSize: 14, fontWeight: 'bold', color: colors.textTitle },
  workerStatLabel: { fontSize: 10, color: colors.textSub },
  workerTime: { fontSize: 11, color: colors.textSub },
  emptyText: { textAlign: 'center', color: colors.textSub, paddingVertical: 20, fontSize: 14 },
  trendBar: { width: 8, borderRadius: 4, marginBottom: 8 },
  trendLabel: { fontSize: 9, color: colors.textSub, transform: [{ rotate: '-45deg' }], marginTop: 4 }
});

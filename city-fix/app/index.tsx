import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Dimensions, Image, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUsers } from '../src/hooks/useAuth';
import { useIssuesFeed } from '../src/hooks/useIssues';
import { formatDate } from '../src/utils/date';
import { useAuthStore } from '../src/store/authStore';
import { useUnreadCount } from '../src/hooks/useNotifications';
import { fixImageUrl } from '../src/utils/image';
import { useThemeColors } from '../src/hooks/useThemeColors';

const { width } = Dimensions.get('window');

// Helper for Category Colors (since backend only provides name/icon)
const getCategoryColor = (name: string, colors: any) => {
  const n = name.toLowerCase();
  if (n.includes('basura')) return colors.tagGarbageBg;
  if (n.includes('bache') || n.includes('vía')) return colors.tagRoadsBg;
  if (n.includes('luz') || n.includes('iluminación')) return colors.tagLightingBg;
  if (n.includes('agua')) return colors.tagWaterBg;
  return colors.tagDefaultBg;
};

// Helper for Status Icons
const getStatusIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pendiente') || n.includes('reportado')) return 'alert-circle-outline';
  if (n.includes('proceso') || n.includes('camino')) return 'time-outline';
  if (n.includes('resuelto') || n.includes('listo')) return 'checkmark-circle-outline';
  return 'help-circle-outline';
};

export default function CityReporterDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: feedData, isLoading: feedLoading, refetch, isRefetching } = useIssuesFeed();
  const unreadCount = useUnreadCount();

  const [filterStatus, setFilterStatus] = React.useState<string | null>(null);

  const allReports = feedData?.data || [];

  // Filtering logic for the feed
  const reports = React.useMemo(() => {
    if (!filterStatus) return allReports;
    return allReports.filter(r => {
      const s = r.status?.name.toLowerCase() || '';
      if (filterStatus === 'reported') return s.includes('reportado') || s.includes('pendiente');
      if (filterStatus === 'progress') return s.includes('proceso') || s.includes('atendiendo');
      if (filterStatus === 'resolved') return s.includes('resuelto') || s.includes('listo') || s.includes('finalizado');
      return true;
    });
  }, [allReports, filterStatus]);

  // Calculate simple stats from ALL feed data
  const stats = {
    reported: allReports.filter(r => r.status?.name.toLowerCase().includes('reportado') || r.status?.name.toLowerCase().includes('pendiente')).length,
    inProgress: allReports.filter(r => r.status?.name.toLowerCase().includes('proceso') || r.status?.name.toLowerCase().includes('atendiendo')).length,
    resolved: allReports.filter(r => r.status?.name.toLowerCase().includes('resuelto') || r.status?.name.toLowerCase().includes('listo') || r.status?.name.toLowerCase().includes('finalizado')).length,
  };

  const handleRefresh = () => {
    setFilterStatus(null);
    refetch();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
      >

        {/* Premium Header with Gradient and Decorative Elements */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={[colors.primary, '#1e40af']}
            style={styles.headerBg}
          />
          
          {/* Decorative Circles for Depth */}
          <View style={styles.headerCircle1} />
          <View style={styles.headerCircle2} />

          <SafeAreaView>
            <View style={styles.headerContent}>
              <View style={styles.headerTopRow}>
                <View>
                  <View style={styles.titleWithIcon}>
                    <Ionicons name="business" size={32} color="#FFF" style={{ marginRight: 10 }} />
                    <Text style={styles.headerTitle}>CityFix</Text>
                  </View>
                  <Text style={styles.headerSubtitle}>Transformando el futuro urbano</Text>
                </View>
                <TouchableOpacity 
                  style={styles.notificationBell}
                  onPress={() => router.push('/notifications')}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.bellGlass}
                  >
                    <Ionicons name="notifications-outline" size={24} color="#FFF" />
                    {unreadCount > 0 && <View style={styles.notificationDot} />}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Stats Row with Glassmorphism */}
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={[styles.statCard, filterStatus === 'reported' && styles.statCardActive]}
              onPress={() => setFilterStatus(filterStatus === 'reported' ? null : 'reported')}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(249, 115, 22, 0.2)' }]}>
                <Ionicons name="alert-outline" size={20} color="#fb923c" />
              </View>
              <Text style={styles.statValue}>{stats.reported}</Text>
              <Text style={styles.statLabel}>Pendiente</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statCard, filterStatus === 'progress' && styles.statCardActive]}
              onPress={() => setFilterStatus(filterStatus === 'progress' ? null : 'progress')}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="trending-up" size={20} color="#60a5fa" />
              </View>
              <Text style={styles.statValue}>{stats.inProgress}</Text>
              <Text style={styles.statLabel}>Proceso</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.statCard, filterStatus === 'resolved' && styles.statCardActive]}
              onPress={() => setFilterStatus(filterStatus === 'resolved' ? null : 'resolved')}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="checkmark-done" size={20} color="#34d399" />
              </View>
              <Text style={styles.statValue}>{stats.resolved}</Text>
              <Text style={styles.statLabel}>Resuelto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/report')}>
            <Ionicons name="add" size={20} color="#FFF" style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>Reportar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/map')}>
            <Ionicons name="location-outline" size={20} color={colors.textTitle} style={styles.btnIcon} />
            <Text style={styles.secondaryButtonText}>Ver Mapa</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Reports Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reportes Recientes</Text>
        </View>

        <View style={styles.listContainer}>
          {feedLoading && !isRefetching ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 12, color: colors.textSub }}>Cargando reportes...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="document-text-outline" size={48} color={colors.textLight} />
              <Text style={{ marginTop: 12, color: colors.textSub }}>No hay reportes todavía.</Text>
            </View>
          ) : (
            reports.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => router.push({ pathname: '/issue-details', params: { id: report.id } })}
                activeOpacity={0.8}
              >

                {/* Image Column */}
                {(() => {
                  const rawUrl = report.images && report.images.length > 0 ? report.images[0].full_url : null;
                  const imageUrl = fixImageUrl(rawUrl);
                  if (imageUrl) console.log(`[DEBUG] Dashboard Image URL (Fixed): ${imageUrl}`);
                  
                  return !imageUrl ? (
                    <View style={styles.imagePlaceholder}>
                      <View style={styles.questionMarkBox}>
                        <Text style={styles.questionMarkText}>?</Text>
                      </View>
                    </View>
                  ) : (
                    <Image source={{ uri: imageUrl }} style={styles.reportImage} />
                  );
                })()}

                {/* Details Column */}
                <View style={styles.reportDetails}>

                  <View style={styles.reportHeaderRow}>
                    <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: report.status?.color + '20' || '#F3F4F6' }]}>
                      <Ionicons name={getStatusIcon(report.status?.name || '') as any} size={12} color={report.status?.color || colors.textSub} />
                      <Text style={[styles.statusText, { color: report.status?.color || colors.textSub }]}>{report.status?.name || 'Pendiente'}</Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textLight} />
                    <Text style={styles.locationText} numberOfLines={1}>{report.location}</Text>
                  </View>

                  <View style={styles.reportFooterRow}>
                    <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(report.category?.name || '', colors) }]}>
                      <Text style={styles.categoryTagText}>{report.category?.name || 'General'}</Text>
                    </View>

                    <View style={styles.metaInfo}>
                      <Ionicons name="thumbs-up-outline" size={14} color={colors.textLight} />
                      <Text style={styles.metaText}>{report.upvotes_count || 0}</Text>
                      
                      <Ionicons name="chatbubble-outline" size={14} color={colors.textLight} style={{ marginLeft: 12 }} />
                      <Text style={styles.metaText}>{report.comments_count || 0}</Text>
                      
                      <Text style={[styles.metaText, { marginLeft: 12 }]}>{formatDate(report.created_at)}</Text>
                    </View>
                  </View>

                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bottom padding for scroll content */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={styles.bottomTabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="home-outline" size={24} color={colors.primary} />
          <Text style={[styles.tabLabel, { color: colors.primary }]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/map')}>
          <Ionicons name="map-outline" size={24} color={colors.textLight} />
          <Text style={styles.tabLabel}>Mapa</Text>
        </TouchableOpacity>

        <View style={styles.tabItemCentral}>
          <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/report')}>
            <Ionicons name="add" size={32} color="#FFF" style={{ marginTop: -1 }} />
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
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrapper: {
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: colors.primary,
  },
  headerCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerCircle2: {
    position: 'absolute',
    bottom: 20,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingHorizontal: 20,
    paddingBottom: 25,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationBell: {
    padding: 8,
    position: 'relative',
  },
  bellGlass: {
    padding: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  headerTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: -2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 5,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingVertical: 15,
    alignItems: 'center',
    width: (width - 60) / 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  statCardActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary,
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
    elevation: 8,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textTitle,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTitle,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
    justifyContent: 'space-between',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textTitle,
    fontSize: 15,
    fontWeight: '600',
  },
  btnIcon: {
    marginRight: 6,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 30,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textTitle,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  reportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexDirection: 'row',
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  reportImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionMarkBox: {
    backgroundColor: '#EEF4FF',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  questionMarkText: {
    color: colors.iconBlueFg,
    fontWeight: 'bold',
    fontSize: 14,
  },
  reportDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between',
    height: 80,
  },
  reportHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textTitle,
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: colors.textTitle,
    marginLeft: 4,
  },
  reportFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTagText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: colors.textSub,
    marginLeft: 4,
    fontWeight: '500',
  },
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
    paddingBottom: 25, // For iPhone home indicator area (approx)
    paddingTop: 10,
    justifyContent: 'space-around',
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
    marginTop: -25, // Pull the central item up
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textSub,
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
    borderColor: '#FFFFFF', // To create the cut-out effect roughly
  }
});

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, Platform, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUsers } from '../src/hooks/useAuth';
import { useIssuesFeed, useAdminIssues, useGlobalStats } from '../src/hooks/useIssues';
import { useAdminUsers } from '../src/hooks/useAdmin';
import { formatDate } from '../src/utils/date';
import { useAuthStore } from '../src/store/authStore';
import { useUnreadCount } from '../src/hooks/useNotifications';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { getCategoryColor, getStatusIcon, fixImageUrl, STATUS_IDS } from '../src/utils/helpers';
import { useDebounce } from '../src/hooks/useDebounce';

const { width } = Dimensions.get('window');



export default function CityReporterDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  
  // Combinamos ambas fuentes de datos para mayor seguridad
  const { data: adminUsers, isLoading: adminUsersLoading } = useAdminUsers();
  const { data: regularUsers, isLoading: regularUsersLoading } = useUsers();
  
  const users = React.useMemo(() => {
    const list = Array.isArray(adminUsers) && adminUsers.length > 0 ? adminUsers : (Array.isArray(regularUsers) ? regularUsers : []);
    
    return list;
  }, [adminUsers, regularUsers]);

  const usersLoading = adminUsersLoading && regularUsersLoading;

  const unreadCount = useUnreadCount();

  // --- Search & Filter States ---
  const [searchText, setSearchText] = React.useState('');
  const debouncedSearchText = useDebounce(searchText, 500);
  const [activeStatusFilter, setActiveStatusFilter] = React.useState<number | null>(null);
  const [showUserFilter, setShowUserFilter] = React.useState(false);
  const [selectedUserId, setSelectedUserId] = React.useState<number | undefined>(undefined);

  // Passing filters to the hook
  const { data: feedData, isLoading: feedLoading, refetch, isRefetching } = useIssuesFeed(15, {
    search: debouncedSearchText,
    status_id: activeStatusFilter || undefined,
    user_id: selectedUserId
  });

  const allReports = (feedData?.data || []).filter(r => !r.is_hidden);
  
  // Hook para estadísticas globales (independiente de los filtros)
  const { data: globalStats } = useGlobalStats();

  // Frontend fallback: si el backend no filtra por user_id, lo hacemos aquí
  const reports = React.useMemo(() => {
    let filtered = allReports;
    if (selectedUserId) {
      filtered = filtered.filter(r => 
        Number(r.user_id) === Number(selectedUserId) || 
        Number(r.user?.id) === Number(selectedUserId)
      );
    }
    return filtered;
  }, [allReports, selectedUserId]);

  // Las estadísticas ahora vienen del hook global, no cambian al filtrar la lista
  const stats = {
    reported: globalStats?.reported || 0,
    inProgress: globalStats?.inProgress || 0,
    resolved: globalStats?.resolved || 0,
  };

  // State for manual pull-to-refresh
  const [isManualRefresh, setIsManualRefresh] = React.useState(false);

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    setSearchText('');
    setActiveStatusFilter(null);
    setSelectedUserId(undefined);
    await refetch();
    setIsManualRefresh(false);
  };

  const handleSelectUserFilter = () => {
    if (usersLoading) {
      Alert.alert('Cargando...', 'Estamos obteniendo la lista de ciudadanos...');
      return;
    }
    
    // Siempre empezamos con la opción de limpiar filtro
    const options: any[] = [
      {
        text: '❌ Quitar filtro / Todos',
        onPress: () => setSelectedUserId(undefined)
      }
    ];

    // Añadimos los usuarios si existen
    if (Array.isArray(users) && users.length > 0) {
      users.slice(0, 10).forEach((u: any) => {
        options.push({
          text: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Usuario',
          onPress: () => setSelectedUserId(u.id)
        });
      });
    }

    Alert.alert(
      'Filtrar por usuario',
      `Mostrando ${Math.max(0, options.length - 1)} usuarios disponibles:`,
      options,
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'android' ? 120 : 40 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={isManualRefresh} onRefresh={handleRefresh} tintColor={colors.primary} />
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
              style={[styles.statCard, activeStatusFilter === STATUS_IDS.PENDIENTE && styles.statCardActive]}
              onPress={() => setActiveStatusFilter(activeStatusFilter === STATUS_IDS.PENDIENTE ? null : STATUS_IDS.PENDIENTE)}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: activeStatusFilter === STATUS_IDS.PENDIENTE ? 'rgba(255, 255, 255, 0.2)' : 'rgba(249, 115, 22, 0.2)' }]}>
                <Ionicons name="alert-outline" size={20} color={activeStatusFilter === STATUS_IDS.PENDIENTE ? '#FFF' : "#fb923c"} />
              </View>
              <Text style={[styles.statValue, activeStatusFilter === STATUS_IDS.PENDIENTE && { color: '#FFF' }]}>{stats.reported}</Text>
              <Text style={[styles.statLabel, activeStatusFilter === STATUS_IDS.PENDIENTE && { color: '#FFF' }]}>Pendiente</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, activeStatusFilter === STATUS_IDS.EN_PROCESO && styles.statCardActive]}
              onPress={() => setActiveStatusFilter(activeStatusFilter === STATUS_IDS.EN_PROCESO ? null : STATUS_IDS.EN_PROCESO)}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: activeStatusFilter === STATUS_IDS.EN_PROCESO ? 'rgba(255, 255, 255, 0.2)' : 'rgba(59, 130, 246, 0.2)' }]}>
                <Ionicons name="trending-up" size={20} color={activeStatusFilter === STATUS_IDS.EN_PROCESO ? '#FFF' : "#60a5fa"} />
              </View>
              <Text style={[styles.statValue, activeStatusFilter === STATUS_IDS.EN_PROCESO && { color: '#FFF' }]}>{stats.inProgress}</Text>
              <Text style={[styles.statLabel, activeStatusFilter === STATUS_IDS.EN_PROCESO && { color: '#FFF' }]}>Proceso</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, activeStatusFilter === STATUS_IDS.RESUELTO && styles.statCardActive]}
              onPress={() => setActiveStatusFilter(activeStatusFilter === STATUS_IDS.RESUELTO ? null : STATUS_IDS.RESUELTO)}
              activeOpacity={0.8}
            >
              <View style={[styles.statIconContainer, { backgroundColor: activeStatusFilter === STATUS_IDS.RESUELTO ? 'rgba(255, 255, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)' }]}>
                <Ionicons name="checkmark-done" size={20} color={activeStatusFilter === STATUS_IDS.RESUELTO ? '#FFF' : "#34d399"} />
              </View>
              <Text style={[styles.statValue, activeStatusFilter === STATUS_IDS.RESUELTO && { color: '#FFF' }]}>{stats.resolved}</Text>
              <Text style={[styles.statLabel, activeStatusFilter === STATUS_IDS.RESUELTO && { color: '#FFF' }]}>Resuelto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={colors.textLight} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar reportes por nombre..."
            placeholderTextColor={colors.textLight}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Modern User Filter Bar */}
        <View style={styles.userFilterContainer}>
          <Text style={styles.filterLabel}>Filtrar por Ciudadano</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.userScrollContent}
          >
            {/* "All" Option */}
            <TouchableOpacity 
              style={[styles.userChip, !selectedUserId && styles.userChipActive]}
              onPress={() => setSelectedUserId(undefined)}
            >
              <View style={[styles.avatarCircle, !selectedUserId && { borderColor: '#FFF' }]}>
                <Ionicons name="people" size={20} color={!selectedUserId ? '#FFF' : colors.primary} />
              </View>
              <Text style={[styles.userChipText, !selectedUserId && { color: '#FFF' }]}>Todos</Text>
            </TouchableOpacity>

            {usersLoading ? (
              <ActivityIndicator style={{ marginLeft: 20 }} color={colors.primary} />
            ) : (
              Array.isArray(users) && users.map((u: any) => (
                <TouchableOpacity 
                  key={u.id}
                  style={[styles.userChip, selectedUserId === u.id && styles.userChipActive]}
                  onPress={() => setSelectedUserId(selectedUserId === u.id ? undefined : u.id)}
                >
                  <View style={[styles.avatarCircle, selectedUserId === u.id && { borderColor: '#FFF' }]}>
                    {(u.avatar_url || u.avatar) ? (
                      <Image source={{ uri: u.avatar_url || fixImageUrl(u.avatar) }} style={styles.chipAvatar} />
                    ) : (
                      <Text style={[styles.avatarInitial, selectedUserId === u.id && { color: '#FFF' }]}>
                        {u.first_name?.charAt(0) || u.email?.charAt(0) || '?'}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.userChipText, selectedUserId === u.id && { color: '#FFF' }]} numberOfLines={1}>
                    {u.first_name || 'Usuario'}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        {/* Action Buttons Row */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/report')}>
            <Ionicons name="add" size={20} color="#FFF" style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>Reportar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/map')}>
            <Ionicons name="location-outline" size={20} color={colors.blueInfluencer} style={styles.btnIcon} />
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
                  const rawUrl = report?.images && report.images.length > 0 ? report.images[0].full_url : null;
                  const imageUrl = fixImageUrl(rawUrl);


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
                    <Text style={styles.reportTitle} numberOfLines={1}>{report?.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: (report?.status?.color ?? '#F3F4F6') + '20' }]}>
                      <Ionicons name={getStatusIcon(report?.status?.name ?? '') as any} size={12} color={report?.status?.color ?? colors.textSub} />
                      <Text style={[styles.statusText, { color: report?.status?.color ?? colors.textSub }]}>{report?.status?.name ?? 'Pendiente'}</Text>
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
      <BottomTabBar activeTab="home" />

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
    backgroundColor: colors.primary,
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
    marginTop: 10,
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    marginTop: 24,
    opacity: 0.6,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.orangeHero, // Gold
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 10,
    shadowColor: colors.orangeHero,
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
    borderWidth: 1.5,
    borderColor: colors.blueInfluencer,
  },
  secondaryButtonText: {
    color: colors.blueInfluencer,
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
    elevation: 3,
    borderWidth: 1.5,
    borderColor: colors.border,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textTitle,
  },
  userFilterContainer: {
    marginTop: 16,
    paddingLeft: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 12,
  },
  userScrollContent: {
    paddingRight: 20,
    paddingBottom: 4,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  userChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  chipAvatar: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  userChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTitle,
  },
});

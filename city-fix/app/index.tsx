import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useUsers } from '../src/hooks/useAuth';

const { width } = Dimensions.get('window');

const colors = {
  primary: '#2065ff', // Bright blue header and buttons
  background: '#F9FAFB', // Off-white app background
  surface: '#FFFFFF', // Cards background
  textTitle: '#111827', // Dark gray for titles
  textSub: '#6B7280', // Medium gray for sub-texts
  textLight: '#9CA3AF', // Lighter gray for dates and likes

  // Icon colors
  iconOrangeBg: '#FFF2EB',
  iconOrangeFg: '#F97316',
  iconBlueBg: '#EEF4FF',
  iconBlueFg: '#3B82F6',
  iconGreenBg: '#ECFDF5',
  iconGreenFg: '#10B981',

  // Tag colors
  tagGarbageBg: '#F59E0B',
  tagRoadsBg: '#4B5563',
  tagLightingBg: '#EAB308',
  tagWaterBg: '#3B82F6',

  // Status colors
  statusReportedBg: '#FFF2EB',
  statusReportedFg: '#F97316',
  statusProgressBg: '#EEF4FF',
  statusProgressFg: '#3B82F6',
  statusResolvedBg: '#ECFDF5',
  statusResolvedFg: '#10B981',

  border: '#E5E7EB',
};

// Dummy Data
const REPORTS = [
  {
    id: 1,
    title: 'Basurero desbordado',
    location: 'Calle 5 # 10-20',
    tag: 'Basura',
    tagBg: colors.tagGarbageBg,
    status: 'En proceso',
    statusBg: colors.statusProgressBg,
    statusFg: colors.statusProgressFg,
    statusIcon: 'time-outline',
    likes: 23,
    date: 'Feb 3',
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 2,
    title: 'Hueco en la vía',
    location: 'Autopista Norte, salida 45',
    tag: 'Baches',
    tagBg: colors.tagRoadsBg,
    status: 'Reportado',
    statusBg: colors.statusReportedBg,
    statusFg: colors.statusReportedFg,
    statusIcon: 'alert-circle-outline',
    likes: 45,
    date: 'Feb 4',
    isPlaceholder: true,
    imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 3,
    title: 'Alumbrado público dañado',
    location: 'Calle 12 # 15-30',
    tag: 'Iluminación',
    tagBg: colors.tagLightingBg,
    status: 'Resuelto',
    statusBg: colors.statusResolvedBg,
    statusFg: colors.statusResolvedFg,
    statusIcon: 'checkmark-circle-outline',
    likes: 15,
    date: 'Jan 27',
    imageUrl: 'https://images.unsplash.com/photo-1544973315-96538dce7fb6?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 4,
    title: 'Fuga de agua en la acera',
    location: 'Calle 23 # 18-30',
    tag: 'Agua',
    tagBg: colors.tagWaterBg,
    status: 'En proceso',
    statusBg: colors.statusProgressBg,
    statusFg: colors.statusProgressFg,
    statusIcon: 'time-outline',
    likes: 31,
    date: 'Feb 2',
    isPlaceholder: true
  }
];

export default function CityReporterDashboard() {
  const router = useRouter();
  const { data: users, isLoading: usersLoading } = useUsers();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header Background */}
        <View style={styles.headerBg} />

        {/* Header Content */}
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>City Fix</Text>
            <Text style={styles.headerSubtitle}>Ayuda a mejorar tu vecindario</Text>

            {/* TEST API CARD */}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 12, borderRadius: 12, marginTop: 15 }}>
              <Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 13}}>🔗 Test de Conexión Laravel API:</Text>
              {usersLoading ? <Text style={{color: '#FFF', fontSize: 12, marginTop: 4}}>Cargando usuarios...</Text> : (
                <Text style={{color: '#FFF', fontSize: 12, marginTop: 4}}>✅ Usuarios detectados: {users?.length || 0}</Text>
              )}
            </View>

          </View>
        </SafeAreaView>

        {/* Stats Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.iconOrangeBg }]}>
              <Ionicons name="alert-outline" size={20} color={colors.iconOrangeFg} />
            </View>
            <Text style={styles.statValue}>1</Text>
            <Text style={styles.statLabel}>Reportado</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.iconBlueBg }]}>
              <Ionicons name="trending-up" size={20} color={colors.iconBlueFg} />
            </View>
            <Text style={styles.statValue}>2</Text>
            <Text style={styles.statLabel}>En Proceso</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.iconGreenBg }]}>
              <Ionicons name="trending-up" size={20} color={colors.iconGreenFg} />
            </View>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Resuelto</Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/report')}>
            <Ionicons name="add" size={20} color="#FFF" style={styles.btnIcon} />
            <Text style={styles.primaryButtonText}>Reportar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Ionicons name="location-outline" size={20} color={colors.textTitle} style={styles.btnIcon} />
            <Text style={styles.secondaryButtonText}>Ver Mapa</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Reports Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Reportes Recientes</Text>
        </View>

        <View style={styles.listContainer}>
          {REPORTS.map((report) => (
            <TouchableOpacity 
              key={report.id} 
              style={styles.reportCard}
              onPress={() => router.push('/issue-details')}
              activeOpacity={0.8}
            >
              
              {/* Image Column */}
              {report.isPlaceholder ? (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.questionMarkBox}>
                    <Text style={styles.questionMarkText}>?</Text>
                  </View>
                </View>
              ) : (
                <Image source={{ uri: report.imageUrl }} style={styles.reportImage} />
              )}

              {/* Details Column */}
              <View style={styles.reportDetails}>
                
                <View style={styles.reportHeaderRow}>
                  <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: report.statusBg }]}>
                    <Ionicons name={report.statusIcon as any} size={12} color={report.statusFg} />
                    <Text style={[styles.statusText, { color: report.statusFg }]}>{report.status}</Text>
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.textLight} />
                  <Text style={styles.locationText}>{report.location}</Text>
                </View>

                <View style={styles.reportFooterRow}>
                  <View style={[styles.categoryTag, { backgroundColor: report.tagBg }]}>
                    <Text style={styles.categoryTagText}>{report.tag}</Text>
                  </View>
                  
                  <View style={styles.metaInfo}>
                    <Ionicons name="thumbs-up-outline" size={14} color={colors.textLight} />
                    <Text style={styles.metaText}>{report.likes}</Text>
                    <Text style={[styles.metaText, { marginLeft: 12 }]}>{report.date}</Text>
                  </View>
                </View>

              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Spacer for bottom tab */}
        <View style={{ height: 100 }} />
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
            <Ionicons name="add" size={32} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.tabLabel, { marginTop: 4 }]}>Reportar</Text>
        </View>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/profile')}>
          <Ionicons name="person-outline" size={24} color={colors.textLight} />
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 250,
    backgroundColor: colors.primary,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingTop: 30, // for systems without nice safearea
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    width: (width - 60) / 3, // 3 cards with 20px padding (x2) and 10px gap (x2)
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textTitle,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSub,
    fontWeight: '500',
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
    color: colors.textSub,
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
    color: colors.textLight,
    marginLeft: 4,
    fontWeight: '500',
  },
  bottomTabBar: {
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
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
    position: 'absolute',
    bottom: 0,
    width: '100%',
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
    borderColor: '#FFFFFF', // To create the cut-out effect roughly
  }
});

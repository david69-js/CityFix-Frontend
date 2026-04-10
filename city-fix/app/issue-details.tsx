import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Image, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIssueDetails } from '../src/hooks/useIssues';
import { formatDate } from '../src/utils/date';

const { width } = Dimensions.get('window');

const colors = {
  primary: '#2065ff', // Bright blue
  background: '#F9FAFB', 
  surface: '#FFFFFF', 
  textTitle: '#111827', 
  textSub: '#4B5563', 
  textLight: '#9CA3AF', 
  border: '#E5E7EB',
  
  // Tag colors (Fallbacks)
  tagDefaultBg: '#4B5563',
  tagGarbageBg: '#F59E0B',
  tagRoadsBg: '#4B5563',
  tagLightingBg: '#EAB308',
  tagWaterBg: '#3B82F6',

  // Status colors
  statusProgressBg: '#EEF4FF',
  statusProgressFg: '#3B82F6',

  // Specific to Issue Details
  buttonBlueBg: '#E0E7FF',
  buttonBlueText: '#4338CA', 
  timelineLine: '#E5E7EB',
  orangeDot: '#F97316',
  blueDot: '#3B82F6',
};

// Helper for Category Colors
const getCategoryColor = (name: string) => {
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

export default function IssueDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  const { data: issue, isLoading, error } = useIssueDetails(id as string);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSub }}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !issue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textLight} />
          <Text style={{ marginTop: 12, fontSize: 16, color: colors.textTitle, fontWeight: 'bold' }}>Error al cargar el reporte</Text>
          <Text style={{ marginTop: 4, textAlign: 'center', color: colors.textSub }}>No pudimos encontrar la información solicitada.</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.commentBtn, { width: '100%', marginTop: 20, marginLeft: 0 }]}>
            <Text style={styles.commentBtnText}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const mainImage = issue.images && issue.images.length > 0 ? issue.images[0].full_url : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textTitle} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalles del Reporte</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="share-social-outline" size={24} color={colors.textTitle} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Main Image */}
          {mainImage ? (
            <Image 
              source={{ uri: mainImage }} 
              style={styles.heroImage} 
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }]}>
              <Ionicons name="image-outline" size={48} color={colors.textLight} />
              <Text style={{ color: colors.textLight, marginTop: 8 }}>Sin imagen adjunta</Text>
            </View>
          )}

          <View style={styles.contentPadding}>
            
            {/* Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: (issue.status?.color || colors.primary) + '15' }]}>
              <Ionicons name={getStatusIcon(issue.status?.name || '') as any} size={24} color={issue.status?.color || colors.primary} style={styles.statusBannerIcon} />
              <View style={styles.statusBannerTextContainer}>
                <Text style={[styles.statusBannerTitle, { color: issue.status?.color || colors.primary }]}>{issue.status?.name || 'Pendiente'}</Text>
                <Text style={[styles.statusBannerSub, { color: colors.textSub }]}>Estado actual de este reporte ciudadano</Text>
              </View>
            </View>

            {/* Title & Tag */}
            <View style={styles.titleRow}>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(issue.category?.name || '') }]}>
                <Text style={styles.categoryTagText}>{issue.category?.name || 'General'}</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.descriptionText}>
              {issue.description || 'Sin descripción adicional proporcionada.'}
            </Text>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={22} color={colors.textLight} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  <Text style={styles.infoValue}>{issue.location}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={22} color={colors.textLight} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Reportado el</Text>
                  <Text style={styles.infoValue}>{formatDate(issue.created_at)}</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.voteBtn}>
                <Ionicons name="thumbs-up" size={18} color={colors.primary} style={styles.btnIcon} />
                <Text style={styles.voteBtnText}>Voto ({issue.upvotes_count || 0})</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.commentBtn}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.textTitle} style={styles.btnIcon} />
                <Text style={styles.commentBtnText}>Comentar ({issue.comments_count || 0})</Text>
              </TouchableOpacity>
            </View>

            {/* Timeline (Static as no endpoint provided) */}
            <Text style={styles.sectionTitle}>Línea de Tiempo de Actualizaciones</Text>
            
            <View style={styles.timelineContainer}>
              <View style={styles.timelineItem}>
                <View style={styles.timelineNodeContainer}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.orangeDot }]} />
                  <View style={[styles.timelineLine, { backgroundColor: 'transparent' }]} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Reporte creado correctamente</Text>
                  <Text style={styles.timelineTime}>{formatDate(issue.created_at)}</Text>
                </View>
              </View>
            </View>

            {/* Similar Issues (Placeholder) */}
            <Text style={styles.sectionTitle}>Problemas Similares Cercanos</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyCardText}>No hay problemas similares reportados en esta área</Text>
            </View>

          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Tabs */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/')}>
            <Ionicons name="home-outline" size={24} color={colors.textLight} />
            <Text style={styles.tabLabel}>Inicio</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: 14,
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
  scrollContent: {
    paddingBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  contentPadding: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusBannerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  statusBannerTextContainer: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBannerSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textTitle,
    flex: 1,
    marginRight: 12,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSub,
    lineHeight: 22,
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: colors.textTitle,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  voteBtn: {
    flex: 1,
    backgroundColor: colors.buttonBlueBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  btnIcon: {
    marginRight: 8,
  },
  voteBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  commentBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentBtnText: {
    color: colors.textTitle,
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 16,
  },
  timelineContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineNodeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    height: 50,
    backgroundColor: colors.timelineLine,
    marginTop: -2, 
    marginBottom: -2, 
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTitle,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 40,
  },
  emptyCardText: {
    fontSize: 13,
    color: colors.textSub,
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
    paddingBottom: 25, 
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

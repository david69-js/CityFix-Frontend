import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const colors = {
  primary: '#2065ff', // Bright blue
  background: '#F9FAFB', 
  surface: '#FFFFFF', 
  textTitle: '#111827', 
  textSub: '#4B5563', 
  textLight: '#9CA3AF', 
  border: '#E5E7EB',
  
  // Tag colors
  tagGarbageBg: '#F59E0B',

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

export default function IssueDetailsScreen() {
  const router = useRouter();

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
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80' }} 
            style={styles.heroImage} 
            resizeMode="cover"
          />

          <View style={styles.contentPadding}>
            
            {/* Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: colors.statusProgressBg }]}>
              <Ionicons name="time-outline" size={24} color={colors.statusProgressFg} style={styles.statusBannerIcon} />
              <View style={styles.statusBannerTextContainer}>
                <Text style={[styles.statusBannerTitle, { color: colors.statusProgressFg }]}>En proceso</Text>
                <Text style={[styles.statusBannerSub, { color: '#60A5FA' }]}>Las autoridades están trabajando para resolver este problema</Text>
              </View>
            </View>

            {/* Title & Tag */}
            <View style={styles.titleRow}>
              <Text style={styles.issueTitle}>Basurero desbordado</Text>
              <View style={[styles.categoryTag, { backgroundColor: colors.tagGarbageBg }]}>
                <Text style={styles.categoryTagText}>Basura</Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.descriptionText}>
              Basurero grande desbordado desde hace 3 días en la esquina de la Calle Principal.
            </Text>

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={22} color={colors.textLight} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  <Text style={styles.infoValue}>Calle 5 # 10-20</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={22} color={colors.textLight} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Reportado el</Text>
                  <Text style={styles.infoValue}>Martes, 3 de Febrero de 2026</Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.voteBtn}>
                <Ionicons name="thumbs-up" size={18} color={colors.primary} style={styles.btnIcon} />
                <Text style={styles.voteBtnText}>Votado (24)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.commentBtn}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.textTitle} style={styles.btnIcon} />
                <Text style={styles.commentBtnText}>Comentar</Text>
              </TouchableOpacity>
            </View>

            {/* Timeline */}
            <Text style={styles.sectionTitle}>Línea de Tiempo de Actualizaciones</Text>
            
            <View style={styles.timelineContainer}>
              
              {/* Timeline Item 1 */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineNodeContainer}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.orangeDot }]} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Problema verificado por inspector municipal</Text>
                  <Text style={styles.timelineTime}>Feb 4 a las 2:15 PM</Text>
                </View>
              </View>

              {/* Timeline Item 2 */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineNodeContainer}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.blueDot }]} />
                  <View style={[styles.timelineLine, { backgroundColor: 'transparent' }]} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Equipo de trabajo ha sido enviado al lugar</Text>
                  <Text style={styles.timelineTime}>Feb 5 a las 10:30 AM</Text>
                </View>
              </View>

            </View>

            {/* Similar Issues */}
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

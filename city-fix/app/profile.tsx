import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, TextInput, Alert, ActivityIndicator, Image, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../src/api/axios';
import { useMyIssues } from '../src/hooks/useIssues';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { fixImageUrl } from '../src/utils/helpers';
// import { generateSummaryPDF } from '../src/utils/pdfGenerator';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, setUser, initializeAuth } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const { data: myIssues, isLoading: isLoadingIssues } = useMyIssues(user?.id);
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const reportedCount = myIssues?.filter(i => i.status_id === 1 || i.status?.name?.toLowerCase().includes('reportado') || i.status?.name?.toLowerCase().includes('pendiente')).length || 0;
  const processCount = myIssues?.filter(i => i.status_id === 2 || i.status?.name?.toLowerCase().includes('proceso')).length || 0;
  const resolvedCount = myIssues?.filter(i => i.status_id === 3 || i.status?.name?.toLowerCase().includes('resuelto') || i.status?.name?.toLowerCase().includes('listo')).length || 0;
  const totalReports = myIssues?.length || 0;
  const totalVotes = myIssues?.reduce((sum, issue) => sum + (issue.upvotes_count || 0), 0) || 0;



  const handlePickAvatar = () => {
    Alert.alert(
      'Foto de Perfil',
      '¿Cómo deseas actualizar tu foto?',
      [
        { text: 'Tomar Foto', onPress: () => launchPicker(true) },
        { text: 'Elegir de Galería', onPress: () => launchPicker(false) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const launchPicker = async (isCamera: boolean) => {
    const permission = isCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permission.status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para realizar esta acción.');
      return;
    }

    try {
      const result = isCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });

      if (!result.canceled && result.assets) {
        setNewAvatarUri(result.assets[0].uri);
      }
    } catch (error: any) {
      if (error.message.includes('Camera not available')) {
        Alert.alert('Cámara no disponible', 'Parece que estás en un simulador o tu dispositivo no tiene cámara activa.');
      } else {
        Alert.alert('Error', 'Hubo un problema al intentar abrir la cámara o galería.');
      }
      console.warn(error);
    }
  };

  const handleUploadAvatar = async () => {
    // Esta función ya no se usa aquí, se movió a edit-profile.tsx
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Blue Header Section */}
        <View style={styles.headerArea}>
          <SafeAreaView>
            <View style={styles.headerTop}>
              <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.iconButton}>
                <Ionicons name="settings-outline" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <TouchableOpacity
                onPress={() => router.push('/edit-profile')}
                style={styles.avatarBorder}
                activeOpacity={0.9}
              >
                <View style={styles.avatar}>
                  {user?.avatar ? (
                    <Image
                      source={{ uri: fixImageUrl(user.avatar_url || user.avatar) + `?t=${new Date().getTime()}` }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Ionicons name="person-outline" size={60} color={colors.primary} />
                  )}
                </View>
                <View style={styles.editIconBadge}>
                  <Ionicons name="settings" size={16} color="#FFF" />
                </View>
              </TouchableOpacity>

              <Text style={styles.userName}>{user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Usuario'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* Stats Card Overlaying Header */}
        <View style={styles.statsCardWrapper}>
          <View style={styles.statsCard}>

            <TouchableOpacity
              style={[styles.statItem, { backgroundColor: colors.statBgBlue }]}
              onPress={() => router.push('/my-reports')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: colors.statTextBlue }]}>{totalReports}</Text>
              <Text style={styles.statLabel}>Reportes Totales</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statItem, { backgroundColor: colors.iconOrangeBg }]}
              onPress={() => router.push('/my-reports?statusId=1')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: colors.iconOrangeFg }]}>{reportedCount}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statItem, { backgroundColor: colors.iconBlueBg }]}
              onPress={() => router.push('/my-reports?statusId=2')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: colors.iconBlueFg }]}>{processCount}</Text>
              <Text style={styles.statLabel}>En Proceso</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statItem, { backgroundColor: colors.iconGreenBg }]}
              onPress={() => router.push('/my-reports?statusId=3')}
              activeOpacity={0.7}
            >
              <Text style={[styles.statNumber, { color: colors.iconGreenFg }]}>{resolvedCount}</Text>
              <Text style={styles.statLabel}>Resueltos</Text>
            </TouchableOpacity>

            <View style={[styles.statItem, { backgroundColor: colors.statBgPurple }]}>
              <View style={styles.statNumberRow}>
                <Ionicons name="trending-up" size={16} color={colors.statTextPurple} style={{ marginRight: 4 }} />
                <Text style={[styles.statNumber, { color: colors.statTextPurple }]}>{totalVotes}</Text>
              </View>
              <Text style={styles.statLabel}>Votos Recibidos</Text>
            </View>

            <View style={[styles.statItem, { backgroundColor: colors.statBgOrange }]}>
              <View style={styles.statNumberRow}>
                <MaterialCommunityIcons name="medal-outline" size={18} color={colors.statTextOrange} style={{ marginRight: 4 }} />
                <Text style={[styles.statNumber, { color: colors.statTextOrange }]}>{totalReports * 10 + totalVotes * 5}</Text>
              </View>
              <Text style={styles.statLabel}>Pts de Impacto</Text>
            </View>

          </View>
        </View>

        {/* Content Sections */}
        <View style={styles.contentPadding}>

          {/* Achievements */}
          <Text style={styles.sectionTitle}>Logros</Text>
          <View style={styles.card}>

            {/* Hero */}
            {(() => {
              const isHeroUnlocked = totalReports >= 1;
              return (
                <View style={styles.achieveRow}>
                  <View style={[styles.achieveIconBg, { backgroundColor: isHeroUnlocked ? colors.orangeHero : colors.badgeGreyBg }]}>
                    <MaterialCommunityIcons 
                      name="medal-outline" 
                      size={24} 
                      color={isHeroUnlocked ? "#FFF" : colors.badgeGreyText} 
                    />
                  </View>
                  <View style={styles.achieveTextCol}>
                    <Text style={[styles.achieveTitle, !isHeroUnlocked && { color: colors.textLight }]}>
                      Héroe de la Comunidad
                    </Text>
                    <Text style={styles.achieveDesc}>Primer reporte realizado</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isHeroUnlocked ? colors.badgeYellowBg : colors.badgeGreyBg }]}>
                    <Text style={[styles.badgeText, { color: isHeroUnlocked ? colors.badgeYellowText : colors.badgeGreyText }]}>
                      {isHeroUnlocked ? 'Desbloqueado' : 'Bloqueado'}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.divider} />

            {/* Influencer */}
            {(() => {
              const isInfluencerUnlocked = totalReports >= 1 || totalVotes >= 1;
              return (
                <View style={styles.achieveRow}>
                  <View style={[styles.achieveIconBg, { backgroundColor: isInfluencerUnlocked ? colors.blueInfluencer : colors.badgeGreyBg }]}>
                    <Ionicons 
                      name="trending-up" 
                      size={24} 
                      color={isInfluencerUnlocked ? "#FFF" : colors.badgeGreyText} 
                    />
                  </View>
                  <View style={styles.achieveTextCol}>
                    <Text style={[styles.achieveTitle, !isInfluencerUnlocked && { color: colors.textLight }]}>
                      Influencer
                    </Text>
                    <Text style={styles.achieveDesc}>Primera interacción (voto o reporte)</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isInfluencerUnlocked ? colors.badgeBlueBg : colors.badgeGreyBg }]}>
                    <Text style={[styles.badgeText, { color: isInfluencerUnlocked ? colors.badgeBlueText : colors.badgeGreyText }]}>
                      {isInfluencerUnlocked ? 'Desbloqueado' : 'Bloqueado'}
                    </Text>
                  </View>
                </View>
              );
            })()}

            <View style={styles.divider} />

            {/* Super Reporter */}
            {(() => {
              const isSuperReporterUnlocked = totalReports >= 50;
              return (
                <View style={styles.achieveRow}>
                  <View style={[styles.achieveIconBg, { backgroundColor: isSuperReporterUnlocked ? colors.greySuper : colors.badgeGreyBg }]}>
                    <MaterialCommunityIcons 
                      name="medal-outline" 
                      size={24} 
                      color={isSuperReporterUnlocked ? "#FFF" : colors.badgeGreyText} 
                    />
                  </View>
                  <View style={styles.achieveTextCol}>
                    <Text style={[styles.achieveTitle, !isSuperReporterUnlocked && { color: colors.textLight }]}>
                      Súper Reportero
                    </Text>
                    <Text style={styles.achieveDesc}>Reportó 50 problemas ({totalReports}/50)</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isSuperReporterUnlocked ? colors.badgeYellowBg : colors.badgeGreyBg }]}>
                    <Text style={[styles.badgeText, { color: isSuperReporterUnlocked ? colors.badgeYellowText : colors.badgeGreyText }]}>
                      {isSuperReporterUnlocked ? 'Desbloqueado' : 'Bloqueado'}
                    </Text>
                  </View>
                </View>
              );
            })()}

          </View>

          {/* Status Breakdown */}
          <Text style={styles.sectionTitle}>Resumen de Estado</Text>
          <View style={styles.card}>
            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: '#F97316' }]} />
                <Text style={styles.statusName}>Reportado</Text>
              </View>
              <Text style={styles.statusCount}>{reportedCount}</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.statusName}>En proceso</Text>
              </View>
              <Text style={styles.statusCount}>{processCount}</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusLeft}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.statusName}>Resuelto</Text>
              </View>
              <Text style={styles.statusCount}>{resolvedCount}</Text>
            </View>
          </View>


          {/* Admin / Worker Actions - PDF Summary Hidden by user request */}

          {/* My Reports */}
          <Text style={styles.sectionTitle}>Mis Reportes</Text>

          {isLoadingIssues ? (
            <View style={[styles.myReportsCard, { alignItems: 'center', padding: 20 }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.myReportsCard}
              onPress={() => router.push('/my-reports')}
              activeOpacity={0.7}
            >
              <View style={styles.myReportsIcon}>
                <Ionicons name="document-text-outline" size={28} color={colors.primary} />
              </View>
              <View style={styles.myReportsInfo}>
                <Text style={styles.myReportsTitle}>Ver todos mis reportes</Text>
                <Text style={styles.myReportsCount}>
                  {myIssues?.length || 0} reporte{(myIssues?.length || 0) !== 1 ? 's' : ''} • {(myIssues || []).reduce((s, i) => s + (i.upvotes_count || 0), 0)} votos
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await logout();
              router.replace('/welcome');
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <BottomTabBar activeTab="profile" />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerArea: {
    backgroundColor: colors.primary,
    paddingBottom: 70, // To make room for the overlapping card
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 40 : 10,
  },
  iconButton: {
    padding: 8,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarBorder: {
    padding: 4,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  avatar: {
    width: 140, // Larger, prominent avatar
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  saveAvatarBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveAvatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  statsCardWrapper: {
    marginTop: -45, // Pulls the card half-way up into the blue header
    paddingHorizontal: 20,
    zIndex: 10,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSub,
    fontWeight: '600',
    textAlign: 'center',
  },
  contentPadding: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textTitle,
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  achieveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  achieveIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achieveTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  achieveTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textTitle,
    marginBottom: 2,
  },
  achieveDesc: {
    fontSize: 12,
    color: colors.textLight,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusName: {
    fontSize: 14,
    color: colors.textSub,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },
  pdfSummaryBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  pdfSummaryBtnDisabled: {
    opacity: 0.6,
  },
  pdfSummaryBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusCount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textTitle,
  },
  adminSubtitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textTitle,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: colors.textSub,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textTitle,
    backgroundColor: '#F9FAFB',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconCard: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF4FF',
  },
  adminButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  adminButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  myReportsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  myReportsIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  myReportsInfo: { flex: 1 },
  myReportsTitle: { fontSize: 15, fontWeight: '700', color: colors.textTitle, marginBottom: 4 },
  myReportsCount: { fontSize: 13, color: colors.textSub },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.danger + '40', // 25% opacity
  },
  logoutText: {
    color: colors.danger,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8
  },
  issueCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: colors.border },
  issueImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12
  },
  issueImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  issueInfo: { flex: 1, justifyContent: 'space-between' },
  issueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  issueDate: { fontSize: 11, color: colors.textLight },
  issueCardTitle: { fontSize: 15, fontWeight: '700', color: colors.textTitle, marginVertical: 6 },
  issueFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  issueStatus: { fontSize: 12, fontWeight: '600' },
  issueMetrics: { flexDirection: 'row', alignItems: 'center' },
  metric: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  metricText: { fontSize: 12, color: colors.textLight, marginLeft: 4 },
});



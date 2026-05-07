import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import apiClient from '../src/api/axios';
import { useMyIssues } from '../src/hooks/useIssues';
import { formatDate } from '../src/utils/date';

const { width } = Dimensions.get('window');

const colors = {
  primary: '#2065ff',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#EF4444',

  statBgBlue: '#F0F9FF',
  statTextBlue: '#0284C7',
  statBgGreen: '#F0FDF4',
  statTextGreen: '#16A34A',
  statBgPurple: '#FAF5FF',
  statTextPurple: '#9333EA',
  statBgOrange: '#FFFBEB',
  statTextOrange: '#D97706',

  orangeHero: '#F59E0B',
  blueInfluencer: '#3B82F6',
  greySuper: '#E5E7EB',

  badgeYellowBg: '#FEF3C7',
  badgeYellowText: '#92400E',
  badgeBlueBg: '#DBEAFE',
  badgeBlueText: '#1E40AF',
  badgeGreyBg: '#F3F4F6',
  badgeGreyText: '#9CA3AF',
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data: myIssues, isLoading: isLoadingIssues } = useMyIssues(user?.id);

  const reportedCount = myIssues?.filter(i => i.status_id === 1 || i.status?.name?.toLowerCase().includes('reportado') || i.status?.name?.toLowerCase().includes('pendiente')).length || 0;
  const processCount = myIssues?.filter(i => i.status_id === 2 || i.status?.name?.toLowerCase().includes('proceso')).length || 0;
  const resolvedCount = myIssues?.filter(i => i.status_id === 3 || i.status?.name?.toLowerCase().includes('resuelto') || i.status?.name?.toLowerCase().includes('listo')).length || 0;
  const totalReports = myIssues?.length || 0;
  const totalVotes = myIssues?.reduce((sum, issue) => sum + (issue.upvotes_count || 0), 0) || 0;

  // Render Category Tag Color helper
  const getCategoryColor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('basura')) return '#F59E0B';
    if (n.includes('bache') || n.includes('vía')) return '#4B5563';
    if (n.includes('luz') || n.includes('iluminación')) return '#EAB308';
    if (n.includes('agua')) return '#3B82F6';
    return '#4B5563';
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
              <View style={styles.avatarBorder}>
                <View style={styles.avatar}>
                  <Ionicons name="person-outline" size={40} color={colors.primary} />
                </View>
              </View>
              <Text style={styles.userName}>{user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Usuario'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* Stats Card Overlaying Header */}
        <View style={styles.statsCardWrapper}>
          <View style={styles.statsCard}>

            <View style={[styles.statItem, { backgroundColor: colors.statBgBlue }]}>
              <Text style={[styles.statNumber, { color: colors.statTextBlue }]}>{totalReports}</Text>
              <Text style={styles.statLabel}>Reportes Totales</Text>
            </View>

            <View style={[styles.statItem, { backgroundColor: colors.statBgGreen }]}>
              <Text style={[styles.statNumber, { color: colors.statTextGreen }]}>{resolvedCount}</Text>
              <Text style={styles.statLabel}>Resueltos</Text>
            </View>

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
            <View style={styles.achieveRow}>
              <View style={[styles.achieveIconBg, { backgroundColor: colors.orangeHero }]}>
                <MaterialCommunityIcons name="medal-outline" size={24} color="#FFF" />
              </View>
              <View style={styles.achieveTextCol}>
                <Text style={styles.achieveTitle}>Héroe de la Comunidad</Text>
                <Text style={styles.achieveDesc}>Reportó 10+ problemas</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.badgeYellowBg }]}>
                <Text style={[styles.badgeText, { color: colors.badgeYellowText }]}>Desbloqueado</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Influencer */}
            <View style={styles.achieveRow}>
              <View style={[styles.achieveIconBg, { backgroundColor: colors.blueInfluencer }]}>
                <Ionicons name="trending-up" size={24} color="#FFF" />
              </View>
              <View style={styles.achieveTextCol}>
                <Text style={styles.achieveTitle}>Influencer</Text>
                <Text style={styles.achieveDesc}>Recibió 50+ votos</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.badgeBlueBg }]}>
                <Text style={[styles.badgeText, { color: colors.badgeBlueText }]}>Desbloqueado</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Super Reporter */}
            <View style={styles.achieveRow}>
              <View style={[styles.achieveIconBg, { backgroundColor: colors.greySuper }]}>
                <MaterialCommunityIcons name="medal-outline" size={24} color="#FFF" />
              </View>
              <View style={styles.achieveTextCol}>
                <Text style={[styles.achieveTitle, { color: colors.textLight }]}>Súper Reportero</Text>
                <Text style={styles.achieveDesc}>Reportó 50 problemas (12/50)</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: colors.badgeGreyBg }]}>
                <Text style={[styles.badgeText, { color: colors.badgeGreyText }]}>Bloqueado</Text>
              </View>
            </View>

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


          {/* My Reports */}
          <Text style={styles.sectionTitle}>Mis Reportes</Text>
          
          {isLoadingIssues ? (
            <View style={[styles.card, { alignItems: 'center', padding: 20 }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ marginTop: 10, color: colors.textLight }}>Cargando reportes...</Text>
            </View>
          ) : myIssues && myIssues.length > 0 ? (
            myIssues.map(issue => (
              <TouchableOpacity 
                key={issue.id} 
                style={styles.issueCard}
                onPress={() => router.push(`/issue-details?id=${issue.id}`)}
                activeOpacity={0.7}
              >
                {issue.images && issue.images.length > 0 ? (
                  <Image source={{ uri: issue.images[0].full_url }} style={styles.issueImage} />
                ) : (
                  <View style={[styles.issueImage, { backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={24} color={colors.textLight} />
                  </View>
                )}
                
                <View style={styles.issueInfo}>
                  <View style={styles.issueHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(issue.category?.name || '') }]}>
                      <Text style={styles.categoryBadgeText}>{issue.category?.name || 'General'}</Text>
                    </View>
                    <Text style={styles.issueDate}>{formatDate(issue.created_at)}</Text>
                  </View>
                  
                  <Text style={styles.issueCardTitle} numberOfLines={1}>{issue.title}</Text>
                  
                  <View style={styles.issueFooter}>
                    <Text style={[styles.issueStatus, { color: issue.status?.color || colors.primary }]}>
                      • {issue.status?.name || 'Pendiente'}
                    </Text>
                    <View style={styles.issueMetrics}>
                      <View style={styles.metric}>
                        <Ionicons name="thumbs-up-outline" size={14} color={colors.textLight} />
                        <Text style={styles.metricText}>{issue.upvotes_count || 0}</Text>
                      </View>
                      <View style={styles.metric}>
                        <Ionicons name="chatbubble-outline" size={14} color={colors.textLight} />
                        <Text style={styles.metricText}>{issue.comments_count || 0}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyReportsCard}>
              <Text style={styles.emptyReportsText}>Aún no has reportado ningún problema</Text>
              <TouchableOpacity onPress={() => router.push('/report')}>
                <Text style={styles.reportFirstLink}>Reporta Tu Primer Problema</Text>
              </TouchableOpacity>
            </View>
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

        <TouchableOpacity style={styles.tabItem}>
          <Ionicons name="person-outline" size={24} color={colors.primary} />
          <Text style={[styles.tabLabel, { color: colors.primary }]}>Perfil</Text>
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

const styles = StyleSheet.create({
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
    marginTop: 10,
  },
  iconButton: {
    padding: 8,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 10,
  },
  avatarBorder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyReportsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyReportsText: { fontSize: 14, color: colors.textSub, marginBottom: 12 },
  reportFirstLink: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },
  logoutButton: { flexDirection: 'row', backgroundColor: '#FEF2F2', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, borderWidth: 1, borderColor: '#FCA5A5' },
  logoutText: { color: colors.danger, fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  bottomTabBar: { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10, flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 25, paddingTop: 10, justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%' },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabItemCentral: { alignItems: 'center', justifyContent: 'flex-start', flex: 1, marginTop: -25 },
  tabLabel: { fontSize: 11, color: colors.textLight, fontWeight: '500', marginTop: 4 },
  fabButton: { backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, borderWidth: 4, borderColor: '#FFFFFF' },
  issueCard: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: colors.border },
  issueImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
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

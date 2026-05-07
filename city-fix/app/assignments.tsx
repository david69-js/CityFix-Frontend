import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useMyAssignments } from '../src/hooks/useIssues';
import { formatDate } from '../src/utils/date';

const colors = {
  primary: '#2065ff',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#EF4444',
  workerGreen: '#10B981',
};

export default function AssignmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: assignments, isLoading, refetch, isRefetching } = useMyAssignments();

  // Redirect if not worker
  if (user?.role_id !== 2) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No tienes acceso a esta sección.</Text>
      </View>
    );
  }

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
      <SafeAreaView style={{ backgroundColor: colors.workerGreen }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Bandeja de Tareas</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.workerGreen} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.workerGreen} style={{ marginTop: 40 }} />
        ) : assignments && assignments.length > 0 ? (
          assignments.map((assignment: any) => {
            const issue = assignment.issue;
            return (
              <TouchableOpacity
                key={assignment.id}
                style={styles.card}
                onPress={() => router.push(`/issue-details?id=${issue?.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(issue?.category?.name || '') }]}>
                    <Text style={styles.categoryBadgeText}>{issue?.category?.name || 'General'}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(assignment.assigned_at)}</Text>
                </View>

                <Text style={styles.title} numberOfLines={2}>{issue?.title || 'Reporte Asignado'}</Text>
                
                {assignment.notes ? (
                  <View style={styles.notesContainer}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.textSub} style={{marginRight: 4}} />
                    <Text style={styles.notesText}>{assignment.notes}</Text>
                  </View>
                ) : null}

                <View style={styles.footer}>
                  <Text style={[styles.statusText, { color: issue?.status?.color || colors.primary }]}>
                    • {issue?.status?.name || 'Asignado'}
                  </Text>
                  <View style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Ver detalles</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.workerGreen} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={60} color={colors.border} />
            <Text style={styles.emptyTitle}>¡Todo al día!</Text>
            <Text style={styles.emptyDesc}>No tienes tareas asignadas por el momento.</Text>
          </View>
        )}
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

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/assignments')}>
          <Ionicons name="briefcase" size={24} color={colors.workerGreen} />
          <Text style={[styles.tabLabel, { color: colors.workerGreen }]}>Tareas</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 16, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  content: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dateText: { fontSize: 12, color: colors.textLight },
  title: { fontSize: 16, fontWeight: '700', color: colors.textTitle, marginBottom: 12 },
  notesContainer: { flexDirection: 'row', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, marginBottom: 12, alignItems: 'flex-start' },
  notesText: { fontSize: 13, color: colors.textSub, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { color: colors.workerGreen, fontSize: 13, fontWeight: '600', marginRight: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textTitle, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: colors.textSub, marginTop: 8, textAlign: 'center' },
  
  bottomTabBar: { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10, flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 25, paddingTop: 10, justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%' },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabItemCentral: { alignItems: 'center', justifyContent: 'flex-start', flex: 1, marginTop: -25 },
  tabLabel: { fontSize: 11, color: colors.textLight, fontWeight: '500', marginTop: 4 },
  fabButton: { backgroundColor: colors.workerGreen, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: colors.workerGreen, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, borderWidth: 4, borderColor: '#FFFFFF' }
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Image, RefreshControl, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useMyAssignments } from '../src/hooks/useIssues';
import { formatDate } from '../src/utils/date';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { getCategoryColor } from '../src/utils/helpers';

export default function AssignmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { data: assignments, isLoading, refetch, isRefetching } = useMyAssignments();

  // Redirect if not worker
  if (user?.role_id !== 2) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No tienes acceso a esta sección.</Text>
      </View>
    );
  }



  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ backgroundColor: colors.workerHighlight }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Bandeja de Tareas</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.workerHighlight} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.workerHighlight} style={{ marginTop: 40 }} />
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
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(issue?.category?.name || '', colors) }]}>
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
      <BottomTabBar activeTab="assignments" />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { 
    paddingTop: Platform.OS === 'android' ? 40 : 16, 
    paddingBottom: 16, 
    alignItems: 'center' 
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  content: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  categoryBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  dateText: { fontSize: 12, color: colors.textLight },
  title: { fontSize: 16, fontWeight: '700', color: colors.textTitle, marginBottom: 12 },
  notesContainer: { flexDirection: 'row', backgroundColor: colors.border, padding: 10, borderRadius: 8, marginBottom: 12, alignItems: 'flex-start' },
  notesText: { fontSize: 13, color: colors.textSub, flex: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  statusText: { fontSize: 13, fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionBtnText: { color: colors.workerHighlight, fontSize: 13, fontWeight: '600', marginRight: 4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textTitle, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: colors.textSub, marginTop: 8, textAlign: 'center' },
  
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 40 },
});

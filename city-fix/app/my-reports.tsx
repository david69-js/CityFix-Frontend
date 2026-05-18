import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useMyIssues } from '../src/hooks/useIssues';
import { formatDate } from '../src/utils/date';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { fixImageUrl, getCategoryColor } from '../src/utils/helpers';

export default function MyReportsScreen() {
  const router = useRouter();
  const { statusId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { data: myIssues, isLoading } = useMyIssues(user?.id);

  const statusLabels: Record<number, string> = {
    1: 'Pendientes',
    2: 'En Proceso',
    3: 'Resueltos'
  };
  
  const statusEmptyDescs: Record<number, string> = {
    1: 'Aún no tienes ningún problema pendiente de revisión.',
    2: 'Aún no tienes ningún problema en proceso de reparación.',
    3: 'Aún no tienes ningún problema marcado como resuelto.'
  };

  const activeStatusLabel = statusId ? statusLabels[Number(statusId)] : '';
  const activeStatusDesc = statusId ? statusEmptyDescs[Number(statusId)] : 'Aún no has reportado ningún problema.';

  const filteredIssues = React.useMemo(() => {
    if (!myIssues) return [];
    if (statusId) {
      return myIssues.filter(issue => Number(issue.status_id) === Number(statusId));
    }
    return myIssues;
  }, [myIssues, statusId]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ backgroundColor: colors.surface }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textTitle} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Reportes</Text>
          <View style={styles.iconButton} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSub }}>Cargando reportes...</Text>
        </View>
      ) : filteredIssues && filteredIssues.length > 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.countText}>
            {filteredIssues.length} reporte{filteredIssues.length !== 1 ? 's' : ''} {activeStatusLabel ? `(${activeStatusLabel})` : ''}
          </Text>
          {filteredIssues.map(issue => (
            <TouchableOpacity
              key={issue.id}
              style={styles.issueCard}
              onPress={() => router.push(`/issue-details?id=${issue.id}`)}
              activeOpacity={0.7}
            >
              {issue.images && issue.images.length > 0 && issue.images[0] ? (
                <Image
                  source={{ uri: fixImageUrl(issue.images[0].full_url) || '' }}
                  style={styles.issueImage}
                />
              ) : (
                <View style={styles.issueImagePlaceholder}>
                  <Ionicons name="image-outline" size={24} color={colors.textLight} />
                </View>
              )}

              <View style={styles.issueInfo}>
                <View style={styles.issueHeader}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(issue.category?.name || '', colors) }]}>
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
                    <Ionicons name="thumbs-up-outline" size={14} color={colors.textLight} />
                    <Text style={styles.metricText}>{issue.upvotes_count || 0}</Text>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.textLight} style={{ marginLeft: 10 }} />
                    <Text style={styles.metricText}>{issue.comments_count || 0}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        <View style={styles.centered}>
          <Ionicons name="document-text-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyTitle}>
            {statusId ? `Sin reportes ${activeStatusLabel.toLowerCase()}` : 'Sin reportes'}
          </Text>
          <Text style={styles.emptyDesc}>
            {activeStatusDesc}
          </Text>
          {!statusId && (
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => router.push('/report')}
            >
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.reportBtnText}>Reportar un problema</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 25 : 14,
    paddingBottom: 14,
    backgroundColor: colors.surface,
  },
  iconButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textTitle },
  scrollContent: { padding: 16, paddingBottom: 40 },
  countText: { fontSize: 14, color: colors.textSub, fontWeight: '600', marginBottom: 16 },
  issueCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  issueImage: { width: 80, height: 80, borderRadius: 8, marginRight: 12 },
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
  metricText: { fontSize: 12, color: colors.textLight, marginLeft: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textTitle, marginTop: 16 },
  emptyDesc: { fontSize: 14, color: colors.textSub, marginTop: 8, textAlign: 'center' },
  reportBtn: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  reportBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700', marginLeft: 8 },
});

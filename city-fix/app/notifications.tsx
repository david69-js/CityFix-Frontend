import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, useMarkAsRead } from '../src/hooks/useNotifications';
import { formatDate } from '../src/utils/date';

const colors = {
  primary: '#2065ff',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  unreadBg: '#EEF4FF',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, refetch, isRefetching } = useNotifications();
  const markAsReadMutation = useMarkAsRead();

  const getIcon = (type: string) => {
    switch (type) {
      case 'update':
      case 'status_updated':
        return { name: 'sync-circle-outline', color: '#3B82F6' };
      case 'comment':
      case 'issue_created':
        return { name: 'chatbubble-ellipses-outline', color: '#10B981' };
      case 'assignment':
        return { name: 'briefcase-outline', color: '#F59E0B' };
      default:
        return { name: 'notifications-outline', color: colors.textLight };
    }
  };

  const handlePress = (notification: any) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    
    if (notification.related_id) {
      router.push(`/issue-details?id=${notification.related_id}`);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        headerTitle: 'Notificaciones',
        headerStyle: { backgroundColor: '#FFF' },
        headerTintColor: colors.textTitle,
        headerShadowVisible: false,
      }} />

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : notifications && notifications.length > 0 ? (
          notifications.map((notification) => {
            const icon = getIcon(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[styles.item, !notification.is_read && styles.unreadItem]}
                onPress={() => handlePress(notification)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: icon.color + '15' }]}>
                  <Ionicons name={icon.name as any} size={24} color={icon.color} />
                </View>
                
                <View style={styles.content}>
                  <View style={styles.header}>
                    <Text style={[styles.title, !notification.is_read && styles.unreadText]}>
                      {notification.title}
                    </Text>
                    {!notification.is_read && <View style={styles.dot} />}
                  </View>
                  <Text style={styles.message} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.date}>{formatDate(notification.created_at)}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={60} color={colors.border} />
            <Text style={styles.emptyTitle}>Sin notificaciones</Text>
            <Text style={styles.emptyDesc}>Te avisaremos cuando haya novedades sobre tus reportes.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'flex-start',
  },
  unreadItem: {
    backgroundColor: colors.unreadBg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textTitle,
    flex: 1,
  },
  unreadText: {
    fontWeight: '800',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSub,
    lineHeight: 20,
    marginBottom: 6,
  },
  date: {
    fontSize: 12,
    color: colors.textLight,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textTitle,
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 14,
    color: colors.textSub,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

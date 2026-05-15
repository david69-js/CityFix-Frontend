import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useThemeColors } from '../hooks/useThemeColors';

interface BottomTabBarProps {
  activeTab: 'home' | 'map' | 'report' | 'profile' | 'assignments' | 'admin' | 'none';
}

export const BottomTabBar = ({ activeTab }: BottomTabBarProps) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();

  // Determine the primary highlight color based on context
  // Admin screen = danger (red)
  // Assignments screen = workerGreen (green)
  // Others = primary (blue)
  const getHighlightColor = () => {
    if (user?.role_id === 1) return colors.adminHighlight; // Teal as requested
    if (user?.role_id === 2) return colors.workerHighlight; // Sage as requested
    return colors.primary;
  };

  const highlightColor = getHighlightColor();

  const TabItem = ({ icon, label, route, tabKey }: { icon: any, label: string, route: string, tabKey: string }) => {
    const isActive = activeTab === tabKey;
    const color = isActive ? highlightColor : colors.textSub;

    return (
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => activeTab !== tabKey && router.push(route as any)}
      >
        <Ionicons name={isActive ? icon.replace('-outline', '') : icon} size={24} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.bottomTabBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      <TabItem icon="home-outline" label="Inicio" route="/" tabKey="home" />
      <TabItem icon="map-outline" label="Mapa" route="/map" tabKey="map" />

      <View style={styles.tabItemCentral}>
        <TouchableOpacity 
          style={[styles.fabButton, { backgroundColor: highlightColor, borderColor: colors.surface }]} 
          onPress={() => router.push('/report')}
        >
          <Ionicons name="add" size={32} color="#FFF" style={{ marginTop: -1 }} />
        </TouchableOpacity>
        <Text style={[styles.tabLabel, { marginTop: 4, color: colors.textSub }]}>Reportar</Text>
      </View>

      <TabItem icon="person-outline" label="Perfil" route="/profile" tabKey="profile" />

      {user?.role_id === 2 && (
        <TabItem icon="briefcase-outline" label="Tareas" route="/assignments" tabKey="assignments" />
      )}

      {user?.role_id === 1 && (
        <TabItem icon="shield-checkmark-outline" label="Admin" route="/admin" tabKey="admin" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomTabBar: {
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 25, // For iPhone home indicator area (approx)
    paddingTop: 10,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 100,
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
  fabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});

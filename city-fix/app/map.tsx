import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const colors = {
  primary: '#2065ff', // Bright blue
  background: '#F9FAFB', 
  surface: '#FFFFFF', 
  textTitle: '#111827', 
  textSub: '#4B5563', 
  textLight: '#9CA3AF', 
  border: '#E5E7EB',
  
  // Map specific
  mapBg: '#F0F9FA',
  gridLine: '#E4F1F2',
  
  pinBlueBg: '#DBEAFE',
  pinBlueFg: '#3B82F6',
  pinOrangeBg: '#FFEDD5',
  pinOrangeFg: '#F97316',
  pinGreenBg: '#D1FAE5',
  pinGreenFg: '#10B981',
};

// Simple component to generate a background grid
const MapGrid = () => {
  const gridSize = 40;
  const cols = Math.ceil(width / gridSize);
  const rows = Math.ceil((height - 150) / gridSize);
  
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: rows * cols }).map((_, i) => (
          <View 
            key={i} 
            style={{ 
              width: gridSize, 
              height: gridSize, 
              borderRightWidth: 1, 
              borderBottomWidth: 1, 
              borderColor: colors.gridLine,
              backgroundColor: colors.mapBg,
            }} 
          />
        ))}
      </View>
    </View>
  );
};

export default function MapScreen() {
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
          <Text style={styles.headerTitle}>Mapa de Problemas</Text>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="funnel-outline" size={22} color={colors.textTitle} />
          </TouchableOpacity>
        </View>

        {/* Filters Scroll Menu */}
        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
            <TouchableOpacity style={[styles.filterChip, styles.filterChipActive]}>
              <Text style={[styles.filterText, styles.filterTextActive]}>Todos (4)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterText}>Reportados (1)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterText}>En Proceso (2)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterChip}>
              <Text style={styles.filterText}>Resueltos (1)</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Map Area */}
        <View style={styles.mapArea}>
          <MapGrid />

          {/* Map Pins (Absolutely positioned to match the screenshot roughly) */}
          <View style={[styles.pinWrapper, { top: '25%', left: '15%' }]}>
            <View style={[styles.pinOuter, { backgroundColor: colors.pinBlueBg }]}>
              <View style={[styles.pinInner, { backgroundColor: colors.pinBlueFg }]}>
                <Ionicons name="location-outline" size={14} color="#FFF" />
              </View>
            </View>
          </View>

          <View style={[styles.pinWrapper, { top: '45%', left: '15%' }]}>
            <View style={[styles.pinOuter, { backgroundColor: colors.pinBlueBg }]}>
              <View style={[styles.pinInner, { backgroundColor: colors.pinBlueFg }]}>
                <Ionicons name="location-outline" size={14} color="#FFF" />
              </View>
            </View>
          </View>

          <View style={[styles.pinWrapper, { top: '25%', left: '45%' }]}>
            <View style={[styles.pinOuter, { backgroundColor: colors.pinOrangeBg }]}>
              <View style={[styles.pinInner, { backgroundColor: colors.pinOrangeFg }]}>
                <Ionicons name="location-outline" size={14} color="#FFF" />
              </View>
            </View>
          </View>

          <View style={[styles.pinWrapper, { top: '25%', left: '75%' }]}>
            <View style={[styles.pinOuter, { backgroundColor: colors.pinGreenBg }]}>
              <View style={[styles.pinInner, { backgroundColor: colors.pinGreenFg }]}>
                <Ionicons name="location-outline" size={14} color="#FFF" />
              </View>
            </View>
          </View>

          {/* Zoom Controls */}
          <View style={styles.zoomControls}>
            <TouchableOpacity style={styles.zoomBtn}>
              <Ionicons name="add" size={24} color={colors.textTitle} />
            </TouchableOpacity>
            <View style={styles.zoomDivider} />
            <TouchableOpacity style={styles.zoomBtn}>
              <Ionicons name="remove" size={24} color={colors.textTitle} />
            </TouchableOpacity>
          </View>

        </View>

        {/* Bottom Tabs */}
        <View style={styles.bottomTabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/')}>
            <Ionicons name="home-outline" size={24} color={colors.textLight} />
            <Text style={styles.tabLabel}>Inicio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/map')}>
            <Ionicons name="map-outline" size={24} color={colors.primary} />
            <Text style={[styles.tabLabel, { color: colors.primary }]}>Mapa</Text>
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
  filtersWrapper: {
    backgroundColor: colors.surface,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSub,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#FFF',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  pinWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  pinInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomControls: {
    position: 'absolute',
    top: 20,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
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

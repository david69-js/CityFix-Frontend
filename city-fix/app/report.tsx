import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const colors = {
  primary: '#2065ff',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#EF4444', // Red asterisk
};

const CATEGORIES = [
  { id: '1', name: 'Basura', icon: 'trash-outline' },
  { id: '2', name: 'Baches', icon: 'warning-outline' },
  { id: '3', name: 'Iluminación', icon: 'bulb-outline' },
  { id: '4', name: 'Agua', icon: 'water-outline' },
  { id: '5', name: 'Ruido', icon: 'volume-high-outline' },
  { id: '6', name: 'Seguridad', icon: 'shield-checkmark-outline' },
];

export default function ReportIssueScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textSub} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reportar un problema</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* Category Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Categoría <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.id && styles.categoryCardSelected
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={28}
                      color={selectedCategory === category.id ? colors.primary : colors.textTitle}
                      style={{ marginBottom: 8 }}
                    />
                    <Text style={[
                      styles.categoryName,
                      selectedCategory === category.id && styles.categoryNameSelected
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Issue Title Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Título del problema <Text style={styles.asterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Breve descripción del problema"
                placeholderTextColor={colors.textLight}
              />
            </View>

            {/* Location Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Ubicación <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.locationInputWrapper}>
                <Ionicons name="location-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Dirección o punto de referencia"
                  placeholderTextColor={colors.textLight}
                />
              </View>
              <TouchableOpacity style={styles.useCurrentLocationBtn}>
                <Ionicons name="location-outline" size={16} color={colors.primary} />
                <Text style={styles.useCurrentLocationText}>Usar ubicación actual</Text>
              </TouchableOpacity>
            </View>

            {/* Description Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Proporciona más detalles sobre el problema..."
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Add Photo Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agregar foto</Text>
              <TouchableOpacity style={styles.photoUploadArea}>
                <Ionicons name="camera-outline" size={32} color={colors.textLight} />
                <Text style={styles.photoUploadText}>Toca para subir una foto</Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>Enviar Reporte</Text>
            </TouchableOpacity>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>

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
            <TouchableOpacity style={styles.fabButton}>
              <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
            <Text style={[styles.tabLabel, { marginTop: 4, color: colors.primary }]}>Reportar</Text>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textTitle,
  },
  scrollContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 10,
  },
  asterisk: {
    color: colors.danger,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 3, // 3 columns with 20px padding (x2) and 10px gap between
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EEF4FF',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: colors.textTitle,
    fontWeight: '600',
  },
  categoryNameSelected: {
    color: colors.primary,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textTitle,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textTitle,
  },
  useCurrentLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  useCurrentLocationText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  photoUploadArea: {
    borderWidth: 2,
    borderColor: '#D1D5DB', // Slightly darker dashed border
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  photoUploadText: {
    marginTop: 12,
    color: colors.textSub,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
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

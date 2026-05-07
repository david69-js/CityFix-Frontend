import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import apiClient from '../src/api/axios';

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
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Intenta enviar los datos al backend (si el endpoint existe)
      const response = await apiClient.put('/auth/profile', {
        first_name: firstName,
        last_name: lastName,
        phone: phone
      });
      // Si funciona, actualiza el estado
      if (response.data && response.data.user) {
         setUser(response.data.user);
      } else {
         // Fallback manual si el backend no retorna el usuario
         if(user) setUser({ ...user, first_name: firstName, last_name: lastName, phone: phone });
      }
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      router.back();
    } catch (error) {
      console.warn("Falló la actualización desde el API, actualizando sólo localmente", error);
      // Fallback update local state so UI works anyway
      if(user) setUser({ ...user, first_name: firstName, last_name: lastName, phone: phone });
      Alert.alert("Aviso", "Perfil actualizado localmente (API no lista aún)");
      router.back();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        
        {/* Header */}
        <SafeAreaView style={{ backgroundColor: colors.surface }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textSub} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarArea}>
                  {/* Simulate image placeholder with an icon or blank bg */}
                  <Ionicons name="person" size={60} color="#E5E7EB" style={styles.avatarIconPlaceholder} />
                </View>

                {/* Remove button */}
                <TouchableOpacity style={styles.removePhotoBtn}>
                  <Ionicons name="close" size={16} color="#FFF" />
                </TouchableOpacity>

                {/* Edit Photo button */}
                <TouchableOpacity style={styles.editPhotoBtn}>
                  <Ionicons name="camera-outline" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.avatarHintText}>Haz clic en el ícono de la cámara para cambiar la foto</Text>
            </View>

            {/* Personal Information */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Información Personal</Text>

              {/* First Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Nombre <Text style={styles.asterisk}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="Tu nombre"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

              {/* Last Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Apellido <Text style={styles.asterisk}>*</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Tu apellido"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Número de Teléfono</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="phone" size={18} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Tu teléfono"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

            </View>

            {/* Account Information */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Información de la Cuenta</Text>
              
              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Correo Electrónico</Text>
                <Text 
                  style={[styles.accountValue, { flexShrink: 1, marginLeft: 16, textAlign: 'right' }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {user?.email || 'No registrado'}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>ID de Usuario</Text>
                <Text style={styles.accountValue}>{user?.id?.toString() || '...'}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.accountRow}>
                <Text style={styles.accountLabel}>Miembro Desde</Text>
                <Text style={styles.accountValue}>
                  {user && (user as any).created_at 
                    ? new Date((user as any).created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) 
                    : 'Febrero 2026'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>

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
            <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/report')}>
              <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
            <Text style={[styles.tabLabel, { marginTop: 4 }]}>Reportar</Text>
          </View>

          <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/profile')}>
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
    </View>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    marginBottom: 12,
  },
  avatarArea: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1C1C1E', // Very dark color like in the screenshot
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarIconPlaceholder: {
    opacity: 0.5,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.danger,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  editPhotoBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHintText: {
    fontSize: 13,
    color: colors.textSub,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textTitle,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 8,
  },
  asterisk: {
    color: colors.danger,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textTitle,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  accountLabel: {
    fontSize: 14,
    color: colors.textSub,
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textTitle,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  actionButtonsContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6', // Light gray background
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.textSub,
    fontSize: 16,
    fontWeight: 'bold',
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

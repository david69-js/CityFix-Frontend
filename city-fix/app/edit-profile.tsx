import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useThemeStore } from '../src/store/themeStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../src/api/axios';
import { fixImageUrl } from '../src/utils/helpers';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  const { toggleTheme, theme } = useThemeStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
      Alert.alert('Error', 'Hubo un problema al acceder a la cámara o galería.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      
      // Añadir datos de texto
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('phone', phone || '');
      
      // Añadir la foto si existe una nueva
      if (newAvatarUri) {
        const filename = newAvatarUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('avatar', {
          uri: newAvatarUri,
          name: filename,
          type,
        } as any);
      }

      // Enviar todo en una sola petición multipart
      const response = await apiClient.post('/user/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.user) {
        setUser(response.data.user);
      }

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      router.back();
    } catch (error: any) {
      console.error("Update error:", error?.response?.data || error.message);
      Alert.alert("Error", "No se pudieron guardar los cambios. Verifica tu conexión.");
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
                  {newAvatarUri ? (
                    <Image source={{ uri: newAvatarUri }} style={styles.avatarImage} />
                  ) : user?.avatar ? (
                    <Image source={{ uri: fixImageUrl(user.avatar) }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="person" size={60} color="#E5E7EB" />
                  )}
                </View>

                {/* Remove button (Only if there's a photo) */}
                {(newAvatarUri || user?.avatar) && (
                  <TouchableOpacity 
                    style={styles.removePhotoBtn} 
                    onPress={() => {
                      setNewAvatarUri(null);
                    }}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}

                {/* Edit Photo button */}
                <TouchableOpacity style={styles.editPhotoBtn} onPress={handlePickAvatar}>
                  <Ionicons name="camera-outline" size={18} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.avatarHintText}>Toca el ícono de la cámara para cambiar la foto</Text>
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

              <View style={styles.divider} />

              <View style={styles.accountRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="moon-outline" size={20} color={colors.textSub} style={{ marginRight: 8 }} />
                  <Text style={styles.accountLabel}>Modo Oscuro</Text>
                </View>
                <TouchableOpacity 
                  style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}
                  onPress={toggleTheme}
                >
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFF' }}>
                    {theme === 'dark' ? 'Desactivar' : 'Activar'}
                  </Text>
                </TouchableOpacity>
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

        <BottomTabBar activeTab="profile" />

      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.border, // Dynamic background
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
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
    borderWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: colors.textLight, // Using Sage Green for contrast
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

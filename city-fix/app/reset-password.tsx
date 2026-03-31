import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  primary: '#1D4ED8',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#D1D5DB',
  success: '#10B981',
};

export default function ResetPasswordScreen() {
  const router = useRouter();
  
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSavePassword = () => {
    if (!token || !newPassword || newPassword !== confirmPassword) return;
    
    setIsSaving(true);
    // Simulate backend API call
    setTimeout(() => {
      setIsSaving(false);
      setSuccess(true);
      
      // Auto-redirect to login after short delay
      setTimeout(() => {
        router.replace('/login');
      }, 2000);
      
    }, 1500);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/forgot-password');
    }
  };

  const isFormValid = token.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton} disabled={success}>
          <Ionicons name="arrow-back" size={24} color={colors.textTitle} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerTextContainer}>
            <View style={[styles.iconCircle, success && styles.iconCircleSuccess]}>
              <Ionicons name={success ? "checkmark-circle" : "shield-checkmark-outline"} size={32} color={success ? colors.success : colors.primary} />
            </View>
            <Text style={styles.title}>{success ? '¡Contraseña Actualizada!' : 'Crear Nueva Contraseña'}</Text>
            <Text style={styles.subtitle}>
              {success 
                ? 'Tu contraseña ha sido cambiada exitosamente. Redirigiendo al inicio de sesión...' 
                : 'Ingresa el código que enviamos a tu correo y tu nueva contraseña.'}
            </Text>
          </View>

          {!success && (
            <View style={styles.formContainer}>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Código de Verificación</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="keypad-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Escribe el código de 6 dígitos"
                    keyboardType="default"
                    autoCapitalize="characters"
                    value={token}
                    onChangeText={setToken}
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nueva Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Mínimo 8 caracteres"
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholderTextColor={colors.textLight}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                <View style={[
                  styles.inputWrapper, 
                  (confirmPassword.length > 0 && newPassword !== confirmPassword) && styles.inputError
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Vuelve a escribir la contraseña"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholderTextColor={colors.textLight}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                  </TouchableOpacity>
                </View>
                {(confirmPassword.length > 0 && newPassword !== confirmPassword) && (
                  <Text style={styles.errorText}>Las contraseñas no coinciden</Text>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, (!isFormValid || isSaving) && styles.disabledButton]} 
                onPress={handleSavePassword} 
                disabled={!isFormValid || isSaving}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {isSaving ? 'Guardando...' : 'Restablecer Contraseña'}
                </Text>
              </TouchableOpacity>
              
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.background },
  iconButton: { padding: 8 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 40 },
  headerTextContainer: { marginBottom: 32, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  iconCircleSuccess: { backgroundColor: '#ECFDF5' },
  title: { fontSize: 24, fontWeight: '800', color: colors.textTitle, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSub, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  formContainer: { marginBottom: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textTitle, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: colors.surface },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 6 },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, color: colors.textTitle },
  eyeIcon: { padding: 8 },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginTop: 10 },
  disabledButton: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

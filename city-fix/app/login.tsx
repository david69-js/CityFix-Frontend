import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLogin } from '../src/hooks/useAuth';

const colors = {
  primary: '#1D4ED8',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#D1D5DB',
  divider: '#E5E7EB',
  error: '#EF4444',
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loginMutation = useLogin();

  const handleAuthAction = () => {
    setErrorMessage('');
    
    if (!email || !password) {
      setErrorMessage('Por favor ingrese su correo y contraseña.');
      return;
    }

    loginMutation.mutate({
      email,
      password,
    }, {
      onSuccess: () => {
        router.replace('/');
      },
      onError: (e: any) => {
        // Handle Laravel validation/authentication error messages
        const data = e?.response?.data;
        if (data?.message) {
          setErrorMessage(data.message);
        } else if (data?.errors) {
          // If laravel returned a validation errors object, pick the first one
          const firstError = Object.values(data.errors)[0] as string[];
          if (firstError && firstError.length > 0) {
            setErrorMessage(firstError[0]);
          } else {
            setErrorMessage('Error de validación.');
          }
        } else {
          setErrorMessage('Credenciales inválidas o error de conexión.');
        }
      }
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textTitle} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para continuar mejorando tu ciudad
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            
            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Address */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="tu.correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Ingresa tu contraseña"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  placeholderTextColor={colors.textLight}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleAuthAction} disabled={loginMutation.isPending}>
              <Text style={styles.primaryButtonText}>{loginMutation.isPending ? 'Iniciando...' : 'Iniciar Sesión'}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O inicia sesión con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-google" size={22} color="#DB4437" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-github" size={22} color="#333" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>GitHub</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>

        {/* Footer Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/create-account')}>
            <Text style={styles.footerLink}>Regístrate gratis</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, backgroundColor: colors.background },
  iconButton: { padding: 8 },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  headerTextContainer: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textTitle, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSub },
  formContainer: { marginBottom: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textTitle, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: colors.surface },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, color: colors.textTitle },
  eyeIcon: { padding: 8 },
  forgotPassword: { alignItems: 'flex-end', marginTop: 12 },
  errorContainer: { flexDirection: 'row', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: colors.error, marginLeft: 8, fontSize: 13, fontWeight: '500', flex: 1 },
  linkText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, marginVertical: 10, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 30 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.divider },
  dividerText: { paddingHorizontal: 16, color: colors.textSub, fontSize: 13 },
  socialContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  socialButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginHorizontal: 5 },
  socialIcon: { marginRight: 8 },
  socialButtonText: { color: colors.textTitle, fontSize: 15, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.background },
  footerText: { fontSize: 14, color: colors.textSub },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '700' }
});

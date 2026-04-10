import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForgotPassword } from '../src/hooks/useAuth';

const colors = {
  primary: '#1D4ED8',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#D1D5DB',
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const forgotPasswordMutation = useForgotPassword();

  const handleSendCode = () => {
    if (!email) return;
    setErrorMessage('');
    
    forgotPasswordMutation.mutate({ email }, {
      onSuccess: () => {
        router.push({ pathname: '/reset-password', params: { email } });
      },
      onError: (e: any) => {
        const data = e?.response?.data;
        if (data?.message) {
          setErrorMessage(data.message);
        } else {
          setErrorMessage('Error al enviar el código de recuperación.');
        }
      }
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
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
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed-outline" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>Recuperar Contraseña</Text>
            <Text style={styles.subtitle}>
              Ingresa tu correo electrónico y te enviaremos un código de seguridad para restablecer tu contraseña.
            </Text>
          </View>

          <View style={styles.formContainer}>
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Email Field */}
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

            <TouchableOpacity 
              style={[styles.primaryButton, !email && styles.disabledButton]} 
              onPress={handleSendCode} 
              disabled={forgotPasswordMutation.isPending || !email}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {forgotPasswordMutation.isPending ? 'Enviando...' : 'Enviar Código de Recuperación'}
              </Text>
            </TouchableOpacity>
          </View>

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
  scrollContent: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },
  headerTextContainer: { marginBottom: 32, alignItems: 'center' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '800', color: colors.textTitle, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: colors.textSub, textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  formContainer: { marginBottom: 20 },
  errorContainer: { flexDirection: 'row', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: '#EF4444', marginLeft: 8, fontSize: 13, fontWeight: '500', flex: 1 },
  inputGroup: { marginBottom: 30 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textTitle, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: colors.surface },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, color: colors.textTitle },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  disabledButton: { backgroundColor: '#93C5FD', shadowOpacity: 0 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});

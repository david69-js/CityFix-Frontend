import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const colors = {
  primary: '#1D4ED8', // Solid blue
  background: '#FAFAFA', 
  surface: '#FFFFFF', 
  textTitle: '#111827', 
  textSub: '#4B5563', 
  textLight: '#9CA3AF', 
  border: '#D1D5DB',
  divider: '#E5E7EB',
};

export default function CreateAccountScreen() {
  const router = useRouter();
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuthAction = () => {
    // Navigate straight to the home page simulating a successful login
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textTitle} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              Únete a miles que están mejorando su ciudad
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            
            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre Completo</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Juan Pérez"
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>

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
                  placeholderTextColor={colors.textLight}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Número de Teléfono <Text style={styles.optionalText}>(Opcional)</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="+1 (555) 000-0000"
                  keyboardType="phone-pad"
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
                  placeholder="Crea una contraseña segura"
                  secureTextEntry={!showPassword}
                  placeholderTextColor={colors.textLight}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helpText}>Debe tener al menos 8 caracteres</Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Vuelve a escribir tu contraseña"
                  secureTextEntry={!showConfirmPassword}
                  placeholderTextColor={colors.textLight}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <View style={styles.termsContainer}>
              <TouchableOpacity 
                style={[styles.checkbox, agreeTerms && styles.checkboxActive]} 
                onPress={() => setAgreeTerms(!agreeTerms)}
                activeOpacity={0.8}
              >
                {agreeTerms && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.linkText}>Términos y Condiciones</Text> y la <Text style={styles.linkText}>Política de Privacidad</Text>
              </Text>
            </View>

            {/* Create Account Button */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleAuthAction}>
              <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O regístrate con</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton} onPress={handleAuthAction}>
                <Ionicons name="logo-google" size={22} color="#DB4437" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} onPress={handleAuthAction}>
                <Ionicons name="logo-github" size={22} color="#333" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>GitHub</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Log In Link */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes una cuenta? </Text>
        <TouchableOpacity onPress={handleAuthAction}>
          <Text style={styles.footerLink}>Iniciar sesión</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: colors.background,
  },
  iconButton: {
    padding: 8,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerTextContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textTitle,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSub,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 8,
  },
  optionalText: {
    color: colors.textLight,
    fontWeight: '400',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: colors.surface,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textTitle,
  },
  eyeIcon: {
    padding: 8,
  },
  helpText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 6,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 30,
    marginTop: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    marginRight: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: colors.textTitle,
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 30,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: colors.textSub,
    fontSize: 13,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 5,
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    color: colors.textTitle,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.background,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSub,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  }
});

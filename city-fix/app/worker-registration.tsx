import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const colors = {
  primary: '#10B981', // Emerald green for workers to differentiate from blue
  background: '#FAFAFA', 
  surface: '#FFFFFF', 
  textTitle: '#111827', 
  textSub: '#4B5563', 
  textLight: '#9CA3AF', 
  border: '#D1D5DB',
  divider: '#E5E7EB',
  error: '#EF4444',
  specialBg: '#ECFDF5', // Light green background for special fields
};

export default function WorkerRegistrationScreen() {
  const router = useRouter();
  const [invitationCode, setInvitationCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Mock verification just for visual flow
  const handleVerifyCode = () => {
    if (invitationCode.trim().length > 3) {
      setCodeVerified(true);
    }
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
            <View style={styles.badgeLabel}>
              <MaterialCommunityIcons name="shield-account-outline" size={16} color={colors.primary} />
              <Text style={styles.badgeText}>Portal de Trabajadores</Text>
            </View>
            <Text style={styles.title}>Registro de Personal</Text>
            <Text style={styles.subtitle}>
              Conéctate a la red del gobierno municipal para empezar a resolver reportes.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formContainer}>
            
            {/* Invitation Code Section */}
            <View style={[styles.codeContainer, codeVerified && styles.codeVerifiedContainer]}>
              <Text style={styles.label}>Código de Invitación Oficial</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name={codeVerified ? "checkmark-circle" : "key-outline"} size={20} color={codeVerified ? colors.primary : colors.textLight} style={styles.inputIcon} />
                <TextInput 
                  style={styles.textInput}
                  placeholder="Ej: MUNI-2026-XYZ"
                  value={invitationCode}
                  onChangeText={(text) => {
                    setInvitationCode(text);
                    if (codeVerified) setCodeVerified(false);
                  }}
                  autoCapitalize="characters"
                  editable={!codeVerified}
                  placeholderTextColor={colors.textLight}
                />
                {!codeVerified && invitationCode.length > 0 && (
                  <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyCode}>
                    <Text style={styles.verifyBtnText}>Validar</Text>
                  </TouchableOpacity>
                )}
              </View>
              {codeVerified ? (
                <Text style={styles.successText}>✓ Código válido. Rol de trabajador asignado.</Text>
              ) : (
                <Text style={styles.helpText}>Necesitas un código proporcionado por tu departamento.</Text>
              )}
            </View>

            {/* Rest of the form - only visible completely or enabled if verified */}
            <View style={{ opacity: codeVerified ? 1 : 0.5 }} pointerEvents={codeVerified ? 'auto' : 'none'}>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.label}>Nombres</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                    <TextInput 
                      style={styles.textInput}
                      placeholder="Juan"
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholderTextColor={colors.textLight}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Apellidos</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput 
                      style={styles.textInput}
                      placeholder="Pérez"
                      value={lastName}
                      onChangeText={setLastName}
                      placeholderTextColor={colors.textLight}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo Institucional o Autorizado</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="trabajador@ciudad.gov"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.textInput}
                    placeholder="Crea una contraseña segura"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    placeholderTextColor={colors.textLight}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textLight} />
                  </TouchableOpacity>
                </View>
              </View>

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

              <View style={styles.termsContainer}>
                <TouchableOpacity 
                  style={[styles.checkbox, agreeTerms && styles.checkboxActive]} 
                  onPress={() => setAgreeTerms(!agreeTerms)}
                  activeOpacity={0.8}
                >
                  {agreeTerms && <Ionicons name="checkmark" size={16} color="#FFF" />}
                </TouchableOpacity>
                <Text style={styles.termsText}>
                  Acepto los lineamientos de privacidad del <Text style={styles.linkText}>Personal de la Ciudad</Text>
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, (!codeVerified || !agreeTerms) && styles.primaryButtonDisabled]} 
                activeOpacity={0.8}
                disabled={!codeVerified || !agreeTerms}
              >
                <Text style={styles.primaryButtonText}>Registrar como Trabajador</Text>
              </TouchableOpacity>

            </View>
            
          </View>
        </ScrollView>
        
        {/* Footer Log In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya eres parte del equipo? </Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.footerLink}>Iniciar sesión</Text>
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
  headerTextContainer: { marginBottom: 28 },
  badgeLabel: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.specialBg, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  badgeText: { color: colors.primary, fontSize: 12, fontWeight: '700', marginLeft: 6 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textTitle, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSub, lineHeight: 22 },
  formContainer: { marginBottom: 20 },
  codeContainer: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24 },
  codeVerifiedContainer: { backgroundColor: colors.specialBg, borderColor: '#A7F3D0' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textTitle, marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, height: 52, backgroundColor: colors.surface },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontSize: 15, color: colors.textTitle },
  verifyBtn: { backgroundColor: colors.textTitle, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  verifyBtnText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  eyeIcon: { padding: 8 },
  helpText: { fontSize: 12, color: colors.textLight, marginTop: 8 },
  successText: { fontSize: 12, color: colors.primary, marginTop: 8, fontWeight: '600' },
  termsContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30, marginTop: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, marginRight: 12, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  termsText: { flex: 1, fontSize: 13, color: colors.textTitle, lineHeight: 20 },
  linkText: { color: colors.primary, fontWeight: '600' },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: 16, borderRadius: 12, alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginBottom: 10 },
  primaryButtonDisabled: { backgroundColor: '#A7F3D0', shadowOpacity: 0 },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 24, borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.background },
  footerText: { fontSize: 14, color: colors.textSub },
  footerLink: { fontSize: 14, color: colors.primary, fontWeight: '700' }
});

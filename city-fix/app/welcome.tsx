import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '../src/hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const handleLogin = () => {
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="location-outline" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>City Fix</Text>
            <Text style={styles.subtitle}>
              Ayuda a mejorar tu ciudad reportando y haciendo seguimiento a los problemas urbanos
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.gridContainer}>

            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="location-outline" size={18} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Reportar Problemas</Text>
              <Text style={styles.featureDesc}>
                Reporta rápidamente problemas de la ciudad en tu vecindario
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="trending-up-outline" size={18} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Seguir Progreso</Text>
              <Text style={styles.featureDesc}>
                Monitorea actualizaciones de estado desde el reporte hasta la resolución
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="people-outline" size={18} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Poder Comunitario</Text>
              <Text style={styles.featureDesc}>
                Únete a otros para mejorar tu comunidad juntos
              </Text>
            </View>

            <View style={styles.featureCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="shield-outline" size={18} color="#FFF" />
              </View>
              <Text style={styles.featureTitle}>Generar Impacto</Text>
              <Text style={styles.featureDesc}>
                Tus reportes ayudan a crear una mejor ciudad para todos
              </Text>
            </View>

          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>10K+</Text>
              <Text style={styles.statLabel}>Usuarios Activos</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumber}>25K+</Text>
              <Text style={styles.statLabel}>Problemas Resueltos</Text>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Actions Section */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/create-account')} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleLogin} activeOpacity={0.8}>
              <Text style={styles.secondaryButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad
            </Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: height * 0.02,
    paddingBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textTitle,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSub,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 11,
    color: colors.textSub,
    lineHeight: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textTitle,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSub,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    opacity: 0.3,
  },
  actionsContainer: {
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
  }
});

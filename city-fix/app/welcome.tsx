import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const colors = {
  primary: '#2065ff', // Bright blue background
  surface: '#FFFFFF',
  textLight: '#E0E7FF',
  divider: 'rgba(255, 255, 255, 0.2)',
  cardBg: 'rgba(255, 255, 255, 0.1)',
  cardBorder: 'rgba(255, 255, 255, 0.2)',
};

export default function WelcomeScreen() {
  const router = useRouter();

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

          <View style={{ flex: 1, minHeight: 20 }} />

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingTop: height * 0.05,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.surface,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.surface,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textLight,
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  featureCard: {
    width: '48%',
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 11,
    color: colors.textLight,
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
    color: colors.surface,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textLight,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.divider,
  },
  actionsContainer: {
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: colors.surface,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.divider,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: colors.surface,
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

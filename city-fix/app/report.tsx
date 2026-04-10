import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCreateIssue } from '../src/hooks/useIssues';

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

// IDs adjusted assuming 1-6 standard, the payload example used category_id: 3.
const CATEGORIES = [
  { id: 1, name: 'Basura', icon: 'trash-outline' },
  { id: 2, name: 'Baches', icon: 'warning-outline' },
  { id: 3, name: 'Iluminación', icon: 'bulb-outline' },
  { id: 4, name: 'Agua', icon: 'water-outline' },
  { id: 5, name: 'Ruido', icon: 'volume-high-outline' },
  { id: 6, name: 'Seguridad', icon: 'shield-checkmark-outline' },
];

export default function ReportIssueScreen() {
  const router = useRouter();
  
  // -- Form State --
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const createIssueMutation = useCreateIssue();

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a la galería para poder enviar evidencia visual.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleFetchLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Se necesitan permisos de ubicación para referenciar tu reporte geográficamente.');
        setIsFetchingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      
      // Auto-fill coordinates if no specific location string is provided to help user
      if (!locationText) {
        setLocationText(`${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`);
      }
    } catch (e) {
      alert('No se pudo obtener la ubicación actual.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleSubmit = () => {
    setErrorMessage('');
    
    // -- Valdiations --
    if (!selectedCategory) return setErrorMessage('Debes seleccionar una categoría.');
    if (!title.trim()) return setErrorMessage('El título es obligatorio.');
    if (!locationText.trim()) return setErrorMessage('La ubicación de referencia es obligatoria.');
    if (latitude === null || longitude === null) {
      return setErrorMessage('Debes obtener tu ubicación en el mapa (botón de ubicación).');
    }

    // Prepare image if selected
    let imageFile = null;
    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      imageFile = {
        uri: imageUri,
        name: filename,
        type,
      };
    }

    // Call API Route
    createIssueMutation.mutate({
      category_id: selectedCategory,
      title,
      description,
      location: locationText,
      latitude,
      longitude,
      image: imageFile,
    }, {
      onSuccess: () => {
        router.replace('/');
      },
      onError: (e: any) => {
        const data = e?.response?.data;
        if (data?.message) {
          setErrorMessage(data.message);
        } else {
          setErrorMessage('Error al enviar el reporte. Por favor inténtalo de nuevo.');
        }
      }
    });
  };

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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

            {/* Error Message */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

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

            {/* Title Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Título del problema <Text style={styles.asterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ej. Bache en la avenida principal..."
                placeholderTextColor={colors.textLight}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Location Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Ubicación (Referencia) <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.locationInputWrapper}>
                <Ionicons name="location-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={styles.locationInput}
                  placeholder="Dirección o referencia"
                  placeholderTextColor={colors.textLight}
                  value={locationText}
                  onChangeText={setLocationText}
                />
              </View>
              
              <TouchableOpacity style={styles.useCurrentLocationBtn} onPress={handleFetchLocation} disabled={isFetchingLocation}>
                {isFetchingLocation ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name={latitude ? "checkmark-circle" : "location-outline"} size={16} color={latitude ? colors.primary : '#F59E0B'} />
                )}
                <Text style={[styles.useCurrentLocationText, latitude && { color: colors.primary }]}>
                  {latitude ? 'Ubicación GPS capturada' : 'Obtener mi ubicación GPS actual *'}
                </Text>
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
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Photo Section */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Agregar foto <Text style={{fontWeight: '400', color: colors.textLight}}>(Opcional, máx 5MB)</Text></Text>
              <TouchableOpacity style={styles.photoUploadArea} onPress={handlePickImage} activeOpacity={0.8}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.uploadedImage} />
                ) : (
                  <>
                    <Ionicons name="image-outline" size={32} color={colors.textLight} />
                    <Text style={styles.photoUploadText}>Tocar para cargar desde la galería</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.submitButton, createIssueMutation.isPending && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={createIssueMutation.isPending}
            >
              {createIssueMutation.isPending ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar Reporte</Text>
              )}
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
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textTitle },
  scrollContent: { padding: 20 },
  errorContainer: { flexDirection: 'row', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: colors.danger, marginLeft: 8, fontSize: 13, fontWeight: '500', flex: 1 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textTitle, marginBottom: 10 },
  asterisk: { color: colors.danger },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { width: (width - 60) / 3, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  categoryCardSelected: { borderColor: colors.primary, backgroundColor: '#EEF4FF' },
  categoryIcon: { fontSize: 24, marginBottom: 8 },
  categoryName: { fontSize: 12, color: colors.textTitle, fontWeight: '600' },
  categoryNameSelected: { color: colors.primary },
  textInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.textTitle },
  textArea: { minHeight: 120, paddingTop: 16 },
  locationInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16 },
  inputIcon: { marginRight: 10 },
  locationInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textTitle },
  useCurrentLocationBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  useCurrentLocationText: { color: '#F59E0B', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  photoUploadArea: { borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 12, height: 160, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, overflow: 'hidden' },
  photoUploadText: { marginTop: 12, color: colors.textSub, fontSize: 14, fontWeight: '500' },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  submitButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  bottomTabBar: { elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10, flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 25, paddingTop: 10, justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%' },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabItemCentral: { alignItems: 'center', justifyContent: 'flex-start', flex: 1, marginTop: -25 },
  tabLabel: { fontSize: 11, color: colors.textLight, fontWeight: '500', marginTop: 4 },
  fabButton: { backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, borderWidth: 4, borderColor: '#FFFFFF' }
});

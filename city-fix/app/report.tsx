import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useCreateIssue } from '../src/hooks/useIssues';
import { useCategories } from '../src/hooks/useCategories';
import { useAuthStore } from '../src/store/authStore';
import { useReverseGeocodeMutation } from '../src/hooks/useMaps';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { getCategoryIcon } from '../src/utils/helpers';

const { width } = Dimensions.get('window');



export default function ReportIssueScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const { user } = useAuthStore();
  
  // -- API Hooks --
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  
  // Filtrar categorías duplicadas por nombre para limpiar la interfaz
  const categories = React.useMemo(() => {
    if (!categoriesData) return [];
    return categoriesData.filter((category, index, self) =>
      index === self.findIndex((t) => t.name === category.name)
    );
  }, [categoriesData]);

  // -- Form State --
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const createIssueMutation = useCreateIssue();
  const reverseGeocodeMutation = useReverseGeocodeMutation();

  const addImages = (newUris: string[]) => {
    setImageUris(prev => {
      const combined = [...prev, ...newUris];
      return combined.slice(0, 5);
    });
  };

  const removeImage = (index: number) => {
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleLaunchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos de cámara para tomar fotos de los problemas.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Imagen muy grande', 'La imagen seleccionada excede los 5MB.');
          return;
        }
        addImages([asset.uri]);
      }
    } catch (error: any) {
      if (error.message.includes('Camera not available')) {
        Alert.alert('Cámara no disponible', 'Parece que estás en un simulador o tu dispositivo no tiene cámara activa.');
      } else {
        Alert.alert('Error', 'Hubo un problema al intentar abrir la cámara.');
      }
      console.warn(error);
    }
  };

  const handleLaunchGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesitan permisos para acceder a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const validAssets = result.assets.filter(
        a => !a.fileSize || a.fileSize <= 5 * 1024 * 1024
      );
      addImages(validAssets.map(a => a.uri));
      if (validAssets.length < result.assets.length) {
        Alert.alert('Algunas imágenes fueron omitidas', 'Las imágenes mayores a 5MB no se incluyeron.');
      }
    }
  };

  const handlePickImage = () => {
    const canAddMore = imageUris.length < 5;
    Alert.alert(
      'Adjuntar evidencia',
      imageUris.length === 0
        ? '¿Deseas tomar una foto nueva o elegir de tu galería?'
        : `Tienes ${imageUris.length}/5 imágenes. ¿Qué deseas hacer?`,
      [
        { text: 'Tomar Foto', onPress: handleLaunchCamera, style: 'default' },
        { text: canAddMore ? 'Elegir de Galería' : 'Elegir de Galería (límite alcanzado)', onPress: canAddMore ? handleLaunchGallery : undefined, style: 'default' },
        ...(imageUris.length > 0 ? [{ text: 'Quitar todas', onPress: () => setImageUris([]), style: 'destructive' as const }] : []),
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
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
      
      // Try to reverse geocode via backend proxy for a human-readable address
      try {
        const result = await reverseGeocodeMutation.mutateAsync({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
        if (result?.results?.[0]?.formatted_address) {
          setLocationText(result.results[0].formatted_address);
        } else {
          // Fallback to raw coordinates
          setLocationText(`${location.coords.latitude.toFixed(5)}, ${location.coords.longitude.toFixed(5)}`);
        }
      } catch (geoError) {
        // Fallback to raw coordinates if reverse geocoding fails
        console.warn('[Report] Reverse geocode failed, using coordinates:', geoError);
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

    // Prepare images if selected
    const imageFiles = imageUris.map(uri => {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      return { uri, name: filename, type };
    });

    // Call API Route
    createIssueMutation.mutate({
      category_id: selectedCategory,
      title,
      description,
      location: locationText,
      latitude,
      longitude,
      images: imageFiles.length > 0 ? imageFiles : undefined,
    }, {
      onSuccess: () => {
        router.replace('/');
      },
      onError: (e: any) => {
        const data = e?.response?.data;
        const status = e?.response?.status;

        if (status === 413) {
          setErrorMessage('Una o más imágenes son demasiado pesadas. Intenta con fotos más pequeñas.');
        } else if (data?.errors) {
          const firstError = Object.values(data.errors).flat()[0];
          setErrorMessage(typeof firstError === 'string' ? firstError : 'Error de validación en las imágenes.');
        } else if (data?.message) {
          setErrorMessage(data.message);
        } else {
          setErrorMessage('Error al enviar el reporte (' + (status || 'Red') + '). Por favor inténtalo de nuevo.');
        }
      }
    });
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
            <Text style={styles.headerTitle}>Reportar un problema</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>

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
                {categoriesLoading ? (
                  <View style={{ width: '100%', padding: 20, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : categories.length === 0 ? (
                  <Text style={{ color: colors.textLight, fontSize: 13 }}>No se encontraron categorías.</Text>
                ) : (
                  categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryCard,
                        selectedCategory === category.id && styles.categoryCardSelected
                      ]}
                      onPress={() => setSelectedCategory(category.id)}
                      activeOpacity={0.7}
                    >
                      <FontAwesome5
                        name={getCategoryIcon(category.icon)}
                        size={22}
                        color={selectedCategory === category.id ? '#FFFFFF' : colors.textTitle}
                        style={{ marginBottom: 8 }}
                      />
                      <Text style={[
                        styles.categoryName,
                        selectedCategory === category.id && styles.categoryNameSelected
                      ]} numberOfLines={1}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
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
              <TouchableOpacity 
                activeOpacity={0.8}
                style={styles.locationInputWrapper}
                onPress={handleFetchLocation}
                disabled={isFetchingLocation}
              >
                <Ionicons name="location-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.locationInput, { pointerEvents: 'none' }]}
                  placeholder="Presiona para obtener ubicación GPS *"
                  placeholderTextColor={colors.textLight}
                  value={locationText}
                  editable={false}
                />
                <View style={styles.gpsIconButton}>
                  {isFetchingLocation ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons 
                      name={latitude ? "locate" : "locate-outline"} 
                      size={22} 
                      color={latitude ? colors.workerGreen : '#F59E0B'} 
                    />
                  )}
                </View>
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
              <Text style={styles.label}>
                Agregar fotos <Text style={{fontWeight: '400', color: colors.textLight}}>(Opcional, hasta 5, máx 5MB c/u)</Text>
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {imageUris.map((uri, index) => (
                  <View key={index} style={styles.thumbnailWrapper}>
                    <Image source={{ uri }} style={styles.thumbnailImage} />
                    <TouchableOpacity
                      style={styles.removeImageBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
                {imageUris.length < 5 && (
                  <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage} activeOpacity={0.7}>
                    <Ionicons name="camera-outline" size={28} color={colors.primary} />
                    <Text style={styles.addImageText}>Agregar</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>

              {imageUris.length === 0 && (
                <TouchableOpacity style={styles.photoUploadArea} onPress={handlePickImage} activeOpacity={0.8}>
                  <Ionicons name="camera-outline" size={32} color={colors.textLight} />
                  <Text style={styles.photoUploadText}>Tocar para tomar foto o elegir de galería</Text>
                </TouchableOpacity>
              )}
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

        <BottomTabBar activeTab="report" />

      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingTop: Platform.OS === 'android' ? 5 : 16, 
    paddingBottom: 16, 
    backgroundColor: colors.surface, 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
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
  categoryCardSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  categoryIcon: { fontSize: 24, marginBottom: 8 },
  categoryName: { fontSize: 12, color: colors.textTitle, fontWeight: '600' },
  categoryNameSelected: { color: '#FFFFFF' },
  textInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: colors.textTitle },
  textArea: { minHeight: 120, paddingTop: 16 },
  locationInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 16 },
  inputIcon: { marginRight: 10 },
  locationInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: colors.textTitle },
  gpsIconButton: { padding: 8, marginRight: -8, justifyContent: 'center', alignItems: 'center' },
  useCurrentLocationBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  useCurrentLocationText: { color: '#F59E0B', fontSize: 13, fontWeight: '600', marginLeft: 6 },
  photoUploadArea: { borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 12, height: 160, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, overflow: 'hidden' },
  photoUploadText: { marginTop: 12, color: colors.textSub, fontSize: 14, fontWeight: '500' },
  uploadedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  thumbnailWrapper: { position: 'relative', marginRight: 10 },
  thumbnailImage: { width: 90, height: 90, borderRadius: 10, backgroundColor: colors.border },
  removeImageBtn: { position: 'absolute', top: -6, right: -6, zIndex: 1 },
  addImageBtn: { width: 90, height: 90, borderRadius: 10, borderWidth: 2, borderColor: colors.primary, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface },
  addImageText: { color: colors.primary, fontSize: 11, fontWeight: '600', marginTop: 4 },
  submitButton: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 20 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 }
});

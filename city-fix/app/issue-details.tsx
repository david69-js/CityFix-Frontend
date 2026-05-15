import React, { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Image, ActivityIndicator, TextInput, Keyboard, Platform, Alert, RefreshControl } from 'react-native';
// import * as ImageManipulator from 'expo-image-manipulator';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useIssueDetails, useIssueHistory, useIssueComments, useAddComment, useToggleUpvote, useUpdateIssueStatus, useWorkers, useAssignWorker, useIssuesFeed, useToggleIssueHidden, useUpdateIssue } from '../src/hooks/useIssues';
import { useCategories } from '../src/hooks/useCategories';
import { formatDate } from '../src/utils/date';
import { useAuthStore } from '../src/store/authStore';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { getCategoryColor, getStatusIcon, fixImageUrl } from '../src/utils/helpers';
// import { generateIssueDetailPDF } from '../src/utils/pdfGenerator';

const { width } = Dimensions.get('window');



export default function IssueDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);
  
  const { data: issue, isLoading, error, refetch: refetchDetails, isFetching } = useIssueDetails(id as string, user?.id);
  const { data: historyData } = useIssueHistory(id as string);
  const { data: commentsData } = useIssueComments(id as string);
  const addCommentMutation = useAddComment();
  const toggleUpvoteMutation = useToggleUpvote();
  const updateStatusMutation = useUpdateIssueStatus();
  const assignWorkerMutation = useAssignWorker();
  const toggleHiddenMutation = useToggleIssueHidden();
  const { data: workers } = useWorkers();
  const { data: feedData } = useIssuesFeed(100);
  const { data: categories } = useCategories();
  const updateIssueMutation = useUpdateIssue();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [newComment, setNewComment] = React.useState('');
  const [selectedWorker, setSelectedWorker] = React.useState<number | null>(null);
  const [assignmentNotes, setAssignmentNotes] = React.useState('');
  // State for manual pull-to-refresh
  const [isManualRefresh, setIsManualRefresh] = React.useState(false);

  const handleRefresh = async () => {
    setIsManualRefresh(true);
    await refetchDetails();
    setIsManualRefresh(false);
  };

  // Editing states
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [editCategoryId, setEditCategoryId] = React.useState<number | null>(null);
  const [editLocation, setEditLocation] = React.useState('');
  const [editLatitude, setEditLatitude] = React.useState<number | null>(null);
  const [editLongitude, setEditLongitude] = React.useState<number | null>(null);
  const [editNewImages, setEditNewImages] = React.useState<any[]>([]);
  const [editDeletedImages, setEditDeletedImages] = React.useState<number[]>([]);
  const [isLocating, setIsLocating] = React.useState(false);

  const scrollRef = React.useRef<ScrollView>(null);
  const commentInputRef = React.useRef<TextInput>(null);

  const isOwner = issue?.user_id === user?.id || issue?.user?.id === user?.id;

  React.useEffect(() => {
    if (issue && !isEditing) {
      setEditTitle(issue.title);
      setEditDescription(issue.description);
      setEditCategoryId(issue.category_id);
      setEditLocation(issue.location);
      setEditLatitude(issue.latitude);
      setEditLongitude(issue.longitude);
      setEditNewImages([]);
      setEditDeletedImages([]);
    }
  }, [issue, isEditing]);

  const getCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permiso de ubicación denegado');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setEditLatitude(location.coords.latitude);
      setEditLongitude(location.coords.longitude);

      const reverse = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (reverse && reverse.length > 0) {
        const addr = reverse[0];
        const readable = `${addr.street || ''} ${addr.streetNumber || ''}, ${addr.city || addr.subregion || ''}`;
        setEditLocation(readable.trim() || `Coord: ${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación actual.');
    } finally {
      setIsLocating(false);
    }
  };
  const handlePickImages = async () => {
    Alert.alert(
      'Añadir Imagen',
      '¿De dónde quieres obtener la imagen?',
      [
        {
          text: 'Cámara',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Error', 'Se requiere permiso para acceder a la cámara');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled) {
              setEditNewImages(prev => [...prev, result.assets[0]]);
            }
          }
        },
        {
          text: 'Galería',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              allowsMultipleSelection: false,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled) {
              setEditNewImages(prev => [...prev, result.assets[0]]);
            }
          }
        },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const toggleDeleteImage = (imageId: number) => {
    setEditDeletedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId) 
        : [...prev, imageId]
    );
  };

  const handleUpdateIssue = async () => {
    if (!issue) return;
    try {
      await updateIssueMutation.mutateAsync({
        issueId: issue.id,
          payload: {
            title: editTitle,
            description: editDescription,
            category_id: editCategoryId || issue.category_id,
            location: editLocation,
            latitude: editLatitude || issue.latitude,
            longitude: editLongitude || issue.longitude,
            images: editNewImages.map(img => {
              const extension = img.uri.split('.').pop()?.toLowerCase();
              return {
                uri: img.uri,
                name: `photo_${Date.now()}.${extension === 'heic' ? 'jpg' : extension}`,
                type: 'image/jpeg',
              };
            }),
            deleted_images: editDeletedImages.length > 0 ? editDeletedImages : undefined,
          }
      });
      setIsEditing(false);
      Alert.alert('Éxito', 'Reporte actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el reporte');
    }
  };

  const handleArchiveIssue = async () => {
    if (!issue) return;
    Alert.alert(
      'Archivar Reporte',
      '¿Estás seguro de que deseas archivar este reporte? Dejará de ser visible en el feed público.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, archivar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await updateIssueMutation.mutateAsync({
                issueId: issue.id,
                payload: { is_hidden: true } as any
              });
              Alert.alert('Archivado', 'El reporte ha sido archivado correctamente.');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'No se pudo archivar el reporte.');
            }
          }
        }
      ]
    );
  };

  const handleAssignWorker = () => {
    if (!issue || !selectedWorker) return;
    assignWorkerMutation.mutate({
      issueId: issue.id,
      workerId: selectedWorker,
      notes: assignmentNotes.trim()
    }, {
      onSuccess: () => {
        setSelectedWorker(null);
        setAssignmentNotes('');
        alert('Trabajador asignado correctamente');
      },
      onError: (e: any) => {
        console.log("Assignment error:", e?.response?.data || e);
        const data = e?.response?.data;
        let errorMsg = data?.message || data?.error || '';
        if (data?.errors) {
          const details = Object.values(data.errors).flat().join('. ');
          if (details) errorMsg += (errorMsg ? ': ' : '') + details;
        }
        alert('Error: ' + (errorMsg || 'No se pudo asignar. Verifique su conexión.'));
      }
    });
  };

  const handleUpdateStatus = (statusId: number) => {
    if (!issue) return;
    updateStatusMutation.mutate({ issueId: issue.id, statusId }, {
      onError: (e: any) => {
        console.log("Status update error:", e?.response?.data || e);
        const data = e?.response?.data;
        alert('Error: ' + (data?.message || data?.error || 'No se pudo actualizar el estado.'));
      }
    });
  };

  const handleToggleUpvote = () => {
    if (!issue) return;
    toggleUpvoteMutation.mutate(issue.id, {
      onError: (e: any) => {
        console.error("Upvote error:", e?.response?.data || e);
        const serverMsg = e?.response?.data?.message || e?.response?.data?.error || e?.message;
        Alert.alert('Error al votar', serverMsg || 'No se pudo procesar tu voto. Verifique su conexión.');
      }
    });
  };

  const scrollToComment = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 300);
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !issue) return;
    try {
      await addCommentMutation.mutateAsync({
        issueId: issue.id,
        comment: newComment.trim(),
      });
      setNewComment('');
      // Invalidation in the hook handles the rest, but we can refetch details for the count
      refetchDetails();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message;
      console.error('Error al publicar comentario:', serverMsg);
      console.error('Respuesta completa del servidor:', JSON.stringify(error?.response?.data));
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textSub }}>Cargando detalles...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !issue) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textLight} />
          <Text style={{ marginTop: 12, fontSize: 16, color: colors.textTitle, fontWeight: 'bold' }}>Error al cargar el reporte</Text>
          <Text style={{ marginTop: 4, textAlign: 'center', color: colors.textSub }}>No pudimos encontrar la información solicitada.</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.commentBtn, { width: '100%', marginTop: 20, marginLeft: 0 }]}>
            <Text style={styles.commentBtnText}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (issue.is_hidden && user?.role_id !== 1 && user?.role_id !== 2) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
          <Ionicons name="eye-off-outline" size={80} color={colors.textLight} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 20, color: colors.textTitle, fontWeight: 'bold', marginBottom: 8 }}>Reporte Archivado</Text>
          <Text style={{ textAlign: 'center', color: colors.textSub, fontSize: 15, lineHeight: 22 }}>
            Este reporte ha sido archivado por un administrador y ya no está disponible para el público.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.commentBtn, { width: '100%', marginTop: 32, marginLeft: 0 }]}>
            <Text style={styles.commentBtnText}>Regresar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const allImages = issue.images?.map(img => ({ url: fixImageUrl(img.full_url || img.image_url), id: img.id })) || [];

  return (
    <View style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        
        {/* Header */}
        <SafeAreaView style={{ backgroundColor: colors.surface }}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textTitle} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalles del Reporte</Text>
            <View style={{ flexDirection: 'row' }}>
              {isOwner && (
                <TouchableOpacity 
                  onPress={() => isEditing ? handleUpdateIssue() : setIsEditing(true)} 
                  style={[styles.iconButton, { marginRight: 8 }]}
                >
                  <Ionicons 
                    name={isEditing ? "save-outline" : "create-outline"} 
                    size={24} 
                    color={isEditing ? colors.workerGreen : colors.textTitle} 
                  />
                </TouchableOpacity>
              )}
              {isEditing ? (
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.iconButton}>
                  <Ionicons name="close-outline" size={24} color={colors.danger} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons name="share-social-outline" size={24} color={colors.textTitle} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>

        <ScrollView 
          ref={scrollRef}
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={isManualRefresh} onRefresh={handleRefresh} tintColor={colors.primary} />
          }
        >
          
          {/* Image Carousel */}
          <View>
            {allImages.length > 0 ? (
              <>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setActiveImageIndex(index);
                  }}
                >
                  {allImages.map((img, idx) => (
                    <TouchableOpacity
                      key={img.id || idx}
                      disabled={!isEditing}
                      onPress={handlePickImages}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={{ uri: img.url }}
                        style={[styles.heroImage, { width }]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {allImages.length > 1 && (
                  <View style={styles.dotsContainer}>
                    {allImages.map((_, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.dot,
                          idx === activeImageIndex && styles.dotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={[styles.heroImage, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={48} color={colors.textLight} />
                <Text style={{ color: colors.textLight, marginTop: 8 }}>Sin imagen adjunta</Text>
              </View>
            )}

            {isEditing && (
              <TouchableOpacity style={styles.editImageOverlay} onPress={handlePickImages}>
                <View style={styles.editImageCircle}>
                  <Ionicons name="camera" size={32} color="#FFF" />
                  <Text style={styles.editImageText}>Toca para añadir fotos</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contentPadding}>
            
            {/* Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: (issue.status?.color || colors.primary) + '15' }]}>
              <Ionicons name={getStatusIcon(issue.status?.name || '') as any} size={24} color={issue.status?.color || colors.primary} style={styles.statusBannerIcon} />
              <View style={styles.statusBannerTextContainer}>
                <Text style={[styles.statusBannerTitle, { color: issue.status?.color || colors.primary }]}>{issue.status?.name || 'Pendiente'}</Text>
                <Text style={[styles.statusBannerSub, { color: colors.textSub }]}>Estado actual de este reporte ciudadano</Text>
              </View>
            </View>

            {/* Quick Status Update for Workers and Admins */}
            {(user?.role_id === 1 || user?.role_id === 2) && (
              <View style={styles.adminActionContainer}>
                <Text style={styles.adminActionLabel}>Actualizar Estado (Gestión):</Text>
                <View style={styles.statusButtonsRow}>
                  <TouchableOpacity 
                    style={[styles.statusQuickBtn, { backgroundColor: colors.surface, borderColor: '#F59E0B' }]}
                    onPress={() => handleUpdateStatus(1)}
                  >
                    <Ionicons name="time-outline" size={14} color="#F59E0B" />
                    <Text style={[styles.statusQuickBtnText, { color: '#F59E0B' }]}>Pendiente</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statusQuickBtn, { backgroundColor: colors.surface, borderColor: '#3B82F6' }]}
                    onPress={() => handleUpdateStatus(2)}
                  >
                    <Ionicons name="construct-outline" size={14} color="#3B82F6" />
                    <Text style={[styles.statusQuickBtnText, { color: '#3B82F6' }]}>En Progreso</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.statusQuickBtn, { backgroundColor: colors.surface, borderColor: '#10B981' }]}
                    onPress={() => handleUpdateStatus(3)}
                  >
                    <Ionicons name="checkmark-circle-outline" size={14} color="#10B981" />
                    <Text style={[styles.statusQuickBtnText, { color: '#10B981' }]}>Resuelto</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Separator if both sections are present */}
            {user?.role_id === 1 && (
              <View style={[styles.divider, { marginVertical: 10, backgroundColor: colors.border }]} />
            )}

            {/* Admin Action: Assign Worker */}
            {user?.role_id === 1 && (
              <View style={[styles.adminActionContainer, { borderColor: colors.primary, borderWidth: 1 }]}>
                <Text style={styles.adminActionLabel}>Asignar a Trabajador:</Text>
                
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {workers && workers.length > 0 ? (
                    workers.map((worker: any) => (
                      <TouchableOpacity
                        key={worker.id}
                        style={[
                          styles.workerSelectBtn,
                          selectedWorker === worker.id && styles.workerSelectBtnActive
                        ]}
                        onPress={() => setSelectedWorker(worker.id)}
                      >
                        <Ionicons 
                          name="person-circle-outline" 
                          size={20} 
                          color={selectedWorker === worker.id ? '#FFF' : colors.primary} 
                        />
                        <Text style={[
                          styles.workerSelectText,
                          selectedWorker === worker.id && { color: '#FFF' }
                        ]}>
                          {worker.first_name} {worker.last_name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={{ padding: 10 }}>
                      <Text style={{ color: colors.textSub, fontStyle: 'italic' }}>No hay trabajadores registrados con el rol correspondiente.</Text>
                    </View>
                  )}
                </ScrollView>

                <TextInput
                  style={styles.assignmentNotesInput}
                  placeholder="Notas adicionales para el trabajador..."
                  value={assignmentNotes}
                  onChangeText={setAssignmentNotes}
                  multiline
                  placeholderTextColor={colors.textLight}
                />

                <TouchableOpacity 
                  style={[
                    styles.assignWorkerBtn,
                    (!selectedWorker || assignWorkerMutation.isPending) && styles.assignWorkerBtnDisabled
                  ]}
                  onPress={handleAssignWorker}
                  disabled={!selectedWorker || assignWorkerMutation.isPending}
                >
                  {assignWorkerMutation.isPending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={16} color="#FFF" />
                      <Text style={styles.assignWorkerBtnText}>Enviar Asignación</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}



            {/* Title & Tag */}
            <View style={styles.titleRow}>
              {isEditing ? (
                <TextInput
                  style={[styles.issueTitle, styles.editInput]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Título del reporte"
                  placeholderTextColor={colors.textLight}
                />
              ) : (
                <Text style={styles.issueTitle}>{issue.title}</Text>
              )}
              
              {!isEditing && (
                <View style={[styles.categoryTag, { backgroundColor: getCategoryColor(issue.category?.name || '', colors) }]}>
                  <Text style={styles.categoryTagText}>{issue.category?.name || 'General'}</Text>
                </View>
              )}
            </View>

            {/* Category Selector in Edit Mode - REDESIGN */}
            {isEditing && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.adminActionLabel, { marginBottom: 10 }]}>Gestionar Imágenes:</Text>
                
                {/* Current Images */}
                <Text style={{ fontSize: 12, color: colors.textSub, marginBottom: 8 }}>Imágenes actuales (toca para eliminar/restaurar):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {issue.images?.map((img) => (
                    <TouchableOpacity 
                      key={img.id} 
                      onPress={() => toggleDeleteImage(img.id)}
                      style={[
                        styles.editImageThumbnail, 
                        editDeletedImages.includes(img.id) && styles.editImageThumbnailDeleted
                      ]}
                    >
                      <Image source={{ uri: fixImageUrl(img.full_url || img.image_url) ?? '' }} style={styles.thumbnailImg} />
                      {editDeletedImages.includes(img.id) && (
                        <View style={styles.deletedOverlay}>
                          <Ionicons name="trash" size={24} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* New Images */}
                <Text style={{ fontSize: 12, color: colors.textSub, marginBottom: 8 }}>Nuevas imágenes:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {editNewImages.map((img, idx) => (
                    <View key={idx} style={styles.editImageThumbnail}>
                      <Image source={{ uri: img.uri }} style={styles.thumbnailImg} />
                      <TouchableOpacity 
                        style={styles.removeNewImageBtn} 
                        onPress={() => setEditNewImages(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImages}>
                    <Ionicons name="camera" size={24} color={colors.primary} />
                    <Text style={styles.addImageBtnText}>Añadir</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {isEditing && (
              <View style={{ marginBottom: 20 }}>
                <Text style={[styles.adminActionLabel, { marginBottom: 10 }]}>Seleccionar Categoría:</Text>
                <View style={styles.categoryGrid}>
                  {categories?.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryPill,
                        editCategoryId === cat.id && { backgroundColor: getCategoryColor(cat.name, colors), borderColor: getCategoryColor(cat.name, colors) }
                      ]}
                      onPress={() => setEditCategoryId(cat.id)}
                    >
                      <Text style={[
                        styles.categoryPillText,
                        editCategoryId === cat.id && { color: '#FFF' }
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Description */}
            {isEditing ? (
              <TextInput
                style={[styles.descriptionText, styles.editInput, { minHeight: 100, textAlignVertical: 'top' }]}
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Descripción detallada..."
                placeholderTextColor={colors.textLight}
                multiline
              />
            ) : (
              <Text style={styles.descriptionText}>
                {issue.description || 'Sin descripción adicional proporcionada.'}
              </Text>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={22} color={colors.textLight} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Ubicación</Text>
                  {isEditing ? (
                    <View>
                      <TextInput
                        style={[styles.infoValue, styles.editInput, { marginTop: 4, width: '100%' }]}
                        value={editLocation}
                        onChangeText={setEditLocation}
                        placeholder="Dirección o punto de referencia"
                        placeholderTextColor={colors.textLight}
                      />
                      <TouchableOpacity 
                        style={styles.gpsButton} 
                        onPress={getCurrentLocation}
                        disabled={isLocating}
                      >
                        {isLocating ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Ionicons name="navigate" size={16} color={colors.primary} />
                            <Text style={styles.gpsButtonText}>Usar mi ubicación actual (GPS)</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      {(editLatitude !== null && editLongitude !== null) && (
                        <Text style={styles.coordinatesText}>
                          Lat: {Number(editLatitude).toFixed(6)}, Lon: {Number(editLongitude).toFixed(6)}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>{issue.location}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={22} color={colors.textLight} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Reportado el</Text>
                  <Text style={styles.infoValue}>{formatDate(issue.created_at)}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={22} color={colors.textLight} style={styles.infoIcon} />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Reportado por</Text>
                  <Text style={styles.infoValue}>
                    {issue.user ? `${issue.user.first_name} ${issue.user.last_name || ''}` : 'Ciudadano Anónimo'}
                  </Text>
                </View>
              </View>

              {issue.assigned_worker && (
                <View style={[styles.infoRow, { marginBottom: 0 }]}>
                  <Ionicons name="construct-outline" size={22} color={colors.workerGreen} style={styles.infoIcon} />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Trabajador Asignado</Text>
                    <Text style={[styles.infoValue, { color: colors.workerGreen, fontWeight: '700' }]}>
                      {issue.assigned_worker.first_name} {issue.assigned_worker.last_name}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={[
                  styles.voteBtn, 
                  toggleUpvoteMutation.isPending && styles.voteBtnDisabled,
                  issue?.has_voted && styles.voteBtnActive
                ]}
                onPress={handleToggleUpvote}
                disabled={toggleUpvoteMutation.isPending}
              >
                {toggleUpvoteMutation.isPending ? (
                  <ActivityIndicator color={issue?.has_voted ? '#FFF' : colors.primary} size="small" />
                ) : (
                  <>
                    <Ionicons 
                      name={issue?.has_voted ? "thumbs-up" : "thumbs-up-outline"} 
                      size={18} 
                      color={issue?.has_voted || colors.primary === '#364461' ? '#FFF' : colors.primary} 
                      style={styles.btnIcon} 
                    />
                    <Text style={[styles.voteBtnText, issue?.has_voted && styles.voteBtnTextActive]}>
                      {issue?.has_voted ? '¡Votado!' : 'Voto'} ({issue?.upvotes_count || 0})
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.commentBtn} onPress={scrollToComment}>
                <Ionicons name="chatbubble-outline" size={18} color={colors.textTitle} style={styles.btnIcon} />
                <Text style={styles.commentBtnText}>Comentar ({issue.comments_count || 0})</Text>
              </TouchableOpacity>
            </View>

            {/* Comentarios */}
            <Text style={styles.sectionTitle}>Comentarios ({issue.comments_count || commentsData?.length || 0})</Text>
            {commentsData && commentsData.length > 0 ? (
              <View style={styles.commentsContainer}>
                {commentsData.map(comment => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Image 
                        source={{ 
                          uri: fixImageUrl(comment.user?.avatar_url || comment.user?.avatar) || 
                               `https://ui-avatars.com/api/?name=${comment.user?.first_name || 'U'}+${comment.user?.last_name || ''}&background=random&color=fff` 
                        }} 
                        style={styles.commentAvatar} 
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.commentUser}>{comment.user?.first_name} {comment.user?.last_name}</Text>
                        <Text style={styles.commentTime}>{formatDate(comment.created_at)}</Text>
                      </View>
                    </View>
                    <Text style={styles.commentText}>{comment.comment}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardText}>Aún no hay comentarios. Sé el primero.</Text>
              </View>
            )}

            {/* Añadir Comentario */}
            <View style={styles.addCommentContainer}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                placeholder="Escribe un comentario..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity 
                style={[styles.submitCommentBtn, (!newComment.trim() || addCommentMutation.isPending) && styles.submitCommentBtnDisabled]}
                onPress={handleCommentSubmit}
                disabled={!newComment.trim() || addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitCommentBtnText}>Enviar Comentario</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Timeline (Dynamic) */}
            <Text style={styles.sectionTitle}>Línea de Tiempo de Actualizaciones</Text>
            
            <View style={styles.timelineContainer}>
              {/* Start Node */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineNodeContainer}>
                  <View style={[styles.timelineDot, { backgroundColor: colors.orangeDot }]} />
                  <View style={[styles.timelineLine, { backgroundColor: historyData?.history?.length > 0 ? colors.timelineLine : 'transparent' }]} />
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Reporte creado correctamente</Text>
                  <Text style={styles.timelineTime}>{formatDate(issue.created_at)}</Text>
                </View>
              </View>

              {/* History Nodes */}
              {historyData?.history?.map((log: any, index: number) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineNodeContainer}>
                    <View style={[styles.timelineDot, { backgroundColor: log.status.toLowerCase().includes('resuelto') ? '#10B981' : colors.blueDot }]} />
                    <View style={[styles.timelineLine, { backgroundColor: index === historyData.history.length - 1 ? 'transparent' : colors.timelineLine }]} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{log.status} - {log.changed_by}</Text>
                    <Text style={styles.timelineTime}>{formatDate(log.changed_at)} • Hace {log.time_since_last_change}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Archive Action (Exclusive for Owner or Admin) */}
            {(isOwner || user?.role_id === 1) && (
              <View style={{ marginTop: 20, marginBottom: 20 }}>
                <TouchableOpacity
                  style={[
                    styles.archiveBtn, 
                    issue?.is_hidden && styles.archiveBtnActive,
                    updateIssueMutation.isPending && { opacity: 0.7 }
                  ]}
                  onPress={handleArchiveIssue}
                >
                  <Ionicons 
                    name={issue?.is_hidden ? "eye-outline" : "archive-outline"} 
                    size={20} 
                    color="#FFF" 
                  />
                  <Text style={styles.archiveBtnText}>
                    {issue?.is_hidden ? "Restaurar Reporte" : "Archivar Reporte"}
                  </Text>
                </TouchableOpacity>
                {issue?.is_hidden && (
                  <Text style={styles.archiveReasonText}>
                    Este reporte está actualmente oculto del feed público.
                  </Text>
                )}
              </View>
            )}

            {/* Export PDF Button disabled by user request */}

            {/* Similar Issues (Functional) */}
            <Text style={styles.sectionTitle}>Problemas Similares Cercanos</Text>
            {(() => {
              const allIssues = feedData?.data || [];
              
              if (!issue.latitude || !issue.longitude) return (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>Ubicación no disponible para este reporte</Text>
                </View>
              );

              // Helper function to calculate distance in km (Haversine formula)
              const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
                const R = 6371; // Earth radius in km
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                return R * c;
              };

              const nearbyIssues = allIssues.filter(item => {
                // Skip current issue
                if (item.id === issue.id) return false;
                // Skip issues without coords
                if (!item.latitude || !item.longitude) return false;
                
                const dist = getDistance(
                  Number(issue.latitude), Number(issue.longitude),
                  Number(item.latitude), Number(item.longitude)
                );
                
                // Within 1km and same category
                return dist < 1.0 && item.category_id === issue.category_id;
              }).slice(0, 5);

              if (nearbyIssues.length === 0) return (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>No hay problemas similares reportados en un radio de 1km</Text>
                </View>
              );

              return (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nearbyContainer}>
                  {nearbyIssues.map((item) => (
                    <TouchableOpacity 
                      key={item.id} 
                      style={styles.nearbyCard}
                      onPress={() => router.push({ pathname: '/issue-details', params: { id: item.id } })}
                    >
                      <Image 
                        source={{ uri: fixImageUrl(item.images?.[0]?.full_url) || 'https://via.placeholder.com/150' }} 
                        style={styles.nearbyImage} 
                      />
                      <View style={styles.nearbyDetails}>
                        <Text style={styles.nearbyTitle} numberOfLines={1}>{item.title}</Text>
                        <View style={styles.nearbyMeta}>
                          <Ionicons name="location-outline" size={12} color={colors.textLight} />
                          <Text style={styles.nearbyDistance}>
                            {getDistance(Number(issue.latitude), Number(issue.longitude), Number(item.latitude), Number(item.longitude)).toFixed(2)} km
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              );
            })()}

          </View>
          <View style={{ height: 100 }} />
        </ScrollView>

        <BottomTabBar activeTab="none" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 25 : 14,
    paddingBottom: 14,
    backgroundColor: colors.surface,
  },
  iconButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textTitle,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroImage: {
    width: '100%',
    height: 220,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contentPadding: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusBanner: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusBannerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  statusBannerTextContainer: {
    flex: 1,
  },
  statusBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusBannerSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textTitle,
    flex: 1,
    marginRight: 12,
  },
  categoryTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  categoryTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  descriptionText: {
    fontSize: 15,
    color: colors.textSub,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: colors.textTitle,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  voteBtn: {
    flex: 1,
    backgroundColor: colors.buttonBlueBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginRight: 8,
  },
  voteBtnDisabled: {
    opacity: 0.7,
  },
  voteBtnActive: {
    backgroundColor: colors.orangeHero,
  },
  btnIcon: {
    marginRight: 8,
  },
  voteBtnText: {
    color: colors.primary === '#364461' ? '#FFF' : colors.primary, // White in Dark Mode
    fontWeight: '700',
    fontSize: 15,
  },
  voteBtnTextActive: {
    color: '#FFF',
  },
  commentBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentBtnText: {
    color: colors.textTitle,
    fontWeight: '700',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 16,
  },
  timelineContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineNodeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    height: 50,
    backgroundColor: colors.timelineLine,
    marginTop: -2, 
    marginBottom: -2, 
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textTitle,
    marginBottom: 4,
  },
  timelineTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  commentsContainer: {
    marginBottom: 20,
  },
  commentItem: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: colors.border,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textTitle,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  commentText: {
    fontSize: 14,
    color: colors.textSub,
    lineHeight: 20,
  },
  addCommentContainer: {
    flexDirection: 'column',
    marginBottom: 30,
  },
  commentInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 15,
    color: colors.textTitle,
    marginBottom: 12,
  },
  submitCommentBtn: {
    backgroundColor: colors.orangeHero,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitCommentBtnDisabled: {
    opacity: 0.5,
  },
  submitCommentBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  nearbyContainer: {
    marginBottom: 20,
  },
  nearbyCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    width: width - 40,
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  nearbyImage: {
    width: '100%',
    height: 140,
    backgroundColor: colors.border,
  },
  nearbyDetails: {
    padding: 10,
  },
  nearbyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textTitle,
    marginBottom: 4,
  },
  nearbyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyDistance: {
    fontSize: 11,
    color: colors.textLight,
    marginLeft: 4,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 40,
  },
  emptyCardText: {
    fontSize: 13,
    color: colors.textSub,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 20,
  },
  adminActionContainer: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminActionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSub,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusQuickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statusQuickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  workerSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  workerSelectBtnActive: {
    backgroundColor: colors.primary,
  },
  workerSelectText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 6,
  },
  assignmentNotesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
    color: colors.textTitle,
  },
  assignWorkerBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  assignWorkerBtnDisabled: {
    opacity: 0.5,
  },
  assignWorkerBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  pdfButtonDisabled: {
    opacity: 0.6,
  },
  pdfButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  archiveBtn: {
    backgroundColor: '#6B7280',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  archiveBtnActive: {
    backgroundColor: '#10B981',
  },
  archiveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  archiveReasonText: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    color: colors.textTitle,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSub,
  },
  editImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageCircle: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    borderRadius: 50,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  editImageText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  gpsButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  coordinatesText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
  },
  editImageThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  editImageThumbnailDeleted: {
    borderColor: colors.error,
    opacity: 0.6,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  deletedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(239, 68, 68, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeNewImageBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageBtnText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
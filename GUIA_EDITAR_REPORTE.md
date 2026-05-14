# Editar Reporte (Issue)

El backend expone dos endpoints para editar un reporte:

| Endpoint | Método | Quién puede usarlo |
|---|---|---|
| `/api/issues/{issue}` | PUT | Dueño del reporte o Admin |
| `/api/admin/issues/{issue}` | PUT | Solo Admin |

Ambos aceptan los mismos campos + manejo de imágenes.

---

## 1. Tipos — `types/api.ts`

Actualizar `IssueImage` para que coincida con el backend:

```typescript
export interface IssueImage {
  id: number;
  issue_id: number;
  image_url: string;    // ← cambiar de file_path a image_url
  full_url: string;
}
```

Agregar el payload de actualización:

```typescript
export interface UpdateIssuePayload {
  title?: string;
  description?: string;
  category_id?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  status_id?: number;
  images?: (string | { uri: string; name: string; type: string })[];
  deleted_images?: number[];
}
```

---

## 2. Hook — `hooks/useIssues.ts`

### Para el dueño del reporte (o Admin):

```typescript
export const useUpdateIssue = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: async ({
      issueId,
      payload,
    }: {
      issueId: number;
      payload: UpdateIssuePayload;
    }) => {
      const formData = new FormData();

      // Campos escalares
      if (payload.title !== undefined) formData.append('title', payload.title);
      if (payload.description !== undefined) formData.append('description', payload.description);
      if (payload.category_id !== undefined) formData.append('category_id', String(payload.category_id));
      if (payload.location !== undefined) formData.append('location', payload.location);
      if (payload.latitude !== undefined) formData.append('latitude', String(payload.latitude));
      if (payload.longitude !== undefined) formData.append('longitude', String(payload.longitude));
      if (payload.status_id !== undefined) formData.append('status_id', String(payload.status_id));

      // Imágenes nuevas (archivos)
      if (payload.images) {
        payload.images.forEach((img, index) => {
          if (typeof img === 'object' && img.uri) {
            formData.append(`images[${index}]`, {
              uri: img.uri,
              type: img.type || 'image/jpeg',
              name: img.name || `photo_${index}.jpg`,
            } as any);
          }
        });
      }

      // IDs de imágenes a eliminar
      if (payload.deleted_images && payload.deleted_images.length > 0) {
        payload.deleted_images.forEach((id, index) => {
          formData.append(`deleted_images[${index}]`, String(id));
        });
      }

      const response = await apiClient.put(`/issues/${issueId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    },
    onSuccess: (_, { issueId }) => {
      const idStr = String(issueId);
      queryClient.invalidateQueries({ queryKey: ['issues', 'details', idStr] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'feed'] });
      queryClient.invalidateQueries({ queryKey: ['issues', 'my-issues'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'issues'] });
    },
  });
};
```

### Para Admin (ruta separada):

```typescript
export const useAdminUpdateIssue = () => {
  // ... ya existe en useIssues.ts, actualizar para que también acepte imágenes
  // Cambiar AdminUpdateIssuePayload para incluir images y deleted_images
};
```

Actualizar la interface existente:

```typescript
export interface AdminUpdateIssuePayload extends UpdateIssuePayload {}
```

---

## 3. UI — Componente de ejemplo

```tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, Alert, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateIssue, useIssueDetails } from '../hooks/useIssues';

interface Props {
  issueId: number;
  onClose: () => void;
}

export const EditIssueForm = ({ issueId, onClose }: Props) => {
  const { data: issue } = useIssueDetails(issueId);
  const updateMutation = useUpdateIssue();

  const [title, setTitle] = useState(issue?.title ?? '');
  const [description, setDescription] = useState(issue?.description ?? '');
  const [newImages, setNewImages] = useState<any[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setNewImages(prev => [...prev, ...result.assets]);
    }
  };

  const removeExistingImage = (imageId: number) => {
    setDeletedImages(prev => [...prev, imageId]);
  };

  const handleSubmit = async () => {
    try {
      await updateMutation.mutateAsync({
        issueId,
        payload: {
          title: title !== issue?.title ? title : undefined,
          description: description !== issue?.description ? description : undefined,
          images: newImages.map(img => ({
            uri: img.uri || img.localUri,
            name: img.fileName || `photo.jpg`,
            type: img.mimeType || 'image/jpeg',
          })),
          deleted_images: deletedImages.length > 0 ? deletedImages : undefined,
        },
      });
      Alert.alert('Listo', 'Reporte actualizado correctamente.');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'No se pudo actualizar.');
    }
  };

  // Mostrar imágenes actuales con opción de eliminar
  const currentImages = (issue?.images ?? []).filter(
    img => !deletedImages.includes(img.id)
  );

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text>Título</Text>
      <TextInput value={title} onChangeText={setTitle} style={styles.input} />

      <Text>Descripción</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        multiline
        style={[styles.input, { height: 100 }]}
      />

      {/* Imágenes actuales */}
      <Text>Imágenes actuales:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {currentImages.map(img => (
          <View key={img.id} style={{ position: 'relative' }}>
            <Image
              source={{ uri: img.full_url }}
              style={{ width: 80, height: 80, margin: 4 }}
            />
            <TouchableOpacity
              onPress={() => removeExistingImage(img.id)}
              style={{
                position: 'absolute', top: 0, right: 0,
                backgroundColor: 'red', borderRadius: 12,
                width: 24, height: 24, alignItems: 'center',
              }}
            >
              <Text style={{ color: 'white' }}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Nuevas imágenes seleccionadas */}
      {newImages.length > 0 && (
        <>
          <Text>Nuevas imágenes:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {newImages.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img.uri }}
                style={{ width: 80, height: 80, margin: 4 }}
              />
            ))}
          </View>
        </>
      )}

      <TouchableOpacity onPress={pickImages} style={styles.button}>
        <Text>Agregar imágenes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={updateMutation.isPending}
        style={[styles.button, { backgroundColor: '#4CAF50' }]}
      >
        <Text style={{ color: 'white' }}>
          {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
};
```

---

## Resumen de campos del FormData

| Campo | Tipo | Descripción |
|---|---|---|
| `title` | string | Opcional |
| `description` | string | Opcional |
| `category_id` | int | Opcional |
| `location` | string | Opcional |
| `latitude` | numeric | Opcional |
| `longitude` | numeric | Opcional |
| `status_id` | int | Opcional (solo Admin) |
| `images[]` | file | Archivos nuevos (max 5, 5MB c/u) |
| `deleted_images[]` | int | IDs de `issue_images` a eliminar |

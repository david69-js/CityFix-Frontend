# Plan de Implementación — CityFix Frontend

## 📋 Resumen de Cambios Requeridos

| Prioridad | Feature | Estado Actual |
|-----------|---------|---------------|
| 🔴 Alta | Bug: Admin no puede acceder al panel (role_id incorrecto) | ✅ Listo |
| 🔴 Alta | Buscador de reportes por nombre y usuario | ✅ Listo |
| 🔴 Alta | Archivar reportes en vez de eliminar | ✅ Listo |
| 🔴 Alta | Admin: editar/archivar/activar usuarios | ✅ Listo |
| 🟡 Media | Filtros por estado al clickear stats | ✅ Listo |
| 🟢 Baja | Refactor: componente BottomTabBar reutilizable | ❌ Duplicado en 9 archivos |

---

## 🔧 Fase 0 — Bugfixes Prioritarios

### 0.1 Corregir verificación de rol admin (✅ Completado)

**Archivo**: `app/admin.tsx` — línea 305

**Problema**: El usuario `admin@cityfix.com` tiene `role_id: 2` (Worker) en la base de datos, pero el frontend verifica `user?.role_id !== 1` para permitir acceso al panel admin. El admin está bloqueado.

**Solución en backend** (no tocar frontend):
Ejecutar en la base de datos:
```sql
UPDATE users SET role_id = 1 WHERE email = 'admin@cityfix.com';
```
*(Ejecutado correctamente en el servidor)*

---

## 🔍 Fase 1 — Buscador de Reportes

### 1.1 Modificar hook `useIssuesFeed` (✅ Completado)
| 1.2 Agregar barra de búsqueda en Dashboard (✅ Completado)
| 1.3 Filtro por usuario en Dashboard (✅ Completado)
| 1.4 Filtrar por estado desde stats (✅ Completado)

**Archivo**: `src/hooks/useIssues.ts`

**Cambio**: Agregar soporte para parámetros de búsqueda y filtrado.

```typescript
export const useIssuesFeed = (perPage = 15, filters?: {
  search?: string;
  user_id?: number;
  status_id?: number;
  category_id?: number;
}) => {
  return useQuery({
    queryKey: ['issues', 'feed', perPage, filters],
    queryFn: async () => {
      const params: any = { per_page: perPage };
      if (filters?.search) params.search = filters.search;
      if (filters?.user_id) params.user_id = filters.user_id;
      if (filters?.status_id) params.status_id = filters.status_id;
      if (filters?.category_id) params.category_id = filters.category_id;

      const response = await apiClient.get<PaginatedResponse<Issue>>('/issues/feed', { params });
      return response.data;
    },
  });
};
```

### 1.2 Agregar barra de búsqueda en el Dashboard (✅ Completado)

**Archivo**: `app/index.tsx`

**Cambios**:
1. Importar `useState` si no está
2. Agregar estado: `const [searchText, setSearchText] = useState('');`
3. Agregar estado para filtro activo: `const [activeFilter, setActiveFilter] = useState<{status_id?: number; user_id?: number}>({});`
4. Agregar un `TextInput` de búsqueda entre el header y las tarjetas de stats
5. Pasar `searchText` a `useIssuesFeed` cuando tenga valor
6. Agregar un selector de usuarios (dropdown)

**Estructura sugerida**:

```
[Header]
  └─ [Search Bar] ← NUEVO: TextInput con icono de lupa
[Stats Cards] (Reportado | En Proceso | Resuelto)
  └─ [Filtro por usuario] ← NUEVO: TouchableOpacity que abre modal/selector
  └─ [Category Chips] ← NUEVO: filtros rápidos por categoría
[Reportes Recientes] (lista filtrada)
```

**Código del Search Bar** (insertar después del `actionsContainer` y antes de `sectionHeader`):

```tsx
{/* Search Bar */}
<View style={styles.searchContainer}>
  <Ionicons name="search-outline" size={20} color={colors.textLight} style={styles.searchIcon} />
  <TextInput
    style={styles.searchInput}
    placeholder="Buscar reportes por nombre..."
    placeholderTextColor={colors.textLight}
    value={searchText}
    onChangeText={setSearchText}
  />
  {searchText ? (
    <TouchableOpacity onPress={() => setSearchText('')}>
      <Ionicons name="close-circle" size={20} color={colors.textLight} />
    </TouchableOpacity>
  ) : null}
</View>
```

**Estilos para el Search Bar** (agregar al StyleSheet):

```tsx
searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: colors.surface,
  borderRadius: 12,
  marginHorizontal: 20,
  marginTop: 16,
  paddingHorizontal: 14,
  height: 48,
  borderWidth: 1,
  borderColor: colors.border,
},
searchIcon: {
  marginRight: 10,
},
searchInput: {
  flex: 1,
  fontSize: 15,
  color: colors.textTitle,
},
```

### 1.3 Agregar selector de filtro por usuario

**Archivo**: `app/index.tsx`

**Cambio**: Agregar un dropdown/modal que muestre usuarios obtenidos de `useUsers()`.

```tsx
// Estado
const [showUserFilter, setShowUserFilter] = useState(false);
const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
const { data: users } = useUsers();

// Botón de filtro por usuario
<TouchableOpacity style={styles.userFilterBtn} onPress={() => setShowUserFilter(true)}>
  <Ionicons name="person-outline" size={16} color={colors.textTitle} />
  <Text style={styles.userFilterText}>
    {selectedUserId ? users?.find((u: any) => u.id === selectedUserId)?.first_name || 'Usuario' : 'Todos los usuarios'}
  </Text>
</TouchableOpacity>

// Modal de selección de usuario (usando Alert o modal personalizado)
```

### 1.4 Crear hook para obtener usuarios (✅ Completado)

**Archivo**: `src/hooks/useAuth.ts`

Ya existe `useUsers()` que devuelve todos los usuarios. No requiere cambios.

---

## 📦 Fase 2 — Archivar Reportes (✅ Completado)

### 2.1 Agregar botón "Archivar" en issue-details (✅ Completado)

**Archivo**: `app/issue-details.tsx`

**Cambio**: Agregar botón para administradores debajo de la sección de asignación de trabajador (o en el header).

**Requerimientos**:
- Solo visible para `user?.role_id === 1`
- Debe usar el endpoint del backend: `PATCH /api/admin/issues/{issueId}/toggle-hidden`
- Confirmación antes de archivar (Alert)
- Mostrar estado actual (visible/archivado)
- Poder des-archivar (toggle)

```tsx
// Agregar estado
const [isHidden, setIsHidden] = useState(issue?.is_hidden || false);

// Hook para archivar
const toggleHiddenMutation = useMutation({
  mutationFn: async ({ issueId, reason }: { issueId: number; reason?: string }) => {
    const response = await apiClient.patch(`/admin/issues/${issueId}/toggle-hidden`, { reason });
    return response.data;
  },
  onSuccess: (data) => {
    setIsHidden(data.is_hidden);
    refetchDetails();
    Alert.alert('Éxito', data.message);
  },
});
```

Botón en UI:

```tsx
{user?.role_id === 1 && (
  <TouchableOpacity
    style={[styles.archiveBtn, isHidden && styles.archiveBtnActive]}
    onPress={() => {
      Alert.alert(
        isHidden ? 'Mostrar reporte' : 'Archivar reporte',
        isHidden ? '¿Deseas que este reporte sea visible nuevamente?' : '¿Estás seguro de archivar este reporte?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: isHidden ? 'Mostrar' : 'Archivar',
            onPress: () => toggleHiddenMutation.mutate({
              issueId: issue.id,
              reason: isHidden ? undefined : 'Archivado por administrador'
            })
          }
        ]
      );
    }}
  >
    <Ionicons name={isHidden ? 'eye-outline' : 'eye-off-outline'} size={18} color="#FFF" />
    <Text style={styles.archiveBtnText}>{isHidden ? 'Mostrar Reporte' : 'Archivar Reporte'}</Text>
  </TouchableOpacity>
)}
```

**Estilos**:

```tsx
archiveBtn: {
  backgroundColor: '#6B7280',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 10,
  borderRadius: 8,
  marginTop: 10,
},
archiveBtnActive: {
  backgroundColor: '#10B981',
},
archiveBtnText: {
  color: '#FFF',
  fontSize: 14,
  fontWeight: 'bold',
  marginLeft: 6,
},
```

### 2.2 Agregar vista de reportes archivados en admin (✅ Completado)

**Archivo**: `app/admin.tsx`

**Cambio**: Agregar una sección que muestre reportes archivados usando `GET /api/admin/issues?is_hidden=true`.

---

## 👥 Fase 3 — Gestión de Usuarios para Admin (✅ Completado)

### 3.1 Nueva sección "Usuarios" en Admin (✅ Completado)

**Archivo**: `app/admin.tsx`

**Cambio**: Agregar una nueva sección completa de gestión de usuarios entre "Actualizar Usuario" y "Gestionar Estados".

**Requerimientos**:
1. Botón en el panel admin que diga "Gestionar Usuarios"
2. Al hacer clic, muestra una lista de todos los usuarios (fetch de `GET /api/admin/users`)
3. Cada usuario muestra: nombre, email, rol, estado (activo/archivado)
4. Opciones por usuario: editar rol, archivar/activar
5. Barra de búsqueda para filtrar usuarios por nombre/email
6. **NO se puede archivar/desactivar a otro admin**

**Estructura de código sugerida**:

```tsx
// Estado para la sección de usuarios
const [showUserManagement, setShowUserManagement] = useState(false);
const [userList, setUserList] = useState<any[]>([]);
const [userSearch, setUserSearch] = useState('');
const [loadingUsers, setLoadingUsers] = useState(false);

// Fetch users
const fetchUsers = async () => {
  setLoadingUsers(true);
  try {
    const response = await apiClient.get('/admin/users');
    setUserList(Array.isArray(response.data) ? response.data : response.data.data || []);
  } catch (error: any) {
    Alert.alert('Error', 'No se pudieron cargar los usuarios.');
  } finally {
    setLoadingUsers(false);
  }
};

// Renderizado condicional en el ScrollView:
{showUserManagement ? (
  <View style={styles.card}>
    <View style={styles.userMgmtHeader}>
      <Text style={styles.sectionTitle}>Usuarios del Sistema</Text>
      <TouchableOpacity onPress={() => setShowUserManagement(false)}>
        <Ionicons name="close" size={24} color={colors.textSub} />
      </TouchableOpacity>
    </View>

    {/* Search */}
    <TextInput
      style={styles.input}
      placeholder="Buscar por nombre o email..."
      value={userSearch}
      onChangeText={setUserSearch}
    />

    {/* Lista */}
    {loadingUsers ? (
      <ActivityIndicator />
    ) : (
      <ScrollView style={{ maxHeight: 400 }}>
        {userList
          .filter((u: any) =>
            `${u.first_name} ${u.last_name} ${u.email}`
              .toLowerCase()
              .includes(userSearch.toLowerCase())
          )
          .map((u: any) => (
            <View key={u.id} style={styles.userRow}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{u.first_name} {u.last_name}</Text>
                <Text style={styles.userEmail}>{u.email}</Text>
                <View style={styles.userMeta}>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{u.role?.name || 'Sin rol'}</Text>
                  </View>
                  {u.is_active === false && (
                    <View style={styles.archivedBadge}>
                      <Text style={styles.archivedBadgeText}>Archivado</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.userActions}>
                {/* Editar rol */}
                <TouchableOpacity
                  style={styles.userActionBtn}
                  onPress={() => handleEditUser(u)}
                >
                  <Ionicons name="create-outline" size={20} color={colors.primary} />
                </TouchableOpacity>

                {/* Archivar/Activar (solo si no es admin) */}
                {u.role?.name !== 'Admin' && (
                  <TouchableOpacity
                    style={[styles.userActionBtn, u.is_active === false && { backgroundColor: '#F0FDF4' }]}
                    onPress={() => handleToggleUserActive(u)}
                  >
                    <Ionicons
                      name={u.is_active === false ? 'checkmark-circle-outline' : 'close-circle-outline'}
                      size={20}
                      color={u.is_active === false ? '#10B981' : '#EF4444'}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        }
      </ScrollView>
    )}
  </View>
) : (
  // Botón para abrir gestión de usuarios
  <TouchableOpacity
    style={[styles.adminButton, { backgroundColor: '#8B5CF6' }]}
    onPress={() => { setShowUserManagement(true); fetchUsers(); }}
  >
    <Ionicons name="people-outline" size={20} color="#FFF" />
    <Text style={styles.adminButtonText}>Gestionar Usuarios</Text>
  </TouchableOpacity>
)}
```

### 3.2 Funciones auxiliares para usuarios (✅ Completado)

```tsx
const handleEditUser = (user: any) => {
  Alert.prompt?.(
    'Nuevo Rol (ID)',
    `Rol actual: ${user.role?.name} (${user.role_id})`,
    async (newRoleId) => {
      if (!newRoleId) return;
      try {
        await apiClient.put(`/admin/users/${user.id}`, {
          role_id: parseInt(newRoleId, 10),
        });
        Alert.alert('Éxito', 'Rol actualizado');
        fetchUsers();
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Error al actualizar');
      }
    },
    'plain-text',
    String(user.role_id)
  );
};

const handleToggleUserActive = async (user: any) => {
  const action = user.is_active === false ? 'activar' : 'archivar';
  Alert.alert(
    `${action === 'activar' ? 'Activar' : 'Archivar'} usuario`,
    `¿Estás seguro de ${action} a ${user.first_name} ${user.last_name}?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: action === 'activar' ? 'Activar' : 'Archivar',
        onPress: async () => {
          try {
            await apiClient.patch(`/admin/users/${user.id}/toggle-active`);
            Alert.alert('Éxito', `Usuario ${action}do correctamente`);
            fetchUsers();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Error al ${action} usuario');
          }
        },
      },
    ]
  );
};
```

### 3.3 Estilos adicionales para admin.tsx (✅ Completado)

Agregar al StyleSheet:

```tsx
userMgmtHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
userRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingVertical: 12,
  paddingHorizontal: 12,
  borderBottomWidth: 1,
  borderBottomColor: colors.border,
  backgroundColor: colors.surface,
  borderRadius: 8,
  marginBottom: 8,
},
userInfo: {
  flex: 1,
  marginRight: 12,
},
userName: {
  fontSize: 14,
  fontWeight: '700',
  color: colors.textTitle,
},
userEmail: {
  fontSize: 12,
  color: colors.textSub,
  marginTop: 2,
},
userMeta: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 4,
  gap: 6,
},
roleBadge: {
  backgroundColor: '#EEF4FF',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
},
roleBadgeText: {
  fontSize: 11,
  color: colors.primary,
  fontWeight: '600',
},
archivedBadge: {
  backgroundColor: '#FEF2F2',
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 4,
},
archivedBadgeText: {
  fontSize: 11,
  color: '#EF4444',
  fontWeight: '600',
},
userActions: {
  flexDirection: 'row',
  gap: 8,
},
userActionBtn: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center',
  alignItems: 'center',
},
```

---

## 🔘 Fase 4 — Filtro por Estado al Clickear Stats (✅ Completado)

### 4.1 Hacer clickeables las cards de estadísticas(✅ Completado)

**Archivo**: `app/index.tsx`

**Cambio**: Las 3 cards de stats (Reportado, En Proceso, Resuelto) deben actuar como filtros.

**Requerimientos**:
1. Al hacer clic en "Reportado" → filtrar solo issues con `status_id === 1`
2. Al hacer clic en "En Proceso" → filtrar solo issues con `status_id === 2`
3. Al hacer clic en "Resuelto" → filtrar solo issues con `status_id === 3`
4. Al hacer clic en la misma card activa → quitar filtro
5. Highlight visual en la card activa

```tsx
// Estado
const [activeStatusFilter, setActiveStatusFilter] = useState<number | null>(null);
const [activeFilterTab, setActiveFilterTab] = useState<string | null>(null);

// Pasar filtro al hook
const { data: feedData, isLoading: feedLoading, refetch, isRefetching } = useIssuesFeed(
  15,
  { status_id: activeStatusFilter || undefined }
);

// Modificar las cards de stats:
<View style={styles.statsContainer}>
  <TouchableOpacity
    style={[
      styles.statCard,
      activeFilterTab === 'reported' && styles.statCardActive
    ]}
    onPress={() => {
      if (activeFilterTab === 'reported') {
        setActiveFilterTab(null);
        setActiveStatusFilter(null);
      } else {
        setActiveFilterTab('reported');
        setActiveStatusFilter(1);
      }
    }}
  >
    <View style={[styles.statIconContainer, { backgroundColor: colors.iconOrangeBg }]}>
      <Ionicons name="alert-outline" size={20} color={colors.iconOrangeFg} />
    </View>
    <Text style={styles.statValue}>{stats.reported}</Text>
    <Text style={[
      styles.statLabel,
      activeFilterTab === 'reported' && { color: colors.primary, fontWeight: 'bold' }
    ]}>Reportado</Text>
  </TouchableOpacity>

  {/* Repetir para En Proceso (status_id: 2) y Resuelto (status_id: 3) */}
  ...
</View>
```

**Estilos adicionales**:

```tsx
statCardActive: {
  borderWidth: 2,
  borderColor: colors.primary,
  backgroundColor: '#EEF4FF',
},
```

---

## 🧹 Fase 5 — Refactor (Deuda Técnica) (✅ Completado)

### 5.1 Componente BottomTabBar reutilizable (✅ Completado)

**Crear archivo**: `src/components/BottomTabBar.tsx`

Extraer el bottom tab bar que está duplicado en: `index.tsx`, `admin.tsx`, `issue-details.tsx`, `report.tsx`, `profile.tsx`, `edit-profile.tsx`, `map.tsx`, `assignments.tsx`, `notifications.tsx`.

```tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

const colors = {
  primary: '#2065ff',
  surface: '#FFFFFF',
  textLight: '#9CA3AF',
  textTitle: '#111827',
  border: '#E5E7EB',
};

export default function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const tabs = [
    { key: '/', label: 'Inicio', icon: 'home-outline', iconActive: 'home' },
    { key: '/map', label: 'Mapa', icon: 'map-outline', iconActive: 'map' },
    { key: 'central', label: 'Reportar', icon: 'add', isFAB: true },
    { key: '/profile', label: 'Perfil', icon: 'person-outline', iconActive: 'person' },
    ...(user?.role_id === 2 ? [{ key: '/assignments', label: 'Tareas', icon: 'briefcase-outline', iconActive: 'briefcase' }] : []),
    ...(user?.role_id === 1 ? [{ key: '/admin', label: 'Admin', icon: 'shield-checkmark', iconActive: 'shield-checkmark' }] : []),
  ];

  return (
    <View style={styles.bottomTabBar}>
      {tabs.map((tab) => {
        if (tab.isFAB) {
          return (
            <View key="central" style={styles.tabItemCentral}>
              <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/report')}>
                <Ionicons name="add" size={32} color="#FFF" />
              </TouchableOpacity>
              <Text style={[styles.tabLabel, { marginTop: 4, color: colors.primary }]}>Reportar</Text>
            </View>
          );
        }
        const isActive = pathname === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => router.push(tab.key as any)}
          >
            <Ionicons
              name={(isActive ? tab.iconActive : tab.icon) as any}
              size={24}
              color={isActive ? colors.primary : colors.textLight}
            />
            <Text style={[styles.tabLabel, isActive && { color: colors.primary }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabBar: {
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 25,
    paddingTop: 10,
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 100,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabItemCentral: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
    marginTop: -25,
  },
  tabLabel: {
    fontSize: 11,
    color: colors.textLight,
    fontWeight: '500',
    marginTop: 4,
  },
  fabButton: {
    backgroundColor: colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
});
```

Luego importar `BottomTabBar` en cada pantalla y reemplazar el código duplicado.

### 5.2 Mover helpers a utils (✅ Completado)

**Crear archivo**: `src/utils/helpers.ts`

```typescript
export const getCategoryColor = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('basura')) return '#F59E0B';
  if (n.includes('bache') || n.includes('vía')) return '#4B5563';
  if (n.includes('luz') || n.includes('iluminación')) return '#EAB308';
  if (n.includes('agua')) return '#3B82F6';
  return '#4B5563';
};

export const getStatusIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('pendiente') || n.includes('reportado')) return 'alert-circle-outline';
  if (n.includes('proceso') || n.includes('camino')) return 'time-outline';
  if (n.includes('resuelto') || n.includes('listo')) return 'checkmark-circle-outline';
  return 'help-circle-outline';
};

export const STATUS_IDS = {
  PENDIENTE: 1,
  EN_PROCESO: 2,
  RESUELTO: 3,
} as const;

export const COLORS = {
  primary: '#2065ff',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  textTitle: '#111827',
  textSub: '#4B5563',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  danger: '#EF4444',
} as const;
```

Luego importar en todos los archivos que usan estas funciones y eliminar las copias locales.

### 5.3 Limpiar console.logs 

Buscar y eliminar todos los `console.log` de debug:

- `app/index.tsx`: línea 187 (`console.log(`[DEBUG] Dashboard Image URL...`)
- `app/issue-details.tsx`: línea 167 (`console.log(`[DEBUG] IssueDetails Image URL...`)
- `app/profile.tsx`: líneas 141-143 (`console.log('[DEBUG] Avatar loaded...`)
- `src/hooks/useAuth.ts`: líneas 91-104 (`console.log('[useLogin] ...`)

---

## 📁 Resumen de Archivos a Modificar/Crear

### Archivos a modificar:
| Archivo | Cambios |
|---------|---------|
| `app/index.tsx` | Search bar, filtros por estado clickeables, filtro por usuario |
| `app/issue-details.tsx` | Botón archivar/desarchivar |
| `app/admin.tsx` | Sección gestión de usuarios con lista, búsqueda, editar, archivar |
| `src/hooks/useIssues.ts` | `useIssuesFeed` acepta filtros (search, user_id, status_id, category_id) |
| `app/profile.tsx` | Reemplazar bottom tab por componente |
| `app/report.tsx` | Reemplazar bottom tab por componente |
| `app/map.tsx` | Reemplazar bottom tab por componente |
| `app/edit-profile.tsx` | Reemplazar bottom tab por componente |
| `app/assignments.tsx` | Reemplazar bottom tab por componente |
| `app/notifications.tsx` | Reemplazar bottom tab por componente |

### Archivos a crear:
| Archivo | Propósito |
|---------|-----------|
| `src/components/BottomTabBar.tsx` | Componente reutilizable de bottom tab |
| `src/utils/helpers.ts` | Helpers compartidos (getCategoryColor, getStatusIcon, constantes) |

---

## 🔗 Dependencias Backend

El frontend asume que el backend tiene estos endpoints. Verificar `PLAN_IMPLEMENTACION_BACKEND.md` para detalles:

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `GET /api/issues/feed` | GET | Aceptar `search`, `user_id`, `status_id`, `category_id` como query params |
| `PATCH /api/admin/issues/{id}/toggle-hidden` | PATCH | Archivar/mostrar reporte |
| `GET /api/admin/users` | GET | Listar usuarios |
| `PUT /api/admin/users/{id}` | PUT | Actualizar usuario |
| `PATCH /api/admin/users/{id}/toggle-active` | PATCH | Activar/archivar usuario (NUEVO) |
| `GET /api/admin/issues?is_hidden=true` | GET | Listar issues archivados |

---

## ⏳ Fase Transitoria — Lo que se puede hacer MIENTRAS sale el Backend

El backend puede tardar en implementar todos los endpoints nuevos. Mientras tanto, el frontend puede avanzar con **filtrado 100% client-side** usando los datos que YA devuelve la API actual. Esto permite tener la UI lista y funcional desde el día 1.

### 1. Filtro por estado (click en stats) — SIN backend

La API actual (`GET /api/issues/feed`) devuelve TODOS los issues con su `status_id`. Se puede filtrar directamente en el frontend:

```typescript
// En app/index.tsx
const [activeStatusFilter, setActiveStatusFilter] = useState<number | null>(null);

// Filtramos los reports DESPUÉS de recibirlos de la API
const reports = feedData?.data || [];

const filteredReports = activeStatusFilter
  ? reports.filter(r => r.status_id === activeStatusFilter)
  : reports;
```

La UI de las cards clickeables se implementa completa ahora — cuando el backend soporte filtros, solo se cambia de filtrado client-side a server-side sin tocar la UI.

### 2. Buscador por nombre de reporte — SIN backend

Mientras el endpoint `feed()` no soporte `?search=`, se filtra client-side:

```typescript
const [searchText, setSearchText] = useState('');

const filteredReports = reports.filter(r =>
  !searchText ||
  r.title.toLowerCase().includes(searchText.toLowerCase()) ||
  (r.description || '').toLowerCase().includes(searchText.toLowerCase())
);
```

La UI (barra de búsqueda, iconos, botón limpiar) se construye completa ahora. Cuando el backend soporte `?search=`, solo se cambia el filtro a la query param.

### 3. Buscador por usuario — SIN backend

La API `GET /api/users` (pública) ya devuelve todos los usuarios con sus IDs. Se puede:

```typescript
// 1. Obtener usuarios
const { data: users } = useUsers();

// 2. Filtrar issues por usuario seleccionado
const [selectedUserId, setSelectedUserId] = useState<number | undefined>();

const filteredReports = reports.filter(r =>
  !selectedUserId || r.user_id === selectedUserId
);
```

La UI (selector de usuarios con nombres, modal, chips) se implementa completa ahora.

### 4. Combinar todos los filtros (client-side)

```typescript
const filteredReports = reports.filter(r => {
  // Filtro por texto
  const matchesSearch = !searchText ||
    r.title.toLowerCase().includes(searchText.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchText.toLowerCase());

  // Filtro por usuario
  const matchesUser = !selectedUserId || r.user_id === selectedUserId;

  // Filtro por estado
  const matchesStatus = !activeStatusFilter || r.status_id === activeStatusFilter;

  return matchesSearch && matchesUser && matchesStatus;
});
```

### 5. Gestión de usuarios (Admin) — UI primero, API después

La sección de "Gestionar Usuarios" se construye completa ahora con:

| Funcionalidad | Implementación inmediata | Cuando llegue el backend |
|---------------|--------------------------|--------------------------|
| **Listar usuarios** | ✅ `GET /api/users` (ya funciona, devuelve todos con role) | Migrar a `GET /api/admin/users` |
| **Buscar usuarios** | ✅ Filtrado client-side por nombre/email | Se mantiene igual |
| **Editar rol de usuario** | ✅ `PUT /api/admin/users/{id}` (ya existe en backend, requiere auth:api + role:Admin) | Se mantiene igual |
| **Archivar/activar usuario** | ❌ No disponible aún. Mostrar botón deshabilitado con tooltip "Próximamente" | Conectar a `PATCH /api/admin/users/{id}/toggle-active` |

**Para el botón de archivar usuario mientras no existe el endpoint**:

```typescript
<TouchableOpacity
  style={[styles.userActionBtn, { opacity: 0.5 }]}
  disabled={true}
  onPress={() => Alert.alert('Próximamente', 'La funcionalidad de archivar usuarios estará disponible pronto.')}
>
  <Ionicons name="close-circle-outline" size={20} color="#9CA3AF" />
</TouchableOpacity>
```

### 6. Archivar reportes — UI primero, API después

| Funcionalidad | Implementación inmediata | Cuando llegue el backend |
|---------------|--------------------------|--------------------------|
| **Botón Archivar en issue-details** | ✅ Se construye la UI completa, pero el botón ejecuta un Alert diciendo "Próximamente" o simula el cambio localmente | Conectar a `PATCH /api/admin/issues/{id}/toggle-hidden` |
| **Vista de archivados** | ✅ Se construye la UI, pero muestra lista vacía con mensaje "Próximamente" | Conectar a `GET /api/admin/issues?is_hidden=true` |

### 7. Resumen de prioridades para desarrollo en paralelo

```
SEMANA 1 (Frontend solo, sin backend nuevo)
├── Implementar BottomTabBar reutilizable  → ya funciona
├── Implementar helpers.ts                 → ya funciona
├── Crear UI de búsqueda + filtros         → filtrado client-side
├── Hacer stats clickeables                → filtrado client-side
├── Crear UI de gestión de usuarios        → lista + búsqueda funcionan, archivar deshabilitado
├── Crear UI de archivar reportes          → botón visible con placeholder
└── Limpiar console.logs + código muerto

SEMANA 2 (Backend listo)
├── Conectar búsqueda a ?search= del backend
├── Conectar filtro usuarios a ?user_id= del backend
├── Conectar archivar reportes a toggle-hidden
├── Conectar archivar usuarios a toggle-active
└── Tests de integración
```

---

## 📝 Notas Adicionales

1. **IDS de estados**: El frontend usa IDs hardcodeados (1=Pendiente, 2=En Proceso, 3=Resuelto). Si el backend cambia estos IDs, el frontend dejará de funcionar. Considerar usar constantes (`STATUS_IDS` en helpers.ts).

2. **Seguridad**: El endpoint `GET /api/users` es público en el backend. Si se usa para el selector de usuarios, considerar si debe estar autenticado.

3. **Paginación**: El filtrado client-side funciona con los datos ya cargados. Cuando se migre a server-side, la paginación se integrará naturalmente con el hook.

4. **Debounce**: Para la búsqueda por nombre en modo client-side no es necesario. Cuando se migre a server-side, agregar debounce de 300-500ms para no saturar el backend.

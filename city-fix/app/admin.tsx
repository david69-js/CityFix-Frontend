import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, TextInput, Alert, ActivityIndicator, Share } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateProfile } from '../src/hooks/useAuth';
import apiClient from '../src/api/axios';
import { useSendCampaign } from '../src/hooks/useNotifications';
import { useThemeColors } from '../src/hooks/useThemeColors';
import { BottomTabBar } from '../src/components/BottomTabBar';
import { useAdminIssues, useToggleIssueHidden } from '../src/hooks/useIssues';
import { useAdminUsers, useToggleUserActive, useAdminUpdateUser } from '../src/hooks/useAdmin';

const { width } = Dimensions.get('window');

// Dynamic colors will be used from useThemeColors

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'CF-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = getStyles(colors);

  const translateRoleName = (name: string) => {
    if (name.toLowerCase() === 'worker') return 'Trabajador';
    if (name.toLowerCase() === 'admin') return 'Administrador';
    // Mantiene "Citizen" tal cual
    return name;
  };



  // --- States for Category ---
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('fa-solid fa-road');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // --- States for User ---
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState('1'); // Default to citizen
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // --- States for Update User ---
  const [updateUserId, setUpdateUserId] = useState('');
  const [updateUserRole, setUpdateUserRole] = useState('');
  const [updateUserFirstName, setUpdateUserFirstName] = useState('');
  const [updateUserPhone, setUpdateUserPhone] = useState('');
  const [updateUserAvatar, setUpdateUserAvatar] = useState<string | null>(null);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  
  const updateProfileMutation = useUpdateProfile();

  // --- States for Invitation Code ---
  const [invCode, setInvCode] = useState(generateRandomCode());
  const [invRole, setInvRole] = useState('2');
  const [invMaxUses, setInvMaxUses] = useState('10');
  const [invExpires, setInvExpires] = useState('2026-12-31 23:59:59');
  const [isCreatingInv, setIsCreatingInv] = useState(false);


  // --- States for Issue Status ---
  const [statusName, setStatusName] = useState('');
  const [statusColor, setStatusColor] = useState('#FFC107');
  const [statusOrder, setStatusOrder] = useState('1');
  const [isCreatingStatus, setIsCreatingStatus] = useState(false);

  // --- States for Archived Issues ---
  const [showArchivedIssues, setShowArchivedIssues] = useState(false);
  const [archivedSearch, setArchivedSearch] = useState('');

  // --- States for User Management ---
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  const { data: archivedIssues, isLoading: loadingArchived } = useAdminIssues({ is_hidden: true });
  const toggleIssueHiddenMutation = useToggleIssueHidden();

  const { data: userList } = useAdminUsers();
  const toggleUserActiveMutation = useToggleUserActive();
  const adminUpdateUserMutation = useAdminUpdateUser();

  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await apiClient.get('/roles');
        if (response.data && Array.isArray(response.data)) {
          setRoles(response.data);
          // Auto select first role if available
          if (response.data.length > 0 && userRole === '1') {
            setUserRole(response.data[0].id.toString());
          }
        } else if (response.data && Array.isArray(response.data.data)) {
           // Si Laravel lo pagina
           setRoles(response.data.data);
           if (response.data.data.length > 0 && userRole === '1') {
            setUserRole(response.data.data[0].id.toString());
          }
        }
      } catch (error) {
        console.error("Error fetching roles", error);
      }
    };
    fetchRoles();
  }, []);

  const availableIcons = [
    { label: 'Calle', value: 'fa-solid fa-road', name: 'road' },
    { label: 'Luz', value: 'fa-solid fa-lightbulb', name: 'lightbulb' },
    { label: 'Basura', value: 'fa-solid fa-trash', name: 'trash' },
    { label: 'Agua', value: 'fa-solid fa-water', name: 'water' },
    { label: 'Árbol', value: 'fa-solid fa-tree', name: 'tree' },
    { label: 'Coche', value: 'fa-solid fa-car-crash', name: 'car-crash' },
    { label: 'Animal', value: 'fa-solid fa-dog', name: 'dog' },
    { label: 'Alerta', value: 'fa-solid fa-exclamation-triangle', name: 'exclamation-triangle' },
    { label: 'Energía', value: 'fa-solid fa-bolt', name: 'bolt' },
  ];

  const handleCreateCategory = async () => {
    if (!categoryName || !categoryIcon) {
      Alert.alert('Error', 'Por favor ingresa nombre e ícono de la categoría.');
      return;
    }
    try {
      setIsCreatingCategory(true);
      await apiClient.post('/categories', {
        name: categoryName,
        icon: categoryIcon,
        parent_id: null
      });
      Alert.alert('Éxito', 'Categoría creada correctamente.');
      setCategoryName('');
      setCategoryIcon('fa-solid fa-road');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al crear la categoría.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleCreateUser = async () => {
    if (!userFirstName || !userEmail || !userPassword) {
      Alert.alert('Error', 'Faltan campos obligatorios para el usuario.');
      return;
    }
    try {
      setIsCreatingUser(true);
      // Como POST /users no procesa los datos en el backend, 
      // usamos el endpoint de registro que sí funciona.
      const registerRes = await apiClient.post('/auth/register', {
        first_name: userFirstName,
        last_name: userLastName,
        email: userEmail,
        password: userPassword,
      });

      const newUserId = registerRes.data.user.id;

      // Luego actualizamos el rol y el teléfono usando PUT /users/{id} 
      // (que sí funciona correctamente en el backend).
      if (userRole || userPhone) {
        const updatePayload: any = {};
        if (userRole) updatePayload.role_id = parseInt(userRole, 10);
        if (userPhone) updatePayload.phone = userPhone;
        
        await apiClient.put(`/users/${newUserId}`, updatePayload);
      }

      Alert.alert('Éxito', 'Usuario creado correctamente.');
      setUserFirstName(''); setUserLastName(''); setUserEmail('');
      setUserPassword(''); setUserPhone(''); setUserRole('1');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al crear usuario.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Se necesitan permisos de galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setUpdateUserAvatar(result.assets[0].uri);
    }
  };

  const handleUpdateUser = async () => {
    if (!updateUserId) {
      Alert.alert('Error', 'Ingresa el ID del usuario a actualizar.');
      return;
    }
    try {
      setIsUpdatingUser(true);
      
      const payload: any = {};
      if (updateUserRole) payload.role_id = parseInt(updateUserRole, 10);
      if (updateUserFirstName) payload.first_name = updateUserFirstName;
      if (updateUserPhone) payload.phone = updateUserPhone;

      if (updateUserAvatar) {
        const filename = updateUserAvatar.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        
        payload.avatar = {
          uri: updateUserAvatar,
          name: filename,
          type,
        };
      }

      await updateProfileMutation.mutateAsync({
        userId: parseInt(updateUserId, 10),
        payload
      });

      Alert.alert('Éxito', 'Usuario actualizado correctamente.');
      setUpdateUserId(''); setUpdateUserRole(''); setUpdateUserFirstName(''); setUpdateUserPhone('');
      setUpdateUserAvatar(null);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al actualizar usuario.');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleCreateInvitationCode = async () => {
    try {
      setIsCreatingInv(true);
      const payload: any = {
        role_id: parseInt(invRole, 10),
        is_active: true,
        expires_at: invExpires,
        max_uses: parseInt(invMaxUses, 10),
      };
      if (invCode) {
        payload.code = invCode;
      }
      const res = await apiClient.post('/invitation-codes', payload);
      const generatedCode = res.data?.data?.code || res.data?.code;
      
      Alert.alert(
        '¡Código Generado!',
        `El código es:\n${generatedCode}\n\n¿Deseas enviarlo ahora?`,
        [
          { text: 'Cerrar', style: 'cancel', onPress: () => setInvCode(generateRandomCode()) },
          { 
            text: 'Compartir', 
            onPress: () => {
              Share.share({
                message: `¡Únete al equipo de CityFix!\n\nDescarga la app y usa este Código de Invitación especial al registrarte para obtener tu rol:\n\n${generatedCode}`,
              });
              setInvCode(generateRandomCode());
            } 
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al generar código.');
    } finally {
      setIsCreatingInv(false);
    }
  };


  const handleCreateStatus = async () => {
    if (!statusName) {
      Alert.alert('Error', 'El nombre del estado es obligatorio.');
      return;
    }
    try {
      setIsCreatingStatus(true);
      await apiClient.post('/issue-statuses', {
        name: statusName,
        color: statusColor,
        sort_order: parseInt(statusOrder, 10),
      });
      Alert.alert('Éxito', 'Estado creado correctamente.');
      setStatusName('');
      setStatusColor('#FFC107');
      setStatusOrder('1');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al crear el estado.');
    } finally {
      setIsCreatingStatus(false);
    }
  };

  const handleEditUserRole = (user: any) => {
    Alert.prompt(
      'Nuevo Rol (ID)',
      `Actual: ${user.role?.name} (ID: ${user.role_id})\nAdmin: 1, Worker: 2, Citizen: 3`,
      async (newRoleId) => {
        if (!newRoleId) return;
        try {
          await adminUpdateUserMutation.mutateAsync({
            userId: user.id,
            payload: { role_id: parseInt(newRoleId, 10) }
          });
          Alert.alert('Éxito', 'Rol actualizado');
        } catch (error: any) {
          Alert.alert('Error', error.response?.data?.message || 'Error al actualizar');
        }
      },
      'plain-text',
      String(user.role_id)
    );
  };

  const handleToggleUserActive = async (user: any) => {
    const isCurrentlyActive = user.is_active === true || Number(user.is_active) === 1;
    const action = isCurrentlyActive ? 'archivar' : 'activar';
    Alert.alert(
      `${action === 'activar' ? 'Activar' : 'Archivar'} usuario`,
      `¿Estás seguro de ${action} a ${user.first_name} ${user.last_name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action === 'activar' ? 'Activar' : 'Archivar',
          onPress: async () => {
            try {
              await toggleUserActiveMutation.mutateAsync(user.id);
              Alert.alert('Éxito', `Usuario ${action}do correctamente`);
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || `Error al ${action} usuario`);
            }
          },
        },
      ]
    );
  };

  // Redirect if not admin (role_id 1 is Admin based on context)
  if (user?.role_id !== 1) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No tienes acceso a esta sección.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerArea}>
        <SafeAreaView>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Administración</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.contentPadding}>

          {/* Create Category */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Crear Nueva Categoría</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre de Categoría</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Baches"
                value={categoryName}
                onChangeText={setCategoryName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ícono (Selecciona uno)</Text>
              <View style={styles.iconGrid}>
                {availableIcons.map((icon) => (
                  <TouchableOpacity
                    key={icon.value}
                    style={[
                      styles.iconCard,
                      categoryIcon === icon.value && styles.iconCardSelected
                    ]}
                    onPress={() => setCategoryIcon(icon.value)}
                    activeOpacity={0.7}
                  >
                    <FontAwesome5 
                      name={icon.name} 
                      size={24} 
                      color={categoryIcon === icon.value ? colors.adminHighlight : colors.textSub} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity 
              style={styles.adminButton}
              onPress={handleCreateCategory}
              disabled={isCreatingCategory}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FFF" />
              <Text style={styles.adminButtonText}>
                {isCreatingCategory ? 'Creando...' : 'Crear Categoría'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Create User */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Crear Usuario</Text>
            <TextInput style={styles.input} placeholder="Nombre" value={userFirstName} onChangeText={setUserFirstName} />
            <TextInput style={styles.input} placeholder="Apellido" value={userLastName} onChangeText={setUserLastName} />
            <TextInput style={styles.input} placeholder="Correo electrónico" value={userEmail} onChangeText={setUserEmail} keyboardType="email-address" />
            <TextInput style={styles.input} placeholder="Contraseña" value={userPassword} onChangeText={setUserPassword} secureTextEntry />
            <TextInput style={styles.input} placeholder="Teléfono" value={userPhone} onChangeText={setUserPhone} keyboardType="phone-pad" />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rol de Usuario <Text style={{color: colors.adminHighlight}}>*</Text></Text>
              {roles.length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.textLight }}>Cargando roles...</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {roles.map((r: any) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleChip, userRole === r.id.toString() && styles.roleChipSelected]}
                      onPress={() => setUserRole(r.id.toString())}
                    >
                      <Text style={[styles.roleChipText, userRole === r.id.toString() && styles.roleChipTextSelected]}>{translateRoleName(r.name)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.adminButton} onPress={handleCreateUser} disabled={isCreatingUser}>
              <Text style={styles.adminButtonText}>{isCreatingUser ? 'Creando...' : 'Crear Usuario'}</Text>
            </TouchableOpacity>
          </View>

          {/* Update User */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Actualizar Usuario / Rol</Text>
            <TextInput style={styles.input} placeholder="ID del Usuario" value={updateUserId} onChangeText={setUpdateUserId} keyboardType="numeric" />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nuevo Rol (Opcional)</Text>
              {roles.length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.textLight }}>Cargando roles...</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <TouchableOpacity
                      style={[styles.roleChip, updateUserRole === '' && styles.roleChipSelected]}
                      onPress={() => setUpdateUserRole('')}
                    >
                      <Text style={[styles.roleChipText, updateUserRole === '' && styles.roleChipTextSelected]}>Sin Cambios</Text>
                  </TouchableOpacity>
                  {roles.map((r: any) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleChip, updateUserRole === r.id.toString() && styles.roleChipSelected]}
                      onPress={() => setUpdateUserRole(r.id.toString())}
                    >
                      <Text style={[styles.roleChipText, updateUserRole === r.id.toString() && styles.roleChipTextSelected]}>{translateRoleName(r.name)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <TextInput style={styles.input} placeholder="Actualizar Teléfono" value={updateUserPhone} onChangeText={setUpdateUserPhone} keyboardType="phone-pad" />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Foto de Perfil (Avatar)</Text>
              <TouchableOpacity style={styles.avatarPicker} onPress={handlePickAvatar}>
                {updateUserAvatar ? (
                  <Image source={{ uri: updateUserAvatar }} style={styles.avatarPreview} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="camera" size={24} color={colors.textLight} />
                    <Text style={styles.avatarPlaceholderText}>Elegir Foto</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.adminButton} onPress={handleUpdateUser} disabled={isUpdatingUser}>
              <Text style={styles.adminButtonText}>{isUpdatingUser ? 'Actualizando...' : 'Actualizar Usuario'}</Text>
            </TouchableOpacity>
          </View>

          {/* Create Issue Status */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Gestionar Estados de Reportes</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Estado (Ej: Pendiente, En Proceso)</Text>
              <TextInput style={styles.input} placeholder="Nombre" value={statusName} onChangeText={setStatusName} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Color Hexadecimal</Text>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="#RRGGBB" value={statusColor} onChangeText={setStatusColor} />
                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: statusColor || '#EEE' }} />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Orden de Clasificación</Text>
              <TextInput style={styles.input} placeholder="1" value={statusOrder} onChangeText={setStatusOrder} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={styles.adminButton} onPress={handleCreateStatus} disabled={isCreatingStatus}>
              <Text style={styles.adminButtonText}>{isCreatingStatus ? 'Guardando...' : 'Crear Estado'}</Text>
            </TouchableOpacity>
          </View>

          {/* Create Invitation Code */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Generar Código de Invitación</Text>
            <TextInput style={styles.input} placeholder="Ej: CF-XYZ123" value={invCode} onChangeText={setInvCode} />
            <TextInput style={styles.input} placeholder="Usos máximos (Ej: 10)" value={invMaxUses} onChangeText={setInvMaxUses} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Expira en (YYYY-MM-DD HH:mm:ss)" value={invExpires} onChangeText={setInvExpires} />
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Rol para este código</Text>
              {roles.length === 0 ? (
                <Text style={{ fontSize: 13, color: colors.textLight }}>Cargando roles...</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {roles.map((r: any) => (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleChip, invRole === r.id.toString() && styles.roleChipSelected]}
                      onPress={() => setInvRole(r.id.toString())}
                    >
                      <Text style={[styles.roleChipText, invRole === r.id.toString() && styles.roleChipTextSelected]}>{translateRoleName(r.name)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.adminButton} onPress={handleCreateInvitationCode} disabled={isCreatingInv}>
              <Text style={styles.adminButtonText}>{isCreatingInv ? 'Generando...' : 'Generar Código'}</Text>
            </TouchableOpacity>
          </View>

          {/* User Management Section */}
          <View style={styles.card}>
            <View style={styles.userMgmtHeader}>
              <Text style={styles.sectionTitle}>Gestión de Usuarios</Text>
              <TouchableOpacity onPress={() => setShowUserManagement(!showUserManagement)}>
                <Ionicons name={showUserManagement ? "chevron-up" : "chevron-down"} size={20} color={colors.adminHighlight} />
              </TouchableOpacity>
            </View>

            {showUserManagement && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Buscar por nombre o email..."
                  value={userSearch}
                  onChangeText={setUserSearch}
                />

                <ScrollView style={{ maxHeight: 350 }}>
                  {Array.isArray(userList) && userList.filter((u: any) => 
                    `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
                  ).map((u: any) => {
                    const isArchived = u.is_active === false || Number(u.is_active) === 0;
                    return (
                      <View key={u.id} style={[styles.userRow, isArchived && { backgroundColor: '#F9FAFB', opacity: 0.7 }]}>
                        <View style={styles.userInfo}>
                          <Text style={[styles.userName, isArchived && { color: colors.textLight }]}>{u.first_name} {u.last_name}</Text>
                          <Text style={styles.userEmail}>{u.email}</Text>
                          <View style={styles.userMeta}>
                            <View style={styles.roleBadge}>
                              <Text style={styles.roleBadgeText}>{translateRoleName(u.role?.name || 'User')}</Text>
                            </View>
                            {isArchived && (
                              <View style={styles.archivedBadge}>
                                <Text style={styles.archivedBadgeText}>Archivado</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.userActions}>
                          <TouchableOpacity style={styles.userActionBtn} onPress={() => handleEditUserRole(u)}>
                            <Ionicons name="create-outline" size={20} color={colors.primary} />
                          </TouchableOpacity>
                          {u.role?.name !== 'Admin' && (
                            <TouchableOpacity 
                              style={[styles.userActionBtn, isArchived && { backgroundColor: '#F0FDF4' }]} 
                              onPress={() => handleToggleUserActive(u)}
                            >
                              <Ionicons 
                                name={isArchived ? 'checkmark-circle-outline' : 'close-circle-outline'} 
                                size={20} 
                                color={isArchived ? '#10B981' : '#EF4444'} 
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Archived Issues Section */}
          <View style={styles.card}>
            <View style={styles.userMgmtHeader}>
              <Text style={styles.sectionTitle}>Reportes Archivados</Text>
              <TouchableOpacity onPress={() => setShowArchivedIssues(!showArchivedIssues)}>
                <Ionicons name={showArchivedIssues ? "chevron-up" : "chevron-down"} size={20} color={colors.adminHighlight} />
              </TouchableOpacity>
            </View>

            {showArchivedIssues && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Buscar reportes archivados..."
                  value={archivedSearch}
                  onChangeText={setArchivedSearch}
                />

                {loadingArchived ? (
                  <ActivityIndicator color={colors.adminHighlight} />
                ) : (
                  <ScrollView style={{ maxHeight: 350 }}>
                    {Array.isArray(archivedIssues?.data) && archivedIssues.data.filter((i: any) => 
                      i.title.toLowerCase().includes(archivedSearch.toLowerCase())
                    ).map((i: any) => (
                      <View key={i.id} style={styles.userRow}>
                        <View style={styles.userInfo}>
                          <Text style={styles.userName}>{i.title}</Text>
                          <Text style={styles.userEmail}>Motivo: {i.hidden_reason || 'Ninguno'}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.userActionBtn} 
                          onPress={() => toggleIssueHiddenMutation.mutate({ issueId: i.id })}
                        >
                          <Ionicons name="eye-outline" size={20} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    {(!archivedIssues?.data || archivedIssues.data.length === 0) && (
                      <Text style={styles.emptyText}>No hay reportes archivados</Text>
                    )}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {/* Send Campaign */}
          <CampaignSection />



        </View>
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Bottom Tabs */}
      <BottomTabBar activeTab="admin" />

    </View>
  );
}

function CampaignSection() {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const sendCampaignMutation = useSendCampaign();

  const handleSend = async () => {
    if (!title || !message) {
      Alert.alert('Error', 'Título y mensaje son obligatorios.');
      return;
    }

    try {
      await sendCampaignMutation.mutateAsync({ title, message });
      Alert.alert('Éxito', 'Campaña enviada a todos los usuarios.');
      setTitle('');
      setMessage('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Error al enviar campaña.');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Campaña de Notificación Masiva</Text>
      <Text style={styles.label}>Esta notificación se enviará a TODOS los usuarios.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Título del aviso"
        value={title}
        onChangeText={setTitle}
      />
      
      <TextInput
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
        placeholder="Mensaje de la campaña..."
        value={message}
        onChangeText={setMessage}
        multiline
      />

      <TouchableOpacity 
        style={[styles.adminButton, { backgroundColor: colors.adminHighlight }]} 
        onPress={handleSend} 
        disabled={sendCampaignMutation.isPending}
      >
        <Ionicons name="megaphone-outline" size={20} color="#FFF" />
        <Text style={styles.adminButtonText}>
          {sendCampaignMutation.isPending ? 'Enviando...' : 'Enviar Campaña Push'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerArea: { backgroundColor: colors.adminHighlight, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginTop: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { paddingBottom: 20 },
  contentPadding: { paddingHorizontal: 20, paddingTop: 20 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
  avatarPicker: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    overflow: 'hidden'
  },
  avatarPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  avatarPlaceholder: {
    alignItems: 'center'
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.textTitle, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, color: colors.textSub, marginBottom: 6, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textTitle, backgroundColor: '#F9FAFB', marginBottom: 12 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconCard: { width: 48, height: 48, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  iconCardSelected: { borderColor: colors.adminHighlight, backgroundColor: colors.adminHighlight + '15' },
  adminButton: { backgroundColor: colors.adminHighlight, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  adminButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 20,
  },
  roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  roleChipSelected: { borderColor: colors.adminHighlight, backgroundColor: colors.adminHighlight + '15' },
  roleChipText: { fontSize: 13, color: colors.textSub, fontWeight: '500' },
  roleChipTextSelected: { color: colors.adminHighlight, fontWeight: 'bold' },
  userMgmtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
});

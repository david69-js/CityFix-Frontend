import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, TextInput, Alert, ActivityIndicator, Share } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useAuthStore } from '../src/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import { useUpdateProfile } from '../src/hooks/useAuth';
import apiClient from '../src/api/axios';

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
                      color={categoryIcon === icon.value ? colors.primary : colors.textSub} 
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
              <Text style={styles.label}>Rol de Usuario <Text style={{color: colors.danger}}>*</Text></Text>
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



        </View>
        <View style={{ height: 110 }} />
      </ScrollView>

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
          <TouchableOpacity style={styles.fabButton} onPress={() => router.push('/report')}>
            <Ionicons name="add" size={32} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.tabLabel, { marginTop: 4 }]}>Reportar</Text>
        </View>

        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/profile')}>
          <Ionicons name="person-outline" size={24} color={colors.textLight} />
          <Text style={styles.tabLabel}>Perfil</Text>
        </TouchableOpacity>

        {user?.role_id === 1 && (
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={[styles.tabLabel, { color: colors.primary }]}>Admin</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerArea: { backgroundColor: colors.primary, paddingBottom: 20 },
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
  iconCardSelected: { borderColor: colors.primary, backgroundColor: '#EEF4FF' },
  adminButton: { backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, marginTop: 8 },
  adminButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 15, marginLeft: 8 },
  bottomTabBar: { boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 10, flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 25, paddingTop: 10, justifyContent: 'space-around', position: 'absolute', bottom: 0, width: '100%' },
  tabItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  tabItemCentral: { alignItems: 'center', justifyContent: 'flex-start', flex: 1, marginTop: -25 },
  tabLabel: { fontSize: 11, color: colors.textLight, fontWeight: '500', marginTop: 4 },
  fabButton: { backgroundColor: colors.primary, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 8, borderWidth: 4, borderColor: '#FFFFFF' },
  roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  roleChipSelected: { borderColor: colors.primary, backgroundColor: '#EEF4FF' },
  roleChipText: { fontSize: 13, color: colors.textSub, fontWeight: '500' },
  roleChipTextSelected: { color: colors.primary, fontWeight: 'bold' },
});

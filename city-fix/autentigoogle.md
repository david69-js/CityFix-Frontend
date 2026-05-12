# 🔐 Autenticación con Google Sign-In — CityFix iOS

Documentación paso a paso de cómo se configuró Google Sign-In en el proyecto CityFix usando Expo (development build) + React Native + Laravel backend.

---

## 📋 Requisitos previos

- Node.js instalado
- Xcode instalado (para iOS Simulator)
- CocoaPods instalado (`sudo gem install cocoapods`)
- Cuenta en [Google Cloud Console](https://console.cloud.google.com/)
- Proyecto Expo con development build (`expo-dev-client`)

---

## 1. Instalar dependencias

```bash
cd city-fix
npm install @react-native-google-signin/google-signin
npm install expo-dev-client
```

> ⚠️ Google Sign-In **NO funciona con Expo Go**. Requiere un **development build** (`npx expo run:ios`).

---

## 2. Crear credenciales en Google Cloud Console

Ir a: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

### 2.1 — Crear OAuth Client ID de tipo **Web**

1. Click en **"+ CREATE CREDENTIALS" → "OAuth client ID"**
2. Tipo: **Web application**
3. Nombre: `CityFix Web`
4. Guardar → Copiar el **Client ID**

> Este ID genera el `idToken` que el backend de Laravel valida.

### 2.2 — Crear OAuth Client ID de tipo **iOS**

1. Click en **"+ CREATE CREDENTIALS" → "OAuth client ID"**
2. Tipo: **iOS**
3. Nombre: `CityFix iOS`
4. **Bundle ID**: `com.davidtojalvarez.cityfix`
   - ⚠️ Debe coincidir **exactamente** con `ios.bundleIdentifier` en `app.json`
5. Guardar → Copiar el **Client ID**

> Este ID autoriza la app iOS a iniciar el flujo OAuth nativo.

### Resumen de IDs

| Tipo | Client ID | Para qué sirve |
|------|-----------|-----------------|
| Web | `204018854159-716lblmbqhntei19ggcrnug156jvj9ec.apps.googleusercontent.com` | `webClientId` — genera `idToken` para el backend |
| iOS | `204018854159-s3867dfu822t0atb21u04v8mbgfc2tbr.apps.googleusercontent.com` | `iosClientId` — autoriza el flujo OAuth en iOS |

> ⚠️ **NO puedes usar el mismo ID para ambos.** Google devuelve Error 400 si usas un Web ID como iOS ID.

---

## 3. Configurar variables de entorno

Archivo: `.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:8888/api
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=204018854159-716lblmbqhntei19ggcrnug156jvj9ec.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=204018854159-s3867dfu822t0atb21u04v8mbgfc2tbr.apps.googleusercontent.com
```

---

## 4. Configurar `app.json`

El plugin de Google Sign-In necesita el `iosUrlScheme`, que es el **iOS Client ID invertido**:

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.davidtojalvarez.cityfix"
    },
    "plugins": [
      "expo-router",
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "com.googleusercontent.apps.204018854159-s3867dfu822t0atb21u04v8mbgfc2tbr"
        }
      ]
    ]
  }
}
```

> 💡 El `iosUrlScheme` se registra en el `Info.plist` de iOS y permite que Google redirija de vuelta a la app después de autenticar.

---

## 5. Configurar Google Sign-In en `_layout.tsx`

```tsx
useEffect(() => {
  initializeAuth();

  // Initialize Google Sign-In safely
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

    if (webClientId && iosClientId) {
      GoogleSignin.configure({
        webClientId,
        iosClientId,
        offlineAccess: true,
      });
    }
  } catch (e) {
    console.warn('[RootLayout] Google Sign-In not available:', e);
  }
}, []);
```

> Se usa `require()` dinámico y `try/catch` para evitar crashes en Expo Go (donde el módulo nativo no existe).

---

## 6. Implementar el botón de Google Sign-In en `login.tsx`

```tsx
const handleGoogleLogin = async () => {
  try {
    let GoogleSignin;
    try {
      GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    } catch (e) {
      setErrorMessage('Google Sign-In no está disponible en este entorno.');
      return;
    }

    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;

    if (!idToken) {
      setErrorMessage('No se pudo obtener el token de Google.');
      return;
    }

    // Enviar idToken al backend Laravel para validar
    googleLoginMutation.mutate(idToken, {
      onSuccess: () => router.replace('/'),
      onError: () => setErrorMessage('Error al autenticar con el servidor.'),
    });
  } catch (error: any) {
    if (error.code !== 'SIGN_IN_CANCELLED') {
      setErrorMessage('Error al iniciar sesión con Google.');
    }
  }
};
```

---

## 7. Compilar y ejecutar

```bash
# Si cambiaste app.json, regenerar el proyecto nativo:
npx expo prebuild --clean

# Compilar y ejecutar en iOS Simulator:
npx expo run:ios
```

> ⚠️ **Siempre usa `npx expo run:ios`**, nunca `npx expo start` solo, porque Google Sign-In necesita los módulos nativos compilados.

---

## 🐛 Errores comunes y soluciones

### Error: `RNGoogleSignin could not be found`
**Causa:** Estás usando Expo Go en vez de un development build.
**Solución:** Usa `npx expo run:ios` en lugar de `npx expo start`.

### Error 400: `invalid_request` / `flowName=GeneralOAuthFlow`
**Causa:** Estás usando un Web Client ID como `iosClientId`. Son tipos diferentes.
**Solución:** Crea un OAuth Client ID de tipo **iOS** en Google Cloud Console con el Bundle ID correcto.

### Error: `Your app is missing support for the following URL schemes`
**Causa:** El `Info.plist` no tiene registrado el URL scheme correcto.
**Solución:**
1. Verificar que `iosUrlScheme` en `app.json` sea el iOS Client ID invertido
2. Ejecutar `npx expo prebuild --clean` para regenerar los archivos nativos
3. Reconstruir con `npx expo run:ios`

### Error: `GoogleService-Info.plist was not found and iosClientId was not provided`
**Causa:** No se pasó el `iosClientId` en `GoogleSignin.configure()`.
**Solución:** Agregar `iosClientId` al objeto de configuración (ver paso 5).

### Error: `npm install` falla con `EACCES`
**Causa:** El caché de npm tiene archivos con permisos de root (por usar `sudo npm install -g`).
**Solución:**
```bash
sudo chown -R $(whoami) ~/.npm
npm install
```

### Error: `expo: command not found`
**Causa:** `node_modules` no está instalado o está corrupto.
**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 📁 Archivos modificados

| Archivo | Descripción |
|---------|-------------|
| `.env` | Variables `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` y `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` |
| `app.json` | Plugin `@react-native-google-signin/google-signin` con `iosUrlScheme` |
| `app/_layout.tsx` | `GoogleSignin.configure()` con ambos Client IDs |
| `app/login.tsx` | `handleGoogleLogin()` con flujo completo |

---

## 🔗 Referencias

- [React Native Google Sign-In Docs](https://react-native-google-signin.github.io/docs/intro)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)

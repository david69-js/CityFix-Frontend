# 🗺️ Integración de Google Maps — CityFix

Guía paso a paso para configurar Google Maps real en la app móvil CityFix (Expo + React Native).

---

## 📋 Requisitos previos

- Node.js instalado
- Xcode instalado (para iOS)
- **CocoaPods instalado** (obligatorio para iOS)
- Cuenta en [Google Cloud Console](https://console.cloud.google.com/)
- Proyecto Expo con development build (`expo-dev-client`)

### Instalar CocoaPods (si no lo tienes)

```bash
# Opción 1: Con gem (recomendado)
sudo gem install cocoapods

# Opción 2: Con Homebrew
brew install cocoapods

# Verificar instalación
pod --version
```

> ⚠️ **Sin CocoaPods no puedes compilar la app para iOS.** Es un requisito de Apple para manejar dependencias nativas.

---

## 1. Habilitar APIs en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (el mismo de Google Auth)
3. Ve a **"APIs y servicios" → "Biblioteca"**
4. Busca y **habilita** estos 3 servicios:

| SDK | Para qué plataforma |
|-----|---------------------|
| **Maps SDK for iOS** | App iOS (iPhone/iPad) |
| **Maps SDK for Android** | App Android |
| **Maps JavaScript API** | Versión Web/Desktop |

> También deben estar habilitados **Geocoding API** y **Places API** (para el proxy del backend).

---

## 2. Crear la API Key

1. Ve a **"APIs y servicios" → "Credenciales"**
2. Click en **"+ CREAR CREDENCIALES" → "Clave de API"**
3. Se genera una clave (ej: `AIzaSy...`). **Cópiala.**

### Restringir la API Key (Seguridad)

Edita la clave y agrega restricciones por plataforma:

#### Para Android:
- Tipo: **Apps de Android**
- Nombre del paquete: `com.alexander.cityfix`
- Huella SHA-1: Obtener con `npx expo fetch:android:hashes`

#### Para iOS:
- Tipo: **Apps de iOS**
- Bundle ID: `com.davidtojalvarez.cityfix`

#### Para Web:
- Tipo: **Sitios web**
- URL: `http://localhost:19006` (desarrollo) o tu dominio de producción

### API Key del proyecto CityFix

```
AIzaSyD-ueEjBycEH0KeBRzekaMmQXwKtpaO6Qo
```

---

## 3. Instalar react-native-maps

```bash
cd city-fix
npx expo install react-native-maps
```

> Si `npx expo install` se queda colgado, usa directamente:
> ```bash
> npm install react-native-maps
> ```

---

## 4. Configurar `app.json`

Agregar la API Key en las secciones `ios` y `android`:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.davidtojalvarez.cityfix",
      "config": {
        "googleMapsApiKey": "AIzaSyD-ueEjBycEH0KeBRzekaMmQXwKtpaO6Qo"
      }
    },
    "android": {
      "package": "com.alexander.cityfix",
      "config": {
        "googleMaps": {
          "apiKey": "AIzaSyD-ueEjBycEH0KeBRzekaMmQXwKtpaO6Qo"
        }
      }
    }
  }
}
```

> ⚠️ **NO agregar `react-native-maps` al array de `plugins`** en `app.json`. Genera un error de sintaxis. Las keys en `ios.config` y `android.config` son suficientes para que Expo configure todo automáticamente.

---

## 5. Compilar y Ejecutar

Cada vez que cambies `app.json` o instales un paquete nativo, debes reconstruir:

```bash
# 1. Entrar al directorio del proyecto
cd city-fix

# 2. Limpiar y regenerar archivos nativos
npx expo prebuild --clean

# 3. Compilar y ejecutar en iOS
npx expo run:ios

# 4. O para Android
npx expo run:android
```

> ⚠️ Si el prebuild falla pidiendo CocoaPods, instálalo primero (ver sección de requisitos).

---

## 6. Código del Mapa (`app/map.tsx`)

### Imports principales

```tsx
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
```

### Región por defecto (Cochabamba, Bolivia)

```tsx
const DEFAULT_REGION = {
  latitude: -17.3895,
  longitude: -66.1568,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};
```

### Componente MapView

```tsx
<MapView
  ref={mapRef}
  style={StyleSheet.absoluteFill}
  provider={PROVIDER_GOOGLE}
  initialRegion={DEFAULT_REGION}
  showsUserLocation={true}
  showsMyLocationButton={false}
  showsCompass={true}
  mapType="standard"
>
  {issues.map(issue => (
    <Marker
      key={issue.id}
      coordinate={{
        latitude: Number(issue.latitude),
        longitude: Number(issue.longitude),
      }}
      pinColor={getMarkerColor(issue.status?.name)}
      title={issue.title}
      description={issue.location}
    >
      <Callout>
        <View style={{ width: 220, padding: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>{issue.title}</Text>
          <Text>📍 {issue.location}</Text>
        </View>
      </Callout>
    </Marker>
  ))}
</MapView>
```

### Colores de marcadores por estado

```tsx
const getMarkerColor = (statusName?: string): string => {
  if (!statusName) return '#3B82F6'; // azul
  const name = statusName.toLowerCase();
  if (name.includes('reportado') || name.includes('pendiente')) return '#F97316'; // naranja
  if (name.includes('proceso')) return '#3B82F6'; // azul
  if (name.includes('resuelto')) return '#10B981'; // verde
  return '#9CA3AF'; // gris
};
```

### Centrar en la ubicación del usuario

```tsx
const handleCenterOnUser = () => {
  if (userLocation && mapRef.current) {
    mapRef.current.animateToRegion({
      ...userLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 800);
  }
};
```

### Ajustar zoom a todos los markers

```tsx
const handleFitAll = () => {
  if (filteredReports.length > 0 && mapRef.current) {
    const coords = filteredReports
      .filter(r => r.latitude && r.longitude)
      .map(r => ({ latitude: r.latitude, longitude: r.longitude }));
    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
      animated: true,
    });
  }
};
```

---

## 7. Backend: Proxy de Google Maps

El backend actúa como proxy protegiendo la API Key del servidor. Los hooks del frontend se conectan a estos endpoints:

| Hook Frontend | Endpoint Backend | Descripción |
|---------------|-----------------|-------------|
| `useGeocode(address)` | `GET /api/maps/geocode` | Dirección → Coordenadas |
| `useReverseGeocode(lat, lng)` | `GET /api/maps/reverse-geocode` | Coordenadas → Dirección |
| `useReverseGeocodeMutation()` | `GET /api/maps/reverse-geocode` | Versión on-demand |
| `usePlacesAutocomplete(input)` | `GET /api/maps/places/autocomplete` | Autocompletado |
| `usePlaceDetails(placeId)` | `GET /api/maps/places/details` | Detalles de lugar |

> Todos requieren autenticación JWT (`Authorization: Bearer <token>`).

### Uso en `report.tsx` (Reverse Geocoding)

Al presionar "Obtener mi ubicación GPS", el frontend:
1. Obtiene las coordenadas del GPS del dispositivo
2. Llama al backend `/api/maps/reverse-geocode?lat=...&lng=...`
3. Rellena el campo de ubicación con la dirección legible (ej: "Av. América, Cochabamba")

```tsx
import { useReverseGeocodeMutation } from '../src/hooks/useMaps';

const reverseGeocodeMutation = useReverseGeocodeMutation();

// Dentro de handleFetchLocation:
const result = await reverseGeocodeMutation.mutateAsync({
  lat: location.coords.latitude,
  lng: location.coords.longitude,
});
if (result?.results?.[0]?.formatted_address) {
  setLocationText(result.results[0].formatted_address);
}
```

---

## 📁 Archivos Involucrados

| Archivo | Descripción |
|---------|-------------|
| `app.json` | API Keys de Google Maps para iOS y Android |
| `app/map.tsx` | Pantalla del mapa con Google Maps real |
| `app/report.tsx` | Reverse geocoding al obtener ubicación GPS |
| `src/hooks/useMaps.ts` | Hooks para el proxy de Google Maps del backend |

---

## 🐛 Errores comunes

### `AirGoogleMaps dir must be added to your xCode project`
**Causa:** Los pods de Google Maps no se instalaron correctamente.
**Solución:**
```bash
cd city-fix
rm -rf ios
npx expo prebuild --clean
npx expo run:ios
```

### `CocoaPods CLI not found in your PATH`
**Causa:** CocoaPods no está instalado en macOS.
**Solución:**
```bash
sudo gem install cocoapods
```

### `PluginError: Unable to resolve config plugin for react-native-maps`
**Causa:** Se agregó `react-native-maps` al array de `plugins` en `app.json`.
**Solución:** **NO ponerlo en plugins.** Solo poner la API Key en `ios.config.googleMapsApiKey` y `android.config.googleMaps.apiKey`.

### El mapa se ve pero sin estilo de Google (mapa en blanco/gris)
**Causa:** La API Key no tiene habilitado el SDK correspondiente.
**Solución:** Ir a Google Cloud Console → APIs y servicios → Biblioteca → Habilitar "Maps SDK for iOS" / "Maps SDK for Android".

### `PROVIDER_GOOGLE` no funciona en iOS Simulator
**Causa:** Algunos simuladores antiguos no soportan Google Maps.
**Solución:** Probar en un dispositivo real o quitar `provider={PROVIDER_GOOGLE}` para usar Apple Maps en iOS (funciona sin API Key).

---

## 🔗 Referencias

- [react-native-maps Docs](https://github.com/react-native-maps/react-native-maps)
- [Expo MapView](https://docs.expo.dev/versions/latest/sdk/map-view/)
- [Google Cloud Console - APIs](https://console.cloud.google.com/apis/library)
- [CocoaPods](https://cocoapods.org/)

# Guía de Implementación — Reportes PDF

## Rutas disponibles (admin, auth requerido)

| Reporte | Método | Ruta |
|---------|--------|------|
| Resumen | GET | `/admin/reports/pdf/summary` |
| Por categoría | GET | `/admin/reports/pdf/by-category` |
| Por trabajador | GET | `/admin/reports/pdf/by-worker` |
| Por fecha | GET | `/admin/reports/pdf/by-date` |
| Tiempos de resolución | GET | `/admin/reports/pdf/resolution-times` |
| Detalle de incidencias | GET | `/admin/reports/pdf/details` |

Todas aceptan los mismos filtros que las versiones JSON:
- `from` / `to` (YYYY-MM-DD, default: último mes → hoy)
- `category_id`, `worker_id`, `status_id` (según el reporte)
- `group_by` (day/week/month) — solo en by-date
- `per_page`, `page` — solo en details

---

## Implementación en React Native

### 1. Agregar dependencias

```bash
npx expo install expo-file-system expo-sharing expo-print
```

### 2. Hook para descargar PDFs

Crear `src/hooks/useDownloadPdf.ts`:

```ts
import { useCallback, useState } from 'react';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import apiClient from '../api/axios';

export const useDownloadPdf = () => {
  const [loading, setLoading] = useState(false);

  const downloadPdf = useCallback(async (endpoint: string, filename: string, params?: Record<string, any>) => {
    setLoading(true);
    try {
      const response = await apiClient.get(endpoint, {
        params,
        responseType: 'arraybuffer',
      });

      const base64 = btoa(
        new Uint8Array(response.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ''
        )
      );

      const uri = FileSystem.cacheDirectory + filename;
      await FileSystem.writeAsStringAsync(uri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Guardar reporte PDF',
      });
    } catch (error) {
      console.error('Error descargando PDF:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { downloadPdf, loading };
};
```

### 3. Agregar botones a la pantalla de reportes

En `app/admin-reports.tsx`, agregar botones de descarga. Ejemplo para el resumen:

```tsx
import { useDownloadPdf } from '../src/hooks/useDownloadPdf';

// Dentro del componente:
const { downloadPdf, loading } = useDownloadPdf();

// Botón de descarga:
<TouchableOpacity
  onPress={() => downloadPdf(
    '/admin/reports/pdf/summary',
    `reporte-${dateRange.from}-${dateRange.to}.pdf`,
    { from: dateRange.from, to: dateRange.to }
  )}
  disabled={loading}
  style={styles.downloadButton}
>
  <Ionicons name="download-outline" size={20} color="#FFF" />
  <Text style={styles.downloadText}>
    {loading ? 'Descargando...' : 'Descargar PDF'}
  </Text>
</TouchableOpacity>
```

### 4. Alternativa: vista previa antes de compartir

Si querés previsualizar en lugar de compartir directamente:

```ts
import * as Print from 'expo-print';

const uri = FileSystem.cacheDirectory + filename;
await FileSystem.writeAsStringAsync(uri, base64, {
  encoding: FileSystem.EncodingType.Base64,
});

await Print.printAsync({ uri });
```

---

## Notas

- Los PDFs se generan del lado del servidor con **DomPDF**
- Cada llamada es una descarga directa del archivo
- Los mismos parámetros de filtro de los endpoints JSON funcionan en los PDF
- Tamaño aproximado: 2–8 KB por reporte

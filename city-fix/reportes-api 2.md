# Módulo de Reportes — Guía de Integración Frontend

## Base URL

```
http://localhost:8888/api/admin/reports
```

Todos los endpoints requieren **token JWT de Admin** en el header:

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Resumen General

```
GET /api/admin/reports/summary?from=2026-01-01&to=2026-05-13
```

**Parámetros opcionales:**
| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | string (YYYY-MM-DD) | hace 1 mes | Fecha inicio |
| `to` | string (YYYY-MM-DD) | hoy | Fecha fin |

**Respuesta:**

```json
{
  "from": "2026-04-14",
  "to": "2026-05-14 23:59:59",
  "total_issues": 177,
  "by_status": [
    { "status": "Pendiente", "total": 59 },
    { "status": "En proceso", "total": 54 },
    { "status": "Resuelto", "total": 64 }
  ],
  "by_category": [
    { "category": "Baches", "total": 14 },
    { "category": "Fuga de Agua", "total": 19 }
  ],
  "total_upvotes": 423,
  "total_comments": 2776,
  "total_workers_assigned": 3,
  "avg_resolution_time_hours": 61.13
}
```

---

### 2. Reporte por Categoría

```
GET /api/admin/reports/by-category?from=2026-01-01&to=2026-05-13&category_id=1
```

**Parámetros:**
| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | string | hace 1 mes | |
| `to` | string | hoy | |
| `category_id` | int | todos | Filtrar por categoría específica |

**Respuesta:**

```json
{
  "from": "2026-04-01",
  "to": "2026-05-14 23:59:59",
  "data": [
    {
      "category": "Baches",
      "total": 17,
      "by_status": [
        { "status": "Pendiente", "total": 8 },
        { "status": "Resuelto", "total": 5 },
        { "status": "En proceso", "total": 4 }
      ],
      "resolved_count": 5,
      "avg_resolution_time_hours": 62.4
    }
  ]
}
```

- Si `category_id` se omite, devuelve **todas las categorías**.
- `resolved_count` = issues con status "Resuelto".
- `avg_resolution_time_hours` = tiempo promedio desde creado hasta resuelto.

---

### 3. Reporte por Trabajador

```
GET /api/admin/reports/by-worker?from=2026-01-01&to=2026-05-13&worker_id=3
```

**Parámetros:**
| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | string | hace 1 mes | |
| `to` | string | hoy | |
| `worker_id` | int | todos | Filtrar por worker específico |

**Respuesta:**

```json
{
  "from": "2026-04-01",
  "to": "2026-05-14 23:59:59",
  "data": [
    {
      "worker": {
        "id": 3,
        "first_name": "Carlos",
        "last_name": "Garcia",
        "email": "carlos.worker@test.com"
      },
      "total_assigned": 3,
      "completed_count": 0,
      "issues_resolved": 1,
      "categories_worked": [
        { "category": "Infraestructura", "total": 2 },
        { "category": "Alumbrado Público", "total": 1 }
      ],
      "avg_completion_time_hours": 0.9
    }
  ]
}
```

- `total_assigned` = asignaciones recibidas en el rango.
- `completed_count` = asignaciones marcadas "Completed".
- `issues_resolved` = issues conectados que llegaron a "Resuelto".
- `avg_completion_time_hours` = tiempo entre assigned_at y resolución del issue.
- Si `worker_id` se omite, devuelve **todos los workers** con asignaciones en el rango.

---

### 4. Reporte por Fecha (Serie Temporal)

```
GET /api/admin/reports/by-date?from=2026-01-01&to=2026-05-13&group_by=month
```

**Parámetros:**
| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | string | hace 1 mes | |
| `to` | string | hoy | |
| `group_by` | string | `day` | `day`, `week`, o `month` |

**Respuesta:**

```json
{
  "from": "2026-04-01",
  "to": "2026-05-14 23:59:59",
  "group_by": "month",
  "created": [
    { "period": "2026-04", "total": 112 },
    { "period": "2026-05", "total": 75 }
  ],
  "resolved": [
    { "period": "2026-04", "total": 40 },
    { "period": "2026-05", "total": 26 }
  ]
}
```

- `group_by=day` → period = `"2026-05-13"`
- `group_by=week` → period = `"2026-W19"` (ISO year-week)
- `group_by=month` → period = `"2026-05"`

---

### 5. Tiempos de Resolución

```
GET /api/admin/reports/resolution-times?from=2026-01-01&to=2026-05-13&category_id=2
```

**Parámetros:**
| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | string | hace 1 mes | |
| `to` | string | hoy | |
| `category_id` | int | todas | Filtrar por categoría |

**Respuesta:**

```json
{
  "from": "2026-04-01",
  "to": "2026-05-14 23:59:59",
  "issues_resolved": 66,
  "avg_hours": 61.09,
  "min_hours": 0,
  "max_hours": 120,
  "by_worker": [
    {
      "worker": {
        "id": 3,
        "first_name": "Carlos",
        "last_name": "Garcia",
        "email": "carlos.worker@test.com"
      },
      "issues_resolved": 1,
      "avg_resolution_time_hours": 0.03
    }
  ]
}
```

---

### 6. Reporte Detallado (Exportable)

```
GET /api/admin/reports/details?from=2026-01-01&to=2026-05-13&status_id=3&category_id=2&worker_id=5&per_page=50&page=1
```

**Parámetros:**
| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `from` | string | hace 1 mes | |
| `to` | string | hoy | |
| `status_id` | int | todos | Filtrar por status |
| `category_id` | int | todas | Filtrar por categoría |
| `worker_id` | int | todos | Filtrar por usuario creador |
| `per_page` | int | 50 | Resultados por página |
| `page` | int | 1 | Número de página |

**Respuesta:**

```json
{
  "current_page": 1,
  "data": [
    {
      "id": 92,
      "title": "Bache peligroso en la esquina",
      "category": "Baches",
      "status": "Resuelto",
      "created_by": "Juan Pérez",
      "created_at": "2026-05-12 19:13:15",
      "resolution_time_hours": 24,
      "assigned_worker": {
        "id": 3,
        "first_name": "Carlos",
        "last_name": "Garcia"
      },
      "upvotes_count": 2,
      "comments_count": 20,
      "location": "Av. Reforma, Ciudad de México"
    }
  ],
  "per_page": 50,
  "total": 187,
  "last_page": 4
}
```

- Si `assigned_worker` es `null`, el issue no tiene worker asignado.
- Si `resolution_time_hours` es `null`, el issue no está resuelto.
- Este endpoint es ideal para **exportar a CSV/Excel**: paginá todas las páginas y concatenás los `data`.

---

## TypeScript Types

```typescript
// reportes-api.types.ts

interface DateRange {
  from: string
  to: string
}

interface StatusSummary {
  status: string
  total: number
}

interface CategorySummary {
  category: string
  total: number
}

// GET /summary
interface ReportSummary extends DateRange {
  total_issues: number
  by_status: StatusSummary[]
  by_category: CategorySummary[]
  total_upvotes: number
  total_comments: number
  total_workers_assigned: number
  avg_resolution_time_hours: number | null
}

// GET /by-category
interface CategoryReportItem {
  category: string
  total: number
  by_status: StatusSummary[]
  resolved_count: number
  avg_resolution_time_hours: number | null
}
interface CategoryReport extends DateRange {
  data: CategoryReportItem[]
}

// GET /by-worker
interface WorkerInfo {
  id: number
  first_name: string
  last_name: string
  email: string
}
interface WorkerCategory {
  category: string
  total: number
}
interface WorkerReportItem {
  worker: WorkerInfo
  total_assigned: number
  completed_count: number
  issues_resolved: number
  categories_worked: WorkerCategory[]
  avg_completion_time_hours: number | null
}
interface WorkerReport extends DateRange {
  data: WorkerReportItem[]
}

// GET /by-date
interface DateDataPoint {
  period: string
  total: number
}
interface DateReport extends DateRange {
  group_by: string
  created: DateDataPoint[]
  resolved: DateDataPoint[]
}

// GET /resolution-times
interface WorkerResolution {
  worker: WorkerInfo
  issues_resolved: number
  avg_resolution_time_hours: number | null
}
interface ResolutionReport extends DateRange {
  issues_resolved: number
  avg_hours: number | null
  min_hours: number | null
  max_hours: number | null
  by_worker: WorkerResolution[]
}

// GET /details
interface IssueDetail {
  id: number
  title: string
  category: string
  status: string
  created_by: string | null
  created_at: string
  resolution_time_hours: number | null
  assigned_worker: { id: number; first_name: string; last_name: string } | null
  upvotes_count: number
  comments_count: number
  location: string | null
}
interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  per_page: number
  total: number
  last_page: number
  next_page_url: string | null
  prev_page_url: string | null
}
```

---

## Ejemplo de Implementación (React Native / Expo)

```typescript
// api/reports.ts
import api from './client' // tu instancia de axios con interceptors

const DEFAULT_FROM = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const DEFAULT_TO = new Date().toISOString().split('T')[0]

export const ReportsService = {
  summary: (from = DEFAULT_FROM, to = DEFAULT_TO) =>
    api.get<ReportSummary>('/admin/reports/summary', { params: { from, to } }),

  byCategory: (params?: { from?: string; to?: string; category_id?: number }) =>
    api.get<CategoryReport>('/admin/reports/by-category', { params }),

  byWorker: (params?: { from?: string; to?: string; worker_id?: number }) =>
    api.get<WorkerReport>('/admin/reports/by-worker', { params }),

  byDate: (params?: { from?: string; to?: string; group_by?: 'day' | 'week' | 'month' }) =>
    api.get<DateReport>('/admin/reports/by-date', { params }),

  resolutionTimes: (params?: { from?: string; to?: string; category_id?: number }) =>
    api.get<ResolutionReport>('/admin/reports/resolution-times', { params }),

  details: (params?: {
    from?: string; to?: string;
    status_id?: number; category_id?: number;
    worker_id?: number; per_page?: number; page?: number;
  }) =>
    api.get<PaginatedResponse<IssueDetail>>('/admin/reports/details', { params }),
}
```

---

## Dashboard Sugerido (Pantallas)

1. **Dashboard General**
   - Cards con total_issues, total_resueltos, avg_resolution_time, workers activos
   - Gráfica de pastel `by_status`
   - Gráfica de barras `by_category`

2. **Reporte por Categoría**
   - Selector de categoría (dropdown/tabs)
   - Tabla con by_status + resolved_count + avg time
   - Barra de tiempo con `avg_resolution_time_hours`

3. **Rendimiento de Workers**
   - Lista de workers con total_assigned, completed, issues_resolved
   - Tap para expandir y ver `categories_worked`

4. **Tendencias**
   - Línea temporal `by-date` (created vs resolved)
   - Selector day/week/month

5. **Exportación**
   - Pantalla con filtros (status, categoría, fechas)
   - Botón "Exportar CSV" → paginar `details` y convertir a CSV

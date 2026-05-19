import { useCallback, useState } from 'react';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import apiClient from '../api/axios';

const buildHtmlTemplate = (title: string, content: string, from?: any, to?: any) => {
  const formattedFrom = (typeof from === 'string') ? from.split(' ')[0] : '';
  const formattedTo = (typeof to === 'string') ? to.split(' ')[0] : '';
  const currentTime = new Date().toLocaleString();
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
      <style>
          body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1e293b; padding: 20px; font-size: 14px; line-height: 1.5; }
          .header { border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 24px; text-align: center; }
          h1 { color: #ef4444; margin: 0 0 6px 0; font-size: 26px; font-weight: bold; }
          .subtitle { color: #64748b; font-size: 14px; margin: 0; }
          .meta-table { width: 100%; margin-bottom: 24px; border-collapse: collapse; }
          .meta-table td { padding: 6px 0; color: #475569; }
          .section-title { font-size: 18px; font-weight: bold; color: #0f172a; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          table.data-table th { background-color: #f8fafc; color: #475569; font-weight: bold; text-align: left; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 12px; text-transform: uppercase; }
          table.data-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; color: #334155; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; color: #ffffff; }
          .badge-pending { background-color: #f59e0b; }
          .badge-progress { background-color: #3b82f6; }
          .badge-resolved { background-color: #10b981; }
          .grid { width: 100%; margin-bottom: 20px; }
          .grid td { width: 50%; vertical-align: top; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          .card-title { font-size: 14px; color: #64748b; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; }
          .card-value { font-size: 22px; color: #0f172a; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
      </style>
  </head>
  <body>
      <div class="header">
          <h1>${title}</h1>
          <p class="subtitle">Reporte de Gestión Urbana — CityFix</p>
          <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 12px;">Rango de fechas: ${formattedFrom} al ${formattedTo}</p>
      </div>
      
      ${content}
      
      <div class="footer">
          Documento oficial generado electrónicamente por la plataforma de administración CityFix el ${currentTime}
      </div>
  </body>
  </html>
  `;
};

const generateSummaryHtml = (data: any, from?: string, to?: string) => {
  const gridHtml = `
  <table class="grid">
      <tr>
          <td>
              <div class="card" style="margin-right: 8px;">
                  <div class="card-title">Total Reportes</div>
                  <div class="card-value">${data.total_issues}</div>
              </div>
          </td>
          <td>
              <div class="card" style="margin-left: 8px;">
                  <div class="card-title">Tiempo Prom. Resolución</div>
                  <div class="card-value">${data.avg_resolution_time_hours?.toFixed(1) ?? '0'} hrs</div>
              </div>
          </td>
      </tr>
      <tr>
          <td>
              <div class="card" style="margin-right: 8px;">
                  <div class="card-title">Votos Totales (Upvotes)</div>
                  <div class="card-value">${data.total_upvotes}</div>
              </div>
          </td>
          <td>
              <div class="card" style="margin-left: 8px;">
                  <div class="card-title">Total Comentarios</div>
                  <div class="card-value">${data.total_comments}</div>
              </div>
          </td>
      </tr>
  </table>`;

  const statusRows = (data.by_status || []).map((s: any) => {
    const badgeClass = s.status === 'Resuelto' ? 'badge-resolved' : (s.status === 'En proceso' ? 'badge-progress' : 'badge-pending');
    return `
    <tr>
        <td>${s.status}</td>
        <td><span class="badge ${badgeClass}">${s.total} reportes</span></td>
    </tr>`;
  }).join('');

  const categoryRows = (data.by_category || []).map((c: any) => `
  <tr>
      <td>${c.category}</td>
      <td>${c.total} incidencias</td>
  </tr>`).join('');

  const content = gridHtml + `
  <table class="grid" style="margin-top: 10px;">
      <tr>
          <td style="padding-right: 10px;">
              <div class="section-title">Por Estado</div>
              <table class="data-table">
                  <thead>
                      <tr>
                          <th>Estado</th>
                          <th>Cantidad</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${statusRows || '<tr><td colspan="2" style="text-align: center;">No hay datos</td></tr>'}
                  </tbody>
              </table>
          </td>
          <td style="padding-left: 10px;">
              <div class="section-title">Por Categoría</div>
              <table class="data-table">
                  <thead>
                      <tr>
                          <th>Categoría</th>
                          <th>Cantidad</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${categoryRows || '<tr><td colspan="2" style="text-align: center;">No hay datos</td></tr>'}
                  </tbody>
              </table>
          </td>
      </tr>
  </table>`;

  return buildHtmlTemplate('Resumen General de Actividad', content, from || data?.from, to || data?.to);
};

const generateByCategoryHtml = (data: any, from?: string, to?: string) => {
  const rows = (data.data || []).map((item: any) => {
    const statusStr = (item.by_status || []).map((s: any) => `${s.status}: ${s.total}`).join(' | ');
    return `
    <tr>
        <td><strong>${item.category}</strong></td>
        <td>${item.total}</td>
        <td>${statusStr || 'Ninguno'}</td>
        <td><span style="color: #10b981; font-weight: bold;">${item.resolved_count}</span></td>
        <td>${item.avg_resolution_time_hours?.toFixed(1) ?? 'N/A'} hrs</td>
    </tr>`;
  }).join('');

  const content = `
  <div class="section-title">Incidencias por Categoría</div>
  <table class="data-table">
      <thead>
          <tr>
              <th>Categoría</th>
              <th>Total</th>
              <th>Por Estado</th>
              <th>Resueltos</th>
              <th>T. Prom. Res.</th>
          </tr>
      </thead>
      <tbody>
          ${rows || '<tr><td colspan="5" style="text-align: center;">No hay datos disponibles</td></tr>'}
      </tbody>
  </table>`;

  return buildHtmlTemplate('Reporte de Incidencias por Categoría', content, from || data?.from, to || data?.to);
};

const generateByWorkerHtml = (data: any, from?: string, to?: string) => {
  const rows = (data.data || []).map((item: any) => {
    const catStr = (item.categories_worked || []).map((c: any) => `${c.category} (${c.total})`).join(', ');
    return `
    <tr>
        <td>
            <strong>${item.worker.first_name} ${item.worker.last_name || ''}</strong><br/>
            <small style="color: #64748b;">${item.worker.email}</small>
        </td>
        <td>${item.total_assigned}</td>
        <td>${item.completed_count}</td>
        <td><span style="color: #10b981; font-weight: bold;">${item.issues_resolved}</span></td>
        <td>${item.avg_completion_time_hours?.toFixed(1) ?? 'N/A'} hrs</td>
        <td style="font-size: 11px; max-width: 150px;">${catStr || 'Ninguna'}</td>
    </tr>`;
  }).join('');

  const content = `
  <div class="section-title">Desempeño del Personal Operativo</div>
  <table class="data-table">
      <thead>
          <tr>
              <th>Trabajador</th>
              <th>Asignados</th>
              <th>Completados</th>
              <th>Resueltos</th>
              <th>T. Promedio</th>
              <th>Categorías</th>
          </tr>
      </thead>
      <tbody>
          ${rows || '<tr><td colspan="6" style="text-align: center;">No hay datos disponibles</td></tr>'}
      </tbody>
  </table>`;

  return buildHtmlTemplate('Rendimiento y Asignación de Trabajadores', content, from || data?.from, to || data?.to);
};

const generateByDateHtml = (data: any, from?: string, to?: string) => {
  const createdMap = new Map((data.created || []).map((c: any) => [c.period, c.total]));
  const resolvedMap = new Map((data.resolved || []).map((r: any) => [r.period, r.total]));
  
  const allPeriods = Array.from(new Set([
    ...(data.created || []).map((c: any) => c.period),
    ...(data.resolved || []).map((r: any) => r.period)
  ])).sort();

  const rows = allPeriods.map((period: any) => {
    const created = createdMap.get(period) || 0;
    const resolved = resolvedMap.get(period) || 0;
    return `
    <tr>
        <td>${period}</td>
        <td><span style="color: #ef4444; font-weight: bold;">+ ${created}</span></td>
        <td><span style="color: #10b981; font-weight: bold;">- ${resolved}</span></td>
        <td>${created - resolved}</td>
    </tr>`;
  }).join('');

  const content = `
  <div class="section-title">Tendencia Temporal (Agrupado por: ${data.group_by || 'day'})</div>
  <table class="data-table">
      <thead>
          <tr>
              <th>Período</th>
              <th>Incidencias Creadas</th>
              <th>Incidencias Resueltas</th>
              <th>Balance</th>
          </tr>
      </thead>
      <tbody>
          ${rows || '<tr><td colspan="4" style="text-align: center;">No hay datos disponibles</td></tr>'}
      </tbody>
  </table>`;

  return buildHtmlTemplate('Histórico de Flujo de Incidencias', content, from || data?.from, to || data?.to);
};

const generateResolutionTimesHtml = (data: any, from?: string, to?: string) => {
  const gridHtml = `
  <table class="grid">
      <tr>
          <td>
              <div class="card" style="margin-right: 8px;">
                  <div class="card-title">Incidencias Resueltas</div>
                  <div class="card-value">${data.issues_resolved}</div>
              </div>
          </td>
          <td>
              <div class="card" style="margin-left: 8px;">
                  <div class="card-title">Tiempo Prom. Resolución</div>
                  <div class="card-value">${data.avg_hours?.toFixed(1) ?? 'N/A'} hrs</div>
              </div>
          </td>
      </tr>
      <tr>
          <td>
              <div class="card" style="margin-right: 8px;">
                  <div class="card-title">Resolución Más Rápida</div>
                  <div class="card-value">${data.min_hours?.toFixed(1) ?? 'N/A'} hrs</div>
              </div>
          </td>
          <td>
              <div class="card" style="margin-left: 8px;">
                  <div class="card-title">Resolución Más Lenta</div>
                  <div class="card-value">${data.max_hours?.toFixed(1) ?? 'N/A'} hrs</div>
              </div>
          </td>
      </tr>
  </table>`;

  const rows = (data.by_worker || []).map((item: any) => `
  <tr>
      <td><strong>${item.worker.first_name} ${item.worker.last_name || ''}</strong></td>
      <td>${item.issues_resolved}</td>
      <td>${item.avg_resolution_time_hours?.toFixed(1) ?? 'N/A'} hrs</td>
  </tr>`).join('');

  const content = gridHtml + `
  <div class="section-title">Tiempos de Resolución por Trabajador</div>
  <table class="data-table">
      <thead>
          <tr>
              <th>Trabajador</th>
              <th>Resueltos</th>
              <th>Tiempo Promedio</th>
          </tr>
      </thead>
      <tbody>
          ${rows || '<tr><td colspan="3" style="text-align: center;">No hay datos por trabajador disponibles</td></tr>'}
      </tbody>
  </table>`;

  return buildHtmlTemplate('Métricas y Tiempos de Resolución', content, from || data?.from, to || data?.to);
};

const generateDetailsHtml = (data: any, from?: string, to?: string) => {
  const rows = (data.data || []).map((issue: any) => {
    const workerName = issue.assigned_worker ? `${issue.assigned_worker.first_name} ${issue.assigned_worker.last_name || ''}` : 'Sin asignar';
    const shortDate = issue.created_at ? issue.created_at.split(' ')[0] : 'N/A';
    return `
    <tr>
        <td>#${issue.id}</td>
        <td>
            <strong>${issue.title}</strong><br/>
            <small style="color: #64748b;">Ubicación: ${issue.location || 'No especificada'}</small>
        </td>
        <td>${issue.category}</td>
        <td>${issue.status}</td>
        <td>${workerName}</td>
        <td>${issue.resolution_time_hours?.toFixed(1) ?? 'N/A'} hrs</td>
        <td style="font-size: 11px;">${shortDate}</td>
    </tr>`;
  }).join('');

  const content = `
  <div class="section-title">Listado Detallado de Incidencias (${data.total || 0} totales)</div>
  <table class="data-table" style="font-size: 11px;">
      <thead>
          <tr>
              <th>ID</th>
              <th>Incidencia</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Trabajador</th>
              <th>Resolución</th>
              <th>Fecha</th>
          </tr>
      </thead>
      <tbody>
          ${rows || '<tr><td colspan="7" style="text-align: center;">No hay incidencias que coincidan con los filtros</td></tr>'}
      </tbody>
  </table>`;

  return buildHtmlTemplate('Detalle del Registro de Incidencias', content, from || data?.from, to || data?.to);
};

export const useDownloadPdf = () => {
  const [loading, setLoading] = useState(false);

  const downloadPdf = useCallback(async (endpoint: string, filename: string, params?: Record<string, any>) => {
    setLoading(true);
    try {
      // Replaces the PDF generation URL with the raw JSON endpoint
      // E.g. '/admin/reports/pdf/summary' -> '/admin/reports/summary'
      const jsonEndpoint = endpoint.replace('/pdf/', '/');
      
      const response = await apiClient.get(jsonEndpoint, {
        params,
      });

      const reportData = response.data;
      let html = '';

      if (endpoint.includes('/summary')) {
        html = generateSummaryHtml(reportData, params?.from, params?.to);
      } else if (endpoint.includes('/by-category')) {
        html = generateByCategoryHtml(reportData, params?.from, params?.to);
      } else if (endpoint.includes('/by-worker')) {
        html = generateByWorkerHtml(reportData, params?.from, params?.to);
      } else if (endpoint.includes('/by-date')) {
        html = generateByDateHtml(reportData, params?.from, params?.to);
      } else if (endpoint.includes('/resolution-times')) {
        html = generateResolutionTimesHtml(reportData, params?.from, params?.to);
      } else if (endpoint.includes('/details')) {
        html = generateDetailsHtml(reportData, params?.from, params?.to);
      } else {
        throw new Error('Tipo de reporte no soportado en la app cliente.');
      }

      // Generate the PDF file on the client
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      // Share the compiled PDF using the native system dialog
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: 'Compartir reporte en PDF'
        });
      }
    } catch (error) {
      console.error('Error generando PDF en el cliente:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { downloadPdf, loading };
};

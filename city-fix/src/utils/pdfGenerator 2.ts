import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Issue } from '../types/api';
import { formatDate } from './date';
import { fixImageUrl } from './helpers';

export const generateIssueDetailPDF = async (issue: Issue) => {
  try {
    const imageUrl = fixImageUrl(issue.image);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; }
            h1 { color: #2065ff; text-align: center; }
            .header { border-bottom: 2px solid #2065ff; padding-bottom: 10px; margin-bottom: 20px; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #666; font-size: 14px; }
            .value { font-size: 16px; margin-top: 4px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
            img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Detalle de Reporte - CityFix</h1>
            <p style="text-align: center; color: #666;">ID: #${issue.id} | Generado el: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="section">
            <div class="label">Título</div>
            <div class="value">${issue.title}</div>
          </div>
          
          <div class="section">
            <div class="label">Descripción</div>
            <div class="value">${issue.description || 'Sin descripción'}</div>
          </div>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td>
                <div class="label">Estado</div>
                <div class="value badge" style="background-color: ${issue.status?.color || '#eee'}; color: white;">${issue.status?.name || 'Pendiente'}</div>
              </td>
              <td>
                <div class="label">Categoría</div>
                <div class="value badge" style="background-color: #eee; color: #333;">${issue.category?.name || 'General'}</div>
              </td>
            </tr>
          </table>
          
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td>
                <div class="label">Reportado por</div>
                <div class="value">${issue.user?.first_name} ${issue.user?.last_name || ''}</div>
              </td>
              <td>
                <div class="label">Fecha de creación</div>
                <div class="value">${formatDate(issue.created_at)}</div>
              </td>
            </tr>
          </table>

          ${issue.worker ? `
          <div class="section">
            <div class="label">Asignado a</div>
            <div class="value">${issue.worker.first_name} ${issue.worker.last_name || ''}</div>
          </div>
          ` : ''}

          <div class="section">
            <div class="label">Ubicación</div>
            <div class="value">${issue.address || 'Ubicación no especificada'}</div>
            <div style="font-size: 12px; color: #666;">Lat: ${issue.latitude}, Lng: ${issue.longitude}</div>
          </div>

          ${imageUrl ? `
          <div class="section">
            <div class="label">Imagen de evidencia</div>
            <img src="${imageUrl}" alt="Evidencia del reporte" />
          </div>
          ` : ''}

          <div class="footer">
            Documento generado por CityFix App
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir reporte en PDF'
      });
    }
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw error;
  }
};

export const generateSummaryPDF = async (issues: Issue[], filterName: string = 'Todos') => {
  try {
    let rowsHtml = '';
    
    issues.forEach(issue => {
      rowsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">#${issue.id}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${issue.title}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">
            <span style="background-color: ${issue.status?.color || '#eee'}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
              ${issue.status?.name || 'Pendiente'}
            </span>
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(issue.created_at)}</td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; }
            h1 { color: #2065ff; text-align: center; margin-bottom: 5px; }
            .header { border-bottom: 2px solid #2065ff; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th { text-align: left; background-color: #f8fafc; padding: 10px 8px; border-bottom: 2px solid #ddd; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Resumen de Reportes</h1>
            <p style="text-align: center; color: #666; margin-top: 0;">Filtro: ${filterName} | Total: ${issues.length}</p>
            <p style="text-align: center; font-size: 12px; color: #999;">Generado el: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Título</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="4" style="text-align: center; padding: 20px;">No hay reportes para este filtro.</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            Documento generado por CityFix App
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir resumen en PDF'
      });
    }
  } catch (error) {
    console.error('Error generando resumen PDF:', error);
    throw error;
  }
};

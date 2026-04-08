/**
 * Serviço de Exportação de Análises
 * Suporta múltiplos formatos: Excel, JSON, CSV, PDF
 */

import * as XLSX from 'xlsx';

export type ExportFormat = 'json' | 'xlsx' | 'csv' | 'html';

export interface ExportData {
  projectId: string;
  projectName: string;
  projectDescription?: string;
  exportedAt: string;
  exportedBy?: string;
  totalResponses: number;
  collectionPeriod?: {
    startDate: string;
    endDate: string;
  };
  qualityScore: number;
  sampleSize: number;
  quotas?: Array<{
    id: string;
    name: string;
    target: number;
    achieved: number;
    percentage: number;
  }>;
  questions: Array<{
    id: string;
    question: string;
    type: string;
    responses: number;
  }>;
  mainInsights: {
    summary?: any;
    keyInsights?: string[];
    questionAnalysis?: any[];
  };
  methodologyResults: Record<string, any>;
  selectedMethodologies: string[];
  responses?: Array<{
    id: string;
    timestamp: string;
    answers: Record<string, any>;
    timeSpent: number;
  }>;
}

export class ExportService {
  /**
   * Exportar em formato JSON
   */
  static exportJSON(data: ExportData): Blob {
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  }

  /**
   * Exportar em formato CSV
   */
  static exportCSV(data: ExportData): Blob {
    const lines: string[] = [];

    // Header com informações do projeto
    lines.push('CLARIFYSE - RELATÓRIO DE ANÁLISE');
    lines.push(`Projeto,${data.projectName}`);
    lines.push(`Data de Exportação,${new Date(data.exportedAt).toLocaleDateString('pt-BR')}`);
    lines.push(`Total de Respostas,${data.totalResponses}`);
    lines.push(`Score de Qualidade,${data.qualityScore}%`);
    lines.push('');

    // Metodologias selecionadas
    lines.push('METODOLOGIAS SELECIONADAS');
    lines.push(data.selectedMethodologies.join(', '));
    lines.push('');

    // Insights principais
    if (data.mainInsights?.keyInsights) {
      lines.push('INSIGHTS PRINCIPAIS');
      data.mainInsights.keyInsights.forEach((insight, idx) => {
        lines.push(`${idx + 1}. ${insight}`);
      });
      lines.push('');
    }

    // Análise por pergunta
    if (data.questions.length > 0) {
      lines.push('ANÁLISE POR PERGUNTA');
      lines.push('Pergunta,Tipo,Respostas');
      data.questions.forEach(q => {
        lines.push(`"${q.question}",${q.type},${q.responses}`);
      });
      lines.push('');
    }

    // Resultados por metodologia
    if (Object.keys(data.methodologyResults).length > 0) {
      lines.push('RESULTADOS POR METODOLOGIA');
      Object.entries(data.methodologyResults).forEach(([methodology, result]) => {
        lines.push(`${methodology}`);
        if (result.insight) {
          lines.push(`${result.insight}`);
        }
        lines.push('');
      });
    }

    return new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  }

  /**
   * Exportar em formato Excel com múltiplas abas
   */
  static exportExcel(data: ExportData): Blob {
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo Executivo
    const summaryData = [
      ['CLARIFYSE - RELATÓRIO DE ANÁLISE'],
      [],
      ['Informações do Projeto'],
      ['Campo', 'Valor'],
      ['Projeto', data.projectName],
      ['ID', data.projectId],
      ['Data de Exportação', new Date(data.exportedAt).toLocaleDateString('pt-BR')],
      ['Total de Respostas', data.totalResponses],
      ['Tamanho da Amostra', data.sampleSize],
      ['Score de Qualidade', `${data.qualityScore}%`],
      [],
      ['Metodologias Selecionadas'],
      ...data.selectedMethodologies.map(m => [m]),
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Resumo');

    // Aba 2: Insights Principais
    if (data.mainInsights?.keyInsights) {
      const insightsData = [
        ['INSIGHTS PRINCIPAIS'],
        [],
        ['Insight'],
        ...data.mainInsights.keyInsights.map(insight => [insight]),
      ];
      const insightsSheet = XLSX.utils.aoa_to_sheet(insightsData);
      XLSX.utils.book_append_sheet(wb, insightsSheet, 'Insights');
    }

    // Aba 3: Perguntas e Respostas
    if (data.questions.length > 0) {
      const questionsData = [
        ['ANÁLISE POR PERGUNTA'],
        [],
        ['Pergunta', 'Tipo', 'Respostas'],
        ...data.questions.map(q => [q.question, q.type, q.responses]),
      ];
      const questionsSheet = XLSX.utils.aoa_to_sheet(questionsData);
      XLSX.utils.book_append_sheet(wb, questionsSheet, 'Perguntas');
    }

    // Aba 4: Resultados Metodológicos
    if (Object.keys(data.methodologyResults).length > 0) {
      const methodologyData: any[][] = [
        ['RESULTADOS DAS METODOLOGIAS'],
        [],
        ['Metodologia', 'Descrição', 'Insight'],
      ];

      Object.entries(data.methodologyResults).forEach(([methodology, result]) => {
        const description = JSON.stringify(result).substring(0, 100) + '...';
        const insight = result.insight || '';
        methodologyData.push([methodology, description, insight]);
      });

      const methodologySheet = XLSX.utils.aoa_to_sheet(methodologyData);
      XLSX.utils.book_append_sheet(wb, methodologySheet, 'Metodologias');
    }

    // Aba 5: Cotas (se houver)
    if (data.quotas && data.quotas.length > 0) {
      const quotasData = [
        ['COTAS'],
        [],
        ['Nome', 'Meta', 'Alcançado', 'Percentual'],
        ...data.quotas.map(q => [q.name, q.target, q.achieved, `${q.percentage}%`]),
      ];
      const quotasSheet = XLSX.utils.aoa_to_sheet(quotasData);
      XLSX.utils.book_append_sheet(wb, quotasSheet, 'Cotas');
    }

    // Aba 6: Respostas Brutas (se incluir)
    if (data.responses && data.responses.length > 0 && data.responses.length <= 1000) {
      const responsesData = [
        ['RESPOSTAS BRUTAS'],
        [],
        ['ID', 'Data/Hora', 'Tempo (s)', ...Object.keys(data.responses[0].answers || {})],
        ...data.responses.map(r => [
          r.id,
          new Date(r.timestamp).toLocaleString('pt-BR'),
          r.timeSpent,
          ...Object.values(r.answers || {}),
        ]),
      ];
      const responsesSheet = XLSX.utils.aoa_to_sheet(responsesData);
      XLSX.utils.book_append_sheet(wb, responsesSheet, 'Respostas');
    }

    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as any;
  }

  /**
   * Exportar em formato HTML (para visualização no navegador)
   */
  static exportHTML(data: ExportData): Blob {
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.projectName} - Análise</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
          background-color: #f5f5f5;
        }
        .header {
          background: linear-gradient(135deg, #2D1E6B 0%, #7F77DD 100%);
          color: white;
          padding: 30px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 10px 0 0 0;
          opacity: 0.9;
        }
        .metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .metric-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #2D1E6B;
        }
        .metric-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          margin-top: 5px;
        }
        .section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .section h2 {
          color: #2D1E6B;
          border-bottom: 2px solid #7F77DD;
          padding-bottom: 10px;
          margin-top: 0;
        }
        .insight-item {
          padding: 10px;
          margin: 10px 0;
          background: #F0F0F0;
          border-left: 4px solid #1D9E75;
          border-radius: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #f9f9f9;
          font-weight: bold;
          color: #2D1E6B;
        }
        .footer {
          text-align: center;
          color: #999;
          font-size: 12px;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CLARIFYSE - Análise de Dados</h1>
        <p>Projeto: ${data.projectName}</p>
        <p>Data: ${new Date(data.exportedAt).toLocaleDateString('pt-BR')} | Respostas: ${data.totalResponses}</p>
      </div>

      <div class="metrics">
        <div class="metric-card">
          <div class="metric-value">${data.totalResponses}</div>
          <div class="metric-label">Respostas Coletadas</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.qualityScore}%</div>
          <div class="metric-label">Score de Qualidade</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.selectedMethodologies.length}</div>
          <div class="metric-label">Metodologias Usadas</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${data.sampleSize}</div>
          <div class="metric-label">Amostra Planejada</div>
        </div>
      </div>

      ${
        data.mainInsights?.keyInsights
          ? `
      <div class="section">
        <h2>Insights Principais</h2>
        ${data.mainInsights.keyInsights.map((insight: string) => `<div class="insight-item">${insight}</div>`).join('')}
      </div>
      `
          : ''
      }

      ${
        data.questions.length > 0
          ? `
      <div class="section">
        <h2>Análise por Pergunta</h2>
        <table>
          <thead>
            <tr>
              <th>Pergunta</th>
              <th>Tipo</th>
              <th>Respostas</th>
            </tr>
          </thead>
          <tbody>
            ${data.questions.map(q => `<tr><td>${q.question}</td><td>${q.type}</td><td>${q.responses}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
      `
          : ''
      }

      <div class="section">
        <h2>Metodologias Utilizadas</h2>
        <ul>
          ${data.selectedMethodologies.map(m => `<li>${m}</li>`).join('')}
        </ul>
      </div>

      <div class="footer">
        <p>Relatório gerado pelo Clarifyse Survey Forge em ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
    `;

    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  /**
   * Download de arquivo
   */
  static downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Exportar com formato automático
   */
  static export(data: ExportData, format: ExportFormat = 'json'): Blob {
    switch (format) {
      case 'json':
        return this.exportJSON(data);
      case 'csv':
        return this.exportCSV(data);
      case 'xlsx':
        return this.exportExcel(data);
      case 'html':
        return this.exportHTML(data);
      default:
        return this.exportJSON(data);
    }
  }

  /**
   * Gerar nome de arquivo com timestamp
   */
  static generateFilename(projectName: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = format === 'xlsx' ? 'xlsx' : format;
    const sanitized = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return `analise_${sanitized}_${timestamp}.${extension}`;
  }
}

/**
 * Hook para usar o serviço de exportação
 */
export function useExportService() {
  const exportData = (data: ExportData, format: ExportFormat = 'json') => {
    const blob = ExportService.export(data, format);
    const filename = ExportService.generateFilename(data.projectName, format);
    ExportService.downloadFile(blob, filename);
  };

  return { exportData };
}

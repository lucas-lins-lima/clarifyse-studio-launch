import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ProjectFinancialData {
  id: string;
  nome: string;
  cliente_empresa: string | null;
  gerente_id: string | null;
  gerente?: { name: string } | null;
  metodologia?: string | null;
  pilar?: string | null;
  status: string;
  project_financials: Array<{
    valor_total: number;
    custo_painel: number;
    custo_sala: number;
    custo_plataforma: number;
    custo_recrutamento: number;
    custo_incentivos: number;
    custo_transcricao: number;
    custo_elaboracao: number;
    custo_analise: number;
    custo_analytics_avancado: number;
    custo_dashboard: number;
    custo_relatorio_adicional: number;
    custo_outros: number;
  }>;
}

interface ExportFilters {
  periodo?: 'mes' | 'trimestre' | 'ano';
  gerenteId?: string;
  metodologia?: string;
  status?: string;
}

export function FinanceiroGlobalExport() {
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['financeiro-export-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          nome,
          cliente_empresa,
          gerente_id,
          status,
          data_inicio,
          metodologia,
          pilar,
          gerente:profiles!projects_gerente_id_fkey(name),
          project_financials (
            valor_total,
            custo_painel,
            custo_sala,
            custo_plataforma,
            custo_recrutamento,
            custo_incentivos,
            custo_transcricao,
            custo_elaboracao,
            custo_analise,
            custo_analytics_avancado,
            custo_dashboard,
            custo_relatorio_adicional,
            custo_outros
          )
        `)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as ProjectFinancialData[];
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculateProjectTotals = (project: ProjectFinancialData) => {
    const fin = project.project_financials?.[0];
    if (!fin) return { receita: 0, custo: 0, lucro: 0, margem: 0 };

    const receita = Number(fin.valor_total) || 0;
    const custo =
      (Number(fin.custo_painel) || 0) +
      (Number(fin.custo_sala) || 0) +
      (Number(fin.custo_plataforma) || 0) +
      (Number(fin.custo_recrutamento) || 0) +
      (Number(fin.custo_incentivos) || 0) +
      (Number(fin.custo_transcricao) || 0) +
      (Number(fin.custo_elaboracao) || 0) +
      (Number(fin.custo_analise) || 0) +
      (Number(fin.custo_analytics_avancado) || 0) +
      (Number(fin.custo_dashboard) || 0) +
      (Number(fin.custo_relatorio_adicional) || 0) +
      (Number(fin.custo_outros) || 0);

    const lucro = receita - custo;
    const margem = receita > 0 ? (lucro / receita) * 100 : 0;

    return { receita, custo, lucro, margem };
  };

  function exportToExcel() {
    if (projects.length === 0) {
      toast.error('Nenhum projeto para exportar');
      return;
    }

    const today = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const wb = XLSX.utils.book_new();

    // ABA 1: Resumo Financeiro
    const summaryData: any[][] = [
      ['Clarifyse Strategy & Research'],
      ['Resumo Financeiro Global'],
      [`Exportado em: ${today} — Confidencial`],
      [],
      ['Projeto', 'Gerente', 'Metodologia', 'Status', 'Valor Total', 'Custos Operacionais', 'Lucro Bruto', 'Margem %'],
    ];

    let totalReceita = 0;
    let totalCusto = 0;
    let totalLucro = 0;

    projects.forEach((project) => {
      const totals = calculateProjectTotals(project);
      totalReceita += totals.receita;
      totalCusto += totals.custo;
      totalLucro += totals.lucro;

      summaryData.push([
        project.nome,
        project.gerente?.name || '—',
        project.metodologia || '—',
        project.status,
        totals.receita,
        totals.custo,
        totals.lucro,
        totals.margem.toFixed(2),
      ]);
    });

    summaryData.push([]);
    summaryData.push([
      'TOTAL',
      '',
      '',
      '',
      totalReceita,
      totalCusto,
      totalLucro,
      totalReceita > 0 ? ((totalLucro / totalReceita) * 100).toFixed(2) : '0.00',
    ]);

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 12 },
    ];

    // Style header
    const headerStyle = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '1B2B6B' } },
      alignment: { horizontal: 'center', vertical: 'center' },
    };

    for (let col = 0; col < 8; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 4, c: col });
      if (summaryWs[cellRef]) {
        summaryWs[cellRef].s = headerStyle;
      }
    }

    // Style total row
    const totalRowIndex = summaryData.length - 1;
    for (let col = 0; col < 8; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: totalRowIndex, c: col });
      if (summaryWs[cellRef]) {
        summaryWs[cellRef].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'E0E7FF' } },
        };
      }
    }

    // ABA 2: Detalhamento de Custos
    const detailData: any[][] = [
      ['Clarifyse Strategy & Research'],
      ['Detalhamento de Custos por Projeto'],
      [`Exportado em: ${today} — Confidencial`],
      [],
      ['Projeto', 'Painel', 'Sala', 'Plataforma', 'Recrutamento', 'Incentivos', 'Transcrição', 'Elaboração', 'Análise', 'Analytics Avançado', 'Dashboard', 'Relatório Adicional', 'Outros'],
    ];

    projects.forEach((project) => {
      const fin = project.project_financials?.[0];
      if (fin) {
        detailData.push([
          project.nome,
          Number(fin.custo_painel) || 0,
          Number(fin.custo_sala) || 0,
          Number(fin.custo_plataforma) || 0,
          Number(fin.custo_recrutamento) || 0,
          Number(fin.custo_incentivos) || 0,
          Number(fin.custo_transcricao) || 0,
          Number(fin.custo_elaboracao) || 0,
          Number(fin.custo_analise) || 0,
          Number(fin.custo_analytics_avancado) || 0,
          Number(fin.custo_dashboard) || 0,
          Number(fin.custo_relatorio_adicional) || 0,
          Number(fin.custo_outros) || 0,
        ]);
      }
    });

    const detailWs = XLSX.utils.aoa_to_sheet(detailData);
    detailWs['!cols'] = [
      { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
      { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
      { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 16 }, { wch: 12 },
    ];

    // Style header for detail sheet
    for (let col = 0; col < 13; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 4, c: col });
      if (detailWs[cellRef]) {
        detailWs[cellRef].s = headerStyle;
      }
    }

    // Add sheets to workbook
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumo');
    XLSX.utils.book_append_sheet(wb, detailWs, 'Detalhamento');

    // Download
    const fileName = `Financeiro_Clarifyse_${today.replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast.success(`Financeiro exportado com sucesso`);
  }

  return (
    <Button
      onClick={exportToExcel}
      disabled={isLoading || projects.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {isLoading ? 'Carregando...' : 'Exportar Financeiro (Excel)'}
    </Button>
  );
}

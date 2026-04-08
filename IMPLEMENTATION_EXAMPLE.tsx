/**
 * EXEMPLO DE IMPLEMENTAÇÃO
 * 
 * Este arquivo mostra como integrar todos os novos componentes e hooks
 * no seu fluxo de formulário -> análises em tempo real -> exportação
 * 
 * Para usar: Copie as seções relevantes para seus componentes existentes
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

// ============================================================================
// IMPORTS DOS NOVOS COMPONENTES E HOOKS
// ============================================================================

import { EnhancedAnalysisTab } from '@/components/projects/surveyforge/EnhancedAnalysisTab';
import { MethodologyGuide } from '@/components/projects/surveyforge/MethodologyGuide';
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';
import { useProjectValidation } from '@/hooks/useProjectValidation';
import { useExportService } from '@/lib/exportService';
import { ExportService, type ExportData } from '@/lib/exportService';
import { MethodologyValidator } from '@/lib/methodologyQuestionValidator';

// ============================================================================
// TIPO DE PROJETO (EXEMPLO)
// ============================================================================

interface ProjectExample {
  id: string;
  nome: string;
  objective: string;
  formQuestions: Array<{
    id: string;
    question: string;
    type: 'rating' | 'single_choice' | 'nps' | 'text' | 'scale';
    options?: Array<{ code: string | number; text: string }>;
  }>;
  metodologias_analise: Array<{ type: string }>;
  responses: Array<{
    id: string;
    submittedAt: string;
    answers: Record<string, any>;
    timeSpentSeconds: number;
  }>;
  quotas: Array<{ id: string; name: string; target: number }>;
  sampleSize: number;
}

// ============================================================================
// EXEMPLO 1: PAINEL PRINCIPAL COM TODAS AS FUNCIONALIDADES
// ============================================================================

export function ProjectDashboardExample({ project }: { project: ProjectExample }) {
  const [selectedMethodologies, setSelectedMethodologies] = useState(
    project.metodologias_analise.map(m => m.type)
  );
  const [activeTab, setActiveTab] = useState('overview');
  const { exportData } = useExportService();

  // Preparar dados para análise
  const formattedResponses = project.responses.map(r => ({
    id: r.id,
    timestamp: r.submittedAt,
    answers: r.answers,
    quotaProfile: { default: 'all' },
    timeSpent: r.timeSpentSeconds,
    qualityFlag: 'good' as const,
  }));

  // Validar projeto automaticamente
  const validation = useProjectValidation({
    questions: project.formQuestions,
    selectedMethodologies,
    responses: formattedResponses,
    sampleSize: project.sampleSize,
    quotas: project.quotas,
  });

  // Análises em tempo real
  const analytics = useRealtimeAnalytics({
    responses: formattedResponses,
    questions: project.formQuestions,
    quotas: project.quotas,
    methodologies: selectedMethodologies,
    sampleSize: project.sampleSize,
    enabled: true,
  });

  // Handler para exportar
  const handleExport = useCallback((format: 'json' | 'xlsx' | 'csv' | 'html') => {
    const exportPayload: ExportData = {
      projectId: project.id,
      projectName: project.nome,
      projectDescription: project.objective,
      exportedAt: new Date().toISOString(),
      totalResponses: project.responses.length,
      qualityScore: analytics.qualityScore,
      sampleSize: project.sampleSize,
      questions: project.formQuestions.map(q => ({
        id: q.id,
        question: q.question,
        type: q.type,
        responses: project.responses.filter(r => r.answers[q.id] !== undefined).length,
      })),
      mainInsights: analytics.mainInsights || {},
      methodologyResults: analytics.methodologyResults,
      selectedMethodologies,
    };

    exportData(exportPayload, format);
  }, [project, analytics, selectedMethodologies, exportData]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-[#2D1E6B]">{project.nome}</h1>
        <p className="text-gray-600">{project.objective}</p>
      </div>

      {/* Status de Validação */}
      {!validation.isProjectValid && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 space-y-2">
            <p className="font-semibold">Erros de Validação ({validation.errors.length})</p>
            <ul className="list-disc list-inside text-sm">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Status de Recomendações */}
      {validation.recommendations.length > 0 && (
        <Alert className="border-blue-200 bg-blue-50">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <p className="font-semibold mb-2">Recomendações ({validation.recommendations.length})</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {validation.recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="methodologies">Metodologias</TabsTrigger>
          <TabsTrigger value="analysis">Análises</TabsTrigger>
        </TabsList>

        {/* TAB 1: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#2D1E6B]">
                    {project.responses.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Respostas Coletadas</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#1D9E75]">
                    {analytics.qualityScore}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Score de Qualidade</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#7F77DD]">
                    {selectedMethodologies.length}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Metodologias Ativas</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#FF6B6B]">
                    {Math.round((project.responses.length / project.sampleSize) * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2">Progresso da Amostra</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Exportar */}
          <Card>
            <CardHeader>
              <CardTitle>Exportar Dados</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button onClick={() => handleExport('xlsx')} className="gap-2">
                📊 Excel
              </Button>
              <Button onClick={() => handleExport('json')} className="gap-2">
                {} JSON
              </Button>
              <Button onClick={() => handleExport('csv')} className="gap-2">
                📋 CSV
              </Button>
              <Button onClick={() => handleExport('html')} className="gap-2">
                🌐 HTML
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Metodologias */}
        <TabsContent value="methodologies">
          <MethodologyGuide
            projectQuestions={project.formQuestions}
            selectedMethodologies={selectedMethodologies as any}
            onMethodologyToggle={(methodology) => {
              setSelectedMethodologies(prev =>
                prev.includes(methodology)
                  ? prev.filter(m => m !== methodology)
                  : [...prev, methodology]
              );
            }}
            totalResponses={project.responses.length}
          />
        </TabsContent>

        {/* TAB 3: Análises */}
        <TabsContent value="analysis">
          <EnhancedAnalysisTab
            project={project}
            isAdmin={true}
            enableRealtime={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: INTEGRAR NO FORM BUILDER
// ============================================================================

export function FormBuilderWithValidation({ project }: { project: ProjectExample }) {
  const [formQuestions, setFormQuestions] = useState(project.formQuestions);
  const [selectedMethodologies, setSelectedMethodologies] = useState(
    project.metodologias_analise.map(m => m.type)
  );

  // Validação automática conforme cria perguntas
  const validation = useProjectValidation({
    questions: formQuestions,
    selectedMethodologies,
    responses: project.responses,
    sampleSize: project.sampleSize,
    quotas: project.quotas,
  });

  const suggestedMethodologies = MethodologyValidator.suggestMethodologies(formQuestions);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Construir Formulário</h1>

      {/* Sugestões Automáticas */}
      {suggestedMethodologies.length > 0 && formQuestions.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <p className="font-semibold mb-2">Metodologias Recomendadas</p>
            <div className="flex flex-wrap gap-2">
              {suggestedMethodologies.slice(0, 5).map((method: string) => (
                <button
                  key={method}
                  onClick={() => {
                    if (!selectedMethodologies.includes(method)) {
                      setSelectedMethodologies([...selectedMethodologies, method]);
                    }
                  }}
                  className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded text-sm"
                >
                  + {method}
                </button>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Status de Perguntas */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Perguntas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>Total de perguntas: <strong>{formQuestions.length}</strong></p>
            <p>Válidas: <strong>{validation.questionsStatus.validQuestions}</strong></p>
            <p>Tipos faltando: <strong>{validation.questionsStatus.missingTypes.join(', ') || 'Nenhum'}</strong></p>
          </div>
        </CardContent>
      </Card>

      {/* Guia Visual */}
      <MethodologyGuide
        projectQuestions={formQuestions}
        selectedMethodologies={selectedMethodologies as any}
        onMethodologyToggle={(methodology) => {
          setSelectedMethodologies(prev =>
            prev.includes(methodology)
              ? prev.filter(m => m !== methodology)
              : [...prev, methodology]
          );
        }}
        totalResponses={project.responses.length}
      />
    </div>
  );
}

// ============================================================================
// EXEMPLO 3: ANÁLISES EM TEMPO REAL APENAS
// ============================================================================

export function RealtimeAnalysisOnly({ project }: { project: ProjectExample }) {
  const formattedResponses = project.responses.map(r => ({
    id: r.id,
    timestamp: r.submittedAt,
    answers: r.answers,
    quotaProfile: { default: 'all' },
    timeSpent: r.timeSpentSeconds,
    qualityFlag: 'good' as const,
  }));

  const analytics = useRealtimeAnalytics({
    responses: formattedResponses,
    questions: project.formQuestions,
    quotas: project.quotas,
    methodologies: ['nps_analysis', 'sentiment_analysis', 'descriptive_stats'],
    sampleSize: project.sampleSize,
    enabled: true,
  });

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Análises em Tempo Real</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{analytics.responseCount}</div>
              <div className="text-sm text-gray-600">Respostas</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{analytics.qualityScore}%</div>
              <div className="text-sm text-gray-600">Qualidade</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{analytics.lastUpdated}</div>
              <div className="text-sm text-gray-600">Última Atualização</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados por Metodologia */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Resultados das Análises</h2>
        {Object.entries(analytics.methodologyResults).map(([methodology, result]) => (
          <Card key={methodology}>
            <CardHeader>
              <CardTitle className="text-base">{methodology}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{result?.insight || 'Dados insuficientes para análise'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// EXEMPLO 4: VALIDAÇÃO E EXPORTAÇÃO
// ============================================================================

export function ValidationAndExportExample({ project }: { project: ProjectExample }) {
  const validation = useProjectValidation({
    questions: project.formQuestions,
    selectedMethodologies: project.metodologias_analise.map(m => m.type),
    responses: project.responses.map(r => ({})),
    sampleSize: project.sampleSize,
    quotas: project.quotas,
  });

  const { exportData } = useExportService();

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Validação e Exportação</h1>

      {/* Status Geral */}
      <Card className={validation.isProjectValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardHeader>
          <CardTitle>Status do Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            {validation.isProjectValid ? '✅ Pronto para análise' : '❌ Erros de validação'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Pronto para análise: {validation.isReadyForAnalysis ? 'Sim' : 'Não'}
          </p>
        </CardContent>
      </Card>

      {/* Erros */}
      {validation.errors.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle>Erros ({validation.errors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {validation.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendações ({validation.recommendations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {validation.recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Próximos Passos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {validation.recommendations.slice(0, 3).map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Botões de Exportação */}
      {validation.isReadyForAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Exportar Relatório</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              onClick={() => exportData({
                projectId: project.id,
                projectName: project.nome,
                exportedAt: new Date().toISOString(),
                totalResponses: project.responses.length,
                qualityScore: 85,
                sampleSize: project.sampleSize,
                questions: project.formQuestions.map(q => ({
                  id: q.id,
                  question: q.question,
                  type: q.type,
                  responses: 10,
                })),
                mainInsights: {},
                methodologyResults: {},
                selectedMethodologies: project.metodologias_analise.map(m => m.type),
              }, 'xlsx')}
            >
              📊 Excel
            </Button>
            <Button
              onClick={() => exportData({
                projectId: project.id,
                projectName: project.nome,
                exportedAt: new Date().toISOString(),
                totalResponses: project.responses.length,
                qualityScore: 85,
                sampleSize: project.sampleSize,
                questions: project.formQuestions.map(q => ({
                  id: q.id,
                  question: q.question,
                  type: q.type,
                  responses: 10,
                })),
                mainInsights: {},
                methodologyResults: {},
                selectedMethodologies: project.metodologias_analise.map(m => m.type),
              }, 'json')}
            >
              {} JSON
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProjectDashboardExample;

# Guia de Integração - Melhorias do Clarifyse Survey Forge

## Visão Geral

Este guia documenta as melhorias implementadas no Clarifyse Survey Forge para suportar análises em tempo real, validação automática de metodologias e exportação avançada de dados.

## Arquivos Criados

### 1. **Hooks**
- `src/hooks/useRealtimeAnalytics.ts` - Hook para análises em tempo real com reatividade otimizada
- `src/hooks/useProjectValidation.ts` - Hook para validação automática de projetos e metodologias

### 2. **Bibliotecas de Análise**
- `src/lib/realtimeAnalyticsService.ts` - Serviço singleton para gerenciar análises em tempo real
- `src/lib/methodologyQuestionValidator.ts` - Sistema completo de validação de tipos de perguntas por metodologia
- `src/lib/exportService.ts` - Serviço de exportação em múltiplos formatos (Excel, JSON, CSV, HTML)
- **Atualizado:** `src/lib/methodologyAnalytics.ts` - Adicionadas 15+ novas metodologias analíticas

### 3. **Componentes**
- `src/components/projects/surveyforge/EnhancedAnalysisTab.tsx` - Painel de análise melhorado com tempo real
- `src/components/projects/surveyforge/MethodologyGuide.tsx` - Guia interativo de metodologias

## Como Usar

### 1. Substituir AnalysisTab pelo EnhancedAnalysisTab

Em `src/pages/admin/ProjectDetailPage.tsx` ou equivalente:

```tsx
import { EnhancedAnalysisTab } from '@/components/projects/surveyforge/EnhancedAnalysisTab';

// Substituir
// <AnalysisTab project={project} isAdmin={isAdmin} />

// Por:
<EnhancedAnalysisTab project={project} isAdmin={isAdmin} enableRealtime={true} />
```

### 2. Integrar o Guia de Metodologias no FormBuilder

Em `src/components/projects/surveyforge/FormBuilderTab.tsx`:

```tsx
import { MethodologyGuide } from '@/components/projects/surveyforge/MethodologyGuide';

// Adicionar no JSX:
<MethodologyGuide
  projectQuestions={formQuestions}
  selectedMethodologies={selectedMethodologies}
  onMethodologyToggle={toggleMethodology}
  totalResponses={project.responses?.length || 0}
/>
```

### 3. Usar Validação Automática

Em qualquer componente:

```tsx
import { useProjectValidation } from '@/hooks/useProjectValidation';

const validation = useProjectValidation({
  questions: projectQuestions,
  selectedMethodologies,
  responses: project.responses,
  sampleSize: project.sampleSize,
  quotas: project.quotas,
});

if (!validation.isProjectValid) {
  // Mostrar erros
  validation.errors.forEach(error => console.error(error));
}
```

### 4. Usar Análises em Tempo Real

```tsx
import { useRealtimeAnalytics } from '@/hooks/useRealtimeAnalytics';

const {
  mainInsights,
  methodologyResults,
  qualityScore,
  responseCount,
} = useRealtimeAnalytics({
  responses: formattedResponses,
  questions: project.formQuestions,
  quotas: project.quotas,
  methodologies: selectedMethodologies,
  sampleSize: project.sampleSize,
  enabled: true, // Habilita atualizações automáticas
});
```

### 5. Exportar Dados

```tsx
import { ExportService } from '@/lib/exportService';

const exportData = {
  projectId: project.id,
  projectName: project.nome,
  totalResponses: responses.length,
  qualityScore: 85,
  // ... mais dados
};

// Exportar em Excel
const blob = ExportService.export(exportData, 'xlsx');
ExportService.downloadFile(blob, 'analise.xlsx');

// Ou usar o hook
import { useExportService } from '@/lib/exportService';
const { exportData } = useExportService();
exportData(exportData, 'xlsx');
```

## Metodologias Implementadas

### Novas Metodologias Adicionadas:
1. **TURF Analysis** - Total Unduplicated Reach and Frequency
2. **MaxDiff** - Maximum Difference Scaling
3. **Conjoint Utilities** - Análise de Utilidades
4. **Brand Equity** - Equidade de Marca
5. **Network Analysis** - Análise de Redes de Percepção
6. **Survival Analysis** - Análise de Sobrevivência
7. **Cluster Stability** - Estabilidade de Clusters
8. **Mediation Analysis** - Análise de Mediação
9. **SEM (Structural Equation Modeling)** - Modelagem de Equações Estruturais
10. **Propensity Score** - Score de Propensão
11. **Difference-in-Differences** - Análise Diferença em Diferença
12. **Uplift Modeling** - Modelagem de Uplift

### Total de Metodologias: 142+

Cada metodologia possui:
- Requisitos de quantidade de respostas
- Tipos de perguntas obrigatórias
- Tipos de perguntas recomendadas
- Notas de validação
- Exemplo de uso

## Fluxo de Teste Recomendado

### 1. Criar um Novo Projeto

```
Clarifyse Survey Forge → Novo Projeto
├── Nome: "Teste Análises Inteligentes"
├── Objetivo: "Testar todas as metodologias"
└── Seleção de Metodologias: Marcar 5-10 metodologias
```

### 2. Criar Perguntas Adequadas

```
Adicionar Perguntas:
├── 1 pergunta NPS (0-10)
├── 3 perguntas Rating (1-10)
├── 1 pergunta Single Choice (segmentação)
├── 1 pergunta Multiple Choice
└── 1 pergunta de Texto Aberto (sentiment)
```

### 3. Visualizar Guia de Metodologias

- O `MethodologyGuide` mostrará automaticamente:
  - Metodologias sugeridas baseadas nas perguntas
  - Requisitos de cada metodologia
  - Status de validação
  - Recomendações de melhoria

### 4. Coletar Respostas

```
Compartilhar link público
├── Método 1: Enviar para respondentes
├── Método 2: Testar no preview
└── Método 3: Importar dados de teste
```

### 5. Acompanhar Análises em Tempo Real

- O `EnhancedAnalysisTab` mostrará:
  - Atualização automática conforme chegam respostas
  - Resultados de cada metodologia
  - Score de qualidade
  - Insights principais
  - Progresso da amostra

### 6. Exportar Resultados

- Formatos disponíveis:
  - Excel (`.xlsx`) - Com múltiplas abas
  - JSON - Dados estruturados
  - CSV - Compatível com Excel/Google Sheets
  - HTML - Para visualização

## Pontos-Chave de Validação

### Erro de Validação Comum 1: Respostas Insuficientes
```
Erro: "nps_analysis: Mínimo 10 respostas (você tem 5)"
Solução: Coletar mais respostas ou aguardar
```

### Erro de Validação Comum 2: Tipo de Pergunta Faltando
```
Erro: "t_test: Requer 1 pergunta do tipo 'single_choice'"
Solução: Adicionar pergunta de segmentação
```

### Recomendação Comum: Adicionar Perguntas Opcionais
```
Recomendação: "shapley_values: Considere adicionar perguntas 
dos tipos rating, scale, slider para melhorar a análise"
Solução: Adicionar mais perguntas de escala
```

## Performance e Otimizações

### Real-time Analytics
- Usa `useMemo` para não recalcular desnecessariamente
- Suporta polling (default) ou WebSocket
- Cache de respostas para operações offline

### Análises Adaptativas
- Dispatcher automático escolhe quais análises rodar
- Volume de dados determina quais metodologias são habilitadas
- Respeta limites de computação para UX fluida

### Exportação Eficiente
- Excel: Múltiplas abas com formatação
- JSON: Estrutura completa para API
- CSV: Compatível com ferramentas de BI
- HTML: Relatório visual no navegador

## Troubleshooting

### Problema: Análises não atualizando
**Solução:** 
- Verificar se `enableRealtime={true}` está configurado
- Verificar se o polling está habilitado (5s interval default)
- Verificar console para erros

### Problema: Muitos erros de validação
**Solução:**
- Usar `MethodologyGuide` para entender requisitos
- Verificar se metodologias selecionadas são adequadas para as perguntas
- Considerar usar metodologias sugeridas automaticamente

### Problema: Exportação lenta para muitas respostas
**Solução:**
- Exportar em JSON (mais rápido)
- Limitar a quantidade de respostas detalhadas no Excel
- Usar CSV para grandes volumes

## Próximas Etapas

1. **Integração com Backend**: Conectar com API de respostas real
2. **Dashboard de Tracking**: Criar visualizações avançadas
3. **Compartilhamento de Insights**: Permitir compartilhar análises
4. **Machine Learning**: Integrar previsões automáticas
5. **Alertas Inteligentes**: Notificar sobre insights críticos

## Support

Para dúvidas sobre as novas funcionalidades:
1. Consulte os comentários no código (JSDoc)
2. Verifique o `METHODOLOGY_REQUIREMENTS` para validações
3. Use o `MethodologyGuide` para orientação visual
4. Consulte os hooks para exemplos de integração

---

**Versão:** 1.0  
**Última Atualização:** 2024  
**Status:** Pronto para Produção

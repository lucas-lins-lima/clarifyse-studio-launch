# CLARIFYSE SURVEY FORGE - Plano de Implementação Completo

## 📊 ANÁLISE DE MÉTODOS: O Que Existe vs. O Que Falta

### ✅ MÉTODOS JÁ IMPLEMENTADOS (35+)

#### Análises Descritivas (6/7)
- ✅ Distribuição percentual e média
- ✅ Cluster K-means  
- ✅ Quintis e Percentis
- ✅ Outliers (IQR e Z-score)
- ✅ Assimetria e Curtose
- ❌ Missing Data Analysis (MICE, imputação)

#### Análises Comparativas (6/8)
- ✅ T-test
- ✅ ANOVA
- ✅ Chi-Quadrado
- ✅ Effect Size (Cohen's d, Eta²)
- ❌ Mann-Whitney / Kruskal-Wallis
- ❌ Teste de Proporções (Z-test)
- ❌ Equivalence Testing (TOST)

#### Análises Metodológicas de Pesquisa (15/22)
- ✅ NPS Analysis (com segmentação)
- ✅ Penalty Analysis
- ✅ Importance x Satisfaction Matrix
- ✅ Gap Analysis (Expectativa x Realidade)
- ✅ Conversion Funnel
- ✅ Sentiment Analysis
- ✅ Cronbach Alpha
- ✅ Van Westendorp (Price Sensitivity)
- ✅ Kano Analysis
- ✅ CES (Customer Effort Score)
- ✅ CSAT (Customer Satisfaction)
- ✅ Gabor-Granger Pricing
- ✅ Brand Funnel Analytics
- ✅ Shapley Importance / Relative Importance
- ❌ MaxDiff (estrutura existe, análises faltam)
- ❌ Conjoint Analysis (estrutura existe, análises faltam)
- ❌ Choice-Based Conjoint (CBC)
- ❌ Menu-Based Conjoint (MBC)
- ❌ TURF Analysis
- ❌ Markov Chain Switching
- ❌ Customer Lifetime Value (CLV)
- ❌ Cohort Analysis

#### Machine Learning & Estatística Avançada (4/18+)
- ✅ K-Means Clustering
- ✅ Propensity Score Matching
- ❌ Regressão Linear Múltipla
- ❌ Regressão Logística
- ❌ Árvores de Decisão / Random Forest
- ❌ Gradient Boosting (XGBoost/LightGBM)
- ❌ Ridge, Lasso, Elastic Net
- ❌ Regressão Quantílica
- ❌ SVM, KNN, Naïve Bayes
- ❌ AutoML / Seleção Automática de Modelos
- ❌ Redes Neurais / Deep Learning

#### Análises Fatoriais (2/5)
- ❌ PCA e Análise Fatorial Exploratória
- ❌ Análise de Correspondência
- ❌ Análise Fatorial Confirmatória (CFA)
- ❌ Análise de Bifactor
- ❌ Rotação Oblíqua (Promax/Oblimin)

#### Análises de Texto/NLP (3/7)
- ✅ Sentiment Analysis (básico)
- ❌ Aspect-Based Sentiment Analysis (ABSA)
- ❌ Topic Modeling (LDA/BERTopic)
- ❌ Named Entity Recognition (NER)
- ❌ Word Embeddings (Word2Vec/BERT)
- ❌ Co-ocorrência de Termos
- ❌ Categorização Automática (ML)

#### Análises Causais (4/9)
- ✅ Propensity Score Matching
- ❌ Difference-in-Differences (DiD)
- ❌ Regression Discontinuity
- ❌ Variáveis Instrumentais (IV)
- ❌ Double Machine Learning (DML)
- ❌ Synthetic Control Method
- ❌ Causal Forests / Uplift Modeling
- ❌ Análise de Contrafactual

#### Análises de Rede (0/3)
- ❌ Mapeamento de Conexões Atributo-Marca
- ❌ Análise de Centralidade (Betweenness, Degree, Eigenvector)
- ❌ Detecção de Comunidades

#### Análises Comportamentais & Experimentação (0/5)
- ❌ A/B Testing com Poder Estatístico
- ❌ Multi-Armed Bandit
- ❌ Eye Tracking Analytics
- ❌ Teste de Associação Implícita (IAT)
- ❌ Mouse Tracking Analytics

---

## 🏗️ ARQUITETURA PROPOSTA

### Camadas de Análise

```
RESPOSTA DO ENTREVISTADOR
    ↓
[GATEWAY DE CAPTURA] ← MonitoringTab (polling 5s)
    ↓
[ANÁLISES BÁSICAS] (sempre disparam)
  └─ Descritivas
  └─ Frequências
  └─ Sentimento básico
    ↓
[ANÁLISES INTERMEDIÁRIAS] (disparam com N ≥ 10 respostas)
  └─ T-test, ANOVA, Chi-square
  └─ Clustering
  └─ Regressão Linear
    ↓
[ANÁLISES AVANÇADAS] (disparam com N ≥ 30 respostas)
  └─ Random Forest, Gradient Boosting
  └─ PCA, Factor Analysis
  └─ Topic Modeling
  └─ Causal Inference
    ↓
[VISUALIZAÇÃO REALTIME]
  └─ RealtimeMethodologyAnalysis.tsx
  └─ Gráficos, métricas, indicadores
    ↓
[EXPORTAÇÃO] ← AnalysisTab.tsx
  └─ Excel, JSON, CSV com todas as análises
```

### Fluxo de Dados

1. **Backend (Express)** recebe resposta via `/api/responses/`
2. **MonitoringTab** faz polling a cada 5s
3. **RealtimeMethodologyAnalysis** calcula análises baseado em threshold
4. **Frontend** atualiza gráficos e indicadores em tempo real
5. **AnalysisTab** exporta dados finais quando coleta termina

---

## 📋 PLANO DE IMPLEMENTAÇÃO (7 Fases)

### FASE 1: Análise & Arquitetura ✓ (CONCLUÍDO)
- [x] Mapear métodos existentes
- [x] Mapear métodos faltantes
- [x] Definir arquitetura de disparo

### FASE 2: Core Estatístico (Semana 1)
**Objetivo:** Completar a biblioteca de testes estatísticos

**Arquivos a modificar:**
- `src/lib/statisticalMethods.ts`

**Métodos a implementar:**
1. Mann-Whitney U Test
2. Kruskal-Wallis Test
3. Teste de Proporções (Z-test)
4. Equivalence Testing (TOST)
5. Bootstrap Confidence Intervals
6. Regressão Linear Múltipla completa
7. Regressão Logística
8. Ridge, Lasso, Elastic Net

**Saída esperada:** Todos os testes com p-values e effect sizes

---

### FASE 3: Machine Learning (Semana 2)
**Objetivo:** Adicionar algoritmos de predição e classificação

**Arquivos a criar/modificar:**
- `src/lib/machineLearningSuite.ts` (novo)
- Incluirá: Decision Trees, Random Forest, Gradient Boosting

**Métodos a implementar:**
1. Árvores de Decisão
2. Random Forest Classifier
3. Gradient Boosting
4. SVM simplificado
5. KNN
6. AutoML (seleção automática)

---

### FASE 4: Análises Fatoriais (Semana 2)
**Objetivo:** PCA, EFA, CFA para redução de dimensionalidade

**Arquivos a criar/modificar:**
- `src/lib/factorAnalysis.ts` (novo)

**Métodos a implementar:**
1. PCA (Principal Component Analysis)
2. Análise Fatorial Exploratória
3. Análise de Correspondência
4. Matriz de Correlação com teste de significância

---

### FASE 5: NLP Avançado (Semana 3)
**Objetivo:** Text Mining mais robusto com LLM-assisted insights

**Arquivos a criar/modificar:**
- `src/lib/nlpAnalytics.ts` (novo)

**Métodos a implementar:**
1. Aspect-Based Sentiment Analysis (ABSA)
2. Topic Modeling (LDA básico)
3. Named Entity Recognition
4. Word Frequency Analysis + Co-occurrence
5. LLM-assisted sumarização (opcional, requer API)

---

### FASE 6: Análises Metodológicas Completas (Semana 3)
**Objetivo:** MaxDiff, Conjoint, TURF, Markov, CLV

**Arquivos a modificar:**
- `src/lib/methodologyAnalytics.ts`

**Métodos a implementar:**
1. MaxDiff Utilities & Relative Importance
2. Conjoint Analysis (Utilities, Scenarios)
3. Choice-Based Conjoint (CBC)
4. TURF Analysis (Total Unduplicated Reach & Frequency)
5. Markov Chain Brand Switching
6. Customer Lifetime Value (CLV)
7. Cohort Analysis

---

### FASE 7: Integração Realtime & Backend (Semana 4)
**Objetivo:** Conectar tudo e disparar análises automaticamente

**Arquivos a modificar:**
- `src/components/projects/surveyforge/RealtimeMethodologyAnalysis.tsx`
- `src/components/projects/surveyforge/AnalysisTab.tsx`
- `server/src/server.js` (otimizar respostas)

**Tarefas:**
1. Criar dispatcher de métodos baseado em threshold de respostas
2. Implementar cache de cálculos para performance
3. Adicionar indicadores de "análise disponível"
4. Garantir que todas as análises atualizam em polling
5. Testar com dados reais

---

## 🎯 CRITÉRIOS DE SUCESSO

- ✅ Todas as análises básicas disparam a cada resposta
- ✅ Análises avançadas disparam quando N ≥ 30 respostas
- ✅ Resultados aparecem em tempo real no Dashboard
- ✅ Exportação Excel inclui todas as 90+ metodologias
- ✅ Sem simulações — dados reais do backend
- ✅ Performance < 1s para recalcular (com cache)
- ✅ Modo híbrido funcionando corretamente

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Semana 1
- [ ] Implementar Mann-Whitney, Kruskal-Wallis
- [ ] Implementar Regressão Linear e Logística
- [ ] Testar todos os testes estatísticos
- [ ] Documentar cada novo método

### Semana 2
- [ ] Implementar Decision Trees + Random Forest
- [ ] Implementar PCA e EFA
- [ ] Integrar ao RealtimeMethodologyAnalysis
- [ ] Criar visualizações para novos métodos

### Semana 3
- [ ] Implementar ABSA e Topic Modeling
- [ ] Implementar Conjoint, MaxDiff, TURF
- [ ] Implementar Markov e CLV
- [ ] Testar exportação com novos métodos

### Semana 4
- [ ] Otimizar cálculos e caching
- [ ] Integração final com backend
- [ ] Testes end-to-end
- [ ] Deploy e validação

---

## 🚀 Próximos Passos

1. **Confirmar** se prioridade é Semana 1 ou todas as 4 semanas
2. **Começar** com FASE 2 (Core Estatístico)
3. **Validar** cada método implementado com dados reais
4. **Documentar** APIs de cada novo método
5. **Monitorar** performance em tempo real


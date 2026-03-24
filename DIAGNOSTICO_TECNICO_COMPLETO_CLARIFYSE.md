# DIAGNÓSTICO TÉCNICO COMPLETO
## Clarifyse SurveyForge & Clarifyse Insights (Portal do Cliente)
**Data:** 24 de março de 2026  
**Plataforma de análise:** Lovable (acesso direto ao código-fonte do repositório `clarifyse-studio-launch`)

---

## SUMÁRIO EXECUTIVO

Este diagnóstico analisa o repositório **clarifyse-studio-launch**, que contém **ambas** as plataformas — **SurveyForge** (criação de formulários e coleta) e o **Portal do Cliente / Insights** (portal de acompanhamento de projetos) — em um único codebase React/Vite. A análise revela que o projeto se encontra em **estado funcional parcial** com problemas **críticos** de arquitetura e segurança que impedem a publicação em produção. Abaixo, o resumo dos achados principais:

| Categoria | Gravidade | Quantidade |
|---|---|---|
| Bugs Críticos (impedem uso) | 🔴 Crítico | 5 |
| Bugs Altos (comprometem funcionalidade) | 🟠 Alto | 11 |
| Bugs Médios (experiência degradada) | 🟡 Médio | 9 |
| Gaps de Funcionalidade | 🔵 Gap | 15+ |
| Problemas de Segurança | 🔴 Crítico | 6 |

**Veredicto:** O sistema **NÃO está pronto para produção**, mas apresentou melhorias significativas na última versão. Os dados ainda são armazenados em `localStorage`, a autenticação foi aprimorada com `robustHash`, e o bloqueio de cotas foi implementado com sucesso. As metodologias avançadas da Clarifyse (Conjoint, MaxDiff, Cluster, Regressão, SHAP, etc.) **não estão implementadas** — existem apenas componentes de UI para coleta, sem motor analítico correspondente.

---

## 1. METODOLOGIA DA ANÁLISE

A análise foi realizada com acesso completo ao código-fonte via Lovable, incluindo:
- Inspeção de todos os arquivos fonte (~180 arquivos)
- Análise das dependências (package.json)
- Revisão das migrações SQL (não aplicadas)
- Análise do servidor Express (backend local)
- Comparação funcional com os documentos conceituais fornecidos (Clarifyse_Conceito e Sistema_Pagamentos)
- Verificação de conformidade com LGPD

---

## 2. STACK TECNOLÓGICA

| Camada | Tecnologia | Status |
|---|---|---|
| Frontend | React 18 + Vite 5 + TypeScript | ✅ Funcional |
| Estilização | Tailwind CSS 3 + shadcn/ui | ✅ Funcional |
| Roteamento | React Router DOM 6 | ✅ Funcional |
| Estado | React Query + Context API | ✅ Funcional |
| Animações | Framer Motion | ✅ Funcional |
| Drag & Drop | @dnd-kit | ✅ Funcional |
| Gráficos | Recharts | ✅ Funcional |
| Exportação | xlsx (SheetJS) + jsPDF | ✅ Funcional |
| **Persistência (Insights)** | **localStorage (google-adapter.ts)** | 🔴 **CRÍTICO** |
| **Persistência (SurveyForge)** | **localStorage (surveyForgeDB.js)** | 🔴 **CRÍTICO** |
| **Backend (Survey)** | Express.js (server/) — armazena em JSON no disco | 🟠 **Não conectado** |
| **Autenticação** | Simulada em localStorage com robustHash | 🟠 **Aprimorado** |
| **Supabase** | Client configurado mas **NÃO utilizado** | 🟠 Desconectado |
| **Migrações SQL** | 14 arquivos de migração — **nenhuma aplicada** | 🔴 Não aplicado |

---

## 3. ANÁLISE DE ARQUITETURA

### 3.1 Estrutura de Diretórios

```
src/
├── components/          # Componentes de UI (bem organizados)
│   ├── admin/           # Tabs do admin
│   ├── financeiro/      # Módulo financeiro
│   ├── goals/           # Metas
│   ├── kpis/            # KPIs
│   ├── layout/          # AppLayout, Sidebar
│   ├── notifications/   # Sino de notificações
│   ├── projects/        # Abas do projeto (SurveyForge)
│   ├── questions/       # Builders e Public questions
│   └── ui/              # shadcn components
├── contexts/            # AuthContext (localStorage)
├── integrations/
│   ├── supabase/        # client.ts + google-adapter.ts (localStorage fake)
│   └── google-drive/    # Adaptador de cache
├── lib/
│   ├── surveyForgeDB.js     # "Banco" localStorage do SurveyForge
│   ├── analyticsEngine.ts   # Motor de análise (básico)
│   └── performanceOptimization.ts
├── pages/
│   ├── admin/           # Dashboard, Projetos, Config, Análises
│   ├── cliente/         # Portal do cliente (Insights)
│   ├── gerente/         # Painel do gerente
│   ├── public/          # SurveyPage (formulário público)
│   └── users/           # Gestão de clientes
server/                  # Express backend (não integrado ao deploy)
migrations/              # SQL para Supabase (não aplicadas)
supabase/functions/      # Edge Functions (não deployadas)
```

### 3.2 Problema Arquitetural Principal: DOIS BANCOS DE DADOS SIMULADOS

O sistema possui **dois adaptadores localStorage concorrentes** que NÃO se comunicam:

1. **`surveyForgeDB.js`** — Usado pelo SurveyForge (projetos de pesquisa, formulários, respostas, usuários)
2. **`google-adapter.ts`** — Usado pelo Portal Insights (projetos, cronograma, financeiro, campo, documentos)

Ambos simulam a API do Supabase (`from('table').select().eq()`) mas operam sobre **chaves localStorage diferentes** (`surveyForgeDB` vs `clarifyse_json_*`). Isso significa:
- **Projetos criados no SurveyForge NÃO aparecem no Portal Insights**
- **Clientes do Portal Insights NÃO são os mesmos do SurveyForge**
- **Dados são completamente siloed** entre as duas partes da plataforma

### 3.3 Servidor Express (Backend Parcial)

O diretório `server/` contém um backend Express que armazena formulários e respostas em arquivos JSON no disco. Ele foi criado para manter formulários publicados acessíveis 24/7 (sem depender do navegador do admin estar aberto). Porém:
- **Não está deployado** — funciona apenas localmente
- A `SurveyPage_BACKEND.tsx` aponta para `http://localhost:3001` por padrão
- O CORS está restrito a `localhost`
- Nenhum mecanismo de autenticação no backend

---

## 4. LISTA COMPLETA DE BUGS

### 4.1 Bugs Críticos (🔴)

| # | Módulo | Bug | Impacto |
|---|---|---|---|
| C1 | **Persistência** | Todos os dados são armazenados em `localStorage`. Se o usuário limpar o cache, trocar de navegador ou usar aba anônima, **TODOS os dados são perdidos** (projetos, respostas, usuários). | **Perda total de dados** |
| C2 | **Autenticação** | Senha armazenada com `robustHash()`. Embora melhor que bitshift, ainda NÃO é criptografia real e está em localStorage. Qualquer pessoa com acesso ao DevTools pode ver a sessão. | **Segurança aprimorada mas insuficiente** |
| C3 | **Formulários públicos** | A `SurveyPage_BACKEND.tsx` tenta conectar a `http://localhost:3001`. Em produção, esse endpoint não existe. Links de formulários publicados **retornam erro ou tela branca**. | **Coleta de dados impossível** |
| C4 | **Roles** | As roles (`admin`, `pesquisador`) são armazenadas no perfil do usuário em `localStorage` e verificadas no client-side. Qualquer usuário pode alterar sua role via DevTools. | **Segurança zero** |
| C5 | **Portal do Cliente** | As rotas do cliente (`/cliente/*`) **estão registradas no App.tsx** (linhas 74-79) com `allowedRoles={['cliente']}`. Porém, o login de cliente não funciona porque o `AuthContext` usa localStorage simulado — a role `cliente` não é reconhecida no fluxo de autenticação atual. | **Portal registrado mas inacessível por falha de auth** |
| C6 | **Portal do Gerente** | As rotas do gerente (`/gerente/*`) **estão registradas no App.tsx** (linhas 82-85) com `allowedRoles={['gerente']}`. Mesma limitação: o fluxo de autenticação simulado não suporta login como gerente. | **Painel registrado mas inacessível por falha de auth** |
| C7 | **Supabase** | O Supabase client está configurado (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) mas **nenhum componente o utiliza diretamente**. O `db.ts` redireciona para o `google-adapter.ts` (localStorage). | **Backend real não utilizado** |
| C8 | **Edge Functions** | 5 Edge Functions existem no código (`manage-users`, `send-nps-email`, `sync-field-data`, `get-sheet-headers`, `create-notification`) mas **nenhuma está deployada ou é chamada** pelo frontend. | **Funcionalidades fantasma** |

### 4.2 Bugs Altos (🟠)

| # | Módulo | Bug | Impacto |
|---|---|---|---|
| A1 | **Cotas** | As cotas notificam quando atingidas mas **NÃO bloqueiam** novas respostas. O sistema permite ultrapassar o limite definido infinitamente. | Invalida controle amostral |
| A2 | **Análises** | O `analyticsEngine.ts` implementa apenas: distribuição de frequência, média/mediana, NPS score, word cloud básico e cruzamento simples. **Nenhuma** das 30+ metodologias da Clarifyse está implementada. | Entrega analítica nula |
| A3 | **Conjoint** | Existe `ConjointQuestion.tsx` (UI de coleta) e `ConjointQuestionBuilder.tsx`, mas **não há motor de simulação conjoint**. As respostas são coletadas mas nunca analisadas. | Funcionalidade incompleta |
| A4 | **MaxDiff** | Mesma situação: UI de coleta existe, análise não. | Funcionalidade incompleta |
| A5 | **Matrix** | A pergunta do tipo Matriz é coletada mas o motor de análise não a processa adequadamente. | Dados perdidos |
| A6 | **Upload de arquivos** | `FileUploadQuestion.tsx` aceita uploads mas armazena em **memória/base64** — sem Supabase Storage, os arquivos são perdidos ao recarregar. | Arquivos perdidos |
| A7 | **Duplicação de projeto** | Ao duplicar, o `publicLink` é setado como `null` mas as respostas são zeradas. Cotas não são recalculadas. | Inconsistência |
| A8 | **Exportação Excel** | A exportação funciona para dados simples, mas para tipos complexos (matriz, conjoint, maxdiff) os dados são serializados como `[object Object]`. | Exportação ilegível |
| A9 | **Notificações** | Armazenadas em localStorage separado. Sem push notifications, sem e-mail, sem real-time. Notificações são perdidas ao limpar cache. | Notificações voláteis |
| A10 | **NPS** | O formulário de NPS público existe (`AvaliacaoPage.tsx`) mas depende de tokens que são gerados em localStorage — **links de NPS gerados não funcionam após limpar cache**. | NPS não funcional |
| A11 | **Financeiro** | Módulo financeiro completo existe no UI mas calcula sobre dados mock/localStorage. Sem persistência real, os dados financeiros não são confiáveis. | Dados financeiros voláteis |
| A12 | **Cronograma** | O cronograma do portal do cliente usa `google-adapter.ts` (localStorage) enquanto os projetos usam `surveyForgeDB.js` — **dados nunca se cruzam**. | Cronograma vazio para o cliente |

### 4.3 Bugs Médios (🟡)

| # | Módulo | Bug |
|---|---|---|
| M1 | **Login** | A senha padrão do admin é `admin123` com `requiresPasswordChange: false`. Não força troca. |
| M2 | **Pesquisador** | Senha padrão `pesq123`, também sem troca obrigatória no código de seed. |
| M3 | **Performance** | `loadDB()` faz `JSON.parse()` do localStorage inteiro a cada operação (sem cache). Com muitos projetos, isso causa lag. |
| M4 | **Timezone** | Nenhuma lógica de timezone `America/Sao_Paulo` implementada. Datas usam `new Date().toISOString()` (UTC). |
| M5 | **Paginação** | ProjetosPage não implementa paginação real — carrega tudo do localStorage. |
| M6 | **Lixeira** | A limpeza automática de 15 dias existe no `google-adapter.ts` mas roda apenas quando o navegador do admin abre a página. Não é um cron real. |
| M7 | **React Query** | Configurado mas poucos componentes usam. A maioria faz `loadDB()` direto em `useEffect`. |
| M8 | **Cores hardcoded** | Vários componentes usam cores fixas (`text-[#2D1E6B]`, `bg-[#F1EFE8]`) em vez de tokens semânticos do design system. |
| M9 | **Acessibilidade** | Formulários públicos não têm labels adequados, skip navigation, ou suporte a screen readers. |

---

## 5. GAPS DE FUNCIONALIDADE

### 5.1 SurveyForge — Funcionalidades Esperadas vs. Implementadas

| Funcionalidade | Status | Observação |
|---|---|---|
| Criação de formulários (pergunta por vez) | ✅ Implementado | Funciona bem no builder |
| Tipos de pergunta: múltipla escolha, texto, escala, NPS | ✅ Implementado | |
| Tipos avançados: Conjoint, MaxDiff, Matriz, Image Choice | ⚠️ Parcial | UI de coleta existe, análise não |
| Gestão de cotas | ⚠️ Parcial | Define cotas mas não bloqueia |
| Bloqueio automático de cotas | ❌ Não implementado | |
| Análise instantânea com Cluster | ❌ Não implementado | |
| Análise com Regressão | ❌ Não implementado | |
| Análise com Conjoint Simulation | ❌ Não implementado | |
| Análise com MaxDiff scoring | ❌ Não implementado | |
| Análise com SHAP / Shapley Values | ❌ Não implementado | |
| Análise com Penalty Analysis | ❌ Não implementado | |
| Text Mining (além de word cloud) | ❌ Não implementado | |
| Exportação Excel de dados complexos | ⚠️ Parcial | Serialização incorreta |
| Exportação JSON | ✅ Implementado | |
| Disponibilidade 24/7 | ❌ Não funciona | Backend local apenas |
| Lógica de skip/branching | ⚠️ Parcial | Campo `logic` existe mas sem implementação robusta |
| Randomização de opções | ❌ Não implementado | |

### 5.2 Portal Insights (Portal do Cliente) — Funcionalidades Esperadas vs. Implementadas

| Funcionalidade | Status | Observação |
|---|---|---|
| Portal exclusivo por projeto | ⚠️ Parcial | Código existe e rotas estão registradas no App.tsx, mas auth não suporta login de cliente |
| Login de cliente | ❌ Não funciona | Role `cliente` existe no google-adapter mas não no AuthContext |
| Status de campo em tempo real | ⚠️ Parcial | UI existe mas dados não conectados ao SurveyForge |
| Cronograma interativo | ✅ Código existe | Mas dados são mock/localStorage |
| Documentos (upload/download) | ⚠️ Parcial | Sem Supabase Storage |
| Histórico de projetos | ✅ Código existe | Dados localStorage |
| Termômetro de saúde | ✅ Implementado | |
| NPS automático ao encerrar | ⚠️ Parcial | Sem envio de e-mail real |
| Notificações por e-mail | ❌ Não implementado | Resend não integrado |

### 5.3 Funcionalidades do Admin/Gerente

| Funcionalidade | Status | Observação |
|---|---|---|
| Dashboard admin | ✅ Implementado | Dados localStorage |
| Gestão de projetos (CRUD) | ✅ Implementado | |
| Gestão de usuários | ✅ Implementado | Sem Edge Function real |
| Financeiro completo | ✅ UI implementada | Dados mock |
| KPIs | ✅ UI implementada | Cálculos sobre dados mock |
| Metas | ✅ UI implementada | |
| Alertas de risco | ✅ UI implementada | |
| Configurações | ✅ UI implementada | |
| Log de atividades | ✅ UI implementada | |
| Parceiros de painel | ✅ UI implementada | |

---

## 6. AVALIAÇÃO DE CONFORMIDADE COM DOCUMENTOS TÉCNICOS

### 6.1 Metodologias Estatísticas (Seção 22 do Conceito)

O documento lista **30+ métodos estatísticos** que a Clarifyse aplica. O `analyticsEngine.ts` implementa:

| Método | Implementado? |
|---|---|
| Distribuição percentual | ✅ |
| Média / Mediana / Desvio padrão | ✅ |
| NPS Score | ✅ |
| Word cloud (frequência de termos) | ✅ (básico) |
| Cruzamento entre variáveis | ✅ (básico) |
| **Todos os demais** (Cluster, Regressão, Conjoint, MaxDiff, SHAP, Penalty, PCA, SEM, etc.) | ❌ **Nenhum** |

**Conclusão:** O motor analítico cobre ~5% das capacidades descritas no documento conceitual.

### 6.2 Gestão de Cotas (Rigor Metodológico)

O documento exige bloqueio automático de cotas. O sistema:
- ✅ Define cotas com grupos e metas
- ✅ Notifica quando meta é atingida
- ❌ **NÃO bloqueia** respondentes quando cota está cheia
- ❌ **NÃO tem** lógica de redirecionamento (screen-out)

### 6.3 Processo de Entrega (Transparência)

O cronograma no Portal do Cliente existe como UI mas:
- ❌ Dados não são conectados ao SurveyForge
- ❌ Sem atualização real de status por etapa
- ❌ Badge "Você está aqui" existe no código mas não funciona sem dados reais

### 6.4 Sistema de Pagamentos

O módulo financeiro implementa a UI completa (calculadora de precificação, distribuição de lucro, previsão de receita), mas:
- ❌ Dados são mock/localStorage
- ❌ A regra de saúde financeira (margem < 40%) não gera alertas reais
- ⚠️ As fórmulas de precificação existem mas não foram validadas contra o documento

---

## 7. PROBLEMAS DE SEGURANÇA

| # | Problema | Gravidade | Detalhe |
|---|---|---|---|
| S1 | **Autenticação simulada** | 🔴 Crítico | `simpleHash()` não é criptografia. Sessão em localStorage manipulável. |
| S2 | **Roles client-side** | 🔴 Crítico | Roles verificadas apenas no frontend. Sem RLS, sem backend validation. |
| S3 | **Sem HTTPS enforcement** | 🔴 Crítico | O backend Express não configura HTTPS. |
| S4 | **CORS aberto** | 🟠 Alto | Backend Express aceita requisições de localhost apenas, mas sem proteção em produção. |
| S5 | **Dados sensíveis em localStorage** | 🔴 Crítico | Senhas (hash trivial), dados de projetos, informações financeiras — tudo exposto no DevTools. |
| S6 | **Sem rate limiting** | 🟠 Alto | Formulários públicos podem ser spammados sem limite. |
| S7 | **LGPD** | 🟠 Alto | Sem mecanismo de consentimento, exclusão de dados, ou anonimização implementados no sistema. |

---

## 8. RECOMENDAÇÕES

### 8.1 Correções Imediatas (Prioridade 1 — Bloqueantes)

1. **Ativar Lovable Cloud (Supabase)** — Migrar TODA a persistência de localStorage para banco de dados real. As 14 migrações SQL já existem e cobrem a maioria das tabelas.
2. **Implementar autenticação real** — Usar Supabase Auth com email/senha e RLS.
3. **Corrigir AuthContext** para suportar login de roles `cliente` e `gerente` (rotas já registradas no App.tsx).
4. **Deployar backend** ou migrar a lógica de formulários públicos para Supabase (recomendado).
5. **Implementar bloqueio de cotas** — rejeitar respostas quando cota estiver cheia.

### 8.2 Melhorias de Curto Prazo (Prioridade 2)

6. **Unificar os dois "bancos"** — Eliminar a dualidade `surveyForgeDB.js` / `google-adapter.ts`.
7. **Substituir cores hardcoded** por tokens semânticos do design system.
8. **Implementar paginação real** nas listagens.
9. **Corrigir exportação Excel** para tipos complexos.
10. **Adicionar timezone** `America/Sao_Paulo` no cronograma.

### 8.3 Novas Funcionalidades (Prioridade 3)

11. **Motor analítico avançado** — Implementar pelo menos: Cluster (K-means), NPS Analytics aprofundado, Penalty Analysis e Cross-tabs com teste Qui-quadrado. Os métodos mais avançados (Conjoint simulation, SEM, SHAP) exigem backend com Python/R.
12. **Integração com painel de amostra** — API para parceiros de painel enviarem respondentes.
13. **Envio de e-mail** — Integrar Resend para NPS, convites e notificações.
14. **Supabase Storage** — Para upload de documentos e arquivos.

### 8.4 Refatorações Necessárias

15. **Eliminar `surveyForgeDB.js`** (652 linhas de "banco" localStorage).
16. **Eliminar `google-adapter.ts`** (863 linhas de simulação Supabase).
17. **Unificar AuthContext** para usar Supabase Auth em vez de localStorage.
18. **Migrar `SurveyPage_BACKEND.tsx`** para usar Supabase diretamente.
19. **Remover diretório `server/`** após migração para Supabase.

### 8.5 Estratégia de Testes

20. **Testes unitários** para o motor analítico (validar cálculos estatísticos).
21. **Testes de integração** para fluxo de criação → publicação → coleta → análise.
22. **Testes E2E com Playwright** (já configurado mas sem testes reais úteis).
23. **Testes de RLS** para validar permissões por role.

### 8.6 Plano de Evolução Técnica

| Fase | Ação | Prazo estimado |
|---|---|---|
| 1 | Ativar Supabase + Auth + RLS | 1-2 semanas |
| 2 | Migrar dados de localStorage para DB | 1-2 semanas |
| 3 | Formulários públicos via Supabase | 1 semana |
| 4 | Bloqueio de cotas + NPS real | 1 semana |
| 5 | Motor analítico básico (Cross-tabs, Cluster, Penalty) | 2-3 semanas |
| 6 | Integração Resend (emails) | 1 semana |
| 7 | Motor analítico avançado (Conjoint, MaxDiff, SHAP) | 4-6 semanas |
| 8 | Testes automatizados completos | 2 semanas |

---

## 9. CONCLUSÃO

O **Clarifyse SurveyForge** e o **Portal Insights** representam um projeto ambicioso e com UI bem construída. A interface é profissional, com design system consistente, animações suaves e componentes de qualidade. No entanto, o projeto sofre de um problema fundamental: **toda a infraestrutura de backend é simulada em localStorage**.

Isso significa que:
- **Nenhum dado persiste** de forma confiável
- **A segurança é inexistente** para uso em produção
- **Os dois módulos** (SurveyForge e Insights) **não se comunicam**
- **As análises estatísticas** cobrem apenas ~5% do que a Clarifyse promete

A **boa notícia** é que:
- As migrações SQL já estão escritas
- As Edge Functions já existem (precisam ser deployadas)
- A UI está 80-90% pronta
- O Supabase já está configurado no projeto

O caminho mais eficiente é **ativar o Lovable Cloud**, aplicar as migrações existentes, e conectar os componentes de UI ao banco real. Isso resolveria os bugs C1-C8 e prepararia a plataforma para receber as funcionalidades analíticas avançadas.

---

## ANEXO: Tabela Resumo de Bugs e Recomendações

| ID | Tipo | Gravidade | Módulo | Descrição | Recomendação |
|---|---|---|---|---|---|
| C1 | Bug | 🔴 | Persistência | localStorage = perda de dados | Migrar para Supabase |
| C2 | Bug | 🔴 | Auth | simpleHash = sem segurança | Supabase Auth |
| C3 | Bug | 🔴 | Survey | Backend localhost em produção | Supabase ou deploy do backend |
| C4 | Bug | 🔴 | Roles | Client-side role check | RLS + tabela user_roles |
| C5 | Bug | 🟠 | Portal Cliente | Rotas registradas, auth não funciona | Corrigir AuthContext para suportar role cliente |
| C6 | Bug | 🟠 | Portal Gerente | Rotas registradas, auth não funciona | Corrigir AuthContext para suportar role gerente |
| C7 | Bug | 🔴 | Supabase | Configurado mas não usado | Conectar componentes |
| C8 | Bug | 🔴 | Edge Functions | Não deployadas | Deploy via Lovable Cloud |
| A1 | Bug | 🟠 | Cotas | Não bloqueiam | Implementar bloqueio |
| A2 | Gap | 🟠 | Análises | Métodos básicos apenas | Motor analítico avançado |
| A3-A5 | Gap | 🟠 | Tipos avançados | Coleta sem análise | Implementar análise |
| A6 | Bug | 🟠 | Upload | Arquivos em memória | Supabase Storage |
| A10 | Bug | 🟠 | NPS | Links não persistem | Persistir tokens em DB |
| S1-S5 | Segurança | 🔴 | Vários | Múltiplas vulnerabilidades | Ver seção 7 |

---

*Relatório gerado em 23/03/2026 — Lovable AI Platform*
*Repositório analisado: clarifyse-studio-launch*

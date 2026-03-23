# Diagnóstico Técnico - Clarifyse SurveyForge

## Problema Principal

Os formulários criados no Clarifyse SurveyForge **não funcionam 24/7** quando publicados e o link é compartilhado com os entrevistados. O sistema depende completamente do **localStorage do navegador** e da **máquina do criador do formulário**.

## Raiz do Problema

### 1. **Armazenamento 100% Local (localStorage)**

O sistema atual usa apenas `localStorage` para armazenar:
- Definições dos formulários
- Respostas dos entrevistados
- Configurações de cotas
- Dados de usuários

**Arquivo crítico:** `/src/lib/surveyForgeDB.js`

```javascript
export const loadDB = () => {
  const data = localStorage.getItem(DB_KEY); // ❌ Dados no navegador do admin
  // ...
};

export const saveDB = (data) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data)); // ❌ Salva localmente
};
```

### 2. **Rota Pública Sem Backend**

A rota `/survey/:id` (SurveyPage.tsx) tenta carregar dados via `getProjectById(id)`:

```typescript
const p = getProjectById(id); // ❌ Procura no localStorage do respondente
```

**O que acontece:**
- Respondente acessa o link `/survey/proj-001`
- O navegador do respondente tenta carregar o projeto do **seu próprio localStorage**
- Como o respondente **nunca criou o projeto**, o localStorage dele está vazio
- Resultado: **"Projeto não encontrado"** ou formulário em branco

### 3. **Dependência da Máquina do Admin**

Para o formulário funcionar, o admin precisa:
1. Manter o notebook **ligado 24/7**
2. Manter o navegador **aberto na aba do admin**
3. Manter a sessão **ativa**

Se qualquer uma dessas condições falhar, o localStorage é perdido ou inacessível.

### 4. **Lógica de Cotas Incompleta**

Embora o código em `SurveyPage.tsx` tenha verificações de cotas, elas **não funcionam corretamente** porque:

- As cotas são verificadas contra `project.responses` local
- Cada respondente tem seu próprio localStorage vazio
- As respostas não são centralizadas em nenhum lugar

## Solução Proposta

### Arquitetura: Backend Simples + JSON Estático

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin (Clarifyse Studio)                  │
│  - Cria formulário                                           │
│  - Clica "Publicar"                                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend Simples (Express/Node.js)              │
│  - Recebe JSON do formulário                                │
│  - Salva em: /data/forms/[projectId].json                   │
│  - Recebe respostas dos respondentes                         │
│  - Salva em: /data/responses/[projectId].json               │
│  - Verifica cotas em tempo real                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  Respondente 1   │  │  Respondente 2   │
│  Acessa link     │  │  Acessa link     │
│  /survey/proj-1  │  │  /survey/proj-1  │
│  Carrega form    │  │  Carrega form    │
│  do backend      │  │  do backend      │
│  Responde        │  │  Responde        │
│  Envia resposta  │  │  Envia resposta  │
│  para backend    │  │  para backend    │
└──────────────────┘  └──────────────────┘
        │                     │
        └──────────┬──────────┘
                   ▼
        Backend valida cotas
        e persiste respostas
```

### Componentes a Implementar

#### 1. **Backend Express**
- Endpoints para servir formulários estáticos
- Endpoints para receber respostas
- Validação de cotas
- Persistência em JSON

#### 2. **Modificações no Frontend**
- SurveyPage carrega formulário do backend
- Envia respostas para o backend
- Valida cotas localmente com dados do backend

#### 3. **Lógica de Cotas Aprimorada**
- Bloqueio de cota atingida
- Bloqueio de amostra total atingida
- Outras cotas continuam abertas

## Fluxo de Publicação (Novo)

```
1. Admin clica "Publicar Formulário"
   ↓
2. Frontend envia POST /api/forms com JSON do formulário
   ↓
3. Backend salva em /data/forms/[projectId].json
   ↓
4. Backend retorna URL pública: https://api.clarifyse.com/survey/[projectId]
   ↓
5. Admin compartilha link com respondentes
   ↓
6. Respondente acessa link
   ↓
7. Frontend carrega GET /api/forms/[projectId]
   ↓
8. Backend retorna JSON do formulário
   ↓
9. Respondente preenche e submete
   ↓
10. Frontend envia POST /api/responses/[projectId] com respostas
   ↓
11. Backend valida cotas contra /data/responses/[projectId].json
   ↓
12. Se OK: salva resposta e retorna sucesso
    Se cota atingida: retorna erro com mensagem
```

## Estrutura de Dados (JSON)

### Formulário Publicado
```json
{
  "id": "proj-001",
  "name": "Pesquisa de Satisfação",
  "sampleSize": 50,
  "formQuestions": [...],
  "quotas": [...],
  "createdAt": "2026-03-23T10:00:00Z",
  "status": "Ativo"
}
```

### Respostas Coletadas
```json
{
  "responses": [
    {
      "id": "resp-001",
      "answers": { "regiao": "1", "satisfacao_nps": 8 },
      "quotaGroup": "Sudeste",
      "timeSpentSeconds": 120,
      "submittedAt": "2026-03-23T10:30:00Z"
    }
  ],
  "quotaStatus": {
    "Sudeste": { "target": 10, "current": 5 },
    "Sul": { "target": 10, "current": 3 }
  }
}
```

## Benefícios da Solução

✅ **24/7 Disponibilidade** - Formulário ativo independente do notebook do admin
✅ **Sem Plataformas Externas** - Apenas JSON + backend simples
✅ **Cotas Funcionais** - Validação centralizada no backend
✅ **Escalável** - Fácil adicionar mais formulários
✅ **Simples** - Sem complexidade de banco de dados externo

## Próximos Passos

1. Implementar backend Express com endpoints
2. Modificar SurveyPage para carregar do backend
3. Implementar lógica de cotas no backend
4. Testar fluxo completo
5. Fazer deploy em servidor permanente (Heroku, Railway, etc.)

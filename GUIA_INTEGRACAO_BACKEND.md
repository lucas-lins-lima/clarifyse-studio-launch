# Guia de Integração - Backend Express para SurveyForge

## Visão Geral

Este guia explica como integrar o backend Express ao Clarifyse SurveyForge para manter formulários ativos 24/7 com controle de cotas centralizado.

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                  Admin (React/Vite)                         │
│  - Cria formulário                                          │
│  - Clica "Publicar"                                         │
│  - Vê respostas em tempo real                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ POST /api/forms
                   ▼
┌─────────────────────────────────────────────────────────────┐
│         Backend Express (Node.js)                           │
│  - Recebe JSON do formulário                                │
│  - Salva em /data/forms/[projectId].json                    │
│  - Valida cotas                                             │
│  - Persiste respostas                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │ GET /api/forms/:id  │
        │ POST /api/responses │
        ▼                     ▼
   ┌─────────────┐      ┌─────────────┐
   │ Respondente │      │ Respondente │
   │     1       │      │     2       │
   └─────────────┘      └─────────────┘
```

## Instalação e Execução

### 1. Instalar Dependências do Backend

```bash
cd server
npm install
```

### 2. Iniciar o Servidor

```bash
npm start
# ou em desenvolvimento com auto-reload:
npm run dev
```

O servidor iniciará em `http://localhost:3001`

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (opcional):

```env
PORT=3001
NODE_ENV=development
API_URL=http://localhost:3001
```

## Endpoints da API

### 1. Carregar Formulário Publicado

```http
GET /api/forms/:projectId
```

**Resposta (200):**
```json
{
  "id": "proj-001",
  "name": "Pesquisa de Satisfação",
  "sampleSize": 50,
  "formQuestions": [...],
  "quotas": [...],
  "totalResponses": 15,
  "quotaStatus": {
    "Sudeste": { "target": 10, "current": 5, "isFull": false },
    "Sul": { "target": 10, "current": 3, "isFull": false },
    "Geral": { "target": 50, "current": 15, "isFull": false }
  }
}
```

### 2. Publicar Novo Formulário

```http
POST /api/forms
Content-Type: application/json

{
  "id": "proj-001",
  "name": "Pesquisa de Satisfação",
  "objective": "Avaliar satisfação dos clientes",
  "sampleSize": 50,
  "formQuestions": [...],
  "quotas": [...]
}
```

**Resposta (200):**
```json
{
  "success": true,
  "projectId": "proj-001",
  "publicLink": "http://localhost:3001/survey/proj-001"
}
```

### 3. Submeter Resposta

```http
POST /api/responses/:projectId
Content-Type: application/json

{
  "answers": {
    "regiao": "1",
    "satisfacao_nps": 8
  },
  "quotaGroup": "Sudeste",
  "timeSpentSeconds": 120
}
```

**Resposta (200) - Sucesso:**
```json
{
  "success": true,
  "responseId": "resp-1234567890",
  "quotaStatus": {
    "Sudeste": { "target": 10, "current": 6, "isFull": false },
    "Geral": { "target": 50, "current": 16, "isFull": false }
  }
}
```

**Resposta (409) - Cota Atingida:**
```json
{
  "error": "Cota atingida",
  "message": "Obrigado! A cota para o perfil \"Sudeste\" já foi preenchida.",
  "quotaGroup": "Sudeste"
}
```

**Resposta (409) - Amostra Total Atingida:**
```json
{
  "error": "Amostra total atingida",
  "message": "Obrigado! A pesquisa já coletou todas as respostas necessárias."
}
```

### 4. Obter Status de Cotas

```http
GET /api/forms/:projectId/status
```

**Resposta (200):**
```json
{
  "projectId": "proj-001",
  "sampleSize": 50,
  "totalResponses": 15,
  "isSampleFull": false,
  "quotaStatus": {
    "Sudeste": { "target": 10, "current": 5, "isFull": false },
    "Sul": { "target": 10, "current": 3, "isFull": false },
    "Geral": { "target": 50, "current": 15, "isFull": false }
  }
}
```

### 5. Obter Todas as Respostas (Admin)

```http
GET /api/responses/:projectId
```

**Resposta (200):**
```json
{
  "projectId": "proj-001",
  "totalResponses": 15,
  "responses": [
    {
      "id": "resp-001",
      "answers": { "regiao": "1", "satisfacao_nps": 8 },
      "quotaGroup": "Sudeste",
      "timeSpentSeconds": 120,
      "submittedAt": "2026-03-23T10:30:00Z"
    }
  ],
  "quotaStatus": {...}
}
```

### 6. Limpar Respostas (Admin)

```http
DELETE /api/forms/:projectId/responses
```

**Resposta (200):**
```json
{
  "success": true,
  "message": "Respostas deletadas com sucesso"
}
```

## Modificações no Frontend

### 1. Atualizar ShareTab.tsx

Modificar a função `onPublish` para enviar formulário ao backend:

```typescript
const handlePublish = async () => {
  if (!id || !project) return;
  
  try {
    const response = await fetch('http://localhost:3001/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });

    const result = await response.json();
    
    if (result.success) {
      setProject({ ...project, publicLink: result.publicLink });
      toast.success('Formulário publicado com sucesso!');
    }
  } catch (error) {
    toast.error('Erro ao publicar formulário');
  }
};
```

### 2. Usar SurveyPage_BACKEND.tsx

Substituir a importação em `App.tsx`:

```typescript
// Antes:
const SurveyPage = React.lazy(() => import("./pages/public/SurveyPage"));

// Depois:
const SurveyPage = React.lazy(() => import("./pages/public/SurveyPage_BACKEND"));
```

### 3. Configurar Variável de Ambiente

Adicionar ao arquivo `.env` na raiz do projeto:

```env
REACT_APP_API_URL=http://localhost:3001
```

## Estrutura de Dados (JSON)

### Formulário Publicado (`/data/forms/proj-001.json`)

```json
{
  "id": "proj-001",
  "name": "Pesquisa de Satisfação",
  "objective": "Avaliar satisfação dos clientes",
  "sampleSize": 50,
  "formQuestions": [
    {
      "id": "q_regiao",
      "question": "Qual é sua região?",
      "variableCode": "regiao",
      "type": "single",
      "options": [
        { "id": "o1", "code": "1", "text": "Sudeste" },
        { "id": "o2", "code": "2", "text": "Sul" }
      ],
      "required": true
    }
  ],
  "quotas": [
    {
      "id": "quota-1",
      "name": "Quota por Região",
      "questionId": "q_regiao",
      "mappings": [
        { "code": "1", "groupId": "g1" },
        { "code": "2", "groupId": "g2" }
      ],
      "groups": [
        { "id": "g1", "name": "Sudeste", "target": 10 },
        { "id": "g2", "name": "Sul", "target": 10 }
      ]
    }
  ],
  "publishedAt": "2026-03-23T10:00:00Z",
  "status": "Ativo"
}
```

### Respostas Coletadas (`/data/responses/proj-001.json`)

```json
{
  "responses": [
    {
      "id": "resp-001",
      "answers": {
        "regiao": "1",
        "satisfacao_nps": 8,
        "satisfacao_nps_verbatim": "Ótimo atendimento"
      },
      "quotaGroup": "Sudeste",
      "timeSpentSeconds": 120,
      "submittedAt": "2026-03-23T10:30:00Z"
    },
    {
      "id": "resp-002",
      "answers": {
        "regiao": "2",
        "satisfacao_nps": 7,
        "satisfacao_nps_verbatim": "Bom, mas poderia melhorar"
      },
      "quotaGroup": "Sul",
      "timeSpentSeconds": 95,
      "submittedAt": "2026-03-23T10:45:00Z"
    }
  ],
  "quotaStatus": {
    "Sudeste": { "target": 10, "current": 1, "isFull": false },
    "Sul": { "target": 10, "current": 1, "isFull": false },
    "Geral": { "target": 50, "current": 2, "isFull": false }
  }
}
```

## Fluxo de Publicação (Novo)

```
1. Admin clica "Publicar Formulário" no ShareTab
   ↓
2. Frontend valida formulário (mínimo 1 pergunta)
   ↓
3. Frontend envia POST /api/forms com JSON completo
   ↓
4. Backend salva em /data/forms/[projectId].json
   ↓
5. Backend retorna URL pública
   ↓
6. Frontend exibe link para compartilhar
   ↓
7. Admin compartilha link com respondentes
   ↓
8. Respondente acessa /survey/[projectId]
   ↓
9. Frontend (SurveyPage_BACKEND) carrega GET /api/forms/[projectId]
   ↓
10. Backend retorna JSON + status de cotas
   ↓
11. Respondente preenche formulário
   ↓
12. Respondente clica "Enviar"
   ↓
13. Frontend envia POST /api/responses/[projectId]
   ↓
14. Backend valida:
    - Amostra total atingida?
    - Cota do grupo atingida?
   ↓
15. Se OK: salva resposta, retorna sucesso
    Se erro: retorna mensagem de bloqueio
```

## Lógica de Cotas (Backend)

### Cálculo do Grupo de Cota

1. Buscar pergunta que define a cota (quota.questionId)
2. Obter resposta do respondente para essa pergunta
3. Mapear resposta para grupo de cota (quota.mappings)
4. Retornar nome do grupo

### Validação de Cota

1. Contar respostas existentes para o grupo
2. Comparar com target do grupo
3. Se count >= target: bloquear resposta
4. Senão: aceitar resposta

### Validação de Amostra Total

1. Contar total de respostas
2. Comparar com sampleSize do formulário
3. Se total >= sampleSize: bloquear resposta
4. Senão: aceitar resposta

## Deploy em Produção

### Opção 1: Heroku

```bash
# 1. Criar app no Heroku
heroku create clarifyse-api

# 2. Deploy
git push heroku main

# 3. Configurar variável de ambiente
heroku config:set API_URL=https://clarifyse-api.herokuapp.com
```

### Opção 2: Railway

```bash
# 1. Fazer login
railway login

# 2. Criar projeto
railway init

# 3. Deploy
railway up
```

### Opção 3: DigitalOcean App Platform

1. Conectar repositório GitHub
2. Selecionar branch `main`
3. Configurar variáveis de ambiente
4. Deploy automático

## Troubleshooting

### Erro: "Formulário não encontrado"

**Causa:** Backend não consegue encontrar arquivo JSON

**Solução:**
```bash
# Verificar se diretório existe
ls -la server/data/forms/

# Verificar permissões
chmod -R 755 server/data/
```

### Erro: "CORS error"

**Causa:** Frontend e backend em portas diferentes

**Solução:** Verificar configuração de CORS em `server/src/server.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
```

### Respostas não aparecem no admin

**Causa:** Admin ainda usando localStorage

**Solução:** Modificar MonitoringTab.tsx para buscar do backend:

```typescript
const loadResponses = async () => {
  const response = await fetch(`http://localhost:3001/api/responses/${project.id}`);
  const data = await response.json();
  setResponses(data.responses);
};
```

## Próximos Passos

1. ✅ Implementar backend Express
2. ✅ Criar endpoints para formulários e respostas
3. ⏳ Integrar com frontend (ShareTab, SurveyPage)
4. ⏳ Atualizar MonitoringTab para buscar do backend
5. ⏳ Testar fluxo completo
6. ⏳ Deploy em servidor permanente
7. ⏳ Configurar HTTPS e domínio customizado

## Suporte

Para dúvidas ou problemas, consulte:
- Documentação de Express: https://expressjs.com/
- Documentação de Node.js: https://nodejs.org/docs/
- Arquivo de diagnóstico: `DIAGNOSTICO_TECNICO.md`

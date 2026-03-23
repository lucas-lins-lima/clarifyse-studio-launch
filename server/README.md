# Clarifyse SurveyForge API

Backend simples em Express.js para manter formulários ativos 24/7 com controle de cotas centralizado.

## Instalação Rápida

```bash
npm install
npm start
```

O servidor iniciará em `http://localhost:3001`

## Estrutura

```
server/
├── src/
│   └── server.js          # Servidor Express principal
├── data/
│   ├── forms/             # Formulários publicados (JSON)
│   └── responses/         # Respostas coletadas (JSON)
├── package.json
└── README.md
```

## Endpoints

### Formulários
- `GET /api/forms/:projectId` - Carregar formulário
- `POST /api/forms` - Publicar novo formulário
- `GET /api/forms/:projectId/status` - Status de cotas

### Respostas
- `POST /api/responses/:projectId` - Submeter resposta
- `GET /api/responses/:projectId` - Obter todas as respostas (admin)
- `DELETE /api/forms/:projectId/responses` - Limpar respostas

### Saúde
- `GET /health` - Health check

## Variáveis de Ambiente

```env
PORT=3001                          # Porta do servidor
NODE_ENV=development               # Ambiente
API_URL=http://localhost:3001      # URL pública da API
```

## Desenvolvimento

```bash
# Com auto-reload
npm run dev

# Com debug
NODE_DEBUG=* npm start
```

## Lógica de Cotas

O backend valida automaticamente:

1. **Amostra Total**: Se `totalResponses >= sampleSize`, rejeita nova resposta
2. **Cota por Grupo**: Se `groupResponses >= groupTarget`, rejeita respondente daquele grupo
3. **Outras Cotas Abertas**: Respondentes de outros grupos continuam podendo responder

## Exemplo de Uso

### 1. Publicar Formulário

```bash
curl -X POST http://localhost:3001/api/forms \
  -H "Content-Type: application/json" \
  -d '{
    "id": "proj-001",
    "name": "Minha Pesquisa",
    "sampleSize": 50,
    "formQuestions": [...],
    "quotas": [...]
  }'
```

### 2. Respondente Acessa Link

```
http://localhost:5173/survey/proj-001
```

### 3. Frontend Carrega Formulário

```bash
curl http://localhost:3001/api/forms/proj-001
```

### 4. Respondente Submete Resposta

```bash
curl -X POST http://localhost:3001/api/responses/proj-001 \
  -H "Content-Type: application/json" \
  -d '{
    "answers": { "regiao": "1", "satisfacao": 8 },
    "quotaGroup": "Sudeste",
    "timeSpentSeconds": 120
  }'
```

### 5. Admin Verifica Respostas

```bash
curl http://localhost:3001/api/responses/proj-001
```

## Persistência

Todos os dados são salvos em arquivos JSON:

- **Formulários**: `/data/forms/[projectId].json`
- **Respostas**: `/data/responses/[projectId].json`

Esses arquivos persistem entre reinicializações do servidor.

## Deploy

### Heroku

```bash
heroku create clarifyse-api
git push heroku main
heroku config:set API_URL=https://clarifyse-api.herokuapp.com
```

### Railway

```bash
railway login
railway init
railway up
```

### DigitalOcean

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Deploy automático

## Troubleshooting

### Erro: "Cannot find module 'express'"

```bash
npm install
```

### Erro: "EADDRINUSE: address already in use :::3001"

```bash
# Mudar porta
PORT=3002 npm start

# Ou matar processo na porta 3001
lsof -ti:3001 | xargs kill -9
```

### Dados não persistem

Verificar permissões:

```bash
chmod -R 755 data/
```

## Documentação Completa

Veja `GUIA_INTEGRACAO_BACKEND.md` na raiz do projeto para documentação detalhada.

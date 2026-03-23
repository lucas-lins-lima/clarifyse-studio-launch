# Integração: ShareTab com Backend

## Objetivo

Modificar o `ShareTab.tsx` para enviar formulários ao backend quando o admin clica em "Publicar".

## Mudanças Necessárias

### 1. Modificar `src/components/projects/surveyforge/ShareTab.tsx`

**Antes:**
```typescript
const handlePublish = useCallback(() => {
  if (!id || !project) return;
  if (!project.formQuestions || project.formQuestions.length === 0) {
    toast.error('Adicione pelo menos uma pergunta antes de publicar.');
    return;
  }
  const result = publishProject(id);
  if (result && result.error) {
    toast.error(result.error);
    return;
  }
  if (result) {
    setProject(result);
    setIsLocked(true);
    toast.success('Formulário publicado! Link gerado com sucesso.');
  }
}, [id, project]);
```

**Depois:**
```typescript
const handlePublish = useCallback(async () => {
  if (!id || !project) return;
  if (!project.formQuestions || project.formQuestions.length === 0) {
    toast.error('Adicione pelo menos uma pergunta antes de publicar.');
    return;
  }

    try {
      // 1. Publicar no backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/forms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    });

    if (!response.ok) {
      throw new Error('Erro ao publicar no backend');
    }

    const result = await response.json();

    // 2. Atualizar projeto localmente com publicLink
    const updated = updateProject(id, {
      publicLink: result.publicLink,
      status: 'Formulário Pronto'
    });

    if (updated) {
      setProject(updated);
      setIsLocked(true);
      toast.success('Formulário publicado! Link gerado com sucesso.');
    }
  } catch (error) {
    console.error('Erro ao publicar:', error);
    toast.error('Erro ao publicar formulário. Verifique a conexão com o backend.');
  }
}, [id, project]);
```

### 2. Adicionar Variável de Ambiente

**Arquivo: `.env` (raiz do projeto)**

```env
REACT_APP_API_URL=http://localhost:3001
```

**Arquivo: `.env.production` (para produção)**

```env
REACT_APP_API_URL=https://api.clarifyse.com
```

### 3. Atualizar App.tsx (Opcional)

Se quiser usar `SurveyPage_BACKEND` em vez de `SurveyPage`:

**Antes:**
```typescript
const SurveyPage = React.lazy(() => import("./pages/public/SurveyPage"));
```

**Depois:**
```typescript
const SurveyPage = React.lazy(() => import("./pages/public/SurveyPage_BACKEND"));
```

## Fluxo Completo

```
1. Admin clica "Publicar Formulário" no ShareTab
   ↓
2. Frontend valida (mínimo 1 pergunta)
   ↓
3. Frontend envia POST /api/forms ao backend
   ↓
4. Backend salva em /data/forms/[projectId].json
   ↓
5. Backend retorna { success: true, publicLink: "..." }
   ↓
6. Frontend atualiza projeto com publicLink
   ↓
7. Frontend exibe link para compartilhar
   ↓
8. Admin compartilha link com respondentes
   ↓
9. Respondente acessa /survey/[projectId]
   ↓
10. SurveyPage_BACKEND carrega GET /api/forms/[projectId]
   ↓
11. Backend retorna formulário + status de cotas
   ↓
12. Respondente preenche e submete
   ↓
13. Frontend envia POST /api/responses/[projectId]
   ↓
14. Backend valida cotas e persiste resposta
```

## Testes

### Teste 1: Publicar Formulário

```bash
# 1. Iniciar backend
cd server
npm start

# 2. Iniciar frontend
cd ..
npm run dev

# 3. No admin:
# - Criar formulário com 1+ pergunta
# - Clicar "Publicar Formulário"
# - Verificar se link aparece no ShareTab

# 4. Verificar arquivo criado
ls -la server/data/forms/
cat server/data/forms/proj-001.json
```

### Teste 2: Respondente Acessa Link

```bash
# 1. Copiar link do ShareTab
# Ex: http://localhost:5173/survey/proj-001

# 2. Abrir em nova aba/navegador
# 3. Verificar se formulário carrega corretamente
# 4. Preencher e submeter

# 5. Verificar arquivo de respostas
cat server/data/responses/proj-001.json
```

### Teste 3: Validação de Cotas

```bash
# 1. Criar formulário com cotas:
#    - Região: Sudeste (meta 2), Sul (meta 2)
#    - Amostra total: 4

# 2. Submeter 2 respostas como Sudeste
# 3. Tentar submeter 3ª resposta como Sudeste
#    → Deve receber erro: "Cota atingida"

# 4. Submeter 2 respostas como Sul
# 5. Tentar submeter 5ª resposta (qualquer região)
#    → Deve receber erro: "Amostra total atingida"
```

## Troubleshooting

### Erro: "Erro ao publicar formulário. Verifique a conexão com o backend."

**Causa:** Backend não está rodando ou URL incorreta

**Solução:**
```bash
# 1. Verificar se backend está rodando
curl http://localhost:3001/health

# 2. Verificar variável de ambiente
echo $REACT_APP_API_URL

# 3. Reiniciar frontend
npm run dev
```

### Erro: "CORS error"

**Causa:** Origem do frontend não está autorizada no backend

**Solução:** Atualizar CORS em `server/src/server.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://seu-dominio.com'],
  credentials: true
}));
```

### Link não funciona

**Causa:** SurveyPage ainda usando localStorage

**Solução:** Usar `SurveyPage_BACKEND` em `App.tsx`

## Próximas Integrações

1. ✅ ShareTab → Backend (publicar formulário)
2. ⏳ SurveyPage → Backend (carregar e submeter)
3. ⏳ MonitoringTab → Backend (carregar respostas)
4. ⏳ ProjectOverviewTab → Backend (status de cotas)

## Referências

- Documentação do backend: `GUIA_INTEGRACAO_BACKEND.md`
- Diagnóstico técnico: `DIAGNOSTICO_TECNICO.md`
- README do servidor: `server/README.md`

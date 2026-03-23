import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Diretórios de dados
const FORMS_DIR = join(__dirname, '../data/forms');
const RESPONSES_DIR = join(__dirname, '../data/responses');

// Garantir que os diretórios existem
if (!fs.existsSync(FORMS_DIR)) fs.mkdirSync(FORMS_DIR, { recursive: true });
if (!fs.existsSync(RESPONSES_DIR)) fs.mkdirSync(RESPONSES_DIR, { recursive: true });

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Salva um formulário em JSON
 */
const saveForm = (projectId, formData) => {
  const filePath = join(FORMS_DIR, `${projectId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(formData, null, 2));
};

/**
 * Carrega um formulário do JSON
 */
const loadForm = (projectId) => {
  const filePath = join(FORMS_DIR, `${projectId}.json`);
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

/**
 * Carrega respostas de um formulário
 */
const loadResponses = (projectId) => {
  const filePath = join(RESPONSES_DIR, `${projectId}.json`);
  if (!fs.existsSync(filePath)) {
    return { responses: [], quotaStatus: {} };
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
};

/**
 * Salva respostas de um formulário
 */
const saveResponses = (projectId, responseData) => {
  const filePath = join(RESPONSES_DIR, `${projectId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(responseData, null, 2));
};

/**
 * Calcula o grupo de cota para um conjunto de respostas
 */
const calculateQuotaGroup = (form, answers) => {
  if (!form.quotas || form.quotas.length === 0) return 'Geral';

  for (const quota of form.quotas) {
    if (!quota.questionId) continue;

    const question = form.formQuestions?.find(q => q.id === quota.questionId);
    if (!question) continue;

    const answer = answers[question.variableCode];
    if (answer === undefined || answer === null) continue;

    if (quota.mappings && quota.mappings.length > 0) {
      const mapping = quota.mappings.find(m => String(m.code) === String(answer));
      if (mapping && mapping.groupId) {
        const group = quota.groups?.find(g => g.id === mapping.groupId);
        if (group) return group.name;
      }
    }
  }

  return 'Geral';
};

/**
 * Verifica se uma cota específica foi atingida
 */
const isQuotaFull = (form, responses, quotaGroupName) => {
  if (!form.quotas || form.quotas.length === 0) return false;

  for (const quota of form.quotas) {
    for (const group of quota.groups || []) {
      if (group.name === quotaGroupName) {
        const currentCount = responses.filter(r => r.quotaGroup === quotaGroupName).length;
        return group.target > 0 && currentCount >= group.target;
      }
    }
  }

  return false;
};

/**
 * Verifica se a amostra total foi atingida
 */
const isSampleFull = (form, responses) => {
  if (!form.sampleSize || form.sampleSize <= 0) return false;
  return responses.length >= form.sampleSize;
};

/**
 * Atualiza o status de cotas
 */
const updateQuotaStatus = (form, responses) => {
  const quotaStatus = {};

  if (form.quotas && form.quotas.length > 0) {
    for (const quota of form.quotas) {
      for (const group of quota.groups || []) {
        const currentCount = responses.filter(r => r.quotaGroup === group.name).length;
        quotaStatus[group.name] = {
          target: group.target,
          current: currentCount,
          isFull: currentCount >= group.target
        };
      }
    }
  }

  // Status geral
  quotaStatus['Geral'] = {
    target: form.sampleSize,
    current: responses.length,
    isFull: responses.length >= form.sampleSize
  };

  return quotaStatus;
};

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * GET /api/forms/:projectId
 * Carrega um formulário publicado
 */
app.get('/api/forms/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const form = loadForm(projectId);

    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado' });
    }

    // Carregar respostas para enviar status de cotas
    const responseData = loadResponses(projectId);
    const quotaStatus = updateQuotaStatus(form, responseData.responses);

    res.json({
      ...form,
      quotaStatus,
      totalResponses: responseData.responses.length
    });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).json({ error: 'Erro ao carregar formulário' });
  }
});

/**
 * POST /api/forms
 * Publica um novo formulário (chamado do admin)
 */
app.post('/api/forms', (req, res) => {
  try {
    const formData = req.body;

    if (!formData.id) {
      return res.status(400).json({ error: 'ID do projeto é obrigatório' });
    }

    // Salvar formulário
    saveForm(formData.id, {
      ...formData,
      publishedAt: new Date().toISOString(),
      status: 'Ativo'
    });

    res.json({
      success: true,
      projectId: formData.id,
      publicLink: `${process.env.API_URL || 'http://localhost:3001'}/survey/${formData.id}`
    });
  } catch (error) {
    console.error('Erro ao publicar formulário:', error);
    res.status(500).json({ error: 'Erro ao publicar formulário' });
  }
});

/**
 * GET /api/responses/:projectId
 * Retorna todas as respostas de um formulário (para admin)
 */
app.get('/api/responses/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const form = loadForm(projectId);

    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado' });
    }

    const responseData = loadResponses(projectId);
    const quotaStatus = updateQuotaStatus(form, responseData.responses);

    res.json({
      projectId,
      totalResponses: responseData.responses.length,
      responses: responseData.responses,
      quotaStatus
    });
  } catch (error) {
    console.error('Erro ao carregar respostas:', error);
    res.status(500).json({ error: 'Erro ao carregar respostas' });
  }
});

/**
 * POST /api/responses/:projectId
 * Submete uma nova resposta
 */
app.post('/api/responses/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const { answers, quotaGroup, timeSpentSeconds } = req.body;

    // Validar dados
    if (!answers) {
      return res.status(400).json({ error: 'Respostas são obrigatórias' });
    }

    // Carregar formulário
    const form = loadForm(projectId);
    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado' });
    }

    // Carregar respostas existentes
    const responseData = loadResponses(projectId);

    // ✅ VALIDAÇÃO 1: Verificar se amostra total foi atingida
    if (isSampleFull(form, responseData.responses)) {
      return res.status(409).json({
        error: 'Amostra total atingida',
        message: 'Obrigado! A pesquisa já coletou todas as respostas necessárias.'
      });
    }

    // ✅ VALIDAÇÃO 2: Calcular grupo de cota
    const calculatedQuotaGroup = calculateQuotaGroup(form, answers);

    // ✅ VALIDAÇÃO 3: Verificar se cota foi atingida
    if (isQuotaFull(form, responseData.responses, calculatedQuotaGroup)) {
      return res.status(409).json({
        error: 'Cota atingida',
        message: `Obrigado! A cota para o perfil "${calculatedQuotaGroup}" já foi preenchida.`,
        quotaGroup: calculatedQuotaGroup
      });
    }

    // ✅ Tudo OK: Salvar resposta
    const newResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      answers,
      quotaGroup: calculatedQuotaGroup,
      timeSpentSeconds: timeSpentSeconds || 0,
      submittedAt: new Date().toISOString()
    };

    responseData.responses.push(newResponse);
    responseData.quotaStatus = updateQuotaStatus(form, responseData.responses);

    saveResponses(projectId, responseData);

    res.json({
      success: true,
      responseId: newResponse.id,
      quotaStatus: responseData.quotaStatus
    });
  } catch (error) {
    console.error('Erro ao submeter resposta:', error);
    res.status(500).json({ error: 'Erro ao submeter resposta' });
  }
});

/**
 * GET /api/forms/:projectId/status
 * Retorna status de cotas e amostra
 */
app.get('/api/forms/:projectId/status', (req, res) => {
  try {
    const { projectId } = req.params;
    const form = loadForm(projectId);

    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado' });
    }

    const responseData = loadResponses(projectId);
    const quotaStatus = updateQuotaStatus(form, responseData.responses);

    res.json({
      projectId,
      sampleSize: form.sampleSize,
      totalResponses: responseData.responses.length,
      isSampleFull: isSampleFull(form, responseData.responses),
      quotaStatus
    });
  } catch (error) {
    console.error('Erro ao obter status:', error);
    res.status(500).json({ error: 'Erro ao obter status' });
  }
});

/**
 * DELETE /api/forms/:projectId/responses
 * Limpa todas as respostas de um formulário (para admin)
 */
app.delete('/api/forms/:projectId/responses', (req, res) => {
  try {
    const { projectId } = req.params;
    const form = loadForm(projectId);

    if (!form) {
      return res.status(404).json({ error: 'Formulário não encontrado' });
    }

    saveResponses(projectId, { responses: [], quotaStatus: {} });

    res.json({
      success: true,
      message: 'Respostas deletadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar respostas:', error);
    res.status(500).json({ error: 'Erro ao deletar respostas' });
  }
});

/**
 * GET /survey/:projectId
 * Página pública do formulário (para redirecionamento)
 */
app.get('/survey/:projectId', (req, res) => {
  const { projectId } = req.params;
  res.redirect(`http://localhost:5173/survey/${projectId}`);
});

/**
 * GET /health
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ============================================================================
// INICIALIZAR SERVIDOR
// ============================================================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║   Clarifyse SurveyForge API - Servidor Iniciado            ║
╠════════════════════════════════════════════════════════════╣
║   Porta: ${PORT}                                              ║
║   Ambiente: ${process.env.NODE_ENV || 'development'}                                   ║
║   Diretório de Formulários: ${FORMS_DIR}      ║
║   Diretório de Respostas: ${RESPONSES_DIR}        ║
║                                                            ║
║   Endpoints disponíveis:                                   ║
║   - GET  /api/forms/:projectId                             ║
║   - POST /api/forms                                        ║
║   - GET  /api/responses/:projectId                         ║
║   - POST /api/responses/:projectId                         ║
║   - GET  /api/forms/:projectId/status                      ║
║   - DELETE /api/forms/:projectId/responses                 ║
║   - GET  /health                                           ║
╚════════════════════════════════════════════════════════════╝
  `);
});

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import {
  validateFormData,
  validateResponseData,
  sanitizeString,
  isValidEmail
} from './schemas.js';
import {
  securityHeaders,
  createAPILimiter,
  createSubmitLimiter
} from './security.js';
import {
  calculateQuotaGroup,
  isSampleFull,
  isQuotaFull,
  validateQuotasForResponse,
  getQuotasStats
} from './sharedQuotaLogic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE DE SEGURANÇA
// ============================================================================

// CORS: Configurar com whitelist adequado (não use *)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sem origin (como mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não autorizada pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser com limites adequados
app.use(bodyParser.json({ limit: '5mb' })); // Reduzido de 50mb
app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }));

// ============================================================================
// MIDDLEWARE DE VALIDAÇÃO E LOGGING
// ============================================================================

// Logging básico de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

// Middleware de erro genérico para validação de JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  next();
});

// ============================================================================
// APLICAR MIDDLEWARE DE SEGURANÇA
// ============================================================================

// Headers de segurança em todas as respostas
app.use(securityHeaders);

// Rate limiting em endpoints de API
app.use('/api/', createAPILimiter());

// Rate limiting mais restritivo em submissão de respostas
app.use('/api/responses/', createSubmitLimiter());

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
 * ⚠️ REMOVIDO: Funções duplicadas agora importadas de sharedQuotaLogic.js
 * Ver: server/src/sharedQuotaLogic.js
 *
 * Antigas implementações removidas para evitar inconsistências:
 * - calculateQuotaGroup()
 * - isQuotaFull()
 * - isSampleFull()
 * - updateQuotaStatus()
 */

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
 *
 * ✅ VALIDAÇÃO: Dados do formulário são validados antes de salvar
 */
app.post('/api/forms', (req, res) => {
  try {
    const formData = req.body;

    // ✅ VALIDAÇÃO 1: Validar estrutura de dados
    const validation = validateFormData(formData);
    if (!validation.valid) {
      console.warn(`Formulário inválido: ${validation.errors.join(', ')}`);
      return res.status(400).json({
        error: 'Dados do formulário inválidos',
        details: validation.errors
      });
    }

    // ✅ VALIDAÇÃO 2: Verificar path traversal (evitar ../../)
    if (formData.id.includes('/') || formData.id.includes('\\')) {
      return res.status(400).json({ error: 'ID do projeto contém caracteres inválidos' });
    }

    // Salvar formulário
    const publishedForm = {
      ...formData,
      publishedAt: new Date().toISOString(),
      status: 'Ativo'
    };

    saveForm(formData.id, publishedForm);

    res.json({
      success: true,
      projectId: formData.id,
      publicLink: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/survey/${formData.id}`
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
 *
 * ✅ VALIDAÇÃO: Dados de resposta são validados antes de salvar
 */
app.post('/api/responses/:projectId', (req, res) => {
  try {
    const { projectId } = req.params;
    const { answers, quotaGroup, timeSpentSeconds } = req.body;

    // ✅ VALIDAÇÃO 1: Validar estrutura básica
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'Respostas são obrigatórias e devem ser objeto' });
    }

    // ✅ VALIDAÇÃO 2: Usar função de validação
    const validation = validateResponseData({ projectId, answers });
    if (!validation.valid) {
      console.warn(`Resposta inválida: ${validation.errors.join(', ')}`);
      return res.status(400).json({
        error: 'Dados de resposta inválidos',
        details: validation.errors
      });
    }

    // ✅ VALIDAÇÃO 3: Verificar timeSpentSeconds é número válido
    if (timeSpentSeconds && (!Number.isInteger(timeSpentSeconds) || timeSpentSeconds < 0 || timeSpentSeconds > 86400)) {
      return res.status(400).json({ error: 'Tempo gasto inválido' });
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

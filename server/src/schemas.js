/**
 * SCHEMAS DE VALIDAÇÃO PARA ENDPOINTS
 * 
 * Valida entrada em todos os endpoints antes de processar
 * Previne injeção de dados malformados e ataques
 */

// ============================================================================
// OPÇÃO 1: Usar Zod (recomendado)
// ============================================================================
// Se Zod for instalado, descomente:
//
// import { z } from 'zod';
// 
// export const FormSchema = z.object({
//   id: z.string().min(1),
//   name: z.string().min(1).max(255),
//   formQuestions: z.array(z.object({
//     id: z.string(),
//     question: z.string(),
//     type: z.enum(['single', 'multiple', 'nps', 'likert', 'text'])
//   })),
//   sampleSize: z.number().int().positive()
// });

// ============================================================================
// OPÇÃO 2: Validação Manual (fallback sem dependências)
// ============================================================================

/**
 * Valida se um objeto é um formulário válido
 */
function validateFormData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Dados deve ser um objeto'] };
  }

  // Validar ID
  if (!data.id || typeof data.id !== 'string' || data.id.length === 0) {
    errors.push('ID é obrigatório e deve ser string');
  }

  // Validar nome
  if (!data.name || typeof data.name !== 'string' || data.name.length === 0) {
    errors.push('Nome é obrigatório');
  }

  if (data.name && data.name.length > 500) {
    errors.push('Nome é muito longo (máx 500 caracteres)');
  }

  // Validar sampleSize
  if (data.sampleSize) {
    if (!Number.isInteger(data.sampleSize) || data.sampleSize < 1) {
      errors.push('Tamanho da amostra deve ser número inteiro positivo');
    }
    if (data.sampleSize > 1000000) {
      errors.push('Tamanho da amostra é muito grande (máx 1.000.000)');
    }
  }

  // Validar formQuestions
  if (data.formQuestions && !Array.isArray(data.formQuestions)) {
    errors.push('formQuestions deve ser um array');
  }

  if (data.formQuestions && Array.isArray(data.formQuestions)) {
    const validTypes = ['single', 'multiple', 'nps', 'likert', 'text', 'number', 'matrix', 'ranking'];

    for (let i = 0; i < data.formQuestions.length; i++) {
      const q = data.formQuestions[i];

      if (!q.id || typeof q.id !== 'string') {
        errors.push(`Pergunta ${i}: ID é obrigatório`);
      }

      if (!q.question || typeof q.question !== 'string') {
        errors.push(`Pergunta ${i}: Texto é obrigatório`);
      }

      if (q.question && q.question.length > 1000) {
        errors.push(`Pergunta ${i}: Texto é muito longo`);
      }

      if (!q.type || !validTypes.includes(q.type)) {
        errors.push(`Pergunta ${i}: Tipo inválido`);
      }

      if (q.required && typeof q.required !== 'boolean') {
        errors.push(`Pergunta ${i}: required deve ser boolean`);
      }
    }
  }

  // Validar quotas
  if (data.quotas && !Array.isArray(data.quotas)) {
    errors.push('quotas deve ser um array');
  }

  // Sanitizar propriedades perigosas
  const allowedFields = [
    'id', 'name', 'objective', 'sampleSize', 'formQuestions', 
    'quotas', 'responses', 'status', 'pilar', 'ownerId'
  ];

  for (const key in data) {
    if (!allowedFields.includes(key) && typeof data[key] === 'string') {
      // Remove HTML/scripts
      if (/<[^>]*>/g.test(data[key])) {
        errors.push(`Campo "${key}" contém HTML/scripts`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Valida se uma resposta é válida
 */
function validateResponseData(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Dados deve ser um objeto'] };
  }

  // Validar ID do projeto
  if (!data.projectId || typeof data.projectId !== 'string') {
    errors.push('projectId é obrigatório');
  }

  // Validar respostas
  if (!data.answers || typeof data.answers !== 'object') {
    errors.push('answers é obrigatório e deve ser objeto');
  }

  // Validar tamanho das respostas
  const answerString = JSON.stringify(data.answers);
  if (answerString.length > 50000) {
    errors.push('Respostas são muito grandes (máx 50KB)');
  }

  // Sanitizar campos de texto
  for (const key in data.answers) {
    const value = data.answers[key];
    if (typeof value === 'string' && value.length > 5000) {
      errors.push(`Resposta "${key}" é muito longa (máx 5000 caracteres)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Middleware de validação para Express
 */
function createValidator(validationFn) {
  return (req, res, next) => {
    const validation = validationFn(req.body);

    if (!validation.valid) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: validation.errors
      });
    }

    next();
  };
}

/**
 * Sanitiza string removendo HTML/scripts
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  // Remove tags HTML
  let sanitized = str.replace(/<[^>]*>/g, '');
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  return sanitized;
}

/**
 * Valida se um email é válido
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Valida se uma senha é forte
 * Requisitos: min 8 chars, 1 maiúscula, 1 minúscula, 1 número, 1 especial
 */
function isStrongPassword(password) {
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
}

/**
 * Valida credenciais de login
 */
function validateLoginData(data) {
  const errors = [];

  if (!data.email || !isValidEmail(data.email)) {
    errors.push('Email inválido');
  }

  if (!data.password || data.password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }

  return { valid: errors.length === 0, errors };
}

export {
  validateFormData,
  validateResponseData,
  validateLoginData,
  createValidator,
  sanitizeString,
  isValidEmail,
  isStrongPassword
};

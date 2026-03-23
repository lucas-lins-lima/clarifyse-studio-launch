import { toast } from 'sonner';

/**
 * ✅ FIX: Centralized error handling with user-friendly messages
 */

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

// Map of error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
  'NETWORK_ERROR': 'Problema de conexão. Verifique sua internet.',
  'VALIDATION_ERROR': 'Os dados fornecidos são inválidos.',
  'NOT_FOUND': 'Recurso não encontrado.',
  'UNAUTHORIZED': 'Você não tem permissão para fazer isso.',
  'FORBIDDEN': 'Acesso negado.',
  'CONFLICT': 'Ação conflita com estado atual.',
  'QUOTA_EXCEEDED': 'Cota atingida.',
  'SERVER_ERROR': 'Erro no servidor. Tente novamente mais tarde.',
  'TIMEOUT': 'Requisição expirou. Tente novamente.',
  'UNKNOWN': 'Erro desconhecido. Contate o suporte.',
};

/**
 * Parse error and create user-friendly message
 */
export function parseError(error: any): AppError {
  const timestamp = new Date();

  // ✅ Handle Supabase errors
  if (error?.message && typeof error.message === 'string') {
    let code = 'UNKNOWN';

    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      code = 'UNAUTHORIZED';
    } else if (error.message.includes('403') || error.message.includes('forbidden')) {
      code = 'FORBIDDEN';
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      code = 'NOT_FOUND';
    } else if (error.message.includes('409') || error.message.includes('conflict')) {
      code = 'CONFLICT';
    } else if (error.message.includes('validation')) {
      code = 'VALIDATION_ERROR';
    }

    return {
      code,
      message: ERROR_MESSAGES[code] || error.message,
      details: error,
      timestamp,
    };
  }

  // ✅ Handle fetch errors
  if (error instanceof TypeError) {
    if (error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: ERROR_MESSAGES['NETWORK_ERROR'],
        details: error,
        timestamp,
      };
    }
  }

  // ✅ Handle timeout errors
  if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
    return {
      code: 'TIMEOUT',
      message: ERROR_MESSAGES['TIMEOUT'],
      details: error,
      timestamp,
    };
  }

  // ✅ Default
  return {
    code: 'UNKNOWN',
    message: ERROR_MESSAGES['UNKNOWN'],
    details: error,
    timestamp,
  };
}

/**
 * Display error to user
 */
export function showErrorToast(error: any, customMessage?: string) {
  const appError = parseError(error);

  console.error('[ErrorHandler]', appError);

  toast.error(customMessage || appError.message, {
    duration: 5000,
    description: appError.code !== 'UNKNOWN' ? appError.code : undefined,
  });
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    duration: 3000,
    description,
  });
}

/**
 * Show loading toast
 */
export function showLoadingToast(message: string) {
  return toast.loading(message);
}
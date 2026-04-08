/**
 * MIDDLEWARE DE SEGURANÇA
 * - Rate Limiting (sem dependências externas)
 * - CSRF Token Validation
 * - Request throttling por IP
 */

// ============================================================================
// RATE LIMITER (In-Memory)
// ============================================================================

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutos
    this.maxRequests = options.maxRequests || 100; // máximo de requests por janela
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;

    this.requests = new Map();
    this.cleanup();
  }

  /**
   * Limpa entradas expiradas a cada 60 segundos
   */
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.requests.entries()) {
        if (now - data.resetTime > this.windowMs) {
          this.requests.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Retorna middleware Express
   */
  middleware() {
    return (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();

      // Inicializar ou resetar contagem
      if (!this.requests.has(key)) {
        this.requests.set(key, { count: 0, resetTime: now });
      }

      const data = this.requests.get(key);

      // Se janela expirou, resetar
      if (now - data.resetTime > this.windowMs) {
        data.count = 0;
        data.resetTime = now;
      }

      // Incrementar contador
      data.count++;

      // Headers informativos
      res.set('X-RateLimit-Limit', this.maxRequests.toString());
      res.set('X-RateLimit-Remaining', Math.max(0, this.maxRequests - data.count).toString());
      res.set('X-RateLimit-Reset', (data.resetTime + this.windowMs).toString());

      // Verificar se limite foi excedido
      if (data.count > this.maxRequests) {
        const retryAfter = Math.ceil((data.resetTime + this.windowMs - now) / 1000);
        res.set('Retry-After', retryAfter.toString());

        return res.status(429).json({
          error: 'Muitas requisições',
          message: `Aguarde ${retryAfter} segundos antes de tentar novamente.`,
          retryAfter
        });
      }

      next();
    };
  }
}

// ============================================================================
// CSRF TOKEN GENERATOR
// ============================================================================

class CSRFTokenManager {
  constructor() {
    this.tokens = new Map();
    this.tokenExpiry = 1 * 60 * 60 * 1000; // 1 hora
    this.cleanup();
  }

  /**
   * Gera token CSRF aleatório
   */
  generateToken() {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    let token = '';
    for (let i = 0; i < randomBytes.length; i++) {
      token += randomBytes[i].toString(16).padStart(2, '0');
    }
    return token;
  }

  /**
   * Cria nova sessão com token CSRF
   */
  createSession(sessionId) {
    const token = this.generateToken();
    this.tokens.set(sessionId, {
      token,
      createdAt: Date.now()
    });
    return token;
  }

  /**
   * Verifica se token é válido para sessão
   */
  verifyToken(sessionId, token) {
    const session = this.tokens.get(sessionId);
    if (!session) return false;

    const isExpired = Date.now() - session.createdAt > this.tokenExpiry;
    if (isExpired) {
      this.tokens.delete(sessionId);
      return false;
    }

    return session.token === token;
  }

  /**
   * Remove sessão (invalida token)
   */
  invalidateSession(sessionId) {
    this.tokens.delete(sessionId);
  }

  /**
   * Limpa tokens expirados a cada 10 minutos
   */
  cleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.tokens.entries()) {
        if (now - session.createdAt > this.tokenExpiry) {
          this.tokens.delete(sessionId);
        }
      }
    }, 10 * 60 * 1000);
  }
}

// ============================================================================
// MIDDLEWARE DE SEGURANÇA DE HEADERS
// ============================================================================

/**
 * Configura headers de segurança
 */
function securityHeaders(req, res, next) {
  // Evitar clickjacking
  res.set('X-Frame-Options', 'DENY');

  // Evitar MIME type sniffing
  res.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (navegadores antigos)
  res.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Content Security Policy (basicamente)
  res.set('Content-Security-Policy', "default-src 'self'; script-src 'self'");

  // Sem cache para dados sensíveis
  if (req.path.includes('/api/') && req.method !== 'GET') {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
  }

  next();
}

// ============================================================================
// MIDDLEWARE DE VALIDAÇÃO DE IP
// ============================================================================

/**
 * Bloqueia requisições de IPs suspeitos
 */
function validateIPMiddleware(blacklistedIPs = []) {
  return (req, res, next) => {
    const clientIP = req.ip;

    if (blacklistedIPs.includes(clientIP)) {
      return res.status(403).json({ error: 'Seu IP foi bloqueado' });
    }

    next();
  };
}

// ============================================================================
// MIDDLEWARE DE RATE LIMITING POR ENDPOINT
// ============================================================================

/**
 * Rate limiter específico para login (muito mais restritivo)
 * Max 5 tentativas por 15 minutos por IP
 */
function createLoginLimiter() {
  return new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    keyGenerator: (req) => `${req.ip}:login`
  }).middleware();
}

/**
 * Rate limiter para API geral
 * Max 100 requisições por 15 minutos por IP
 */
function createAPILimiter() {
  return new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
    keyGenerator: (req) => `${req.ip}:api`
  }).middleware();
}

/**
 * Rate limiter para submissão de respostas
 * Max 10 respostas por hora por IP
 */
function createSubmitLimiter() {
  return new RateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hora
    maxRequests: 10,
    keyGenerator: (req) => `${req.ip}:submit`
  }).middleware();
}

export {
  RateLimiter,
  CSRFTokenManager,
  securityHeaders,
  validateIPMiddleware,
  createLoginLimiter,
  createAPILimiter,
  createSubmitLimiter
};

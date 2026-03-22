/**
 * Utilitários criptográficos para Clarifyse Studio
 */

import crypto from 'crypto';

/**
 * Gera um hash SHA-256 simples (para desenvolvimento)
 * Em produção, use bcrypt ou argon2
 */
export function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + process.env.PASSWORD_SALT || 'clarifyse-salt')
    .digest('hex');
}

/**
 * Verifica se uma senha corresponde ao hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const hashedPassword = hashPassword(password);
  return hashedPassword === hash;
}

/**
 * Gera um ID único usando UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Gera um slug único para links públicos
 */
export function generateSlug(prefix: string = 'survey'): string {
  const random = crypto.randomBytes(6).toString('hex');
  return `${prefix}-${random}`;
}

/**
 * Gera um hash de IP para detecção de duplicatas
 */
export function hashIp(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip)
    .digest('hex');
}

/**
 * Gera um token de sessão
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Valida um email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitiza entrada de usuário
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000); // Limita tamanho
}

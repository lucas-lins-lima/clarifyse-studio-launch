/**
 * MÓDULO DE AUTENTICAÇÃO SEGURA
 * 
 * Fornece funções de hash de senha seguro usando PBKDF2 com crypto.subtle
 * Substitui o hash fraco anterior (robustHash) por um adequado para produção
 * 
 * Características:
 * - PBKDF2 com SHA-256
 * - Salt aleatório (32 bytes)
 * - 100.000 iterações (OWASP recomendado)
 * - Codificação Base64 para armazenamento
 */

/**
 * Gera um salt aleatório de 32 bytes
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Importa uma chave PBKDF2 a partir de uma senha
 */
async function importKey(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
}

/**
 * Deriva uma chave usando PBKDF2
 * @param password Senha em texto plano
 * @param salt Salt (Uint8Array)
 * @param iterations Número de iterações (padrão: 100.000)
 * @returns Chave derivada como Uint8Array
 */
async function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = 100000
): Promise<Uint8Array> {
  const key = await importKey(password);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: iterations,
      hash: 'SHA-256'
    },
    key,
    256 // 32 bytes
  );
  return new Uint8Array(derivedBits);
}

/**
 * Converte Uint8Array para Base64
 */
function toBase64(buffer: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

/**
 * Converte Base64 para Uint8Array
 */
function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Faz hash seguro de uma senha
 * Retorna: "PBKDF2$iterations$salt$hash" (formato estruturado para validação)
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Senha não pode estar vazia');
  }

  const salt = generateSalt();
  const iterations = 100000;
  const hash = await deriveKey(password, salt, iterations);

  // Formato: "PBKDF2$iterations$salt$hash"
  const saltBase64 = toBase64(salt);
  const hashBase64 = toBase64(hash);

  return `PBKDF2$${iterations}$${saltBase64}$${hashBase64}`;
}

/**
 * Verifica se uma senha corresponde ao hash
 */
export async function verifyPassword(password: string, hashString: string): Promise<boolean> {
  try {
    if (!hashString.startsWith('PBKDF2$')) {
      // Fallback para hash antigo (robustHash) durante migração
      return verifyLegacyPassword(password, hashString);
    }

    const [, iterationsStr, saltBase64, hashBase64] = hashString.split('$');
    const iterations = parseInt(iterationsStr, 10);

    if (isNaN(iterations)) {
      console.error('Hash inválido: iterações não são número');
      return false;
    }

    const salt = fromBase64(saltBase64);
    const expectedHash = fromBase64(hashBase64);
    const computedHash = await deriveKey(password, salt, iterations);

    // Comparação constante de tempo para evitar timing attack
    return constantTimeEqual(computedHash, expectedHash);
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
}

/**
 * Comparação de tempo constante (previne timing attacks)
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }

  return result === 0;
}

/**
 * FUNÇÃO LEGADA: Verifica senhas feitas com robustHash anterior
 * Usada apenas durante período de migração
 */
function verifyLegacyPassword(password: string, legacyHash: string): boolean {
  // Implementação do hash anterior para compatibilidade
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < password.length; i++) {
    const ch = password.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const computedHash = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  return computedHash === legacyHash;
}

/**
 * Detecta se um hash é legado (robustHash antigo)
 */
export function isLegacyHash(hashString: string): boolean {
  return !hashString.startsWith('PBKDF2$');
}

/**
 * Gera uma senha temporária forte para bootstrap
 * Usada quando criar novo usuário sem senha
 */
export function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';

  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  return password;
}

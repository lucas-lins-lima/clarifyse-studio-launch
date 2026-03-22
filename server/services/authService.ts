/**
 * Serviço de Autenticação para Clarifyse Studio
 * Gerencia login, logout e sessões usando JSON
 */

import { User, AuthSession } from '../../shared/types';
import * as storage from '../storage/jsonStorage';
import { hashPassword, verifyPassword, generateId, generateSessionToken, isValidEmail } from '../utils/crypto';

// Armazenar sessões em memória (em produção, usar Redis ou banco de dados)
const sessions = new Map<string, AuthSession>();

/**
 * Registra um novo usuário
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'pesquisador' = 'pesquisador'
): Promise<User> {
  // Validar email
  if (!isValidEmail(email)) {
    throw new Error('Email inválido');
  }

  // Verificar se usuário já existe
  const existingUser = await storage.getUserByEmail(email);
  if (existingUser) {
    throw new Error('Usuário já existe');
  }

  // Validar senha
  if (password.length < 6) {
    throw new Error('Senha deve ter no mínimo 6 caracteres');
  }

  // Criar novo usuário
  const user: User = {
    id: generateId(),
    email,
    name,
    password: hashPassword(password),
    role,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    status: 'ativo',
  };

  return storage.createUser(user);
}

/**
 * Faz login de um usuário
 */
export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  const user = await storage.getUserByEmail(email);

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  if (user.status !== 'ativo') {
    throw new Error('Usuário inativo');
  }

  if (!verifyPassword(password, user.password)) {
    throw new Error('Senha incorreta');
  }

  // Atualizar último login
  await storage.updateUser(user.id, {
    lastLogin: new Date().toISOString(),
  });

  // Gerar token de sessão
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

  const session: AuthSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    expiresAt: expiresAt.toISOString(),
  };

  sessions.set(token, session);

  return { user, token };
}

/**
 * Valida um token de sessão
 */
export function validateSession(token: string): AuthSession | null {
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  // Verificar se expirou
  if (new Date(session.expiresAt) < new Date()) {
    sessions.delete(token);
    return null;
  }

  return session;
}

/**
 * Faz logout de um usuário
 */
export function logoutUser(token: string): void {
  sessions.delete(token);
}

/**
 * Obtém usuário da sessão
 */
export async function getUserFromSession(token: string): Promise<User | null> {
  const session = validateSession(token);

  if (!session) {
    return null;
  }

  const user = await storage.getUserById(session.userId);
  return user || null;
}

/**
 * Atualiza perfil do usuário
 */
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; email?: string }
): Promise<User | null> {
  const user = await storage.getUserById(userId);

  if (!user) {
    return null;
  }

  // Se email está sendo alterado, verificar se já existe
  if (updates.email && updates.email !== user.email) {
    const existingUser = await storage.getUserByEmail(updates.email);
    if (existingUser) {
      throw new Error('Email já está em uso');
    }
  }

  const updated = await storage.updateUser(userId, updates);
  return updated || null;
}

/**
 * Altera senha do usuário
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<boolean> {
  const user = await storage.getUserById(userId);

  if (!user) {
    return false;
  }

  if (!verifyPassword(currentPassword, user.password)) {
    throw new Error('Senha atual incorreta');
  }

  if (newPassword.length < 6) {
    throw new Error('Nova senha deve ter no mínimo 6 caracteres');
  }

  await storage.updateUser(userId, {
    password: hashPassword(newPassword),
  });

  return true;
}

/**
 * Limpa sessões expiradas (executar periodicamente)
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();
  const tokensToDelete: string[] = [];

  sessions.forEach((session, token) => {
    if (new Date(session.expiresAt) < now) {
      tokensToDelete.push(token);
    }
  });

  tokensToDelete.forEach(token => sessions.delete(token));
}

/**
 * Inicializa usuário admin padrão se não existir
 */
export async function initializeDefaultAdmin(): Promise<void> {
  const users = await storage.getAllUsers();

  if (users.length === 0) {
    await registerUser(
      'admin@clarifyse.com',
      'admin123456',
      'Administrador',
      'admin'
    );
    console.log('✓ Usuário admin padrão criado: admin@clarifyse.com / admin123456');
  }
}

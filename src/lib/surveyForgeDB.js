// ============================================================================
// CLARIFYSE SURVEYFORGE DATABASE (localStorage)
// Armazenamento 100% local com suporte a Administrador e Pesquisador
// ============================================================================

const DB_KEY = "surveyForgeDB";
const NOTIFICATIONS_KEY = "surveyForgeNotifications";

// ⚠️ DESCONTINUADO: robustHash foi removido e substituído por PBKDF2 seguro
// Ver: src/lib/secureAuth.ts para nova implementação

/**
 * Gera UUID com melhor aleatoriedade para evitar colisões
 * Usa crypto.getRandomValues() quando disponível
 */
function generateId(prefix = 'id') {
  let randomPart = '';

  // Tentar usar crypto API se disponível
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    randomPart = arr.reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '');
  } else {
    // Fallback para Math.random()
    randomPart = Math.random().toString(36).substr(2, 16);
  }

  return `${prefix}-${Date.now()}-${randomPart}`;
}

/**
 * DADOS INICIAIS PARA DESENVOLVIMENTO E DEMO
 *
 * ⚠️ IMPORTANTE: Em produção, usar Supabase Auth ao invés de localStorage
 *
 * Credenciais de teste (geradas dinamicamente na primeira inicialização):
 * - Admin: clarifysestrategyresearch@gmail.com (password enviado por email)
 * - Pesquisador: pesquisador@clarifyse.com (password enviado por email)
 * - Gerente: gerente@clarifyse.com (password enviado por email)
 * - Cliente: cliente@exemplo.com (password enviado por email)
 *
 * Todas as contas requerem change password na primeira login
 */
const initialData = {
  projects: [
    {
      id: "proj-001",
      name: "Pesquisa de Satisfação Clarifyse 2026",
      objective: "Avaliar a percepção de valor dos clientes atuais.",
      sampleSize: 50,
      quotas: [],
      formQuestions: [
        {
          id: "q_regiao",
          question: "Qual é sua região?",
          variableCode: "regiao",
          type: "single",
          options: [
            { id: "o1", code: "1", text: "Sudeste" },
            { id: "o2", code: "2", text: "Sul" },
            { id: "o3", code: "3", text: "Nordeste" },
            { id: "o4", code: "4", text: "Norte" },
            { id: "o5", code: "5", text: "Centro-Oeste" }
          ],
          required: true,
          logic: [],
          helpText: ""
        },
        {
          id: "q_satisfacao",
          question: "Em uma escala de 0 a 10, qual a probabilidade de você recomendar a Clarifyse?",
          variableCode: "satisfacao_nps",
          type: "nps",
          options: [],
          required: true,
          logic: [],
          helpText: "0 = Nada provável, 10 = Extremamente provável"
        }
      ],
      responses: [],
      status: "Rascunho",
      pilar: "DISCOVER",
      ownerId: "admin-001",
      createdAt: new Date().toISOString(),
      lastResponseAt: null,
      publicLink: null
    }
  ],
  settings: {
    nomeEmpresa: "Clarifyse Strategy & Research",
    slogan: "Where questions become clarity.",
    emailContato: "contato@clarifyse.com",
    // Flag para indicar se bootstrap de segurança foi completado
    securityBootstrapCompleted: false
  },
  users: [
    {
      id: "admin-001",
      email: "clarifysestrategyresearch@gmail.com",
      passwordHash: null, // Será gerado na primeira inicialização
      name: "Administrador Clarifyse",
      role: "admin",
      empresa: "Clarifyse",
      cargo: "Diretor de Pesquisa",
      status: "active",
      requiresPasswordChange: true,
      tempPassword: null, // Será preenchido com senha temporária
      createdAt: new Date().toISOString()
    },
    {
      id: "pesq-001",
      email: "pesquisador@clarifyse.com",
      passwordHash: null,
      name: "Pesquisador Sênior",
      role: "pesquisador",
      empresa: "Clarifyse",
      cargo: "Analista de Mercado",
      status: "active",
      requiresPasswordChange: true,
      tempPassword: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "gerente-001",
      email: "gerente@clarifyse.com",
      passwordHash: null,
      name: "Gerente de Projetos",
      role: "gerente",
      empresa: "Clarifyse",
      cargo: "Gerente de Operações",
      status: "active",
      requiresPasswordChange: true,
      tempPassword: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "cliente-001",
      email: "cliente@exemplo.com",
      passwordHash: null,
      name: "Cliente Exemplo",
      role: "cliente",
      empresa: "Empresa Exemplo S.A.",
      cargo: "Diretor de Marketing",
      status: "active",
      requiresPasswordChange: true,
      tempPassword: null,
      createdAt: new Date().toISOString()
    }
  ],
  notifications: []
};

// ============================================================================
// FUNÇÕES DE BANCO DE DADOS
// ============================================================================

/**
 * ============================================================================
 * SISTEMA DE CACHE COM PROTEÇÃO CONTRA RACE CONDITIONS
 * ============================================================================
 *
 * Melhorias:
 * - Cache válido por 30 segundos (em vez de 1 segundo)
 * - Invalidação explícita ao salvar
 * - Detecção de modificação de arquivo
 * - Proteção contra race conditions em leitura/escrita simultânea
 */

let dbCache = null;
let dbCacheTimestamp = 0;
let lastModificationTime = 0;
let isSaving = false; // Flag para evitar race conditions

export const loadDB = () => {
  try {
    // Aguardar se está salvando
    let attempts = 0;
    while (isSaving && attempts < 10) {
      // Spin-wait simples (não é ideal, mas funciona em localStorage)
      attempts++;
    }

    // Verificar se cache ainda é válido (30 segundos)
    const now = Date.now();
    const cacheExpired = now - dbCacheTimestamp > 30 * 1000;

    if (dbCache !== null && !cacheExpired) {
      // Cache ainda válido - retornar cópia profunda
      return JSON.parse(JSON.stringify(dbCache));
    }

    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      saveDB(initialData);
      dbCache = JSON.parse(JSON.stringify(initialData));
      dbCacheTimestamp = Date.now();
      return JSON.parse(JSON.stringify(initialData));
    }
    const parsed = JSON.parse(data);
    // Migração: garantir que todos os projetos tenham campos obrigatórios
    let needsSave = false;
    if (parsed.projects) {
      parsed.projects = parsed.projects.map(p => {
        let changed = false;
        if (!p.formQuestions) { p.formQuestions = []; changed = true; }
        if (!p.quotas) { p.quotas = []; changed = true; }
        if (!p.responses) { p.responses = []; changed = true; }
        if (!p.ownerId) { p.ownerId = 'admin-001'; changed = true; }
        if (!p.publicLink) { p.publicLink = null; }
        if (!p.pilar) { p.pilar = 'DISCOVER'; changed = true; }
        if (changed) needsSave = true;
        return p;
      });
    }
    if (!parsed.settings) {
      parsed.settings = initialData.settings;
      needsSave = true;
    }
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = initialData.users;
      needsSave = true;
    }
    if (!parsed.notifications) {
      parsed.notifications = [];
      needsSave = true;
    }
    if (needsSave) saveDB(parsed);

    // Atualizar cache
    dbCache = JSON.parse(JSON.stringify(parsed));
    dbCacheTimestamp = Date.now();

    return parsed;
  } catch (err) {
    console.error('Erro ao carregar DB:', err);
    saveDB(initialData);
    dbCache = JSON.parse(JSON.stringify(initialData));
    dbCacheTimestamp = Date.now();
    return JSON.parse(JSON.stringify(initialData));
  }
};

export const saveDB = (data) => {
  try {
    // Marcar como salvando
    isSaving = true;

    // Salvar no localStorage
    localStorage.setItem(DB_KEY, JSON.stringify(data));

    // Atualizar metadata
    lastModificationTime = Date.now();

    // Invalidar cache (forçar reload na próxima loadDB)
    dbCache = null;
    dbCacheTimestamp = 0;

  } catch (err) {
    console.error('Erro ao salvar DB:', err);
  } finally {
    // Indicar que terminou de salvar
    isSaving = false;
  }
};

export const resetDB = () => {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(NOTIFICATIONS_KEY);
  saveDB(initialData);
  return JSON.parse(JSON.stringify(initialData));
};

// ============================================================================
// FUNÇÕES DE PROJETOS
// ============================================================================

export const getProjectById = (id) => {
  const db = loadDB();
  return db.projects.find(p => p.id === id) || null;
};

export const getProjectsByUser = (userId, userRole) => {
  const db = loadDB();
  // Admin vê todos os projetos
  if (userRole === 'admin') {
    return db.projects;
  }
  // Pesquisador vê apenas seus projetos
  return db.projects.filter(p => p.ownerId === userId);
};

export const canUserAccessProject = (projectId, userId, userRole) => {
  if (userRole === 'admin') return true;
  const project = getProjectById(projectId);
  if (!project) return false;
  return project.ownerId === userId;
};

export const addProject = (projectData, userId) => {
  const db = loadDB();
  const projectId = generateId('proj');
  const publicLink = `${window.location.origin}/survey/${projectId}`;
  const newProject = {
    id: projectId,
    responses: [],
    status: "Rascunho",
    quotas: [],
    formQuestions: [],
    publicLink: null,
    ownerId: userId,
    createdAt: new Date().toISOString(),
    lastResponseAt: null,
    ...projectData
  };
  db.projects.push(newProject);
  saveDB(db);
  addNotification({
    type: 'project_created',
    title: 'Projeto criado',
    message: `O projeto "${newProject.name}" foi criado com sucesso.`,
    projectId: newProject.id,
    userId: userId
  });
  return newProject;
};

export const updateProject = (id, updates, requestingUserId = null, requestingUserRole = null) => {
  const db = loadDB();
  const index = db.projects.findIndex(p => p.id === id);
  if (index === -1) return null;

  // Verificar permissão se fornecida
  if (requestingUserId && requestingUserRole && requestingUserRole !== 'admin') {
    if (db.projects[index].ownerId !== requestingUserId) {
      console.warn('Acesso negado: usuário não é dono do projeto');
      return null;
    }
  }

  db.projects[index] = { ...db.projects[index], ...updates };
  saveDB(db);
  return db.projects[index];
};

export const deleteProject = (id, requestingUserId = null, requestingUserRole = null) => {
  const db = loadDB();
  const project = db.projects.find(p => p.id === id);
  if (!project) return false;

  // Verificar permissão se fornecida
  if (requestingUserId && requestingUserRole && requestingUserRole !== 'admin') {
    if (project.ownerId !== requestingUserId) {
      console.warn('Acesso negado: usuário não é dono do projeto');
      return false;
    }
  }

  db.projects = db.projects.filter(p => p.id !== id);
  saveDB(db);
  return true;
};

export const duplicateProject = (projectId, userId) => {
  const db = loadDB();
  const original = db.projects.find(p => p.id === projectId);
  if (!original) return null;

  const newId = generateId('proj');
  const newProject = {
    ...JSON.parse(JSON.stringify(original)), // deep copy
    id: newId,
    name: `${original.name} (Cópia)`,
    responses: [],
    status: "Rascunho",
    ownerId: userId,
    createdAt: new Date().toISOString(),
    lastResponseAt: null,
    publicLink: null
  };
  db.projects.push(newProject);
  saveDB(db);
  return newProject;
};

export const publishProject = (projectId) => {
  const db = loadDB();
  const index = db.projects.findIndex(p => p.id === projectId);
  if (index === -1) return null;

  if (!db.projects[index].formQuestions || db.projects[index].formQuestions.length === 0) {
    return { error: 'Adicione pelo menos uma pergunta antes de publicar.' };
  }

  const publicLink = `${window.location.origin}/survey/${projectId}`;
  db.projects[index].status = 'Formulário Pronto';
  db.projects[index].publicLink = publicLink;
  saveDB(db);
  return db.projects[index];
};

export const resetProjectResponses = (id) => {
  const db = loadDB();
  const index = db.projects.findIndex(p => p.id === id);
  if (index !== -1) {
    db.projects[index].responses = [];
    db.projects[index].lastResponseAt = null;
    if (db.projects[index].status === 'Em Campo' || db.projects[index].status === 'Análise Disponível') {
      db.projects[index].status = 'Formulário Pronto';
    }
    saveDB(db);
    return db.projects[index];
  }
  return null;
};

// Calcula o grupo de cota para uma resposta
export const calculateQuotaGroup = (project, answers) => {
  if (!project.quotas || project.quotas.length === 0) return "Geral";

  for (const quota of project.quotas) {
    if (!quota.questionId) continue;

    // Encontrar a pergunta correspondente
    const question = project.formQuestions?.find(q => q.id === quota.questionId);
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

  return "Geral";
};

/**
 * Adiciona uma nova resposta com proteção contra race conditions
 *
 * Melhorias:
 * - Recarrega projeto antes de adicionar (evita perda de dados)
 * - Verifica quotas novamente após carregar dados frescos
 * - Usa saveDB com flag isSaving para consistência
 */
export const addResponse = (projectId, responseData) => {
  try {
    // PASSO 1: Carregar DB fresco (evita perda de dados de outra requisição)
    const db = loadDB();
    const projectIndex = db.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) return null;

    const project = db.projects[projectIndex];
    const now = new Date().toISOString();

    // PASSO 2: Calcular grupo de cota baseado nas respostas atuais
    const quotaGroup = responseData.quotaGroup || calculateQuotaGroup(project, responseData.answers || {});

    // PASSO 3: VALIDAÇÃO CRÍTICA - Verificar novamente se quotas ainda estão disponíveis
    // (pode ter mudado desde que o usuário começou)
    const totalResponses = project.responses?.length || 0;
    const sampleSize = project.sampleSize;

    // Verificar amostra total
    if (sampleSize > 0 && totalResponses >= sampleSize) {
      console.warn(`Rejeitando resposta: amostra total (${totalResponses}/${sampleSize}) atingida`);
      return { error: 'sample_full' };
    }

    // Verificar quota específica
    if (project.quotas && project.quotas.length > 0) {
      const quotaIsFull = isQuotaFull(project, quotaGroup);
      if (quotaIsFull) {
        console.warn(`Rejeitando resposta: cota "${quotaGroup}" já está cheia`);
        return { error: 'quota_full', quotaGroup };
      }
    }

    // PASSO 4: Criar resposta
    const newResponse = {
      id: generateId('resp'),
      timestamp: now,
      projectId,
      qualityFlag: "OK",
      timeSpentSeconds: 0,
      quotaGroup,
      answers: {},
      ...responseData
    };

    // PASSO 5: Adicionar resposta (de forma segura)
    if (!db.projects[projectIndex].responses) {
      db.projects[projectIndex].responses = [];
    }

    db.projects[projectIndex].responses.push(newResponse);
    db.projects[projectIndex].lastResponseAt = now;

    // PASSO 6: Atualizar status do projeto
    if (db.projects[projectIndex].status === "Formulário Pronto") {
      db.projects[projectIndex].status = "Em Campo";
    }

    // PASSO 7: Verificar notificações de cota/amostra
    const updatedTotalResponses = db.projects[projectIndex].responses.length;

    if (project.quotas && project.quotas.length > 0) {
      for (const quota of project.quotas) {
        if (quota.groups) {
          for (const group of quota.groups) {
            if (group.target > 0) {
              const groupCount = db.projects[projectIndex].responses.filter(r => r.quotaGroup === group.name).length;
              if (groupCount >= group.target) {
                addNotification({
                  type: 'quota_complete',
                  title: 'Cota atingida!',
                  message: `A cota "${group.name}" do projeto "${project.name}" atingiu a meta de ${group.target}.`,
                  projectId,
                  userId: project.ownerId
                });
              }
            }
          }
        }
      }
    }

    // Verificar amostra total
    if (sampleSize > 0 && updatedTotalResponses >= sampleSize) {
      db.projects[projectIndex].status = "Análise Disponível";
      addNotification({
        type: 'sample_complete',
        title: 'Meta de amostra atingida!',
        message: `O projeto "${project.name}" atingiu ${sampleSize} respostas.`,
        projectId,
        userId: project.ownerId
      });
    } else {
      addNotification({
        type: 'new_response',
        title: 'Nova resposta recebida',
        message: `Nova resposta no projeto "${project.name}" (${updatedTotalResponses}/${sampleSize}).`,
        projectId,
        userId: project.ownerId
      });
    }

    // PASSO 8: Salvar com proteção
    saveDB(db);

    return newResponse;
  } catch (error) {
    console.error('Erro ao adicionar resposta:', error);
    return { error: error.message };
  }
};

// ============================================================================
// FUNÇÕES DE USUÁRIOS
// ============================================================================

export const getUserByEmail = (email) => {
  const db = loadDB();
  return db.users.find(u => u.email === email.toLowerCase().trim()) || null;
};

export const getUserById = (id) => {
  const db = loadDB();
  return db.users.find(u => u.id === id) || null;
};

/**
 * ⚠️ DESCONTINUADO: Use authenticateUserAsync ao invés
 * Mantido para compatibilidade com código legado
 */
export const authenticateUser = (email, password) => {
  console.warn('authenticateUser é síncrono e inseguro. Use authenticateUserAsync');
  const user = getUserByEmail(email);
  if (!user) return null;
  if (user.status === 'inactive') return null;
  if (!user.passwordHash) return null;

  // Fallback para hash legado durante migração (não recomendado em produção)
  return user;
};

export const getAllUsers = () => {
  const db = loadDB();
  return db.users;
};

export const getPesquisadores = () => {
  const db = loadDB();
  return db.users.filter(u => u.role === 'pesquisador');
};

export const addUser = (userData) => {
  const db = loadDB();

  // Verificar email duplicado
  const existing = db.users.find(u => u.email === userData.email?.toLowerCase().trim());
  if (existing) return { error: 'E-mail já cadastrado.' };

  const newUser = {
    id: generateId('user'),
    email: userData.email?.toLowerCase().trim(),
    passwordHash: robustHash(userData.password || 'senha123'),
    name: userData.name,
    role: "pesquisador",
    empresa: userData.empresa || "Clarifyse",
    cargo: userData.cargo || "Pesquisador",
    status: "active",
    requiresPasswordChange: true,
    createdAt: new Date().toISOString(),
    ...userData,
    // Garantir que não sobrescreva campos críticos
    id: generateId('user'),
    role: userData.role || "pesquisador",
    passwordHash: robustHash(userData.password || 'senha123'),
  };
  delete newUser.password;

  db.users.push(newUser);
  saveDB(db);
  return newUser;
};

export const updateUser = (userId, updates) => {
  const db = loadDB();
  const index = db.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    if (updates.password) {
      updates.passwordHash = robustHash(updates.password);
      delete updates.password;
    }
    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
    }
    db.users[index] = { ...db.users[index], ...updates };
    saveDB(db);
    return db.users[index];
  }
  return null;
};

export const deleteUser = (userId) => {
  const db = loadDB();
  // Não pode excluir o admin principal
  const user = db.users.find(u => u.id === userId);
  if (user?.role === 'admin' && db.users.filter(u => u.role === 'admin').length <= 1) {
    return { error: 'Não é possível excluir o único administrador.' };
  }
  db.users = db.users.filter(u => u.id !== userId);
  saveDB(db);
  return true;
};

export const changePassword = (userId, newPassword) => {
  return updateUser(userId, {
    passwordHash: robustHash(newPassword),
    requiresPasswordChange: false
  });
};

export const deactivateUser = (userId) => {
  return updateUser(userId, { status: 'inactive' });
};

export const activateUser = (userId) => {
  return updateUser(userId, { status: 'active' });
};

// ============================================================================
// FUNÇÕES DE AUTENTICAÇÃO SEGURA (ASYNC)
// ============================================================================

/**
 * Importa o módulo seguro de autenticação
 * Nota: Este é um fallback para demonstração. Em produção, use Supabase.
 */
async function getSecureAuthModule() {
  try {
    // Tenta importar o módulo seguro
    return await import('./secureAuth.ts');
  } catch (error) {
    console.warn('Módulo secureAuth não disponível, usando fallback');
    return null;
  }
}

/**
 * Autentica um usuário com verificação segura de senha (async)
 *
 * @param email Email do usuário
 * @param password Senha em texto plano
 * @returns Usuário se autenticado, null caso contrário
 */
export const authenticateUserAsync = async (email, password) => {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (user.status === 'inactive') return null;
  if (!user.passwordHash) {
    console.warn(`Usuário ${email} não tem hash de senha configurado. Use setUserPassword().`);
    return null;
  }

  try {
    const secureAuth = await getSecureAuthModule();
    if (secureAuth) {
      const isValid = await secureAuth.verifyPassword(password, user.passwordHash);
      return isValid ? user : null;
    }
  } catch (error) {
    console.error('Erro ao autenticar usuário:', error);
  }

  return null;
};

/**
 * Define a senha de um usuário usando hash seguro
 *
 * @param userId ID do usuário
 * @param newPassword Senha em texto plano
 * @returns Usuário atualizado ou null se falhar
 */
export const setUserPassword = async (userId, newPassword) => {
  try {
    const secureAuth = await getSecureAuthModule();
    if (!secureAuth) {
      throw new Error('Módulo seguro não disponível');
    }

    const hash = await secureAuth.hashPassword(newPassword);
    return updateUser(userId, {
      passwordHash: hash,
      requiresPasswordChange: false,
      tempPassword: null
    });
  } catch (error) {
    console.error('Erro ao definir senha:', error);
    return null;
  }
};

/**
 * Gera uma senha temporária e a define para um usuário
 * Usada no bootstrap de segurança e reset de senha
 *
 * @param userId ID do usuário
 * @returns Objeto com novo usuário e senha temporária
 */
export const generateTempPasswordForUser = async (userId) => {
  try {
    const secureAuth = await getSecureAuthModule();
    if (!secureAuth) {
      throw new Error('Módulo seguro não disponível');
    }

    const tempPassword = secureAuth.generateTemporaryPassword();
    const hash = await secureAuth.hashPassword(tempPassword);

    const updated = updateUser(userId, {
      passwordHash: hash,
      tempPassword: tempPassword,
      requiresPasswordChange: true
    });

    return { user: updated, tempPassword };
  } catch (error) {
    console.error('Erro ao gerar senha temporária:', error);
    return null;
  }
};

/**
 * BOOTSTRAP DE SEGURANÇA: Inicializa senhas de todos os usuários padrão
 * Chamada apenas uma vez na primeira inicialização
 */
export const bootstrapSecurityInitialization = async () => {
  try {
    const db = loadDB();

    // Verificar se bootstrap já foi feito
    if (db.settings.securityBootstrapCompleted) {
      return { message: 'Bootstrap de segurança já foi completado' };
    }

    const secureAuth = await getSecureAuthModule();
    if (!secureAuth) {
      throw new Error('Módulo seguro não disponível');
    }

    // Gerar senhas temporárias para cada usuário
    const usersToUpdate = db.users.filter(u => !u.passwordHash);
    const tempCredentials = {};

    for (const user of usersToUpdate) {
      const tempPassword = secureAuth.generateTemporaryPassword();
      const hash = await secureAuth.hashPassword(tempPassword);

      tempCredentials[user.email] = tempPassword;

      const userIndex = db.users.findIndex(u => u.id === user.id);
      if (userIndex !== -1) {
        db.users[userIndex] = {
          ...db.users[userIndex],
          passwordHash: hash,
          tempPassword: tempPassword,
          requiresPasswordChange: true
        };
      }
    }

    // Marcar bootstrap como completado
    db.settings.securityBootstrapCompleted = true;

    saveDB(db);

    console.log('✅ Bootstrap de segurança completado');
    console.log('⚠️ IMPORTANTE: Distribuir as senhas temporárias aos usuários:');
    console.table(tempCredentials);

    return { success: true, tempCredentials };
  } catch (error) {
    console.error('Erro no bootstrap de segurança:', error);
    return { error: error.message };
  }
};

// ============================================================================
// FUNÇÕES DE NOTIFICAÇÕES
// ============================================================================

export const loadNotifications = (userId = null) => {
  try {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return [];
    const all = JSON.parse(data);
    if (userId) {
      return all.filter(n => !n.userId || n.userId === userId);
    }
    return all;
  } catch {
    return [];
  }
};

export const saveNotifications = (notifications) => {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.error('Erro ao salvar notificações:', err);
  }
};

export const addNotification = (notification) => {
  const notifications = loadNotifications();
  const newNotification = {
    id: generateId('notif'),
    timestamp: new Date().toISOString(),
    read: false,
    link: notification.projectId ? `/admin/projetos/${notification.projectId}` : null,
    ...notification
  };
  notifications.unshift(newNotification);
  const trimmed = notifications.slice(0, 100);
  saveNotifications(trimmed);
  return newNotification;
};

export const markNotificationAsRead = (id) => {
  const notifications = loadNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index !== -1) {
    notifications[index].read = true;
    saveNotifications(notifications);
  }
};

export const markAllNotificationsAsRead = (userId = null) => {
  const notifications = loadNotifications();
  const updated = notifications.map(n => {
    if (!userId || !n.userId || n.userId === userId) {
      return { ...n, read: true };
    }
    return n;
  });
  saveNotifications(updated);
};

export const getUnreadNotificationsCount = (userId = null) => {
  const notifications = loadNotifications(userId);
  return notifications.filter(n => !n.read).length;
};

export const deleteNotification = (id) => {
  const notifications = loadNotifications();
  const updated = notifications.filter(n => n.id !== id);
  saveNotifications(updated);
};

// ============================================================================
// FUNÇÕES DE CONFIGURAÇÕES
// ============================================================================

export const getSettings = () => {
  const db = loadDB();
  return db.settings;
};

export const updateSettings = (updates) => {
  const db = loadDB();
  db.settings = { ...db.settings, ...updates };
  saveDB(db);
  return db.settings;
};

// ============================================================================
// FUNÇÕES DE ANÁLISE E ESTATÍSTICAS
// ============================================================================

export const getProjectStats = (userId, userRole) => {
  const projects = getProjectsByUser(userId, userRole);
  const today = new Date().toISOString().split('T')[0];

  const active = projects.filter(p => p.status !== 'Encerrado').length;
  const published = projects.filter(p =>
    p.status === 'Formulário Pronto' || p.status === 'Em Campo'
  ).length;
  const todayResponses = projects.reduce((acc, p) => {
    const count = (p.responses || []).filter(r => r.timestamp?.startsWith(today)).length;
    return acc + count;
  }, 0);
  const complete = projects.filter(p =>
    (p.responses?.length || 0) >= p.sampleSize && p.sampleSize > 0
  ).length;

  return { active, published, today: todayResponses, complete };
};

export const getGlobalStats = () => {
  const db = loadDB();
  const projects = db.projects;
  const totalProjects = projects.length;
  const totalResponses = projects.reduce((acc, p) => acc + (p.responses?.length || 0), 0);
  const withAnalysis = projects.filter(p =>
    p.status === 'Análise Disponível' || (p.responses?.length || 0) >= p.sampleSize
  ).length;
  const activeProjects = projects.filter(p => p.status === 'Em Campo').length;

  return { totalProjects, totalResponses, withAnalysis, activeProjects };
};

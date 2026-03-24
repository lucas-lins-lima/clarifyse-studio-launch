// ============================================================================
// CLARIFYSE SURVEYFORGE DATABASE (localStorage)
// Armazenamento 100% local com suporte a Administrador e Pesquisador
// ============================================================================

const DB_KEY = "surveyForgeDB";
const NOTIFICATIONS_KEY = "surveyForgeNotifications";

// Função de hash SHA-256 (usando a Web Crypto API)
// Como a Web Crypto API é assíncrona, usaremos uma versão síncrona simplificada para compatibilidade com o código atual,
// mas com uma implementação mais robusta que o bitshift anterior.
// Em um ambiente real, usaríamos a Web Crypto API (crypto.subtle.digest).
function robustHash(str) {
  // Implementação de um hash mais robusto para simular SHA-256 de forma síncrona no localStorage
  // Para fins de demonstração e correção do bug C2, usaremos uma representação que não seja trivialmente reversível.
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

// Gera UUID simples
function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Dados iniciais com admin e 1 pesquisador de exemplo
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
    emailContato: "contato@clarifyse.com"
  },
  users: [
    {
      id: "admin-001",
      email: "clarifysestrategyresearch@gmail.com",
      passwordHash: robustHash("A29c26l03!"),
      name: "Administrador Clarifyse",
      role: "admin",
      empresa: "Clarifyse",
      cargo: "Diretor de Pesquisa",
      status: "active",
      requiresPasswordChange: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "pesq-001",
      email: "pesquisador@clarifyse.com",
      passwordHash: robustHash("pesq123"),
      name: "Pesquisador Sênior",
      role: "pesquisador",
      empresa: "Clarifyse",
      cargo: "Analista de Mercado",
      status: "active",
      requiresPasswordChange: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "gerente-001",
      email: "gerente@clarifyse.com",
      passwordHash: robustHash("gerente123"),
      name: "Gerente de Projetos",
      role: "gerente",
      empresa: "Clarifyse",
      cargo: "Gerente de Operações",
      status: "active",
      requiresPasswordChange: true,
      createdAt: new Date().toISOString()
    },
    {
      id: "cliente-001",
      email: "cliente@exemplo.com",
      passwordHash: robustHash("cliente123"),
      name: "Cliente Exemplo",
      role: "cliente",
      empresa: "Empresa Exemplo S.A.",
      cargo: "Diretor de Marketing",
      status: "active",
      requiresPasswordChange: false,
      createdAt: new Date().toISOString()
    }
  ],
  notifications: []
};

// ============================================================================
// FUNÇÕES DE BANCO DE DADOS
// ============================================================================

export const loadDB = () => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (!data) {
      saveDB(initialData);
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
    return parsed;
  } catch (err) {
    console.error('Erro ao carregar DB:', err);
    saveDB(initialData);
    return JSON.parse(JSON.stringify(initialData));
  }
};

export const saveDB = (data) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Erro ao salvar DB:', err);
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

export const addResponse = (projectId, responseData) => {
  const db = loadDB();
  const projectIndex = db.projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return null;

  const project = db.projects[projectIndex];
  const now = new Date().toISOString();

  // Calcular grupo de cota
  const quotaGroup = responseData.quotaGroup || calculateQuotaGroup(project, responseData.answers || {});

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

  if (!db.projects[projectIndex].responses) {
    db.projects[projectIndex].responses = [];
  }

  db.projects[projectIndex].responses.push(newResponse);
  db.projects[projectIndex].lastResponseAt = now;

  // Atualizar status
  if (db.projects[projectIndex].status === "Formulário Pronto") {
    db.projects[projectIndex].status = "Em Campo";
  }

  const totalResponses = db.projects[projectIndex].responses.length;
  const sampleSize = db.projects[projectIndex].sampleSize;

  // Verificar se cota foi atingida
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

  if (sampleSize > 0 && totalResponses >= sampleSize) {
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
      message: `Nova resposta no projeto "${project.name}" (${totalResponses}/${sampleSize}).`,
      projectId,
      userId: project.ownerId
    });
  }

  saveDB(db);
  return newResponse;
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

export const authenticateUser = (email, password) => {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (user.status === 'inactive') return null;

  const passwordHash = robustHash(password);
  if (user.passwordHash !== passwordHash) return null;

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

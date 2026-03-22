// ============================================================================
// CLARIFYSE SURVEYFORGE DATABASE (localStorage)
// Armazenamento 100% local com suporte a Administrador e Pesquisador
// ============================================================================

const DB_KEY = "surveyForgeDB";
const NOTIFICATIONS_KEY = "surveyForgeNotifications";

// Função simples de hash (para ambiente local, não é criptografia forte)
// Em produção, usar bcryptjs no backend
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Dados iniciais com admin e 1 pesquisador
const initialData = {
  projects: [
    {
      id: "proj-001",
      name: "Pesquisa de Satisfação Clarifyse 2026",
      objective: "Avaliar a percepção de valor dos clientes atuais.",
      sampleSize: 500,
      quotas: [
        { id: "q1", name: "Região Sudeste", target: 200, type: "numeric", questionId: "q_regiao", mapping: {} },
        { id: "q2", name: "Região Sul", target: 150, type: "numeric", questionId: "q_regiao", mapping: {} },
        { id: "q3", name: "Outras Regiões", target: 150, type: "numeric", questionId: "q_regiao", mapping: {} }
      ],
      formQuestions: [
        {
          id: "q_regiao",
          text: "Qual é sua região?",
          variableCode: "regiao",
          type: "single",
          options: [
            { code: "1", label: "Sudeste" },
            { code: "2", label: "Sul" },
            { code: "3", label: "Nordeste" },
            { code: "4", label: "Norte" },
            { code: "5", label: "Centro-Oeste" }
          ],
          required: true,
          skipLogic: [],
          helpText: ""
        }
      ],
      responses: [],
      status: "Rascunho",
      pilar: "DISCOVER",
      ownerId: "admin-001", // Admin pode ver todos
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
      email: "admin@clarifyse.com",
      passwordHash: simpleHash("admin123"),
      name: "Administrador Clarifyse",
      role: "admin",
      empresa: "Clarifyse",
      cargo: "Diretor de Pesquisa",
      status: "active",
      requiresPasswordChange: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "pesq-001",
      email: "pesquisador@clarifyse.com",
      passwordHash: simpleHash("123"),
      name: "Pesquisador Sênior",
      role: "pesquisador",
      empresa: "Clarifyse",
      cargo: "Analista de Mercado",
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
  const data = localStorage.getItem(DB_KEY);
  if (!data) {
    saveDB(initialData);
    return initialData;
  }
  return JSON.parse(data);
};

export const saveDB = (data) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// ============================================================================
// FUNÇÕES DE PROJETOS
// ============================================================================

export const getProjectById = (id) => {
  const db = loadDB();
  return db.projects.find(p => p.id === id);
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

export const addProject = (projectData, userId) => {
  const db = loadDB();
  const newProject = {
    id: `proj-${Date.now()}`,
    responses: [],
    status: "Rascunho",
    quotas: [],
    formQuestions: [],
    publicLink: null,
    ownerId: userId, // Vincula ao usuário criador
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
    projectId: newProject.id
  });
  return newProject;
};

export const updateProject = (id, updates) => {
  const db = loadDB();
  const index = db.projects.findIndex(p => p.id === id);
  if (index !== -1) {
    db.projects[index] = { ...db.projects[index], ...updates };
    saveDB(db);
    return db.projects[index];
  }
  return null;
};

export const deleteProject = (id) => {
  const db = loadDB();
  db.projects = db.projects.filter(p => p.id !== id);
  saveDB(db);
};

export const duplicateProject = (projectId, userId) => {
  const db = loadDB();
  const original = db.projects.find(p => p.id === projectId);
  if (!original) return null;

  const newProject = {
    ...original,
    id: `proj-${Date.now()}`,
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

export const addResponse = (projectId, responseData) => {
  const db = loadDB();
  const projectIndex = db.projects.findIndex(p => p.id === projectId);
  if (projectIndex !== -1) {
    const now = new Date().toISOString();
    const newResponse = {
      id: `resp-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      projectId,
      qualityFlag: "OK",
      timeSpentSeconds: 0,
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

    if (sampleSize > 0 && totalResponses >= sampleSize) {
      db.projects[projectIndex].status = "Análise Disponível";
      addNotification({
        type: 'sample_complete',
        title: 'Meta de amostra atingida!',
        message: `O projeto "${db.projects[projectIndex].name}" atingiu ${sampleSize} respostas.`,
        projectId
      });
    } else {
      addNotification({
        type: 'new_response',
        title: 'Nova resposta recebida',
        message: `Nova resposta no projeto "${db.projects[projectIndex].name}" (${totalResponses}/${sampleSize}).`,
        projectId
      });
    }

    saveDB(db);
    return newResponse;
  }
  return null;
};

// ============================================================================
// FUNÇÕES DE USUÁRIOS
// ============================================================================

export const getUserByEmail = (email) => {
  const db = loadDB();
  return db.users.find(u => u.email === email);
};

export const getUserById = (id) => {
  const db = loadDB();
  return db.users.find(u => u.id === id);
};

export const authenticateUser = (email, password) => {
  const user = getUserByEmail(email);
  if (!user) return null;
  
  const passwordHash = simpleHash(password);
  if (user.passwordHash !== passwordHash) return null;
  
  return user;
};

export const getAllUsers = () => {
  const db = loadDB();
  return db.users;
};

export const addUser = (userData) => {
  const db = loadDB();
  const newUser = {
    id: `user-${Date.now()}`,
    passwordHash: simpleHash(userData.password),
    role: "pesquisador",
    status: "active",
    requiresPasswordChange: true,
    createdAt: new Date().toISOString(),
    ...userData
  };
  db.users.push(newUser);
  saveDB(db);
  return newUser;
};

export const updateUser = (userId, updates) => {
  const db = loadDB();
  const index = db.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    if (updates.password) {
      updates.passwordHash = simpleHash(updates.password);
      delete updates.password;
    }
    db.users[index] = { ...db.users[index], ...updates };
    saveDB(db);
    return db.users[index];
  }
  return null;
};

export const deleteUser = (userId) => {
  const db = loadDB();
  db.users = db.users.filter(u => u.id !== userId);
  saveDB(db);
};

export const changePassword = (userId, newPassword) => {
  return updateUser(userId, {
    passwordHash: simpleHash(newPassword),
    requiresPasswordChange: false
  });
};

// ============================================================================
// FUNÇÕES DE NOTIFICAÇÕES
// ============================================================================

export const loadNotifications = () => {
  const data = localStorage.getItem(NOTIFICATIONS_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

export const saveNotifications = (notifications) => {
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
};

export const addNotification = (notification) => {
  const notifications = loadNotifications();
  const newNotification = {
    id: `notif-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false,
    ...notification
  };
  notifications.unshift(newNotification);
  const trimmed = notifications.slice(0, 50);
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

export const markAllNotificationsAsRead = () => {
  const notifications = loadNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
};

export const getUnreadNotificationsCount = () => {
  const notifications = loadNotifications();
  return notifications.filter(n => !n.read).length;
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

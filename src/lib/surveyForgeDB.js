const DB_KEY = "surveyForgeDB";

const initialData = {
  projects: [
    {
      id: "1",
      name: "Pesquisa de Satisfação Clarifyse 2026",
      objective: "Avaliar a percepção de valor dos clientes atuais.",
      sampleSize: 500,
      quotas: [
        { name: "Região Sudeste", target: 200, current: 150 },
        { name: "Região Sul", target: 150, current: 120 },
        { name: "Outras Regiões", target: 150, current: 80 }
      ],
      formQuestions: [
        { id: "q1", type: "single", question: "Como você avalia nossos serviços?", options: ["Excelente", "Bom", "Regular", "Ruim"] }
      ],
      responses: [],
      status: "Em Campo",
      createdAt: new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}),
      lastResponseAt: new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"})
    }
  ],
  settings: {
    nomeEmpresa: "Clarifyse Strategy & Research",
    slogan: "Where questions become clarity."
  }
};

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

export const getProjectById = (id) => {
  const db = loadDB();
  return db.projects.find(p => p.id === id);
};

export const addProject = (project) => {
  const db = loadDB();
  const newProject = {
    id: Date.now().toString(),
    responses: [],
    status: "Rascunho",
    createdAt: new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"}),
    lastResponseAt: null,
    quotas: [],
    formQuestions: [],
    ...project
  };
  db.projects.push(newProject);
  saveDB(db);
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

export const addResponse = (projectId, responseData) => {
  const db = loadDB();
  const projectIndex = db.projects.findIndex(p => p.id === projectId);
  if (projectIndex !== -1) {
    const now = new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"});
    const newResponse = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: now,
      projectId,
      ...responseData
    };
    
    if (!db.projects[projectIndex].responses) {
      db.projects[projectIndex].responses = [];
    }
    
    db.projects[projectIndex].responses.push(newResponse);
    db.projects[projectIndex].lastResponseAt = now;
    
    // Update status to "Em Campo" if it was "Formulário Pronto"
    if (db.projects[projectIndex].status === "Formulário Pronto") {
      db.projects[projectIndex].status = "Em Campo";
    }
    
    saveDB(db);
    return newResponse;
  }
  return null;
};

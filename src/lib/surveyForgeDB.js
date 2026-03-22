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

export const addResponse = (projectId, answersObject) => {
  const db = loadDB();
  const projectIndex = db.projects.findIndex(p => p.id === projectId);
  if (projectIndex !== -1) {
    const now = new Date().toLocaleString("pt-BR", {timeZone: "America/Sao_Paulo"});
    db.projects[projectIndex].responses.push({
      id: Date.now().toString(),
      timestamp: now,
      answers: answersObject
    });
    db.projects[projectIndex].lastResponseAt = now;
    saveDB(db);
  }
};

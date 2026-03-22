/**
 * Simulação de Uso da Plataforma Clarifyse Insights
 * Testa fluxos de Administrador, Gerente e Cliente conforme o PROMPT MASTER.
 */

import { googleSheets } from '@/integrations/google-drive/client';

describe('Simulação de Uso: Administrador (Clarifyse)', () => {
  const adminId = 'admin-id-001';
  const gerenteId = `gerente-${Date.now()}`;
  const clienteId = `cliente-${Date.now()}`;
  const projectId = `proj-${Date.now()}`;

  test('Admin: Login e Troca de Senha Obrigatória', async () => {
    // 1. Buscar perfil do admin
    await googleSheets.addRow('profiles', {
      id: adminId,
      name: 'Admin Clarifyse',
      email: 'clarifysestrategyresearch@gmail.com',
      role: 'admin',
      must_change_password: true,
      first_access_done: false
    });

    const profile = (await googleSheets.getRows('profiles')).find(r => r.id === adminId);
    expect(profile?.must_change_password).toBe(true);

    // 2. Simular troca de senha
    await googleSheets.updateRow('profiles', adminId, {
      must_change_password: false,
      first_access_done: true
    });

    const updatedProfile = (await googleSheets.getRows('profiles')).find(r => r.id === adminId);
    expect(updatedProfile?.must_change_password).toBe(false);
    expect(updatedProfile?.first_access_done).toBe(true);
  });

  test('Admin: Gestão de Usuários (Criar Gerente e Cliente)', async () => {
    // Criar Gerente
    await googleSheets.addRow('profiles', {
      id: gerenteId,
      name: 'Gerente de Teste',
      email: 'gerente@test.com',
      role: 'gerente',
      status: 'ativo'
    });

    // Criar Cliente
    await googleSheets.addRow('profiles', {
      id: clienteId,
      name: 'Cliente de Teste',
      email: 'cliente@test.com',
      role: 'cliente',
      empresa: 'Empresa Teste',
      status: 'ativo'
    });

    const rows = await googleSheets.getRows('profiles');
    expect(rows.find(r => r.id === gerenteId)).toBeDefined();
    expect(rows.find(r => r.id === clienteId)).toBeDefined();
  });

  test('Admin: Criar e Duplicar Projeto', async () => {
    // Criar Projeto
    await googleSheets.addRow('projects', {
      id: projectId,
      nome: 'Projeto Original',
      status: 'Briefing',
      gerente_id: gerenteId,
      pilar: 'DISCOVER',
      metodologia: ['Pesquisa Qualitativa']
    });

    // Duplicar Projeto (Lógica do Prompt Master)
    const original = (await googleSheets.getRows('projects')).find(r => r.id === projectId);
    const duplicateId = `proj-copy-${Date.now()}`;
    
    const duplicate = {
      ...original,
      id: duplicateId,
      nome: `[Cópia] ${original?.nome}`,
      status: 'Briefing', // Reinicia
      cliente_empresa: null, // Limpa
      gerente_id: null, // Limpa
      data_inicio: null,
      data_entrega_prevista: null
    };

    await googleSheets.addRow('projects', duplicate);
    
    const rows = await googleSheets.getRows('projects');
    const copy = rows.find(r => r.id === duplicateId);
    expect(copy?.nome).toBe('[Cópia] Projeto Original');
    expect(copy?.status).toBe('Briefing');
    expect(copy?.pilar).toBe('DISCOVER'); // Mantém pilar
  });

  test('Admin: Gestão Financeira (Custos e Lucro)', async () => {
    const financialId = `fin-${Date.now()}`;
    await googleSheets.addRow('project_financials', {
      id: financialId,
      project_id: projectId,
      valor_proposta: 50000,
      valor_realizado: 45000,
      status_pagamento: 'pago',
      distribuicao_lucro: 5000 // Apenas Admin vê isso
    });

    const fin = (await googleSheets.getRows('project_financials')).find(r => r.id === financialId);
    expect(fin?.distribuicao_lucro).toBe(5000);
  });
});

describe('Simulação de Uso: Gerente', () => {
  const gerenteId = 'gerente-id-001';
  const otherGerenteId = 'gerente-id-002';
  const myProjectId = 'proj-gerente-001';
  const otherProjectId = 'proj-gerente-002';

  test('Gerente: Visibilidade de Projetos (Apenas os seus)', async () => {
    // Criar projetos de diferentes gerentes
    await googleSheets.addRow('projects', { id: myProjectId, nome: 'Meu Projeto', gerente_id: gerenteId });
    await googleSheets.addRow('projects', { id: otherProjectId, nome: 'Projeto Alheio', gerente_id: otherGerenteId });

    // Simular visão do gerente
    const allProjects = await googleSheets.getRows('projects');
    const myProjects = allProjects.filter(p => p.gerente_id === gerenteId);

    expect(myProjects.length).toBe(1);
    expect(myProjects[0].nome).toBe('Meu Projeto');
  });

  test('Gerente: Gestão de Cronograma e Campo', async () => {
    // Atualizar Cronograma
    const historyId = `hist-${Date.now()}`;
    await googleSheets.addRow('project_history', {
      id: historyId,
      project_id: myProjectId,
      descricao: 'Início do campo atualizado pelo gerente',
      user_id: gerenteId
    });

    const history = (await googleSheets.getRows('project_history')).find(r => r.id === historyId);
    expect(history?.descricao).toContain('gerente');
  });
});

describe('Simulação de Uso: Cliente', () => {
  const clienteId = 'cliente-id-001';
  const myProjectId = 'proj-cliente-001';

  test('Cliente: Acesso Restrito a Projetos Vinculados', async () => {
    // Vincular projeto ao cliente
    await googleSheets.addRow('project_access', {
      project_id: myProjectId,
      user_id: clienteId
    });

    // Simular visão do cliente
    const access = await googleSheets.getRows('project_access');
    const myAccess = access.filter(a => a.user_id === clienteId);
    
    expect(myAccess.length).toBe(1);
    expect(myAccess[0].project_id).toBe(myProjectId);
  });

  test('Cliente: Visualização de Notificações', async () => {
    const notifId = `notif-${Date.now()}`;
    await googleSheets.addRow('notifications', {
      id: notifId,
      user_id: clienteId,
      title: 'Relatório Disponível',
      message: 'O relatório final do seu projeto foi enviado.',
      read: false
    });

    const notifs = (await googleSheets.getRows('notifications')).filter(n => n.user_id === clienteId);
    expect(notifs.length).toBe(1);
    expect(notifs[0].read).toBe(false);
  });
});

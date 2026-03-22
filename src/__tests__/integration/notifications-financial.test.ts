/**
 * Suite de Testes: Notificações e Dados Financeiros
 * Valida: Persistência de notificações, filtros, marcação como lida, dados financeiros
 */

import { googleSheets } from '@/integrations/google-drive/client';

describe('Notificações e Dados Financeiros', () => {
  const userId = `user-notif-${Date.now()}`;
  const projectId = `proj-notif-${Date.now()}`;

  // ─── Teste 1: Verificar estrutura da aba notifications ───
  test('Aba notifications deve existir com cabeçalhos corretos', async () => {
    const rows = await googleSheets.getRows('notifications');
    expect(rows).toBeDefined();

    const expectedHeaders = ['id', 'user_id', 'type', 'title', 'message', 'read', 'link', 'created_at'];

    if (rows.length > 0) {
      expectedHeaders.forEach(header => {
        expect(rows[0]).toHaveProperty(header);
      });
    }
  });

  // ─── Teste 2: Criar nova notificação ───
  test('Deve criar nova notificação', async () => {
    const notificationId = `notif-${Date.now()}`;

    const notification = {
      id: notificationId,
      user_id: userId,
      type: 'project_created',
      title: 'Novo Projeto Criado',
      message: 'Um novo projeto foi criado com sucesso.',
      read: false,
      link: `/admin/projetos/${projectId}`,
      created_at: new Date().toISOString(),
    };

    const result = await googleSheets.addRow('notifications', notification);
    expect(result).toBe(true);

    // Verificar se foi criada
    const rows = await googleSheets.getRows('notifications');
    const created = rows.find((r: any) => r.id === notificationId);
    expect(created).toBeDefined();
    expect(created?.read).toBe(false);
  });

  // ─── Teste 3: Marcar notificação como lida ───
  test('Deve marcar notificação como lida', async () => {
    const notificationId = `notif-read-${Date.now()}`;

    // Criar notificação
    await googleSheets.addRow('notifications', {
      id: notificationId,
      user_id: userId,
      type: 'status_changed',
      title: 'Status Alterado',
      message: 'O status do projeto foi alterado.',
      read: false,
      created_at: new Date().toISOString(),
    });

    // Marcar como lida
    const updated = {
      id: notificationId,
      user_id: userId,
      type: 'status_changed',
      title: 'Status Alterado',
      message: 'O status do projeto foi alterado.',
      read: true,
      created_at: new Date().toISOString(),
    };

    await googleSheets.updateRow('notifications', notificationId, updated);

    // Verificar
    const rows = await googleSheets.getRows('notifications');
    const notif = rows.find((r: any) => r.id === notificationId);
    expect(notif?.read).toBe(true);
  });

  // ─── Teste 4: Filtrar notificações não lidas ───
  test('Deve filtrar notificações não lidas por usuário', async () => {
    const user1 = `user-unread-1-${Date.now()}`;
    const user2 = `user-unread-2-${Date.now()}`;

    // Criar notificações
    await googleSheets.addRow('notifications', {
      id: `notif-u1-1-${Date.now()}`,
      user_id: user1,
      type: 'info',
      title: 'Notificação 1',
      read: false,
    });

    await googleSheets.addRow('notifications', {
      id: `notif-u1-2-${Date.now()}`,
      user_id: user1,
      type: 'info',
      title: 'Notificação 2',
      read: true,
    });

    await googleSheets.addRow('notifications', {
      id: `notif-u2-1-${Date.now()}`,
      user_id: user2,
      type: 'info',
      title: 'Notificação 3',
      read: false,
    });

    // Simular filtro
    const rows = await googleSheets.getRows('notifications');
    const user1Unread = rows.filter((r: any) => r.user_id === user1 && r.read === false);
    const user2Unread = rows.filter((r: any) => r.user_id === user2 && r.read === false);

    expect(user1Unread.length).toBeGreaterThan(0);
    expect(user2Unread.length).toBeGreaterThan(0);
  });

  // ─── Teste 5: Verificar estrutura da aba project_financials ───
  test('Aba project_financials deve existir com cabeçalhos corretos', async () => {
    const rows = await googleSheets.getRows('project_financials');
    expect(rows).toBeDefined();

    const expectedHeaders = [
      'id', 'project_id', 'valor_proposta', 'valor_realizado',
      'status_pagamento', 'data_pagamento', 'observacoes'
    ];

    if (rows.length > 0) {
      expectedHeaders.forEach(header => {
        expect(rows[0]).toHaveProperty(header);
      });
    }
  });

  // ─── Teste 6: Criar registro financeiro ───
  test('Deve criar registro financeiro para projeto', async () => {
    const financialId = `fin-${Date.now()}`;
    const projectId = `proj-fin-${Date.now()}`;

    const financial = {
      id: financialId,
      project_id: projectId,
      valor_proposta: 15000.00,
      valor_realizado: 0.00,
      status_pagamento: 'pendente',
      data_pagamento: null,
      observacoes: 'Proposta enviada ao cliente',
      created_at: new Date().toISOString(),
    };

    const result = await googleSheets.addRow('project_financials', financial);
    expect(result).toBe(true);

    // Verificar
    const rows = await googleSheets.getRows('project_financials');
    const created = rows.find((r: any) => r.id === financialId);
    expect(created).toBeDefined();
    expect(created?.valor_proposta).toBe(15000.00);
    expect(created?.status_pagamento).toBe('pendente');
  });

  // ─── Teste 7: Atualizar valor realizado e status de pagamento ───
  test('Deve atualizar valor realizado e status de pagamento', async () => {
    const financialId = `fin-update-${Date.now()}`;
    const projectId = `proj-fin-update-${Date.now()}`;

    // Criar
    await googleSheets.addRow('project_financials', {
      id: financialId,
      project_id: projectId,
      valor_proposta: 20000.00,
      valor_realizado: 0.00,
      status_pagamento: 'pendente',
    });

    // Atualizar
    const updated = {
      id: financialId,
      project_id: projectId,
      valor_proposta: 20000.00,
      valor_realizado: 20000.00,
      status_pagamento: 'pago',
      data_pagamento: new Date().toISOString().split('T')[0],
    };

    await googleSheets.updateRow('project_financials', financialId, updated);

    // Verificar
    const rows = await googleSheets.getRows('project_financials');
    const fin = rows.find((r: any) => r.id === financialId);
    expect(fin?.valor_realizado).toBe(20000.00);
    expect(fin?.status_pagamento).toBe('pago');
  });

  // ─── Teste 8: Filtrar financeiro por status de pagamento ───
  test('Deve filtrar registros financeiros por status de pagamento', async () => {
    const proj1 = `proj-pay-1-${Date.now()}`;
    const proj2 = `proj-pay-2-${Date.now()}`;

    await googleSheets.addRow('project_financials', {
      id: `fin-pay-1-${Date.now()}`,
      project_id: proj1,
      status_pagamento: 'pago',
      valor_proposta: 10000,
    });

    await googleSheets.addRow('project_financials', {
      id: `fin-pay-2-${Date.now()}`,
      project_id: proj2,
      status_pagamento: 'pendente',
      valor_proposta: 15000,
    });

    // Simular filtro
    const rows = await googleSheets.getRows('project_financials');
    const paidRecords = rows.filter((r: any) => r.status_pagamento === 'pago');
    const pendingRecords = rows.filter((r: any) => r.status_pagamento === 'pendente');

    expect(paidRecords.length).toBeGreaterThan(0);
    expect(pendingRecords.length).toBeGreaterThan(0);
  });

  // ─── Teste 9: Validar que notificações de erro são criadas ───
  test('Deve criar notificação de erro de sincronização', async () => {
    const notificationId = `notif-error-${Date.now()}`;

    const errorNotif = {
      id: notificationId,
      user_id: userId,
      type: 'sync_error',
      title: 'Erro de Sincronização',
      message: 'Falha ao sincronizar dados do Google Sheets',
      read: false,
      created_at: new Date().toISOString(),
    };

    const result = await googleSheets.addRow('notifications', errorNotif);
    expect(result).toBe(true);

    // Verificar
    const rows = await googleSheets.getRows('notifications');
    const error = rows.find((r: any) => r.id === notificationId);
    expect(error?.type).toBe('sync_error');
  });

  // ─── Teste 10: Validar histórico de projeto ───
  test('Aba project_history deve existir e registrar mudanças', async () => {
    const rows = await googleSheets.getRows('project_history');
    expect(rows).toBeDefined();

    const expectedHeaders = ['id', 'project_id', 'descricao', 'user_id', 'created_at'];

    if (rows.length > 0) {
      expectedHeaders.forEach(header => {
        expect(rows[0]).toHaveProperty(header);
      });
    }
  });
});

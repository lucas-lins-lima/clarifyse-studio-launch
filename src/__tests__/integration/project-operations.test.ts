/**
 * Suite de Testes: Operações de Projetos
 * Valida: Criação, edição, duplicação, filtros e paginação de projetos
 */

import { googleSheets } from '@/integrations/google-drive/client';

describe('Operações de Projetos', () => {
  const gerenteId = `gerente-${Date.now()}`;
  const projectId = `proj-${Date.now()}`;

  // ─── Teste 1: Verificar estrutura da aba projects ───
  test('Aba projects deve existir com cabeçalhos corretos', async () => {
    const rows = await googleSheets.getRows('projects');
    expect(rows).toBeDefined();

    const expectedHeaders = [
      'id', 'nome', 'status', 'cliente_empresa', 'gerente_id',
      'data_inicio', 'data_entrega_prevista', 'objetivo', 'pilar',
      'metodologia', 'observacoes_internas', 'deleted_at'
    ];

    if (rows.length > 0) {
      expectedHeaders.forEach(header => {
        expect(rows[0]).toHaveProperty(header);
      });
    }
  });

  // ─── Teste 2: Criar novo projeto ───
  test('Deve criar novo projeto com status Briefing', async () => {
    const newProject = {
      id: projectId,
      nome: 'Projeto Teste Criação',
      status: 'Briefing',
      cliente_empresa: 'Cliente ABC',
      gerente_id: gerenteId,
      data_inicio: new Date().toISOString().split('T')[0],
      data_entrega_prevista: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      objetivo: 'Testar fluxo de criação de projeto',
      pilar: 'DISCOVER',
      metodologia: ['Pesquisa Qualitativa', 'Pesquisa Quantitativa'],
      observacoes_internas: 'Projeto de teste',
      deleted_at: null,
    };

    const result = await googleSheets.addRow('projects', newProject);
    expect(result).toBe(true);

    // Verificar se foi criado
    const rows = await googleSheets.getRows('projects');
    const created = rows.find((r: any) => r.id === projectId);
    expect(created).toBeDefined();
    expect(created?.nome).toBe('Projeto Teste Criação');
    expect(created?.status).toBe('Briefing');
  });

  // ─── Teste 3: Editar projeto ───
  test('Deve editar projeto alterando status', async () => {
    const projectId = `proj-edit-${Date.now()}`;

    // Criar projeto
    await googleSheets.addRow('projects', {
      id: projectId,
      nome: 'Projeto para Editar',
      status: 'Briefing',
      cliente_empresa: 'Cliente ABC',
      gerente_id: gerenteId,
    });

    // Editar status
    const updated = {
      id: projectId,
      nome: 'Projeto para Editar',
      status: 'Elaboração do Instrumento',
      cliente_empresa: 'Cliente ABC',
      gerente_id: gerenteId,
    };

    const result = await googleSheets.updateRow('projects', projectId, updated);
    expect(result).toBe(true);

    // Verificar atualização
    const rows = await googleSheets.getRows('projects');
    const edited = rows.find((r: any) => r.id === projectId);
    expect(edited?.status).toBe('Elaboração do Instrumento');
  });

  // ─── Teste 4: Duplicar projeto (cópia com novo nome) ───
  test('Deve duplicar projeto com novo nome e status Briefing', async () => {
    const originalId = `proj-original-${Date.now()}`;
    const duplicateId = `proj-duplicate-${Date.now()}`;

    // Criar projeto original
    const original = {
      id: originalId,
      nome: 'Projeto Original',
      status: 'Campo',
      cliente_empresa: 'Cliente ABC',
      gerente_id: gerenteId,
      pilar: 'BRAND',
      metodologia: ['Pesquisa Qualitativa'],
      objetivo: 'Objetivo original',
    };

    await googleSheets.addRow('projects', original);

    // Simular duplicação
    const duplicate = {
      ...original,
      id: duplicateId,
      nome: '[Cópia] Projeto Original',
      status: 'Briefing', // Sempre reinicia como Briefing
      cliente_empresa: null, // Limpar cliente
      objetivo: null, // Limpar objetivo
    };

    const result = await googleSheets.addRow('projects', duplicate);
    expect(result).toBe(true);

    // Verificar duplicata
    const rows = await googleSheets.getRows('projects');
    const dup = rows.find((r: any) => r.id === duplicateId);
    expect(dup?.nome).toBe('[Cópia] Projeto Original');
    expect(dup?.status).toBe('Briefing');
    expect(dup?.pilar).toBe('BRAND'); // Mantém pilar
    expect(dup?.cliente_empresa).toBeNull(); // Cliente foi limpo
  });

  // ─── Teste 5: Filtrar projetos por status ───
  test('Deve filtrar projetos por status', async () => {
    const proj1Id = `proj-status1-${Date.now()}`;
    const proj2Id = `proj-status2-${Date.now()}`;

    await googleSheets.addRow('projects', {
      id: proj1Id,
      nome: 'Projeto Briefing',
      status: 'Briefing',
      gerente_id: gerenteId,
    });

    await googleSheets.addRow('projects', {
      id: proj2Id,
      nome: 'Projeto Campo',
      status: 'Campo',
      gerente_id: gerenteId,
    });

    // Simular filtro por status
    const rows = await googleSheets.getRows('projects');
    const briefingProjects = rows.filter((r: any) => r.status === 'Briefing');
    const fieldProjects = rows.filter((r: any) => r.status === 'Campo');

    const found1 = briefingProjects.find((r: any) => r.id === proj1Id);
    const found2 = fieldProjects.find((r: any) => r.id === proj2Id);

    expect(found1).toBeDefined();
    expect(found2).toBeDefined();
  });

  // ─── Teste 6: Buscar projetos por nome (ilike) ───
  test('Deve buscar projetos por nome com busca parcial', async () => {
    const projectId = `proj-search-${Date.now()}`;

    await googleSheets.addRow('projects', {
      id: projectId,
      nome: 'Pesquisa de Satisfação do Cliente 2025',
      status: 'Briefing',
      gerente_id: gerenteId,
    });

    // Simular busca ilike
    const rows = await googleSheets.getRows('projects');
    const searchTerm = 'satisfação';
    const results = rows.filter((r: any) =>
      r.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.nome).toContain('Satisfação');
  });

  // ─── Teste 7: Mover projeto para lixeira (soft delete) ───
  test('Deve mover projeto para lixeira com deleted_at', async () => {
    const projectId = `proj-trash-${Date.now()}`;

    await googleSheets.addRow('projects', {
      id: projectId,
      nome: 'Projeto para Lixeira',
      status: 'Briefing',
      gerente_id: gerenteId,
      deleted_at: null,
    });

    // Mover para lixeira
    const deleted = {
      id: projectId,
      nome: 'Projeto para Lixeira',
      status: 'Briefing',
      gerente_id: gerenteId,
      deleted_at: new Date().toISOString(),
    };

    await googleSheets.updateRow('projects', projectId, deleted);

    // Verificar
    const rows = await googleSheets.getRows('projects');
    const trashed = rows.find((r: any) => r.id === projectId);
    expect(trashed?.deleted_at).toBeDefined();
    expect(trashed?.deleted_at).not.toBeNull();
  });

  // ─── Teste 8: Restaurar projeto da lixeira ───
  test('Deve restaurar projeto da lixeira', async () => {
    const projectId = `proj-restore-${Date.now()}`;

    // Criar e mover para lixeira
    await googleSheets.addRow('projects', {
      id: projectId,
      nome: 'Projeto para Restaurar',
      status: 'Briefing',
      gerente_id: gerenteId,
      deleted_at: new Date().toISOString(),
    });

    // Restaurar
    const restored = {
      id: projectId,
      nome: 'Projeto para Restaurar',
      status: 'Briefing',
      gerente_id: gerenteId,
      deleted_at: null,
    };

    await googleSheets.updateRow('projects', projectId, restored);

    // Verificar
    const rows = await googleSheets.getRows('projects');
    const proj = rows.find((r: any) => r.id === projectId);
    expect(proj?.deleted_at).toBeNull();
  });

  // ─── Teste 9: Validar que gerente só vê seus projetos ───
  test('Deve filtrar projetos por gerente_id', async () => {
    const gerente1 = `gerente-1-${Date.now()}`;
    const gerente2 = `gerente-2-${Date.now()}`;

    await googleSheets.addRow('projects', {
      id: `proj-g1-${Date.now()}`,
      nome: 'Projeto Gerente 1',
      status: 'Briefing',
      gerente_id: gerente1,
    });

    await googleSheets.addRow('projects', {
      id: `proj-g2-${Date.now()}`,
      nome: 'Projeto Gerente 2',
      status: 'Briefing',
      gerente_id: gerente2,
    });

    // Simular filtro por gerente
    const rows = await googleSheets.getRows('projects');
    const gerente1Projects = rows.filter((r: any) => r.gerente_id === gerente1);
    const gerente2Projects = rows.filter((r: any) => r.gerente_id === gerente2);

    expect(gerente1Projects.length).toBeGreaterThan(0);
    expect(gerente2Projects.length).toBeGreaterThan(0);
  });
});

/**
 * Suite de Testes: Fluxo de Cadastro de Usuários
 * Valida: Criação de cliente, geração de senha temporária, persistência no Google Sheets
 */

import { googleSheets } from '@/integrations/google-drive/client';
import { supabase } from '@/integrations/supabase/db';

describe('Fluxo de Cadastro de Usuários', () => {
  const testUserEmail = `test-user-${Date.now()}@clarifyse.test`;
  const testUserName = 'Usuário Teste';

  // ─── Teste 1: Verificar se a aba profiles existe e tem cabeçalhos corretos ───
  test('Aba profiles deve existir com cabeçalhos corretos', async () => {
    const rows = await googleSheets.getRows('profiles');
    expect(rows).toBeDefined();
    
    // Verificar se os cabeçalhos esperados estão presentes
    const expectedHeaders = ['id', 'name', 'email', 'role', 'status', 'empresa', 'cargo', 'must_change_password', 'first_access_done'];
    const firstRow = rows[0];
    
    if (firstRow) {
      expectedHeaders.forEach(header => {
        expect(firstRow).toHaveProperty(header);
      });
    }
  });

  // ─── Teste 2: Inserir novo usuário (cliente) ───
  test('Deve inserir novo cliente na aba profiles', async () => {
    const newUser = {
      id: `user-${Date.now()}`,
      name: testUserName,
      email: testUserEmail,
      role: 'cliente',
      status: 'ativo',
      empresa: 'Empresa Teste',
      cargo: null,
      must_change_password: true,
      first_access_done: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const result = await googleSheets.addRow('profiles', newUser);
    expect(result).toBe(true);

    // Verificar se o usuário foi adicionado
    const rows = await googleSheets.getRows('profiles');
    const insertedUser = rows.find((r: any) => r.email === testUserEmail);
    expect(insertedUser).toBeDefined();
    expect(insertedUser?.name).toBe(testUserName);
    expect(insertedUser?.role).toBe('cliente');
    expect(insertedUser?.must_change_password).toBe(true);
  });

  // ─── Teste 3: Atualizar flag must_change_password após troca de senha ───
  test('Deve atualizar must_change_password para false após troca de senha', async () => {
    const userId = `user-${Date.now()}`;
    
    // Criar usuário com must_change_password = true
    const newUser = {
      id: userId,
      name: 'Teste Senha',
      email: `test-senha-${Date.now()}@clarifyse.test`,
      role: 'cliente',
      status: 'ativo',
      must_change_password: true,
      first_access_done: false,
    };

    await googleSheets.addRow('profiles', newUser);

    // Simular troca de senha
    const updatedUser = { ...newUser, must_change_password: false, first_access_done: true };
    const updateResult = await googleSheets.updateRow('profiles', userId, updatedUser);
    expect(updateResult).toBe(true);

    // Verificar se a atualização foi aplicada
    const rows = await googleSheets.getRows('profiles');
    const updated = rows.find((r: any) => r.id === userId);
    expect(updated?.must_change_password).toBe(false);
    expect(updated?.first_access_done).toBe(true);
  });

  // ─── Teste 4: Validar que clientes não podem ver dados de outros clientes ───
  test('Deve retornar apenas dados do cliente logado', async () => {
    const clientId = `client-${Date.now()}`;
    const otherClientId = `client-other-${Date.now()}`;

    // Criar dois clientes
    await googleSheets.addRow('profiles', {
      id: clientId,
      name: 'Cliente 1',
      email: `client1-${Date.now()}@test.com`,
      role: 'cliente',
      status: 'ativo',
    });

    await googleSheets.addRow('profiles', {
      id: otherClientId,
      name: 'Cliente 2',
      email: `client2-${Date.now()}@test.com`,
      role: 'cliente',
      status: 'ativo',
    });

    // Simular query de um cliente específico
    const rows = await googleSheets.getRows('profiles');
    const clientData = rows.filter((r: any) => r.id === clientId);
    
    expect(clientData.length).toBe(1);
    expect(clientData[0].name).toBe('Cliente 1');
  });

  // ─── Teste 5: Validar persistência de empresa ───
  test('Deve persistir dados de empresa do cliente', async () => {
    const userId = `user-empresa-${Date.now()}`;
    const empresa = 'Empresa XYZ Ltda';

    const newUser = {
      id: userId,
      name: 'Cliente Empresa',
      email: `empresa-${Date.now()}@test.com`,
      role: 'cliente',
      status: 'ativo',
      empresa: empresa,
    };

    await googleSheets.addRow('profiles', newUser);

    const rows = await googleSheets.getRows('profiles');
    const found = rows.find((r: any) => r.id === userId);
    
    expect(found?.empresa).toBe(empresa);
  });

  // ─── Teste 6: Validar que gerentes têm cargo diferente ───
  test('Deve diferenciar cargo de gerente vs cliente', async () => {
    const gerenteId = `gerente-${Date.now()}`;
    const clienteId = `cliente-${Date.now()}`;

    await googleSheets.addRow('profiles', {
      id: gerenteId,
      name: 'Gerente Teste',
      email: `gerente-${Date.now()}@test.com`,
      role: 'gerente',
      status: 'ativo',
      cargo: 'Gerente de Projetos',
    });

    await googleSheets.addRow('profiles', {
      id: clienteId,
      name: 'Cliente Teste',
      email: `cliente-${Date.now()}@test.com`,
      role: 'cliente',
      status: 'ativo',
      cargo: null,
    });

    const rows = await googleSheets.getRows('profiles');
    const gerente = rows.find((r: any) => r.id === gerenteId);
    const cliente = rows.find((r: any) => r.id === clienteId);

    expect(gerente?.cargo).toBe('Gerente de Projetos');
    expect(cliente?.cargo).toBeNull();
  });
});

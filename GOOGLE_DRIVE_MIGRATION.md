# Migração do Supabase para Google Drive

## Visão Geral

A plataforma Clarifyse Insights foi migrada do Supabase para o Google Drive, utilizando **Google Sheets** para armazenar dados tabulares e **Google Docs** para armazenar documentos.

## Estrutura do Google Drive

### Planilha Principal: Clarifyse Insights Database
**ID:** `1z5sq21UlDFIwlxHU2PmaqAQcwvhZG_n3AGzGOgboXdQ`

A planilha contém as seguintes abas, cada uma correspondendo a uma tabela do banco de dados original:

| Aba | Descrição | Colunas |
|-----|-----------|---------|
| **profiles** | Perfis de usuários | id, name, email, role, status, empresa, cargo, first_access_done, must_change_password, created_at, updated_at |
| **projects** | Projetos | id, nome, status, cliente_empresa, gerente_id, data_inicio, data_entrega_prevista, objetivo, pilar, metodologia, observacoes_internas, deleted_at, created_at, updated_at |
| **project_access** | Acesso a projetos | id, project_id, user_id, created_at |
| **project_history** | Histórico de projetos | id, project_id, user_id, descricao, created_at |
| **system_settings** | Configurações do sistema | id, key, value, updated_at |
| **user_roles** | Papéis de usuários | id, user_id, role |
| **activity_logs** | Logs de atividades | id, user_id, action, details, created_at |
| **goals** | Metas | id, title, target_value, current_value, type, deadline, created_at |
| **notifications** | Notificações | id, user_id, title, message, read, created_at |
| **project_documents** | Documentos de projetos | id, project_id, name, type, url, created_at |
| **project_financials** | Dados financeiros | id, project_id, category, amount, date, description |
| **project_nps** | NPS de projetos | id, project_id, score, comment, created_at |
| **nps_responses** | Respostas NPS | id, project_id, score, comment, created_at |
| **panel_partners** | Parceiros | id, name, contact, status, created_at |
| **field_quotas** | Cotas de campo | id, project_id, name, target, current |

### Pasta de Documentos: Clarifyse Insights Documents
**ID:** `1OhFKPkDdJ18F5Zx1Qf4VGMI3CUPuD3OR`

Armazena todos os documentos do Google Docs criados pela plataforma.

## Implementação Técnica

### Arquivos Adicionados

1. **`src/integrations/google-drive/client.ts`**
   - Cliente para operações com Google Sheets
   - Métodos: `getRows()`, `addRow()`, `updateRow()`, `deleteRow()`, `createDocument()`

2. **`src/integrations/supabase/google-adapter.ts`**
   - Adaptador que simula a interface do Supabase
   - Redireciona chamadas para o Google Drive
   - Mantém compatibilidade com o código existente

3. **`src/integrations/supabase/db.ts`** (modificado)
   - Agora exporta o adaptador do Google Drive
   - Mantém a mesma interface do Supabase original

### Fluxo de Dados

```
Componentes React
      ↓
supabase.from('table_name')
      ↓
google-adapter.ts (simula interface Supabase)
      ↓
google-drive/client.ts (operações com Google Sheets)
      ↓
Google Sheets API
      ↓
Google Drive
```

## Configuração

As credenciais do Google Drive devem ser configuradas através de:

1. **Variáveis de Ambiente** (`.env.google`):
   ```
   VITE_GOOGLE_SPREADSHEET_ID=1z5sq21UlDFIwlxHU2PmaqAQcwvhZG_n3AGzGOgboXdQ
   VITE_GOOGLE_DOCUMENTS_FOLDER_ID=1OhFKPkDdJ18F5Zx1Qf4VGMI3CUPuD3OR
   ```

2. **Token de Acesso**:
   - Deve ser armazenado em `localStorage` como `google_access_token`
   - Obtido através de fluxo OAuth2 do Google

## Operações Suportadas

### SELECT
```typescript
// Buscar todas as linhas
const { data } = await supabase.from('profiles').select();

// Buscar com filtro
const { data } = await supabase.from('profiles').select().eq('id', userId);

// Buscar com ordenação
const { data } = await supabase.from('projects').select().order('created_at', { ascending: false });
```

### INSERT
```typescript
// Inserir uma linha
const { data } = await supabase.from('profiles').insert({
  id: '123',
  name: 'João',
  email: 'joao@example.com',
  role: 'cliente'
});

// Inserir múltiplas linhas
const { data } = await supabase.from('projects').insert([
  { id: '1', nome: 'Projeto A' },
  { id: '2', nome: 'Projeto B' }
]);
```

### UPDATE
```typescript
// Atualizar uma linha
const { data } = await supabase.from('profiles').update({
  name: 'João Silva'
}).eq('id', userId);
```

### DELETE
```typescript
// Deletar uma linha
const { data } = await supabase.from('profiles').delete().eq('id', userId);

// Deletar múltiplas linhas
const { data } = await supabase.from('projects').delete().in('id', [id1, id2]);
```

### UPSERT
```typescript
// Inserir ou atualizar
const { data } = await supabase.from('profiles').upsert({
  id: userId,
  name: 'João',
  email: 'joao@example.com'
});
```

## Limitações e Considerações

1. **Autenticação**: O token de acesso ao Google Drive deve ser obtido através de OAuth2
2. **Performance**: Operações em larga escala podem ser mais lentas que no Supabase
3. **Sincronização em Tempo Real**: Google Sheets não oferece suporte nativo a WebSockets
4. **Permissões**: O usuário deve ter permissão para acessar a planilha e pasta

## Próximos Passos

1. Implementar autenticação OAuth2 com Google
2. Adicionar cache local para melhorar performance
3. Implementar sincronização periódica
4. Adicionar tratamento de erros mais robusto
5. Criar interface de administração para gerenciar dados

## Referências

- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Drive API](https://developers.google.com/drive/api)
- [Google OAuth2](https://developers.google.com/identity/protocols/oauth2)

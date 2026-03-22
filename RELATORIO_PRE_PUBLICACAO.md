# Relatório Pré-Publicação — Clarifyse Strategy & Research

## ✅ Bugs Corrigidos

### 1. Dados da Empresa não salvavam (Configurações)
**Arquivo:** `src/components/admin/DadosEmpresaTab.tsx`  
**Problema:** O loop de `upsert` não verificava erros — falhas silenciosas não eram reportadas ao usuário.  
**Correção:** Adicionado `const { error } = await supabase...` e `if (error) throw error;` em cada iteração, propagando qualquer falha corretamente para o React Query.

### 2. Etapas padrão do cronograma ignoravam personalizações do admin
**Arquivo:** `src/components/projects/CronogramaTab.tsx`  
**Problema:** Ao clicar em "Usar etapas padrão Clarifyse", o sistema carregava uma lista hardcoded no código — ignorando qualquer personalização feita em Configurações → Etapas Padrão do Cronograma.  
**Correção:** A função `loadDefaults()` agora faz `SELECT` na tabela `schedule_steps_defaults` (ordenado por `ordem`, filtrado por `ativo = true`). Se a tabela estiver vazia, recai no fallback hardcoded. O botão exibe spinner de carregamento durante a busca.

---

## 🔧 O que funciona corretamente (nenhuma alteração necessária)

| Área | Status |
|---|---|
| Login com redirecionamento por papel (admin/gerente/cliente) | ✅ OK |
| Troca obrigatória de senha no primeiro login | ✅ OK |
| Proteção de rotas por papel (cliente não acessa admin, etc.) | ✅ OK |
| Criação de projeto | ✅ OK — erro propagado corretamente |
| Edição de projeto | ✅ OK — erro propagado corretamente |
| Salvamento de cronograma | ✅ OK — mutation com tratamento de erro |
| Dados financeiros do projeto | ✅ OK — erro propagado corretamente |
| Upload de documentos | ✅ OK — Storage + DB com tratamento de erro |
| Download de documentos via URL assinada | ✅ OK |
| Portal do cliente (RLS — cliente vê só seus projetos) | ✅ OK |
| Formulário NPS público em `/avaliacao/[token]` | ✅ OK — rota pública sem autenticação |
| Envio de convites de avaliação NPS | ✅ OK |
| Criação automática de tokens NPS ao encerrar projeto | ✅ OK (trigger no banco) |
| Notificações e sino de notificações | ✅ OK |

---

## ⚙️ Variáveis de Ambiente — Configurar nas Edge Functions do Supabase

Acesse: **Supabase Dashboard → Edge Functions → Secrets**

| Variável | Descrição | Obrigatório |
|---|---|---|
| `RESEND_API_KEY` | Chave da API do Resend para envio de e-mails (convites e NPS) | **Sim** |
| `SUPABASE_SERVICE_ROLE_KEY` | Gerado automaticamente pelo Supabase | Automático |
| `SUPABASE_URL` | URL do projeto Supabase | Automático |
| `SITE_URL` | URL pública da plataforma (ex: `https://seuapp.replit.app`) | **Sim** |

> **Nota:** `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_URL` são injetados automaticamente em Edge Functions. Apenas `RESEND_API_KEY` e `SITE_URL` precisam ser configurados manualmente.

---

## 🗄️ Migrations SQL — Executar no Supabase SQL Editor

### Antes de publicar — Reset de dados de teste
Execute o arquivo: **`migrations/reset_before_publish.sql`**

Este script:
- Remove todos os dados de teste (projetos, clientes, cronogramas, histórico, etc.)
- Mantém apenas o perfil admin
- Garante que as 11 etapas padrão do cronograma estão na tabela `schedule_steps_defaults`
- Garante que as chaves obrigatórias de `system_settings` existem

> Para remover usuários de teste do Supabase Auth, acesse **Dashboard → Authentication → Users** e delete manualmente os usuários de teste (mantendo apenas o e-mail do admin).

---

## ✅ Checklist Pós-Publicação para o Admin

Após publicar a plataforma, execute as seguintes tarefas no painel:

1. **Configurar Dados da Empresa**  
   Acesse: Admin → Configurações → Dados da Empresa  
   Preencha: nome, CNPJ, e-mail, telefone, WhatsApp, endereço, site.

2. **Definir Senha do Módulo Financeiro**  
   Acesse: Admin → Configurações → Segurança Financeira  
   Defina a senha que protege a distribuição de lucro nos projetos.

3. **Personalizar Etapas Padrão do Cronograma (opcional)**  
   Acesse: Admin → Configurações → Etapas Padrão  
   Edite, reordene ou desative etapas conforme o processo da Clarifyse.

4. **Cadastrar os Primeiros Gerentes**  
   Acesse: Admin → Clientes → Gerentes → Convidar Gerente  
   O gerente receberá e-mail de convite com link para criar senha.

5. **Cadastrar os Primeiros Clientes**  
   Acesse: Admin → Clientes → Convidar Cliente  
   O cliente receberá e-mail de convite com link para criar senha.

6. **Configurar variáveis de ambiente** (ver seção acima)  
   `RESEND_API_KEY` e `SITE_URL` nas Secrets do Supabase Edge Functions.

7. **Testar fluxo completo**  
   - Criar um projeto de teste  
   - Associar um cliente  
   - Criar cronograma com etapas padrão  
   - Verificar portal do cliente  
   - Encerrar projeto e confirmar envio do e-mail NPS

---

*Relatório gerado em: 20/03/2026*

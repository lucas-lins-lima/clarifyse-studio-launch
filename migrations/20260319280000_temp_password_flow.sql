-- Migration: Fluxo de Senha Temporária
-- Garante que a coluna must_change_password existe na tabela profiles
-- (já criada na migration inicial, mas adicionada aqui com IF NOT EXISTS para segurança)

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

-- Index para busca eficiente de usuários com senha temporária pendente
CREATE INDEX IF NOT EXISTS idx_profiles_must_change_password
  ON public.profiles(must_change_password)
  WHERE must_change_password = true;

-- Comentário de documentação
COMMENT ON COLUMN public.profiles.must_change_password IS
  'Quando true, o usuário é obrigado a trocar a senha antes de acessar qualquer rota da plataforma. Definido pelo admin ao criar senha temporária.';

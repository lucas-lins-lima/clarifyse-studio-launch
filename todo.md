# Clarifyse Studio - TODO

## Fase 1: Arquitetura e Autenticação
- [ ] Configurar estrutura de armazenamento JSON (data/users.json, data/projects.json, data/responses.json)
- [ ] Implementar sistema de autenticação com login/senha usando JSON
- [ ] Criar middleware de proteção de rotas
- [ ] Implementar logout e gerenciamento de sessão

## Fase 2: Dashboard e Métricas
- [ ] Criar dashboard administrativo com cards de resumo
- [ ] Implementar cálculo de métricas em tempo real (projetos ativos, entrevistas, taxa conclusão)
- [ ] Criar gráfico de respostas dos últimos 7 dias
- [ ] Implementar sistema de alertas automáticos
- [ ] Criar lista de projetos recentes no dashboard

## Fase 3: Gestão de Projetos (CRUD)
- [ ] Criar página de listagem de projetos com filtros
- [ ] Implementar criação de novo projeto
- [ ] Implementar edição de projeto
- [ ] Implementar duplicação de projeto
- [ ] Implementar exclusão de projeto com confirmação
- [ ] Implementar pausar/retomar projeto
- [ ] Adicionar controle de status (ativo, pausado, encerrado, rascunho)

## Fase 4: Construtor de Formulários
- [ ] Implementar interface drag-and-drop para construtor de formulários
- [ ] Adicionar tipo de pergunta: Escala Likert
- [ ] Adicionar tipo de pergunta: Múltipla Escolha
- [ ] Adicionar tipo de pergunta: Texto Curto
- [ ] Adicionar tipo de pergunta: Texto Longo
- [ ] Adicionar tipo de pergunta: NPS
- [ ] Implementar validações por pergunta
- [ ] Implementar pré-visualização do formulário

## Fase 5: Sistema de Cotas Demográficas
- [ ] Criar interface de configuração de cotas
- [ ] Implementar tipos de cota (Gênero, Faixa Etária, Texto/Categoria)
- [ ] Implementar drag-and-drop para reordenar cotas
- [ ] Implementar bloqueio automático quando cota atinge 100%
- [ ] Implementar validação de cotas antes de publicar

## Fase 6: Coleta de Respostas
- [ ] Gerar links únicos por projeto
- [ ] Criar página de coleta (respondente)
- [ ] Implementar validação de respostas em tempo real
- [ ] Implementar controle de quota por respondente
- [ ] Salvar respostas em JSON com timestamp
- [ ] Implementar detecção de velocidade anormal (fraud prevention)
- [ ] Implementar modal de confirmação antes de enviar

## Fase 7: Exportação de Dados
- [ ] Implementar exportação em CSV
- [ ] Implementar exportação em Excel
- [ ] Incluir metadados na exportação (data, respondente, tempo)
- [ ] Implementar filtros de exportação (período, status, etc)

## Fase 8: Gestão de Pesquisadores
- [ ] Criar página de gestão de pesquisadores (admin only)
- [ ] Implementar criação de pesquisador
- [ ] Implementar edição de pesquisador
- [ ] Implementar exclusão de pesquisador
- [ ] Implementar atribuição de projetos
- [ ] Implementar visualização de log de atividades

## Fase 9: Interface e Design
- [ ] Remover dados simulados do Dashboard
- [ ] Remover dados simulados da página de Projetos
- [ ] Implementar loading skeletons
- [ ] Implementar estados vazios com ilustrações geométricas
- [ ] Implementar toasts de sucesso/erro
- [ ] Garantir responsividade mobile

## Fase 10: Testes e Qualidade
- [ ] Escrever testes unitários para funções de cálculo de métricas
- [ ] Escrever testes para CRUD de projetos
- [ ] Escrever testes para validação de formulários
- [ ] Testar fluxo completo de coleta de respostas
- [ ] Testar exportação de dados

## Bugs/Issues Conhecidos
(Nenhum no momento)

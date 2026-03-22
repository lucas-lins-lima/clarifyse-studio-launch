# Mapeamento de Funcionalidades - Clarifyse Studio (Fase 1)

Este documento mapeia o que já foi implementado e o que ainda está pendente com base no documento da Fase 1 e na análise do repositório.

## 1. Identidade Visual e Design System
- [x] Paleta de Cores (Roxo profundo, Verde-teal, Roxo vibrante)
- [x] Tipografia (Playfair Display + Inter)
- [x] Estilo Geral (Flat design, sem sombras pesadas)
- [x] Componentes UI (Shadcn/UI integrados)
- [x] Logo integrada

## 2. Autenticação e Usuários
- [x] Admin padrão (`clarifysestrategyresearch@gmail.com` / `A29c26l03!`)
- [x] Redirecionamento obrigatório para troca de senha no primeiro login
- [x] CRUD de Pesquisadores (Admin only)
- [x] Ativar/Desativar/Excluir pesquisadores
- [x] Login funcional com validação de status

## 3. Dashboard
- [x] Cards de resumo (Projetos Ativos, Entrevistas, Taxa de Conclusão)
- [x] Gráfico de respostas dos últimos 7 dias (Dinâmico)
- [x] Alertas (Cotas 80-90%, Sem respostas 24h, Exclusão próxima)
- [x] Log de Atividades (Admin vê tudo, Pesquisador vê apenas o seu)
- [x] Dashboard dinâmico por perfil

## 4. Gestão de Projetos
- [x] Criar Novo Projeto (Informações básicas, Amostra, Cotas)
- [x] Lista de Projetos (Tabela, Filtros, Busca)
- [x] Duplicação de Projetos
- [x] Lixeira (Restauração em 15 dias)
- [ ] **PENDENTE**: Edição de Projetos (A rota existe no código mas não no App.tsx)
- [ ] **PENDENTE**: Visualização de Detalhes do Projeto (Dashboard interno do projeto)
- [ ] **PENDENTE**: Lógica de exclusão automática após 20 dias do encerramento

## 5. Construtor de Formulários (Builder)
- [x] Layout de 3 painéis
- [x] Drag-and-drop de perguntas
- [x] Suporte aos 8 tipos de pergunta
- [x] Publicação com validação
- [ ] **PENDENTE**: Lógica de Exibição (Skip Logic / Branching) - Interface existe no Store mas não no Builder UI
- [ ] **PENDENTE**: Validação por Regex (Interface no Store, falta no Builder UI)
- [ ] **PENDENTE**: Aleatorização de opções (Switch existe, falta lógica na execução)

## 6. Interface do Entrevistado (Coleta)
- [ ] **PENDENTE**: Página de Boas-vindas (Layout limpo, Logo, Título, Descrição, Tempo estimado)
- [ ] **PENDENTE**: Experiência de Resposta (Uma pergunta por vez, Barra de progresso, Navegação teclado)
- [ ] **PENDENTE**: Validações em tempo real (Shake animation, mensagens de erro)
- [ ] **PENDENTE**: Páginas Especiais (Quota Atingida, Amostra Completa, Agradecimento Final)
- [ ] **PENDENTE**: Controles Técnicos (Prevenção de fraude, Captura de IP hash, Cookie de sessão)

## 7. Monitoramento em Tempo Real (Dashboard do Projeto)
- [ ] **PENDENTE**: Cards de métricas específicas do projeto
- [ ] **PENDENTE**: Gráfico de linha de respostas por hora/dia
- [ ] **PENDENTE**: Progresso de Cotas com barras de progresso e badges de status
- [ ] **PENDENTE**: Controle de Coleta (Pausar/Retomar/Encerrar)

## 8. Regras de Negócio Críticas
- [ ] **PENDENTE**: Fechamento automático por quota de categoria
- [ ] **PENDENTE**: Fechamento automático por amostra total
- [ ] **PENDENTE**: Notificações automáticas (80% quota, 100% quota, etc.)

---

## Plano de Ação Imediato (Fase 3 do Manus)

1. **Implementar a Interface do Entrevistado**: Criar a rota `/r/:slug` para coleta de dados.
2. **Implementar o Dashboard Interno do Projeto**: Criar a rota `/projetos/:projectId` para monitoramento.
3. **Refinar o Builder**: Adicionar Skip Logic e Regex na UI.
4. **Implementar Lógica de Fechamento**: Garantir que as respostas respeitem as cotas.
5. **Implementar Exclusão Automática**: Script/Lógica para limpar dados após 20 dias.

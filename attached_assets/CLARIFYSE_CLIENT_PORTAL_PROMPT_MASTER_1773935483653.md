# CLARIFYSE INSIGHTS — PROMPT MASTER (v1 + v2 + v3 Consolidado)

### Para uso no Lovable — Novo Projeto do Zero

\---

## ⚙️ INSTRUÇÃO INICIAL PARA O LOVABLE

Crie do zero a plataforma web completa **"Clarifyse Insights"** — sistema de gestão e acompanhamento de projetos de pesquisa de mercado para a empresa **Clarifyse Strategy \& Research** e seus clientes.

**PRIORIDADE ABSOLUTA: PERFORMANCE.** Esta plataforma deve ser rápida, leve e sem travamentos desde o primeiro componente. Toda decisão de código deve priorizar performance. A logo da empresa está anexada — use-a conforme especificado. Todas as telas, textos, labels e mensagens devem estar 100% em **português do Brasil e não pode ter simulações e demos, a plataforma tem que ser em um ambiente real**.

\---

## 1\. IDENTIDADE VISUAL E DESIGN

### Paleta de Cores

* **Azul escuro institucional:** `#1B2B6B` — navbar, sidebar, headers
* **Roxo gradiente:** `#7B2D8B → #A855F7` — botões primários, destaques, CTA
* **Teal/ciano:** `#0D9488 / #14B8A6` — labels de seção, ícones, acentos
* **Fundo geral:** `#F0F4F8`
* **Cards e painéis:** `#FFFFFF` com sombra suave
* **Texto principal:** `#1E293B`
* **Texto secundário:** `#64748B`

### Tipografia

* **Títulos:** Playfair Display (Google Fonts)
* **Corpo:** Inter (Google Fonts)

### Logo

* A logo está **anexada neste projeto** como `logo.png`.
* Aparece no **canto superior esquerdo da navbar** em todas as telas.
* Centralizada no **card de login**.
* Referência no código: `src/assets/logo.png`

### Estilo Geral

* Clean, profissional, sofisticado.
* Cards com `border-radius: 12px` e sombras sutis.
* Ícones: **Lucide Icons** (exclusivamente).
* Cada seção tem **label em MAIÚSCULAS na cor teal** antes do título (ex: `"MONITORAMENTO DE CAMPO"`).
* **Botões primários:** gradiente roxo-azul, texto branco, border-radius arredondado.
* **Botões secundários:** borda com cor institucional, fundo transparente.
* **Loading skeletons** em todos os cards e listas enquanto dados carregam.
* **Estados vazios amigáveis** em todas as listagens.
* **Toasts** de sucesso/erro para todas as ações.
* **Confirmação antes de exclusões** (modal com digitação do nome para exclusões permanentes).

\---

## 2\. ARQUITETURA E TIPOS DE USUÁRIO

Três tipos de usuário com painéis distintos:

### ADMINISTRADOR (Clarifyse)

* E-mail: `clarifysestrategyresearch@gmail.com`
* Senha inicial: `A29c26l03!`
* **Na primeira vez que logar:** o sistema redireciona obrigatoriamente para tela de troca de senha antes de qualquer outra ação. Só após a troca o painel é liberado.
* Acesso total: todos os projetos, clientes, gerentes, financeiro completo (incluindo distribuição de lucro), KPIs, configurações, log de atividades, parceiros de painel.

### GERENTES

* Criados pelo administrador em Configurações → Gerentes.
* Login próprio (e-mail + senha criada via link enviado por e-mail).
* **Veem apenas seus próprios projetos** (criados por eles ou vinculados a eles pelo admin).
* Podem: criar/editar projetos próprios, gerenciar cronograma, campo, clientes e aba Financeiro (sem distribuição de lucro).
* **Não têm acesso a:** projetos de outros gerentes, gestão global de clientes, gestão de gerentes, configurações do sistema, financeiro global, distribuição de lucro, KPIs, log de atividades, parceiros de painel.

### CLIENTES

* Criados pelo administrador ou gerente responsável.
* Acessam **apenas os projetos vinculados ao seu e-mail**.
* Nunca enxergam projetos de outros clientes.
* Sem acesso a funções administrativas ou financeiras.
* **Não alteram a própria senha** pela plataforma — apenas o admin redefine.

\---

## 3\. TELA DE LOGIN

* Fundo: azul escuro `#1B2B6B` com gradiente sutil e padrão geométrico leve em grade.
* Logo da Clarifyse centralizada no topo do card de login.
* Card de login centralizado, sombra suave, bordas arredondadas.
* Campos: **E-mail** e **Senha**.
* Botão **"Entrar"** com gradiente roxo.
* Texto em itálico abaixo: *"Where insight becomes clarity."* na cor teal.
* Mensagens de erro claras para credenciais inválidas.
* Sem opção de cadastro público — usuários criados apenas pelo administrador.
* Após login: redireciona para o painel correto conforme tipo de usuário (admin / gerente / cliente).

\---

## 4\. PAINEL DO ADMINISTRADOR

### 4.1 Navbar / Sidebar

* Logo Clarifyse no topo da sidebar.
* Menu: **Dashboard | Projetos | Clientes | Financeiro | KPIs | Configurações**
* Indicador do usuário logado + botão logout.
* Sidebar recolhível em tablet; menu hambúrguer em mobile.

### 4.2 Dashboard do Administrador

Cards de resumo no topo:

* Total de Projetos Ativos
* Total de Clientes Cadastrados
* Total de Gerentes Cadastrados
* Projetos por Status (gráfico/badge)

**Mini-cards de metas do mês** (3 principais metas com barra de progresso) — sempre visíveis.

**Banner de alertas** (amarelo/vermelho) se houver projetos em risco — com botão "Ver Alertas".

Lista rápida dos projetos mais recentes com:

* Badge de status colorido
* **Termômetro de Saúde** (🟢/🟡/🔴) no canto superior direito de cada card
* Indicador visual de quais projetos têm campo ativo

Dados do dashboard carregam **em paralelo** (`Promise.all`) — nunca sequencialmente.

\---

## 5\. GESTÃO DE PROJETOS — ADMINISTRADOR E GERENTES

### 5.1 Criar Novo Projeto

**INFORMAÇÕES BÁSICAS (visíveis ao cliente):**

* Nome do Projeto
* Nome do Cliente / Empresa
* Objetivo do Estudo (texto livre)
* Metodologia Principal (multi-seleção): `Pesquisa Qualitativa | Pesquisa Quantitativa | Pesquisa Mista | Ciência de Dados / Analytics`
* Pilar da Clarifyse (seleção): `DISCOVER | BRAND | INNOVATE | DECIDE | EXPERIENCE | ANALYTICS`
* Status do Projeto: `Briefing | Elaboração do Instrumento | Campo | Análise dos Dados | Produção do Entregável | Entrega Final | Encerrado | Pausado`
* Data de Início do Projeto
* Data Prevista de Entrega
* Gerente Responsável (dropdown com gerentes cadastrados)

**INFORMAÇÕES INTERNAS (visível APENAS para admin e gerente responsável):**

* Observações Internas

Ao criar um projeto, ele é automaticamente vinculado ao gerente selecionado e aparece na aba Financeiro.

### 5.2 Duplicação de Projetos

Botão "Duplicar Projeto" na lista e dentro do projeto.

**O QUE É COPIADO:**

* Configuração de campo completa (meta total, tempo médio, todas as cotas com subcategorias e metas, mapeamento de colunas Google Sheets, modo de integração)
* Estrutura do cronograma (etapas e nomes, sem datas)
* Metodologia e Pilar

**O QUE NÃO É COPIADO:**

* Nome (abre com `"\[Cópia] Nome do Projeto Original"`)
* Cliente/Empresa (em branco)
* Objetivo do Estudo (em branco)
* Todas as datas (em branco)
* Status (reinicia como "Briefing")
* Gerente Responsável (em branco)
* Observações Internas (em branco)
* Dados de campo realizados (zerados)
* URL do Google Sheets (em branco)
* Datas do cronograma (estrutura mantida, datas apagadas)
* Clientes vinculados (lista zerada)
* Histórico de atualizações (começa zerado)

Após duplicar, o sistema **abre automaticamente a página de edição** do novo projeto.
Toast: *"Projeto duplicado com sucesso. As configurações de campo foram mantidas. Complete as informações do novo projeto."*

### 5.3 Configuração de Campo

**MÉTRICAS GERAIS:**

* Meta Total de Entrevistados (número)
* Tempo Médio Esperado de Entrevista (em minutos)

**COTAS DINÂMICAS** — o administrador/gerente clica em "Adicionar Cota" e escolhe o tipo:

**TIPO 1 — MAPEAMENTO NUMÉRICO** (ex: Gênero, Tipo de Usuário):

* Nome da Cota
* Para cada subcategoria: Rótulo de exibição + Valor numérico na planilha + Meta
* Exemplo: Gênero → 1=Masculino(meta:150) | 2=Feminino(meta:150) | 3=Não-Binário(meta:0)

**TIPO 2 — FAIXAS ETÁRIAS:**

* Nome da Cota
* Faixas com Rótulo + Mínimo + Máximo + Meta
* Classificação automática por valor numérico da coluna de idade
* Faixas padrão sugeridas (editáveis): 16-17 | 18-24 | 25-34 | 35-44 | 45-54 | 55-64 | 65+

**TIPO 3 — TEXTO/CATEGORIA:**

* Para colunas com texto livre (ex: "São Paulo", "Rio de Janeiro")
* Conta ocorrências exatas de cada texto

**TIPO 4 — BOOLEANA:**

* Para Sim/Não ou 1/0
* Define qual valor = Sim e qual = Não
* Meta para cada opção

Cotas reordenáveis via drag-and-drop. Cada cota editável/removível a qualquer momento. Alterações nas cotas reprocessam a contagem sem apagar dados coletados.

### 5.4 Integração com Google Sheets

**OPÇÃO A — GOOGLE SHEETS (recomendada):**

* Campo para colar o link de compartilhamento da planilha.
* Instrução na interface: *"Cole aqui o link de compartilhamento da sua planilha. Basta compartilhá-la com 'Qualquer pessoa com o link pode visualizar'."*
* Sistema converte automaticamente qualquer URL para o formato de exportação CSV:
`https://docs.google.com/spreadsheets/d/\[ID]/export?format=csv\&gid=\[GID]`
* Ao clicar em "Carregar Planilha": busca e lê a primeira linha (cabeçalho) automaticamente.
* Exibe lista de todas as colunas detectadas com nomes exatos.
* Para cada cota configurada, admin seleciona via dropdown qual coluna corresponde.
* Para "Tempo Médio de Entrevista", seleciona a coluna correspondente.
* Admin confirma qual coluna usar como referência para contar linhas válidas.
* **Sincronização automática a cada 5 minutos** (via Supabase Edge Function + pg\_cron — NUNCA no frontend).
* O frontend apenas lê o dado já sincronizado pelo servidor.
* Botão manual "Atualizar Agora" disponível para admin e cliente.
* Cada sincronização registra timestamp no histórico.
* Erro de sincronização: alerta vermelho para admin com descrição técnica. Para cliente: *"Dados sendo atualizados..."* (sem detalhes técnicos).

**OPÇÃO B — ENTRADA MANUAL:**

* Botão "Atualizar Dados de Campo" dentro do projeto.
* Formulário com: Total de entrevistados, Tempo médio, Valor realizado de cada subcategoria.
* Salva com data/hora da última atualização manual.

\---

## 6\. CRONOGRAMA DO PROJETO

### 6.1 Administrador e Gerente — Criação e Edição

Aba "Cronograma" dentro de cada projeto.

**Duas opções de início:**

1. *"Usar etapas padrão Clarifyse"* — carrega as etapas pré-definidas; admin preenche apenas as datas.
2. *"Começar do zero"* — tabela vazia.

**Etapas padrão (personalizáveis em Configurações → Etapas Padrão):**

1. Briefing e Alinhamento
2. Elaboração do Instrumento (Questionário / Roteiro)
3. Aprovação do Instrumento pelo Cliente
4. Início do Campo
5. Encerramento do Campo
6. Transcrição *(toggle para ocultar se não aplicável)*
7. Análise dos Dados
8. Produção do Entregável
9. Revisão Interna
10. Entrega ao Cliente
11. Reunião de Apresentação dos Resultados

**Interface de edição — tabela editável inline:**
Colunas por linha: Nome da Etapa | Início Previsto | Conclusão Prevista | Início Real | Conclusão Real | Status | Ações

* Status: dropdown `Concluída / Em Andamento / Pendente / Atrasada`
* Botão remover linha (ícone lixeira)
* Botão "Adicionar Etapa" no final
* Reordenação via drag-and-drop
* Botão "Salvar Cronograma"
* Botão "Exportar Excel"

**Cálculo automático de status** (fuso: `America/Sao\_Paulo`):

* Conclusão Real preenchida → "Concluída"
* Início Real preenchido + Conclusão Real vazia → "Em Andamento"
* Conclusão Prevista < hoje + Conclusão Real vazia → "Atrasada"
* Início Previsto > hoje → "Pendente"

O status manual tem **prioridade** sobre o automático. Quando sobrescrito manualmente, exibe ícone de aviso com opção de reverter para automático.

Toda alteração salva registra no histórico: *"Cronograma atualizado em DD/MM/AAAA às HH:MM (horário de Brasília)."*

### 6.2 Exportação Excel

Arquivo: `Cronograma\_\[Nome do Projeto]\_Clarifyse.xlsx`

* Linha 1: "Clarifyse Strategy \& Research" em negrito
* Linha 2: "Cronograma do Projeto: \[Nome do Projeto]"
* Linha 3: "Exportado em: DD/MM/AAAA — Confidencial"
* Linha em branco separadora
* Cabeçalhos: fundo `#1B2B6B`, texto branco, negrito
* Colunas: Etapa | Início Previsto | Conclusão Prevista | Início Real | Conclusão Real | Status
* Formatação condicional: Concluída=verde claro | Em Andamento=teal claro | Pendente=cinza claro | Atrasada=vermelho claro
* Datas no formato DD/MM/AAAA
* Última linha: *"Clarifyse Strategy \& Research | Where insight becomes clarity."*
* Primeira linha congelada

### 6.3 Cliente — Visualização do Cronograma

**Label:** "CRONOGRAMA DO PROJETO" | **Título:** "Linha do Tempo"

**Indicador "Você está aqui":**

* Etapa com status "Em Andamento" recebe borda teal esquerda + fundo destacado + badge *"● Você está aqui"* teal pulsante.
* Se nenhuma estiver "Em Andamento", o badge aponta para a primeira etapa "Pendente".
* Atualização em tempo real sem intervenção do admin.

**Indicador de progresso geral:**
Barra horizontal: *"X de Y etapas concluídas — ZZ%"* com gradiente teal → roxo.

**Dois formatos alternáveis pelo cliente:**

**FORMATO 1 — TIMELINE VERTICAL (padrão):**

* Linha vertical central com marcadores circulares
* Card por etapa: ícone representativo + nome + período previsto + datas reais (se houver) com comparativo visual (verde=no prazo, vermelho=atrasou) + badge de status

Badges:

* ✓ Concluída → verde `#16A34A`, ícone check
* ● Em Andamento → teal `#14B8A6` pulsante, ícone relógio
* ○ Pendente → cinza `#94A3B8`, ícone círculo
* ⚠ Atrasada → vermelho `#DC2626`, ícone alerta

**FORMATO 2 — TABELA:**

* Colunas: Etapa | Previsto | Realizado | Status
* Linha atual destacada com fundo teal suave

Data/hora da última atualização exibida discretamente (horário de Brasília).

Quando cronograma ainda não criado: *"O cronograma do seu projeto será disponibilizado em breve pela equipe Clarifyse."*

\---

## 7\. VINCULAÇÃO DE CLIENTES AOS PROJETOS

* Após criar o projeto, o admin acessa a aba **"Acessos"**.
* Adiciona e-mails dos clientes que terão acesso.
* Clientes adicionados recebem **e-mail automático** (via Resend) informando que têm um novo projeto disponível, com link e instrução para criar senha (caso seja o primeiro acesso).
* Admin pode remover acessos a qualquer momento.
* Um cliente pode ter acesso a múltiplos projetos — vê apenas os vinculados ao seu e-mail.
* Ao duplicar um projeto, a lista de acessos é completamente zerada.

\---

## 8\. GESTÃO DE CLIENTES — ADMINISTRADOR E GERENTES

Lista com colunas: Nome | E-mail | Empresa | Projetos Vinculados | Último Acesso | Status | Ações

Funcionalidades:

* **Criar cliente** (nome, e-mail, empresa) → sistema envia e-mail com link para criar senha via Resend.
* **Editar** dados do cliente.
* **Desativar** (acesso bloqueado sem excluir dados).
* **Excluir** (acesso bloqueado excluindo os dados — com confirmação obrigatória).
* **Ver** quais projetos o cliente tem acesso.
* **Redefinir senha** (apenas o administrador).

**⚠️ CORREÇÃO CRÍTICA:** Implementar o fluxo de criação de cliente corretamente:

1. Admin preenche nome, e-mail e empresa no formulário.
2. Sistema chama `supabase.auth.admin.inviteUserByEmail()` (API Admin do Supabase Auth) — **não** `signUp()`.
3. Cria o registro na tabela `users` com `role = 'cliente'` e `status = 'ativo'`.
4. Resend envia e-mail de boas-vindas com link para o cliente criar sua senha.
5. Toast de confirmação: *"Cliente criado com sucesso. Um e-mail foi enviado para \[email]."*

Usar a **API Admin do Supabase** (service role key no backend via Edge Function) para todas as operações de criação e redefinição de senha — nunca direto do frontend.

\---

## 9\. TERMÔMETRO DE SAÚDE DO PROJETO

Componente visual no topo da página do projeto e como badge nos cards de lista.

**Lógica automática:**

🟢 **SAUDÁVEL** (todas as condições verdadeiras):

* Nenhuma etapa com status "Atrasada"
* Data de entrega a mais de 5 dias úteis
* Se em campo: progresso ≥ 60% da meta ou dentro do prazo esperado

🟡 **ATENÇÃO** (pelo menos uma):

* 1 etapa com status "Atrasada"
* Data de entrega entre 2 e 5 dias úteis e status ≠ Entrega Final/Encerrado
* Se em campo: progresso entre 30% e 59% com menos de 30% do prazo restante

🔴 **CRÍTICO** (pelo menos uma):

* 2 ou mais etapas com status "Atrasada"
* Data de entrega passou e status ≠ Entrega Final/Encerrado
* Se em campo: progresso < 30% com menos de 20% do prazo restante

**Visual:**

* Círculo colorido pulsante + texto descritivo
* Para o cliente: *"Projeto no prazo e dentro do esperado."* / *"Projeto requer atenção — acompanhe as próximas etapas."* / *"Projeto com pendências críticas — entre em contato com o gerente."*
* Para admin/gerente: tooltip técnico detalhando qual condição ativou o status
* Na lista de projetos: coluna "Saúde"
* No dashboard: badge no canto superior direito de cada card de projeto

Recalculado sempre que o cronograma ou campo é atualizado.

\---

## 10\. ALERTAS DE PROJETOS EM RISCO

**Banner no topo do dashboard** (admin vê todos; gerente vê apenas os seus).

|Condição|Mensagem|Nível|
|-|-|-|
|Etapa "Atrasada" há mais de 3 dias|"⚠️ \[Projeto X]: etapa '\[Nome]' está atrasada há X dias."|Atenção|
|Entrega em ≤ 5 dias úteis e status ≠ Entrega Final/Encerrado|"🚨 \[Projeto X]: entrega prevista em X dias e ainda não está em fase de entrega."|Crítico|
|Campo < 50% da meta com ≤ 30% do prazo restante|"⚠️ \[Projeto X]: campo em \[XX%] da meta com pouco prazo restante."|Atenção|
|Campo < 30% com ≤ 15% do prazo restante|"🚨 \[Projeto X]: campo em ritmo crítico — apenas \[XX%] atingida."|Crítico|
|Sem atualização há 7 dias (status ≠ Encerrado/Pausado)|"💤 \[Projeto X]: nenhuma atualização nos últimos 7 dias."|Informativo|
|Margem financeira < 40%|"🚨 \[Projeto X]: margem bruta em \[XX%] — abaixo do mínimo de 40%."|Crítico|

Botão "Ver Alertas" expande lista completa com link direto para cada projeto.

**Configuração de alertas por e-mail** (em Configurações → Alertas — somente admin):

* Toggle ativar/desativar
* Frequência: Imediato | Resumo diário (08h) | Resumo semanal (segunda 08h)
* E-mail de destino editável

\---

## 11\. EDIÇÃO E EXCLUSÃO DE PROJETOS

* Todas as informações editáveis após criação.
* Alterações de status geram registro no histórico: *"Status alterado de '\[anterior]' para '\[novo]' em DD/MM/AAAA às HH:MM"*
* **Excluir projeto:** confirmação obrigatória → vai para lixeira.
* **Lixeira:** projetos restauráveis em até 15 dias.
* 3 dias antes da exclusão automática: badge de alerta vermelho *"⚠️ Será excluído em X dias"*.
* Gerenciada em **Configurações → Lixeira de Projetos**.

\---

## 12\. PAINEL DO GERENTE

### 12.1 Navbar / Sidebar do Gerente

* Logo Clarifyse no topo
* Menu: **Dashboard | Projetos | Clientes | Financeiro**
* Nome do gerente logado + botão logout
* Sem acesso a: Configurações globais, dados de outros gerentes, distribuição de lucro, KPIs, log, parceiros

### 12.2 Dashboard do Gerente

Cards de resumo (apenas seus projetos):

* Total de Projetos Ativos
* Projetos em Campo
* Projetos em Atraso
* Próximas entregas (3 projetos com entrega mais próxima)
* Lista dos projetos recentes com badge de status e Termômetro de Saúde
* Banner de alertas (apenas seus projetos)

\---

## 13\. PAINEL DO CLIENTE

### 13.1 Navbar

* Logo Clarifyse à esquerda
* Nome do cliente logado + botão logout à direita
* Sino de notificações com badge numérico
* Menu: **Meus Projetos | Sobre a Clarifyse**

### 13.2 Tela Principal — Meus Projetos

* Saudação: *"Olá, \[Nome]. Bem-vindo ao seu portal de acompanhamento."*
* **Card de boas-vindas no primeiro acesso:** exibe nome do projeto, gerente responsável e instruções iniciais. Aparece apenas uma vez.

**Grid de cards**, um por projeto vinculado. Cada card exibe:

* Nome do Projeto
* Empresa
* Pilar / Metodologia
* Status com badge visual colorido:

  * Briefing → cinza
  * Elaboração do Instrumento → azul claro
  * Campo → verde (com ponto pulsante)
  * Análise dos Dados → roxo
  * Produção do Entregável → laranja
  * Entrega Final → teal
  * Encerrado → verde escuro
  * Pausado → amarelo
* Termômetro de Saúde (badge pequeno)
* Barra de progresso do fluxo (Briefing → Instrumento → Campo → Análise → Entregável → Entrega Final)
* Data prevista de entrega
* **Badge "● Novo"** teal quando houver atualização desde o último acesso (status mudou, cronograma atualizado, documento adicionado)
* Botão "Ver Projeto"

\---

## 14\. PÁGINA DETALHADA DO PROJETO — VISÃO DO CLIENTE

### Seção 1 — Visão Geral do Projeto

Cards em grid:

* Nome do Projeto
* Objetivo do Estudo
* Metodologia (ícone + nome)
* Pilar Clarifyse
* Gerente Responsável
* Data de Início
* Data Prevista de Entrega
* **Status Atual:** badge grande + descrição amigável:

  * Briefing → *"Seu projeto está em fase de alinhamento inicial com a equipe Clarifyse."*
  * Elaboração do Instrumento → *"A equipe Clarifyse está elaborando o instrumento de pesquisa."*
  * Campo → *"Seu projeto está em fase de coleta de dados. As entrevistas estão sendo realizadas e você pode acompanhar o progresso em tempo real abaixo."*
  * Análise dos Dados → *"Os dados coletados estão sendo analisados pela equipe Clarifyse. Em breve você receberá os resultados."*
  * Produção do Entregável → *"A equipe Clarifyse está produzindo o entregável final do seu projeto."*
  * Entrega Final → *"Seu projeto foi entregue. O relatório final está disponível na seção de Documentos."*
  * Encerrado → *"Este projeto foi concluído. O histórico completo está disponível abaixo."*
  * Pausado → *"Este projeto está temporariamente pausado. Entre em contato com o gerente para mais informações."*

**Termômetro de Saúde** no topo da página.

### Seção 2 — Cronograma do Projeto

*(conforme especificado no item 6.3)*

### Seção 3 — Monitoramento de Campo

Exibida apenas se status for "Campo" ou se já houver dados de campo. Caso contrário: *"O monitoramento de campo estará disponível quando as coletas iniciarem."*

**Label:** "MONITORAMENTO DE CAMPO" | **Título:** "Acompanhamento em Tempo Real"

**Cards de Métricas Principais:**

Card 1 — Total de Entrevistados:

* Número grande (ex: "342")
* Subtítulo: "de 500 entrevistados" (meta)
* Barra de progresso teal → roxo
* Percentual: "68,4% concluído"

Card 2 — Tempo Médio de Entrevista:

* Número grande (ex: "18 min")
* Comparativo: "Esperado: 20 min"

Card 3 — Status do Campo:

* Badge "Em Andamento" (verde pulsante) / "Encerrado" / "Aguardando"

Card 4 — Última Atualização:

* Data e hora (horário de Brasília)
* Botão "Atualizar agora"

**Seção de Cotas** — para cada cota configurada:

*Mapeamento Numérico:* Título + para cada subcategoria: nome + contador (ex: "124 / 150") + barra de progresso + percentual + badge (Meta atingida / Em andamento / Abaixo do esperado) + gráfico de barras horizontais.

*Faixas Etárias:* Rótulo de cada faixa + contador + barra + badge + gráfico.

*Texto/Categoria:* Lista com barras de progresso por categoria.

*Booleana:* Dois cards lado a lado com contadores e barras.

**Nota de transparência (rodapé):** *"Os dados desta seção são atualizados periodicamente a partir das coletas em andamento. Qualquer dúvida sobre o progresso do campo, entre em contato com o gerente do seu projeto."*

### Seção 4 — Documentos do Projeto

**Label:** "DOCUMENTOS" | **Título:** "Arquivos do Projeto"

**Admin/Gerente (edição):**

* Botão "Adicionar Documento"
* Modal: Nome do documento + Descrição opcional + Upload (PDF, PPT, PPTX, XLSX, DOCX, PNG, JPG — máx. 50MB) + Toggle "Visível ao cliente" (padrão: ativado)
* Arquivo armazenado no Supabase Storage com **URL assinada com expiração** (nunca URL pública permanente)
* Lista com: ícone do tipo, nome, descrição, data, tamanho, visibilidade, ações (editar, substituir, remover, toggle)

**Cliente:**

* Exibe apenas documentos com "Visível ao cliente" ativado
* Cards: ícone do tipo + nome + descrição + data de disponibilização + botão "Baixar"
* Quando vazio: *"Os documentos do seu projeto serão disponibilizados aqui conforme o andamento das entregas."*
* Badge "Novo" no card do projeto até o cliente acessar a seção

### Seção 5 — Histórico de Atualizações

**Label:** "HISTÓRICO" | **Título:** "Atualizações do Projeto"

Feed cronológico (mais recente → mais antigo):

* Mudanças de status
* Atualizações de cronograma
* Sincronizações de campo
* Documentos adicionados

Cada item: ícone representativo + texto descritivo + data e hora (horário de Brasília).

### Seção 6 — Contato e Suporte

**Label:** "SUPORTE" | **Título:** "Fale com a Clarifyse"

* Nome do gerente responsável
* E-mail: *(valor configurável em Configurações → Dados da Empresa; padrão: clarifysestrategyresearch@gmail.com)*
* Botão WhatsApp: *(valor configurável; padrão: (11) 99310-6662)*
* Texto: *"Dúvidas sobre seu projeto? Estamos disponíveis para acompanhá-lo em todas as etapas."*

\---

## 15\. PÁGINA "SOBRE A CLARIFYSE" — PORTAL DO CLIENTE

Nova aba no menu do cliente.

### Seção 1 — Apresentação

**Label:** "QUEM SOMOS" | **Título:** "Clarifyse Strategy \& Research"

Texto: *"Transformamos dados e percepções humanas em clareza estratégica para decisões de negócio. Combinamos rigor metodológico, inteligência analítica e profundo entendimento do comportamento humano para entregar insights que realmente movem empresas."*

Slogan em destaque: *"Where insight becomes clarity."*

### Seção 2 — Os 6 Pilares

**Label:** "NOSSAS SOLUÇÕES" | **Título:** "Como podemos ajudar sua empresa"

Grid de 6 cards:

|Pilar|Ícone|Nome|Descrição|
|-|-|-|-|
|DISCOVER|Search|Consumer \& Market Understanding|Entender profundamente consumidores, contextos e mercados.|
|BRAND|Star|Brand Intelligence \& Positioning|Medir força, percepção e posicionamento de marcas.|
|INNOVATE|Lightbulb|Product, Concept \& Innovation|Criar e validar novos produtos, conceitos e ideias.|
|DECIDE|BarChart|Pricing, Portfolio \& Strategy|Apoiar decisões estratégicas de precificação e portfólio.|
|EXPERIENCE|Users|Customer \& Shopper Intelligence|Entender como clientes compram e interagem com marcas.|
|ANALYTICS|Brain|Data Science, Modeling \& AI|Análises avançadas: modelagem, previsão e IA aplicada.|

### Seção 3 — Diferenciais

**Label:** "POR QUE A CLARIFYSE" | **Título:** "Nossos Diferenciais"

Três cards:

* 💰 **Preço competitivo** — *"Mesmo rigor metodológico das grandes consultorias, com precificação acessível para empresas de médio porte."*
* 📅 **Compromisso com cronograma** — *"Cronograma detalhado compartilhado e atualizado em tempo real. Transparência total em cada etapa."*
* 🔬 **Integração metodológica** — *"Qualitativo, quantitativo, analytics e IA em uma abordagem integrada e personalizada."*

### Seção 4 — Contato

**Label:** "FALE CONOSCO" | **Título:** "Vamos conversar sobre seu próximo projeto"

E-mail e WhatsApp configuráveis + botão "Falar pelo WhatsApp".

\---

## 16\. AVALIAÇÃO NPS AO ENCERRAR PROJETO

**Disparo automático:** quando status muda para "Encerrado", o sistema aguarda 1 hora e envia e-mail (via Resend) para todos os clientes vinculados com link para avaliação.

**Formulário público** (sem necessidade de login, design com identidade Clarifyse):

* **Pergunta 1 — NPS:** Escala visual 0 a 10 → classificação automática: 0-6 Detrator | 7-8 Neutro | 9-10 Promotor
* **Pergunta 2 — Qualidade da entrega:** 1 a 5 estrelas
* **Pergunta 3 — Prazo:** "Dentro do prazo / Com pequeno atraso / Com atraso significativo"
* **Pergunta 4 — Comentário:** campo de texto livre (opcional)

Após envio: *"Obrigado pelo seu feedback! Ele é fundamental para continuarmos evoluindo. — Equipe Clarifyse"*

**Regras:**

* Link expira após 15 dias
* Cada cliente responde apenas uma vez por projeto
* Se já respondeu: *"Você já enviou sua avaliação para este projeto. Obrigado!"*

**No projeto — aba "Avaliação" (admin/gerente):**

* Status do envio: Enviado / Aguardando / Respondido
* Respostas individuais por cliente com badge NPS: Promotor (verde) / Neutro (cinza) / Detrator (vermelho)

\---

## 17\. ABA FINANCEIRO

Acessível para admin e gerentes. Conteúdo difere por tipo:

### 17.1 Painel Financeiro Global (somente administrador)

**Label:** "VISÃO GERAL" | **Título:** "Painel Financeiro"

Cards de resumo:

* Receita Total
* Custos Totais
* Lucro Bruto Acumulado
* Margem Média
* Projetos Saudáveis (margem ≥ 40%) — badge verde
* Projetos em Alerta (margem < 40%) — badge vermelho

Gráfico de barras agrupadas (Recharts): Receita Total | Custos Operacionais | Lucro Bruto por projeto.
Filtros: por período (mês/trimestre/ano), gerente, metodologia, status.

Lista de projetos com: Nome | Gerente | Metodologia | Valor Total | Custo Op. | Lucro Bruto | Margem % | Status Financeiro (✅ Saudável ≥40% | ⚠️ Atenção 35-39% | 🚨 Crítico <35%)

### 17.2 Painel Financeiro do Gerente

Mesmo layout, mas filtrando apenas seus projetos. Sem seção de Distribuição de Lucro.

### 17.3 Detalhes Financeiros do Projeto

**SEÇÃO: RECEITA DO PROJETO**

* Valor Total do Projeto (R$)
* Calculado automaticamente: Lucro Bruto = Valor Total − Custos Operacionais
* Margem Bruta (%) = Lucro Bruto / Valor Total × 100

**SEÇÃO: CUSTOS OPERACIONAIS** (todos opcionais, padrão R$ 0,00):

|Campo|Observação|
|-|-|
|Painel / Amostra|Principal custo em projetos quantitativos|
|Aluguel de Sala Espelho|Somente em pesquisas qualitativas presenciais|
|Plataforma de Survey|Licença / uso por projeto|
|Recrutamento de Participantes|Busca e seleção|
|Incentivos aos Participantes|Vouchers / honorários|
|Transcrição|R$/hora × horas de gravação|
|Elaboração do Instrumento|Questionário / roteiro|
|Análise de Dados e Entregável|Análise + produção do relatório/PPT|
|Analytics Avançado|Conjoint, MMM, Cluster, etc.|
|Dashboard Interativo|Power BI / web app|
|Relatório Técnico Adicional|Se além do PPT padrão|
|Outros Custos|Campo livre com descrição|

**Adicional de Urgência:**

* Toggle "+20%"
* Nota: *"Projetos com prazo abaixo de 10 dias úteis (quanti) ou 15 dias úteis (quali)"*

**Resumo financeiro calculado automaticamente:**

* Total de Custos Operacionais
* Lucro Bruto
* Margem Bruta (%)
* Indicador de saúde: ✅ Verde (≥50%) | 🟡 Amarelo (40-49%) | 🚨 Vermelho (<40%)
* Alerta quando <40%: *"⚠️ Este projeto está abaixo da margem mínima de 40%. As distribuições internas serão ajustadas proporcionalmente conforme a política de proteção de caixa."*

**Quem fechou o projeto:** Vendedor | Gestor Comercial | Head Comercial

### 17.4 Distribuição de Lucro (exclusiva do administrador)

Botão "Ver Distribuição de Lucro" na tela de detalhes financeiros (invisível para gerentes).

Ao clicar: modal solicitando **senha do módulo financeiro** (definida em Configurações → Segurança).

Após autenticação, exibe tabela por cenário:

**Caso 1 — Vendedor fecha:**
Vendedor 15% | Gestor Comercial 7% | Head Comercial 5% | Pesquisador Responsável 15% | Head de Marketing 5% | Head Financeiro 3% | Empresa (Reinvestimento) 30% | Founder/CEO 20% | **TOTAL 100%**

**Caso 2 — Gestor Comercial fecha:** Gestor acumula 15%+7%=22%; Head Comercial 5% normal; demais mantidos.

**Caso 3 — Head Comercial fecha:** Head acumula 15%+7%+5%=27%; Vendedor e Gestor não recebem; demais mantidos.

**Regra de proteção de caixa (margem < 40%):** exibe aviso vermelho + valores com ajuste proporcional.

**Botão "Exportar Demonstrativo (PDF/Excel)":** inclui custos, lucro, margem e tabela de distribuição. Rodapé: *"Clarifyse Strategy \& Research — Confidencial"*

### 17.5 Previsão de Receita (somente administrador)

**Label:** "PROJEÇÃO" | **Título:** "Previsão de Receita"

Modelo de pagamento: 50% adiantamento + 50% na entrega.

Cards: Próximos 30 dias | Próximos 60 dias | Próximos 90 dias | Receita já realizada (adiantamentos)

Gráfico de barras por mês (6 meses) — ao passar o mouse: lista dos projetos do mês com valores.

Tabela: Projeto | Gerente | Valor Total | Adiantamento (50%) | Saldo a Receber (50%) | Data de Entrega | Mês de Recebimento

### 17.6 Calculadora de Precificação

**Label:** "PRECIFICAÇÃO" | **Título:** "Calculadora de Projetos"

Disponível para admin e gerentes dentro da aba Financeiro.

**Passo 1 — Tipo de Projeto:**
Pesquisa Quantitativa Online | Pesquisa Qualitativa | Estudo Misto | Analytics Avançado

**Passo 2A — Quantitativa:**

|Campo|Tipo|
|-|-|
|N Amostral|Número|
|Perfil da Amostra|Público Geral / Critério Simples / Perfil Segmentado / Nicho/Difícil Acesso|
|Número de Perguntas|Número|
|Número de Cotas|1 simples / 2-3 / 4-6 / 7+ ou perfil raro|
|Formato de Entrega|PPT Padrão / PPT+Relatório / PPT+Dashboard / Todos|
|Analytics Avançado?|Toggle|
|Prazo de entrega|Dias úteis|
|Margem desejada|Slider 40-70%|

**CPR por perfil e perguntas (valores médios das faixas):**

|Perfil|Até 15 pergs|16-30 pergs|31+ pergs|
|-|-|-|-|
|Público Geral|R$ 10|R$ 15|R$ 21,50|
|Critério Simples|R$ 15|R$ 21|R$ 27|
|Perfil Segmentado|R$ 21,50|R$ 28,50|R$ 36|
|Nicho/Difícil Acesso|R$ 34|R$ 47,50|R$ 67,50|

Usuário pode ajustar CPR manualmente se tiver cotação real.

**Fatores automáticos:**

* Fator\_Cota: 1 simples=1,0 | 2-3=1,2 | 4-6=1,4 | 7+=1,6
* Fator\_Questionário: ≤15=1,0 | 16-25=1,05 | 26-40=1,10 | 41+=1,15
* Urgência +20% automático quando prazo < 10 dias úteis

**Custos internos editáveis:** Plataforma Survey R$400 | Elaboração R$1.200 | Análise+Entregável R$3.000 | Analytics Avançado R$8.000

**Passo 2B — Qualitativa:**
Sessões | Participantes/sessão | Formato (presencial/remoto) | Aluguel sala/sessão (R$2.800) | Moderação/sessão (R$1.500) | Recrutamento/participante (R$120) | Incentivo/participante (R$120) | Horas transcrição | Custo/hora transcrição (R$180) | Elaboração roteiro (R$1.500) | Análise+Entregável (R$4.500) | Formato de entrega | Prazo | Margem.

Urgência +20% automático quando prazo < 15 dias úteis.

**Passo 2C — Misto:** Combina Quali + Quanti com slider de desconto de análise integrada (10-15%).

**Resultado em tempo real:**

```
CUSTO OPERACIONAL TOTAL: R$ XX.XXX,XX
Margem Desejada: 50%
VALOR SUGERIDO AO CLIENTE: R$ XX.XXX,XX
LUCRO BRUTO ESTIMADO: R$ XX.XXX,XX
MARGEM BRUTA: XX,X% ✅/🟡/🚨
```

* Botão "Exportar Estimativa (PDF)" — arquivo: `Estimativa\_Precificacao\_\[Data].pdf`
* Botão "Criar Projeto com estes dados" — abre formulário pré-preenchido

\---

## 18\. DASHBOARD DE KPIs (somente administrador)

**Nova aba "KPIs" no menu do administrador.**

**Label:** "INTELIGÊNCIA OPERACIONAL" | **Título:** "Dashboard de KPIs"

Filtros globais: Período (30d/90d/6m/1a/personalizado) | Gerente | Pilar | Metodologia

**Bloco 1 — KPIs Comerciais:**

* Taxa de Recompra (% de clientes com mais de 1 projeto)
* Ticket Médio por Projeto (breakdown por metodologia)
* NPS Médio (gauge visual -100 a +100 + distribuição Promotores/Neutros/Detratores)
* Projetos por Pilar (donut chart — Recharts)

**Bloco 2 — KPIs de Pesquisa e Qualidade:**

* Prazo Médio de Entrega vs. Acordado (gráfico de barras por projeto)
* Taxa de Atingimento de Cotas (% médio + lista dos projetos com menor taxa)
* Projetos por Status (barras horizontais)
* Saúde Geral da Carteira (distribuição 🟢/🟡/🔴 com contagens)

**Bloco 3 — Histórico NPS:**

* Gráfico de linha (evolução mensal do NPS)
* Tabela: projeto | cliente | data | NPS | estrelas | comentário (expansível)

\---

## 19\. METAS MENSAIS / TRIMESTRAIS (somente administrador)

**Nova aba "Metas" no dashboard do administrador.**

O admin define metas por período:

* Meta de Receita (R$)
* Meta de Número de Projetos Encerrados
* Meta de Margem Média (%)
* Meta de NPS Médio (0 a 100)
* Meta de Projetos por Pilar (opcional)

**Visualização:** card com valor atual vs. meta + barra de progresso teal→roxo + percentual + trend.

**Gráfico de performance mensal:** linha da meta (tracejada) vs. linha do realizado.

**Mini-cards no topo do dashboard:** 3 principais metas do mês sempre visíveis.

**Alerta:** se faltarem 7 dias para o fim do período e atingimento < 70%, dispara notificação na Central de Notificações.

\---

## 20\. CENTRAL DE NOTIFICAÇÕES

Ícone de sino (Bell — Lucide) no navbar. Badge numérico com quantidade não lida.

Ao clicar: dropdown com lista da mais recente para a mais antiga.

**Notificações para ADMINISTRADOR:**

* 🚨 Projetos com alerta de risco
* ⭐ NPS recebido
* ⚠️ Meta em risco
* ✅ Gerente ativou conta
* 🔴 Erro de sincronização Google Sheets
* 🎯 Campo 100% atingido
* 🗑 Projeto próximo de exclusão automática

**Notificações para GERENTE** (apenas seus projetos):

* Alertas de risco, campo 100%, erro de sincronização, NPS recebido

**Notificações para CLIENTE:**

* 📋 Status do projeto alterado
* 📄 Novo documento disponível
* 🎯 Meta de entrevistados atingida
* 📝 Convite para avaliação NPS
* 📅 Cronograma atualizado

Ao clicar em uma notificação: navega diretamente para o contexto relevante.
Botão "Marcar todas como lidas". Botão "Ver todas" com paginação e filtros.
Retenção: 60 dias.

\---

## 21\. CONFIGURAÇÕES DO ADMINISTRADOR

Seção exclusiva do administrador com menu interno:

### 21.1 Perfil e Segurança

* Alterar nome de exibição
* Alterar e-mail (com confirmação por senha)
* Alterar senha
* **Senha do Módulo Financeiro:** campo obrigatório para liberar o botão "Ver Distribuição de Lucro"

### 21.2 Gerentes

**Label:** "EQUIPE" | **Título:** "Gerentes Cadastrados"

Lista: Nome | E-mail | Cargo | Projetos Ativos | Último Acesso | Status | Ações

**Cadastrar gerente:** Nome completo + E-mail + Cargo → sistema cria usuário no Supabase Auth com role 'gerente' + envia e-mail via Resend com link para criar senha.

**Ações:** Editar | Redefinir senha | Desativar | Excluir

**Ao excluir gerente:**

* Modal: *"Tem certeza? Os projetos associados permanecerão no sistema, mas ficarão sem gerente responsável. Você pode reatribuí-los depois."*
* Projetos ficam com *"— Sem gerente —"* em destaque na lista do admin para reatribuição.

### 21.3 Dados da Empresa

Campos editáveis que alimentam dinamicamente todas as telas:

* Nome da empresa (padrão: "Clarifyse Strategy \& Research")
* E-mail de suporte (padrão: clarifysestrategyresearch@gmail.com)
* Número de WhatsApp (padrão: (11) 99310-6662)
* Slogan na tela de login (padrão: "Where insight becomes clarity.")

### 21.4 Etapas Padrão do Cronograma

Lista editável das etapas padrão (renomear, reordenar via drag-and-drop, remover, adicionar).
Botão "Restaurar Padrões" → volta às 11 etapas originais.

### 21.5 Lixeira de Projetos

**Label:** "LIXEIRA" | **Título:** "Projetos Excluídos"

Lista: Nome | Cliente | Gerente | Data de Exclusão | Dias Restantes

Ações:

* **Restaurar:** devolve ao status anterior. Toast: *"Projeto restaurado com sucesso."*
* **Excluir Permanentemente:** modal com digitação do nome exato do projeto para confirmar. Irreversível.

Exclusão automática após 15 dias (job no Supabase pg\_cron).
Badge ⚠️ vermelho 3 dias antes.

### 21.6 Alertas

* Toggle ativar/desativar e-mail de alertas
* Frequência: Imediato | Diário (08h) | Semanal (segunda 08h)
* E-mail de destino editável

### 21.7 Metas

Define metas mensais/trimestrais (conforme item 19).

### 21.8 Parceiros de Painel

**Label:** "FORNECEDORES" | **Título:** "Parceiros de Painel de Amostra"

Cadastro: Nome | Site | E-mail | Telefone | Notas | Status (Ativo/Inativo)

Tabela de CPR por perfil editável:

|Perfil da Amostra|CPR Cotado (R$)|Data da Cotação|
|-|-|-|
|Público Geral (até 15 pergs)|R$ —|—/—/——|
|Público Geral (16-30 pergs)|R$ —|—/—/——|
|...|...|...|
|Nicho/Difícil Acesso (qualquer)|R$ —|—/—/——|

Badge *"⚠️ Cotação desatualizada"* quando data > 90 dias.

**Avaliação por projeto:** qualidade amostral (1-5⭐) + cumprimento de prazo (1-5⭐) + custo-benefício (1-5⭐) + comentário.

**Painel comparativo:** tabela com CPR médio de todos os parceiros por perfil lado a lado.

**Integração com Calculadora:** sugere automaticamente o parceiro com menor CPR para o perfil selecionado.

### 21.9 Log de Atividades

**Label:** "AUDITORIA" | **Título:** "Log de Atividades"

Eventos registrados: Autenticação | Projetos | Clientes | Gerentes | Campo | Financeiro | Documentos | Configurações | Acessos de clientes

Estrutura de cada entrada: Data/hora (Brasília) + Usuário (nome + tipo) + Ação + Contexto + IP de origem

Interface: lista cronológica + paginação (50/página) + filtros (usuário, categoria, período, projeto) + campo de busca + botão "Exportar Log (Excel)".
Retenção: 90 dias.

\---

## 22\. RELATÓRIOS E EXPORTAÇÕES

### 22.1 Relatório do Projeto em PDF (admin/gerente → cliente)

Conteúdo: cabeçalho com logo + nome/empresa/gerente + data/status + Visão Geral + Cronograma + Histórico (últimas 10 entradas).
Rodapé: *"Clarifyse Strategy \& Research | Where insight becomes clarity. | Confidencial"*
Arquivo: `Relatório\_\[Nome do Projeto]\_Clarifyse.pdf`

### 22.2 Exportação de Lista de Clientes (Excel — somente admin)

Colunas: Nome | E-mail | Empresa | Projetos Vinculados | Último Acesso | Status
Arquivo: `Clientes\_Clarifyse\_\[Data].xlsx`

### 22.3 Exportação de Lista de Projetos (Excel — admin e gerentes)

Colunas: Nome do Projeto | Cliente/Empresa | Gerente | Metodologia | Pilar | Status | Data Início | Data Entrega Prevista
Admin exporta todos; gerente exporta apenas os seus.
Arquivo: `Projetos\_Clarifyse\_\[Data].xlsx`

### 22.4 Exportação do Cronograma (Excel)

*(conforme item 6.2)*

### 22.5 Exportação Financeira Global (Excel — somente admin)

Aba 1: Resumo financeiro | Aba 2: Custos por categoria | Aba 3: Distribuição de lucro
Arquivo: `Financeiro\_\[Nome do Projeto]\_Clarifyse.xlsx`

Exportação global: *"Exportar todos os projetos"* com filtros por período/gerente/metodologia/status.

\---

## 23\. OTIMIZAÇÕES DE PERFORMANCE — OBRIGATÓRIO

**⚠️ TODAS AS OTIMIZAÇÕES ABAIXO SÃO OBRIGATÓRIAS DESDE A PRIMEIRA LINHA DE CÓDIGO.**

### Banco de Dados (Supabase)

* **NUNCA usar `select \*`** em listagens — sempre selecionar apenas os campos necessários.
* Substituir queries N+1 por joins e selects específicos.
* **Paginação** em todas as listagens com mais de 20 itens (projetos, clientes, histórico, log).
* **Índices obrigatórios:** `project\_id`, `user\_id`, `email`, `status`, `created\_at` em todas as tabelas relevantes.
* Row Level Security (RLS) configurado corretamente para cada tabela.

### Frontend React

* **`React.memo`** nos componentes de card (`ProjectCard`, `ClientCard`, `NotificationItem`) para evitar re-renders desnecessários.
* **`useMemo` e `useCallback`** para funções e dados derivados pesados.
* **`React.lazy` + `Suspense`** para todas as rotas/páginas — carregar apenas a página acessada.
* **Virtualização** com `react-window` quando houver mais de 50 itens em uma lista.
* **Skeleton loading** em todos os cards e listas enquanto dados carregam.
* **SWR ou React Query** para cache e revalidação eficiente de dados.
* Dados do dashboard carregam em **paralelo** (`Promise.all`).

### Sincronização Google Sheets

* O **polling de 5 minutos** roda como **Supabase Edge Function com pg\_cron** — NUNCA no frontend.
* Frontend apenas lê o dado já sincronizado — nunca faz chamada direta à planilha.
* Cache do último resultado de sincronização para evitar chamadas repetidas.

### Supabase Storage (Documentos)

* **URLs assinadas com expiração** para downloads — NUNCA URLs públicas permanentes.
* Lazy load das listagens de documentos (carregar apenas quando o usuário rolar até a seção).

### Geral

* Lazy load de imagens.
* Debounce em campos de busca.
* Evitar estados globais desnecessários — usar estado local quando possível.
* Componentes de gráfico (Recharts) carregados com lazy loading.

\---

## 24\. AUTENTICAÇÃO E SEGURANÇA

* Login com e-mail e senha (Supabase Auth).
* Senhas com hash seguro (bcrypt via Supabase).
* Sessões com expiração após 8 horas de inatividade.
* **Três roles no banco:** `'admin'`, `'gerente'`, `'cliente'`.
* **Row Level Security (RLS) no Supabase:**

  * Clientes: acesso apenas a projetos onde seu e-mail está na tabela de acessos.
  * Gerentes: acesso apenas a projetos onde são o gerente responsável.
  * Administrador: acesso irrestrito.
* Proteção de rotas no frontend: redirecionamento automático conforme role.
* Módulo de distribuição de lucro: verificação dupla — role 'admin' + senha do módulo.
* **Criação de usuários via API Admin do Supabase** (Edge Function com service role key) — nunca direto do frontend.
* Administrador redefine senha de clientes e gerentes.
* Clientes **não alteram** a própria senha pela plataforma.

\---

## 25\. RESPONSIVIDADE

* **Desktop:** layout completo com sidebar e grid de cards.
* **Tablet:** sidebar recolhível, layout adaptado.
* **Mobile:** menu hambúrguer, cards em coluna única, gráficos adaptados, tabelas com scroll horizontal.

\---

## 26\. TECNOLOGIAS

|Camada|Tecnologia|
|-|-|
|Frontend|React + Tailwind CSS + Shadcn/UI|
|Gráficos|Recharts|
|Cache e sincronização|SWR ou React Query|
|Exportação Excel|SheetJS (xlsx)|
|Exportação PDF|jsPDF + html2canvas|
|Virtualização de listas|react-window|
|Integração Google Sheets|URL de exportação CSV via Supabase Edge Function|
|Backend e autenticação|Supabase (PostgreSQL + Auth + Storage + Edge Functions + pg\_cron)|
|E-mail|Resend|
|Fuso horário|`Intl.DateTimeFormat` com `timeZone: 'America/Sao\_Paulo'` em TODO o sistema|

\---

## 27\. BANCO DE DADOS — TABELAS E MIGRAÇÕES

### Tabelas Existentes (atualizar)

**users:**

```sql
ALTER TABLE users ADD COLUMN role TEXT CHECK (role IN ('admin', 'gerente', 'cliente'));
ALTER TABLE users ADD COLUMN cargo TEXT;
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo'));
```

### Novas Tabelas

**project\_financials:**

```sql
CREATE TABLE project\_financials (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  project\_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  valor\_total DECIMAL(12,2),
  custo\_painel DECIMAL(12,2) DEFAULT 0,
  custo\_sala DECIMAL(12,2) DEFAULT 0,
  custo\_plataforma DECIMAL(12,2) DEFAULT 0,
  custo\_recrutamento DECIMAL(12,2) DEFAULT 0,
  custo\_incentivos DECIMAL(12,2) DEFAULT 0,
  custo\_transcricao DECIMAL(12,2) DEFAULT 0,
  custo\_elaboracao DECIMAL(12,2) DEFAULT 0,
  custo\_analise DECIMAL(12,2) DEFAULT 0,
  custo\_analytics\_avancado DECIMAL(12,2) DEFAULT 0,
  custo\_dashboard DECIMAL(12,2) DEFAULT 0,
  custo\_relatorio\_adicional DECIMAL(12,2) DEFAULT 0,
  custo\_outros DECIMAL(12,2) DEFAULT 0,
  custo\_outros\_descricao TEXT,
  adicional\_urgencia BOOLEAN DEFAULT false,
  quem\_fechou TEXT CHECK (quem\_fechou IN ('vendedor', 'gestor', 'head')),
  created\_at TIMESTAMPTZ DEFAULT NOW(),
  updated\_at TIMESTAMPTZ DEFAULT NOW()
);
```

**project\_documents:**

```sql
CREATE TABLE project\_documents (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  project\_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  storage\_path TEXT NOT NULL,
  tipo\_arquivo TEXT,
  tamanho\_bytes BIGINT,
  visivel\_cliente BOOLEAN DEFAULT true,
  uploaded\_by UUID REFERENCES users(id),
  created\_at TIMESTAMPTZ DEFAULT NOW()
);
```

**system\_settings:**

```sql
CREATE TABLE system\_settings (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated\_at TIMESTAMPTZ DEFAULT NOW()
);
-- Inserir valores padrão:
INSERT INTO system\_settings (key, value) VALUES
  ('nome\_empresa', 'Clarifyse Strategy \& Research'),
  ('email\_suporte', 'clarifysestrategyresearch@gmail.com'),
  ('whatsapp', '(11) 99310-6662'),
  ('slogan', 'Where insight becomes clarity.');
```

**schedule\_steps\_defaults:**

```sql
CREATE TABLE schedule\_steps\_defaults (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  nome TEXT NOT NULL,
  ordem INTEGER NOT NULL,
  ativo BOOLEAN DEFAULT true
);
```

**nps\_responses:**

```sql
CREATE TABLE nps\_responses (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  project\_id UUID REFERENCES projects(id),
  client\_id UUID REFERENCES users(id),
  token TEXT UNIQUE,
  nps\_score INTEGER CHECK (nps\_score BETWEEN 0 AND 10),
  satisfaction\_stars INTEGER CHECK (satisfaction\_stars BETWEEN 1 AND 5),
  prazo\_resposta TEXT CHECK (prazo\_resposta IN ('no\_prazo', 'pequeno\_atraso', 'atraso\_significativo')),
  comentario TEXT,
  respondido BOOLEAN DEFAULT false,
  expires\_at TIMESTAMPTZ,
  responded\_at TIMESTAMPTZ,
  created\_at TIMESTAMPTZ DEFAULT NOW()
);
```

**panel\_partners:**

```sql
CREATE TABLE panel\_partners (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  nome TEXT NOT NULL,
  site TEXT,
  email\_contato TEXT,
  telefone TEXT,
  notas TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created\_at TIMESTAMPTZ DEFAULT NOW()
);
```

**panel\_partner\_cpr:**

```sql
CREATE TABLE panel\_partner\_cpr (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  partner\_id UUID REFERENCES panel\_partners(id) ON DELETE CASCADE,
  perfil TEXT NOT NULL,
  faixa\_perguntas TEXT NOT NULL,
  cpr\_valor DECIMAL(8,2),
  data\_cotacao DATE,
  created\_at TIMESTAMPTZ DEFAULT NOW()
);
```

**panel\_partner\_reviews:**

```sql
CREATE TABLE panel\_partner\_reviews (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  partner\_id UUID REFERENCES panel\_partners(id),
  project\_id UUID REFERENCES projects(id),
  qualidade\_amostral INTEGER CHECK (qualidade\_amostral BETWEEN 1 AND 5),
  cumprimento\_prazo INTEGER CHECK (cumprimento\_prazo BETWEEN 1 AND 5),
  custo\_beneficio INTEGER CHECK (custo\_beneficio BETWEEN 1 AND 5),
  comentario TEXT,
  created\_at TIMESTAMPTZ DEFAULT NOW()
);
```

**activity\_logs:**

```sql
CREATE TABLE activity\_logs (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  user\_id UUID REFERENCES users(id),
  user\_name TEXT,
  user\_role TEXT,
  action TEXT NOT NULL,
  category TEXT NOT NULL,
  context TEXT,
  ip\_address TEXT,
  created\_at TIMESTAMPTZ DEFAULT NOW()
);
```

**notifications:**

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  user\_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('info', 'warning', 'success', 'error')),
  link TEXT,
  read BOOLEAN DEFAULT false,
  created\_at TIMESTAMPTZ DEFAULT NOW()
);
```

**goals:**

```sql
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),
  periodo\_tipo TEXT CHECK (periodo\_tipo IN ('mensal', 'trimestral')),
  periodo\_referencia TEXT NOT NULL,
  meta\_receita DECIMAL(12,2),
  meta\_projetos\_encerrados INTEGER,
  meta\_margem\_media DECIMAL(5,2),
  meta\_nps\_medio DECIMAL(5,2),
  created\_at TIMESTAMPTZ DEFAULT NOW(),
  updated\_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policies

* **project\_financials:** admin vê tudo; gerente vê apenas projetos seus; cliente sem acesso.
* **project\_documents:** admin e gerente responsável gerenciam; cliente lê apenas documentos com `visivel\_cliente = true` dos seus projetos.
* **system\_settings:** apenas admin lê e escreve.
* **nps\_responses:** admin e gerente responsável leem/escrevem; cliente lê apenas os seus via token público (sem autenticação).
* **panel\_partners e cpr:** apenas admin lê e escreve.
* **activity\_logs:** apenas admin lê; sistema escreve (via service role).
* **notifications:** cada usuário lê apenas as suas; sistema escreve (via service role).
* **goals:** apenas admin lê e escreve.

\---

## 28\. FLUXO COMPLETO DE USO

1. Admin loga com credenciais provisórias → troca obrigatória de senha → acessa painel.
2. Admin cadastra gerentes em Configurações → Gerentes (e-mail de boas-vindas enviado automaticamente).
3. Gerentes criam senha via link e acessam a plataforma com seu painel próprio.
4. Admin/Gerente cria projeto:

   * Preenche informações básicas e vincula ao gerente responsável.
   * Configura cotas de campo (4 tipos).
   * Cola URL do Google Sheets → plataforma detecta colunas → mapeia cada coluna.
   * Monta cronograma (etapas padrão ou do zero).
   * Adiciona e-mails dos clientes com acesso.
   * Preenche dados financeiros na aba Financeiro.
5. Clientes recebem e-mail de convite → criam senha → acessam portal.
6. Cliente acompanha: status com descrição amigável, cronograma visual ("Você está aqui"), métricas de campo em tempo real, histórico, documentos, Central de Notificações.
7. Admin/Gerente atualiza conforme projeto avança. Dados de campo sincronizam a cada 5 minutos via Google Sheets (Edge Function).
8. Ao encerrar: status "Encerrado" → e-mail NPS enviado após 1 hora → respostas disponíveis na aba "Avaliação" do projeto.
9. Admin monitora KPIs, alertas, metas, previsão de receita e distribuição de lucro (com senha do módulo).
10. Projetos excluídos vão para lixeira → restauráveis em até 15 dias → excluídos automaticamente.

\---

*Clarifyse Strategy \& Research | Documento Interno | Confidencial
Where insight becomes clarity.*


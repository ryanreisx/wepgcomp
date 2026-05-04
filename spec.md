# spec.md — Especificação de Requisitos do WEPGCOMP

## Visão Geral

O WEPGCOMP é um sistema web para divulgação, organização e gerenciamento do WEPGCOMP (workshops) de Estudantes de Pós-Graduação em Computação da UFBA. O sistema permite a gestão de eventos acadêmicos, incluindo o cadastro de participantes, avaliação de apresentações, emissão de certificados, e organização de sessões.

---

## Papéis de Usuário

O sistema possui os seguintes papéis, que podem ser acumulados simultaneamente por um mesmo usuário:

- **Doutorando / Apresentador**: aluno da Pós-Graduação em Computação que submete e apresenta trabalhos. Pode também ser Administrador.
- **Professor / Avaliador**: professor da Pós-Graduação em Computação que avalia apresentações. Pode também ser Administrador, Super Administrador ou Coordenador.
- **Ouvinte**: participante externo que assiste às sessões. Pode também ser Administrador.
- **Administrador**: integrante da comissão organizadora de uma edição do evento. Qualquer tipo de usuário pode receber esse papel.
- **Super Administrador**: administrador com privilégios permanentes, independentes do ciclo de vida de uma edição. Restrito a professores.
- **Coordenador**: responsável por uma edição específica do evento. Cargo único por edição. Restrito a professores.

---

## 1. Autenticação e Cadastro de Usuários

### 1.1. Cadastro de Usuários UFBA (Professores e Doutorandos)

**História de Usuário**: Como professor ou doutorando do PGCOMP, quero me cadastrar usando meu e-mail UFBA, minha matrícula e criar uma senha forte para acessar o sistema de forma segura.

**Dados obrigatórios**:
- Nome completo
- Matrícula UFBA
- E-mail UFBA
- Senha

**Critérios de aceite**:
- CA-1.1.1: O sistema valida que o e-mail informado pertence ao domínio UFBA.
- CA-1.1.2: Inserir a sua matricula UFBA.
- CA-1.1.3: A senha deve conter no mínimo 8 caracteres, incluindo pelo menos 1 letra maiúscula, 1 letra minúscula, 4 números e 1 caractere especial.
- CA-1.1.4: Ao receber uma solicitação de cadastro, o sistema envia um e-mail de confirmação com um link válido.
- CA-1.1.5: O cadastro é completado somente após a confirmação do e-mail.
- CA-1.1.6: O login do professor só é liberado após aprovação da solicitação de cadastro por um administrador do sistema.
- CA-1.1.7: O login do doutorando é liberado imediatamente após a confirmação do e-mail.

**Casos de erro**:
- E-mail fora do domínio UFBA → rejeitar cadastro com mensagem explicativa.
- E-mail já cadastrado → informar que o e-mail já está em uso.
- Senha não atende aos critérios → exibir requisitos de senha.
- Link de confirmação expirado → permitir reenvio.

### 1.2. Cadastro de Usuários Ouvintes

**História de Usuário**: Como ouvinte, quero me cadastrar utilizando um e-mail válido para utilizar funcionalidades do sistema exclusivas para usuários logados.

**Dados obrigatórios**:
- Nome completo
- E-mail válido
- Senha

**Dados opcionais**:
- Matrícula

**Critérios de aceite**:
- CA-1.2.1: O sistema aceita qualquer e-mail válido (não restrito ao domínio UFBA).
- CA-1.2.2: A senha deve conter no mínimo 8 caracteres, incluindo pelo menos 1 letra maiúscula, 1 letra minúscula, 4 números e 1 caractere especial.
- CA-1.2.3: O sistema envia um e-mail de confirmação com um link válido.
- CA-1.2.4: O cadastro é completado após a confirmação do e-mail.

**Casos de erro**:
- E-mail inválido → rejeitar com mensagem.
- E-mail já cadastrado → informar que o e-mail já está em uso.

### 1.3. Aprovação de Cadastro de Professores

**História de Usuário**: Como usuário administrador, quero avaliar novos pedidos de cadastro de professores, decidindo se aprová-los ou não, para impedir que pessoas que não são professores se cadastrem como professores.

**Critérios de aceite**:
- CA-1.3.1: Apenas administradores têm acesso ao painel de pedidos de cadastro pendentes de aprovação/rejeição.
- CA-1.3.2: O acesso (login) de um professor cadastrado só é liberado se seu pedido for aprovado.
- CA-1.3.3 *[NÃO-ESSENCIAL]*: Apenas administradores têm acesso a um painel com pedidos de cadastro reprovados.
- CA-1.3.4 *[NÃO-ESSENCIAL]*: No painel de reprovados, o administrador pode alterar o status para aprovado.
- CA-1.3.5 *[NÃO-ESSENCIAL]*: Ao rejeitar um cadastro, o e-mail é bloqueado para nova tentativa de cadastro como professor por 7 dias.
- CA-1.3.6 *[NÃO-ESSENCIAL]*: 7 dias após uma rejeição não revertida, todos os registros do cadastro e sua reprovação são deletados do banco de dados.

**Casos de erro**:
- Tentativa de aprovação por usuário não-administrador → negar acesso.
- Cadastro rejeitado e dentro do período de bloqueio → impedir novo cadastro com mensagem informativa.

### 1.4. Remoção de Cadastro Incorreto

**História de Usuário**: Como administrador, quero poder remover um usuário que identifiquei que foi cadastrado incorretamente para impedir inconsistências no sistema.

**Critérios de aceite**:
- CA-1.4.1: Apenas administradores podem remover usuários.
- CA-1.4.2: A remoção desassocia o usuário de quaisquer apresentações, avaliações ou sessões vinculadas.

---

## 2. Gestão de Papéis e Permissões

### 2.1. Atribuição de Administrador

**História de Usuário**: Como administrador, quero poder dar privilégios de administrador a qualquer outro usuário escolhido para que este possa colaborativamente participar da organização do evento.

**Critérios de aceite**:
- CA-2.1.1: O primeiro professor cadastrado no sistema é automaticamente atribuído como Administrador. Este primeiro professor não passa pelo fluxo de aprovação por administrador (CA-1.1.6 não se aplica): ao confirmar o e-mail, é criado com `isActive = true`, `isVerified = true` e `level = SuperAdmin`. Esse comportamento é necessário para inicializar o sistema, já que não há nenhum administrador prévio para aprová-lo.
- CA-2.1.2: Novos Administradores só podem ser adicionados por Administradores existentes.
- CA-2.1.3: O Administrador pode selecionar um usuário de uma listagem completa exibida pelo sistema.

### 2.2. Atribuição de Super Administrador

**História de Usuário**: Como Super Administrador, quero poder dar privilégios de Administrador a qualquer usuário do tipo Professor para que este possa administrar o sistema de forma duradoura, independente do cronograma dos eventos e colaborativamente participar da organização do evento e criação de novos eventos.

**Critérios de aceite**:
- CA-2.2.1: O primeiro professor cadastrado no sistema é automaticamente atribuído como Super Administrador (ver CA-2.1.1 para detalhes do bypass de aprovação).
- CA-2.2.2: Novos Super Administradores só podem ser adicionados por Super Administradores existentes.
- CA-2.2.3: O Super Administrador pode selecionar um professor de uma listagem completa.
- CA-2.2.4: Ao ser atribuído como coordenador de uma edição, o usuário se torna automaticamente Super Administrador.

### 2.3. Atribuição de Coordenador

**História de Usuário**: Como administrador, quero poder atribuir o cargo de Coordenador de uma edição do evento para um usuário, para que este receba comunicações específicas e cumpra funções de coordenador.

**Critérios de aceite**:
- CA-2.3.1: O cargo de coordenador é único: apenas um usuário é coordenador de uma edição em um dado instante.
- CA-2.3.2: Ao atribuir um novo coordenador, o anterior perde o cargo automaticamente.
- CA-2.3.3: Qualquer super administrador pode atribuir como coordenador de uma edição do evento um usuário existente ao selecioná-lo de uma listagem completa um usuário do tipo Professor.
- CA-2.3.4: O coordenador é automaticamente Administrador da edição que coordena. Esse cargo de "Admin da edição" é efêmero: expira automaticamente quando a edição termina (`endDate` passou) ou é desativada (`isActive = false`). Nestes casos, o usuário deixa de ser admin **daquela edição**, mas mantém seu `level = SuperAdmin` permanente (ver CA-2.2.4 e Casos de borda abaixo).

**Casos de borda**:
- O coordenador já é Super Administrador → manter ambos os papéis sem duplicação.
- O coordenador é removido do cargo (ou edição termina/desativada) → perde o papel de coordenador da edição mas **mantém permanentemente o `level = SuperAdmin`** atribuído por CA-2.2.4. Essa retenção é intencional: uma vez SuperAdmin, sempre SuperAdmin (até que outro SuperAdmin reverta manualmente o nível).

---

## 3. Gestão de Edições do Evento

### 3.1. Criação de Nova Edição

**História de Usuário**: Como usuário administrador, quero poder criar novas edições do evento utilizando os mesmos cadastros de usuários e funcionalidades do sistema das edições anteriores, para segregar a organização de edições distintas do WEPGCOMP (que acontece uma vez por ano).

**Dados obrigatórios**:
- Nome: WEPGCOMP [ano]
- Local do evento
- Datas e horários de início e fim, para cada dia de evento
- Salas (com título para cada sala, caso haja múltiplas)
- Configuração de votação: se exclusiva para usuários logados
- Data e horário limite de submissão de apresentações (não pode ser posterior à data de início)
- Descrição do evento ("Sobre o WEPGCOMP [ano]")
- Texto da Chamada para Submissão de Trabalhos
- Tempo alocado por apresentação (ex: 20 minutos)
- Quantidade de apresentações por sessão
- Comissão organizadora: cada membro é um usuário do sistema associado a cargo (Coordenador ou Comissão Organizadora) e função (lista fechada: "Comissão organizadora", "Estudantes voluntários", "Apoio administrativo", "Comunicação", "Apoio à TI")

**Dados opcionais**:
- Cadastro de apoiadores com nome e logomarca *[NÃO-ESSENCIAL]*

**Critérios de aceite**:
- CA-3.1.1: Ao ser criada, uma nova edição está associada a zero avaliações, apresentações e premiações.
- CA-3.1.2: A data limite de submissão não pode ser posterior à data de início do evento.
- CA-3.1.3: Usuários cadastrados em edições anteriores não precisam refazer cadastro.
- CA-3.1.4 *[NÃO-ESSENCIAL]*: O sistema permite apenas uma edição ativa por vez. Ao criar uma nova, as anteriores são marcadas como inativas e não editáveis.
- CA-3.1.5 *[NÃO-ESSENCIAL]*: O site de uma edição só possui ligação para edições anteriores em uma página específica, com link no rodapé.

### 3.2. Edição de Parâmetros da Edição Ativa

**História de Usuário**: Como usuário administrador, quero poder editar os parâmetros da edição ativa do evento para fazer adaptações de última hora.

**Critérios de aceite**:
- CA-3.2.1: O administrador pode editar todos os parâmetros de um evento ativo, exceto pelas restrições abaixo.
- CA-3.2.2: A data limite de submissão não pode ser atribuída como posterior à data de início do evento.
- CA-3.2.3: Ao alterar o tempo alocado por apresentação ou a quantidade de apresentações por sessão, o sistema avisa ao administrador que todas as apresentações programadas ficarão sem horário atribuído e precisarão ser reatribuídas.
- CA-3.2.4 *[NÃO-ESSENCIAL]*: O local do evento não pode ser editado após a data de início.
- CA-3.2.5 *[NÃO-ESSENCIAL]*: A data de início não pode ser editada após a primeira votação em uma apresentação.

**Casos de borda**:
- Alteração de tempo por apresentação com sessões já montadas → desassociar apresentações e notificar administrador.
- Alteração de salas com sessões já criadas nessas salas → validar conflitos.

---

## 4. Apresentações

### 4.1. Cadastro de Apresentação

**História de Usuário**: Como doutorando apresentador do WEPGCOMP, quero cadastrar a minha apresentação e escolher sugestão de data e horário disponíveis para que ela seja indexada no sistema e posteriormente avaliada.

**Dados obrigatórios**:
- Nome da apresentação
- Telefone (celular) do doutorando
- Resumo (abstract)
- PDF com slides
- Foto do doutorando
- Orientador
- Data e horário dentre as opções disponíveis

**Dados opcionais**:
- LinkedIn do doutorando
- Co-autores

**Critérios de aceite**:
- CA-4.1.1: Antes da escolha de horário, o sistema exibe aviso de que a escolha de data e horário não é garantida e pode ser alterada pela comissão.
- CA-4.1.2: O sistema armazena os dados e associa o doutorando ao slot de horário, exibindo título, tópico, professor orientador, etc.
- CA-4.1.3 *[NÃO-ESSENCIAL]*: O sistema bloqueia o slot de horário escolhido após a reserva, desde que haja disponibilidade.
- CA-4.1.4 *[NÃO-ESSENCIAL]*: Uma notificação por e-mail é enviada caso a comissão altere o horário posteriormente.

**Casos de erro**:
- Submissão após a data limite → rejeitar com mensagem indicando a data limite.
- Slot de horário já ocupado → informar indisponibilidade (se bloqueio estiver ativo).

### 4.2. Disponibilização de Conteúdo

**História de Usuário**: Como doutorando apresentador, quero disponibilizar o conteúdo da minha apresentação para que outros participantes possam acessá-lo.

**Critérios de aceite**:
- CA-4.2.1: O doutorando pode fazer upload de um único arquivo PDF em sua área de cadastro de apresentação.
- CA-4.2.2: O tamanho máximo de cada arquivo de submissão (PDF, slide ou foto) é de 10MB. Não há limite acumulado por usuário.
- CA-4.2.3: O arquivo pode ser acessado livremente na página da apresentação à qual está associado.
- CA-4.2.4: O acesso ao conteúdo é feito de forma rápida ao clicar na apresentação.

### 4.3. Alteração de Apresentações pelo Administrador

**História de Usuário**: Como administrador, quero alterar as datas, horários e qualquer outra informação das apresentações previamente cadastradas para organizar o evento e realizar correções.

**Critérios de aceite**:
- CA-4.3.1: O administrador pode fazer qualquer alteração nas apresentações.
- CA-4.3.2: O administrador pode adicionar qualquer apresentação a uma sessão de apresentações.
- CA-4.3.3: Ao adicionar uma apresentação a uma sessão, ela é removida da sessão anterior (se houver).
- CA-4.3.4: O sistema valida a apresentação e altera o cronograma oficial.
- CA-4.3.5 *[NÃO-ESSENCIAL]*: O usuário é notificado se sua apresentação mudou de horário.

---

## 5. Sessões e Programação do Evento

### 5.1. Cadastro e Exclusão de Sessões

**História de Usuário**: Como administrador, quero criar novas sessões (de apresentações ou gerais) para organizar o evento de forma colaborativa.

**Tipos de sessão**:

**Sessão geral do evento**:
- Título (obrigatório)
- Nome do palestrante (opcional)
- Sala (opcional)
- Data e horário de início (obrigatório)
- Tamanho arbitrário

**Sessão de apresentações**:
- Apresentações (opcional — pode ser preenchido depois)
- Sala (obrigatório)
- Data e horário de início (obrigatório)
- Avaliadores (opcional — pode ser preenchido depois)
- Tamanho múltiplo do tempo alocado por apresentação para o evento ativo

**Critérios de aceite**:
- CA-5.1.1: O administrador pode excluir uma sessão, desassociando todas as apresentações previamente associadas.
- CA-5.1.2: Uma sessão sem sala especificada bloqueia todas as salas durante sua duração.
- CA-5.1.3: O administrador pode atribuir avaliadores à sessão.
- CA-5.1.4: O sistema valida a sessão antes de incluí-la no cronograma, verificando: se o horário está dentro do período do evento, se os dados são válidos, e se não há sobreposição com outra sessão na mesma sala.
- CA-5.1.5: A última sessão do último dia do evento é automaticamente atribuída para o anúncio das premiações.
- CA-5.1.6 *[NÃO-ESSENCIAL]*: No momento da criação de uma edição do evento, o sistema automaticamente cria sessões consecutivas com a duração padrão especificada no cadastro do evento, preenchendo todas as lacunas existentes.
- CA-5.1.7: O administrador pode adicionar à sessão de apresentações qualquer apresentação.
- CA-5.1.8: A apresentação adicionada é removida da sessão à qual estava associada caso já estivesse associada a alguma.
- CA-5.1.9 *[NÃO-ESSENCIAL]*: O usuário é notificado se sua apresentação mudou de horário.
- CA-5.1.10: A sessão de apresentações terá tamanho múltiplo do tempo alocado por apresentação para o evento ativo no momento.
- CA-5.1.11: A última sessão do último dia do evento é automaticamente atribuída para o anúncio das premiações.

**Casos de borda**:
- Sessão geral sem sala → bloqueia todas as salas no período (ex: abertura do evento).
- Exclusão de sessão com apresentações vinculadas → apresentações ficam sem sessão, não são deletadas.
- Sobreposição parcial de horários em salas diferentes → permitido.
- Sobreposição na mesma sala → rejeitado.

### 5.2. Gestão Dinâmica da Programação

**História de Usuário**: Como administrador, quero poder reorganizar a ordem e horários das apresentações seguintes dinamicamente caso algum doutorando falte, para que o evento prossiga sem atrasos.

**Critérios de aceite**:
- CA-5.2.1 *[NÃO-ESSENCIAL]*: O sistema oferece aos administradores uma interface dinâmica para reorganizar apresentações através do cronograma.

---

## 6. Votação e Avaliação

### 6.1. Votação nas Apresentações

**História de Usuário**: Como professor avaliador ou como ouvinte, quero votar nas apresentações para facilitar a coleta de notas durante o evento.

**Critérios de aceite**:
- CA-6.1.1: O sistema permite acessar uma página para votação na apresentação.
- CA-6.1.2: O sistema registra as notas associadas ao usuário e à apresentação.
- CA-6.1.3 *[NÃO-ESSENCIAL]*: O sistema gera um QR code exclusivo para votar em cada apresentação. O QR code redireciona para a página de votação.
- CA-6.1.4 *[NÃO-ESSENCIAL]*: O administrador pode ligar e desligar uma restrição que exige login para votar (painel exclusivo para administradores).
- CA-6.1.5 *[NÃO-ESSENCIAL]*: Quando a restrição de login está ligada, o sistema não conta as notas de usuários não-logados ao calcular premiações.
- CA-6.1.6 *[NÃO-ESSENCIAL]*: Quando a restrição está ligada, o sistema não permite que usuários não-logados votem.

**Casos de erro**:
- Votação fora do período do evento → rejeitar com mensagem.
- Usuário não-logado tenta votar com restrição ativa → redirecionar para login.
- Voto duplicado do mesmo usuário na mesma apresentação → impedir ou atualizar voto existente.

---

## 7. Premiação

### 7.1. Premiação de Apresentações

**História de Usuário**: Como administrador, quero listar os doutorandos com base nas notas das apresentações, separadamente pela Escolha dos Avaliadores e Escolha do Público.

**Critérios de aceite**:
- CA-7.1.1: O sistema calcula, para cada apresentação, a nota final como **média aritmética simples** entre (a) a média dos scores de cada avaliação registrada e (b) a quantidade de avaliações registradas. Fórmula: `nota_final = (média_dos_scores + qtd_avaliações) / 2`. Apresentações sem nenhuma avaliação têm nota final = 0.
- CA-7.1.2: O sistema apresenta uma lista das 3 apresentações com maiores notas (Escolha do Público).
- CA-7.1.3: O sistema repete o processo considerando somente as notas dos avaliadores (Escolha dos Avaliadores).
- CA-7.1.4: O sistema informa no certificado de participação que o doutorando foi premiado e a colocação alcançada, caso ele seja premiado.
- CA-7.1.5 *[NÃO-ESSENCIAL]*: O sistema exibe um sinal visual na página da apresentação premiada.

### 7.2. Premiação de Avaliadores

**História de Usuário**: Como administrador, quero listar os avaliadores e selecionar subjetivamente 3 avaliadores de melhor desempenho qualitativo para reconhecê-los e premiá-los.

**Critérios de aceite**:
- CA-7.2.1: O administrador pode acessar uma lista de avaliadores participantes.
- CA-7.2.2: O sistema permite que o administrador selecione manualmente até 3 avaliadores.
- CA-7.2.3: Nos certificados dos avaliadores premiados, é mencionado que foram premiados como melhores avaliadores.

---

## 8. Certificados

### 8.1. Emissão de Certificados

**História de Usuário**: Como professor ou doutorando, quero receber um certificado de participação.

**Critérios de aceite**:
- CA-8.1.1: O sistema envia o certificado no fim do último dia do evento.
- CA-8.1.2: O sistema gera um certificado em PDF para todos os professores e doutorandos que participaram da edição.
- CA-8.1.3: O PDF do certificado contém: nomes e assinaturas do(a) diretor(a) do IC, Coordenador(a) do PGCOMP e Coordenador(a) do WEPGCOMP.
- CA-8.1.4: Texto especificando a natureza da participação, contendo: nome completo do usuário; título do trabalho (se doutorando); mesas avaliadoras que participou (se professor); nome da edição e data do evento; reconhecimentos e premiações (se aplicável).
- CA-8.1.5: O texto indica separadamente Escolha do Público e Escolha dos Avaliadores, caso o doutorando tenha sido premiado duplamente.
- CA-8.1.6: Cabeçalho com nome da universidade, instituto e programa de pós-graduação.
- CA-8.1.7: Logomarca da universidade e logomarca do instituto.
- CA-8.1.8: Data de emissão do certificado.
- CA-8.1.9 *[NÃO-ESSENCIAL]*: O PDF do certificado não é editável.

---

## 9. Página Pública

### 9.1. Página Inicial

A página inicial do WEPGCOMP contém os seguintes painéis:

**Painel principal**:
- Nome: WEPGCOMP [ano]
- Descrição curta do evento
- Data de início e encerramento
- Contagem regressiva para o início do evento (some quando inicia) *[NÃO-ESSENCIAL]*
- Texto curto de agradecimento após o fim do evento *[NÃO-ESSENCIAL]*

**Painel "Programação do evento"**:
- Listagem de apresentações em ordem cronológica, agrupadas por sessão, exibindo: título da apresentação, nome do participante, orientador, horário de apresentação.
- Intervalos: nome do intervalo
- Palestras: título e nome do palestrante

**Painel "Orientações"**:
- Breve texto sobre submissões
- Datas importantes
- Botão para orientações completas

**Painel "Equipe"**:
- Listagem de membros da comissão organizadora por função: Apoio à TI, Comunicação, Apoio administrativo

**Painel "Contato"**:
- Formulário de contato com campos Nome, E-mail e Mensagem.
- CA-9.1.C.1: Ao submeter, o sistema publica uma mensagem na fila RabbitMQ `email-send` para envio assíncrono ao coordenador da edição ativa.
- CA-9.1.C.2: O e-mail destino é o do coordenador (CommitteeMember com `level = Coordinator`) da edição com `isActive = true`. Se não houver edição ativa ou coordenador atribuído, retornar 503 com mensagem "Formulário indisponível no momento".
- CA-9.1.C.3: O endpoint `POST /api/v1/contact` é público (não exige autenticação).

**Painel "Local do evento"**:
- Endereço do evento
- Mapa mostrando o local *[NÃO-ESSENCIAL]*

**Painel "Realização e Apoio"**:
- Logo do IC-UFBA
- Logos de instituições patrocinadoras e apoiadoras

**Links**:
- Sobre o WEPGCOMP
- Orientações detalhadas
- Login
- Site do IC-UFBA

### 9.2. Página de Detalhes de uma Apresentação

**História de Usuário**: Como usuário (logado ou não), quero ver os detalhes de uma apresentação ao selecioná-la na grade horária da página inicial para decidir se vou assisti-la ou para acessar seu material.

**Critérios de aceite**:
- CA-9.2.1: As informações são exibidas em uma aba sobreposta à página inicial (overlay).

---

## 10. Requisitos Não Funcionais

- **RNF-01 — Segurança**: O sistema deve possuir autenticação segura para garantir a integridade dos cadastros.
- **RNF-02 — Usabilidade**: O sistema deve fornecer uma interface intuitiva para facilitar o uso por diferentes perfis de usuários.
- **RNF-03 — Disponibilidade**: O sistema deve estar disponível durante todo o período do evento.
- **RNF-04 — Multi-edição**: O sistema deve suportar a hospedagem de múltiplas edições do evento.
- **RNF-05 — Persistência**: O sistema deve garantir o armazenamento de dados para reaproveitá-los em edições futuras.
- **RNF-06 — Desempenho**: O sistema deve suportar os acessos simultâneos durante o período do evento.
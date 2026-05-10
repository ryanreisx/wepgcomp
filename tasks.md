# tasks.md — Plano de Tarefas do WEPGCOMP

> **Regras de execução para o agente:**
>
> 1. Cada task = uma sessão = um commit. Não misture tasks.
> 2. Antes de iniciar qualquer task, leia: spec.md, design.md e CLAUDE.md.
> 3. Não crie arquivos, módulos, dependências ou endpoints que não estejam descritos na task ou no design.md. Se faltar informação, **pergunte** — nunca assuma.
> 4. Siga TDD: escreva o teste antes da implementação. Teste deve falhar (red), depois passe (green), depois refatore.
> 5. Cada task lista exatamente quais arquivos criar/modificar. Não toque em outros arquivos.
> 6. As tasks estão ordenadas por dependência. Execute na ordem. Não pule.
> 7. Tasks de frontend (Fase 3) só começam depois que TODA a Fase 2 (backend) estiver concluída.
> 8. Para tasks de frontend, consulte o Figma via MCP (`get_design_context` com o nodeId indicado) antes de escrever código. Converta o output de Tailwind para Bootstrap 5 + CSS modules.
> 9. **Itens da Fase 5 (NÃO-ESSENCIAL) não devem ser implementados.** Se identificar dependência num item da Fase 5, pare e pergunte ao desenvolvedor.
> 10. **Ao identificar qualquer melhoria, refactor ou ajuste fora do escopo da task, pergunte ao desenvolvedor antes de fazer.** Não decida sozinho.

---

## Sumário das Fases

| Fase | Escopo | Tasks |
|---|---|---|
| **Fase 1** — Infraestrutura | Monorepo, Docker, NestJS, Prisma schema, Next.js, CI | T-1.1 a T-1.6 |
| **Fase 2** — Backend completo | Todos os módulos, endpoints, testes, seed | T-2.1 a T-2.22 (inclui T-2.5b e T-2.20b) |
| **Fase 3** — Frontend completo | Componentes, páginas organizadas por Visão (SuperAdministrador, Comissão, Aluno, Ouvinte), integração com API | T-3.1 a T-3.16 |
| **Fase 4** — Deploy | Dockerfile, Vercel, README | T-4.1 a T-4.3 |
| **Fase 5** — Fora de escopo | Itens [NÃO-ESSENCIAL] do spec.md (não implementar) | — |

---

# FASE 1 — INFRAESTRUTURA E SETUP

---

## T-1.1: Inicializar monorepo e Docker Compose

**Descrição**: Criar estrutura de pastas do monorepo e configurar Docker Compose.

**Arquivos a criar**:
- `docker-compose.yml`
- `.env.example`
- `.gitignore`
- `README.md`

**Critérios de aceitação**:
- Estrutura raiz: `frontend/`, `backend/`, `docker-compose.yml`, `spec.md`, `design.md`, `tasks.md`, `CLAUDE.md`.
- `docker-compose.yml` define três serviços:
  - `postgres`: imagem `postgres:15-alpine`, porta 5432, volume persistente para dados.
  - `rabbitmq`: imagem `rabbitmq:3-management-alpine`, portas 5672 (AMQP) e 15672 (management UI).
  - `backend`: build a partir de `./backend/Dockerfile`, porta 3001, depends_on postgres e rabbitmq.
- `.env.example` contém: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRATION`, `CLOUDAMQP_URL`, `BCRYPT_SALT_ROUNDS`, `NEXT_PUBLIC_API_URL`.
- `docker compose up postgres rabbitmq` sobe os dois serviços sem erro.

**Dependências**: Nenhuma.

---

## T-1.2: Inicializar projeto NestJS

**Descrição**: Criar projeto NestJS no diretório `backend/` com dependências base.

**Arquivos a criar**:
- `backend/` — projeto NestJS gerado via CLI.
- `backend/src/prisma/prisma.module.ts`
- `backend/src/prisma/prisma.service.ts`
- `backend/src/common/decorators/public.decorator.ts`

**Critérios de aceitação**:
- Projeto NestJS inicializado com TypeScript strict.
- Dependências instaladas: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`, `@prisma/client`, `prisma` (devDependency).
- ESLint e Prettier configurados.
- Jest configurado como test runner.
- `PrismaModule` é global e exporta `PrismaService`.
- `PrismaService` estende `PrismaClient` e implementa `onModuleInit` (connect) e `onModuleDestroy` (disconnect).
- `@nestjs/config` configurado com `ConfigModule.forRoot({ isGlobal: true })` no `AppModule`.
- `npm run start:dev` compila sem erro (pode falhar na conexão com DB — ok nesta etapa).

**Dependências**: T-1.1.

---

## T-1.3: Criar schema Prisma e migration inicial

**Descrição**: Implementar o schema Prisma completo conforme design.md Seção 4.

**Arquivos a criar**:
- `backend/prisma/schema.prisma`

**O que implementar** (copiar exatamente do design.md Seção 4):
- 8 enums: `Profile` (DoctoralStudent/Professor/Listener), `UserLevel` (Superadmin/Admin/Default), `SubmissionStatus`, `PresentationBlockType`, `PresentationStatus`, `PanelistStatus`, `CommitteeLevel` (Committee/Coordinator), `CommitteeRole`.
- 14 models: `UserAccount`, `EmailVerification`, `EventEdition`, `Submission`, `EvaluationCriteria`, `Evaluation`, `Room`, `PresentationBlock`, `Presentation`, `Panelist`, `AwardedPanelist`, `CommitteeMember`, `Certificate`, `Guidance`.
- Todas as relações, defaults, constraints, índices e diretivas `@map` conforme design.md.
- **Importante**: incluir a relação `proposedPresentationBlock` em Submission (FK opcional para PresentationBlock) e a relação inversa `proposedSubmissions` em PresentationBlock.

**Critérios de aceitação**:
- `npx prisma validate` passa sem erro.
- `npx prisma migrate dev --name init` cria a migration e aplica no PostgreSQL.
- `npx prisma generate` gera o Prisma Client sem erro.
- Verificar no PostgreSQL: todas as 14 tabelas existem com os campos corretos.
- **Não criar arquivo de seed nesta task.** O seed (com bypass do primeiro professor e dados de teste) é responsabilidade exclusiva da T-2.21, executada após todos os módulos backend estarem prontos.

**Dependências**: T-1.2.

---

## T-1.4: Criar estrutura de pastas dos módulos backend (vazios)

**Descrição**: Criar todos os módulos NestJS com arquivos vazios para estabelecer a estrutura.

**Arquivos a criar** (para cada módulo: `module.ts`, `controller.ts`, `service.ts`, `repository.ts`, `dto/`):
- `backend/src/auth/`
- `backend/src/user/`
- `backend/src/event-edition/`
- `backend/src/submission/`
- `backend/src/evaluation/`
- `backend/src/presentation/`
- `backend/src/room/`
- `backend/src/certificate/`
- `backend/src/committee/`
- `backend/src/guidance/`
- `backend/src/messaging/`
- `backend/src/common/guards/`
- `backend/src/common/interceptors/`
- `backend/src/common/filters/`

**Critérios de aceitação**:
- Cada módulo tem pelo menos: `x.module.ts` com `@Module({})` vazio.
- Todos os módulos registrados no `AppModule` (imports).
- `npm run start:dev` compila sem erro.
- Nenhuma lógica implementada — apenas estrutura.

**Dependências**: T-1.3.

---

## T-1.5: Inicializar projeto Next.js com Bootstrap

**Descrição**: Criar projeto Next.js no diretório `frontend/`.

**Arquivos a criar**:
- `frontend/` — projeto Next.js gerado via `create-next-app`.
- `frontend/src/services/api.ts` (instância Axios).
- `frontend/src/types/` (pasta vazia).
- `frontend/src/contexts/` (pasta vazia).
- `frontend/src/hooks/` (pasta vazia).
- `frontend/src/utils/` (pasta vazia).
- `frontend/src/components/ui/` (pasta vazia).
- `frontend/src/components/forms/` (pasta vazia).

**Critérios de aceitação**:
- Next.js 14+ com App Router e TypeScript strict.
- Bootstrap 5.3+ instalado via npm e importado no `layout.tsx` (`import 'bootstrap/dist/css/bootstrap.min.css'`).
- Fontes Poppins (400, 500, 600, 700) e Raleway (400) importadas via Google Fonts no `layout.tsx`.
- `services/api.ts` exporta instância Axios com `baseURL = process.env.NEXT_PUBLIC_API_URL`.
- Estrutura de pastas do App Router: `app/(auth)/login/`, `app/(auth)/register/`, `app/(dashboard)/`, `app/(public)/`.
- ESLint, Prettier e Jest configurados.
- `npm run dev` sobe na porta 3000 e exibe página placeholder.

**Dependências**: T-1.1.

---

## T-1.6: Configurar CI com GitHub Actions

**Descrição**: Criar workflows de CI.

**Arquivos a criar**:
- `.github/workflows/ci-backend.yml`
- `.github/workflows/ci-frontend.yml`
- `.github/workflows/codeql.yml`

**Critérios de aceitação**:
- `ci-backend.yml`: roda `npm ci`, `npm run lint`, `npm run test` no diretório `backend/` em push/PR. Usa serviço PostgreSQL e variáveis de teste.
- `ci-frontend.yml`: roda `npm ci`, `npm run lint`, `npm run test` no diretório `frontend/` em push/PR.
- `codeql.yml`: análise CodeQL para JavaScript/TypeScript.
- Todos os workflows passam no estado atual.

**Dependências**: T-1.2, T-1.5.

---

# FASE 2 — BACKEND COMPLETO

> **Convenções obrigatórias para todas as tasks desta fase (design.md Seção 3.3):**
>
> - Nomenclatura de arquivos: `kebab-case`.
> - Nomenclatura de classes: `PascalCase`.
> - DTOs validados com `class-validator`. Nunca use `any`.
> - Controller não contém lógica de negócio. Service não retorna Response HTTP. Repository é o único que chama Prisma.
> - Respostas: criação → 201, leitura → 200, deleção → 204. Erros → HttpException com código semântico.
> - Formato de resposta conforme design.md Seção 8.3: `{ data, message }` para sucesso, `{ statusCode, message, errors }` para erro.
> - Prefixo de todas as rotas: `/api/v1/`.

---

## T-2.1: Módulo Messaging — RabbitMQ

**Descrição**: Implementar integração com RabbitMQ para mensageria assíncrona.

**Arquivos a criar/modificar**:
- `backend/src/messaging/messaging.module.ts`
- `backend/src/messaging/messaging.service.ts`
- `backend/src/messaging/messaging.controller.ts`
- `backend/src/messaging/messaging.service.spec.ts`

**O que implementar**:
- `MessagingService` com método `publish(queue: string, data: any): Promise<void>` para publicar mensagens.
- `MessagingController` com `@MessagePattern` para três filas: `email-send`, `email-error`, `email-rate-limit`.
- Cada handler: loga a mensagem recebida, faz `channel.ack(originalMsg)`. Sem envio real de e-mail nesta task.
- Conexão via `CLOUDAMQP_URL` do `.env`.

**Critérios de aceitação**:
- `MessagingModule` registrado no `AppModule`.
- Teste unitário: `MessagingService.publish` é chamado com queue e data corretos (mock do channel).
- `npm run test` passa.

**Dependências**: T-1.4.

---

## T-2.2: Módulo User — Repository e Service

**Descrição**: Implementar UserRepository e UserService com lógica de negócio de usuários.

**Arquivos a criar/modificar**:
- `backend/src/user/user.repository.ts`
- `backend/src/user/user.service.ts`
- `backend/src/user/dto/create-user.dto.ts`
- `backend/src/user/dto/update-user.dto.ts`
- `backend/src/user/user.module.ts`
- `backend/src/user/user.service.spec.ts`

**DTOs**:
- `CreateUserDto`: name (string, max 255, obrigatório), email (string, email válido, obrigatório), password (string, min 8, obrigatório), registrationNumber (string, max 20, opcional), profile (enum Profile, obrigatório), photoFilePath (string, opcional).
- `UpdateUserDto`: PartialType de CreateUserDto (sem password).

**UserRepository** — métodos:
- `create(data)`, `findById(id)`, `findByEmail(email)`, `findAll()`, `update(id, data)`, `delete(id)`.
- Todas as chamadas ao Prisma ficam aqui e somente aqui.

**UserService** — métodos:
- `create(dto)`: valida email único (409 se duplicado), hasheia senha com bcrypt (salt 10), chama repository.
- `findById(id)`: retorna usuário ou lança NotFoundException.
- `findAll()`: lista todos.
- `update(id, dto)`: atualiza parcialmente.
- `remove(id)`: marca `isActive = false`, desassocia submissões, avaliações, painéis (CA-1.4.2).
- `findPendingProfessors()`: lista professores com `isVerified = true` e `isActive = false`.
- `approveProfessor(id)`: marca `isActive = true`.
- `rejectProfessor(id)`: marca com status de rejeição.
- `updateLevel(id, level)`: atualiza `UserLevel`.

**Critérios de aceitação**:
- Testes unitários (mock do repository):
  - Criação com email duplicado → lança ConflictException.
  - Criação válida → retorna usuário sem campo password.
  - Senha é hasheada (não armazenada em plain text).
  - `findById` com id inexistente → lança NotFoundException.
  - `remove` marca `isActive = false`.
- `npm run test` passa.
- Ref spec.md: CA-1.1.1 a CA-1.1.3, CA-1.2.1, CA-1.4.1, CA-1.4.2.

**Dependências**: T-1.3.

---

## T-2.3: Módulo User — Controller

**Descrição**: Implementar UserController com endpoints REST.

**Arquivos a criar/modificar**:
- `backend/src/user/user.controller.ts`
- `backend/src/user/user.controller.spec.ts`

**Endpoints**:
- `GET /api/v1/users` — listar todos. Restrito a Admin.
- `GET /api/v1/users/:id` — buscar por ID. Restrito a usuário autenticado.
- `PATCH /api/v1/users/:id` — atualizar. Restrito a Admin ou próprio usuário.
- `DELETE /api/v1/users/:id` — remover (soft-delete). Restrito a Admin.
- `GET /api/v1/users/pending` — listar professores pendentes. Restrito a Admin.
- `PATCH /api/v1/users/:id/approve` — aprovar professor. Restrito a Admin.
- `PATCH /api/v1/users/:id/reject` — rejeitar professor. Restrito a Admin.
- `PATCH /api/v1/users/:id/level` — alterar nível (Admin/SuperAdmin). Restrito conforme spec.md Seção 2.

**Critérios de aceitação**:
- Todos os endpoints decorados com guards corretos (implementação dos guards vem em T-2.5, aqui usar placeholder `@UseGuards(JwtAuthGuard)`).
- Testes unitários do controller (mock do service): cada endpoint chama o método correto do service.
- `npm run test` passa.
- Ref spec.md: CA-1.3.1, CA-1.3.2, CA-1.4.1, CA-2.1.1 a CA-2.1.3, CA-2.2.1 a CA-2.2.3.

**Dependências**: T-2.2.

---

## T-2.4: Módulo Auth — Registro e Verificação de E-mail

**Descrição**: Implementar fluxo de registro e verificação de e-mail.

**Arquivos a criar/modificar**:
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/auth.service.spec.ts`

**Endpoints**:
- `POST /api/v1/auth/register` — registro público.
- `GET /api/v1/auth/verify-email?token=<token>` — verificação pública.
- `POST /api/v1/auth/resend-verification` — reenvio público.

**Lógica do registro** (`AuthService.register`):
1. Validar email: se contém `@ufba.br`, exigir matrícula e perfil (DoctoralStudent ou Professor). Caso contrário, perfil = `Listener` e matrícula é opcional.
2. Validar senha conforme spec.md CA-1.1.3: min 8 caracteres, pelo menos 1 letra maiúscula, 1 letra minúscula, 4 números e 1 caractere especial.
3. Hashear senha com bcrypt (salt rounds: 10).
4. Criar UserAccount via UserService.
5. Criar EmailVerification com token UUID único.
6. Publicar mensagem no RabbitMQ (fila `email-send`) com dados do e-mail.
7. Se perfil = `Professor`: `isActive = false` (pendente de aprovação, CA-1.1.6).
8. Se perfil = `DoctoralStudent` ou `Listener`: `isActive = true` (ativo após verificação, CA-1.1.7 e CA-1.2.4).

**Observação**: o bypass do primeiro professor (CA-2.1.1, CA-2.2.1) **não é tratado nesta task**. Ele é implementado exclusivamente via seed (T-2.21), que pré-popula o banco com um SuperAdmin já ativo e verificado. Em produção, esse seed deve ser executado uma única vez no provisionamento inicial. Não inserir lógica de "se countProfessors() === 0" no AuthService — isso adiciona complexidade desnecessária e cria risco de bypass acidental em ambientes que não usam seed.

**Lógica da verificação** (`AuthService.verifyEmail`):
1. Buscar EmailVerification pelo token.
2. Token inválido ou inexistente → 400.
3. Marcar `isVerified = true`, registrar `emailVerifiedAt`.

**Critérios de aceitação**:
- Testes unitários:
  - Registro UFBA válido (doutorando) → cria user + emailVerification + publica mensagem.
  - Registro UFBA (professor) → `isActive = false`.
  - Registro ouvinte → aceita email não-UFBA, matrícula opcional.
  - Email duplicado → 409.
  - Senha fraca → 400.
  - Verificação com token válido → `isVerified = true`.
  - Verificação com token inválido → 400.
  - Reenvio → publica nova mensagem.
- `npm run test` passa.
- Ref spec.md: CA-1.1.1 a CA-1.1.7, CA-1.2.1 a CA-1.2.4.

**Dependências**: T-2.2, T-2.1.

---

## T-2.5: Módulo Auth — Login JWT e Guards

**Descrição**: Implementar login com JWT e guards de autorização.

**Arquivos a criar/modificar**:
- `backend/src/auth/auth.service.ts` (adicionar método `login`).
- `backend/src/auth/auth.controller.ts` (adicionar endpoint `login`).
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/strategies/local.strategy.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/common/guards/levels.guard.ts`
- `backend/src/common/decorators/roles.decorator.ts`
- `backend/src/common/decorators/levels.decorator.ts`
- `backend/src/common/decorators/current-user.decorator.ts`
- `backend/src/auth/auth.service.spec.ts` (adicionar testes de login).

**Endpoints**:
- `POST /api/v1/auth/login` — público. Recebe `{ email, password }`.
- `POST /api/v1/auth/logout` — pública. Limpa o cookie de sessão.
- `GET /api/v1/auth/me` — autenticada. Retorna o usuário do token enriquecido com flag de visão. Body de resposta:
  ```json
  {
    "data": {
      "id": "...",
      "name": "...",
      "email": "...",
      "profile": "DoctoralStudent | Professor | Listener",
      "level": "Default | Admin | Superadmin",
      "isCommitteeOfActiveEdition": false
    }
  }
  ```
  O flag `isCommitteeOfActiveEdition` é `true` se existe um `CommitteeMember` com `userId = user.id`, `eventEditionId` da edição com `isActive = true` e `endDate >= now()`. É calculado pelo backend a cada chamada — não é persistido. Esse flag é a fonte de verdade do hook `useUserView` no frontend (T-3.3).

**Lógica do login** (`AuthService.login`):
1. Buscar user por email. Não encontrado → 401.
2. `bcrypt.compare(password, user.password)`. Falhou → 401.
3. `isVerified = false` → 403 com mensagem "Confirme seu e-mail".
4. `isActive = false` → 403 com mensagem "Aguardando aprovação".
5. Gerar JWT com payload `{ sub: user.id, profile: user.profile, level: user.level }`. Expiração: `JWT_EXPIRATION` do .env.
6. **Não retornar o token no body.** O controller (`AuthController.login`) recebe o token gerado pelo service e seta um cookie httpOnly chamado `access_token` na resposta (`Set-Cookie: access_token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=<seg>`).
7. Body de resposta: `{ user: { id, name, email, profile, level } }`. Sem token visível ao JavaScript do cliente.
8. Logout (`POST /api/v1/auth/logout`): apenas seta cookie expirado: `Set-Cookie: access_token=; Max-Age=0`.
9. Me (`GET /api/v1/auth/me`): retorna o user do JWT + flag `isCommitteeOfActiveEdition` (descrito acima).

**Guards**:
- `JwtAuthGuard`: global (APP_GUARD). Rotas com `@Public()` são excluídas. **Lê o JWT do cookie `access_token`** (não do header Authorization).
- `RolesGuard`: verifica `@Roles(Profile.Professor)` contra `request.user.profile`.
- `LevelsGuard`: verifica `@Levels(UserLevel.Admin)` contra `request.user.level`.

**Critérios de aceitação**:
- Testes unitários:
  - Login válido → resposta seta cookie `access_token` httpOnly, body retorna apenas `user`.
  - Email não encontrado → 401.
  - Senha incorreta → 401.
  - Usuário não verificado → 403.
  - Usuário inativo → 403.
  - RolesGuard permite perfil correto, bloqueia incorreto → 403.
  - LevelsGuard permite nível correto, bloqueia incorreto → 403.
  - Rota @Public() acessível sem cookie.
  - JwtAuthGuard lê token do cookie e injeta `request.user`.
  - Logout seta cookie expirado.
  - `GET /me` autenticado retorna user com flag `isCommitteeOfActiveEdition`.
  - `GET /me` para usuário sem CommitteeMember → flag = false.
  - `GET /me` para usuário CommitteeMember de edição inativa ou com endDate passado → flag = false.
  - `GET /me` para usuário CommitteeMember de edição ativa → flag = true.
  - `GET /me` sem cookie → 401.
- `npm run test` passa.
- Ref design.md: Seção 5.

**Dependências**: T-2.4.

---

## T-2.5b: Configuração de cookies httpOnly e CORS com credentials

**Descrição**: Configurar a aplicação NestJS para suportar cookies httpOnly entre origens diferentes (frontend em `localhost:3000` e backend em `localhost:3001`). Implementar o `EditionAdminGuard` (descrito em design.md Seção 5.4).

**Arquivos a criar/modificar**:
- `backend/src/main.ts` (adicionar configuração de cookies e CORS).
- `backend/src/common/guards/edition-admin.guard.ts`
- `backend/src/common/decorators/edition-admin.decorator.ts`
- `backend/src/common/guards/edition-admin.guard.spec.ts`

**O que implementar**:

1. **Cookies e CORS no `main.ts`**:
```typescript
import cookieParser from 'cookie-parser';
// ...
app.use(cookieParser());
app.enableCors({
  origin: process.env.CORS_ORIGIN, // ex: http://localhost:3000
  credentials: true, // permite envio de cookies cross-origin
});
```
Adicionar `cookie-parser` e `@types/cookie-parser` às dependências.

2. **`EditionAdmin` decorator e guard** (design.md Seção 5.4):
- Decorator: `@EditionAdmin()` — sem parâmetros. Marca a rota como restrita a admins da edição.
- Guard: lê `eventEditionId` de `request.body`, `request.query` ou `request.params` (nessa ordem). Falha com 400 se ausente.
- Verifica: existe `CommitteeMember` com `userId = request.user.sub` E `eventEditionId = <id>` E a edição tem `isActive = true` E `endDate >= now()`.
- Se sim → permite. Se não → 403 com mensagem "Acesso restrito a administradores da edição".
- **Exceção**: usuários com `level = Superadmin` sempre passam, independente de CommitteeMember.

**Critérios de aceitação**:
- Testes unitários do guard (mock do PrismaService):
  - CommitteeMember válido + edição ativa + endDate futuro → permite.
  - CommitteeMember de outra edição → 403.
  - Edição inativa → 403.
  - Edição com endDate passado → 403.
  - Sem `eventEditionId` no request → 400.
  - User com `level = Superadmin` sem CommitteeMember → permite (bypass).
- Teste de integração: requisição cross-origin com `withCredentials` e cookie httpOnly funciona.
- `npm run test` passa.
- Ref design.md: Seção 5.4.

**Dependências**: T-2.5, T-2.11 (CommitteeMember).

> **Observação de ordem**: como T-2.11 depende de T-2.8 (EventEdition) e T-2.7, esta task T-2.5b deve ser executada **logo após T-2.11**. A numeração T-2.5b mantém apenas o agrupamento conceitual com T-2.5 (configuração de auth), mas a ordem de execução é: T-2.5 → T-2.6 → T-2.7 → T-2.8 → ... → T-2.11 → **T-2.5b** → T-2.12 em diante.

---

## T-2.6: Módulo Auth — Reset de Senha

**Descrição**: Implementar fluxo de esquecimento/redefinição de senha.

**Arquivos a criar/modificar**:
- `backend/src/auth/auth.service.ts` (adicionar métodos).
- `backend/src/auth/auth.controller.ts` (adicionar endpoints).
- `backend/src/auth/dto/forgot-password.dto.ts`
- `backend/src/auth/dto/reset-password.dto.ts`

**Endpoints**:
- `POST /api/v1/auth/forgot-password` — público. Recebe `{ email }`. Gera token de reset, publica no RabbitMQ.
- `POST /api/v1/auth/reset-password` — público. Recebe `{ token, password }`. Valida token, hasheia nova senha, atualiza.

**Critérios de aceitação**:
- Testes: fluxo completo, token inválido → 400, senha fraca → 400.
- `npm run test` passa.

**Dependências**: T-2.5, T-2.1.

---

## T-2.7: Lógica de papéis (Coordenador, auto-promoções)

**Descrição**: Implementar regras de negócio de atribuição de papéis conforme spec.md Seção 2.

**Arquivos a modificar**:
- `backend/src/user/user.service.ts`
- `backend/src/user/user.service.spec.ts`

**Regras a implementar**:
- `updateLevel` para `Admin`: apenas usuários com `level = Admin` ou `Superadmin` podem atribuir (CA-2.1.2).
- `updateLevel` para `Superadmin`: apenas `Superadmin` pode atribuir, e apenas para usuários com `profile = Professor` (CA-2.2.2, CA-2.2.3).
- Coordenador é atribuído via `CommitteeMember` (T-2.11). A regra de auto-promoção a `Superadmin` (CA-2.2.4) é implementada em T-2.11 chamando `UserService.updateLevel`.
- **Importante**: a regra "primeiro professor vira SuperAdmin automaticamente" (CA-2.1.1, CA-2.2.1) **não é implementada aqui**. Esse comportamento é resolvido pelo seed (T-2.21), que pré-popula um SuperAdmin já ativo. O AuthService permanece sem condicionais sobre "número de professores existentes".

**Critérios de aceitação**:
- Testes:
  - Admin pode promover usuário a Admin.
  - Admin não-Superadmin não pode promover a Superadmin → 403.
  - Superadmin pode promover professor a Superadmin.
  - Superadmin não pode promover não-professor (DoctoralStudent ou Listener) a Superadmin → 400.
  - `Default` não pode atribuir nível algum → 403.
- `npm run test` passa.
- Ref spec.md: CA-2.1.2, CA-2.1.3, CA-2.2.2, CA-2.2.3.

**Dependências**: T-2.5.

---

## T-2.8: Módulo EventEdition — Repository, Service e Controller

**Descrição**: CRUD completo de edições do evento.

**Arquivos a criar/modificar**:
- `backend/src/event-edition/event-edition.repository.ts`
- `backend/src/event-edition/event-edition.service.ts`
- `backend/src/event-edition/event-edition.controller.ts`
- `backend/src/event-edition/dto/create-event-edition.dto.ts`
- `backend/src/event-edition/dto/update-event-edition.dto.ts`
- `backend/src/event-edition/event-edition.module.ts`
- `backend/src/event-edition/event-edition.service.spec.ts`

**Endpoints**:
- `POST /api/v1/event-editions` — criar. Restrito a Admin.
- `GET /api/v1/event-editions` — listar todas. Público.
- `GET /api/v1/event-editions/:id` — buscar por ID. Público.
- `GET /api/v1/event-editions/active` — buscar edição ativa. Público.
- `PATCH /api/v1/event-editions/:id` — atualizar. Restrito a Admin.

**Validações**:
- `submissionDeadline` não pode ser posterior a `startDate` (CA-3.1.2).
- Nova edição criada com isActive = false. Admin ativa manualmente.
- Ao alterar `presentationDuration` ou `presentationsPerPresentationBlock`, desassociar todas as apresentações programadas e avisar (CA-3.2.3).

**Critérios de aceitação**:
- Testes: criação válida, data inválida → 400, edição com desassociação de apresentações.
- `npm run test` passa.
- Ref spec.md: CA-3.1.1 a CA-3.2.5.

**Dependências**: T-2.5.

---

## T-2.9: Módulo Room — Repository, Service e Controller

**Descrição**: CRUD de salas vinculadas a uma edição.

**Arquivos a criar/modificar**:
- `backend/src/room/room.repository.ts`
- `backend/src/room/room.service.ts`
- `backend/src/room/room.controller.ts`
- `backend/src/room/dto/create-room.dto.ts`
- `backend/src/room/room.module.ts`
- `backend/src/room/room.service.spec.ts`

**Endpoints**:
- `POST /api/v1/rooms` — criar. Restrito a Admin. Body: `{ eventEditionId, name, description? }`.
- `GET /api/v1/rooms?eventEditionId=X` — listar por edição. Público.
- `DELETE /api/v1/rooms/:id` — remover. Restrito a Admin.

**Critérios de aceitação**:
- Testes: criação, listagem por edição, exclusão.
- `npm run test` passa.

**Dependências**: T-2.8.

---

## T-2.10: Módulo Guidance — Repository, Service e Controller

**Descrição**: CRUD de orientações (relação 1:1 com edição).

**Arquivos a criar/modificar**:
- `backend/src/guidance/guidance.repository.ts`
- `backend/src/guidance/guidance.service.ts`
- `backend/src/guidance/guidance.controller.ts`
- `backend/src/guidance/dto/create-guidance.dto.ts`
- `backend/src/guidance/dto/update-guidance.dto.ts`
- `backend/src/guidance/guidance.module.ts`
- `backend/src/guidance/guidance.service.spec.ts`

**Endpoints**:
- `POST /api/v1/guidances` — criar. Restrito a Admin.
- `GET /api/v1/guidances/:eventEditionId` — buscar por edição. Público.
- `PATCH /api/v1/guidances/:id` — atualizar. Restrito a Admin.

**Campos**: `eventEditionId`, `summary?`, `authorGuidance?`, `reviewerGuidance?`, `audienceGuidance?`.

**Critérios de aceitação**:
- Constraint unique(eventEditionId) — apenas uma Guidance por edição.
- Testes: criação, leitura pública, edição, duplicação → 409.
- `npm run test` passa.

**Dependências**: T-2.8.

---

## T-2.11: Módulo CommitteeMember — Repository, Service e Controller

**Descrição**: Gestão de membros da comissão organizadora.

**Arquivos a criar/modificar**:
- `backend/src/committee/committee.repository.ts`
- `backend/src/committee/committee.service.ts`
- `backend/src/committee/committee.controller.ts`
- `backend/src/committee/dto/create-committee-member.dto.ts`
- `backend/src/committee/committee.module.ts`
- `backend/src/committee/committee.service.spec.ts`

**Endpoints**:
- `POST /api/v1/committee-members` — criar. Restrito a Admin.
- `GET /api/v1/committee-members?eventEditionId=X` — listar por edição. Público.
- `DELETE /api/v1/committee-members/:id` — remover. Restrito a Admin.

**Regras de negócio**:
- Constraint unique(eventEditionId, userId).
- Se `level = Coordinator` e `role = Organizer` → coordenador. Apenas um por edição (CA-2.3.1). Atribuir novo remove o anterior (CA-2.3.2).
- Ao atribuir coordenador, auto-promover o usuário a SuperAdmin (CA-2.2.4) chamando `UserService.updateLevel`.
- Restrito a SuperAdmin para atribuição de coordenador (CA-2.3.3).

**Critérios de aceitação**:
- Testes: adicionar membro, duplicação → 409, atribuir coordenador com auto-promoção, substituir coordenador.
- `npm run test` passa.
- Ref spec.md: CA-2.3.1 a CA-2.3.4.

**Dependências**: T-2.8, T-2.7.

---

## T-2.12: Módulo Submission — Repository, Service e Controller ✅

**Descrição**: CRUD de submissões de apresentações.

**Arquivos a criar/modificar**:
- `backend/src/submission/submission.repository.ts`
- `backend/src/submission/submission.service.ts`
- `backend/src/submission/submission.controller.ts`
- `backend/src/submission/dto/create-submission.dto.ts`
- `backend/src/submission/dto/update-submission.dto.ts`
- `backend/src/submission/submission.module.ts`
- `backend/src/submission/submission.service.spec.ts`

**Endpoints**:
- `POST /api/v1/submissions` — criar. Restrito a usuário autenticado.
- `GET /api/v1/submissions?eventEditionId=X` — listar por edição. Público.
- `GET /api/v1/submissions/:id` — buscar por ID. Público.
- `GET /api/v1/submissions/my` — listar do usuário logado. Restrito a autenticado.
- `PATCH /api/v1/submissions/:id` — atualizar. Restrito a Admin ou autor.
- `DELETE /api/v1/submissions/:id` — remover. Restrito a Admin.

**Validações**:
- Submissão após `submissionDeadline` da edição ativa → 400 com mensagem (CA-4.1).
- Upload de PDF/JPG: máximo **10MB por arquivo** (CA-4.2.2). Validar via interceptor do Multer (`fileSize`). Não há limite acumulado por usuário.
- `advisorId` deve referenciar um `UserAccount` existente.
- Caminho dos arquivos persistido conforme design.md Seção 6.1.

**Critérios de aceitação**:
- Testes: criação válida, submissão após deadline → 400, upload > 10MB → 400, listagem do autor.
- `npm run test` passa.
- Ref spec.md: CA-4.1.1 a CA-4.3.5.

**Dependências**: T-2.8, T-2.5.

---

## T-2.13: Módulo PresentationBlock — Repository, Service e Controller

**Descrição**: CRUD de blocos/sessões de apresentação.

**Arquivos a criar/modificar**:
- `backend/src/presentation/presentation-block.repository.ts`
- `backend/src/presentation/presentation-block.service.ts`
- `backend/src/presentation/presentation-block.controller.ts`
- `backend/src/presentation/dto/create-presentation-block.dto.ts`
- `backend/src/presentation/presentation.module.ts` (atualizar)
- `backend/src/presentation/presentation-block.service.spec.ts`

**Endpoints**:
- `POST /api/v1/presentation-blocks` — criar. Restrito a Admin.
- `GET /api/v1/presentation-blocks?eventEditionId=X` — listar por edição. Público.
- `PATCH /api/v1/presentation-blocks/:id` — atualizar. Restrito a Admin.
- `DELETE /api/v1/presentation-blocks/:id` — remover. Restrito a Admin.

**Validações**:
- Horário dentro do período do evento.
- Sem sobreposição na mesma sala (CA-5.1.4). Sobreposição em salas diferentes → permitido.
- Sessão sem sala (`roomId = null`) → bloqueia todas as salas no período (CA-5.1.2).
- Tipo Presentation: duração deve ser múltiplo de `presentationDuration` da edição (CA-5.1.10).
- Exclusão desassocia apresentações vinculadas (CA-5.1.1).

**Critérios de aceitação**:
- Testes: criação válida, sobreposição mesma sala → 409, sobreposição salas diferentes → ok, sessão geral sem sala bloqueia, exclusão com desassociação, duração inválida → 400.
- `npm run test` passa.
- Ref spec.md: CA-5.1.1 a CA-5.1.11.

**Dependências**: T-2.9, T-2.8.

---

## T-2.14: Módulo Presentation — Repository, Service e Controller

**Descrição**: Gestão da alocação de submissões em blocos.

**Arquivos a criar/modificar**:
- `backend/src/presentation/presentation.repository.ts`
- `backend/src/presentation/presentation.service.ts`
- `backend/src/presentation/presentation.controller.ts`
- `backend/src/presentation/dto/create-presentation.dto.ts`
- `backend/src/presentation/presentation.service.spec.ts`

**Endpoints**:
- `POST /api/v1/presentations` — alocar submissão em bloco. Restrito a Admin.
- `GET /api/v1/presentations?eventEditionId=X` — listar por edição (com dados da submissão). Público.
- `PATCH /api/v1/presentations/:id` — reatribuir. Restrito a Admin.
- `DELETE /api/v1/presentations/:id` — remover alocação. Restrito a Admin.

**Regras**:
- `submissionId` é unique — uma submissão só pode estar em um bloco.
- Ao adicionar a um bloco, remover do bloco anterior (CA-5.1.8, CA-4.3.3).
- `positionWithinBlock` define a ordem.

**Critérios de aceitação**:
- Testes: alocação, reatribuição (remove da anterior), submissão já alocada → atualiza.
- `npm run test` passa.
- Ref spec.md: CA-5.1.7, CA-5.1.8, CA-4.3.1 a CA-4.3.4.

**Dependências**: T-2.13, T-2.12.

---

## T-2.15: Módulo Panelist — Repository, Service e Controller

**Descrição**: Gestão de avaliadores por bloco de apresentação.

**Arquivos a criar/modificar**:
- `backend/src/presentation/panelist.repository.ts`
- `backend/src/presentation/panelist.service.ts`
- `backend/src/presentation/panelist.controller.ts`
- `backend/src/presentation/dto/create-panelist.dto.ts`
- `backend/src/presentation/panelist.service.spec.ts`

**Endpoints**:
- `POST /api/v1/panelists` — atribuir avaliador ao bloco. Restrito a Admin.
- `GET /api/v1/panelists?presentationBlockId=X` — listar por bloco. Público.
- `DELETE /api/v1/panelists/:id` — remover. Restrito a Admin.

**Critérios de aceitação**:
- Testes: atribuição, listagem, remoção.
- `npm run test` passa.
- Ref spec.md: CA-5.1.3.

**Dependências**: T-2.13, T-2.2.

---

## T-2.16: Módulo EvaluationCriteria — Repository, Service e Controller

**Descrição**: CRUD de critérios de avaliação por edição.

**Arquivos a criar/modificar**:
- `backend/src/evaluation/evaluation-criteria.repository.ts`
- `backend/src/evaluation/evaluation-criteria.service.ts`
- `backend/src/evaluation/evaluation-criteria.controller.ts`
- `backend/src/evaluation/dto/create-evaluation-criteria.dto.ts`
- `backend/src/evaluation/evaluation.module.ts` (atualizar)
- `backend/src/evaluation/evaluation-criteria.service.spec.ts`

**Endpoints**:
- `POST /api/v1/evaluation-criteria` — criar. Restrito a Admin.
- `GET /api/v1/evaluation-criteria?eventEditionId=X` — listar por edição. Público.
- `PATCH /api/v1/evaluation-criteria/:id` — atualizar. Restrito a Admin.
- `DELETE /api/v1/evaluation-criteria/:id` — remover. Restrito a Admin.

**Critérios padrão (seedados em T-2.21)**: ao criar uma edição via seed, o sistema deve associar 5 critérios padrão de avaliação:
1. Conteúdo
2. Qualidade e Clareza
3. Relevância ao Tema
4. Solução Proposta
5. Resultados

Esses critérios não são fixos no código — são registros normais da tabela `EvaluationCriteria` cadastrados pelo seed. O admin pode editá-los ou criar novos via os endpoints acima.

**Critérios de aceitação**:
- Testes: CRUD completo, listagem por edição.
- `npm run test` passa.

**Dependências**: T-2.8.

---

## T-2.17: Módulo Evaluation — Repository, Service e Controller

**Descrição**: Registro de votos/avaliações em apresentações.

**Arquivos a criar/modificar**:
- `backend/src/evaluation/evaluation.repository.ts`
- `backend/src/evaluation/evaluation.service.ts`
- `backend/src/evaluation/evaluation.controller.ts`
- `backend/src/evaluation/dto/create-evaluation.dto.ts`
- `backend/src/evaluation/evaluation.service.spec.ts`

**Endpoints**:
- `POST /api/v1/evaluations` — criar/atualizar voto. Público ou autenticado (depende de `isEvaluationRestrictToLoggedUsers`).
- `GET /api/v1/evaluations?submissionId=X` — listar por submissão. Restrito a Admin.

**Regras**:
- Se `eventEdition.isEvaluationRestrictToLoggedUsers = true` e usuário não autenticado → 401 (CA-6.1.6).
- Voto duplicado do mesmo `userId + submissionId + evaluationCriteriaId` → atualizar o score existente (upsert).
- Votação fora do período do evento (antes de `startDate` ou depois de `endDate`) → 400.
- Se usuário não logado (e restrição desligada): `name` e `email` opcionais no body.

**Critérios de aceitação**:
- Testes: voto válido logado, voto válido não-logado (sem restrição), voto não-logado com restrição → 401, voto duplicado → upsert, fora do período → 400.
- `npm run test` passa.
- Ref spec.md: CA-6.1.1 a CA-6.1.6.

**Dependências**: T-2.16, T-2.12.

---

## T-2.18: Endpoint de Ranking / Premiação

**Descrição**: Implementar cálculo de rankings para premiação.

**Arquivos a modificar**:
- `backend/src/presentation/presentation.service.ts` (adicionar métodos de ranking).
- `backend/src/presentation/presentation.controller.ts` (adicionar endpoints).
- `backend/src/presentation/presentation.service.spec.ts` (adicionar testes).

**Endpoints**:
- `GET /api/v1/presentations/ranking?eventEditionId=X&type=public` — ranking por média do público.
- `GET /api/v1/presentations/ranking?eventEditionId=X&type=panelists` — ranking por média dos avaliadores.
- `GET /api/v1/presentations/ranking?eventEditionId=X&type=all` — ranking geral (banca).

**Lógica**:
- Para cada apresentação da edição, calcular `nota_final` conforme spec.md CA-7.1.1: `nota_final = (média_dos_scores + qtd_avaliações) / 2`. Apresentações sem avaliações têm `nota_final = 0`.
- `type=public`: considerar apenas Evaluations de usuários que **NÃO** são panelistas daquele bloco (`Panelist` não inclui o `userId`).
- `type=panelists`: considerar apenas Evaluations de usuários que **SÃO** panelistas do bloco daquela apresentação.
- `type=all`: considerar todas as avaliações sem filtro.
- Retornar lista ordenada por `nota_final` desc, com: `submissionId`, `title`, `authorName`, `averageScore` (= `nota_final`).
- Atualizar campos `publicAverageScore` e `evaluatorsAverageScore` no model `Presentation` ao calcular o ranking (cache simples).

**Critérios de aceitação**:
- Testes: ranking com 5 apresentações, empate, edição sem avaliações → lista vazia.
- `npm run test` passa.
- Ref spec.md: CA-7.1.1 a CA-7.1.3.

**Dependências**: T-2.17, T-2.15, T-2.14.

---

## T-2.19: Módulo AwardedPanelist — Repository, Service e Controller

**Descrição**: Seleção manual de avaliadores premiados.

**Arquivos a criar/modificar**:
- `backend/src/presentation/awarded-panelist.repository.ts`
- `backend/src/presentation/awarded-panelist.service.ts`
- `backend/src/presentation/awarded-panelist.controller.ts`
- `backend/src/presentation/dto/create-awarded-panelist.dto.ts`
- `backend/src/presentation/awarded-panelist.service.spec.ts`

**Endpoints**:
- `POST /api/v1/awarded-panelists` — selecionar. Restrito a Admin.
- `GET /api/v1/awarded-panelists?eventEditionId=X` — listar premiados.
- `DELETE /api/v1/awarded-panelists/:eventEditionId/:userId` — remover. Restrito a Admin.

**Regras**:
- Máximo 3 por edição (CA-7.2.2). Tentativa de adicionar 4º → 400.

**Critérios de aceitação**:
- Testes: seleção, limite de 3, listagem, remoção.
- `npm run test` passa.
- Ref spec.md: CA-7.2.1 a CA-7.2.3.

**Dependências**: T-2.8, T-2.15.

---

## T-2.20: Módulo Certificate — Repository, Service e Controller

**Descrição**: Geração de certificados em PDF e envio por e-mail.

**Biblioteca de geração de PDF**: usar **`pdfkit`** (versão 0.15+), conforme design.md Seção 2.2. Adicionar como dependência: `npm install pdfkit && npm install -D @types/pdfkit`.

**Arquivos a criar/modificar**:
- `backend/src/certificate/certificate.repository.ts`
- `backend/src/certificate/certificate.service.ts`
- `backend/src/certificate/certificate.controller.ts`
- `backend/src/certificate/certificate-generator.ts` (encapsula uso do pdfkit)
- `backend/src/certificate/certificate.module.ts`
- `backend/src/certificate/certificate.service.spec.ts`

**Endpoints**:
- `POST /api/v1/certificates/generate?eventEditionId=X` — gerar certificados. Restrito a Admin.
- `GET /api/v1/certificates/my` — listar certificados do usuário logado.
- `GET /api/v1/certificates/:id/download` — baixar PDF. Restrito a owner ou Admin.

**Lógica** (`CertificateService.generateAll`):
1. Buscar todos os participantes da edição.
2. Para cada participante, gerar PDF com: cabeçalho (universidade, instituto, programa), logomarcas, nome completo, natureza da participação, premiações (separando Escolha do Público / Avaliadores se aplicável), assinaturas, data de emissão.
3. Salvar PDF, criar registro Certificate, publicar mensagem no RabbitMQ.

**Critérios de aceitação**:
- Testes: geração para apresentador, avaliador, premiado, download autorizado, download não autorizado → 403.
- `npm run test` passa.
- Ref spec.md: CA-8.1.1 a CA-8.1.9.

**Dependências**: T-2.18, T-2.19, T-2.1.

---

## T-2.20b: Módulo Favorite — Repository, Service e Controller

**Descrição**: CRUD do recurso de favoritar apresentações. Suporta a Visão Ouvinte/Logado (T-3.14). O modelo `Favorite` está definido no design.md Seção 4.2 (chave primária composta `[userId, submissionId]`).

**Arquivos a criar/modificar**:
- `backend/src/favorite/favorite.module.ts`
- `backend/src/favorite/favorite.service.ts`
- `backend/src/favorite/favorite.controller.ts`
- `backend/src/favorite/favorite.repository.ts`
- `backend/src/favorite/dto/create-favorite.dto.ts`
- `backend/src/favorite/favorite.service.spec.ts`
- `backend/src/app.module.ts` (registrar `FavoriteModule`).

**Endpoints**:
- `POST /api/v1/favorites` — criar/marcar favorito. Restrito a usuário autenticado. Body: `{ submissionId }` (o `userId` vem do JWT, não do body).
- `GET /api/v1/favorites/my` — listar favoritos do usuário logado, com dados da submissão (title, mainAuthor.name).
- `DELETE /api/v1/favorites/:submissionId` — remover favorito do usuário logado.
- `GET /api/v1/favorites/check/:submissionId` — retorna `{ isFavorite: boolean }` para o usuário logado e a submissão (otimização do frontend para já marcar a estrela ao listar apresentações).

**DTO `CreateFavoriteDto`**:
- `submissionId`: string (UUID), obrigatório.

**Lógica do `FavoriteService`**:
- `create(userId, submissionId)`: faz `upsert` na tabela `Favorite` com chave composta. Idempotente — favoritar duas vezes não erra, retorna 200.
- `remove(userId, submissionId)`: deleta o registro. Se não existe, retorna 204 mesmo assim (idempotente).
- `findByUser(userId)`: retorna lista de favoritos com `submission` populada (include).
- `isFavorite(userId, submissionId)`: retorna boolean.

**Validações**:
- `submissionId` deve referenciar uma submissão existente. Caso contrário, 404.
- Não há restrição de quantos favoritos um usuário pode ter.

**Critérios de aceitação**:
- Testes unitários (mock do repository):
  - Criar favorito válido → 201.
  - Criar favorito duplicado → 200 (upsert, idempotente).
  - Criar favorito com submissionId inexistente → 404.
  - Listar `/my` → retorna apenas favoritos do user do JWT.
  - Remover favorito existente → 204.
  - Remover favorito inexistente → 204 (idempotente).
  - `check` retorna `true` se favorito existe, `false` caso contrário.
  - Acesso sem autenticação a `/my`, `POST` ou `DELETE` → 401.
- `npm run test` passa.

**Dependências**: T-2.12 (Submission), T-2.5 (Auth/JWT).

---

## T-2.21: Endpoint público de Contato

**Descrição**: Implementar o endpoint do formulário de contato da página inicial. Recebe nome/e-mail/mensagem e publica na fila RabbitMQ para envio assíncrono ao coordenador da edição ativa. Cobre spec.md CA-9.1.C.1 a CA-9.1.C.3.

**Arquivos a criar/modificar**:
- `backend/src/contact/contact.module.ts`
- `backend/src/contact/contact.service.ts`
- `backend/src/contact/contact.controller.ts`
- `backend/src/contact/dto/create-contact.dto.ts`
- `backend/src/contact/contact.service.spec.ts`
- `backend/src/app.module.ts` (adicionar `ContactModule`).

**Endpoint**:
- `POST /api/v1/contact` — público (`@Public()`).

**DTO `CreateContactDto`**:
- `name`: string, max 255, obrigatório.
- `email`: string, email válido, obrigatório.
- `message`: string, max 2000, obrigatório.

**Lógica do `ContactService.send`**:
1. Buscar `EventEdition` com `isActive = true`. Se não existir → 503 com mensagem "Formulário indisponível no momento" (CA-9.1.C.2).
2. Buscar `CommitteeMember` da edição ativa com `level = Coordinator`. Se não existir → 503 com mesma mensagem.
3. Resolver e-mail do coordenador via relação `user.email`.
4. Publicar mensagem na fila `email-send` do RabbitMQ com payload:
   ```json
   {
     "to": "<email do coordenador>",
     "from": "<email do remetente>",
     "subject": "Contato via portal — <nome>",
     "body": "<mensagem>",
     "replyTo": "<email do remetente>"
   }
   ```
5. Retornar 202 (Accepted) com `{ message: "Mensagem enviada com sucesso" }`. Não esperar pelo envio real.

**Critérios de aceitação**:
- Testes unitários (mock do PrismaService e MessagingService):
  - Contato válido → publica mensagem e retorna 202.
  - Sem edição ativa → 503.
  - Sem coordenador atribuído → 503.
  - Email inválido no DTO → 400.
  - Mensagem vazia → 400.
- `npm run test` passa.
- Ref spec.md: CA-9.1.C.1, CA-9.1.C.2, CA-9.1.C.3.

**Dependências**: T-2.1 (Messaging), T-2.11 (CommitteeMember).

---

## T-2.22: Seed de desenvolvimento

**Descrição**: Script de seed com dados de teste consistentes. Esta task **resolve o requisito do primeiro professor sem aprovação** (spec.md CA-2.1.1, CA-2.2.1) ao pré-popular o banco com um SuperAdmin já ativo.

**Arquivos a criar/modificar**:
- `backend/prisma/seed.ts`
- `backend/package.json` (adicionar bloco `"prisma": { "seed": "ts-node prisma/seed.ts" }`).

**Dados a criar** (todos com `isActive = true` e `isVerified = true` salvo onde indicado):

**Usuários**:
- **1 Coordenador SuperAdmin** (resolve CA-2.1.1 e CA-2.2.1): nome "Coordenador WEPGCOMP", email `admin@ufba.br`, senha `Admin@1234` (hasheada com bcrypt salt 10), `profile = Professor`, `level = Superadmin`, matrícula `999999`. Este usuário **bypassa o fluxo de aprovação**: já entra ativo e verificado direto no banco. Após o seed, o sistema funciona normalmente — todo professor cadastrado depois desse precisa de aprovação.
- 2 professores ativos verificados (`profile = Professor`, `level = Default`).
- 1 professor pendente (`profile = Professor`, `isActive = false`, `isVerified = true`) — para testar fluxo de aprovação.
- 5 doutorandos (`profile = DoctoralStudent`, `level = Default`).
- 2 ouvintes (`profile = Listener`, `level = Default`).

**EventEdition**:
- 1 edição "WEPGCOMP 2024", `isActive = true`, `startDate` futuro (~30 dias), `endDate` 3 dias após start, `submissionDeadline` 7 dias antes do start.

**EvaluationCriteria** (5 critérios padrão para a edição, conforme T-2.16):
1. Conteúdo
2. Qualidade e Clareza
3. Relevância ao Tema
4. Solução Proposta
5. Resultados

**CommitteeMember** (comissão organizadora com 5 membros):
- O Coordenador SuperAdmin como `level = Coordinator`, `role = Organizer`.
- 4 membros com `level = Committee` distribuídos em roles `Organizer`, `Reviewer`, `Evaluator`.

**Outros**:
- 3 salas (Sala A, Sala B, Sala C) vinculadas à edição.
- 10 submissões com dados variados (diferentes orientadores e doutorandos como mainAuthor).
- 4 blocos de apresentação: 2 sessões de apresentações, 1 palestra (Keynote), 1 coffee break (Break).
- 8 apresentações alocadas em blocos do tipo Presentation.
- 3 painelistas (`Panelist`) atribuídos aos blocos de apresentações, sendo professores ativos.
- 1 Guidance vinculada à edição com texto para autores, avaliadores e audiência.
- 4 favoritos (`Favorite`): cada um dos 2 ouvintes favorita 2 submissões diferentes — útil para validar a tela de Avaliação com favoritos integrada (T-3.14).

**Critérios de aceitação**:
- `npx prisma db seed` executa sem erro.
- Dados consistentes: todas as FKs apontam para registros existentes; enums com valores válidos.
- Login funciona: `POST /api/v1/auth/login` com `admin@ufba.br` / `Admin@1234` retorna 200, seta cookie httpOnly e devolve `user.level = "Superadmin"`.
- Validar via Prisma Studio que não há registros órfãos.
- Idempotência: rodar o seed duas vezes não duplica dados (usar `upsert` por email/id determinísticos).

**Dependências**: T-2.20b, T-2.21 (todas as entidades precisam estar disponíveis para o seed).

---

# FASE 3 — FRONTEND COMPLETO

> **Convenções obrigatórias para todas as tasks desta fase (design.md Seções 7.2, 10, 11):**
>
> - Bootstrap 5 para estilização. Sem Tailwind. CSS modules para customizações.
> - Componentes funcionais com hooks. Sem class components.
> - Chamadas à API centralizadas em `services/`. Uma função por endpoint.
> - TypeScript estrito. Interfaces em `types/`.
> - Antes de implementar qualquer tela, consultar o Figma via MCP: `get_design_context(fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=<nodeId da tela>)`. Converter o output Tailwind → Bootstrap.
> - Cores e tipografia conforme design.md Seção 10 (Design System). Não inventar valores visuais.

---

## T-3.1: Componentes de UI reutilizáveis

**Descrição**: Criar os componentes base do design system.

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=3487:1271`

**Arquivos a criar**:
- `frontend/src/components/ui/Button.tsx` + `Button.module.css`
- `frontend/src/components/ui/Input.tsx` + `Input.module.css`
- `frontend/src/components/ui/Modal.tsx` + `Modal.module.css`
- `frontend/src/components/ui/Card.tsx` + `Card.module.css`
- `frontend/src/components/ui/Navbar.tsx` + `Navbar.module.css`
- `frontend/src/components/ui/HeroBanner.tsx` + `HeroBanner.module.css`
- `frontend/src/components/ui/Tabs.tsx` + `Tabs.module.css`
- `frontend/src/components/ui/Footer.tsx` + `Footer.module.css`
- `frontend/src/components/ui/SearchBar.tsx` + `SearchBar.module.css`
- `frontend/src/components/ui/StarRating.tsx` + `StarRating.module.css`

**Especificações visuais** (design.md Seção 10.3):
- **Button**: variantes `filled`/`outline`, cores `primary-blue` (#0066ba) e `accent-orange` (#ffa90f), pill shape.
- **Input**: borda #aaaaaa, placeholder #7f7f7f, label com asterisco #ff1a25, erro inline vermelho.
- **Modal**: overlay, fundo branco, X canto. Variantes: `success` (#03a61c), `error` (#ff1a25), `confirmation` (botão #ffa90f).
- **Card**: borda #ffa90f, título bold, subtítulo, ações (edição/exclusão/estrela).
- **Navbar**: logo PGCOMP esquerda, links centralizados, login/hamburger direita.
- **HeroBanner**: overlay gradiente #0066ba→#054b75, texto branco.
- **Tabs**: pill buttons, ativa #ffa90f preenchido, inativa outline.
- **Footer**: fundo #2a2a2a, Contato + Local, logos, copyright.
- **SearchBar**: input com lupa #ffa90f.
- **StarRating**: 5 estrelas clicáveis, preenchida #ffa90f, vazia #d4d4d4.

**Critérios de aceitação**:
- Cada componente renderiza sem erro.
- Testes de renderização passam.
- Zero imports de Tailwind.
- `npm run test` passa.

**Dependências**: T-1.5.

---

## T-3.2: AuthContext, serviços de API e ProtectedRoute

**Descrição**: Contexto de autenticação que sincroniza com o backend via cookie httpOnly e endpoint `/auth/me`. Cobre autenticação, autorização condicional (por nível, perfil e visão) e centralização de chamadas à API.

**Arquivos a criar**:
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/components/ProtectedRoute.tsx`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/types/user.ts`
- `frontend/src/types/event-edition.ts`
- `frontend/src/types/submission.ts`
- `frontend/src/types/presentation.ts`
- `frontend/src/types/evaluation.ts`
- `frontend/src/types/certificate.ts`
- `frontend/src/services/auth.service.ts`
- `frontend/src/services/user.service.ts`
- `frontend/src/services/event-edition.service.ts`
- `frontend/src/services/submission.service.ts`
- `frontend/src/services/presentation.service.ts`
- `frontend/src/services/evaluation.service.ts`
- `frontend/src/services/room.service.ts`
- `frontend/src/services/guidance.service.ts`
- `frontend/src/services/committee.service.ts`
- `frontend/src/services/certificate.service.ts`
- `frontend/src/services/panelist.service.ts`

**Lógica do AuthContext**:
- No mount, chamar `GET /api/v1/auth/me`. Se 200, popular `user` (incluindo flag `isCommitteeOfActiveEdition`). Se 401, marcar `isAuthenticated = false`.
- `login(email, password)`: chama `POST /api/v1/auth/login`. O backend seta cookie httpOnly. Em seguida, chama `/auth/me` para popular o user completo.
- `logout()`: chama `POST /api/v1/auth/logout`, limpa state local.
- **Não armazenar token no contexto** — o cookie httpOnly faz isso, e o backend é a única fonte de verdade.
- Axios deve estar configurado com `withCredentials: true` em `services/api.ts` para enviar cookies cross-origin.

**Tipo `User` (em `types/user.ts`)**:
```typescript
export type Profile = 'DoctoralStudent' | 'Professor' | 'Listener';
export type UserLevel = 'Default' | 'Admin' | 'Superadmin';

export interface User {
  id: string;
  name: string;
  email: string;
  profile: Profile;
  level: UserLevel;
  isCommitteeOfActiveEdition: boolean;
}
```

**`ProtectedRoute` props**:
- `requiredLevel?: UserLevel | UserLevel[]` — exige nível ≥ especificado.
- `requiredProfile?: Profile | Profile[]` — exige um dos perfis.
- `requireEditionAdmin?: boolean` — exige `user.isCommitteeOfActiveEdition = true` OU `level = Superadmin`.
- Se nenhuma prop, exige apenas autenticação.
- Falha → redireciona para `/login`.

**Critérios de aceitação**:
- `AuthContext` expõe: `user`, `isAuthenticated`, `isLoading`, `login()`, `logout()`, `register()`, `refresh()` (re-chama `/me`).
- Interceptor Axios: configura `withCredentials: true`. Em 401 redireciona para `/login`.
- `ProtectedRoute` valida com base nas props acima.
- Cada service exporta funções tipadas para os endpoints definidos em design.md Seção 9.2.
- Testes: login → cookie setado pelo backend → user populado via /me; logout limpa state; ProtectedRoute redireciona conforme cada combinação de props; refresh atualiza o flag de visão (caso o user vire Coordenador no meio da sessão).

**Dependências**: T-3.1, T-2.5.

---

## T-3.3: Layout global, Navbar e Footer (com menu por Visão)

**Descrição**: Layout raiz com Navbar e Footer adaptativos. O menu lateral (hamburger) é renderizado conforme a **Visão** do usuário logado. Existem **4 visões** distintas:

| Visão | Quem acessa | Páginas no menu |
|---|---|---|
| **SuperAdministrador** | Usuários com `level = Superadmin` | Sessões, Apresentações, Edição do Evento, Premiação, Usuários |
| **Comissão** | `CommitteeMember` da edição ativa (não-Superadmin) | Sessões, Apresentações, Edição do Evento, Premiação |
| **Aluno(a)/Apresentador(a)** | `profile = DoctoralStudent` | Apresentações (minhas + cadastrar) |
| **Ouvinte/Logado** | `profile = Listener` ou autenticado sem outro papel | Avaliação Ouvinte, Favoritos |

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=3481:1032` (home com navbar pública).

**Arquivos a criar/modificar**:
- `frontend/src/app/layout.tsx`
- `frontend/src/app/(public)/layout.tsx`
- `frontend/src/app/(auth)/layout.tsx`
- `frontend/src/app/(dashboard)/layout.tsx`
- `frontend/src/components/ui/HamburgerMenu.tsx` + `HamburgerMenu.module.css`
- `frontend/src/hooks/useUserView.ts` (deriva a Visão a partir do `user` do AuthContext).

**Lógica do `useUserView`**:
```typescript
// Retorna a visão prioritária do usuário (uma só, mesmo se acumular papéis)
type View = 'public' | 'superadmin' | 'committee' | 'student' | 'listener';

function useUserView(): View {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return 'public';
  if (user.level === 'Superadmin') return 'superadmin';
  if (user.isCommitteeOfActiveEdition) return 'committee'; // backend retorna esse flag no /me
  if (user.profile === 'DoctoralStudent') return 'student';
  return 'listener';
}
```

**Critérios de aceitação**:
- Navbar pública (visão `public`): links Inicio, Programação do Evento, Orientações, Contato, Login.
- Navbar logada: mantém os links públicos + ícone hamburger à direita.
- HamburgerMenu abre dropdown com itens da visão correspondente:
  - **superadmin**: Sessões, Apresentações, Edição do Evento, Premiação, Usuários, Emitir Certificado, Sair.
  - **committee**: Sessões, Apresentações, Edição do Evento, Premiação, Emitir Certificado, Sair.
  - **student**: Apresentações (Minhas), Emitir Certificado, Sair.
  - **listener**: Avaliação, Favoritos, Emitir Certificado, Sair.
- Footer presente em todas as páginas públicas e logadas.
- Logout chama `authService.logout()` que invoca `POST /api/v1/auth/logout` para limpar cookie e redireciona para `/`.
- Testes: renderização do menu para cada uma das 4 visões, item "Sair" funcional.

**Dependências**: T-3.2.

---

## T-3.4: Páginas de autenticação (Login, Cadastro, Reset)

**Figma Login**: `nodeId=3484:1669` | **Figma Cadastro**: `nodeId=3487:1077`

**Arquivos a criar**:
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/app/(auth)/reset-password/page.tsx`

**Critérios de aceitação**:
- **Login**: Email*, Senha*, validação inline, "Esqueceu sua senha?", "Cadastre-se", botão "Entrar" (primary-blue). Redireciona após login.
- **Cadastro**: Nome*, Matrícula*, Email*, Perfil (radio: Doutorando/Professor/Ouvinte), Senha*, Confirmação*. Ouvinte → matrícula opcional. Regras de senha visíveis. Botão "Cadastrar" (accent-orange). Modais sucesso/erro.
- **Reset**: Senha*, Confirmação*, regras. Botão "Enviar" (accent-orange). Modal sucesso/erro.
- Testes: renderização, validação, submissão.

**Dependências**: T-3.3.

---

## T-3.5: Página Pública — Home (Landing Page)

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=3481:1032`

**Arquivos a criar**:
- `frontend/src/app/(public)/page.tsx`
- `frontend/src/app/(public)/home.module.css`

**Seções**: Hero, Programação (abas por dia, grade horária, cards), Orientações (resumo + botão), Organização (comissão), Contato (formulário), Local, Footer.

**Critérios de aceitação**:
- Dados via `eventEditionService.getActive()`.
- Abas de programação alternam dias.
- Todas as seções renderizam.
- Testes: renderização, abas.

**Dependências**: T-3.3.

---

## T-3.6: Página Pública — Orientações

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=3481:1277`

**Arquivos a criar**:
- `frontend/src/app/(public)/orientacoes/page.tsx`

**Critérios de aceitação**:
- Hero "Orientações", abas Autores/Avaliadores/Audiência, conteúdo dinâmico via guidanceService.
- Testes: renderização, abas.

**Dependências**: T-3.5.

---

## Bloco de tasks por Visão

> A partir daqui, as tasks são organizadas por **Visão do usuário** (definidas em T-3.3). Páginas reutilizadas entre visões são implementadas **uma única vez** com guards diferentes — o mesmo componente serve à Comissão (escopo de edição) e ao SuperAdministrador (escopo global). A diferença é apenas o guard que protege a rota.

**Mapeamento de páginas por visão** (referência rápida):

| Página | SuperAdministrador | Comissão | Aluno(a)/Apresentador(a) | Ouvinte/Logado |
|---|---|---|---|---|
| Sessões | ✓ | ✓ | — | — |
| Apresentações (visão admin) | ✓ | ✓ | — | — |
| Edição do Evento | ✓ | ✓ | — | — |
| Premiação | ✓ | ✓ | — | — |
| Usuários | ✓ | — | — | — |
| Apresentações (minhas) | — | — | ✓ | — |
| Avaliação | — | — | — | ✓ |
| Favoritos | — | — | — | ✓ |
| Certificados | ✓ | ✓ | ✓ | ✓ |

---

## T-3.7: Visão SuperAdministrador / Comissão — Página de Sessões

**Visões alvo**: SuperAdministrador e Comissão.

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=2543:732` (Visão Comissão, mesma tela usada pelo SuperAdministrador).

**Descrição**: Tela de gerenciamento de sessões (PresentationBlocks) da edição. Inclui listagem, criação e edição via modal. Reutilizada pelas duas visões — a única diferença é o guard:
- **SuperAdministrador**: rota `/superadmin/sessoes`, guard `@Levels(Superadmin)`.
- **Comissão**: rota `/comissao/sessoes`, guard `@EditionAdmin()`.

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/superadmin/sessoes/page.tsx`
- `frontend/src/app/(dashboard)/comissao/sessoes/page.tsx`
- `frontend/src/components/pages/SessoesPage.tsx` + `SessoesPage.module.css` (componente compartilhado).
- `frontend/src/components/forms/SessaoModal.tsx` + `SessaoModal.module.css`

**Padrão de reuso**: ambas as rotas (`page.tsx`) renderizam o mesmo componente `<SessoesPage />`. A única diferença é o `<ProtectedRoute>` em volta:
- `superadmin/sessoes/page.tsx` → `<ProtectedRoute requiredLevel="Superadmin"><SessoesPage /></ProtectedRoute>`
- `comissao/sessoes/page.tsx` → `<ProtectedRoute requireEditionAdmin><SessoesPage /></ProtectedRoute>`

**Estrutura da página `<SessoesPage />`** (conforme Figma p.13/26):
- HeroBanner "Sessões".
- Botão "Incluir Sessão" (filled `accent-orange`, com +) → abre `SessaoModal` em modo create.
- SearchBar "Pesquise pelo nome da sessão".
- Lista de cards: nome em bold, horário ("08:00 - 09:00"), ícone edição verde, ícone exclusão vermelho à direita.
- Botão "Veja todas as sessões".

**Modal `SessaoModal`** (conforme Figma p.14-15/27-28):
- Radio toggle: "Sessão geral do evento" / "Sessão de apresentações".
- **Modo geral**: Título*, Nome do palestrante, Sala (select), Data/horário início*, Data/horário fim*.
- **Modo apresentações**: Apresentações (multi-select de submissões), Sala* (select), Data/horário início*, Avaliadores (multi-select de professores).
- Botão "Salvar" (filled `accent-orange`).

**Critérios de aceitação**:
- `<SessoesPage />` carrega sessões via `presentationBlockService.getByEdition(activeEditionId)`.
- A edição usada é resolvida automaticamente: para Comissão = edição do `CommitteeMember`; para SuperAdministrador = edição ativa global (com possibilidade de seletor — fora do escopo desta task; usar a edição com `isActive = true`).
- Toggle do modal limpa campos do modo anterior.
- Validação: modo geral exige título e datas; modo apresentações exige sala e início.
- Pré-validação client-side de sobreposição na mesma sala. Erro final fica no backend.
- Submit em modo create chama `presentationBlockService.create()`; modo edit chama `update(id)`.
- Modal de sucesso "Salvo com Sucesso!" verde fecha e atualiza a listagem.
- Exclusão pede confirmação antes de chamar `presentationBlockService.delete()`.
- Testes: renderização da listagem para ambas as visões, abertura de modal nos dois modos, validação, submit, exclusão.

**Dependências**: T-3.3.

---

## T-3.8: Visão SuperAdministrador / Comissão — Página de Apresentações

**Visões alvo**: SuperAdministrador e Comissão.

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=4228:892` (Visão SuperAdministrador) — protótipo p.18/29 (lista) e p.19/30 (modal).

**Descrição**: Tela de gerenciamento administrativo de apresentações (todas as submissões da edição). Reutilizada pelas duas visões:
- **SuperAdministrador**: `/superadmin/apresentacoes`, guard `@Levels(Superadmin)`.
- **Comissão**: `/comissao/apresentacoes`, guard `@EditionAdmin()`.

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/superadmin/apresentacoes/page.tsx`
- `frontend/src/app/(dashboard)/comissao/apresentacoes/page.tsx`
- `frontend/src/components/pages/ApresentacoesAdminPage.tsx` + `ApresentacoesAdminPage.module.css`
- `frontend/src/components/forms/ApresentacaoEditModal.tsx` + `ApresentacaoEditModal.module.css`

**Estrutura `<ApresentacoesAdminPage />`**:
- HeroBanner "Apresentações".
- Botão "Incluir Apresentação" (filled `accent-orange` com +). Abre o cadastro de apresentação (a tela é a mesma usada pelo doutorando — ver T-3.13. O admin pode cadastrar em nome de qualquer usuário).
- SearchBar "Pesquise pelo nome da apresentação".
- Lista de cards: nome (bold), autor abaixo, ícone edição verde.
- Botão "Veja todas as apresentações".

**Modal `<ApresentacaoEditModal />`** (Figma p.19/30):
- Header: "Apresentador: [Nome do autor]" (bold).
- Campos: Tema*, Abstract*, Área de atuação*, Orientador*, Horário, Slide* (PDF, max 10MB), Foto* (JPG, max 10MB).
- Botão "Alterar".

**Critérios de aceitação**:
- Carrega submissões via `submissionService.getByEdition(activeEditionId)`.
- Clique no ícone abre o modal preenchido (`submissionService.getById(id)`).
- Upload validado por tipo e tamanho ≤ 10MB. Erro inline.
- Submit chama `submissionService.update(id, dto)` com `multipart/form-data`.
- Modal de sucesso/erro.
- Testes: listagem por visão, abertura de modal, validação de upload, submit.

**Dependências**: T-3.3.

---

## T-3.9: Visão SuperAdministrador / Comissão — Página de Edição do Evento

**Visões alvo**: SuperAdministrador e Comissão.

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=4228:892` (visão SuperAdministrador) — protótipo p.20/31 (lista) e p.16/32 (formulário).

**Descrição**: Listagem de edições + formulário de criação/edição. Diferenças:
- **SuperAdministrador**: `/superadmin/edicoes` — pode criar novas edições e editar qualquer uma. Guard: `@Levels(Superadmin)`.
- **Comissão**: `/comissao/edicao` — vê apenas a edição ativa (a sua), pode editar mas **não criar nova**. Guard: `@EditionAdmin()`. Botão "Cadastrar Edição" oculto para Comissão.

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/superadmin/edicoes/page.tsx` (listagem completa).
- `frontend/src/app/(dashboard)/superadmin/edicoes/nova/page.tsx` (criação).
- `frontend/src/app/(dashboard)/superadmin/edicoes/[id]/editar/page.tsx` (edição).
- `frontend/src/app/(dashboard)/comissao/edicao/page.tsx` (formulário direto da edição ativa).
- `frontend/src/components/pages/EdicoesListagemPage.tsx` + módulo CSS.
- `frontend/src/components/forms/EdicaoForm.tsx` + módulo CSS.

**Estrutura `<EdicoesListagemPage />`** (apenas SuperAdministrador):
- HeroBanner "Edições do Evento".
- Botão "Cadastrar Edição" (filled `accent-orange`).
- SearchBar.
- Lista de cards: nome bold, datas formatadas em pt-BR ("12 a 14 de novembro de 2024"), ícone de edição verde.
- Botão "Ver todas as edições".

**Estrutura `<EdicaoForm />`** (Figma p.16/32) — usado em `nova`, `editar` e `comissao/edicao`:
- "Nome do evento*" (placeholder "WEPGCOMP 202_").
- "Descrição do evento*" (textarea).
- "Data e horário de início e fim do evento*" (dois date-time pickers).
- "Local do evento*".
- Subseção "Comissão Organizadora" — 5 multi-selects de usuários: Coordenador(a) geral (apenas Professores), Comissão organizadora, Apoio TI, Apoio Administrativo, Comunicação.
- Subseção "Sessões e apresentações": Número de salas, Número de sessões, Duração das apresentações, Texto da chamada, Data limite para a submissão.
- Botão "Salvar" (filled `accent-orange`).

**Validações**:
- `submissionDeadline` ≤ `startDate` (CA-3.1.2). Erro inline.
- `endDate` > `startDate`.
- Coordenador deve ter `profile = Professor`.

**Critérios de aceitação**:
- SuperAdministrador: listagem renderiza, navegar para `nova` abre form em branco; navegar para `[id]/editar` carrega pelo `eventEditionService.getById(id)`.
- Comissão: rota direta abre o form preenchido com os dados da edição que ela administra (resolvido pelo backend via `committeeService.getMyEdition()`).
- Submit em criação chama `create()`, em edição chama `update(id)`.
- Modal de sucesso "Salvo com Sucesso!" redireciona para listagem (SuperAdministrador) ou recarrega o form (Comissão).
- Selects de comissão excluem o usuário já selecionado em Coordenador da comissão geral.
- Testes: listagem (apenas SuperAdministrador), criação, edição, validação de datas, sucesso/erro.

**Dependências**: T-3.3.

---

## T-3.10: Visão SuperAdministrador / Comissão — Página de Premiação

**Visões alvo**: SuperAdministrador e Comissão (ambas com aba "Minhas bancas" para o Coordenador/membros que avaliaram).

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=2543:732` (visão Comissão) — protótipo p.21-25 e p.33-34.

**Descrição**: Tela de visualização das premiações por edição com 3 abas (Banca, Avaliadores, Público). Para professores que avaliaram apresentações, exibe aba adicional "Minhas bancas".

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/superadmin/premiacao/page.tsx`
- `frontend/src/app/(dashboard)/comissao/premiacao/page.tsx`
- `frontend/src/components/pages/PremiacaoPage.tsx` + módulo CSS.
- `frontend/src/components/ui/RankingCard.tsx` + `RankingCard.module.css`.

**Estrutura `<PremiacaoPage />`**:
- HeroBanner "Premiação".
- Tabs (pill buttons): Banca, Avaliadores, Público — e (condicional) "Minhas bancas".
- SearchBar "Pesquise pelo nome da apresentação".
- Título dinâmico por aba: "Melhores Apresentações - Banca" / "- Avaliadores" / "- Público" / "Minhas bancas".
- Subtítulo dinâmico (texto exato da Figma p.21-25).
- Lista ordenada de `<RankingCard>` (nome da apresentação, autor, nota à direita) via `presentationService.getRanking(eventEditionId, type)`.
- **Aba "Minhas bancas"**: cores rotativas por sessão (max 3 cores: verde, laranja, azul). Algoritmo: hash do `presentationBlockId` mod 3.

**Critérios de aceitação**:
- SuperAdministrador: usa `eventEditionId = activeEditionId` (ou seletor de edição — fora desta task).
- Comissão: usa edição do `CommitteeMember`.
- Aba "Minhas bancas" só aparece se o usuário é `Panelist` em algum bloco da edição (validar via `panelistService.getMyPanels(eventEditionId)`).
- Tabs alternam sem refazer fetch (carrega tudo no mount, 4 listas em paralelo).
- Cores por sessão consistentes (mesmo `presentationBlockId` → mesma cor).
- Testes: renderização das 3 abas, busca, aparição condicional da "Minhas bancas", cores por sessão.

**Dependências**: T-3.3.

---

## T-3.11: Visão SuperAdministrador — Página de Usuários

**Visão alvo**: SuperAdministrador (exclusiva).

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=4228:892` — protótipo p.35-36.

**Descrição**: Gerenciamento global de usuários do sistema. Apenas SuperAdministrador acessa esta página. Cobre spec.md CA-1.3.1, CA-1.4.1, CA-2.1.3.

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/superadmin/usuarios/page.tsx`
- `frontend/src/components/pages/UsuariosPage.tsx` + módulo CSS.
- `frontend/src/components/forms/UsuarioStatusModal.tsx` (modal "ATENÇÃO").
- `frontend/src/components/ui/StatusBadge.tsx` + módulo CSS.

**Estrutura** (Figma p.35):
- HeroBanner "Gerenciamento de Usuários".
- SearchBar "Pesquise pelo nome do usuário".
- Botões de filtro toggle: "Ativo" (verde), "Pendente" (laranja), "Inativo" (cinza).
- Texto explicativo (3 linhas) com definições de cada status (texto exato da Figma).
- Lista de cards de usuário: nome, dropdown Status (Ativo/Pendente/Inativo) e dropdown Permissão (Sup Administrador/Administrador/Normal).
- Botão "Salvar" (filled `accent-orange`).

**Modal "ATENÇÃO"** (Figma p.36): texto exato confirmando alteração de permissões/status.

**Critérios de aceitação**:
- ProtectedRoute: `requiredLevel = 'Superadmin'`.
- `userService.getUsers()` carrega lista no mount.
- Alteração de Status/Permissão é local até clicar "Salvar".
- "Salvar" abre `UsuarioStatusModal`. Confirmar dispara `userService.update()` para cada usuário modificado em paralelo.
- Filtros toggle múltiplos: Ativo + Pendente exibe os dois.
- Busca local (sem requisição).
- Testes: listagem, filtros, busca, alteração local, modal de confirmação, persistência em batch.

**Dependências**: T-3.3.

---

## T-3.12: Visão Aluno(a)/Apresentador(a) — Página de Apresentações (Minhas)

**Visão alvo**: Aluno(a)/Apresentador(a) (`profile = DoctoralStudent`).

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=3494:1618` — protótipo p.37.

**Descrição**: Listagem das próprias submissões do doutorando + ponto de entrada para cadastrar nova.

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/aluno/apresentacoes/page.tsx`
- `frontend/src/components/pages/MinhasApresentacoesPage.tsx` + módulo CSS.

**Estrutura** (Figma p.37):
- HeroBanner "Minhas apresentações".
- Botão "Incluir Apresentação" (filled `accent-orange` com +) — navega para `/aluno/apresentacoes/nova` (T-3.13).
- SearchBar "Pesquise pelo nome da apresentação".
- Lista de cards: nome da apresentação + autor abaixo, ícone de edição verde.
- Menu hamburger inclui itens da visão Aluno (definidos em T-3.3).

**Critérios de aceitação**:
- ProtectedRoute: `requiredProfile = 'DoctoralStudent'`.
- `submissionService.getMy()` filtra pelo `mainAuthorId = user.id`.
- Clique no ícone navega para edição da própria submissão.
- Testes: listagem filtrada, busca, navegação.

**Dependências**: T-3.3.

---

## T-3.13: Visão Aluno(a)/Apresentador(a) — Cadastro/Edição de Apresentação

**Visão alvo**: Aluno(a)/Apresentador(a). Também é reutilizado pelas visões SuperAdministrador e Comissão (botão "Incluir Apresentação" em T-3.8).

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=3494:1618` — protótipo p.38-39, 42.

**Descrição**: Formulário de submissão de apresentação. Inclui modal de atenção legal pré-envio e modal de sucesso.

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/aluno/apresentacoes/nova/page.tsx`
- `frontend/src/app/(dashboard)/aluno/apresentacoes/[id]/editar/page.tsx`
- `frontend/src/components/forms/ApresentacaoSubmissaoForm.tsx` + módulo CSS.
- `frontend/src/components/forms/SubmissaoAvisoModal.tsx` (modal "ATENÇÃO" pré-envio).

**Estrutura do formulário** (Figma p.38):
- Title: "Cadastro de Apresentação".
- Indicador de etapa "1 2 3" no canto direito (visual; nesta versão é um único form sem multi-step real).
- Campos: Tema*, Abstract*, Orientador*, Co-orientador, Sugestão de data e horário, Slide* (PDF, max 10MB), Telefone, LinkedIn, Foto* (JPG, max 10MB).
- Botão "Cadastrar" (filled `accent-orange`).

**Modal de atenção** (Figma p.39): texto exato sobre possível mudança de horário pela comissão. Botão "Enviar".

**Modal de sucesso** (Figma p.42): "Apresentação cadastrada!" verde.

**Validações**:
- Submissão após `submissionDeadline` da edição ativa → erro "Período de submissão encerrado em [data]".
- Tamanho de upload: ≤ 10MB cada arquivo.

**Critérios de aceitação**:
- ProtectedRoute: autenticado (qualquer perfil pode submeter — admins criam em nome de outros).
- Submit chama `SubmissaoAvisoModal`. Confirmar chama `submissionService.create(dto)` com multipart.
- Sucesso → modal verde → redireciona para `/aluno/apresentacoes`.
- Modo edição: carrega submissão existente; modo criação: form vazio.
- Testes: form, validação de deadline, upload, modal de aviso, sucesso.

**Dependências**: T-3.12.

---

## T-3.14: Visão Ouvinte/Logado — Página de Avaliação (com Favoritos integrados)

**Visão alvo**: Ouvinte/Logado (e qualquer outro perfil autenticado quando a edição permite votação para logados).

**Figma**: `fileKey=ifvnGnKjMY5iByhodj0fUW, nodeId=3494:2610` — protótipo p.40-41 (formulário de avaliação) e p.43 (visão de favoritos).

**Descrição**: Página única que combina (a) listagem de apresentações da edição ativa, (b) formulário de avaliação com 5 estrelas por critério e (c) **gestão integrada de favoritos**: a estrela de favorito é parte do mesmo card que abre a avaliação, e existe um filtro/aba "Apenas favoritos" para listar somente o que foi favoritado.

**Não há tela separada de Favoritos.** Favoritar é uma ação inline (toggle na estrela do card) e listar favoritos é um filtro nesta mesma tela. Cobre spec.md Seção 6.

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/ouvinte/avaliacao/page.tsx` (listagem com filtro de favoritos).
- `frontend/src/app/(dashboard)/ouvinte/avaliacao/[submissionId]/page.tsx` (formulário de avaliação por apresentação).
- `frontend/src/components/pages/AvaliacaoListagemPage.tsx` + `AvaliacaoListagemPage.module.css`.
- `frontend/src/components/pages/AvaliacaoFormPage.tsx` + `AvaliacaoFormPage.module.css`.
- `frontend/src/components/ui/FavoriteToggle.tsx` + `FavoriteToggle.module.css` (componente de estrela com estado on/off).
- `frontend/src/services/favorite.service.ts` + `frontend/src/types/favorite.ts`.

**Estrutura `<AvaliacaoListagemPage />`** (rota `/ouvinte/avaliacao`):
- HeroBanner "Avaliação" (foto Salvador, gradient overlay).
- Tabs (pill buttons `accent-orange`): "Todas as apresentações" | "Apenas favoritos". A aba ativa controla o filtro da listagem.
- SearchBar "Pesquise pelo nome da apresentação" (filtro client-side por título).
- Lista de cards (Figma p.43 para visual): nome da apresentação (bold), nome do autor abaixo, **ícone de estrela à direita** (`<FavoriteToggle>`). Clique no corpo do card → navega para `/ouvinte/avaliacao/[submissionId]`. Clique na estrela → toggla favorito (não navega).
- Aba "Apenas favoritos" usa `favoriteService.getMy()`. Aba "Todas" usa `submissionService.getByEdition(activeEditionId)` e marca as estrelas conforme `favoriteService.checkBatch(submissionIds)` (chamada em paralelo no mount).

**Estrutura `<FavoriteToggle />`**:
- Props: `submissionId: string`, `initialIsFavorite: boolean`, `onChange?: (next: boolean) => void`.
- Renderiza estrela vazia (`#d4d4d4`) ou preenchida (`#ffa90f` dourada) conforme estado interno.
- Clique: atualização otimista (atualiza UI antes da resposta) + chama `favoriteService.create()` ou `favoriteService.remove()`. Se a chamada falhar, reverte o estado local e exibe toast de erro.

**Estrutura `<AvaliacaoFormPage />`** (rota `/ouvinte/avaliacao/[submissionId]`, Figma p.40):
- HeroBanner "Avaliação".
- Card destacado: avatar placeholder, nome do apresentador (bold), título da pesquisa. Borda `accent-orange`. **No canto direito do card**, `<FavoriteToggle />` com o mesmo `submissionId` — mantém consistência com a listagem.
- Para cada `EvaluationCriteria` da edição: pergunta como label e `<StarRating />` (5 estrelas) abaixo, centralizado. As perguntas exibidas vêm da API (`evaluationCriteriaService.getByEdition`), e no seed são as 5 padrão (Conteúdo, Qualidade e Clareza, Relevância ao Tema, Solução Proposta, Resultados).
- Botão "Enviar" (filled `accent-orange`).

**Lógica do submit do formulário**:
- Para cada critério com score selecionado: chamar `evaluationService.create({submissionId, evaluationCriteriaId, score})`. Aguardar todas as Promises com `Promise.allSettled`.
- Se todas com sucesso → modal "Avaliação enviada" (verde, Figma p.41) → redireciona para listagem.
- Se alguma falhar → modal "Algo deu errado!" com botão "Tentar novamente" (re-tenta apenas as que falharam).

**Critérios de aceitação**:
- Se a edição ativa tem `isEvaluationRestrictToLoggedUsers = true`: ambas as rotas (`/ouvinte/avaliacao` e `/ouvinte/avaliacao/[submissionId]`) exigem autenticação via `ProtectedRoute`.
- Se `false`: rotas são acessíveis sem login, mas o `<FavoriteToggle />` é **escondido** quando não autenticado (favoritar exige login).
- Tabs "Todas" / "Apenas favoritos" funcionam independente de busca (compõem filtros).
- Toggle de favorito é otimista: estrela muda imediatamente; em caso de erro de rede, volta ao estado anterior e exibe toast.
- Validar que **todas** as estrelas dos critérios estão preenchidas antes de habilitar o botão "Enviar". Se alguma falta, exibir mensagem inline "Selecione uma nota para todos os critérios".
- Modal de sucesso fecha após 2 segundos OU pelo X.
- Aba "Apenas favoritos" sem favoritos → estado vazio com texto "Você ainda não favoritou nenhuma apresentação. Favorite clicando na estrela dos cards da aba 'Todas as apresentações'".
- Testes:
  - Listagem renderiza cards com estrelas marcadas conforme favoritos do user.
  - Toggle otimista da estrela.
  - Toggle com erro de rede reverte o estado.
  - Tab "Apenas favoritos" filtra corretamente.
  - SearchBar filtra dentro da aba ativa.
  - Formulário renderiza N critérios.
  - Submit bloqueado se faltar estrela.
  - Submit com sucesso (todas as Promises).
  - Submit com erro parcial (1 falha de N).
  - `FavoriteToggle` no card do formulário sincroniza com o da listagem (re-render via reload ou via state global).

**Dependências**: T-3.3, T-2.20b (Favorites backend), T-2.17 (Evaluation backend).

---

## T-3.15: Página de Certificados (todas as visões logadas)

**Visões alvo**: SuperAdministrador, Comissão, Aluno, Ouvinte (com comportamentos diferentes).

**Descrição**: Tela única adaptativa por perfil. SuperAdministrador dispara geração; Comissão acompanha envio da sua edição; demais usuários veem e baixam os seus.

**Arquivos a criar**:
- `frontend/src/app/(dashboard)/certificados/page.tsx`
- `frontend/src/components/pages/CertificadosPage.tsx` + módulo CSS.

**Estrutura por visão**:

- **SuperAdministrador**:
  - Select da edição alvo.
  - Botão "Gerar Certificados" → chama `certificateService.generate(eventEditionId)`.
  - Tabela: Nome do usuário, Tipo de participação, Status (Enviado/Pendente).

- **Comissão**:
  - Igual ao SuperAdministrador, mas restrito à edição que coordena (sem select).

- **Aluno e Ouvinte**:
  - Lista de cards: nome da edição, data, botão "Baixar" → `certificateService.download(certificateId)`.

**Critérios de aceitação**:
- ProtectedRoute: autenticado.
- View renderizada via condicional baseada em `useUserView()`.
- Botão "Gerar" exibe loading e modal de sucesso.
- Download usa download forçado (anchor com atributo `download`).
- Testes: renderização condicional, geração (mock), download.

**Dependências**: T-3.3.

---

## T-3.16: Frontend — Submissão do Formulário de Contato (integração)

**Descrição**: A Home (T-3.5) já contém o painel "Contato" com formulário. Esta task integra o submit ao endpoint `POST /api/v1/contact` (T-2.21).

**Arquivos a criar/modificar**:
- `frontend/src/app/(public)/page.tsx` (atualizar componente de Contato).
- `frontend/src/services/contact.service.ts` (novo).
- `frontend/src/types/contact.ts` (novo).

**Critérios de aceitação**:
- `contactService.send({name, email, message})` chama `POST /api/v1/contact`.
- Validação client: nome, email válido, mensagem não vazia.
- Resposta 202 → modal "Salvo com Sucesso!" (verde) e limpa o formulário.
- Resposta 503 → modal "Algo deu errado!" com texto "Formulário indisponível no momento. Tente mais tarde.".
- Resposta 400 → validações inline nos campos.
- Testes: validação, sucesso, erro 503, erro 400.

**Dependências**: T-3.5, T-2.21.

---

# FASE 4 — DEPLOY E DOCUMENTAÇÃO

---

## T-4.1: Dockerfile do backend

**Arquivos a criar**:
- `backend/Dockerfile`
- `backend/.dockerignore`

**Critérios de aceitação**:
- Multi-stage: build (node:20-alpine) → production (node:20-alpine, dist/, prisma/).
- `docker build` e `docker run` funcionam.

**Dependências**: T-2.21.

---

## T-4.2: Deploy do frontend na Vercel

**Arquivos a criar**:
- `frontend/.env.production.example`

**Critérios de aceitação**:
- `npm run build` sem erro.
- Variáveis documentadas.
- Deploy funcional.

**Dependências**: T-3.14.

---

## T-4.3: Documentação final (README)

**Arquivos a modificar**:
- `README.md`

**Critérios de aceitação**:
- Instruções de setup local (Docker, .env, seed), deploy (Docker, Vercel), variáveis de ambiente, comandos disponíveis.

**Dependências**: T-4.1, T-4.2.

---

# FASE 5 — FORA DE ESCOPO (NÃO IMPLEMENTAR)

> Esta fase **não contém tasks executáveis**. Lista os critérios marcados como `[NÃO-ESSENCIAL]` no spec.md que **não devem ser implementados** neste projeto. O agente **NÃO deve** começar nenhum desses itens, mesmo que pareçam óbvios ou rápidos. Caso o desenvolvedor queira incluir algum no futuro, será criada uma task explícita autorizada.

## Itens fora de escopo (do spec.md)

- **CA-1.3.3 a CA-1.3.5**: painel de cadastros reprovados, reabilitar reprovados, bloqueio de e-mail por 7 dias.
- **CA-3.1.3**: validação de unicidade de nome de evento.
- **CA-3.2.4 a CA-3.2.5**: deleção em cascata e relógio de contagem regressiva.
- **CA-4.1.3**: link único e expirável para upload externo.
- **CA-4.1.4**: notificação por e-mail ao orientador na submissão.
- **CA-4.2.3**: marca d'água no PDF.
- **CA-4.2.4**: extração automática de metadados do PDF.
- **CA-4.3.5**: histórico de alterações da submissão (audit trail).
- **CA-5.1.5**: atribuição automática da última sessão para anúncio das premiações.
- **CA-5.1.6**: confirmação por e-mail dos painelistas.
- **CA-5.1.9**: detecção de conflito de horário entre sessão e disponibilidade do painelista.
- **CA-6.1.3 a CA-6.1.5**: anonimização da avaliação, bloqueio de auto-avaliação, descarte de votos não-logados.
- **CA-7.1.5**: sinal visual de premiação na página da apresentação.
- **CA-8.1.9**: assinaturas digitais.
- **CA-9.1.X (mapa do local)**: mapa interativo do local do evento.
- **CA-9.2.X (página de detalhes da apresentação)**: overlay com detalhes completos da apresentação.

## Política

- Se durante a implementação de uma task essencial o agente identificar que um item desta lista **bloqueia a entrega**, deve **parar e perguntar** ao desenvolvedor antes de implementar — conforme regra #9 do CLAUDE.md.
- Não há renumeração: estes itens permanecem com a numeração `CA-X.X.X` original do spec.md, apenas marcados como `[NÃO-ESSENCIAL]`.
- A reativação de qualquer item desta fase exige criar uma task formal (ex: `T-5.1: Implementar audit trail de submissões`) com todos os critérios de aceite detalhados, antes da implementação.

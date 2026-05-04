# design.md — Decisões de Arquitetura e Design

> Este documento descreve as decisões técnicas do projeto. O agente deve consultá-lo antes de criar qualquer arquivo, módulo ou configuração. Nenhuma decisão arquitetural deve ser inventada — se não está aqui, pergunte.
>
> **Para instruções operacionais** (design system, MCP, regras de comportamento do agente), consultar o `CLAUDE.md`.

---

## 1. Visão Geral da Arquitetura

O sistema segue uma arquitetura **cliente-servidor** com separação clara entre frontend e backend, comunicando-se exclusivamente via REST API. O projeto adota estrutura **monorepo** com duas aplicações principais:

```
/
├── frontend/          # Next.js (React)
├── backend/           # NestJS (Node.js)
├── docker-compose.yml
├── spec.md
├── design.md
├── tasks.md
└── CLAUDE.md
```

---

## 2. Stack Tecnológica

### 2.1. Frontend

| Tecnologia | Versão mínima | Finalidade |
|---|---|---|
| Next.js | 14+ | Framework React com SSR/SSG e roteamento por App Router |
| React | 18+ | Biblioteca de UI |
| Bootstrap | 5.3+ | Sistema de grid, componentes e estilização |
| Axios | 1+ | Cliente HTTP para chamadas REST ao backend |
| Jest | 29+ | Testes unitários e de integração |
| ESLint | 8+ | Linting |
| Prettier | 3+ | Formatação de código |

### 2.2. Backend

| Tecnologia | Versão mínima | Finalidade |
|---|---|---|
| Node.js | 20 LTS | Runtime |
| NestJS | 10+ | Framework backend com arquitetura modular |
| Express | — | Middleware HTTP (via NestJS) |
| Prisma | 5+ | ORM e migrações de banco de dados |
| PostgreSQL | 15+ | Banco de dados relacional |
| JWT (jsonwebtoken / @nestjs/jwt) | — | Autenticação stateless |
| bcrypt | — | Hash de senhas |
| CloudAMQP / RabbitMQ | — | Mensageria assíncrona (envio de e-mails, certificados) |
| pdfkit | 0.15+ | Geração de certificados em PDF (módulo Certificate) |
| cookie-parser | — | Parsing de cookies httpOnly (autenticação JWT via cookie) |
| multer / @nestjs/platform-express | — | Upload de arquivos (PDF, JPG) com validação de tamanho |

### 2.3. Infraestrutura e CI/CD

| Tecnologia | Finalidade |
|---|---|
| Docker | Containerização (backend + PostgreSQL + RabbitMQ) |
| Docker Compose | Orquestração local do ambiente de desenvolvimento |
| GitHub | Versionamento e repositório remoto |
| Vercel | Deploy do frontend |
| CodeQL | Análise estática de qualidade e segurança |

---

## 3. Arquitetura do Backend (NestJS)

### 3.1. Camadas

O backend segue o padrão de **três camadas** do NestJS:

```
Request → Controller → Service → Repository (Prisma) → PostgreSQL
```

- **Controller**: recebe a requisição HTTP, valida o payload (DTOs + class-validator), delega ao Service e retorna a resposta. Não contém lógica de negócio.
- **Service**: contém toda a lógica de negócio. Orquestra chamadas ao Repository e a outros Services quando necessário. Lança exceções de domínio.
- **Repository**: encapsula o acesso ao Prisma. Cada entidade tem seu próprio Repository. Nenhum outro lugar do código chama `prisma.model.*` diretamente.

### 3.2. Organização de Módulos

Cada domínio do sistema é um módulo NestJS independente:

```
backend/src/
├── app.module.ts
├── common/                  # Guards, interceptors, decorators, filtros globais
│   ├── guards/
│   ├── interceptors/
│   ├── decorators/
│   └── filters/
├── auth/                    # Módulo de autenticação
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/          # JWT strategy, Local strategy
│   └── dto/
├── user/
│   ├── user.module.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.repository.ts
│   └── dto/
├── event-edition/
│   ├── event-edition.module.ts
│   ├── event-edition.controller.ts
│   ├── event-edition.service.ts
│   ├── event-edition.repository.ts
│   └── dto/
├── submission/
│   ├── submission.module.ts
│   ├── submission.controller.ts
│   ├── submission.service.ts
│   ├── submission.repository.ts
│   └── dto/
├── evaluation/
│   ├── evaluation.module.ts
│   ├── evaluation.controller.ts
│   ├── evaluation.service.ts
│   ├── evaluation.repository.ts
│   └── dto/
├── presentation/
│   ├── presentation.module.ts
│   ├── presentation.controller.ts
│   ├── presentation.service.ts
│   ├── presentation.repository.ts
│   └── dto/
├── room/
├── certificate/
├── committee/
├── guidance/
├── messaging/               # Integração com RabbitMQ
│   ├── messaging.module.ts
│   └── messaging.service.ts
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

### 3.3. Convenções do Backend

- **Nomenclatura de arquivos**: `kebab-case` (ex: `event-edition.service.ts`).
- **Nomenclatura de classes**: `PascalCase` (ex: `EventEditionService`).
- **DTOs**: um `CreateXDto` e um `UpdateXDto` por entidade, validados com `class-validator`.
- **Respostas HTTP**: seguem o padrão REST. Criação retorna `201`, leitura `200`, deleção `204`. Erros usam `HttpException` do NestJS com códigos semânticos (`400`, `401`, `403`, `404`, `409`).
- **Variáveis de ambiente**: gerenciadas via `@nestjs/config` com arquivo `.env`. Nenhum valor sensível hardcoded.

---

## 4. Modelo de Dados (Prisma)

### 4.1. Enums

```prisma
enum Profile {
  DoctoralStudent
  Professor
  Listener

  @@map("profile")
}

enum UserLevel {
  Superadmin
  Admin
  Default

  @@map("user_level")
}

enum SubmissionStatus {
  Submitted
  UnderReview
  Accepted
  Rejected
  Withdrawn
}

enum PresentationBlockType {
  Presentation
  Keynote
  Break
  Other
}

enum PresentationStatus {
  Scheduled
  Completed
  Cancelled
}

enum PanelistStatus {
  Confirmed
  Declined
  Pending
}

enum CommitteeLevel {
  Committee
  Coordinator

  @@map("committee_level")
}

enum CommitteeRole {
  Organizer
  Reviewer
  Evaluator
}
```

### 4.2. Entidades

```prisma
model UserAccount {
  id                 String              @id @default(uuid())
  name               String              @db.VarChar(255)
  email              String              @unique @db.VarChar(255)
  password           String              @db.VarChar(255)
  registrationNumber String?             @unique @db.VarChar(20)
  photoFilePath      String?             @db.VarChar(255)
  profile            Profile             @default(DoctoralStudent)
  level              UserLevel           @default(Default)
  isActive           Boolean             @default(true)
  isVerified         Boolean             @default(false)
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  emailVerification  EmailVerification?
  advisedSubmissions Submission[]        @relation("Advisor")
  authoredSubmissions Submission[]       @relation("MainAuthor")
  evaluations        Evaluation[]
  panelists          Panelist[]
  awardedPanelists   AwardedPanelist[]
  committeeMembers   CommitteeMember[]
  certificates       Certificate[]
  favorites          Favorite[]
}

model EmailVerification {
  id                        String    @id @default(uuid())
  userId                    String    @unique
  emailVerificationToken    String?   @unique
  emailVerifiedAt           DateTime?
  emailVerificationSentAt   DateTime?
  createdAt                 DateTime  @default(now())
  updatedAt                 DateTime  @updatedAt

  user UserAccount @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model EventEdition {
  id                                  String    @id @default(uuid())
  name                                String    @db.VarChar(255)
  description                         String    @db.Text
  callForPapersText                   String    @db.Text
  partnersText                        String    @db.Text
  location                            String    @db.Text
  startDate                           DateTime
  endDate                             DateTime
  submissionStartDate                 DateTime
  submissionDeadline                  DateTime
  isActive                            Boolean   @default(false)
  isEvaluationRestrictToLoggedUsers   Boolean   @default(true)
  presentationDuration                Int       @default(20)
  presentationsPerPresentationBlock   Int       @default(6)
  createdAt                           DateTime  @default(now())
  updatedAt                           DateTime  @updatedAt

  submissions        Submission[]
  evaluationCriteria EvaluationCriteria[]
  rooms              Room[]
  presentationBlocks PresentationBlock[]
  committeeMembers   CommitteeMember[]
  certificates       Certificate[]
  awardedPanelists   AwardedPanelist[]
  guidance           Guidance?
}

model Submission {
  id                            String           @id @default(uuid())
  advisorId                     String
  mainAuthorId                  String
  eventEditionId                String
  title                         String           @db.VarChar(255)
  abstract                      String           @db.Text
  pdfFile                       String           @db.VarChar(255)
  phoneNumber                   String           @db.VarChar(20)
  proposedPresentationBlockId   String?          @map("proposed_presentation_block_id")
  proposedPositionWithinBlock   Int?
  coAdvisor                     String?          @db.VarChar(255)
  status                        SubmissionStatus @default(Submitted)
  createdAt                     DateTime         @default(now())
  updatedAt                     DateTime         @updatedAt

  advisor                    UserAccount        @relation("Advisor", fields: [advisorId], references: [id])
  mainAuthor                 UserAccount        @relation("MainAuthor", fields: [mainAuthorId], references: [id])
  eventEdition               EventEdition       @relation(fields: [eventEditionId], references: [id])
  proposedPresentationBlock  PresentationBlock? @relation("ProposedBlock", fields: [proposedPresentationBlockId], references: [id])
  evaluations                Evaluation[]
  presentation               Presentation?
  favorites                  Favorite[]
}

model EvaluationCriteria {
  id             String       @id @default(uuid())
  eventEditionId String
  title          String       @db.VarChar(255)
  description    String       @db.Text
  weightRadio    Float?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  eventEdition EventEdition @relation(fields: [eventEditionId], references: [id])
  evaluations  Evaluation[]
}

model Evaluation {
  id                   String   @id @default(uuid())
  userId               String?
  evaluationCriteriaId String
  submissionId         String
  score                Float
  comments             String?  @db.Text
  name                 String?  @db.VarChar(255)
  email                String?  @db.VarChar(255)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user               UserAccount?       @relation(fields: [userId], references: [id])
  evaluationCriteria EvaluationCriteria @relation(fields: [evaluationCriteriaId], references: [id])
  submission         Submission         @relation(fields: [submissionId], references: [id])
}

model Room {
  id             String   @id @default(uuid())
  eventEditionId String
  name           String   @db.VarChar(255)
  description    String?  @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  eventEdition       EventEdition        @relation(fields: [eventEditionId], references: [id])
  presentationBlocks PresentationBlock[]
}

model PresentationBlock {
  id             String                @id @default(uuid())
  eventEditionId String
  roomId         String?
  type           PresentationBlockType
  title          String?               @db.VarChar(255)
  speakerName    String?               @db.VarChar(255)
  startTime      DateTime
  duration       Int
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt

  eventEdition         EventEdition   @relation(fields: [eventEditionId], references: [id])
  room                 Room?          @relation(fields: [roomId], references: [id])
  presentations        Presentation[]
  panelists            Panelist[]
  proposedSubmissions  Submission[]   @relation("ProposedBlock")
}

model Presentation {
  id                     String             @id @default(uuid())
  submissionId           String             @unique
  presentationBlockId    String
  positionWithinBlock    Int
  status                 PresentationStatus @default(Scheduled)
  publicAverageScore     Float?
  evaluatorsAverageScore Float?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt

  submission        Submission        @relation(fields: [submissionId], references: [id])
  presentationBlock PresentationBlock @relation(fields: [presentationBlockId], references: [id])
}

model Panelist {
  id                  String        @id @default(uuid())
  presentationBlockId String
  userId              String
  status              PanelistStatus @default(Confirmed)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  presentationBlock PresentationBlock @relation(fields: [presentationBlockId], references: [id])
  user              UserAccount       @relation(fields: [userId], references: [id])
}

model AwardedPanelist {
  eventEditionId String
  userId         String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  eventEdition EventEdition @relation(fields: [eventEditionId], references: [id])
  user         UserAccount  @relation(fields: [userId], references: [id])

  @@id([eventEditionId, userId])
}

model CommitteeMember {
  id             String         @id @default(uuid())
  eventEditionId String
  userId         String
  level          CommitteeLevel
  role           CommitteeRole
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  eventEdition EventEdition @relation(fields: [eventEditionId], references: [id])
  user         UserAccount  @relation(fields: [userId], references: [id])

  @@unique([eventEditionId, userId])
}

model Certificate {
  id             String   @id @default(uuid())
  eventEditionId String
  userId         String
  filePath       String
  isEmailSent    Boolean  @default(false)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  eventEdition EventEdition @relation(fields: [eventEditionId], references: [id])
  user         UserAccount  @relation(fields: [userId], references: [id])
}

model Guidance {
  id               String   @id @default(uuid())
  eventEditionId   String   @unique
  summary          String?  @db.Text
  authorGuidance   String?  @db.Text
  reviewerGuidance String?  @db.Text
  audienceGuidance String?  @db.Text
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  eventEdition EventEdition @relation(fields: [eventEditionId], references: [id])
}

model Favorite {
  userId       String
  submissionId String
  createdAt    DateTime @default(now())

  user       UserAccount @relation(fields: [userId], references: [id], onDelete: Cascade)
  submission Submission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)

  @@id([userId, submissionId])
  @@map("favorite")
}
```

> **Nota sobre Favorite**: este modelo dá suporte ao recurso de favoritar apresentações na Visão Ouvinte/Logado (T-3.14). Trata-se de uma relação muitos-para-muitos entre `UserAccount` e `Submission`, com chave primária composta. A operação semântica é binária (favoritado ou não), persistida no servidor para que o usuário recupere a lista após login em qualquer dispositivo.

---

## 5. Autenticação e Autorização

### 5.1. Fluxo de Autenticação

1. Usuário envia `POST /auth/login` com `{ email, password }`.
2. Backend valida credenciais: busca o `UserAccount` por email, compara a senha com `bcrypt.compare()`.
3. Se válido, gera um JWT contendo `{ sub: userId, profile, level }` e retorna ao cliente.
4. Cliente armazena o token e o envia em todas as requisições subsequentes no header `Authorization: Bearer <token>`.
5. O `JwtAuthGuard` global intercepta rotas protegidas, valida o token e injeta o usuário no `request`.

### 5.2. Registro e Verificação de E-mail

1. Usuário se registra via `POST /auth/register`. A senha é hasheada com `bcrypt` (salt rounds: 10).
2. Um registro `EmailVerification` é criado com um token único.
3. Uma mensagem é publicada no RabbitMQ para envio assíncrono do e-mail de verificação.
4. O usuário confirma via `GET /auth/verify-email?token=<token>`, que marca `isVerified = true`.

### 5.3. Controle de Acesso

- Rotas públicas são decoradas com `@Public()`.
- Rotas protegidas exigem JWT válido (comportamento padrão via guard global).
- Autorização por perfil/nível usa guards customizados.

### 5.4. Distinção entre "Admin Permanente" e "Admin da Edição"

O sistema possui **dois conceitos diferentes** de "Administrador" que não devem ser confundidos:

**1. Admin permanente** — atributo do `UserAccount.level`:
- Valores possíveis: `Default`, `Admin`, `Superadmin`.
- Persiste indefinidamente, independente de qualquer edição do evento.
- Verificado pelo guard `@Levels(UserLevel.Admin)` ou `@Levels(UserLevel.Superadmin)`.
- Atribuído manualmente por um Admin existente (ou automaticamente para o primeiro professor — ver spec.md CA-2.1.1).

**2. Admin da edição** — derivado de `CommitteeMember`:
- Qualquer usuário registrado em `CommitteeMember` para uma edição com `isActive = true` e `endDate` futuro é "admin daquela edição".
- Efêmero: expira quando a edição termina ou é desativada.
- Verificado pelo guard customizado `@EditionAdmin()` (definido em `common/guards/edition-admin.guard.ts`).
- Atribuído via `POST /api/v1/committee-members`.

**Regra prática**:
- Para operações **transversais ao sistema** (criar nova edição, gerenciar usuários globalmente, atribuir SuperAdmin) → use `@Levels(UserLevel.Admin)` ou `@Levels(UserLevel.Superadmin)`.
- Para operações **dentro de uma edição específica** (gerenciar sessões, apresentações, painelistas da edição) → use `@EditionAdmin()`. Esse guard recebe `eventEditionId` (do body, query ou param) e verifica se o usuário do JWT é membro da comissão dessa edição (e a edição está ativa).
- Coordenador é caso especial: é `CommitteeMember` com `level = Coordinator` da edição **e** ganha `level = Superadmin` permanente automaticamente (spec.md CA-2.2.4).

### 5.5. Decorators e Guards

- `@Public()` — marca rota como pública (sem JWT).
- `@Roles(Profile.Professor)` — restringe por perfil do usuário.
- `@Levels(UserLevel.Admin)` — restringe por nível permanente.
- `@EditionAdmin()` — restringe a admins da edição em curso (uso descrito em 5.4).
- `@CurrentUser()` — injeta o usuário do JWT no parâmetro do controller.
- `JwtAuthGuard` é global (`APP_GUARD`). Todas as rotas são protegidas por padrão; `@Public()` é a exceção.

---

## 6. Armazenamento de Arquivos

O sistema persiste arquivos enviados por usuários (PDFs de submissões, slides, fotos de apresentadores, certificados gerados) no **filesystem local** do container backend, com **bind mount** no Docker para persistência entre deploys e reinícios.

### 6.1. Estrutura de pastas

```
backend/uploads/
├── submissions/
│   └── {submissionId}/
│       └── paper.pdf
├── slides/
│   └── {submissionId}/
│       └── slides.pdf
├── photos/
│   └── {userId}/
│       └── photo.jpg
└── certificates/
    └── {eventEditionId}/
        └── {userId}.pdf
```

### 6.2. Configuração no Docker Compose

O serviço `backend` no `docker-compose.yml` deve declarar bind mount:

```yaml
backend:
  volumes:
    - ./backend/uploads:/app/uploads
```

O caminho dentro do container é `/app/uploads`, configurável via variável `UPLOAD_DIR` no `.env`.

### 6.3. Limites e validação

- Tamanho máximo por arquivo: **10MB** (validado no controller via interceptor de tamanho do Multer).
- Formatos aceitos: PDF para papers/slides, JPG/JPEG/PNG para fotos.
- Nome do arquivo armazenado: gerado pelo backend (UUID) — o nome original do upload é descartado.
- Caminho relativo é salvo no banco (ex: `submissions/{id}/paper.pdf`); o backend resolve o caminho absoluto na hora de servir.

### 6.4. Endpoints de upload e download

- Upload: parte das rotas de criação/atualização (ex: `POST /api/v1/submissions` aceita `multipart/form-data`).
- Download: `GET /api/v1/files/{tipo}/{id}` autenticado, com checagem de autorização por owner ou admin.

### 6.5. Limitação conhecida (TCC)

Filesystem local é apropriado para o escopo do TCC. Para produção em escala (múltiplas instâncias, deploy em Vercel/serverless), seria necessário migrar para um object storage (S3, Cloudinary). Essa migração é fora do escopo do trabalho.

---

## 7. Mensageria (RabbitMQ)

O RabbitMQ é utilizado para operações assíncronas que não devem bloquear a resposta HTTP:

- **Envio de e-mails**: verificação de conta, notificações de submissão, envio de certificados.
- **Geração de certificados**: processamento em background após conclusão do evento.

O módulo `messaging/` encapsula toda a lógica de publicação. O agente não deve usar RabbitMQ diretamente fora deste módulo.

Conexão via CloudAMQP, configurada por variável de ambiente `CLOUDAMQP_URL`.

---

## 8. Arquitetura do Frontend (Next.js)

### 8.1. Estrutura de Pastas

```
frontend/src/
├── app/                     # App Router (Next.js 14+)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── (auth)/              # Rotas de autenticação
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Rotas protegidas
│   │   ├── events/
│   │   ├── submissions/
│   │   ├── evaluations/
│   │   └── certificates/
│   └── (public)/            # Rotas públicas do evento
├── components/
│   ├── ui/                  # Componentes reutilizáveis (botões, modais, tabelas)
│   └── forms/               # Componentes de formulário
├── hooks/                   # Custom hooks
├── services/                # Chamadas à API (Axios)
├── contexts/                # Context API (auth, event)
├── types/                   # Interfaces TypeScript
└── utils/                   # Funções utilitárias
```

### 8.2. Convenções do Frontend

- **Estilização**: Bootstrap 5 via classes utilitárias. Sem CSS-in-JS, sem Tailwind. CSS customizado apenas quando Bootstrap não resolver, em arquivos `.module.css`.
- **Estado global**: Context API para autenticação e edição de evento ativa. Sem Redux.
- **Chamadas à API**: centralizadas em `services/`, uma função por endpoint. Axios com interceptor para injetar o token JWT automaticamente.
- **Tipagem**: TypeScript estrito. Interfaces compartilhadas em `types/`.
- **Componentes**: funcionais com hooks. Sem class components.

---

## 9. API REST — Convenções

### 9.1. Padrão de URLs

```
GET    /api/v1/{recurso}          → listar
GET    /api/v1/{recurso}/:id      → buscar por ID
POST   /api/v1/{recurso}          → criar
PATCH  /api/v1/{recurso}/:id      → atualizar parcialmente
DELETE /api/v1/{recurso}/:id      → remover
```

### 9.2. Recursos Principais

| Recurso | Base URL |
|---|---|
| Autenticação | `/api/v1/auth` |
| Usuários | `/api/v1/users` |
| Edições de Evento | `/api/v1/event-editions` |
| Submissões | `/api/v1/submissions` |
| Critérios de Avaliação | `/api/v1/evaluation-criteria` |
| Avaliações | `/api/v1/evaluations` |
| Salas | `/api/v1/rooms` |
| Blocos de Apresentação | `/api/v1/presentation-blocks` |
| Apresentações | `/api/v1/presentations` |
| Painelistas | `/api/v1/panelists` |
| Membros do Comitê | `/api/v1/committee-members` |
| Certificados | `/api/v1/certificates` |
| Orientações | `/api/v1/guidances` |
| Contato | `/api/v1/contact` |
| Favoritos | `/api/v1/favorites` |
| Arquivos (upload/download) | `/api/v1/files` |

### 9.3. Formato de Resposta

Sucesso:
```json
{
  "data": { ... },
  "message": "Resource created successfully"
}
```

Erro:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [ ... ]
}
```

---

## 10. Docker e Ambiente de Desenvolvimento

### 10.1. Serviços no docker-compose

| Serviço | Imagem | Porta |
|---|---|---|
| `backend` | Build local (Dockerfile) | 3001 |
| `postgres` | `postgres:15-alpine` | 5432 |
| `rabbitmq` | `rabbitmq:3-management-alpine` | 5672 / 15672 |

O frontend roda fora do Docker (`npm run dev` na porta 3000) conectando ao backend via `http://localhost:3001`.

O serviço `backend` deve declarar bind mount para uploads (ver Seção 6.2):

```yaml
backend:
  volumes:
    - ./backend/uploads:/app/uploads
```

### 10.2. Variáveis de Ambiente (.env)

```env
# Backend
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=<gerar com openssl rand -hex 32>
JWT_EXPIRATION=7d
CLOUDAMQP_URL=amqp://...
BCRYPT_SALT_ROUNDS=10
UPLOAD_DIR=/app/uploads
COOKIE_DOMAIN=localhost
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

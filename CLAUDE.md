# CLAUDE.md — Instruções para o Agente

> Este arquivo é a primeira coisa que o agente deve ler ao iniciar qualquer sessão. Ele contém todas as regras de comportamento, convenções de código, configuração de ferramentas externas e referência visual que o agente deve seguir. Nenhuma instrução fora deste arquivo, do spec.md, do design.md ou do tasks.md deve ser inventada ou assumida.

---

## 1. Projeto

| Campo | Valor |
|---|---|
| Nome | WEPGCOMP — Portal do Workshop de Estudantes da Pós-Graduação em Computação |
| Repositório | `https://github.com/ryanreisx/wepgcomp` |
| Monorepo | `backend/` (NestJS) + `frontend/` (Next.js) |
| Metodologia | Spec Driven Development (SDD) |
| Artefatos SDD | `spec.md` (requisitos), `design.md` (arquitetura), `tasks.md` (plano de tarefas), `CLAUDE.md` (este arquivo) |

---

## 2. Fluxo de Trabalho

### 2.1. Antes de cada sessão

1. Ler `CLAUDE.md` (este arquivo).
2. Ler `tasks.md` e identificar a próxima task pendente.
3. Ler `spec.md` para entender os critérios de aceite referenciados na task.
4. Ler `design.md` para entender a arquitetura, modelo de dados e convenções técnicas.
5. Se a task for de frontend: consultar o Figma via MCP (Seção 7 deste arquivo) antes de escrever qualquer código.

### 2.2. Durante a sessão

- Implementar **apenas** o que está descrito na task. Nada mais, nada menos.
- Seguir TDD: escrever o teste primeiro (red), implementar (green), refatorar.
- Tocar **apenas** nos arquivos listados na task. Se precisar modificar outro arquivo, pergunte.
- Se faltar informação para completar a task, **pergunte**. Não assuma.

### 2.3. Ao finalizar a sessão

- Rodar `npm run test` e garantir que todos os testes passam.
- Rodar `npm run lint` e garantir zero warnings/errors.
- Criar **um único commit** com mensagem no formato: `feat(módulo): descrição curta` ou `fix(módulo): descrição curta`.
- Não acumule mudanças de múltiplas tasks em um commit.

---

## 3. Regras Invioláveis

Estas regras se aplicam a **todas** as tasks, sem exceção:

1. **Não invente dependências.** Use apenas as bibliotecas listadas no design.md Seção 2. Se precisar de algo novo, pergunte ao desenvolvedor.

2. **Não pule camadas.** A arquitetura do backend é Controller → Service → Repository → Prisma (design.md Seção 3.1). Controller nunca importa PrismaService. Service nunca retorna objetos HTTP (Response, HttpException é ok para lançar). Repository é o único que chama `prisma.model.*`.

3. **Cada entidade tem seu módulo.** Não crie "super-módulos" que agrupem entidades não relacionadas. Siga a estrutura de pastas do design.md Seção 3.2.

4. **DTOs são obrigatórios.** Toda entrada do usuário passa por DTO validado com `class-validator`. Nunca use `any` em DTOs, parâmetros de service ou retornos tipados.

5. **Testes primeiro (TDD).** Para cada funcionalidade: escreva o teste → rode e veja falhar (red) → implemente o mínimo para passar (green) → refatore. O objetivo é ter mais linhas de teste do que de código de produção.

6. **Um commit por task.** Cada task no tasks.md corresponde a uma sessão e gera exatamente um commit.

7. **Prisma é a fonte de verdade do schema.** Qualquer mudança no modelo de dados começa no `schema.prisma`, gera uma migration via `npx prisma migrate dev`, e só então o código é atualizado.

8. **NUNCA crie atributos, campos, colunas ou modelos que não estejam no `schema.prisma`.** Esta regra é absoluta. Se ao implementar uma task você perceber que precisa de um campo novo (ex: `Submission.linkedInUrl`, `UserAccount.bio`, `Evaluation.isAnonymous`), **pare imediatamente e pergunte ao desenvolvedor**. Não:
   - Adicione propriedades em DTOs que não correspondem a campos do schema.
   - Crie campos calculados ou virtuais "úteis" no service sem aprovação.
   - Use campos `metadata: Json` ou similares como escape para guardar dados não modelados.
   - Suponha que "este campo provavelmente seria adicionado depois".
   - Faça commit que adiciona campo no schema sem discussão prévia.
   - Crie modelo Prisma novo (mesmo que pareça óbvio) sem permissão explícita.

   Toda evolução do schema é **decisão do desenvolvedor** — você apenas implementa o que está mapeado em `design.md` Seção 4. Se a task lista um arquivo/funcionalidade que **exige** um campo ausente, isso é um bug da task: pergunte antes de criar o campo.

9. **Variáveis de ambiente para tudo que é sensível.** Nenhuma URL, chave, credencial ou secret hardcoded no código. Tudo via `@nestjs/config` no backend e `process.env.NEXT_PUBLIC_*` no frontend.

10. **Antes de sugerir qualquer mudança fora do escopo da task, pergunte ao desenvolvedor.** Se durante a implementação você identificar uma melhoria, refatoração, dependência adicional ou alteração de schema/arquitetura que não está descrita na task, **pare e pergunte** antes de implementar. Não decida sozinho. A regra vale também para sugestões "óbvias" — toda mudança fora da task precisa de aprovação humana explícita.

11. **Não crie arquivos fora da estrutura definida.** Não crie pastas novas, não renomeie módulos, não reorganize a estrutura de pastas. Siga o design.md.

---

## 4. Convenções de Código — Backend

### 4.1. Nomenclatura

| Elemento | Convenção | Exemplo |
|---|---|---|
| Arquivos | `kebab-case` | `event-edition.service.ts` |
| Classes | `PascalCase` | `EventEditionService` |
| Métodos | `camelCase` | `findById()` |
| Variáveis | `camelCase` | `eventEditionId` |
| DTOs | `PascalCase` com sufixo | `CreateEventEditionDto`, `UpdateEventEditionDto` |
| Testes | mesmo nome + `.spec.ts` | `event-edition.service.spec.ts` |

### 4.2. Estrutura de um módulo

Cada módulo segue exatamente esta estrutura:

```
backend/src/{módulo}/
├── {módulo}.module.ts          # @Module com imports, controllers, providers, exports
├── {módulo}.controller.ts      # Recebe HTTP, valida DTO, delega ao service, retorna resposta
├── {módulo}.service.ts         # Lógica de negócio. Orquestra repository e outros services
├── {módulo}.repository.ts      # Único lugar que chama Prisma
├── dto/
│   ├── create-{módulo}.dto.ts  # Validado com class-validator
│   └── update-{módulo}.dto.ts  # PartialType do create
└── {módulo}.service.spec.ts    # Testes unitários do service (mock do repository)
```

### 4.3. Respostas HTTP

| Operação | Status | Corpo |
|---|---|---|
| Criação bem-sucedida | `201` | `{ data: { ... }, message: "..." }` |
| Leitura bem-sucedida | `200` | `{ data: { ... } }` ou `{ data: [ ... ] }` |
| Atualização | `200` | `{ data: { ... }, message: "..." }` |
| Deleção | `204` | sem corpo |
| Validação falhou | `400` | `{ statusCode: 400, message: "...", errors: [ ... ] }` |
| Não autenticado | `401` | `{ statusCode: 401, message: "..." }` |
| Sem permissão | `403` | `{ statusCode: 403, message: "..." }` |
| Não encontrado | `404` | `{ statusCode: 404, message: "..." }` |
| Conflito (duplicação) | `409` | `{ statusCode: 409, message: "..." }` |

### 4.4. Prefixo de rotas

Todas as rotas usam o prefixo `/api/v1/`. Configurar no `main.ts`:

```typescript
app.setGlobalPrefix('api/v1');
```

### 4.5. Guards e decorators

- `@Public()` — marca rota como pública (sem JWT).
- `@Roles(Profile.Professor)` — restringe por perfil.
- `@Levels(UserLevel.Admin)` — restringe por nível.
- `@CurrentUser()` — injeta o usuário do JWT no parâmetro.
- `JwtAuthGuard` — global (APP_GUARD). Todas as rotas protegidas por padrão.

### 4.6. Prisma 7.x — Driver Adapter

Este projeto usa **Prisma 7.x** com o driver adapter `@prisma/adapter-pg` (pacote `pg` como driver PostgreSQL nativo). Dependências adicionadas ao `backend/package.json`:

| Pacote | Tipo | Finalidade |
|---|---|---|
| `@prisma/adapter-pg` | produção | Adapter oficial do Prisma para PostgreSQL via `pg` |
| `pg` | produção | Driver PostgreSQL nativo usado pelo adapter |
| `@types/pg` | devDependency | Tipagens TypeScript para `pg` |

O `PrismaService` usa **`extends PrismaClient` com driver adapter** — não é possível chamar `super({})` sem adapter no Prisma 7 (o engine type `"client"`, padrão desta versão, exige `adapter` ou `accelerateUrl`). A implementação correta:

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_URL')!;
    const adapter = new PrismaPg(databaseUrl);
    super({ adapter });
  }
}
```

**Regras:**
- Nunca instancie `PrismaClient` ou `PrismaService` sem passar o `adapter`.
- A `DATABASE_URL` é lida via `ConfigService` (nunca hardcoded).
- O schema (`prisma/schema.prisma`) usa o generator `prisma-client-js` — não alterar para `prisma-client`.

### 4.7. Hurdles conhecidos (TypeScript)

1. **`import type` para tipos do Express em controllers decorados.** Quando `isolatedModules` e `emitDecoratorMetadata` estão ativos, tipos usados em assinaturas decoradas (ex: `@Res() res: Response`) devem ser importados com `import type { Response } from 'express'`, não `import { Response }`. Caso contrário o compilador emite TS1272.

2. **`expiresIn` do JWT aceita `StringValue`, não `string`.** O tipo `SignOptions.expiresIn` do `jsonwebtoken` (via `@types/ms`) é um template literal (`StringValue`), não `string` genérico. Ao ler `JWT_EXPIRATION` do `ConfigService`, fazer cast explícito: `configService.get<string>('JWT_EXPIRATION', '7d') as StringValue` (importar `import type { StringValue } from 'ms'`).

3. **`ConfigService.get()` retorna string para variáveis numéricas.** Variáveis de ambiente são sempre strings. `configService.get<number>('BCRYPT_SALT_ROUNDS', 10)` retorna `"10"` (string), não `10` (number), o que causa erro em funções que esperam número (ex: `bcrypt.hash`). Sempre usar `parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10'), 10)` para variáveis numéricas.

4. **Alterar assinatura de um Service exige atualizar o Controller e seus testes.** Ao adicionar parâmetros a métodos do Service (ex: `updateLevel(id, level)` → `updateLevel(id, level, callerLevel)`), o Controller que chama esse método e o `*.controller.spec.ts` correspondente também precisam ser atualizados na mesma task. Sempre verificar os chamadores antes de alterar assinaturas.

---

## 5. Convenções de Código — Frontend

### 5.1. Stack e restrições

| Usar | Não usar |
|---|---|
| Bootstrap 5 (classes utilitárias) | Tailwind, CSS-in-JS, styled-components |
| CSS Modules (`.module.css`) para customizações | CSS global (exceto Bootstrap import) |
| Context API (AuthContext) | Redux, Zustand, MobX |
| Componentes funcionais com hooks | Class components |
| TypeScript estrito | `any`, `as any`, `@ts-ignore` |
| Axios (instância centralizada) | fetch nativo |
| Next.js App Router | Pages Router |

### 5.2. Estrutura de pastas

```
frontend/src/
├── app/
│   ├── layout.tsx              # Layout raiz (Bootstrap, fontes, AuthProvider)
│   ├── (auth)/                 # Rotas de autenticação (login, register, reset)
│   ├── (dashboard)/            # Rotas protegidas (admin, doutorando, ouvinte)
│   └── (public)/               # Rotas públicas (home, orientações)
├── components/
│   ├── ui/                     # Componentes reutilizáveis do design system
│   └── forms/                  # Componentes de formulário (modais, etc.)
├── contexts/                   # AuthContext, EventContext
├── hooks/                      # useAuth, etc.
├── services/                   # Uma função por endpoint da API
├── types/                      # Interfaces TypeScript
└── utils/                      # Funções utilitárias
```

### 5.3. Chamadas à API

Centralizadas em `services/`. Cada service exporta funções nomeadas:

```typescript
// services/user.service.ts
import api from './api';
import { User, CreateUserDto } from '@/types/user';

export const getUsers = () => api.get<{ data: User[] }>('/users');
export const getUserById = (id: string) => api.get<{ data: User }>(`/users/${id}`);
export const createUser = (dto: CreateUserDto) => api.post<{ data: User }>('/users', dto);
```

A instância Axios em `services/api.ts` inclui interceptor que injeta `Authorization: Bearer <token>` automaticamente.

---

## 6. Design System

> Fonte de verdade: Figma (via MCP, Seção 7). Os valores abaixo são a referência rápida extraída do Figma para uso em CSS modules e componentes Bootstrap. **Não invente valores visuais que não estejam aqui.**

### 6.1. Paleta de Cores

| Token | Hex | Uso |
|---|---|---|
| `primary-blue` | `#0066ba` | Botões primários, links, navbar, header do hero |
| `primary-blue-dark` | `#054b75` | Hover de botões primários, fundo do hero banner |
| `accent-orange` | `#ffa90f` | Botões secundários (CTA), bordas de cards, abas ativas |
| `accent-yellow` | `#f2cb05` | Destaques, linhas decorativas sob títulos |
| `success-green` | `#03a61c` | Mensagens de sucesso, ícones de edição |
| `success-green-dark` | `#019a34` | Variante escura de sucesso |
| `error-red` | `#ff1a25` | Mensagens de erro, validação inline |
| `error-red-dark` | `#cf000a` | Variante escura de erro |
| `gray-900` | `#2a2a2a` | Texto principal |
| `gray-700` | `#555555` | Texto secundário |
| `gray-500` | `#7f7f7f` | Placeholders |
| `gray-300` | `#aaaaaa` | Bordas de inputs |
| `gray-100` | `#d4d4d4` | Backgrounds sutis |
| `black` | `#0d0d0d` | Texto de headings, footer |
| `white` | `#ffffff` | Background principal |

### 6.2. Tipografia

| Fonte | Peso | Uso |
|---|---|---|
| Poppins | Bold (700) | Títulos de seção (h1, h2) |
| Poppins | SemiBold (600) | Subtítulos, labels com ênfase |
| Poppins | Medium (500) | Botões, labels de navegação |
| Poppins | Regular (400) | Corpo de texto, descrições |
| Raleway | Regular (400) | Texto alternativo, elementos decorativos |

### 6.3. Componentes Visuais

**Botões**: dois estilos — preenchido (filled) e contorno (outline). Primários usam `primary-blue` com texto branco. Secundários usam `accent-orange` com texto branco. Outline mantém a cor como borda e texto, fundo transparente. Border-radius arredondado (pill shape).

**Inputs**: borda `gray-300`, border-radius sutil, placeholder em `gray-500`. Labels acima do campo com asterisco vermelho (`error-red`) para obrigatórios. Validação inline em `error-red` abaixo do campo.

**Cards de listagem**: borda `accent-orange`, nome em bold, informação secundária abaixo. Ícone de edição (lápis verde `success-green`) à direita. Alguns incluem ícone de exclusão (vermelho).

**Modais**: fundo branco, botão X no canto superior direito. Sucesso = texto `success-green`. Erro = texto `error-red`. Confirmação (ATENÇÃO) = botão `accent-orange`.

**Hero banner**: foto de Salvador/UFBA com overlay gradiente `primary-blue` → `primary-blue-dark`, texto branco centralizado, botão CTA com borda branca.

**Navbar**: fixa no topo, logo PGCOMP à esquerda, links centralizados (Inicio, Programação do Evento, Orientações, Contato), Login/hamburger à direita. Logados veem menu hamburger contextual por perfil.

**Abas (tabs)**: pill buttons. Ativa = `accent-orange` preenchido, texto branco. Inativa = outline `accent-orange`.

**Footer**: fundo `gray-900`/`black`, Contato e Local lado a lado, logos de realização/apoio abaixo, copyright.

---

## 7. Integração com Figma via MCP

### 7.1. Configuração no Claude Code

Adicionar ao arquivo de configuração do Claude Code (`.claude/settings.json` ou `~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "figma": {
      "type": "url",
      "url": "https://mcp.figma.com/mcp",
      "headers": {
        "Authorization": "Bearer <Token>"
      }
    }
  }
}
```

O json da configuração do mcpServers está em .claude/settings.json

### 7.2. Arquivo de design

| Parâmetro | Valor |
|---|---|
| fileKey | `ifvnGnKjMY5iByhodj0fUW` |
| Arquivo | Portal WEPGCOMP |

### 7.3. Como usar

Ao implementar qualquer task de frontend:

1. Identificar o `nodeId` da tela na tabela abaixo (ou no campo `Figma:` da task).
2. Chamar `get_design_context` com `fileKey=ifvnGnKjMY5iByhodj0fUW` e `nodeId=<nodeId>`.
3. O MCP retorna: screenshot da tela, hierarquia de componentes, e código React/Tailwind de referência.
4. **Não copiar o código do MCP literalmente.** Usá-lo como referência estrutural. Implementar com Bootstrap 5 + CSS modules.
5. O código retornado pelo MCP vem em Tailwind — **converter todas as classes para Bootstrap 5**.
6. Cores e tipografia: usar os tokens da Seção 6 deste arquivo. Não usar valores visuais diferentes.

### 7.4. Mapeamento de Telas e Node-IDs

#### 7.4.1. Telas públicas e auth

| Tela / Seção | Node-ID | Descrição |
|---|---|---|
| Components (Design System) | `3487:1271` | Cores, fontes, botões, inputs, logos |
| Colors | `3487:1280` | Paleta de cores completa |
| Home | `3481:1032` | Landing page pública |
| Orientações | `3481:1277` | Página com abas Autores/Avaliadores/Audiência |
| Login | `3484:1669` | Formulário de login com validação inline |
| Cadastro | `3487:1077` | Formulário de registro |

#### 7.4.2. Visões privadas (após login)

O sistema possui **4 visões** correspondentes a perfis distintos. Cada visão agrupa um conjunto de páginas. Algumas páginas são compartilhadas entre visões (mesmo componente, controle de acesso por perfil).

| Visão | Node-ID raiz | Páginas que contém |
|---|---|---|
| **Visão Aluno(a)/Apresentador(a)** | `3494:1618` | Apresentações (próprias) |
| **Visão Ouvinte/Logado** | `3494:2610` | Avaliação Ouvinte, Favoritos |
| **Visão Comissão** | `2543:732` | Sessões, Apresentações, Edição do Evento, Premiação |
| **Visão SuperAdministrador** | `4228:892` | Sessões, Apresentações, Edição do Evento, Premiação, Usuários |

#### 7.4.3. Páginas reutilizáveis entre visões

Implementar uma única vez e proteger por perfil/nível/visão. O agente **não deve duplicar componentes** entre visões.

| Página | Visões que usam | Controle de acesso | Observações |
|---|---|---|---|
| **Sessões** | Comissão, SuperAdmin | Comissão: `@EditionAdmin()`; SuperAdmin: `@Levels(Superadmin)` | Mesma listagem e modal — ver T-3.7 |
| **Apresentações (admin)** | Comissão, SuperAdmin | Comissão: `@EditionAdmin()`; SuperAdmin: `@Levels(Superadmin)` | Listagem de todas as submissões da edição com modal de edição — ver T-3.8 |
| **Apresentações (minhas)** | Aluno(a)/Apresentador(a) | `requiredProfile = 'DoctoralStudent'` | Filtra `submissionService.getMy()` — ver T-3.12 |
| **Cadastro de Apresentação** | Aluno, Comissão, SuperAdmin (admins criam em nome de outros) | Autenticado | Mesmo formulário — ver T-3.13 |
| **Edição do Evento** | Comissão, SuperAdmin | Comissão: `@EditionAdmin()` (apenas a sua); SuperAdmin: `@Levels(Superadmin)` (todas) | Lista + formulário — ver T-3.9 |
| **Premiação** | Comissão, SuperAdmin | Autenticado; aba "Minhas bancas" só se o usuário for `Panelist` da edição | Tabs Banca/Avaliadores/Público — ver T-3.10 |
| **Usuários** | SuperAdmin (exclusivo) | `@Levels(Superadmin)` | Apenas Superadmin pode atribuir Superadmin — ver T-3.11 |
| **Avaliação** | Ouvinte/Logado | Autenticado se `isEvaluationRestrictToLoggedUsers = true`; público caso contrário | Listagem + formulário com 5 estrelas por critério — ver T-3.14 |
| **Favoritos** | Ouvinte/Logado | Autenticado | **Bloqueada** até decisão de schema — ver T-3.15 |
| **Certificados** | Todas as visões logadas | Autenticado | Comportamento adapta por perfil — ver T-3.16 |

> **Importante**: a Visão é a "lente" que o usuário vê após login (decidida pelo perfil/nível/CommitteeMember dele); as Páginas são os componentes implementados. Em código, não há "Visão" como entidade — há apenas o menu lateral / hamburger que muda por perfil (`useUserView()`) e as páginas que cada perfil pode acessar (rotas com guards).

### 7.5. Limitações

- O plano Starter do Figma tem limite de chamadas MCP por período. Se atingir o limite, usar a Seção 6 (Design System) como referência e o PDF do protótipo como backup visual.
- O MCP não retorna imagens reais (fotos, logos). Usar placeholders e substituir manualmente depois.

---

## 8. Estrutura de Commits

### 8.1. Formato da mensagem

```
<tipo>(<escopo>): <descrição curta>

<corpo opcional explicando o porquê>
```

### 8.2. Tipos permitidos

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `test` | Adição ou correção de testes |
| `refactor` | Refatoração sem mudança de comportamento |
| `chore` | Setup, config, dependências |
| `docs` | Documentação |

### 8.3. Exemplos

```
feat(auth): implementar endpoint POST /api/v1/auth/register
feat(user): adicionar guard de autorização por nível
fix(evaluation): corrigir upsert de voto duplicado
test(presentation): adicionar testes de ranking por tipo
chore(infra): configurar Docker Compose com PostgreSQL e RabbitMQ
```

---

## 9. Comandos Úteis

### Backend

```bash
cd backend
npm run start:dev          # Inicia em modo desenvolvimento (watch)
npm run test               # Roda todos os testes unitários
npm run test:watch         # Testes em modo watch
npm run test:cov           # Testes com cobertura
npm run lint               # ESLint
npm run format             # Prettier
npx prisma migrate dev     # Cria/aplica migration
npx prisma generate        # Gera Prisma Client
npx prisma db seed         # Popula banco com dados de teste
npx prisma studio          # UI para visualizar o banco
```

### Frontend

```bash
cd frontend
npm run dev                # Inicia em modo desenvolvimento
npm run build              # Build de produção
npm run test               # Testes
npm run lint               # ESLint
```

### Docker

```bash
docker compose up -d                  # Sobe todos os serviços
docker compose up postgres rabbitmq   # Sobe apenas infra
docker compose down                   # Para todos
docker compose logs -f backend        # Logs do backend
```

---

## 10. Variáveis de Ambiente

### Backend (`.env`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/wepgcomp` |
| `JWT_SECRET` | Chave secreta para assinar JWTs | Gerar com `openssl rand -hex 32` |
| `JWT_EXPIRATION` | Tempo de expiração do JWT | `7d` |
| `CLOUDAMQP_URL` | URL de conexão RabbitMQ | `amqp://guest:guest@localhost:5672` |
| `BCRYPT_SALT_ROUNDS` | Rounds do bcrypt para hash de senha | `10` |

### Frontend (`.env.local`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API | `http://localhost:3001/api/v1` |

---

## 11. Ordem de Execução das Fases

O tasks.md está organizado em 4 fases sequenciais. **Não pule fases.**

| Fase | Escopo | Pré-requisito |
|---|---|---|
| **Fase 1** | Infraestrutura e setup (monorepo, Docker, NestJS, Prisma, Next.js, CI) | Nenhum |
| **Fase 2** | Backend completo (todos os módulos, endpoints, testes) | Fase 1 concluída |
| **Fase 3** | Frontend completo (componentes, pages, integração com API) | Fase 2 concluída |
| **Fase 4** | Deploy e documentação (Dockerfile, Vercel, README) | Fases 2 e 3 concluídas |

Dentro de cada fase, as tasks estão ordenadas por dependência. Execute na ordem exata do tasks.md.

---

## 12. O que o Agente NÃO deve fazer

Para evitar alucinações e desvios, aqui está uma lista explícita do que **nunca** fazer:

- **Não instale bibliotecas** que não estejam no design.md Seção 2.
- **Não crie endpoints** que não estejam definidos na task.
- **Não crie tabelas, colunas, campos ou modelos Prisma** que não estejam no schema do design.md Seção 4. Isso inclui campos que pareçam "óbvios" ou "úteis" (ex: `bio`, `linkedinUrl`, `audit_log`). Se a task pede algo que exige um campo ausente do schema, **pare e pergunte** — esse caso é um bug da task. Ver **Regra 8** (Seção 3).
- **Favoritos/Bookmarks** usa relação implícita `bookmarkedPresentations` ↔ `bookmarkedUsers`. Não crie model `Favorite` explícito.
- **Não crie pastas ou módulos** fora da estrutura do design.md Seção 3.2.
- **Não use Tailwind.** Converta tudo para Bootstrap 5.
- **Não use localStorage** para armazenar JWT no frontend. A estratégia oficial é **cookies httpOnly** definidos pelo backend no login (com `Secure`, `SameSite=Lax`). O frontend não armazena nem lê o token diretamente — apenas envia requisições com `withCredentials: true` no Axios e o navegador anexa o cookie automaticamente. Detalhes em design.md Seção 5 e na task T-2.5b.
- **Não implemente funcionalidades da Fase 5 (NÃO-ESSENCIAL)** sob nenhuma circunstância. Se identificar dependência num item da Fase 5 para concluir uma task essencial, pare e pergunte ao desenvolvedor.
- **Não faça deploy** antes de todos os testes passarem.
- **Não assuma dados de teste.** Use o seed (T-2.22) ou pergunte.
- **Não invente valores visuais.** Use exclusivamente os tokens da Seção 6 e/ou consulte o Figma via MCP.
- **Não crie código sem teste.** Se não sabe como testar, pergunte.
- **Não confunda as 4 Visões** (SuperAdministrador, Comissão, Aluno(a)/Apresentador(a), Ouvinte/Logado). Cada visão usa rotas distintas e guards específicos — ver T-3.3. Páginas reutilizadas entre visões devem ser implementadas como **um único componente** com guards/rotas diferentes; não duplicar código.

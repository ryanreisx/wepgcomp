# WEPGCOMP — Portal do Workshop de Estudantes da Pós-Graduação em Computação

Portal web para o Workshop de Estudantes da Pós-Graduação em Computação (PGCOMP) da UFBA.

## Estrutura do Projeto

```
/
├── frontend/          # Next.js 16 (React 19, App Router)
├── backend/           # NestJS 11 (Node.js 20)
├── docker-compose.yml
└── README.md
```

## Pré-requisitos

- Node.js 20 LTS
- Docker e Docker Compose
- PostgreSQL 15+ (via Docker ou local)
- RabbitMQ 3+ (via Docker ou local)

## Setup Local

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Gere um JWT secret e preencha no `.env`:

```bash
openssl rand -hex 32
```

### 2. Subir infraestrutura (PostgreSQL + RabbitMQ)

```bash
docker compose up -d postgres rabbitmq
```

### 3. Backend

```bash
cd backend
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

O backend estará disponível em `http://localhost:3001/api/v1`.

### 4. Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3000`.

## Deploy

### Backend (Docker)

```bash
cd backend
docker build -t wepgcomp-backend .
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/wepgcomp" \
  -e JWT_SECRET="<secret>" \
  -e JWT_EXPIRATION="7d" \
  -e BCRYPT_SALT_ROUNDS="10" \
  -e CLOUDAMQP_URL="amqp://user:pass@host:5672" \
  -e CORS_ORIGIN="https://seu-dominio.com" \
  wepgcomp-backend
```

Ou via Docker Compose (sobe todos os serviços):

```bash
docker compose up -d
```

### Frontend (Vercel)

1. Conecte o repositório à Vercel.
2. Defina o diretório raiz como `frontend`.
3. Configure a variável de ambiente na Vercel:
   - `NEXT_PUBLIC_API_URL` = URL da API de produção (ex: `https://api.wepgcomp.example.com/api/v1`)
4. Deploy automático a cada push na branch `main`.

Veja `frontend/.env.production.example` para referência.

## Variáveis de Ambiente

### Backend (`.env`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://wepgcomp:wepgcomp@localhost:5432/wepgcomp` |
| `JWT_SECRET` | Chave secreta para assinar JWTs | Gerar com `openssl rand -hex 32` |
| `JWT_EXPIRATION` | Tempo de expiração do token JWT | `7d` |
| `CLOUDAMQP_URL` | URL de conexão RabbitMQ (AMQP) | `amqp://guest:guest@localhost:5672` |
| `BCRYPT_SALT_ROUNDS` | Rounds do bcrypt para hash de senha | `10` |
| `CORS_ORIGIN` | Origem permitida para CORS | `http://localhost:3000` |

### Frontend (`.env.local`)

| Variável | Descrição | Exemplo |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | URL base da API backend | `http://localhost:3001/api/v1` |

## Comandos Disponíveis

### Backend

| Comando | Descrição |
|---|---|
| `npm run start:dev` | Inicia em modo desenvolvimento (watch) |
| `npm run build` | Compila para produção |
| `npm run start:prod` | Inicia build de produção |
| `npm run test` | Roda testes unitários |
| `npm run test:cov` | Testes com cobertura |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |
| `npx prisma migrate dev` | Cria/aplica migrations |
| `npx prisma generate` | Gera Prisma Client |
| `npx prisma db seed` | Popula banco com dados de teste |
| `npx prisma studio` | UI para visualizar o banco |

### Frontend

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Inicia build de produção |
| `npm run test` | Roda testes |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

### Docker

| Comando | Descrição |
|---|---|
| `docker compose up -d` | Sobe todos os serviços |
| `docker compose up -d postgres rabbitmq` | Sobe apenas infraestrutura |
| `docker compose down` | Para todos os serviços |
| `docker compose logs -f backend` | Logs do backend |

## Serviços

| Serviço | Porta | Descrição |
|---|---|---|
| Frontend | 3000 | Next.js (App Router) |
| Backend | 3001 | NestJS (REST API) |
| PostgreSQL | 5432 | Banco de dados relacional |
| RabbitMQ | 5672 | Mensageria (AMQP) |
| RabbitMQ UI | 15672 | RabbitMQ Management UI |

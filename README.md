# WEPGCOMP — Portal do Workshop de Estudantes da Pós-Graduação em Computação

Portal web para o Workshop de Estudantes da Pós-Graduação em Computação (PGCOMP) da UFBA.

## Estrutura do Projeto

```
/
├── frontend/          # Next.js (React)
├── backend/           # NestJS (Node.js)
├── docker-compose.yml
└── README.md
```

## Pré-requisitos

- Node.js 20 LTS
- Docker e Docker Compose

## Início Rápido

1. Copie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

2. Gere um JWT secret e preencha no `.env`:

```bash
openssl rand -hex 32
```

3. Suba os serviços de infraestrutura:

```bash
docker compose up -d postgres rabbitmq
```

4. Inicie o backend (após setup do projeto NestJS):

```bash
cd backend
npm install
npm run start:dev
```

5. Inicie o frontend (após setup do projeto Next.js):

```bash
cd frontend
npm install
npm run dev
```

## Serviços

| Serviço    | Porta | Descrição                    |
|------------|-------|------------------------------|
| Frontend   | 3000  | Next.js (App Router)         |
| Backend    | 3001  | NestJS (REST API)            |
| PostgreSQL | 5432  | Banco de dados               |
| RabbitMQ   | 5672  | Mensageria (AMQP)            |
| RabbitMQ   | 15672 | RabbitMQ Management UI       |

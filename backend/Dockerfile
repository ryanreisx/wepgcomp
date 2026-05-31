# ── Stage 1: build ──────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src/ src/
COPY prisma/ prisma/

RUN npx prisma generate
RUN npm run build

# ── Stage 2: production ────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist/ dist/
COPY --from=build /app/prisma/ prisma/

RUN npx prisma generate

EXPOSE 3001

CMD ["node", "dist/main.js"]

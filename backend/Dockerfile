# ── Stage 1: build ──────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY prisma/ prisma/
RUN npx prisma generate

COPY src/ src/
RUN npm run build

# ── Stage 2: production ────────────────────────────────
FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist/ dist/
COPY --from=build /app/node_modules/ node_modules/
COPY --from=build /app/prisma/ prisma/
COPY --from=build /app/package.json package.json

EXPOSE 3001

CMD ["node", "dist/src/main.js"]

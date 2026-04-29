FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@10.0.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/service/package.json packages/service/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --frozen-lockfile --filter @gc-project/service...

COPY packages/service packages/service

RUN pnpm --filter @gc-project/service build

FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN npm install -g pnpm@10.0.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/service/package.json packages/service/package.json
COPY packages/ui/package.json packages/ui/package.json

RUN pnpm install --prod --frozen-lockfile --filter @gc-project/service...

COPY --from=builder /app/packages/service/dist packages/service/dist

WORKDIR /app/packages/service

EXPOSE 3000

USER node

CMD ["node", "dist/main.js"]

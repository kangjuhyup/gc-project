FROM node:24-alpine AS builder

WORKDIR /app

ENV COREPACK_DEFAULT_TO_LATEST=0

RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ui/package.json packages/ui/package.json
COPY packages/service/package.json packages/service/package.json

RUN pnpm install --frozen-lockfile --filter @gc-project/ui...

COPY packages/ui packages/ui

RUN pnpm --filter @gc-project/ui build

FROM nginx:1.27-alpine AS runner

COPY packages/ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/ui/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

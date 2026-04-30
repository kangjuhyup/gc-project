# GC Project

pnpm workspace 기반 모노레포입니다.

- `packages/ui`: React 19 + Vite
- `packages/service`: NestJS

## 서비스 구성

백엔드 서비스는 API 프로세스와 worker 프로세스를 분리해서 실행합니다.

- API: HTTP controller, Swagger, application command/query 진입점
- Worker: `outbox_event` polling 기반 결제/환불 후속 작업 처리

현재 outbox 구조와 향후 message broker 확장 방향은 [`architect.md`](architect.md)의 “결제 이벤트 로그와 아웃박스” 섹션을 참고합니다.

## 로컬 실행 전 준비사항

### 1. Node.js 24 사용

이 프로젝트는 `.nvmrc`와 `package.json`에서 Node.js 24 이상을 기준으로 합니다.

```bash
nvm install
nvm use
node -v
```

`node -v` 결과가 `v24.x`인지 확인합니다.

### 2. pnpm 활성화

패키지 매니저는 `pnpm@10.0.0`을 사용합니다. Node 24 환경에서 Corepack을 활성화합니다.

```bash
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm -v
```

### 3. 의존성 설치

루트에서 모든 workspace 의존성을 설치합니다.

```bash
pnpm install
```

### 4. Docker 실행 환경 준비

로컬 인프라는 Docker Compose로 실행합니다. Docker Desktop 또는 Docker Engine이 실행 중이어야 합니다.

```bash
docker compose version
docker compose config --quiet
```

Compose 구성에는 다음 서비스가 포함됩니다.

- PostgreSQL master: `localhost:5432`
- PostgreSQL replica: `localhost:5433`
- Redis master: `localhost:6379`
- Redis replica: `localhost:6380`
- Redis Sentinel: `localhost:26379`, `26380`, `26381`

### 5. 환경 변수 확인

별도 `.env`가 없어도 개발용 기본값으로 실행됩니다. 필요한 경우 루트에 `.env`를 만들고 아래 값을 오버라이드할 수 있습니다.

```bash
POSTGRES_USER=gc_user
POSTGRES_PASSWORD=gc_password
POSTGRES_DB=gc_project
POSTGRES_REPLICATION_USER=replicator
POSTGRES_REPLICATION_PASSWORD=replicator_password

REDIS_PASSWORD=gc_redis_password
REDIS_SENTINEL_PASSWORD=gc_sentinel_password
REDIS_SENTINEL_MASTER_SET=mymaster
```

worker 프로세스는 `packages/service/.env-worker`를 읽습니다. 결제 outbox worker 전용 설정이 필요하면 아래 값을 둘 수 있습니다.

```bash
PAYMENT_OUTBOX_WORKER_ENABLED=true
PAYMENT_OUTBOX_WORKER_INTERVAL_MS=500
LOCAL_PAYMENT_CALLBACK_DELAY_SECONDS=3
```

### 6. 로컬 인프라 실행

```bash
pnpm run compose:up
```

상태 확인:

```bash
docker compose ps
```

### 7. 빌드 확인

로컬 실행 전 전체 workspace 빌드가 통과하는지 확인합니다.

```bash
pnpm build
```

## 로컬 실행

UI, API, worker를 한 번에 개발 모드로 실행합니다.

```bash
pnpm dev
```

UI와 API만 실행합니다.

```bash
pnpm run dev:apps
```

API와 worker를 함께 실행합니다.

```bash
pnpm run dev:service:all
```

개별 프로세스만 실행할 수도 있습니다.

```bash
pnpm run dev:ui
pnpm run dev:service
pnpm run dev:worker
```

빌드된 산출물을 실행할 때는 다음 명령을 사용합니다.

```bash
pnpm run service
pnpm run worker
pnpm run service:all
```

## 검증

전체 테스트:

```bash
pnpm test
```

service e2e 테스트:

```bash
pnpm run service:test:e2e
```

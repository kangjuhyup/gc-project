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

서비스는 실행 시 필수 config를 검증합니다. `packages/service/.env` 또는 실행 환경에 아래 service 필수값이 없으면 API 프로세스가 부팅에 실패합니다.

```bash
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=gc_project
DB_USER=gc_user
DB_PASSWORD=gc_password

REDIS_URL=redis://:gc_redis_password@localhost:6379

ADDRESS_SEARCH_ADAPTER=local

ACCESS_TOKEN_TTL_SECONDS=900
REFRESH_TOKEN_TTL_SECONDS=1209600
SEAT_HOLD_TTL_SECONDS=3

LOCAL_PAYMENT_CALLBACK_URL=http://localhost:3000/payments/callback
LOCAL_PAYMENT_CALLBACK_DELAY_SECONDS=3

MIGRATIONS_RUN_ON_STARTUP=true
```

Docker Compose 자체의 기본값을 바꾸려면 루트 `.env`에 아래 값을 둘 수 있습니다.

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

worker 프로세스는 `packages/service/.env-worker`를 읽습니다. worker도 DB/Redis/토큰/좌석 TTL 같은 공통 필수값을 검증하며, 추가로 아래 worker 전용 값이 필요합니다.

```bash
PAYMENT_OUTBOX_WORKER_ENABLED=true
PAYMENT_OUTBOX_WORKER_INTERVAL_MS=500
LOCAL_PAYMENT_CALLBACK_URL=http://localhost:3000/payments/callback
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

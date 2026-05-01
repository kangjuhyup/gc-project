# GC Project

pnpm workspace 기반 모노레포입니다.

- `packages/ui`: React 19 + Vite
- `packages/service`: NestJS

## 프로젝트 구조 문서

- [모노레포 아키텍처](ARCHITECTURE.md)
- [Service 비즈니스 프로세스](packages/service/docs/PROCCESS.md)
- [Service 도메인 설계](packages/service/docs/DOMAIN.md)
- [Service 데이터베이스 구조](packages/service/docs/DATABASE.md)
- [Service 환경 변수 설정](packages/service/docs/ENVIRONMENT.md)
- [UI 프로젝트 구조](packages/ui/docs/ARCHITECTURE.md)
- [UI 환경 변수 설정](packages/ui/docs/ENVIRONMENT.md)

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

Compose 구성의 DB/Redis 상세는 [Service 데이터베이스 구조](packages/service/docs/DATABASE.md)를 참고합니다.

### 5. 환경 변수 확인

service 실행 환경 변수는 API와 worker 프로세스별로 검증됩니다. UI 환경 변수는 브라우저에 노출되는 `VITE_` 값만 사용합니다.

```bash
cp packages/service/.env.example packages/service/.env
cp packages/service/.env.worker.example packages/service/.env.worker
cp packages/ui/.env.example packages/ui/.env
```

필수 값과 프로세스 구분은 [Service 환경 변수 설정](packages/service/docs/ENVIRONMENT.md), [UI 환경 변수 설정](packages/ui/docs/ENVIRONMENT.md)을 참고합니다.

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

전체 개발 모드를 실행합니다.

```bash
pnpm dev
```

일부 프로세스만 실행할 수도 있습니다. 세부 역할은 [모노레포 아키텍처](ARCHITECTURE.md)와 [UI 프로젝트 구조](packages/ui/docs/ARCHITECTURE.md)를 참고합니다.

```bash
pnpm run dev:apps
pnpm run dev:service:all
pnpm run dev:ui
pnpm run dev:service
pnpm run dev:worker
```

빌드된 산출물 실행:

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

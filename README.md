# GC Project

영화 예매 과제를 위한 pnpm workspace 기반 모노레포입니다.

- `packages/service`: NestJS 기반 API/worker
- `packages/ui`: React 19 + Vite 기반 웹 UI

## 구현 기능

- 회원가입, 로그인
- 영화 목록 조회
- 영화별 상영 시간 조회
- 상영 좌석 조회
- 좌석 선택 및 예매
- 내 예매 목록/상세 조회
- 예매 취소

영화 및 상영 데이터는 임의의 seed 데이터로 구성했습니다. 상영 시간 목록은 `GET /movies` 응답의 `screenings`로 제공하며, 좌석은 `GET /screenings/:screeningId/seats`로 조회합니다.

## 실행 방법

```bash
nvm install
nvm use
corepack enable
corepack prepare pnpm@10.0.0 --activate
pnpm install
```

환경 변수 파일을 준비합니다.

```bash
cp packages/service/.env.example packages/service/.env
cp packages/service/.env.worker.example packages/service/.env.worker
cp packages/ui/.env.example packages/ui/.env
```

로컬 인프라와 앱을 실행합니다.

```bash
pnpm run compose:up
pnpm run dev:apps
```

기본 주소:

- UI: `http://localhost:5173`
- API: `http://localhost:3000`

UI만 mock/real API 모드로 실행할 수도 있습니다.

```bash
pnpm run dev:ui:mock
pnpm run dev:ui:real
```

검증:

```bash
pnpm build
pnpm test
pnpm run service:test:e2e
```

자세한 실행 환경은 [Service 환경 변수 설정](packages/service/docs/ENVIRONMENT.md), [UI 환경 변수 설정](packages/ui/docs/ENVIRONMENT.md)을 참고합니다.

## 프로젝트 구조

```text
packages/
├── service   # NestJS, domain/application/infrastructure/presentation 계층
└── ui        # React, feature 중심 UI 구성
```

자세한 구조:

- [모노레포 아키텍처](ARCHITECTURE.md)
- [Service 도메인 설계](packages/service/docs/DOMAIN.md)
- [Service 데이터베이스 구조](packages/service/docs/DATABASE.md)
- [UI 프로젝트 구조](packages/ui/docs/ARCHITECTURE.md)

## 설계 의도

- Backend는 헥사고날 아키텍처를 기준으로 도메인, 유스케이스, 인프라, HTTP 계층을 분리했습니다.
- Domain은 NestJS/MikroORM/Redis 같은 기술 의존성을 갖지 않도록 구성했습니다.
- Frontend는 TanStack Query로 서버 상태를 관리하고, 좌석 선택 등 클라이언트 흐름 상태만 Zustand로 관리합니다.
- 결제는 멱등성 키와 request hash를 저장해 재시도와 중복 요청을 구분합니다.
- 여러 좌석 예매는 결제 1건, 예매 1건으로 묶어 처리합니다.

자세한 설계 내용:

- [Service 비즈니스 프로세스](packages/service/docs/PROCCESS.md)
- [Service 도메인 설계](packages/service/docs/DOMAIN.md)
- [UI 프로젝트 구조](packages/ui/docs/ARCHITECTURE.md)

## 고려한 사항

- 좌석 중복 예매 방지를 위한 임시점유와 트랜잭션 처리
- 결제 요청 멱등성 처리
- 결제 callback 이후 예매 확정과 환불 요청 흐름
- 개인정보 마스킹과 관리자 감사 로그
- real/mock API 전환 가능한 UI 개발 환경

## 추가 구현 내용

- 로그 레벨 환경 변수 관리
- API/worker 프로세스 분리
- 로컬 결제 callback delay 설정
- refresh token 재발급
- 관리자 인증 및 관리자 조회 API
- OpenAPI 문서: [packages/service/docs/openapi.json](packages/service/docs/openapi.json)

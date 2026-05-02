# GC Project

영화 예매 과제를 위한 pnpm workspace 기반 모노레포입니다.

- `packages/service`: NestJS 기반 API/worker
- `packages/ui`: React 19 + Vite 기반 웹 UI

## 구현 기능

- 회원가입, 로그인
- access token 만료 시 refresh token 기반 1회 재발급
- 영화 마스터 목록 조회
- 영화별/영화관별 상영 시간표 조회
- 영화관 목록 조회
- 상영 좌석 조회
- 좌석 임시점유, 점유 해제, 좌석 선택 및 예매
- 결제 요청, 결제 callback 기반 예매 확정
- 내 예매 목록/상세 조회
- 예매 취소
- 회원탈퇴

영화 및 상영 데이터는 seed 데이터로 구성했습니다. 영화 목록은 `GET /movies`에서 상영시간표 없이 마스터 정보만 조회하고, 예매 진입에 필요한 시간표는 별도 API로 조회합니다.

주요 조회 API:

- `GET /movies`: 영화 마스터 목록. 검색어와 cursor pagination을 지원합니다.
- `GET /movies/:movieId/schedules?date=2026-05-01`: 영화 기준 상영시간표. 해당 영화가 어느 영화관/상영관에서 몇 시에 상영하는지 조회합니다.
- `GET /theaters`: 영화관 목록. 현재 위치를 전달하면 가까운 영화관 순 정렬을 지원합니다.
- `GET /theaters/:theaterId/schedules?date=2026-05-01`: 영화관 기준 상영시간표. 해당 영화관에서 지정 날짜에 상영하는 영화와 시간을 조회합니다.
- `GET /screenings/:screeningId/seats`: 상영 좌석 상태. 예매 가능, 임시점유, 예매 완료 상태를 반환합니다.

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

API와 outbox worker를 함께 실행하려면 다음 명령을 사용할 수 있습니다.

```bash
pnpm run dev:service:all
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

UI만 빠르게 확인할 때는 다음 명령을 사용합니다.

```bash
pnpm --filter @gc-project/ui typecheck
pnpm --filter @gc-project/ui test
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
- [Service 환경 변수 설정](packages/service/docs/ENVIRONMENT.md)
- [UI 프로젝트 구조](packages/ui/docs/ARCHITECTURE.md)
- [UI 환경 변수 설정](packages/ui/docs/ENVIRONMENT.md)

## 설계 의도

- Backend는 헥사고날 아키텍처를 기준으로 도메인, 유스케이스, 인프라, HTTP 계층을 분리했습니다.
- Domain은 NestJS/MikroORM/Redis 같은 기술 의존성을 갖지 않도록 구성했습니다.
- Frontend는 TanStack Query로 서버 상태를 관리하고, 좌석 선택 등 클라이언트 흐름 상태만 Zustand로 관리합니다.
- 결제는 멱등성 키와 request hash를 저장해 재시도와 중복 요청을 구분합니다.
- 여러 좌석 예매는 결제 1건, 예매 1건으로 묶어 처리합니다.
- 결제와 좌석 점유의 다대일 흐름은 `payment_seat_hold` 매핑 테이블로 관리합니다.
- 회원탈퇴 회원의 이력은 보존하고, 활성 회원 기준 partial unique index로 로그인 ID/휴대폰 재사용 정책을 관리합니다.
- API와 worker는 별도 엔트리포인트로 분리되어 있으며, worker는 outbox polling으로 결제/환불 후속 작업을 처리합니다.

자세한 설계 내용:

- [Service 비즈니스 프로세스](packages/service/docs/PROCCESS.md)
- [Service 도메인 설계](packages/service/docs/DOMAIN.md)
- [UI 프로젝트 구조](packages/ui/docs/ARCHITECTURE.md)

## 고려한 사항

- 좌석 중복 예매 방지를 위한 임시점유와 트랜잭션 처리
- 결제 요청 멱등성 처리
- 결제 callback 이후 예매 확정과 환불 요청 흐름
- 개인정보 마스킹과 관리자 감사 로그
- NestJS throttler 기반 API rate limit
- real/mock API 전환 가능한 UI 개발 환경

## 추가 구현 내용

- 로그 레벨 환경 변수 관리
- API/worker 프로세스 분리
- 로컬 결제 callback delay 설정
- refresh token 재발급
- 관리자 인증 및 관리자 조회 API
- OpenAPI 기반 UI 연동
- OpenAPI 문서: [packages/service/docs/openapi.json](packages/service/docs/openapi.json)

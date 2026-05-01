# Service 환경 변수 설정

`packages/service`는 API 프로세스와 worker 프로세스를 분리해서 실행합니다. 환경 변수 검증은 `src/infrastructure/config/service-config.ts`에서 중앙 관리하며, 필수 값이 없거나 타입이 맞지 않으면 애플리케이션 시작 시 실패합니다.

## 설정 파일

| 파일 | 대상 | 설명 |
|---|---|---|
| `packages/service/.env` | API | `ServiceConfigModule.forApi()`가 읽는 기본 API 실행 환경입니다. |
| `packages/service/.env.worker` | Worker | `ServiceConfigModule.forWorker()`가 읽는 worker 실행 환경입니다. |
| `packages/service/.env.example` | 예시 | API와 worker에 필요한 값을 한 파일에 모아 둔 템플릿입니다. |
| `packages/service/.env.worker.example` | 예시 | Worker 실행에 필요한 값만 모아 둔 템플릿입니다. |

로컬에서는 예시 파일을 기준으로 필요한 파일을 만듭니다.

```bash
cp packages/service/.env.example packages/service/.env
cp packages/service/.env.worker.example packages/service/.env.worker
```

`.env.worker`는 worker 전용 값도 필요합니다. API만 실행할 때는 worker 전용 값을 사용하지 않습니다.

## 공통 환경 변수

API와 worker가 함께 사용하는 값입니다.

| 이름 | 필수 | 예시 | 설명 |
|---|---:|---|---|
| `NODE_ENV` | 아니오 | `development` | 실행 환경입니다. `development`, `production`, `test`만 허용하며 기본값은 `development`입니다. |
| `DB_HOST` | 예 | `localhost` | PostgreSQL 호스트입니다. |
| `DB_PORT` | 예 | `5432` | PostgreSQL 포트입니다. 양의 정수여야 합니다. |
| `DB_NAME` | 예 | `gc_project` | PostgreSQL 데이터베이스 이름입니다. |
| `DB_USER` | 예 | `gc_user` | PostgreSQL 사용자입니다. |
| `DB_PASSWORD` | 예 | `gc_password` | PostgreSQL 비밀번호입니다. 실제 운영 값은 저장소에 커밋하지 않습니다. |
| `REDIS_URL` | 예 | `redis://localhost:6379` | Redis 접속 URL입니다. |
| `ADDRESS_SEARCH_ADAPTER` | 예 | `local` | 주소 검색 어댑터입니다. `local`, `juso` 중 하나입니다. |
| `JUSO_API_KEY` | 조건부 | 빈 값 | `ADDRESS_SEARCH_ADAPTER=juso`일 때만 필수입니다. |
| `ACCESS_TOKEN_TTL_SECONDS` | 예 | `900` | access token TTL입니다. 초 단위 양의 정수입니다. |
| `REFRESH_TOKEN_TTL_SECONDS` | 예 | `1209600` | refresh token TTL입니다. 초 단위 양의 정수입니다. |
| `SEAT_HOLD_TTL_SECONDS` | 예 | `600` | 좌석 임시점유 응답 TTL입니다. 초 단위 양의 정수입니다. |
| `LOCAL_PAYMENT_CALLBACK_URL` | 예 | `http://localhost:3000/payments/callback` | 로컬 결제 어댑터가 callback을 보낼 URL입니다. |
| `LOCAL_PAYMENT_CALLBACK_DELAY_SECONDS` | 예 | `3` | 로컬 결제 callback 지연 시간입니다. 초 단위이며 `0` 이상이어야 합니다. |
| `MIGRATIONS_RUN_ON_STARTUP` | 아니오 | `false` | API 시작 시 migration 실행 여부입니다. 기본값은 `false`입니다. |

## API 전용 환경 변수

| 이름 | 필수 | 예시 | 설명 |
|---|---:|---|---|
| `PORT` | 예 | `3000` | API HTTP 서버 포트입니다. |

## Worker 전용 환경 변수

| 이름 | 필수 | 예시 | 설명 |
|---|---:|---|---|
| `PAYMENT_OUTBOX_WORKER_ENABLED` | 예 | `true` | 결제 outbox worker 실행 여부입니다. `true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off` 형식을 허용합니다. |
| `PAYMENT_OUTBOX_WORKER_INTERVAL_MS` | 예 | `1000` | outbox polling 주기입니다. 밀리초 단위 양의 정수입니다. |

## 실행 명령어

```bash
pnpm run dev:service
pnpm run dev:worker
pnpm run dev:service:all
```

빌드된 산출물 실행:

```bash
pnpm run service
pnpm run worker
pnpm run service:all
```

## 운영 규칙

- 환경 변수 키는 코드에서 `ENV_KEY`로만 참조합니다.
- `process.env` 직접 접근은 config infrastructure 또는 테스트 부팅 보조 코드에만 제한합니다.
- 필수 값의 fallback 기본값은 구현체 내부에 두지 않습니다. 기본값은 `service-config.ts`의 Joi schema에서만 관리합니다.
- `ConfigModule.forRoot(...)`는 API/worker 루트 모듈에서 `isGlobal: true`로 한 번만 등록합니다.
- 비밀번호, API key, 운영 접속 URL 같은 secret은 문서나 예시 파일에 실제 값을 기록하지 않습니다.

# UI 환경 변수 설정

`packages/ui`는 Vite 기반 브라우저 애플리케이션입니다. 브라우저에 노출되는 환경 변수만 사용할 수 있으며, 모든 클라이언트 환경 변수는 `VITE_` prefix를 가져야 합니다.

## 설정 파일

| 파일 | 대상 | 설명 |
|---|---|---|
| `packages/ui/.env` | UI 개발 서버와 빌드 | Vite가 읽는 로컬 환경 파일입니다. |
| `packages/ui/.env.example` | 예시 | UI 실행에 필요한 공개 설정 템플릿입니다. |

로컬에서는 예시 파일을 기준으로 `.env`를 만듭니다.

```bash
cp packages/ui/.env.example packages/ui/.env
```

## 환경 변수

| 이름 | 필수 | 예시 | 설명 |
|---|---:|---|---|
| `VITE_API_BASE_URL` | 아니오 | `http://localhost:3000` | 실제 API 요청을 보낼 service base URL입니다. 설정하지 않으면 코드에서 `http://localhost:3000`을 사용합니다. |
| `VITE_API_MODE` | 아니오 | `mock` | API 모드입니다. `mock`이면 로컬 mock API를 사용하고, `real` 또는 `api`이면 `VITE_API_BASE_URL`로 요청합니다. |
| `VITE_API_MOCK` | 아니오 | `false` | 기존 호환용 값입니다. 새 설정은 `VITE_API_MODE`를 우선 사용합니다. |

## API 모드 선택

```text
VITE_API_MODE=mock  -> src/lib/mockApi.ts 응답 사용
VITE_API_MODE=real  -> VITE_API_BASE_URL로 실제 API 요청
VITE_API_MODE=api   -> real과 동일
```

`VITE_API_MODE`가 없고 `VITE_API_MOCK=false`이면 실제 API를 사용합니다. 둘 다 없으면 개발 모드에서는 mock API를, 그 외 모드에서는 실제 API를 사용합니다.

## 실행 명령어

```bash
pnpm run dev:ui
```

루트에서 전체 개발 모드를 실행할 때도 동일한 UI 환경 파일을 사용합니다.

```bash
pnpm dev
```

## 보안 규칙

- `VITE_` 변수는 빌드 결과에 포함되어 브라우저에서 볼 수 있습니다.
- client secret, API secret, DB 접속 정보, private key는 UI 환경 변수에 절대 넣지 않습니다.
- API 인증 토큰은 서버에서 발급받은 사용자 세션 값만 사용하고, 사전에 고정된 secret을 UI에 저장하지 않습니다.
- API 요청은 `src/lib/apiClient.ts`를 통해서만 수행합니다.

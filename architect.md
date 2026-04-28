# 영화 예매 서비스 시스템 설계 문서

## 1. 개요

영화 예매 서비스의 핵심 도메인 설계 문서입니다. 회원 가입부터 영화 조회, 좌석 선택, 예매, 결제, 이력 관리까지의 흐름을 다루며 동시성이 높은 좌석 점유 처리를 위해 Redis와 DB를 조합한 복합 방식을 채택합니다.

### 1.1 핵심 도메인

- 회원 (Member)
- 영화 (Movie)
- 영화 이미지 (Movie Image)
- 극장 (Theater)
- 상영관 / 좌석 (Screen / Seat)
- 상영 일정 (Screening)
- 예매 (Reservation)
- 좌석 점유 (Seat Hold) — Redis + DB 복합
- 예매 이벤트 기록 (Reservation Event)

### 1.2 기술 스택

- RDB: **PostgreSQL 15+**
- Cache / Lock: Redis
- 애플리케이션: NestJS

---

## 2. 도메인 관계도

```mermaid
erDiagram
    MEMBER ||--o{ RESERVATION : "예약한다"
    MOVIE ||--o{ SCREENING : "상영된다"
    MOVIE ||--o{ MOVIE_IMAGE : "이미지를 가진다"
    THEATER ||--o{ SCREEN : "보유한다"
    SCREEN ||--o{ SCREENING : "배정된다"
    SCREEN ||--o{ SEAT : "보유한다"
    SCREENING ||--o{ RESERVATION : "예매 대상"
    RESERVATION ||--o{ RESERVATION_SEAT : "좌석 예매"
    SEAT ||--o{ RESERVATION_SEAT : "예약된다"
    RESERVATION ||--o{ RESERVATION_EVENT : "이벤트 기록"

    MEMBER ||--o{ SEAT_HOLD : "점유 요청"
    SCREENING ||--o{ SEAT_HOLD : "상영 좌석 점유"
    SEAT ||--o{ SEAT_HOLD : "점유된다"
    RESERVATION ||--o{ SEAT_HOLD : "확정 연결"

    MEMBER {
        bigint id PK
        varchar user_id
        varchar phone_number
        varchar status
    }

    MOVIE {
        bigint id PK
        varchar title
        int running_time
    }

    MOVIE_IMAGE {
        bigint id PK
        bigint movie_id FK
        varchar image_type
        varchar url
    }

    THEATER {
        bigint id PK
        varchar name
        varchar address
        double latitude
        double longitude
    }

    SCREEN {
        bigint id PK
        bigint theater_id FK
        varchar name
        int total_seats
    }

    SEAT {
        bigint id PK
        bigint screen_id FK
        varchar seat_row
        int seat_col
    }

    SCREENING {
        bigint id PK
        bigint movie_id FK
        bigint screen_id FK
        timestamptz start_at
    }

    RESERVATION {
        bigint id PK
        varchar reservation_number
        bigint member_id FK
        bigint screening_id FK
        varchar status
    }

    RESERVATION_SEAT {
        bigint id PK
        bigint reservation_id FK
        bigint screening_id FK
        bigint seat_id FK
    }

    SEAT_HOLD {
        bigint id PK
        bigint screening_id FK
        bigint seat_id FK
        bigint member_id FK
        bigint reservation_id FK
        varchar status
        timestamptz expires_at
    }

    RESERVATION_EVENT {
        bigint id PK
        bigint reservation_id FK
        varchar event_type
        timestamptz created_at
    }
```

---

## 3. 테이블 설계

> PostgreSQL 컨벤션에 맞춰 `BIGSERIAL`(또는 `GENERATED ALWAYS AS IDENTITY`), `TIMESTAMPTZ`, `JSONB` 등을 사용합니다. 시간 컬럼은 타임존을 포함한 `TIMESTAMPTZ`로 통일합니다.

### 3.1 member (회원)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 회원 ID |
| user_id | VARCHAR(30) | UNIQUE, NOT NULL | 로그인 ID |
| password_hash | VARCHAR(255) | NOT NULL | 암호화된 비밀번호 |
| name | VARCHAR(50) | NOT NULL | 이름 |
| birth_date | DATE | NOT NULL | 생년월일 |
| phone_number | VARCHAR(20) | UNIQUE, NOT NULL | 휴대폰 번호 |
| address | VARCHAR(255) | NOT NULL | 주소 |
| status | VARCHAR(20) | NOT NULL | ACTIVE, LOCKED 등 |
| failed_login_count | INT | NOT NULL DEFAULT 0 | 로그인 실패 횟수 |
| locked_at | TIMESTAMPTZ | | 잠금 일시 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 가입일시 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정일시 |

### 3.2 movie (영화)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 영화 ID |
| title | VARCHAR(200) | NOT NULL | 제목 |
| director | VARCHAR(100) | | 감독 |
| genre | VARCHAR(50) | | 장르 |
| running_time | INT | NOT NULL | 상영시간(분) |
| rating | VARCHAR(20) | | 관람등급 (ALL, 12, 15, 19) |
| release_date | DATE | | 개봉일 |
| poster_url | VARCHAR(500) | | 포스터 이미지 URL |
| description | TEXT | | 줄거리 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 등록일시 |

### 3.3 movie_image (영화 이미지)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 영화 이미지 ID |
| movie_id | BIGINT | FK → movie.id, NOT NULL | 영화 ID |
| image_type | VARCHAR(20) | NOT NULL | POSTER, STILL |
| url | VARCHAR(500) | NOT NULL | 이미지 URL |
| sort_order | INT | NOT NULL DEFAULT 0 | 노출 순서 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 등록일시 |

**인덱스:**

```sql
CREATE INDEX idx_movie_image_movie_type_order
  ON movie_image (movie_id, image_type, sort_order);
```

`movie.poster_url`은 기존 목록 API 호환용 대표 포스터 필드입니다. 신규 이미지 확장은 `movie_image`를 기준으로 저장하며, 목록 조회에서는 `movie_image`의 `POSTER`를 우선 사용합니다.

### 3.4 theater (극장)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 극장 ID |
| name | VARCHAR(100) | UNIQUE, NOT NULL | 극장명 |
| address | VARCHAR(255) | NOT NULL | 극장 주소 |
| latitude | DOUBLE PRECISION | | 위도 |
| longitude | DOUBLE PRECISION | | 경도 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 등록일시 |

### 3.5 screen (상영관)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 상영관 ID |
| theater_id | BIGINT | FK → theater.id, NOT NULL | 극장 ID |
| name | VARCHAR(50) | NOT NULL | 상영관명 (1관, IMAX 등) |
| total_seats | INT | NOT NULL | 총 좌석 수 |

### 3.6 seat (좌석)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 좌석 ID |
| screen_id | BIGINT | FK → screen.id | 상영관 ID |
| seat_row | VARCHAR(5) | NOT NULL | 행 (A, B, C...) |
| seat_col | INT | NOT NULL | 열 (1, 2, 3...) |
| seat_type | VARCHAR(20) | | NORMAL, COUPLE, DISABLED |

**제약:** `UNIQUE (screen_id, seat_row, seat_col)`

### 3.7 screening (상영 일정)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 상영 ID |
| movie_id | BIGINT | FK → movie.id | 영화 ID |
| screen_id | BIGINT | FK → screen.id | 상영관 ID |
| start_at | TIMESTAMPTZ | NOT NULL | 시작 시각 |
| end_at | TIMESTAMPTZ | NOT NULL | 종료 시각 |
| price | INT | NOT NULL | 기본 가격 |

### 3.8 reservation (예매)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 예매 ID |
| reservation_number | VARCHAR(20) | UNIQUE, NOT NULL | 예매번호 (예: R20260428001) |
| member_id | BIGINT | FK → member.id | 회원 ID |
| screening_id | BIGINT | FK → screening.id | 상영 ID |
| status | VARCHAR(20) | NOT NULL | PENDING, CONFIRMED, CANCELED, EXPIRED |
| total_price | INT | NOT NULL | 총 결제 금액 |
| canceled_at | TIMESTAMPTZ | NULL | 취소 일시 |
| cancel_reason | VARCHAR(100) | NULL | 취소 사유 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 예매일시 |

**인덱스:**

```sql
CREATE INDEX idx_reservation_member_created
  ON reservation (member_id, created_at DESC);

CREATE INDEX idx_reservation_member_status
  ON reservation (member_id, status, created_at DESC);
```

### 3.9 reservation_seat (예매-좌석 매핑)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| reservation_id | BIGINT | FK → reservation.id | 예매 ID |
| screening_id | BIGINT | FK → screening.id | 상영 ID |
| seat_id | BIGINT | FK → seat.id | 좌석 ID |

**핵심 제약:** `UNIQUE (screening_id, seat_id)` — 같은 상영의 같은 좌석 중복 예매 방지 (DB 레벨 최후 방어선)

### 3.10 seat_hold (좌석 점유 이력)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| screening_id | BIGINT | FK, NOT NULL | 상영 ID |
| seat_id | BIGINT | FK, NOT NULL | 좌석 ID |
| member_id | BIGINT | FK, NOT NULL | 점유한 회원 |
| reservation_id | BIGINT | FK, NULL | 예매 확정 시 연결 |
| status | VARCHAR(20) | NOT NULL | HELD, CONFIRMED, EXPIRED, RELEASED |
| expires_at | TIMESTAMPTZ | NOT NULL | 만료 예정 시각 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 점유 시작 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

**중요:** 이력 테이블이므로 `UNIQUE (screening_id, seat_id)` 제약을 걸지 않습니다. 같은 좌석에 대한 여러 점유 시도가 시간차로 누적되는 게 정상입니다 (HELD → EXPIRED → 다른 회원 HELD → CONFIRMED).

**인덱스 (PostgreSQL 부분 인덱스 활용):**

PostgreSQL은 부분 인덱스(Partial Index)를 지원하므로 `HELD` 상태만 인덱싱해 효율을 높일 수 있습니다.

```sql
-- 회원의 진행 중인 점유 조회
CREATE INDEX idx_hold_member_status
  ON seat_hold (member_id, status, created_at DESC);

-- 활성 점유만 인덱싱 (대부분의 조회는 HELD 상태)
CREATE INDEX idx_hold_screening_active
  ON seat_hold (screening_id)
  WHERE status = 'HELD';

-- 만료 처리 스케줄러용 (HELD 만료 대상만)
CREATE INDEX idx_hold_expires_active
  ON seat_hold (expires_at)
  WHERE status = 'HELD';
```

### 3.11 reservation_event (예매 이벤트 기록)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| reservation_id | BIGINT | FK → reservation.id, NOT NULL | 예매 ID |
| event_type | VARCHAR(30) | NOT NULL | CREATED, CONFIRMED, CANCELED, EXPIRED |
| description | VARCHAR(255) | | 부가 설명 (취소 사유 등) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 발생 시각 |

**인덱스:**

```sql
CREATE INDEX idx_reservation_event
  ON reservation_event (reservation_id, created_at);
```

**event_type 값:**

- `CREATED` — 예매 생성
- `CONFIRMED` — 결제 완료/확정
- `CANCELED` — 사용자 취소
- `EXPIRED` — 만료 처리

### 3.12 phone_verification (휴대전화 인증)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | BIGSERIAL | PK | 인증 요청 ID |
| phone_number | VARCHAR(20) | NOT NULL | 휴대전화번호 |
| code | VARCHAR(6) | NOT NULL | 인증 코드 |
| status | VARCHAR(20) | NOT NULL | PENDING, VERIFIED, EXPIRED |
| expires_at | TIMESTAMPTZ | NOT NULL | 만료 일시 |
| verified_at | TIMESTAMPTZ | | 인증 완료 일시 |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 생성 일시 |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | 수정 일시 |

**인덱스:**

```sql
CREATE INDEX idx_phone_verification_phone_status
  ON phone_verification (phone_number, status);
```
- `EXPIRED` — 결제 시간 초과로 자동 취소

> **선택 사항:** `event_type`은 `VARCHAR` 대신 PostgreSQL의 `ENUM` 타입으로 정의할 수도 있습니다. 다만 ENUM은 값 추가 시 `ALTER TYPE`이 필요해 운영 유연성이 떨어지므로, `VARCHAR + CHECK 제약` 또는 단순 `VARCHAR`를 권장합니다.

```sql
-- CHECK 제약으로 값 범위 보장 (선택)
ALTER TABLE reservation_event
  ADD CONSTRAINT chk_event_type
  CHECK (event_type IN ('CREATED', 'CONFIRMED', 'CANCELED', 'EXPIRED'));
```

---

## 4. 좌석 점유 설계 (복합 방식)

### 4.1 역할 분담

| 역할 | 저장소 | 목적 |
|---|---|---|
| 실시간 점유 락 | Redis | 좌석 클릭 순간의 동시성 차단, TTL 자동 만료 |
| 점유 이력 | DB (seat_hold) | 누가 언제 어떤 좌석을 점유했는지 기록, CS/분석용 |

**핵심 원칙:** Redis는 진실의 원천(source of truth), DB는 기록(log)

### 4.2 Redis 키 구조

```mermaid
flowchart LR
    A["Redis Key<br/>seat:hold:{screening_id}:{seat_id}"]
    B["Value<br/>{member_id}:{hold_id}"]
    C["TTL<br/>600초 (10분)"]

    A --> B
    A --> C
```

`hold_id`를 함께 저장하면 락 해제 시 DB 레코드를 바로 찾을 수 있습니다.

**상영별 점유 좌석 조회 최적화:** `KEYS` 명령은 운영에서 위험하므로 상영별 SET을 별도로 둡니다.

```mermaid
flowchart TD
    A["좌석 점유 요청"]
    B["MULTI 시작"]
    C["SET seat:hold:456:11<br/>값: 789:1001<br/>TTL: 600초"]
    D["SADD screening:456:held_seats 11"]
    E["EXEC"]
    F["상영별 점유 좌석 조회"]
    G["SMEMBERS screening:456:held_seats"]

    A --> B --> C --> D --> E
    F --> G
```

SET 멤버는 개별 TTL이 적용되지 않으므로 만료 처리 시 SREM으로 함께 제거해야 합니다.

### 4.3 좌석 가용 여부 조회

확정된 예매(DB) + 진행 중인 점유(Redis) 둘 다 확인합니다.

```mermaid
flowchart TD
    A["좌석 가용 여부 조회 요청"]
    B["DB 조회<br/>reservation_seat에서 확정 예매 좌석 조회"]
    C["Redis 조회<br/>screening:{screening_id}:held_seats 조회"]
    D["확정 좌석 + 점유 좌석 병합"]
    E["사용 불가 좌석 목록 응답"]

    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
```

### 4.4 PostgreSQL 단독 fallback (Redis 장애 시)

Redis 장애 시를 대비해 PostgreSQL의 `SELECT ... FOR UPDATE SKIP LOCKED`를 활용한 비관적 락 fallback이 가능합니다.

```sql
BEGIN;

-- 점유 가능 여부를 잠그며 확인
SELECT id FROM seat_hold
 WHERE screening_id = $1
   AND seat_id = $2
   AND status = 'HELD'
   AND expires_at > now()
 FOR UPDATE SKIP LOCKED;

-- 결과 없으면 INSERT 진행
INSERT INTO seat_hold (...) VALUES (...);

COMMIT;
```

`SKIP LOCKED`는 잠긴 행을 건너뛰므로 동시 요청 시 대기 없이 빠르게 실패 처리할 수 있어 큐 처리나 좌석 점유 같은 시나리오에 적합합니다.

### 4.5 동작 흐름

**좌석 선택**

```mermaid
flowchart TD
    A["좌석 선택 요청"]
    B{"Redis SET NX EX 600<br/>락 획득 성공?"}
    C["이미 선택된 좌석 응답"]
    D["DB seat_hold INSERT<br/>status = HELD"]
    E["점유 성공 응답<br/>10분 타이머 시작"]

    A --> B
    B -- "실패" --> C
    B -- "성공" --> D --> E
```

**결제 완료 (예매 확정)**

```mermaid
sequenceDiagram
    participant App as Application
    participant DB as PostgreSQL
    participant Redis as Redis

    App->>DB: BEGIN
    App->>DB: reservation INSERT (CONFIRMED)
    App->>DB: reservation_seat INSERT
    App->>DB: seat_hold UPDATE (CONFIRMED, reservation_id)
    App->>DB: reservation_event INSERT (CONFIRMED)
    App->>DB: COMMIT
    App->>Redis: DEL seat:hold:{screening_id}:{seat_id}
    Note over App,Redis: Redis 락 해제는 반드시 afterCommit 시점에 실행
```

**점유 만료 / 취소**

```mermaid
flowchart TD
    A["점유 만료 또는 사용자 취소"]
    B["Redis TTL 자동 만료<br/>또는 명시적 DEL"]
    C["DB 스케줄러 실행"]
    D["seat_hold.status = EXPIRED<br/>또는 RELEASED"]

    A --> B
    A --> C --> D
```

### 4.6 정합성 보장 포인트

**결제 완료 시 원자성**

Redis 락 해제는 반드시 DB 트랜잭션 **커밋 후**에 실행해야 합니다. 그렇지 않으면 DB 롤백 시 락이 풀려 다른 사용자가 같은 좌석을 점유하는 사고가 발생할 수 있습니다.

```java
@Transactional
public void confirmReservation(...) {
    // 1. DB 작업
    reservationSeatRepository.saveAll(...);
    seatHoldRepository.updateStatus(holdIds, CONFIRMED);

    // 2. 트랜잭션 커밋 후 Redis 락 해제
    TransactionSynchronizationManager.registerSynchronization(
        new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                redisTemplate.delete(keys);
            }
        }
    );
}
```

**Redis-DB 불일치 복구**

드물게 "Redis 락 획득 후 DB INSERT 실패" 같은 상황이 발생할 수 있습니다. 보정 방안:

- Redis 락 획득과 DB 작업을 같은 트랜잭션 흐름에 배치
- 보정 스케줄러: DB가 HELD인데 Redis에 키가 없는 레코드를 주기적으로 EXPIRED 처리

**최후의 방어선**

`reservation_seat`의 `UNIQUE (screening_id, seat_id)` 제약은 모든 동시성 제어가 실패해도 **DB 레벨에서 중복 예매를 차단**하는 최후 방어선입니다. 절대 제거하지 마세요.

PostgreSQL에서는 `INSERT ... ON CONFLICT (screening_id, seat_id) DO NOTHING` 패턴으로 중복 예매를 깔끔하게 처리할 수 있습니다.

```sql
INSERT INTO reservation_seat (reservation_id, screening_id, seat_id)
VALUES ($1, $2, $3)
ON CONFLICT (screening_id, seat_id) DO NOTHING
RETURNING id;
```

`RETURNING`이 빈 결과면 중복으로 판단해 예매를 롤백합니다.

### 4.7 만료 처리 스케줄러

DB만 정리하면 됩니다 (Redis는 TTL로 자동 처리).

```sql
-- 1분마다 실행
UPDATE seat_hold
   SET status = 'EXPIRED', updated_at = now()
 WHERE status = 'HELD'
   AND expires_at < now();
```

Spring `@Scheduled`, NestJS `@Cron`으로 구현합니다.

---

## 5. 주요 조회 쿼리

### 5.1 내 예매 내역 조회

PostgreSQL의 `string_agg` 함수를 사용합니다 (MySQL의 `GROUP_CONCAT`과 동일한 역할).

```sql
SELECT
    r.reservation_number,
    r.status,
    r.total_price,
    r.created_at,
    m.title              AS movie_title,
    m.poster_url,
    s.start_at,
    sc.name              AS screen_name,
    string_agg(
        seat.seat_row || seat.seat_col::text,
        ', ' ORDER BY seat.seat_row, seat.seat_col
    ) AS seats
FROM reservation r
JOIN screening s         ON s.id = r.screening_id
JOIN movie m             ON m.id = s.movie_id
JOIN screen sc           ON sc.id = s.screen_id
JOIN reservation_seat rs ON rs.reservation_id = r.id
JOIN seat                ON seat.id = rs.seat_id
WHERE r.member_id = $1
GROUP BY r.id, m.id, s.id, sc.id
ORDER BY r.created_at DESC
LIMIT 20 OFFSET 0;
```

> PostgreSQL은 `GROUP BY`에서 SELECT의 모든 비집계 컬럼을 명시해야 하지만, PK가 포함되면 같은 테이블의 다른 컬럼은 자동으로 함수적 종속(functional dependency)이 인정되어 SELECT에서 사용 가능합니다.

### 5.2 예매 내역 화면 분기

| 탭 | 조건 |
|---|---|
| 관람 예정 | `status = 'CONFIRMED' AND s.start_at > now()` |
| 관람 완료 | `status = 'CONFIRMED' AND s.start_at <= now()` |
| 취소 | `status = 'CANCELED'` |

### 5.3 예매 이력 조회

```sql
SELECT event_type, description, created_at
FROM reservation_event
WHERE reservation_id = $1
ORDER BY created_at ASC;
```

---

## 6. 상태 전이도

### 6.1 reservation.status

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> CONFIRMED: 결제 완료
    PENDING --> EXPIRED: 결제 시간 초과
    CONFIRMED --> CANCELED: 사용자 취소
```

### 6.2 seat_hold.status

```mermaid
stateDiagram-v2
    [*] --> HELD
    HELD --> CONFIRMED: 결제 완료
    HELD --> EXPIRED: 시간 초과
    HELD --> RELEASED: 사용자 취소
```

---

## 7. PostgreSQL 운영 고려사항

### 7.1 타임존

모든 시간 컬럼은 `TIMESTAMPTZ`로 통일해 UTC로 저장하고, 애플리케이션/조회 시점에 KST로 변환하는 정책을 권장합니다. DB 세션 타임존은 `SET TIME ZONE 'Asia/Seoul'`로 설정합니다.

### 7.2 VACUUM

`seat_hold`처럼 UPDATE/DELETE가 잦은 테이블은 dead tuple이 빠르게 쌓입니다. autovacuum 설정을 점검하고, 필요 시 테이블별 파라미터를 조정합니다.

```sql
ALTER TABLE seat_hold SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02
);
```

### 7.3 Connection Pool

PostgreSQL은 커넥션당 프로세스를 사용하므로 커넥션 수에 민감합니다. 애플리케이션 측 HikariCP 설정과 함께, 트래픽이 많다면 **PgBouncer** 도입을 검토합니다.

### 7.4 파티셔닝 (확장 시)

`seat_hold`, `reservation_event`는 시간이 지나면 빠르게 커지는 테이블입니다. PostgreSQL의 선언적 파티셔닝(Declarative Partitioning)으로 월별 RANGE 파티셔닝을 적용하면 운영이 수월해집니다.

```sql
CREATE TABLE seat_hold (
  ...
) PARTITION BY RANGE (created_at);

CREATE TABLE seat_hold_2026_04 PARTITION OF seat_hold
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
```

---

## 8. 향후 확장 고려사항

현재 설계 범위 밖이지만 운영 단계에서 추가 검토할 항목입니다.

- **payment**: 결제 수단, PG사 거래번호, 환불 정보
- **point / coupon**: 적립금·쿠폰 사용 내역
- **review**: 영화 리뷰 및 평점
- **읽기 전용 복제본(Read Replica)**: 영화/상영 일정 조회 트래픽이 많아질 경우 분리
- **PgBouncer**: 커넥션 풀링 미들웨어
- **시계열 데이터 아카이브**: 1년 이상 된 `seat_hold`, `reservation_event` 콜드 스토리지 이관

---

## 9. 전체 테이블 요약

| 테이블 | 용도 |
|---|---|
| member | 회원 정보 |
| movie | 영화 정보 |
| movie_image | 영화 이미지 정보 |
| theater | 극장 정보 |
| screen | 상영관 정보 |
| seat | 상영관별 물리 좌석 |
| screening | 상영 일정 |
| seat_hold | 좌석 점유 이력 (Redis와 복합) |
| reservation | 예매 정보 |
| reservation_seat | 예매-좌석 매핑 |
| reservation_event | 예매 상태 변경 이력 |
| phone_verification | 휴대전화 인증 이력 |

**인프라:** PostgreSQL 15+ / Redis

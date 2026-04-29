CREATE TABLE IF NOT EXISTS payment (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES member(id),
  seat_hold_id BIGINT NOT NULL REFERENCES seat_hold(id),
  idempotency_key VARCHAR(100) NOT NULL,
  reservation_id BIGINT NULL REFERENCES reservation(id),
  provider VARCHAR(20) NOT NULL,
  provider_payment_id VARCHAR(100) NULL,
  amount INT NOT NULL,
  status VARCHAR(30) NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL,
  approved_at TIMESTAMPTZ NULL,
  failed_at TIMESTAMPTZ NULL,
  refunded_at TIMESTAMPTZ NULL,
  failure_reason VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_member_created
  ON payment (member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_seat_hold
  ON payment (seat_hold_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_member_idempotency_key
  ON payment (member_id, idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_provider_payment_id
  ON payment (provider, provider_payment_id)
  WHERE provider_payment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS payment_event_log (
  id BIGSERIAL PRIMARY KEY,
  payment_id BIGINT NOT NULL REFERENCES payment(id),
  event_type VARCHAR(50) NOT NULL,
  previous_status VARCHAR(30) NULL,
  next_status VARCHAR(30) NOT NULL,
  provider VARCHAR(20) NOT NULL,
  provider_payment_id VARCHAR(100) NULL,
  amount INT NOT NULL,
  reason VARCHAR(255) NULL,
  metadata JSONB NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_event_log_payment_created
  ON payment_event_log (payment_id, created_at ASC);

CREATE TABLE IF NOT EXISTS outbox_event (
  id BIGSERIAL PRIMARY KEY,
  aggregate_type VARCHAR(50) NOT NULL,
  aggregate_id VARCHAR(50) NOT NULL,
  event_type VARCHAR(80) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) NOT NULL,
  retry_count INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ NULL,
  locked_until TIMESTAMPTZ NULL,
  last_error VARCHAR(500) NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outbox_publishable
  ON outbox_event (status, next_retry_at, occurred_at ASC);

CREATE INDEX IF NOT EXISTS idx_outbox_aggregate
  ON outbox_event (aggregate_type, aggregate_id);

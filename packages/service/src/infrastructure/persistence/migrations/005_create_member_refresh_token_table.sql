CREATE TABLE IF NOT EXISTS member_refresh_token (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES member(id),
  token VARCHAR(100) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_member_refresh_token_token
  ON member_refresh_token (token);

CREATE INDEX IF NOT EXISTS idx_member_refresh_token_member_active
  ON member_refresh_token (member_id, revoked_at, expires_at);

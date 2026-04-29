BEGIN;

CREATE TABLE IF NOT EXISTS theater (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_theater_name ON theater (name);

CREATE TABLE IF NOT EXISTS movie_image (
  id BIGSERIAL PRIMARY KEY,
  movie_id BIGINT NOT NULL REFERENCES movie (id),
  image_type VARCHAR(20) NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movie_image_movie_type_order
  ON movie_image (movie_id, image_type, sort_order);

ALTER TABLE screen
  ADD COLUMN IF NOT EXISTS theater_id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_screen_theater'
  ) THEN
    ALTER TABLE screen
      ADD CONSTRAINT fk_screen_theater
      FOREIGN KEY (theater_id)
      REFERENCES theater (id);
  END IF;
END $$;

COMMIT;

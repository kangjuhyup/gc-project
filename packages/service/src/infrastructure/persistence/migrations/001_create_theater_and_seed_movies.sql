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

INSERT INTO theater (name, address)
SELECT 'GC 시네마 강남', '서울특별시 강남구 테헤란로 427'
WHERE NOT EXISTS (
  SELECT 1
  FROM theater
  WHERE name = 'GC 시네마 강남'
);

UPDATE screen
SET theater_id = (
  SELECT id
  FROM theater
  WHERE name = 'GC 시네마 강남'
)
WHERE theater_id IS NULL;

ALTER TABLE screen
  ALTER COLUMN theater_id SET NOT NULL;

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

WITH theater_ref AS (
  SELECT id
  FROM theater
  WHERE name = 'GC 시네마 강남'
),
screen_seed AS (
  SELECT *
  FROM (
    VALUES
      ('1관', 80),
      ('2관', 80),
      ('IMAX', 120),
      ('3관', 80),
      ('4관', 80),
      ('아트관', 60)
  ) AS seed(name, total_seats)
),
inserted_screen AS (
  INSERT INTO screen (theater_id, name, total_seats)
  SELECT theater_ref.id, screen_seed.name, screen_seed.total_seats
  FROM theater_ref
  CROSS JOIN screen_seed
  WHERE NOT EXISTS (
    SELECT 1
    FROM screen
    WHERE screen.theater_id = theater_ref.id
      AND screen.name = screen_seed.name
  )
  RETURNING id, name, total_seats
),
all_screen AS (
  SELECT id, name, total_seats
  FROM inserted_screen
  UNION ALL
  SELECT screen.id, screen.name, screen.total_seats
  FROM screen
  JOIN theater_ref ON theater_ref.id = screen.theater_id
  WHERE screen.name IN ('1관', '2관', 'IMAX', '3관', '4관', '아트관')
),
seat_seed AS (
  SELECT all_screen.id AS screen_id, rows.seat_row, cols.seat_col
  FROM all_screen
  CROSS JOIN (
    VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J'), ('K'), ('L')
  ) AS rows(seat_row)
  CROSS JOIN generate_series(1, 10) AS cols(seat_col)
  WHERE (rows.seat_row, cols.seat_col) <= (
    chr(64 + CEIL(all_screen.total_seats / 10.0)::int),
    CASE
      WHEN all_screen.total_seats % 10 = 0 THEN 10
      ELSE all_screen.total_seats % 10
    END
  )
)
INSERT INTO seat (screen_id, seat_row, seat_col, seat_type)
SELECT seat_seed.screen_id, seat_seed.seat_row, seat_seed.seat_col, 'NORMAL'
FROM seat_seed
WHERE NOT EXISTS (
  SELECT 1
  FROM seat
  WHERE seat.screen_id = seat_seed.screen_id
    AND seat.seat_row = seat_seed.seat_row
    AND seat.seat_col = seat_seed.seat_col
);

WITH movie_seed AS (
  SELECT *
  FROM (
    VALUES
      ('파묘', '장재현', '미스터리', 134, '15', DATE '2024-02-22', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=560&q=80', '기묘한 의뢰를 받은 사람들이 오래된 비밀을 마주하는 오컬트 미스터리.'),
      ('듄: 파트 2', '드니 빌뇌브', 'SF', 166, '12', DATE '2024-02-28', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=560&q=80', '거대한 사막 행성에서 펼쳐지는 운명과 선택의 서사.'),
      ('인사이드 아웃 2', '켈시 만', '애니메이션', 96, 'ALL', DATE '2024-06-12', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=560&q=80', '새로운 감정들이 등장하며 더 넓어진 마음의 세계를 탐험한다.'),
      ('괴물', '고레에다 히로카즈', '드라마', 126, '12', DATE '2023-11-29', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=560&q=80', '엇갈린 시선 속에서 한 사건의 진실을 따라가는 섬세한 드라마.')
  ) AS seed(title, director, genre, running_time, rating, release_date, poster_url, description)
)
INSERT INTO movie (title, director, genre, running_time, rating, release_date, poster_url, description)
SELECT title, director, genre, running_time, rating, release_date, poster_url, description
FROM movie_seed
WHERE NOT EXISTS (
  SELECT 1
  FROM movie
  WHERE movie.title = movie_seed.title
);

WITH movie_image_seed AS (
  SELECT *
  FROM (
    VALUES
      ('파묘', 'POSTER', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=560&q=80', 0),
      ('파묘', 'STILL', 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=960&q=80', 1),
      ('듄: 파트 2', 'POSTER', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=560&q=80', 0),
      ('듄: 파트 2', 'STILL', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=960&q=80', 1),
      ('인사이드 아웃 2', 'POSTER', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=560&q=80', 0),
      ('인사이드 아웃 2', 'STILL', 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=960&q=80', 1),
      ('괴물', 'POSTER', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=560&q=80', 0),
      ('괴물', 'STILL', 'https://images.unsplash.com/photo-1523207911345-32501502db22?auto=format&fit=crop&w=960&q=80', 1)
  ) AS seed(movie_title, image_type, url, sort_order)
)
INSERT INTO movie_image (movie_id, image_type, url, sort_order)
SELECT movie.id, movie_image_seed.image_type, movie_image_seed.url, movie_image_seed.sort_order
FROM movie_image_seed
JOIN movie ON movie.title = movie_image_seed.movie_title
WHERE NOT EXISTS (
  SELECT 1
  FROM movie_image
  WHERE movie_image.movie_id = movie.id
    AND movie_image.image_type = movie_image_seed.image_type
    AND movie_image.url = movie_image_seed.url
);

WITH screening_seed AS (
  SELECT *
  FROM (
    VALUES
      ('파묘', '1관', TIMESTAMPTZ '2026-04-28 10:30:00+09', TIMESTAMPTZ '2026-04-28 12:44:00+09', 14000),
      ('파묘', '2관', TIMESTAMPTZ '2026-04-28 18:20:00+09', TIMESTAMPTZ '2026-04-28 20:34:00+09', 14000),
      ('듄: 파트 2', 'IMAX', TIMESTAMPTZ '2026-04-28 13:10:00+09', TIMESTAMPTZ '2026-04-28 15:56:00+09', 18000),
      ('듄: 파트 2', 'IMAX', TIMESTAMPTZ '2026-04-29 20:40:00+09', TIMESTAMPTZ '2026-04-29 23:26:00+09', 18000),
      ('인사이드 아웃 2', '3관', TIMESTAMPTZ '2026-04-29 09:50:00+09', TIMESTAMPTZ '2026-04-29 11:26:00+09', 12000),
      ('인사이드 아웃 2', '4관', TIMESTAMPTZ '2026-04-29 16:30:00+09', TIMESTAMPTZ '2026-04-29 18:06:00+09', 12000),
      ('괴물', '아트관', TIMESTAMPTZ '2026-04-30 11:20:00+09', TIMESTAMPTZ '2026-04-30 13:26:00+09', 13000),
      ('괴물', '아트관', TIMESTAMPTZ '2026-04-30 19:00:00+09', TIMESTAMPTZ '2026-04-30 21:06:00+09', 13000)
  ) AS seed(movie_title, screen_name, start_at, end_at, price)
)
INSERT INTO screening (movie_id, screen_id, start_at, end_at, price)
SELECT movie.id, screen.id, screening_seed.start_at, screening_seed.end_at, screening_seed.price
FROM screening_seed
JOIN movie ON movie.title = screening_seed.movie_title
JOIN screen ON screen.name = screening_seed.screen_name
JOIN theater ON theater.id = screen.theater_id AND theater.name = 'GC 시네마 강남'
WHERE NOT EXISTS (
  SELECT 1
  FROM screening
  WHERE screening.movie_id = movie.id
    AND screening.screen_id = screen.id
    AND screening.start_at = screening_seed.start_at
);

COMMIT;

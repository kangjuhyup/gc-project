import { Migration } from '@mikro-orm/migrations';

export class Migration202604300002SeedData extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
WITH theater_seed AS (
  SELECT *
  FROM (
    VALUES
      ('GC 시네마 강남', '서울특별시 강남구 테헤란로 427', 37.5065, 127.0530),
      ('GC 시네마 홍대', '서울특별시 마포구 양화로 160', 37.5563, 126.9236),
      ('GC 시네마 잠실', '서울특별시 송파구 올림픽로 300', 37.5133, 127.1040)
  ) AS seed(name, address, latitude, longitude)
)
INSERT INTO theater (name, address, latitude, longitude)
SELECT name, address, latitude, longitude
FROM theater_seed
WHERE NOT EXISTS (
  SELECT 1
  FROM theater
  WHERE theater.name = theater_seed.name
);

WITH screen_seed AS (
  SELECT *
  FROM (
    VALUES
      ('GC 시네마 강남', '1관', 80),
      ('GC 시네마 강남', '2관', 80),
      ('GC 시네마 강남', 'IMAX', 120),
      ('GC 시네마 강남', '3관', 80),
      ('GC 시네마 강남', '4관', 80),
      ('GC 시네마 강남', '아트관', 60),
      ('GC 시네마 홍대', '1관', 70),
      ('GC 시네마 홍대', '2관', 90),
      ('GC 시네마 홍대', '아트관', 60),
      ('GC 시네마 잠실', '1관', 80),
      ('GC 시네마 잠실', '2관', 90),
      ('GC 시네마 잠실', 'IMAX', 140)
  ) AS seed(theater_name, screen_name, total_seats)
),
inserted_screen AS (
  INSERT INTO screen (theater_id, name, total_seats)
  SELECT theater.id, screen_seed.screen_name, screen_seed.total_seats
  FROM screen_seed
  JOIN theater ON theater.name = screen_seed.theater_name
  WHERE NOT EXISTS (
    SELECT 1
    FROM screen
    WHERE screen.theater_id = theater.id
      AND screen.name = screen_seed.screen_name
  )
  RETURNING id, theater_id, name, total_seats
),
all_screen AS (
  SELECT id, theater_id, name, total_seats
  FROM inserted_screen
  UNION ALL
  SELECT screen.id, screen.theater_id, screen.name, screen.total_seats
  FROM screen
  JOIN theater ON theater.id = screen.theater_id
  JOIN screen_seed ON screen_seed.theater_name = theater.name AND screen_seed.screen_name = screen.name
),
seat_seed AS (
  SELECT all_screen.id AS screen_id, rows.seat_row, cols.seat_col
  FROM all_screen
  CROSS JOIN (
    VALUES ('A'), ('B'), ('C'), ('D'), ('E'), ('F'), ('G'), ('H'), ('I'), ('J'), ('K'), ('L'), ('M'), ('N')
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
      ('괴물', '고레에다 히로카즈', '드라마', 126, '12', DATE '2023-11-29', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=560&q=80', '엇갈린 시선 속에서 한 사건의 진실을 따라가는 섬세한 드라마.'),
      ('범죄도시 4', '허명행', '액션', 109, '15', DATE '2024-04-24', 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=560&q=80', '국경을 넘나드는 범죄 조직을 쫓는 강력반의 통쾌한 액션.'),
      ('웡카', '폴 킹', '판타지', 116, 'ALL', DATE '2024-01-31', 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=560&q=80', '초콜릿과 상상력으로 가득한 청년 발명가의 달콤한 모험.'),
      ('서울의 봄', '김성수', '역사', 141, '12', DATE '2023-11-22', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=560&q=80', '한 도시의 긴박했던 밤을 따라가는 정치 드라마.'),
      ('가여운 것들', '요르고스 란티모스', '블랙코미디', 141, '19', DATE '2024-03-06', 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=560&q=80', '세상의 규칙을 낯설게 바라보는 독창적인 성장 우화.'),
      ('퓨리오사: 매드맥스 사가', '조지 밀러', '액션', 148, '15', DATE '2024-05-22', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=560&q=80', '황무지를 가로지르는 전사들의 기원과 추격전.'),
      ('에이리언: 로물루스', '페데 알바레즈', '공포', 119, '15', DATE '2024-08-14', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=560&q=80', '버려진 우주 정거장에서 생존자들이 마주하는 SF 호러.'),
      ('라라랜드', '데이미언 셔젤', '뮤지컬', 128, '12', DATE '2016-12-07', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=560&q=80', '꿈과 사랑 사이에서 빛나는 계절을 지나가는 뮤지컬 로맨스.'),
      ('기생충', '봉준호', '스릴러', 132, '15', DATE '2019-05-30', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=560&q=80', '두 가족의 만남이 예상치 못한 균열로 번지는 사회 풍자 스릴러.')
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
      ('괴물', 'STILL', 'https://images.unsplash.com/photo-1523207911345-32501502db22?auto=format&fit=crop&w=960&q=80', 1),
      ('범죄도시 4', 'POSTER', 'https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=560&q=80', 0),
      ('범죄도시 4', 'STILL', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=960&q=80', 1),
      ('웡카', 'POSTER', 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&w=560&q=80', 0),
      ('웡카', 'STILL', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=960&q=80', 1),
      ('서울의 봄', 'POSTER', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=560&q=80', 0),
      ('서울의 봄', 'STILL', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=960&q=80', 1),
      ('가여운 것들', 'POSTER', 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?auto=format&fit=crop&w=560&q=80', 0),
      ('가여운 것들', 'STILL', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=960&q=80', 1),
      ('퓨리오사: 매드맥스 사가', 'POSTER', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=560&q=80', 0),
      ('퓨리오사: 매드맥스 사가', 'STILL', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=960&q=80', 1),
      ('에이리언: 로물루스', 'POSTER', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=560&q=80', 0),
      ('에이리언: 로물루스', 'STILL', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=960&q=80', 1),
      ('라라랜드', 'POSTER', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=560&q=80', 0),
      ('라라랜드', 'STILL', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=960&q=80', 1),
      ('기생충', 'POSTER', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=560&q=80', 0),
      ('기생충', 'STILL', 'https://images.unsplash.com/photo-1523207911345-32501502db22?auto=format&fit=crop&w=960&q=80', 1)
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

WITH screening_days AS (
  SELECT *
  FROM (
    VALUES
      (DATE '2026-05-01'),
      (DATE '2026-05-02'),
      (DATE '2026-05-03')
  ) AS seed(screen_date)
),
screening_template AS (
  SELECT *
  FROM (
    VALUES
      ('GC 시네마 강남', '파묘', '1관', TIME '10:00', 14000),
      ('GC 시네마 강남', '범죄도시 4', '1관', TIME '12:50', 14000),
      ('GC 시네마 강남', '파묘', '1관', TIME '15:20', 15000),
      ('GC 시네마 강남', '범죄도시 4', '1관', TIME '18:10', 15000),
      ('GC 시네마 강남', '듄: 파트 2', 'IMAX', TIME '10:30', 19000),
      ('GC 시네마 강남', '듄: 파트 2', 'IMAX', TIME '14:00', 19000),
      ('GC 시네마 강남', '듄: 파트 2', 'IMAX', TIME '17:30', 20000),
      ('GC 시네마 홍대', '파묘', '1관', TIME '09:00', 13000),
      ('GC 시네마 홍대', '범죄도시 4', '1관', TIME '11:40', 13000),
      ('GC 시네마 홍대', '파묘', '1관', TIME '14:10', 13000),
      ('GC 시네마 홍대', '범죄도시 4', '1관', TIME '17:00', 14000),
      ('GC 시네마 홍대', '파묘', '1관', TIME '19:30', 14000),
      ('GC 시네마 홍대', '듄: 파트 2', '2관', TIME '09:30', 15000),
      ('GC 시네마 홍대', '듄: 파트 2', '2관', TIME '13:00', 15000),
      ('GC 시네마 홍대', '듄: 파트 2', '2관', TIME '16:30', 16000),
      ('GC 시네마 잠실', '파묘', '1관', TIME '09:30', 14000),
      ('GC 시네마 잠실', '범죄도시 4', '1관', TIME '12:10', 14000),
      ('GC 시네마 잠실', '파묘', '1관', TIME '14:40', 15000),
      ('GC 시네마 잠실', '범죄도시 4', '1관', TIME '17:20', 15000),
      ('GC 시네마 잠실', '파묘', '1관', TIME '20:00', 15000),
      ('GC 시네마 잠실', '듄: 파트 2', 'IMAX', TIME '10:00', 19000),
      ('GC 시네마 잠실', '듄: 파트 2', 'IMAX', TIME '13:40', 19000),
      ('GC 시네마 잠실', '듄: 파트 2', 'IMAX', TIME '17:20', 20000)
  ) AS seed(theater_name, movie_title, screen_name, start_time, price)
),
screening_seed AS (
  SELECT
    screening_template.theater_name,
    screening_template.movie_title,
    screening_template.screen_name,
    ((screening_days.screen_date + screening_template.start_time) AT TIME ZONE 'Asia/Seoul') AS start_at,
    screening_template.price
  FROM screening_days
  CROSS JOIN screening_template
)
INSERT INTO screening (movie_id, screen_id, start_at, end_at, price)
SELECT
  movie.id,
  screen.id,
  screening_seed.start_at,
  screening_seed.start_at + (movie.running_time * INTERVAL '1 minute'),
  screening_seed.price
FROM screening_seed
JOIN movie ON movie.title = screening_seed.movie_title
JOIN theater ON theater.name = screening_seed.theater_name
JOIN screen ON screen.theater_id = theater.id AND screen.name = screening_seed.screen_name
WHERE NOT EXISTS (
  SELECT 1
  FROM screening
  WHERE screening.movie_id = movie.id
    AND screening.screen_id = screen.id
    AND screening.start_at = screening_seed.start_at
);
`);
  }
}

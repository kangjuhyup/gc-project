BEGIN;

ALTER TABLE theater
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

UPDATE theater
SET
  latitude = 37.5065,
  longitude = 127.0530
WHERE name = 'GC 시네마 강남'
  AND (latitude IS NULL OR longitude IS NULL);

COMMIT;

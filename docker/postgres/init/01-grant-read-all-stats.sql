DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gc_user') THEN
    GRANT pg_read_all_stats TO gc_user;
  END IF;
END
$$;

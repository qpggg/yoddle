ALTER SYSTEM SET password_encryption = ''md5'';
SELECT pg_reload_conf();
SHOW password_encryption;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname=''f1111323_yoddle'') THEN
    CREATE ROLE f1111323_yoddle LOGIN;
  END IF;
END
$$;
ALTER ROLE f1111323_yoddle WITH LOGIN PASSWORD ''Nei3wmOK'';

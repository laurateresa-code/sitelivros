-- ROLLBACK SCRIPT
-- Reverts changes related to the 'welcome message' feature

BEGIN;

-- 1. Remove function
DROP FUNCTION IF EXISTS public.get_app_setting(TEXT);

-- 2. Remove table from Realtime publication
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'app_settings') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.app_settings;
  END IF;
END
$$;

-- 3. Drop table app_settings (and its policies)
DROP TABLE IF EXISTS public.app_settings CASCADE;

-- 4. Clean up notifications table ONLY IF it was created by us and unwanted
-- However, since the user said "principalmente do sql editor ... tentativas de mudar a mensagem fixada"
-- I will be conservative and NOT drop notifications unless explicitly asked, as it might break other things if dependencies exist.
-- But I will remove it from realtime if I added it.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;
  END IF;
END
$$;

-- 5. Reload config to clear cache
NOTIFY pgrst, 'reload config';

COMMIT;

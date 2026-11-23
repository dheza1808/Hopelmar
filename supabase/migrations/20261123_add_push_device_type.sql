BEGIN;

ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS device_type TEXT NOT NULL DEFAULT 'desktop'
  CHECK (device_type IN ('mobile', 'desktop'));

COMMIT;

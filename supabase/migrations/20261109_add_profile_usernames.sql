BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

WITH unique_usernames AS (
  SELECT
    id,
    LOWER(SPLIT_PART(email, '@', 1)) AS username
  FROM public.profiles
  WHERE email LIKE '%@%'
    AND LOWER(SPLIT_PART(email, '@', 1)) ~ '^[a-z0-9._-]{3,64}$'
),
unambiguous_usernames AS (
  SELECT username
  FROM unique_usernames
  GROUP BY username
  HAVING COUNT(*) = 1
)
UPDATE public.profiles AS profile
SET username = candidate.username
FROM unique_usernames AS candidate
JOIN unambiguous_usernames AS unambiguous USING (username)
WHERE profile.id = candidate.id
  AND profile.username IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (LOWER(username))
  WHERE username IS NOT NULL;

COMMIT;

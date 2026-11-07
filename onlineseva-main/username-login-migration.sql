-- Online Seva JLS: username login migration
-- Run this AFTER the earlier profiles table setup succeeded.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Backfill existing profiles with a username based on the old Auth email prefix.
UPDATE public.profiles
SET username = lower(split_part(email, '@', 1))
WHERE username IS NULL AND email IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
ON public.profiles (lower(username)) WHERE username IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_online_seva_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, username, contact_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'),
    NEW.email,
    lower(NEW.raw_user_meta_data->>'username'),
    NULLIF(NEW.raw_user_meta_data->>'contact_email', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    username = EXCLUDED.username,
    contact_email = EXCLUDED.contact_email;
  RETURN NEW;
END;
$$;

-- Username must be present and unique. Never allow customers to change role.
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format
CHECK (username IS NULL OR username ~ '^[a-z0-9._-]{4,30}$');

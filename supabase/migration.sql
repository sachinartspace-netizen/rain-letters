-- ============================================================================
-- RAIN LETTERS — Database Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================================================

-- ============================================================================
-- 1. EMAIL ALLOWLIST
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed authorized users
INSERT INTO public.allowed_emails (email, display_name) VALUES
  ('pratimahansda14@gmail.com', 'Pratima'),
  ('pratimahansda18@gmail.com', 'Pratima'),
  ('praticreates@gmail.com', 'Pratima'),
  ('sachin.artspace@gmail.com', 'Sachin'),
  ('sachingupta706155@gmail.com', 'Sachin'),
  ('sachingupta766741@gmail.com', 'Sachin')
ON CONFLICT (email) DO NOTHING;

-- RLS: No public access to allowlist table
ALTER TABLE public.allowed_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct public access to allowlist"
  ON public.allowed_emails FOR ALL USING (false);

-- ============================================================================
-- 2. HELPER FUNCTION: Check if current user is in allowlist
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_allowed_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.allowed_emails
    WHERE LOWER(email) = LOWER(auth.jwt() ->> 'email')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 3. PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT 'Anonymous',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view profiles"
  ON public.profiles FOR SELECT
  USING (public.is_allowed_user());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND public.is_allowed_user());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id AND public.is_allowed_user());

-- ============================================================================
-- 4. MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT NOT NULL DEFAULT 'Anonymous',
  message TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can read messages"
  ON public.messages FOR SELECT
  USING (public.is_allowed_user());

CREATE POLICY "Allowed users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.is_allowed_user());

-- No UPDATE or DELETE policies = messages are permanent

-- ============================================================================
-- 5. GARDEN TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.garden (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  growth FLOAT DEFAULT 0 CHECK (growth >= 0 AND growth <= 100),
  total_shared_minutes FLOAT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert initial garden state
INSERT INTO public.garden (growth, total_shared_minutes) VALUES (0, 0);

ALTER TABLE public.garden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view garden"
  ON public.garden FOR SELECT
  USING (public.is_allowed_user());

CREATE POLICY "Allowed users can update garden"
  ON public.garden FOR UPDATE
  USING (public.is_allowed_user());

-- ============================================================================
-- 6. PRESENCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.presence (
  user_id UUID REFERENCES public.profiles(id) PRIMARY KEY,
  online BOOLEAN DEFAULT false,
  typing BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allowed users can view presence"
  ON public.presence FOR SELECT
  USING (public.is_allowed_user());

CREATE POLICY "Users can manage own presence"
  ON public.presence FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_allowed_user());

CREATE POLICY "Users can update own presence"
  ON public.presence FOR UPDATE
  USING (auth.uid() = user_id AND public.is_allowed_user());

-- ============================================================================
-- 7. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_display_name TEXT;
BEGIN
  -- Only create profile if user is in allowlist
  IF EXISTS (SELECT 1 FROM public.allowed_emails WHERE LOWER(email) = LOWER(NEW.email)) THEN
    -- Get display name from allowlist
    SELECT display_name INTO v_display_name
    FROM public.allowed_emails
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    -- Create profile
    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(v_display_name, split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data ->> 'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
      last_seen = now();

    -- Create presence record
    INSERT INTO public.presence (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 8. REALTIME CONFIGURATION
-- ============================================================================
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.garden REPLICA IDENTITY FULL;
ALTER TABLE public.presence REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.garden;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.presence;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

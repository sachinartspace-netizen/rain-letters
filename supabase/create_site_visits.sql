-- ============================================================================
-- CREATE SITE VISITS TABLE (Device Model & Visitor Tracking)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  device_brand TEXT,
  device_model TEXT,
  os TEXT,
  browser TEXT,
  screen_size TEXT,
  language TEXT,
  page_visited TEXT,
  user_email TEXT,
  city TEXT,
  country TEXT
);

-- Enable Row Level Security
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- Allow anyone (visitors) to log their visit
CREATE POLICY "Allow public insert to site_visits"
  ON public.site_visits
  FOR INSERT
  WITH CHECK (true);

-- Allow reading visit logs
CREATE POLICY "Allow public read of site_visits"
  ON public.site_visits
  FOR SELECT
  USING (true);

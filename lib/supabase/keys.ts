const strip = (v: string | undefined, fallback: string) =>
  (v ?? fallback).replace(/\uFEFF/g, '').trim();

export const SUPABASE_URL =
  strip(process.env.NEXT_PUBLIC_SUPABASE_URL, 'https://joxliieaxokhptnwuckd.supabase.co');

export const SUPABASE_ANON_KEY = strip(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpveGxpaWVheG9raHB0bnd1Y2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NjUwNzIsImV4cCI6MjA5NTM0MTA3Mn0.0QnkBPjg04Oen8Q71Bh6Uinnb-yR60NYYHYRGb9eZyY',
);

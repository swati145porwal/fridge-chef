-- Optional Supabase schema for cloud accounts + synced preferences
-- Run in Supabase SQL editor when NEXT_PUBLIC_SUPABASE_URL is configured

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  emoji text default '👤',
  prefs jsonb default '{}'::jsonb,
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_profiles enable row level security;

create policy "Users manage own profile"
  on public.user_profiles
  for all
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

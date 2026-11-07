-- Online Seva JLS: run this entire script in Supabase SQL Editor.
-- It creates customer profiles, secure row-level policies and an admin helper.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Customer',
  email text,
  role text not null default 'customer' check (role in ('customer','admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_online_seva_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active = true); $$;

create or replace function public.handle_new_online_seva_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name','Customer'), new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_online_seva on auth.users;
create trigger on_auth_user_created_online_seva
after insert on auth.users for each row execute procedure public.handle_new_online_seva_user();

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles
for select to authenticated using (public.is_online_seva_admin());

drop policy if exists "Admins can update customer profiles" on public.profiles;
create policy "Admins can update customer profiles" on public.profiles
for update to authenticated using (public.is_online_seva_admin()) with check (public.is_online_seva_admin());

-- IMPORTANT: after creating your own account through the website, replace the email below
-- with your registered admin email and run this statement once:
-- update public.profiles set role = 'admin' where email = 'YOUR_ADMIN_EMAIL@example.com';
-- Do not expose a service_role key in website files.

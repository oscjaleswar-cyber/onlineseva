-- Run once in Supabase SQL Editor to enable secure permanent customer deletion.
-- Only an active admin can call this function. Deleting auth.users also removes the
-- matching public.profiles row because profiles.id references auth.users(id) ON DELETE CASCADE.
create or replace function public.admin_delete_customer(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce(public.is_online_seva_admin(), false) then
    raise exception 'Only an active admin can delete customer accounts';
  end if;

  if target_user_id is null or target_user_id = auth.uid() then
    raise exception 'Invalid customer account';
  end if;

  delete from auth.users
  where id = target_user_id
    and coalesce(raw_user_meta_data->>'username', '') <> '';

  if not found then
    raise exception 'Customer account not found or not eligible for deletion';
  end if;
end;
$$;

revoke all on function public.admin_delete_customer(uuid) from public;
revoke all on function public.admin_delete_customer(uuid) from anon;
grant execute on function public.admin_delete_customer(uuid) to authenticated;

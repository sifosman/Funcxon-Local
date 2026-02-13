create table if not exists public.vendor_catalogue_items (
  id bigserial primary key,
  vendor_id bigint not null references public.vendors(id) on delete cascade,
  title text not null,
  description text,
  price numeric,
  currency text not null default 'ZAR',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_catalogue_items_vendor_id_idx on public.vendor_catalogue_items (vendor_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_vendor_catalogue_items_updated_at on public.vendor_catalogue_items;
create trigger set_vendor_catalogue_items_updated_at
before update on public.vendor_catalogue_items
for each row
execute function public.set_updated_at();

alter table public.vendor_catalogue_items enable row level security;

-- Public read so attendees can view vendor catalogues
drop policy if exists "Public can read vendor catalogue items" on public.vendor_catalogue_items;
create policy "Public can read vendor catalogue items"
  on public.vendor_catalogue_items
  for select
  using (true);

-- Only the vendor owner can write
drop policy if exists "Vendors can insert their catalogue items" on public.vendor_catalogue_items;
create policy "Vendors can insert their catalogue items"
  on public.vendor_catalogue_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.vendors v
      where v.id = vendor_catalogue_items.vendor_id
        and v.user_id = auth.uid()
    )
  );

drop policy if exists "Vendors can update their catalogue items" on public.vendor_catalogue_items;
create policy "Vendors can update their catalogue items"
  on public.vendor_catalogue_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.vendors v
      where v.id = vendor_catalogue_items.vendor_id
        and v.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.vendors v
      where v.id = vendor_catalogue_items.vendor_id
        and v.user_id = auth.uid()
    )
  );

drop policy if exists "Vendors can delete their catalogue items" on public.vendor_catalogue_items;
create policy "Vendors can delete their catalogue items"
  on public.vendor_catalogue_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.vendors v
      where v.id = vendor_catalogue_items.vendor_id
        and v.user_id = auth.uid()
    )
  );

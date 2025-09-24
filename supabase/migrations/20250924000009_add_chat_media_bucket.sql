-- Create chat-media bucket if not exists
insert into storage.buckets (id, name, public)
select 'chat-media', 'chat-media', true
where not exists (
  select 1 from storage.buckets where id = 'chat-media'
);

-- Public read policy for chat-media
create policy if not exists "Public read access for chat-media"
  on storage.objects for select
  using ( bucket_id = 'chat-media' );

-- Authenticated users can upload to chat-media
create policy if not exists "Users can upload to chat-media"
  on storage.objects for insert
  with check (
    bucket_id = 'chat-media' and auth.role() = 'authenticated'
  );

-- Owners can delete their own files
create policy if not exists "Owners can delete their files in chat-media"
  on storage.objects for delete
  using (
    bucket_id = 'chat-media' and (owner = auth.uid() or auth.role() = 'service_role')
  );

-- Ensure users table has push_token column
alter table if exists public.users
  add column if not exists push_token text; 
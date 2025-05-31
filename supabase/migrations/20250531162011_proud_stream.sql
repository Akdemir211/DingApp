-- Tamamlanan ödevleri 24 saat sonra silen fonksiyon
create or replace function cleanup_completed_assignments()
returns void
language plpgsql
security definer
as $$
begin
  delete from user_assignments
  where is_completed = true
  and created_at < now() - interval '24 hours';
end;
$$;

-- Her saat başı çalışacak cron job
select cron.schedule(
  'cleanup-completed-assignments',
  '0 * * * *', -- Her saat başı
  $$
  select cleanup_completed_assignments();
  $$
);
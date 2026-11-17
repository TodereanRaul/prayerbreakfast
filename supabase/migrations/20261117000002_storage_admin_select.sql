-- The Storage API can only delete (or replace) a file it is allowed to see.
-- Without this, replaced photos were left behind in the bucket.
create policy "Admins see event images"
  on storage.objects for select to authenticated
  using (bucket_id = 'event-images' and (select public.is_admin()));

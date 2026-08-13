-- 관리자 플래그 추가
alter table public.profiles add column is_admin boolean not null default false;

-- 업로드(insert)는 관리자만 가능하도록 정책 교체
drop policy "authenticated users can insert their own games" on public.games;

create policy "only admins can insert games"
  on public.games for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Storage 파일 업로드도 관리자만 가능하도록 정책 교체
drop policy "authenticated users can upload game files" on storage.objects;

create policy "only admins can upload game files"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'game-files'
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

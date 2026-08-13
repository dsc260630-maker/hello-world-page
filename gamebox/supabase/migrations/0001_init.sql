-- games 테이블: 업로드된 게임 메타데이터
create table public.games (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 80),
  category text not null,
  author_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  plays integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;

-- 목록 조회/재생: 누구나 가능 (비로그인 포함)
create policy "games are viewable by everyone"
  on public.games for select
  using (true);

-- 업로드: 로그인한 사용자가 본인 명의로만 등록 가능
create policy "authenticated users can insert their own games"
  on public.games for insert
  to authenticated
  with check (auth.uid() = author_id);

-- 삭제: 본인이 올린 게임만 삭제 가능
create policy "owners can delete their own games"
  on public.games for delete
  to authenticated
  using (auth.uid() = author_id);

-- plays(플레이 수) 증가: 로그인 여부와 무관하게 누구나 카운트만 올릴 수 있도록 RPC로 제공
create or replace function public.increment_plays(game_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.games set plays = plays + 1 where id = game_id;
$$;

-- 게임 HTML 파일 저장용 Storage 버킷
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-files', 'game-files', true, 5242880, array['text/html'])
on conflict (id) do nothing;

-- 파일 읽기: 누구나 가능 (재생 시 iframe에서 바로 불러옴)
create policy "public read access to game files"
  on storage.objects for select
  using (bucket_id = 'game-files');

-- 파일 업로드: 로그인한 사용자만
create policy "authenticated users can upload game files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'game-files');

-- 파일 삭제: 본인이 올린 파일만
create policy "owners can delete their own game files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'game-files' and owner = auth.uid());

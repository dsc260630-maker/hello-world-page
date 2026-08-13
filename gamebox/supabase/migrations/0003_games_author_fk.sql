-- games.author_id가 profiles(id)를 직접 참조하도록 변경
-- (PostgREST가 games ↔ profiles 관계를 인식해서 select(*, profiles(email)) 조인이 가능해집니다)
alter table public.games drop constraint games_author_id_fkey;
alter table public.games
  add constraint games_author_id_fkey
  foreign key (author_id) references public.profiles(id) on delete cascade;

-- 로그인한 사용자의 게임별 최고 점수 저장
create table public.high_scores (
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id bigint not null references public.games(id) on delete cascade,
  score integer not null,
  achieved_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

alter table public.high_scores enable row level security;

-- 본인의 최고 점수만 조회 가능 (다른 사람 점수는 볼 수 없음 — 공개 랭킹이 아니라 개인 기록)
create policy "users can view their own high scores"
  on public.high_scores for select
  to authenticated
  using (auth.uid() = user_id);

-- 기록은 submit_score() 함수(SECURITY DEFINER)를 통해서만 가능 (직접 insert/update 정책은 두지 않음)
create or replace function public.submit_score(game_id bigint, score integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id bigint := game_id;
  v_score integer := score;
begin
  if auth.uid() is null then
    return; -- 비로그인 상태에서 호출되면 조용히 무시
  end if;
  if v_score is null or v_score < 0 then
    return;
  end if;

  insert into public.high_scores (user_id, game_id, score)
  values (auth.uid(), v_game_id, v_score)
  on conflict (user_id, game_id)
  do update set score = excluded.score, achieved_at = now()
  where excluded.score > high_scores.score;
end;
$$;

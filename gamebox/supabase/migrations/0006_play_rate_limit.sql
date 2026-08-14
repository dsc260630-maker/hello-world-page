-- 같은 IP가 같은 게임에 대해 짧은 시간 내 반복 호출하면 플레이 수가 중복 반영되지 않도록
-- 최근 호출 기록을 남기는 테이블. 클라이언트는 직접 접근 불가하고 increment_plays 함수를 통해서만 기록됨.
create table public.play_events (
  game_id bigint not null references public.games(id) on delete cascade,
  ip inet not null,
  played_at timestamptz not null default now(),
  primary key (game_id, ip, played_at)
);

alter table public.play_events enable row level security;
-- 정책을 하나도 두지 않아 anon/authenticated는 직접 접근 불가 (increment_plays만 SECURITY DEFINER로 우회)

create or replace function public.increment_plays(game_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id bigint := game_id;
  raw_ip text;
  client_ip inet;
  recent_count int;
begin
  raw_ip := nullif(split_part(
    coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''),
    ',', 1
  ), '');

  begin
    client_ip := coalesce(raw_ip, '0.0.0.0')::inet;
  exception when others then
    client_ip := '0.0.0.0'::inet;
  end;

  -- 오래된 기록은 그때그때 청소 (테이블이 계속 불어나지 않도록)
  delete from public.play_events where played_at < now() - interval '1 minute';

  select count(*) into recent_count
  from public.play_events pe
  where pe.game_id = v_game_id
    and pe.ip = client_ip
    and pe.played_at > now() - interval '10 seconds';

  if recent_count = 0 then
    update public.games set plays = plays + 1 where id = v_game_id;
    insert into public.play_events (game_id, ip) values (v_game_id, client_ip);
  end if;
end;
$$;

-- submit_score()의 파라미터 이름(game_id, score)이 high_scores 테이블의
-- 컬럼 이름과 완전히 같아서, on conflict 절뿐 아니라 SQL 파싱 전반에서
-- "column reference is ambiguous" (42702) 에러가 나던 문제 수정.
-- (비로그인 상태에서는 auth.uid() is null 체크에서 먼저 리턴되어 이 줄까지
--  도달하지 않으므로, 로그인한 사용자가 점수를 낼 때만 실패가 발생했음)
-- 파라미터 이름 자체를 p_ 접두사로 바꿔 컬럼명과 절대 겹치지 않게 한다.
-- (프론트엔드 sb.rpc() 호출도 p_game_id / p_score로 함께 변경 필요 — js/app.js 참고)
-- PostgreSQL은 create or replace function으로 파라미터 "이름"을 바꿀 수 없으므로
-- (42P13: cannot change name of input parameter) 먼저 기존 함수를 지운다.
drop function if exists public.submit_score(bigint, integer);

create function public.submit_score(p_game_id bigint, p_score integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  if p_score is null or p_score < 0 then
    return;
  end if;

  insert into public.high_scores (user_id, game_id, score)
  values (auth.uid(), p_game_id, p_score)
  on conflict on constraint high_scores_pkey
  do update set score = excluded.score, achieved_at = now()
  where excluded.score > high_scores.score;
end;
$$;

notify pgrst, 'reload schema';

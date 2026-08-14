-- 닉네임(display_name) 컬럼 추가: 게임 카드에 이메일 대신 노출할 공개 이름
alter table public.profiles add column display_name text;

-- 기존 계정은 이메일 앞부분을 기본 닉네임으로 채움
update public.profiles set display_name = split_part(email, '@', 1) where display_name is null;

alter table public.profiles alter column display_name set not null;

-- 신규 가입 시에도 기본 닉네임을 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$;

-- email은 더 이상 API로 조회 가능한 컬럼이 아님 (RLS는 행 단위 제어라 컬럼 단위 제한이 별도로 필요).
-- 앱에서 "내 이메일" 표시는 어차피 Supabase Auth 세션(currentUser.email)에서 가져오므로
-- profiles.email을 API로 노출할 필요 자체가 없다.
revoke select on public.profiles from anon, authenticated;
grant select (id, display_name, is_admin, created_at) on public.profiles to anon, authenticated;

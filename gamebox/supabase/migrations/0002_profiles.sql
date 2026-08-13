-- 공개 프로필 테이블: auth.users는 직접 조회할 수 없으므로
-- 게임 카드에 "업로더" 정보를 표시하기 위한 최소 정보만 별도 테이블로 공개합니다.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- 회원가입 시 auth.users에 새 행이 생기면 자동으로 profiles에도 복사
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

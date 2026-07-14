-- Supabase の SQL Editor に貼り付けて実行してください

create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

-- メンバーの「入れる日」 slot: 'early'(早番のみ) / 'late'(遅番のみ) / 'both'(どちらでも)
create table availability (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  date date not null,
  slot text not null default 'both' check (slot in ('early','late','both')),
  unique (member_id, date)
);

-- 管理者が決める固定ルール weekday: 0=日 1=月 ... 6=土
create table fixed_rules (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  slot text not null default 'both' check (slot in ('early','late','both')),
  unique (member_id, weekday)
);

-- 確定シフト slot: 'early'(早番) / 'late'(遅番)  locked=true は手動指定(自動割当で上書きしない)
create table shifts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  slot text not null check (slot in ('early','late')),
  member_id uuid references members(id) on delete cascade,
  locked boolean not null default false,
  unique (date, slot)
);

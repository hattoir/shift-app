-- ============================================================
-- 追加機能:「入れない日」と「この曜日は入れない」ルール
-- Supabase の SQL Editor に貼り付けて Run してください。
-- 既存のデータは消えません(alter table のみ / drop table なし)。
-- 何度実行しても大丈夫です。
-- ============================================================

-- 1) 希望日に「その日は入れない」(off) を追加
alter table availability drop constraint if exists availability_slot_check;
alter table availability add constraint availability_slot_check
  check (slot in ('early','late','both','off'));

-- 2) 固定ルールに種類を追加
--    'assign' = この曜日はこの人を入れる(今までのルール)
--    'off'    = この曜日はこの人を入れない(除外ルール)
alter table fixed_rules add column if not exists kind text not null default 'assign';
alter table fixed_rules drop constraint if exists fixed_rules_kind_check;
alter table fixed_rules add constraint fixed_rules_kind_check
  check (kind in ('assign','off'));

-- 3)「この枠は空のまま固定する」を保存できるように、担当者なしを許可
alter table shifts alter column member_id drop not null;

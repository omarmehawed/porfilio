-- Phase 2: usage logging for CV parsing and a transactional apply step.
-- Additive only; 0001 tables are unchanged apart from new columns.

alter table cv_uploads
  add column model text,
  add column input_tokens int,
  add column output_tokens int,
  add column error text,
  add column notes text,
  add column applied_at timestamptz;

alter table cv_proposals
  add column created_at timestamptz default now();

create index cv_uploads_created_idx on cv_uploads (created_at desc);
create index cv_proposals_upload_idx on cv_proposals (upload_id);

-- Applies every approved proposal of one upload, or nothing.
-- Contact fields are never writable from a CV, matching the admin-only rule for links and contact info.
create or replace function apply_cv_upload(p_upload uuid)
returns integer
language plpgsql
set search_path = public
as $$
declare
  p record;
  tbl text;
  col text;
  next_order int;
  row_data jsonb;
  found_rows int;
  applied int := 0;
begin
  perform 1 from cv_uploads where id = p_upload and status in ('parsed', 'reviewed') for update;
  if not found then
    raise exception 'Upload is not ready to apply';
  end if;

  for p in
    select * from cv_proposals
    where upload_id = p_upload and decision = 'approved'
    order by created_at, id
  loop
    tbl := case p.entity
      when 'profile' then 'profile'
      when 'experience' then 'experiences'
      when 'education' then 'education'
      when 'project' then 'projects'
      when 'skill' then 'skills'
      when 'certification' then 'certifications'
      when 'course' then 'courses'
      when 'achievement' then 'achievements'
    end;
    if tbl is null then
      raise exception 'Unknown entity %', p.entity;
    end if;

    if p.action = 'add' then
      if tbl = 'profile' then
        raise exception 'The profile can only be updated';
      end if;
      execute format('select coalesce(max(sort_order), -1) + 1 from %I', tbl) into next_order;
      row_data := (p.payload - 'id' - 'sort_order')
        || jsonb_build_object('id', gen_random_uuid(), 'sort_order', next_order);
      execute format('insert into %I select * from jsonb_populate_record(null::%I, $1)', tbl, tbl)
        using row_data;
    else
      if p.target_id is null then
        raise exception 'Update proposal % has no target', p.id;
      end if;
      execute format('select count(*) from %I where id = $1', tbl) into found_rows using p.target_id;
      if found_rows = 0 then
        raise exception 'The item for proposal % no longer exists', p.id;
      end if;
      for col in
        select k from jsonb_object_keys(p.payload) as keys(k)
        where k not in ('id', 'sort_order', 'email', 'phone', 'show_phone')
          and exists (
            select 1 from information_schema.columns c
            where c.table_schema = 'public' and c.table_name = tbl and c.column_name = k
          )
      loop
        execute format(
          'update %I set %I = (jsonb_populate_record(null::%I, $1)).%I where id = $2',
          tbl, col, tbl, col
        ) using p.payload, p.target_id;
      end loop;
    end if;

    applied := applied + 1;
  end loop;

  update cv_uploads set status = 'applied', applied_at = now() where id = p_upload;
  return applied;
end;
$$;

revoke all on function apply_cv_upload(uuid) from public, anon, authenticated;
grant execute on function apply_cv_upload(uuid) to service_role;

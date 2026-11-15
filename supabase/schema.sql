-- =====================================================================
-- Fergusson Extended Universe: database schema
--
-- How to use: Supabase dashboard -> SQL Editor -> New query,
-- paste this whole file, click Run. Safe to run again after edits.
--
-- The big rule: a list owner must never see claims or suggestions
-- on their own list (managers of a profile like Jaisley's can).
-- That is enforced here with row-level security, not just in the app.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

-- One row per family member. Written only by the admin scripts.
-- Managed profiles (Jaisley) have no auth_user_id and list their
-- managers' people ids in managed_by.
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  slug text not null unique,          -- lowercase name; login email is <slug>@feu.local
  photo_url text,
  sort_order int not null default 0,
  managed_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

-- The people row of whoever is logged in (null if not logged in).
-- Defined here because the tables below use it as a column default.
create or replace function public.current_person_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from people where auth_user_id = auth.uid()
$$;

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references people (id) on delete cascade,      -- whose list it's on
  created_by uuid not null default current_person_id() references people (id) on delete cascade,
  is_suggestion boolean not null default false,                         -- secret idea from family
  type text not null check (type in ('exact', 'flexible')),
  name text not null check (length(trim(name)) > 0),
  priority smallint not null check (priority between 1 and 3),          -- 1 NEED SO BAD, 2 want, 3 nice to have
  notes text,
  links text[] not null default '{}',          -- exact: product links
  size text,                                   -- exact
  colour text,                                 -- exact
  variant text,                                -- exact
  likes text,                                  -- flexible: what I like about it
  example_links text[] not null default '{}',  -- flexible: example links or brands
  photos text[] not null default '{}',
  amazon_asin text,
  deleted_at timestamptz,                      -- soft delete (see delete_item)
  edited_at timestamptz,                       -- set automatically when content changes
  created_at timestamptz not null default now()
);
create index if not exists items_owner_idx on public.items (owner_id);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items (id) on delete cascade,
  claimer_id uuid not null default current_person_id() references people (id) on delete cascade,
  stage text not null default 'planning' check (stage in ('planning', 'bought')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (item_id, claimer_id)
);
create index if not exists claims_claimer_idx on public.claims (claimer_id);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references people (id) on delete cascade,
  item_id uuid references items (id) on delete cascade,
  message text not null,
  seen_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notices_recipient_idx on public.notices (recipient_id);

-- Clients never read this table directly (asker_id must stay secret).
-- They use the questions_public view and the question functions below.
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references people (id) on delete cascade,
  asker_id uuid references people (id) on delete set null,
  body text not null check (length(trim(body)) > 0),
  photos text[] not null default '{}',
  answer text,
  answer_photos text[] not null default '{}',
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists questions_profile_idx on public.questions (profile_id);


-- ---------------------------------------------------------------------
-- Helper functions (used by the policies so they stay readable)
-- ---------------------------------------------------------------------

-- True if I can add/edit/delete items on this list: it's mine, or I manage it.
create or replace function public.can_edit_list(list_owner uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from people p
    where p.id = list_owner
      and current_person_id() is not null
      and (p.id = current_person_id() or current_person_id() = any (p.managed_by))
  )
$$;

-- True if I can see claims and suggestions on this list (and claim from it):
-- any list except my own. Managers pass automatically for a managed profile.
create or replace function public.can_see_claims(list_owner uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_person_id() is not null and list_owner <> current_person_id()
$$;

-- True if I have a claim on this item (claimers can still see deleted items).
create or replace function public.i_claimed(target_item uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from claims
    where item_id = target_item and claimer_id = current_person_id()
  )
$$;


-- ---------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------

alter table public.people enable row level security;
alter table public.items enable row level security;
alter table public.claims enable row level security;
alter table public.notices enable row level security;
alter table public.questions enable row level security;

-- people: readable by logged-in family members, writable by nobody (scripts only)
drop policy if exists "people: family can read" on public.people;
create policy "people: family can read" on public.people
  for select to authenticated
  using (current_person_id() is not null);

-- items: read
--   * my own list: my real items only (never suggestions), not deleted
--   * anyone else's list (incl. managed profiles): everything incl. suggestions;
--     deleted items stay visible only to people who had claimed them
drop policy if exists "items: read" on public.items;
create policy "items: read" on public.items
  for select to authenticated
  using (
    (owner_id = current_person_id() and not is_suggestion and deleted_at is null)
    or (can_see_claims(owner_id) and (deleted_at is null or i_claimed(id)))
  );

-- items: add
--   * a real item on my list or a list I manage
--   * a suggestion on anyone else's list
drop policy if exists "items: add" on public.items;
create policy "items: add" on public.items
  for insert to authenticated
  with check (
    created_by = current_person_id()
    and deleted_at is null
    and (
      (not is_suggestion and can_edit_list(owner_id))
      or (is_suggestion and can_see_claims(owner_id))
    )
  );

-- items: edit (only content columns are granted, see Grants below)
--   * real items on my list or a list I manage
--   * suggestions I made
-- Deleting goes through delete_item() so claimers get a notice.
drop policy if exists "items: edit" on public.items;
create policy "items: edit" on public.items
  for update to authenticated
  using (
    deleted_at is null
    and ((not is_suggestion and can_edit_list(owner_id))
         or (is_suggestion and created_by = current_person_id()))
  )
  with check (
    deleted_at is null
    and ((not is_suggestion and can_edit_list(owner_id))
         or (is_suggestion and created_by = current_person_id()))
  );

-- claims: you only ever see, change or release your own claims.
-- Everyone else sees claim counts and stages (never who) via claim_status.
drop policy if exists "claims: read own" on public.claims;
create policy "claims: read own" on public.claims
  for select to authenticated
  using (claimer_id = current_person_id());

drop policy if exists "claims: add own" on public.claims;
create policy "claims: add own" on public.claims
  for insert to authenticated
  with check (claimer_id = current_person_id());

drop policy if exists "claims: update own" on public.claims;
create policy "claims: update own" on public.claims
  for update to authenticated
  using (claimer_id = current_person_id())
  with check (claimer_id = current_person_id());

drop policy if exists "claims: release own" on public.claims;
create policy "claims: release own" on public.claims
  for delete to authenticated
  using (claimer_id = current_person_id());

-- notices: only the recipient can read them and mark them seen
drop policy if exists "notices: recipient can read" on public.notices;
create policy "notices: recipient can read" on public.notices
  for select to authenticated
  using (recipient_id = current_person_id());

drop policy if exists "notices: recipient can mark seen" on public.notices;
create policy "notices: recipient can mark seen" on public.notices
  for update to authenticated
  using (recipient_id = current_person_id())
  with check (recipient_id = current_person_id());

-- questions: no policies on purpose = no direct access at all.


-- ---------------------------------------------------------------------
-- Triggers: claim rules, edit tracking, notices
-- ---------------------------------------------------------------------

-- Before a claim is added: no claiming your own items, no claiming deleted
-- items, and only one claim on an Exact item. Locking the item row means
-- two people tapping "I'll get this" at once are handled one at a time.
-- Error codes the app checks for:
--   FEU01 = someone already claimed this Exact item
--   FEU02 = you can't claim items on your own list
--   FEU03 = the item is no longer on the list
create or replace function public.check_claim()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  it items%rowtype;
begin
  select * into it from items where id = new.item_id for update;

  if not found or it.deleted_at is not null then
    raise exception 'This item is no longer on the list' using errcode = 'FEU03';
  end if;

  if not can_see_claims(it.owner_id) then
    raise exception 'You can''t claim items on your own list' using errcode = 'FEU02';
  end if;

  if it.type = 'exact' and exists (select 1 from claims where item_id = it.id) then
    raise exception 'Someone just claimed this' using errcode = 'FEU01';
  end if;

  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger claims_check_before_insert
  before insert on public.claims
  for each row execute function public.check_claim();

create or replace function public.touch_claim()
returns trigger
language plpgsql set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger claims_touch_before_update
  before update on public.claims
  for each row execute function public.touch_claim();

-- Set edited_at whenever an item's content changes.
create or replace function public.mark_item_edited()
returns trigger
language plpgsql set search_path = public
as $$
begin
  if (new.type, new.name, new.priority, new.notes, new.links, new.size, new.colour,
      new.variant, new.likes, new.example_links, new.photos)
     is distinct from
     (old.type, old.name, old.priority, old.notes, old.links, old.size, old.colour,
      old.variant, old.likes, old.example_links, old.photos) then
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create or replace trigger items_mark_edited_before_update
  before update on public.items
  for each row execute function public.mark_item_edited();

-- After an edit, tell everyone who claimed the item (except whoever edited it).
-- The owner never learns that anyone was notified.
create or replace function public.notify_item_edited()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  owner_name text;
  msg text;
begin
  select name into owner_name from people where id = new.owner_id;

  if new.is_suggestion then
    msg := format('The idea "%s" for %s was updated after you claimed it.', new.name, owner_name);
  else
    msg := format('%s updated "%s" after you claimed it.', owner_name, new.name);
  end if;

  insert into notices (recipient_id, item_id, message)
  select c.claimer_id, new.id, msg
  from claims c
  where c.item_id = new.id
    and c.claimer_id is distinct from current_person_id()
    -- don't pile up identical unseen notices for repeated edits
    and not exists (
      select 1 from notices n
      where n.recipient_id = c.claimer_id and n.item_id = new.id
        and n.seen_at is null and n.message = msg
    );

  return null;
end;
$$;

create or replace trigger items_notify_after_edit
  after update on public.items
  for each row
  when (new.edited_at is distinct from old.edited_at and new.deleted_at is null)
  execute function public.notify_item_edited();


-- ---------------------------------------------------------------------
-- Functions the app calls (supabase.rpc)
-- ---------------------------------------------------------------------

-- Soft-delete an item and quietly notify anyone who had claimed it.
-- Owners/managers delete real items; suggesters delete their own suggestions.
create or replace function public.delete_item(target_item uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  it items%rowtype;
  owner_name text;
  msg text;
begin
  select * into it from items where id = target_item and deleted_at is null;
  if not found then
    raise exception 'Item not found';
  end if;

  if not ((not it.is_suggestion and can_edit_list(it.owner_id))
          or (it.is_suggestion and it.created_by = current_person_id())) then
    raise exception 'Not allowed';
  end if;

  update items set deleted_at = now() where id = it.id;

  select name into owner_name from people where id = it.owner_id;
  if it.is_suggestion then
    msg := format('The idea "%s" for %s was removed. You''d already claimed it.', it.name, owner_name);
  else
    msg := format('%s removed "%s" from their list. You''d already claimed it.', owner_name, it.name);
  end if;

  insert into notices (recipient_id, item_id, message)
  select c.claimer_id, it.id, msg
  from claims c
  where c.item_id = it.id and c.claimer_id is distinct from current_person_id();
end;
$$;

-- Ask an anonymous question on someone's profile (not your own).
create or replace function public.ask_question(target_profile uuid, question text, question_photos text[] default '{}')
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  new_id uuid;
begin
  if not can_see_claims(target_profile) then
    raise exception 'You can''t ask questions on your own profile';
  end if;

  insert into questions (profile_id, asker_id, body, photos)
  values (target_profile, current_person_id(), question, coalesce(question_photos, '{}'))
  returning id into new_id;

  return new_id;
end;
$$;

-- Answer (or edit the answer to) a question. Profile owner or manager only.
-- An empty answer clears it back to "Waiting for an answer".
create or replace function public.answer_question(target_question uuid, answer_text text, new_photos text[] default '{}')
returns void
language plpgsql security definer set search_path = public
as $$
declare
  q questions%rowtype;
begin
  select * into q from questions where id = target_question and deleted_at is null;
  if not found or not can_edit_list(q.profile_id) then
    raise exception 'Not allowed';
  end if;

  if nullif(trim(answer_text), '') is null then
    update questions set answer = null, answer_photos = '{}', answered_at = null where id = q.id;
  else
    update questions set answer = answer_text, answer_photos = coalesce(new_photos, '{}'), answered_at = now()
    where id = q.id;
  end if;
end;
$$;

-- Delete a question: the profile owner/manager, or whoever asked it.
-- asker_id is only ever checked here, on the server.
create or replace function public.delete_question(target_question uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  q questions%rowtype;
begin
  select * into q from questions where id = target_question and deleted_at is null;
  if not found or not (can_edit_list(q.profile_id) or q.asker_id = current_person_id()) then
    raise exception 'Not allowed';
  end if;

  update questions set deleted_at = now() where id = q.id;
end;
$$;


-- ---------------------------------------------------------------------
-- Views
-- These run with the view owner's rights (bypassing RLS on purpose) and
-- do their own filtering, so they can expose exactly the safe columns.
-- Supabase's linter will flag them as "security definer views"; that's intended.
-- ---------------------------------------------------------------------

-- Claim counts per item, never who claimed. Hidden from list owners.
-- my_stage is the logged-in person's own stage (null if they haven't claimed).
create or replace view public.claim_status
with (security_invoker = false) as
select
  c.item_id,
  count(*)::int as claim_count,
  (count(*) filter (where c.stage = 'bought'))::int as bought_count,
  max(c.stage) filter (where c.claimer_id = current_person_id()) as my_stage
from claims c
join items i on i.id = c.item_id
where can_see_claims(i.owner_id)
group by c.item_id;

-- Questions without asker_id. asked_by_me only tells you about yourself.
create or replace view public.questions_public
with (security_invoker = false) as
select
  q.id,
  q.profile_id,
  q.body,
  q.photos,
  q.answer,
  q.answer_photos,
  q.answered_at,
  q.created_at,
  (q.asker_id = current_person_id()) as asked_by_me
from questions q
where q.deleted_at is null
  and current_person_id() is not null;

-- The login screen runs before anyone is logged in, so it needs names and
-- photos of everyone who can log in. Managed profiles are left out.
create or replace view public.login_people
with (security_invoker = false) as
select id, name, slug, photo_url, sort_order
from people
where auth_user_id is not null;


-- ---------------------------------------------------------------------
-- Grants: exactly what the app may touch. Logged-out visitors (anon)
-- get the login screen view and nothing else.
-- ---------------------------------------------------------------------

revoke all on public.people, public.items, public.claims, public.notices, public.questions
  from anon, authenticated;
revoke all on public.claim_status, public.questions_public, public.login_people
  from anon, authenticated;

grant select on public.people to authenticated;

grant select on public.items to authenticated;
grant insert (owner_id, is_suggestion, type, name, priority, notes, links, size, colour,
              variant, likes, example_links, photos, amazon_asin)
  on public.items to authenticated;
grant update (type, name, priority, notes, links, size, colour,
              variant, likes, example_links, photos, amazon_asin)
  on public.items to authenticated;

grant select, delete on public.claims to authenticated;
grant insert (item_id) on public.claims to authenticated;
grant update (stage) on public.claims to authenticated;

grant select on public.notices to authenticated;
grant update (seen_at) on public.notices to authenticated;

grant select on public.claim_status, public.questions_public to authenticated;
grant select on public.login_people to anon, authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function
  public.current_person_id(),
  public.can_edit_list(uuid),
  public.can_see_claims(uuid),
  public.i_claimed(uuid),
  public.delete_item(uuid),
  public.ask_question(uuid, text, text[]),
  public.answer_question(uuid, text, text[]),
  public.delete_question(uuid)
  to authenticated;


-- ---------------------------------------------------------------------
-- Storage: one public "photos" bucket.
-- People upload to a folder named after their own user id, e.g.
-- photos/<user id>/<random>.jpg. File names are random, so a photo can
-- only be found by someone who can already see the item it belongs to.
-- Profile photos are uploaded by the sync-family script (people/ folder).
-- ---------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos: list own folder" on storage.objects;
create policy "photos: list own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos: upload to own folder" on storage.objects;
create policy "photos: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos: delete own" on storage.objects;
create policy "photos: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

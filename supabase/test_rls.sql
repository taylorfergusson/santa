-- =====================================================================
-- Security tests for schema.sql
--
-- How to use: SQL Editor -> New query, paste this file, Run.
-- It creates throwaway test people inside a transaction, acts as each of
-- them, and rolls everything back at the end. Nothing is kept.
--
-- Success: the last result says "All tests passed".
-- Failure: it stops with an error starting with "FAIL:".
--
-- Cast:  Jenn (owner, manages Baby) · Taylor (giver) · Laura (giver)
--        Baby (managed profile, no login)
-- =====================================================================

begin;

-- ---------- Setup (as admin) ----------

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'test-jenn@feu.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'test-taylor@feu.test', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'test-laura@feu.test', 'authenticated', 'authenticated');

insert into people (id, auth_user_id, name, slug, managed_by) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000a1', 'TestJenn', 'test-jenn', '{}'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000a2', 'TestTaylor', 'test-taylor', '{}'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000a3', 'TestLaura', 'test-laura', '{}'),
  ('00000000-0000-0000-0000-0000000000b4', null, 'TestBaby', 'test-baby', '{00000000-0000-0000-0000-0000000000b1}');

-- c1 = Jenn's exact item, c2 = Jenn's flexible item, c3 = Baby's exact item
insert into items (id, owner_id, created_by, type, name, priority, links) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'exact', 'Test scarf', 1, '{https://example.com}'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-0000000000b1', 'flexible', 'Test beard oil', 2, '{}'),
  ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000b1', 'exact', 'Test rattle', 1, '{https://example.com}');


-- ---------- As Taylor (giver) ----------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

insert into claims (item_id) values ('00000000-0000-0000-0000-0000000000c1');
insert into claims (item_id) values ('00000000-0000-0000-0000-0000000000c2');
insert into claims (item_id) values ('00000000-0000-0000-0000-0000000000c3');

insert into items (owner_id, is_suggestion, type, name, priority)
values ('00000000-0000-0000-0000-0000000000b1', true, 'flexible', 'Test idea for Jenn', 2);
insert into items (owner_id, is_suggestion, type, name, priority)
values ('00000000-0000-0000-0000-0000000000b4', true, 'flexible', 'Test idea for Baby', 2);

select ask_question('00000000-0000-0000-0000-0000000000b1', 'Test question?');

do $$
declare n int;
begin
  -- Taylor can't edit Jenn's item
  update items set notes = 'hacked' where id = '00000000-0000-0000-0000-0000000000c1';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: a giver edited someone else''s item'; end if;

  -- Taylor can't put an item on Jenn's list that isn't marked as a suggestion
  begin
    insert into items (owner_id, type, name, priority)
    values ('00000000-0000-0000-0000-0000000000b1', 'flexible', 'Sneaky', 2);
    raise exception 'FAIL: a giver added a non-suggestion item to someone else''s list';
  exception when insufficient_privilege then null;
  end;

  -- Taylor can't hard-delete anything
  begin
    delete from items where id = '00000000-0000-0000-0000-0000000000c1';
    raise exception 'FAIL: a giver hard-deleted an item';
  exception when insufficient_privilege then null;
  end;

  -- Taylor can't read the questions table directly (asker_id lives there)
  begin
    perform 1 from questions;
    raise exception 'FAIL: questions table is directly readable';
  exception when insufficient_privilege then null;
  end;
end $$;


-- ---------- As Laura (giver) ----------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);

do $$
declare n int;
begin
  -- Second claim on an Exact item is blocked
  begin
    insert into claims (item_id) values ('00000000-0000-0000-0000-0000000000c1');
    raise exception 'FAIL: second claim on an Exact item was allowed';
  exception when sqlstate 'FEU01' then null;
  end;

  -- Flexible items take more than one claim
  insert into claims (item_id) values ('00000000-0000-0000-0000-0000000000c2');

  -- Laura sees that items are claimed, but never by whom
  select count(*) into n from claims where claimer_id <> '00000000-0000-0000-0000-0000000000b3';
  if n <> 0 then raise exception 'FAIL: a giver can see other people''s claims rows'; end if;

  select claim_count into n from claim_status where item_id = '00000000-0000-0000-0000-0000000000c2';
  if n <> 2 then raise exception 'FAIL: claim_status should show 2 claims on the flexible item, got %', n; end if;

  -- Laura sees suggestions on Jenn's list
  select count(*) into n from items
  where owner_id = '00000000-0000-0000-0000-0000000000b1' and is_suggestion;
  if n <> 1 then raise exception 'FAIL: givers should see suggestions, got %', n; end if;

  -- Laura can't fake a claim as Taylor
  begin
    insert into claims (item_id, claimer_id)
    values ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000b2');
    raise exception 'FAIL: claimed as someone else';
  exception when insufficient_privilege then null;
  end;
end $$;


-- ---------- As Jenn (owner of her list, manager of Baby's) ----------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

do $$
declare n int; qid uuid;
begin
  -- THE BIG ONE: Jenn sees no claims or suggestions on her own list
  select count(*) into n from claims
  where item_id in ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2');
  if n <> 0 then raise exception 'FAIL: owner can see claims on own items (claims table)'; end if;

  select count(*) into n from claim_status
  where item_id in ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000c2');
  if n <> 0 then raise exception 'FAIL: owner can see claims on own items (claim_status)'; end if;

  select count(*) into n from items
  where owner_id = '00000000-0000-0000-0000-0000000000b1' and is_suggestion;
  if n <> 0 then raise exception 'FAIL: owner can see suggestions on own list'; end if;

  select count(*) into n from items where owner_id = '00000000-0000-0000-0000-0000000000b1';
  if n <> 2 then raise exception 'FAIL: owner should see their own 2 items, got %', n; end if;

  -- Jenn can't claim her own item
  begin
    insert into claims (item_id) values ('00000000-0000-0000-0000-0000000000c2');
    raise exception 'FAIL: owner claimed own item';
  exception when sqlstate 'FEU02' then null;
  end;

  -- As Baby's manager, Jenn DOES see claims and suggestions on Baby's list
  select count(*) into n from claim_status where item_id = '00000000-0000-0000-0000-0000000000c3';
  if n <> 1 then raise exception 'FAIL: manager can''t see claims on managed profile'; end if;

  select count(*) into n from items
  where owner_id = '00000000-0000-0000-0000-0000000000b4' and is_suggestion;
  if n <> 1 then raise exception 'FAIL: manager can''t see suggestions on managed profile'; end if;

  -- ...and can edit Baby's items and add new ones
  update items set notes = 'Teething-safe please' where id = '00000000-0000-0000-0000-0000000000c3';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: manager can''t edit managed profile item'; end if;

  insert into items (owner_id, type, name, priority)
  values ('00000000-0000-0000-0000-0000000000b4', 'flexible', 'Test board books', 3);

  -- Jenn can't ask a question on her own profile
  begin
    perform ask_question('00000000-0000-0000-0000-0000000000b1', 'Talking to myself?');
    raise exception 'FAIL: owner asked a question on own profile';
  exception when raise_exception then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  -- Jenn sees the question (without who asked) and answers it
  select id into qid from questions_public
  where profile_id = '00000000-0000-0000-0000-0000000000b1' and body = 'Test question?';
  if qid is null then raise exception 'FAIL: owner can''t see question on own profile'; end if;
  perform answer_question(qid, 'Grey, please');

  -- Jenn edits a claimed item, then deletes another claimed item
  update items set notes = 'Size M' where id = '00000000-0000-0000-0000-0000000000c1';
  perform delete_item('00000000-0000-0000-0000-0000000000c2');

  select count(*) into n from items where id = '00000000-0000-0000-0000-0000000000c2';
  if n <> 0 then raise exception 'FAIL: owner still sees deleted item'; end if;

  -- Jenn gets no hint that anyone was notified
  select count(*) into n from notices;
  if n <> 0 then raise exception 'FAIL: owner can see notices meant for others'; end if;
end $$;


-- ---------- Back as Taylor: notices and deleted items ----------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);

do $$
declare n int; qid uuid;
begin
  -- Jenn edited the scarf, deleted the beard oil, and edited Baby's rattle
  select count(*) into n from notices;
  if n <> 3 then raise exception 'FAIL: claimer should have 3 notices (2 edits, 1 delete), got %', n; end if;

  -- Claimer can still see the deleted item; it's marked deleted
  select count(*) into n from items
  where id = '00000000-0000-0000-0000-0000000000c2' and deleted_at is not null;
  if n <> 1 then raise exception 'FAIL: claimer can''t see the item that was removed'; end if;

  -- The answer is visible to givers
  select id into qid from questions_public where body = 'Test question?' and answer = 'Grey, please';
  if qid is null then raise exception 'FAIL: giver can''t see the answer'; end if;

  -- Taylor (the asker) can delete their own question
  perform delete_question(qid);
  select count(*) into n from questions_public where id = qid;
  if n <> 0 then raise exception 'FAIL: asker couldn''t delete own question'; end if;
end $$;


-- ---------- As Laura: one notice (the delete), none for the edit ----------

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a3","role":"authenticated"}', true);

do $$
declare n int;
begin
  select count(*) into n from notices;
  if n <> 1 then raise exception 'FAIL: Laura should have 1 notice, got %', n; end if;
end $$;


-- ---------- Logged out (anon) ----------

reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$
declare n int;
begin
  -- Login screen shows people who can log in, but not managed profiles
  select count(*) into n from login_people where slug in ('test-jenn', 'test-taylor', 'test-laura');
  if n <> 3 then raise exception 'FAIL: login screen should list 3 test people, got %', n; end if;

  select count(*) into n from login_people where slug = 'test-baby';
  if n <> 0 then raise exception 'FAIL: managed profile shows on the login screen'; end if;

  begin
    perform 1 from items;
    raise exception 'FAIL: logged-out visitors can read items';
  exception when insufficient_privilege then null;
  end;

  begin
    perform 1 from people;
    raise exception 'FAIL: logged-out visitors can read people';
  exception when insufficient_privilege then null;
  end;
end $$;


reset role;
select 'All tests passed' as result;

rollback;

-- Testrondes in de testomgeving: elke plaat hoort bij een ronde, zodat een nieuwe
-- test de resultaten van eerdere rondes niet overschrijft of vermengt.
-- Bestaande platen horen bij ronde 1. Eenmalig uitvoeren in Supabase → SQL Editor → Run.

alter table public.test_platen add column if not exists ronde integer not null default 1;
alter table public.test_platen add column if not exists kwaliteit text;

create index if not exists test_platen_ronde on public.test_platen (ronde, foto_id);

-- Titel per foto (links boven het verhaaltje in het boek).
-- Eenmalig uitvoeren in Supabase → SQL Editor.
alter table public.pages add column if not exists titel text;

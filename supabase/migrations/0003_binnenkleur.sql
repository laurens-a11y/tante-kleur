-- Kleur van de verhaalpagina's (links in het boek) en of een order echt is
-- (live betaling) of een test. Eenmalig uitvoeren in Supabase → SQL Editor.
alter table public.orders add column if not exists binnen_kleur text;
alter table public.orders add column if not exists livemode boolean not null default false;

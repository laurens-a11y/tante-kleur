-- Coverfoto: de klant kiest welke foto de cover wordt; Tante kan in beheer de
-- uitsnede bijstellen. Eenmalig uitvoeren in Supabase → SQL Editor → Run.
--
-- cover_page_id:  pagina waarvan de tekenplaat op de cover komt (leeg = eerste pagina).
--                 Wordt de pagina verwijderd, dan valt het terug op de eerste.
-- cover_uitsnede: {"x": 0..1, "y": 0..1, "zoom": 1..3}; x/y = welk deel zichtbaar is
--                 (0 = links/boven, 0.5 = midden, 1 = rechts/onder). Leeg = midden, zoom 1.
alter table public.orders
  add column if not exists cover_page_id uuid references public.pages (id) on delete set null;
alter table public.orders
  add column if not exists cover_uitsnede jsonb;

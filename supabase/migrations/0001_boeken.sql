-- Tante Kleur: orders en boekpagina's.
-- Eenmalig uitvoeren in Supabase → SQL Editor → Run.
--
-- Beveiliging: Row Level Security staat aan zonder policies. Daardoor kan
-- alleen de server (met de secret key) bij deze tabellen en buckets; de
-- publishable/anon key ziet niets. Klanten komen er alleen bij via de site,
-- die eerst hun persoonlijke code controleert.

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Onraadbare code in de link /boek/<code>. Wie de link heeft, kan het boek bewerken.
  code text not null unique,
  stripe_session_id text not null unique,
  email text,
  naam text,
  verzendadres jsonb,

  -- betaald      = klant vult het boek in
  -- ingediend    = klant is klaar, boek staat op slot
  -- in_productie = Tante maakt de tekenplaten
  -- proef_klaar  = proef staat klaar voor de klant
  -- akkoord      = klant heeft de proef goedgekeurd
  -- gedrukt / verzonden
  status text not null default 'betaald'
    check (status in ('betaald', 'ingediend', 'in_productie', 'proef_klaar', 'akkoord', 'gedrukt', 'verzonden')),

  cover_titel text,
  cover_kleur text,

  -- Definitieve tekst (gaat in het boek) en de laatste eigen tekst van de klant
  -- vóórdat een AI-voorstel werd overgenomen (handig bij vragen of klachten).
  inleiding text,
  inleiding_eigen text,
  nawoord text,
  nawoord_eigen text,

  ai_aanroepen integer not null default 0,
  herinneringen integer not null default 0,

  ingediend_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Volgorde in het boek (1 = eerste spread). Geen unique-constraint, zodat
  -- verwisselen in één stap kan; de site houdt de nummering netjes.
  positie integer not null,

  -- Originele foto van de klant (bucket "fotos") en een kleine versie voor het scherm.
  foto_pad text,
  foto_klein_pad text,
  -- Draaiing in graden; wordt pas bij productie toegepast, het origineel blijft intact.
  draaiing integer not null default 0 check (draaiing in (0, 90, 180, 270)),

  -- Verhaal op de linkerpagina (mag leeg).
  verhaal text,
  verhaal_eigen text,

  -- Bewerkte versie: de tekenplaat (bucket "tekenplaten"), gevuld door Tante.
  tekenplaat_pad text,

  -- Opmerking van de klant bij de proef.
  opmerking text,

  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

create index if not exists pages_order_positie on public.pages (order_id, positie);

-- bijgewerkt_op automatisch bijhouden
create or replace function public.zet_bijgewerkt_op() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

drop trigger if exists orders_bijgewerkt on public.orders;
create trigger orders_bijgewerkt before update on public.orders
  for each row execute function public.zet_bijgewerkt_op();

drop trigger if exists pages_bijgewerkt on public.pages;
create trigger pages_bijgewerkt before update on public.pages
  for each row execute function public.zet_bijgewerkt_op();

-- Alleen de server mag erbij.
alter table public.orders enable row level security;
alter table public.pages enable row level security;
revoke all on public.orders from anon, authenticated;
revoke all on public.pages from anon, authenticated;

-- Opslag: twee privé-buckets. Max 8 MB per bestand, alleen afbeeldingen.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fotos', 'fotos', false, 8388608, array['image/jpeg']),
  ('tekenplaten', 'tekenplaten', false, 26214400, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Testomgeving voor tekenplaten (/beheer/test): losse testfoto's en de platen
-- die verschillende tekenconfiguraties ervan maken. Staat los van de bestellingen.
-- Eenmalig uitvoeren in Supabase → SQL Editor → Run.

create table if not exists public.test_fotos (
  id uuid primary key default gen_random_uuid(),
  naam text,
  -- Foto (bucket "testen"): het origineel en een schermversie van ±1400 px.
  foto_pad text not null,
  scherm_pad text not null,
  -- Uitkomst van de analysestap; de briefing is in beheer aan te passen.
  geschikt boolean,
  reden text,
  briefing text,
  -- Handmatig in ChatGPT gemaakte plaat, als vergelijking.
  chatgpt_pad text,
  chatgpt_score text check (chatgpt_score in ('goed', 'fout')),
  chatgpt_notitie text,
  aangemaakt_op timestamptz not null default now()
);

create table if not exists public.test_platen (
  id uuid primary key default gen_random_uuid(),
  foto_id uuid not null references public.test_fotos (id) on delete cascade,
  config text not null,
  model text not null,
  actie text not null,
  -- De briefing zoals die op dat moment werd gebruikt, en wat het beeldmodel echt kreeg.
  briefing text not null,
  revised_prompt text,
  plaat_pad text not null,
  duur_ms integer,
  usage jsonb,
  score text check (score in ('goed', 'fout')),
  notitie text,
  aangemaakt_op timestamptz not null default now()
);

create index if not exists test_platen_foto on public.test_platen (foto_id, aangemaakt_op);

-- Alleen de server mag erbij.
alter table public.test_fotos enable row level security;
alter table public.test_platen enable row level security;
revoke all on public.test_fotos from anon, authenticated;
revoke all on public.test_platen from anon, authenticated;

-- Privé-bucket voor testfoto's en testplaten. Max 25 MB per bestand, alleen afbeeldingen.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('testen', 'testen', false, 26214400, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

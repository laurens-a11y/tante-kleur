-- Telt per pagina hoe vaak er een tekenplaat is gegenereerd.
-- Daarmee meet je de keep-rate: pogingen per bruikbare plaat.
alter table public.pages add column if not exists generaties integer not null default 0;
